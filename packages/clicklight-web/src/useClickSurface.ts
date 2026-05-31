import { useLayoutEffect, useMemo, useRef, useState } from "react"
import type React from "react"
import {
	LASER_CURSOR_FADE_MS,
	LASER_MIN_POINT_DISTANCE,
	LASER_STROKE_FADE_MS,
	SHORTCUT_FADE_MS,
	SHORTCUT_VISIBLE_MS,
	displayKey,
} from "./constants"
import { profiles, themePalettes } from "./themes"
import type { ClickKind, ClickSurfaceRef, DemoSettings, Pulse, Stroke, ThemePalette, TrailPoint } from "./types"

/**
 * Return type of `useClickSurface`, containing all state and handlers needed
 * to render the click-visualization overlay.
 *
 * @example
 * ```tsx
 * const { settings, pulses, surfaceRef, pointerHandlers } = useClickSurface({});
 * return <div ref={surfaceRef} {...pointerHandlers}>{pulses.map(...)}</div>;
 * ```
 * ### Use Cases:
 * - Consumed directly by `<ClickSurface>` for headless rendering
 * - Can be used standalone when a custom wrapper element is preferred
 */
export type UseClickSurfaceResult = {
	/** Current resolved settings (feature toggles + sizing + theme). */
	settings: DemoSettings
	/** Current colour palette derived from `settings.theme`. */
	palette: ThemePalette
	/** In-flight pulse overlays to render. */
	pulses: Pulse[]
	/** The stroke being actively drawn (pointer held down with laser enabled). */
	activeStroke: Stroke | null
	/** Completed strokes that are fading out. */
	fadingStrokes: Stroke[]
	/** Current laser cursor position, or `null` when hidden. */
	laserCursor: TrailPoint | null
	/** Whether the laser cursor is in its CSS fade-out phase. */
	laserCursorFading: boolean
	/** The keyboard shortcut label currently displayed, or `null`. */
	shortcut: string | null
	/** Whether the shortcut label is in its CSS fade-out phase. */
	shortcutFading: boolean
	/** Ref to attach to the wrapper element for bounding-rect calculations. */
	surfaceRef: React.RefObject<HTMLDivElement | null>
	/** All pointer and keyboard event handlers to spread onto the wrapper element. */
	pointerHandlers: {
		onPointerDown: React.PointerEventHandler<HTMLDivElement>
		onPointerMove: React.PointerEventHandler<HTMLDivElement>
		onPointerUp: React.PointerEventHandler<HTMLDivElement>
		onPointerCancel: React.PointerEventHandler<HTMLDivElement>
		onPointerLeave: React.PointerEventHandler<HTMLDivElement>
		onKeyDown: React.KeyboardEventHandler<HTMLDivElement>
	}
	/**
	 * Merges a partial settings update into the internal state.
	 * Safe to call via `ClickSurfaceRef.applySettings`.
	 */
	applySettings: ClickSurfaceRef["applySettings"]
}

/**
 * Custom hook that encapsulates all click-visualization logic for `<ClickSurface>`.
 *
 * Manages pulse animations, laser-pointer strokes, laser cursor, and keyboard
 * shortcut display. Returns all state and event handlers needed to render the
 * overlay without coupling to any specific DOM structure.
 *
 * @param params - Configuration object.
 * @param params.defaultSettings - Optional partial settings to merge on top of the
 *   `"Default"` profile. Applied once on mount; subsequent changes via
 *   `applySettings` or the returned `settings` setter drive re-renders.
 *
 * @returns All state, palette, event handlers, and an `applySettings` imperative
 *   callback ready to be forwarded through `useImperativeHandle`.
 *
 * @example
 * ```tsx
 * function MyOverlay() {
 *   const { settings, pulses, surfaceRef, pointerHandlers, palette } =
 *     useClickSurface({ defaultSettings: { theme: "red", laser: true } });
 *
 *   return (
 *     <div ref={surfaceRef} style={{ "--laser-main": palette.laserMain } as React.CSSProperties}
 *          {...pointerHandlers}>
 *       {pulses.map(p => <span key={p.id} style={{ left: p.x, top: p.y }} />)}
 *     </div>
 *   );
 * }
 * ```
 * ### Use Cases:
 * - Consumed by `<ClickSurface>` for its standard rendering
 * - Used standalone when the caller controls the wrapper element's shape
 */
export function useClickSurface({
	defaultSettings,
}: {
	defaultSettings?: Partial<DemoSettings>
}): UseClickSurfaceResult {
	const [settings, setSettings] = useState<DemoSettings>(() => ({
		...profiles.Default,
		...defaultSettings,
	}))

	const [pulses, setPulses] = useState<Pulse[]>([])
	const [activeStroke, setActiveStroke] = useState<Stroke | null>(null)
	const [fadingStrokes, setFadingStrokes] = useState<Stroke[]>([])
	const [laserCursor, setLaserCursor] = useState<TrailPoint | null>(null)
	const [laserCursorFading, setLaserCursorFading] = useState(false)
	const [shortcut, setShortcut] = useState<string | null>(null)
	const [shortcutFading, setShortcutFading] = useState(false)

	const animationIdRef = useRef(0)
	const surfaceRef = useRef<HTMLDivElement | null>(null)
	const pointerDownRef = useRef(false)
	const downPointRef = useRef<TrailPoint | null>(null)
	const lastDragPointRef = useRef<TrailPoint | null>(null)
	const hasDraggedRef = useRef(false)
	const pressedKindRef = useRef<ClickKind>("press")
	const shortcutFadeTimeoutRef = useRef<number | null>(null)
	const shortcutRemoveTimeoutRef = useRef<number | null>(null)
	const cursorFadeTimeoutRef = useRef<number | null>(null)
	const cursorRemoveTimeoutRef = useRef<number | null>(null)

	// Keep a ref in sync so handlers always read current settings without
	// needing to be memoized (avoids stale closures if caller ever wraps in
	// useCallback at the component level).
	const settingsRef = useRef(settings)
	useLayoutEffect(() => {
		settingsRef.current = settings
	})

	const palette = useMemo(() => themePalettes[settings.theme], [settings.theme])

	function pointFromEvent(event: React.PointerEvent<HTMLDivElement>) {
		const rect = surfaceRef.current?.getBoundingClientRect()
		if (!rect) return null
		return { x: event.clientX - rect.left, y: event.clientY - rect.top }
	}

	function addPulse(event: React.PointerEvent<HTMLDivElement>, kind: ClickKind) {
		const point = pointFromEvent(event)
		if (!point) return
		const pulse: Pulse = { id: animationIdRef.current++, kind, ...point }
		setPulses((current) => {
			if (current.some((p) => p.id === pulse.id)) return current
			return [...current.slice(-12), pulse]
		})
		globalThis.setTimeout(() => {
			setPulses((current) => current.filter((item) => item.id !== pulse.id))
		}, 900)
	}

	function clearCursorTimers() {
		if (cursorFadeTimeoutRef.current) {
			globalThis.clearTimeout(cursorFadeTimeoutRef.current)
			cursorFadeTimeoutRef.current = null
		}
		if (cursorRemoveTimeoutRef.current) {
			globalThis.clearTimeout(cursorRemoveTimeoutRef.current)
			cursorRemoveTimeoutRef.current = null
		}
	}

	function bumpLaserCursor(point: TrailPoint) {
		clearCursorTimers()
		setLaserCursor(point)
		setLaserCursorFading(false)
		cursorFadeTimeoutRef.current = globalThis.setTimeout(() => {
			setLaserCursorFading(true)
			cursorRemoveTimeoutRef.current = globalThis.setTimeout(() => {
				setLaserCursor(null)
				setLaserCursorFading(false)
			}, LASER_CURSOR_FADE_MS)
		}, 16)
	}

	function clearLaserVisuals() {
		clearCursorTimers()
		setLaserCursor(null)
		setLaserCursorFading(false)
		setActiveStroke(null)
		setFadingStrokes([])
	}

	function clearShortcut() {
		if (shortcutFadeTimeoutRef.current) {
			globalThis.clearTimeout(shortcutFadeTimeoutRef.current)
			shortcutFadeTimeoutRef.current = null
		}
		if (shortcutRemoveTimeoutRef.current) {
			globalThis.clearTimeout(shortcutRemoveTimeoutRef.current)
			shortcutRemoveTimeoutRef.current = null
		}
		setShortcut(null)
		setShortcutFading(false)
	}

	function resetPointerState() {
		pointerDownRef.current = false
		downPointRef.current = null
		lastDragPointRef.current = null
		hasDraggedRef.current = false
	}

	function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
		event.currentTarget.setPointerCapture(event.pointerId)
		pointerDownRef.current = true
		const downPoint = pointFromEvent(event)
		downPointRef.current = downPoint ? { id: animationIdRef.current++, ...downPoint } : null
		lastDragPointRef.current = downPointRef.current
		hasDraggedRef.current = false

		const current = settingsRef.current

		if (event.button === 2 && current.right) {
			pressedKindRef.current = "right"
			addPulse(event, "right")
			return
		}
		if (event.button === 1 && current.middle) {
			pressedKindRef.current = "middle"
			addPulse(event, "middle")
			return
		}
		pressedKindRef.current = "press"
		if (current.press) addPulse(event, "press")
	}

	function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
		const point = pointFromEvent(event)
		if (!point) return
		const nextPoint: TrailPoint = { id: animationIdRef.current++, ...point }
		const downPoint = downPointRef.current
		const current = settingsRef.current

		if (pointerDownRef.current && downPoint) {
			const distance = Math.hypot(point.x - downPoint.x, point.y - downPoint.y)
			if (distance > 4) hasDraggedRef.current = true
		}

		const lastDragPoint = lastDragPointRef.current
		if (pointerDownRef.current && hasDraggedRef.current && current.drag && lastDragPoint) {
			const dragDistance = Math.hypot(point.x - lastDragPoint.x, point.y - lastDragPoint.y)
			if (!current.laser && dragDistance > 18) {
				addPulse(event, "drag")
				lastDragPointRef.current = nextPoint
			} else if (current.laser && dragDistance > 8) {
				lastDragPointRef.current = nextPoint
			}
		}

		if (!current.laser) return
		bumpLaserCursor(nextPoint)

		if (pointerDownRef.current) {
			setActiveStroke((stroke) => {
				if (!stroke) {
					return { id: animationIdRef.current++, points: [nextPoint, nextPoint] }
				}
				const last = stroke.points[stroke.points.length - 1]
				if (Math.hypot(last.x - nextPoint.x, last.y - nextPoint.y) < LASER_MIN_POINT_DISTANCE) {
					return stroke
				}
				return { ...stroke, points: [...stroke.points, nextPoint] }
			})
		}
	}

	function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
		const current = settingsRef.current
		if (hasDraggedRef.current && current.drag) addPulse(event, "drag")
		if (current.release) {
			if (pressedKindRef.current === "right") addPulse(event, "rightRelease")
			else if (pressedKindRef.current === "middle") addPulse(event, "middleRelease")
			else addPulse(event, "release")
		}

		setActiveStroke((stroke) => {
			if (stroke && stroke.points.length >= 2) {
				setFadingStrokes((strokes) => {
					if (strokes.some((s) => s.id === stroke.id)) return strokes
					return [...strokes, stroke]
				})
				globalThis.setTimeout(() => {
					setFadingStrokes((strokes) => strokes.filter((item) => item.id !== stroke.id))
				}, LASER_STROKE_FADE_MS)
			}
			return null
		})

		resetPointerState()
	}

	function handlePointerLeave() {
		if (pointerDownRef.current) return
		clearCursorTimers()
		setLaserCursorFading(true)
		cursorRemoveTimeoutRef.current = globalThis.setTimeout(() => {
			setLaserCursor(null)
			setLaserCursorFading(false)
		}, LASER_CURSOR_FADE_MS)
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		const current = settingsRef.current
		if (!current.keys || event.repeat) return
		// Mirrors Swift HotKeyBinding: require at least one non-shift modifier.
		if (!event.metaKey && !event.ctrlKey && !event.altKey) return

		const keyString = displayKey({ event: event.nativeEvent })
		if (!keyString) return

		// Prevent browser-reserved combos from interrupting the overlay.
		event.preventDefault()

		let modifiers = ""
		if (event.ctrlKey) modifiers += "⌃"
		if (event.altKey) modifiers += "⌥"
		if (event.shiftKey) modifiers += "⇧"
		if (event.metaKey) modifiers += "⌘"

		setShortcut(modifiers + keyString)
		setShortcutFading(false)
		if (shortcutFadeTimeoutRef.current) globalThis.clearTimeout(shortcutFadeTimeoutRef.current)
		if (shortcutRemoveTimeoutRef.current) globalThis.clearTimeout(shortcutRemoveTimeoutRef.current)
		shortcutFadeTimeoutRef.current = globalThis.setTimeout(() => {
			setShortcutFading(true)
			shortcutRemoveTimeoutRef.current = globalThis.setTimeout(() => {
				setShortcut(null)
				setShortcutFading(false)
			}, SHORTCUT_FADE_MS)
		}, SHORTCUT_VISIBLE_MS)
	}

	function applySettings(partial: Partial<DemoSettings>) {
		setSettings((current) => {
			const next = { ...current, ...partial }
			if ("laser" in partial && !next.laser) {
				clearLaserVisuals()
			}
			if ("keys" in partial && !next.keys) {
				clearShortcut()
			}
			return next
		})
	}

	return {
		settings,
		palette,
		pulses,
		activeStroke,
		fadingStrokes,
		laserCursor,
		laserCursorFading,
		shortcut,
		shortcutFading,
		surfaceRef,
		pointerHandlers: {
			onPointerDown: handlePointerDown,
			onPointerMove: handlePointerMove,
			onPointerUp: handlePointerUp,
			onPointerCancel: resetPointerState,
			onPointerLeave: handlePointerLeave,
			onKeyDown: handleKeyDown,
		},
		applySettings,
	}
}
