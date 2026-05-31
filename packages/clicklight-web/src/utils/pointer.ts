import type React from "react"

/**
 * Converts a pointer event to local coordinates relative to a surface element.
 *
 * @example
 * ```ts
 * const point = pointFromEvent(event, surfaceRef)
 * if (point) console.log(point.x, point.y)
 * ```
 * ### Use Cases:
 * - Computing click and drag positions relative to the overlay surface in pointer event handlers
 */
export function pointFromEvent(
	event: React.PointerEvent<HTMLDivElement>,
	ref: React.RefObject<HTMLDivElement | null>,
): { x: number; y: number } | null {
	const rect = ref.current?.getBoundingClientRect()
	if (!rect) return null
	return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}
