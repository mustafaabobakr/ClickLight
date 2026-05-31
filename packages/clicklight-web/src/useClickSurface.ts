import { useLayoutEffect, useRef } from "react"
import type React from "react"
import { displayKey } from "./constants"
import { useLaserCursor } from "./hooks/useLaserCursor"
import { useLaserStroke } from "./hooks/useLaserStroke"
import { usePulses } from "./hooks/usePulses"
import { useSettings } from "./hooks/useSettings"
import { useShortcut } from "./hooks/useShortcut"
import type { ClickKind, ClickSurfaceRef, DemoSettings, Pulse, Stroke, ThemePalette, TrailPoint } from "./types"
import { pointFromEvent } from "./utils/pointer"

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
	// ── Sub-hooks ─────────────────────────────────────────────────────────────
	const { settings, setSettings, palette } = useSettings({ defaultSettings })
	const animationIdRef = useRef(0)
	const { pulses, addPulse } = usePulses({ idRef: animationIdRef })
	const { laserCursor, laserCursorFading, bumpLaserCursor, clearLaserCursor, fadeLaserCursor } = useLaserCursor()
	const { activeStroke, fadingStrokes, extendStroke, finalizeStroke, clearStrokes } = useLaserStroke({
		idRef: animationIdRef,
	})
	const { shortcut, shortcutFading, showShortcut, clearShortcut } = useShortcut()

	// ── Shared surface ref ────────────────────────────────────────────────────
	const surfaceRef = useRef<HTMLDivElement | null>(null)

	// ── Pointer-tracking refs ─────────────────────────────────────────────────
	const pointerDownRef = useRef(false)
	const downPointRef = useRef<TrailPoint | null>(null)
	const lastDragPointRef = useRef<TrailPoint | null>(null)
	const hasDraggedRef = useRef(false)
	const pressedKindRef = useRef<ClickKind>("press")

	// Keep a ref in sync so handlers always read current settings without
	// needing to be memoized (avoids stale closures if caller ever wraps in
	// useCallback at the component level).
	const settingsRef = useRef(settings)
	useLayoutEffect(() => {
		settingsRef.current = settings
	})

	// ── Orchestration helpers ─────────────────────────────────────────────────
	function clearLaserVisuals() {
		clearLaserCursor()
		clearStrokes()
	}

	function resetPointerState() {
		pointerDownRef.current = false
		downPointRef.current = null
		lastDragPointRef.current = null
		hasDraggedRef.current = false
	}

	// ── Pointer handlers ──────────────────────────────────────────────────────
	function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
		event.currentTarget.setPointerCapture(event.pointerId)
		pointerDownRef.current = true
		const downPoint = pointFromEvent(event, surfaceRef)
		downPointRef.current = downPoint ? { id: animationIdRef.current++, ...downPoint } : null
		lastDragPointRef.current = downPointRef.current
		hasDraggedRef.current = false

		const current = settingsRef.current

		if (event.button === 2 && current.right) {
			pressedKindRef.current = "right"
			if (downPoint) addPulse({ ...downPoint, kind: "right" })
			return
		}
		if (event.button === 1 && current.middle) {
			pressedKindRef.current = "middle"
			if (downPoint) addPulse({ ...downPoint, kind: "middle" })
			return
		}
		pressedKindRef.current = "press"
		if (current.press && downPoint) addPulse({ ...downPoint, kind: "press" })
	}

	function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
		const point = pointFromEvent(event, surfaceRef)
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
				addPulse({ ...point, kind: "drag" })
				lastDragPointRef.current = nextPoint
			} else if (current.laser && dragDistance > 8) {
				lastDragPointRef.current = nextPoint
			}
		}

		if (!current.laser) return
		bumpLaserCursor(nextPoint)

		if (pointerDownRef.current) {
			extendStroke(nextPoint)
		}
	}

	function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
		const point = pointFromEvent(event, surfaceRef)
		const current = settingsRef.current

		if (hasDraggedRef.current && current.drag && point) addPulse({ ...point, kind: "drag" })
		if (current.release) {
			if (pressedKindRef.current === "right" && point) addPulse({ ...point, kind: "rightRelease" })
			else if (pressedKindRef.current === "middle" && point) addPulse({ ...point, kind: "middleRelease" })
			else if (point) addPulse({ ...point, kind: "release" })
		}

		finalizeStroke()
		resetPointerState()
	}

	function handlePointerLeave() {
		if (pointerDownRef.current) return
		fadeLaserCursor()
	}

	// ── Keyboard handler ──────────────────────────────────────────────────────
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

		showShortcut(modifiers + keyString)
	}

	// ── Public applySettings (cross-cutting: calls into multiple hooks) ────────
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
