import { useState } from "react"
import type { RefObject } from "react"
import { LASER_MIN_POINT_DISTANCE, LASER_STROKE_FADE_MS } from "../constants"
import type { Stroke, TrailPoint } from "../types"

/**
 * Return type of `useLaserStroke`.
 *
 * @example
 * ```ts
 * const { activeStroke, fadingStrokes, extendStroke } = useLaserStroke({ idRef })
 * ```
 * ### Use Cases:
 * - Consumed by `useClickSurface` to render the active and fading laser stroke paths
 */
export type UseLaserStrokeResult = {
	/** The stroke being actively drawn (pointer held down with laser enabled). */
	activeStroke: Stroke | null
	/** Completed strokes that are fading out. */
	fadingStrokes: Stroke[]
	/**
	 * Appends `point` to the active stroke, or starts a new stroke if none exists.
	 * Points closer than `LASER_MIN_POINT_DISTANCE` to the last point are skipped.
	 */
	extendStroke: (point: TrailPoint) => void
	/**
	 * Moves the active stroke into `fadingStrokes` and schedules its removal
	 * after `LASER_STROKE_FADE_MS`. Resets `activeStroke` to `null`.
	 */
	finalizeStroke: () => void
	/** Immediately discards both the active stroke and all fading strokes. */
	clearStrokes: () => void
}

/**
 * Manages laser stroke state: the active stroke being drawn and completed strokes fading out.
 *
 * Uses `idRef` to assign globally unique IDs to new strokes so they remain
 * distinct from pulse and trail-point IDs.
 *
 * @param params - Configuration object.
 * @param params.idRef - Shared mutable ref used to generate globally unique stroke IDs.
 *
 * @example
 * ```ts
 * const { activeStroke, fadingStrokes, extendStroke, finalizeStroke } =
 *   useLaserStroke({ idRef: animationIdRef })
 * // on pointer move:
 * extendStroke({ id: nextId(), x, y })
 * // on pointer up:
 * finalizeStroke()
 * ```
 * ### Use Cases:
 * - Consumed by `useClickSurface` to drive the SVG laser trail overlay
 */
export function useLaserStroke({ idRef }: { idRef: RefObject<number> }): UseLaserStrokeResult {
	const [activeStroke, setActiveStroke] = useState<Stroke | null>(null)
	const [fadingStrokes, setFadingStrokes] = useState<Stroke[]>([])

	function extendStroke(point: TrailPoint) {
		setActiveStroke((stroke) => {
			if (!stroke) {
				return { id: idRef.current++, points: [point, point] }
			}
			const last = stroke.points.at(-1)
			if (!last || Math.hypot(last.x - point.x, last.y - point.y) < LASER_MIN_POINT_DISTANCE) {
				return stroke
			}
			return { ...stroke, points: [...stroke.points, point] }
		})
	}

	function removeFadingStroke(id: number) {
		setFadingStrokes((strokes) => strokes.filter((item) => item.id !== id))
	}

	function fadeOutStroke(stroke: Stroke) {
		setFadingStrokes((strokes) => {
			if (strokes.some((s) => s.id === stroke.id)) return strokes
			return [...strokes, stroke]
		})
		globalThis.setTimeout(() => removeFadingStroke(stroke.id), LASER_STROKE_FADE_MS)
	}

	function finalizeStroke() {
		setActiveStroke((stroke) => {
			if (stroke && stroke.points.length >= 2) {
				fadeOutStroke(stroke)
			}
			return null
		})
	}

	function clearStrokes() {
		setActiveStroke(null)
		setFadingStrokes([])
	}

	return { activeStroke, fadingStrokes, extendStroke, finalizeStroke, clearStrokes }
}
