import { useRef, useState } from "react"
import { LASER_CURSOR_FADE_MS } from "../constants"
import type { TrailPoint } from "../types"

/**
 * Return type of `useLaserCursor`.
 *
 * @example
 * ```ts
 * const { laserCursor, bumpLaserCursor } = useLaserCursor()
 * ```
 * ### Use Cases:
 * - Consumed by `useClickSurface` to position and animate the laser cursor dot
 */
export type UseLaserCursorResult = {
	/** Current laser cursor position, or `null` when hidden. */
	laserCursor: TrailPoint | null
	/** Whether the laser cursor is in its CSS fade-out phase. */
	laserCursorFading: boolean
	/**
	 * Moves the laser cursor to `point`, resetting any in-progress fade.
	 * Automatically starts a fade-out after a short idle delay.
	 */
	bumpLaserCursor: (point: TrailPoint) => void
	/** Immediately hides the laser cursor and cancels any pending fade timers. */
	clearLaserCursor: () => void
	/**
	 * Starts the fade-out sequence for the laser cursor (used on pointer leave).
	 * The cursor becomes fully hidden after `LASER_CURSOR_FADE_MS`.
	 */
	fadeLaserCursor: () => void
}

/**
 * Manages laser cursor position, visibility, and fade-out timing.
 *
 * Exposes three imperative functions — `bumpLaserCursor`, `clearLaserCursor`,
 * and `fadeLaserCursor` — that are called by the pointer handlers in the
 * `useClickSurface` orchestrator.
 *
 * @example
 * ```ts
 * const { laserCursor, laserCursorFading, bumpLaserCursor } = useLaserCursor()
 * // on pointer move:
 * bumpLaserCursor({ id: nextId(), x, y })
 * ```
 * ### Use Cases:
 * - Consumed by `useClickSurface` to drive the moving laser cursor dot overlay
 */
export function useLaserCursor(): UseLaserCursorResult {
	const [laserCursor, setLaserCursor] = useState<TrailPoint | null>(null)
	const [laserCursorFading, setLaserCursorFading] = useState(false)
	const cursorFadeTimeoutRef = useRef<number | null>(null)
	const cursorRemoveTimeoutRef = useRef<number | null>(null)

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

	function clearLaserCursor() {
		clearCursorTimers()
		setLaserCursor(null)
		setLaserCursorFading(false)
	}

	function fadeLaserCursor() {
		clearCursorTimers()
		setLaserCursorFading(true)
		cursorRemoveTimeoutRef.current = globalThis.setTimeout(() => {
			setLaserCursor(null)
			setLaserCursorFading(false)
		}, LASER_CURSOR_FADE_MS)
	}

	return { laserCursor, laserCursorFading, bumpLaserCursor, clearLaserCursor, fadeLaserCursor }
}
