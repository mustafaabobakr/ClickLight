/**
 * How long the laser cursor dot takes to fully fade out after the pointer
 * stops moving, in milliseconds.
 *
 * @example
 * ```ts
 * window.setTimeout(() => setLaserCursorFading(true), LASER_CURSOR_FADE_MS);
 * ```
 * ### Use Cases:
 * - Scheduling the CSS opacity transition for the laser cursor element
 */
export const LASER_CURSOR_FADE_MS = 420

/**
 * How long a completed laser stroke lingers before fading to transparent,
 * in milliseconds.
 *
 * @example
 * ```ts
 * window.setTimeout(() => removeFadingStroke(id), LASER_STROKE_FADE_MS);
 * ```
 * ### Use Cases:
 * - Scheduling removal of fading stroke elements from the DOM after CSS animation ends
 */
export const LASER_STROKE_FADE_MS = 900

/**
 * Minimum distance (in pixels) the pointer must travel before a new trail
 * point is appended to the active laser stroke. Prevents over-sampling.
 *
 * @example
 * ```ts
 * if (distance >= LASER_MIN_POINT_DISTANCE) appendPoint(nextPoint);
 * ```
 * ### Use Cases:
 * - Guard inside `pointermove` handlers to keep stroke arrays compact
 */
export const LASER_MIN_POINT_DISTANCE = 2.5

/**
 * How long a keyboard shortcut label stays fully visible before the fade
 * begins, in milliseconds. Mirrors Swift `LiveShortcutLabel` (0.72 s visible).
 *
 * @example
 * ```ts
 * window.setTimeout(() => setShortcutFading(true), SHORTCUT_VISIBLE_MS);
 * ```
 * ### Use Cases:
 * - Scheduling the start of the shortcut fade-out CSS transition
 */
export const SHORTCUT_VISIBLE_MS = 720

/**
 * Duration of the shortcut label fade-out animation, in milliseconds.
 * Matches the CSS `transition: opacity 280ms ease-out` on the shortcut overlay.
 *
 * @example
 * ```ts
 * window.setTimeout(() => setShortcut(null), SHORTCUT_FADE_MS);
 * ```
 * ### Use Cases:
 * - Scheduling DOM removal of the shortcut element after its CSS transition ends
 */
export const SHORTCUT_FADE_MS = 280

/**
 * Maps a browser `KeyboardEvent` to the display string shown in the shortcut
 * overlay. Mirrors Swift `HotKeyBinding.keyCodeToDisplayString`.
 *
 * Returns `null` for modifier-only keys (Shift, Meta, Ctrl, Alt) and for any
 * key that should not be displayed in the overlay.
 *
 * @param params - Object containing the `KeyboardEvent` to inspect.
 * @returns The human-readable key label, or `null` if the key should be ignored.
 *
 * @example
 * ```ts
 * const label = displayKey({ event: keyboardEvent });
 * // "↩" for Enter, "⌫" for Backspace, "A" for the A key, null for Shift
 * ```
 * ### Use Cases:
 * - Building the modifier + key string shown in the shortcut display overlay
 */
export function displayKey({ event }: { event: KeyboardEvent }): string | null {
	switch (event.code) {
		case "Space":
			return "Space"
		case "Enter":
		case "NumpadEnter":
			return "↩"
		case "Tab":
			return "⇥"
		case "Backspace":
			return "⌫"
		case "Delete":
			return "⌦"
		case "Escape":
			return "Esc"
		case "ArrowLeft":
			return "←"
		case "ArrowRight":
			return "→"
		case "ArrowDown":
			return "↓"
		case "ArrowUp":
			return "↑"
		case "PageUp":
			return "⇞"
		case "PageDown":
			return "⇟"
		case "Home":
			return "↖"
		case "End":
			return "↘"
	}
	if (/^F\d{1,2}$/.test(event.code)) return event.code
	if (
		["MetaLeft", "MetaRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "ShiftLeft", "ShiftRight"].includes(
			event.code,
		)
	) {
		return null
	}
	if (event.key.length === 1) return event.key.toUpperCase()
	return null
}
