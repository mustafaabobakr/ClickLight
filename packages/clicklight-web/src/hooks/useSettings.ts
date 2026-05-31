import { useMemo, useState } from "react"
import { profiles, themePalettes } from "../themes"
import type { DemoSettings, ThemePalette } from "../types"

/**
 * Return type of `useSettings`.
 *
 * @example
 * ```ts
 * const { settings, setSettings, palette } = useSettings({})
 * ```
 * ### Use Cases:
 * - Consumed by `useClickSurface` to drive feature toggles and colour palette
 */
export type UseSettingsResult = {
	/** Current resolved settings (feature toggles + sizing + theme). */
	settings: DemoSettings
	/** React state setter for replacing the entire settings object. */
	setSettings: React.Dispatch<React.SetStateAction<DemoSettings>>
	/** Current colour palette derived from `settings.theme`. */
	palette: ThemePalette
}

/**
 * Manages demo settings state and the derived colour palette.
 *
 * @param params - Configuration object.
 * @param params.defaultSettings - Optional partial settings merged on top of the `"Default"` profile.
 *
 * @example
 * ```ts
 * const { settings, setSettings, palette } = useSettings({ defaultSettings: { theme: "red" } })
 * ```
 * ### Use Cases:
 * - Consumed by `useClickSurface` as the settings layer; `applySettings` is built on top of `setSettings` in the orchestrator
 */
export function useSettings({ defaultSettings }: { defaultSettings?: Partial<DemoSettings> }): UseSettingsResult {
	const [settings, setSettings] = useState<DemoSettings>(() => ({
		...profiles.Default,
		...defaultSettings,
	}))

	const palette = useMemo(() => themePalettes[settings.theme], [settings.theme])

	return { settings, setSettings, palette }
}
