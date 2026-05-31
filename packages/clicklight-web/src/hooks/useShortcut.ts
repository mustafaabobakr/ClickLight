import { useRef, useState } from "react"
import { SHORTCUT_FADE_MS, SHORTCUT_VISIBLE_MS } from "../constants"

/**
 * Return type of `useShortcut`.
 *
 * @example
 * ```ts
 * const { shortcut, shortcutFading, showShortcut } = useShortcut()
 * ```
 * ### Use Cases:
 * - Consumed by `useClickSurface` to display the live keyboard shortcut overlay
 */
export type UseShortcutResult = {
	/** The keyboard shortcut label currently displayed, or `null`. */
	shortcut: string | null
	/** Whether the shortcut label is in its CSS fade-out phase. */
	shortcutFading: boolean
	/**
	 * Displays `label` as the active shortcut, resetting any in-progress fade.
	 * Automatically starts the fade-out sequence after `SHORTCUT_VISIBLE_MS`.
	 */
	showShortcut: (label: string) => void
	/** Immediately hides the shortcut label and cancels any pending fade timers. */
	clearShortcut: () => void
}

/**
 * Manages keyboard shortcut label display state and fade-out timing.
 *
 * @example
 * ```ts
 * const { shortcut, shortcutFading, showShortcut, clearShortcut } = useShortcut()
 * // on keydown:
 * showShortcut("⌘K")
 * // when keys feature is disabled:
 * clearShortcut()
 * ```
 * ### Use Cases:
 * - Consumed by `useClickSurface` to drive the shortcut label overlay
 */
export function useShortcut(): UseShortcutResult {
	const [shortcut, setShortcut] = useState<string | null>(null)
	const [shortcutFading, setShortcutFading] = useState(false)
	const shortcutFadeTimeoutRef = useRef<number | null>(null)
	const shortcutRemoveTimeoutRef = useRef<number | null>(null)

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

	function showShortcut(label: string) {
		setShortcut(label)
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

	return { shortcut, shortcutFading, showShortcut, clearShortcut }
}
