/**
 * The kind of mouse interaction captured at the pointer level.
 *
 * @example
 * ```ts
 * const kind: ClickKind = "press";
 * ```
 * ### Use Cases:
 * - Driving per-gesture pulse animation variants inside `<ClickSurface>`
 * - Filtering which gestures trigger an overlay via `DemoSettings` toggles
 */
export type ClickKind =
	/** Primary button pressed down. */
	| "press"
	/** Primary button released. */
	| "release"
	/** Secondary (right) button pressed down. */
	| "right"
	/** Secondary (right) button released. */
	| "rightRelease"
	/** Middle (scroll-wheel) button pressed down. */
	| "middle"
	/** Middle (scroll-wheel) button released. */
	| "middleRelease"
	/** Pointer moved with the primary button held. */
	| "drag"

/**
 * Built-in colour theme names for the click overlay.
 *
 * @example
 * ```ts
 * const theme: ThemeName = "blue";
 * ```
 * ### Use Cases:
 * - Selecting a pre-built palette via `DemoSettings.theme`
 * - Keying into `themePalettes` to retrieve CSS colour values
 */
export type ThemeName = "blue" | "amber" | "red"

/**
 * Names of the built-in preset configurations.
 *
 * @example
 * ```ts
 * const profile: ProfileName = "Presentation";
 * ```
 * ### Use Cases:
 * - Keying into the `profiles` record to retrieve a full `DemoSettings` object
 * - Populating a profile picker UI
 */
export type ProfileName = "Default" | "Tutorial" | "Presentation"

/**
 * Keys of the boolean feature toggles in `DemoSettings`.
 *
 * @example
 * ```ts
 * const key: ToggleKey = "laser";
 * ```
 * ### Use Cases:
 * - Driving generic toggle handlers without writing per-key conditionals
 * - Passed to `ClickSurfaceRef.applySettings` as a single-key partial update
 */
export type ToggleKey =
	/** Show the press pulse animation on left-click down. */
	| "press"
	/** Show the release pulse animation on left-click up. */
	| "release"
	/** Show the right-click pulse animation. */
	| "right"
	/** Show the middle-click pulse animation. */
	| "middle"
	/** Show drag indicator dots while dragging. */
	| "drag"
	/** Enable the laser pointer trail overlay. */
	| "laser"
	/** Show the live keyboard shortcut display. */
	| "keys"

/**
 * Full configuration object controlling which visual features are active
 * and how they are sized and themed.
 *
 * @example
 * ```ts
 * const settings: DemoSettings = {
 *   press: true, release: true, right: true,
 *   middle: true, drag: true, laser: false, keys: true,
 *   pulseDuration: 440, pulseSize: 96, theme: "blue",
 * };
 * ```
 * ### Use Cases:
 * - Passed as `defaultSettings` to `<ClickSurface>`
 * - Stored in a preset via the `profiles` record
 */
export type DemoSettings = Record<ToggleKey, boolean> & {
	/** How long each pulse animation plays, in milliseconds. */
	pulseDuration: number
	/** Diameter of the pulse ring at its largest point, in pixels. */
	pulseSize: number
	/** Which built-in colour palette to apply to all overlay elements. */
	theme: ThemeName
}

/**
 * CSS colour values used to paint a single theme's overlay elements.
 * Each property is injected as a CSS custom property on the `<ClickSurface>` wrapper.
 *
 * @example
 * ```ts
 * const palette = themePalettes["blue"];
 * console.log(palette.laserMain); // "#ff2905"
 * ```
 * ### Use Cases:
 * - Inspecting or overriding individual colour values before they are applied
 */
export type ThemePalette = {
	/** Colour for primary press and release pulses. */
	active: string
	/** Colour for drag indicator dots. */
	drag: string
	/** Innermost (white) stroke layer of the laser pointer trail. */
	laserInner: string
	/** Middle stroke layer of the laser pointer trail (salmon tint). */
	laserMiddle: string
	/** Outermost translucent glow layer of the laser pointer trail. */
	laserOuter: string
	/** Solid core colour of the laser pointer stroke and cursor dot. */
	laserMain: string
	/** Colour for middle-click pulses. */
	middle: string
	/** Colour for right-click pulses. */
	right: string
}

/**
 * A single in-flight pulse overlay rendered at the pointer position.
 *
 * @example
 * ```ts
 * const pulse: Pulse = { id: 1, x: 120, y: 340, kind: "press" };
 * ```
 * ### Use Cases:
 * - Stored in the `pulses` state array inside `useClickSurface`
 * - Used as a React `key` and position source when rendering pulse spans
 */
export type Pulse = {
	/** Unique animation identifier used as a React `key`. */
	id: number
	/** Horizontal position relative to the surface element, in pixels. */
	x: number
	/** Vertical position relative to the surface element, in pixels. */
	y: number
	/** The gesture that triggered this pulse. */
	kind: ClickKind
}

/**
 * A single sampled point along a laser pointer stroke path.
 *
 * @example
 * ```ts
 * const point: TrailPoint = { id: 42, x: 200, y: 150 };
 * ```
 * ### Use Cases:
 * - Accumulated in `Stroke.points` to build an SVG `<polyline>` path
 */
export type TrailPoint = {
	/** Unique identifier for this point. */
	id: number
	/** Horizontal position relative to the surface element, in pixels. */
	x: number
	/** Vertical position relative to the surface element, in pixels. */
	y: number
}

/**
 * A complete laser pointer stroke made up of sequential trail points.
 *
 * @example
 * ```ts
 * const stroke: Stroke = { id: 7, points: [{ id: 1, x: 0, y: 0 }] };
 * ```
 * ### Use Cases:
 * - Held in `activeStroke` while the pointer is down
 * - Moved to `fadingStrokes` on pointer-up to animate the fade-out
 */
export type Stroke = {
	/** Unique identifier used as a React `key`. */
	id: number
	/** Ordered list of sampled points that make up the stroke path. */
	points: TrailPoint[]
}

/**
 * Imperative handle returned by a `ref` attached to `<ClickSurface>`.
 * Allows external code to update settings without making the component fully controlled.
 *
 * @example
 * ```ts
 * const ref = useRef<ClickSurfaceRef>(null);
 * ref.current?.applySettings({ theme: "red", laser: true });
 * ```
 * ### Use Cases:
 * - Switching profiles from an external settings panel
 * - Toggling individual features (e.g. laser mode) from a parent component
 */
export type ClickSurfaceRef = {
	/**
	 * Merges the given partial settings into the surface's internal state.
	 * Safe to call at any time; laser/shortcut visuals are cleared automatically
	 * when their respective feature is turned off.
	 *
	 * @param partial - Subset of `DemoSettings` fields to override.
	 */
	applySettings: (partial: Partial<DemoSettings>) => void
}
