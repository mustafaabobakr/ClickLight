/**
 * Public API for `clicklight-web`.
 *
 * Import the stylesheet separately in your app root:
 * ```ts
 * import "clicklight-web/styles.css";
 * ```
 *
 * @example
 * ```tsx
 * import { ClickSurface, profiles } from "clicklight-web";
 * import "clicklight-web/styles.css";
 * ```
 * ### Use Cases:
 * - Barrel re-export consumed by bundlers and `tsc` type checks
 */

// Component
export { ClickSurface } from "./ClickSurface"
export type { ClickSurfaceProps } from "./ClickSurface"

// Hook
export { useClickSurface } from "./useClickSurface"
export type { UseClickSurfaceResult } from "./useClickSurface"

// Types
export type {
	ClickKind,
	ClickSurfaceRef,
	DemoSettings,
	ProfileName,
	Pulse,
	Stroke,
	ThemeName,
	ThemePalette,
	ToggleKey,
	TrailPoint,
} from "./types"

// Data
export { profiles, themePalettes } from "./themes"

// Helpers + constants
export {
	displayKey,
	LASER_CURSOR_FADE_MS,
	LASER_MIN_POINT_DISTANCE,
	LASER_STROKE_FADE_MS,
	SHORTCUT_FADE_MS,
	SHORTCUT_VISIBLE_MS,
} from "./constants"
