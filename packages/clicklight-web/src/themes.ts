import type { DemoSettings, ProfileName, ThemeName, ThemePalette } from "./types"

/**
 * Ready-made preset configurations keyed by profile name.
 *
 * Three built-in keys: `"Default"`, `"Tutorial"`, `"Presentation"`.
 * Each value is a complete `DemoSettings` object ready to pass as
 * `defaultSettings` to `<ClickSurface>`.
 *
 * @example
 * ```ts
 * import { profiles } from "clicklight-web";
 * const settings = profiles["Tutorial"];
 * ```
 * ### Use Cases:
 * - Seeding `<ClickSurface defaultSettings={profiles["Presentation"]} />`
 * - Populating a profile-picker UI and calling `ref.current?.applySettings`
 */
export const profiles: Record<ProfileName, DemoSettings> = {
	Default: {
		press: true,
		release: true,
		right: true,
		middle: true,
		drag: true,
		laser: false,
		keys: true,
		pulseDuration: 440,
		pulseSize: 96,
		theme: "blue",
	},
	Tutorial: {
		press: true,
		release: true,
		right: true,
		middle: true,
		drag: true,
		laser: false,
		keys: true,
		pulseDuration: 1080,
		pulseSize: 184,
		theme: "amber",
	},
	Presentation: {
		press: true,
		release: true,
		right: true,
		middle: true,
		drag: true,
		laser: true,
		keys: true,
		pulseDuration: 620,
		pulseSize: 116,
		theme: "red",
		cursor: "crosshair",
	},
}

/**
 * CSS colour values for each built-in theme, keyed by `ThemeName`.
 *
 * Each entry is a `ThemePalette` whose properties are injected as CSS custom
 * properties on the `<ClickSurface>` wrapper element at render time, making
 * them available to the overlay CSS via `var(--xxx)`.
 *
 * @example
 * ```ts
 * import { themePalettes } from "clicklight-web";
 * const { active, laserMain } = themePalettes["red"];
 * ```
 * ### Use Cases:
 * - Inspecting or overriding individual colour values before passing `defaultSettings`
 * - Building a custom theme by spreading and overriding specific palette entries
 */
export const themePalettes: Record<ThemeName, ThemePalette> = {
	blue: {
		active: "var(--aqua)",
		drag: "#ebd638",
		laserInner: "#ffffff",
		laserMiddle: "#ffb0a8",
		laserOuter: "rgba(255, 93, 87, 0.25)",
		laserMain: "#ff2905",
		middle: "#45eb94",
		right: "#ff7530",
	},
	amber: {
		active: "var(--amber)",
		drag: "#ffb02e",
		laserInner: "#ffffff",
		laserMiddle: "#ffb0a8",
		laserOuter: "rgba(255, 93, 87, 0.25)",
		laserMain: "#ff2905",
		middle: "#ffe98f",
		right: "#ff9f43",
	},
	red: {
		active: "var(--coral)",
		drag: "#ff6d6a",
		laserInner: "#ffffff",
		laserMiddle: "#ffb0a8",
		laserOuter: "rgba(255, 93, 87, 0.25)",
		laserMain: "#ff2905",
		middle: "#ff8f83",
		right: "#ff5d57",
	},
}
