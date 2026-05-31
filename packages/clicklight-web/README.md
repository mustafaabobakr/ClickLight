# clicklight-web

React click-visualization overlay — highlight pointer events for demos, screen sharing, and UX reviews.

Styles are injected automatically when you import the package. No separate CSS import required.

## Installation

```bash
npm install clicklight-web
```

## Quick start

Wrap any interactive area with `<ClickSurface>`. Pointer events inside it produce animated pulse overlays.

```tsx
import { ClickSurface } from "clicklight-web"

export default function Page() {
	return (
		<ClickSurface style={{ width: "100%", height: "100vh" }}>
			<p>Click anywhere to see the overlay</p>
		</ClickSurface>
	)
}
```

## Profiles

Three built-in presets are available via the `profiles` record:

| Name           | Theme | Laser | Pulse size | Duration |
| -------------- | ----- | ----- | ---------- | -------- |
| `Default`      | blue  | off   | 96 px      | 440 ms   |
| `Tutorial`     | amber | off   | 184 px     | 1080 ms  |
| `Presentation` | red   | on    | 116 px     | 620 ms   |

```tsx
import { ClickSurface, profiles } from "clicklight-web"
;<ClickSurface defaultSettings={profiles.Presentation}>{/* ... */}</ClickSurface>
```

## Controlling settings from outside

Pass a `ref` to get the imperative `applySettings` handle. Useful for external settings panels or profile switchers.

```tsx
import { useRef } from "react"
import { ClickSurface, profiles, type ClickSurfaceRef } from "clicklight-web"

export default function Demo() {
	const surfaceRef = useRef<ClickSurfaceRef>(null)

	function enableLaser() {
		surfaceRef.current?.applySettings({ laser: true })
	}

	function switchProfile(name: "Default" | "Tutorial" | "Presentation") {
		surfaceRef.current?.applySettings(profiles[name])
	}

	return (
		<>
			<button onClick={enableLaser}>Enable laser</button>
			<button onClick={() => switchProfile("Presentation")}>Presentation mode</button>
			<ClickSurface ref={surfaceRef} defaultSettings={profiles.Default}>
				{/* ... */}
			</ClickSurface>
		</>
	)
}
```

## Using the hook directly

`useClickSurface` exposes all state and handlers when you need a custom wrapper element.

```tsx
import { useClickSurface } from "clicklight-web"

function CustomOverlay() {
	const { settings, pulses, surfaceRef, pointerHandlers, palette } = useClickSurface({
		defaultSettings: { theme: "red", laser: true },
	})

	return (
		<div ref={surfaceRef} style={{ "--laser-main": palette.laserMain } as React.CSSProperties} {...pointerHandlers}>
			{pulses.map((p) => (
				<span key={p.id} className={`clw-pulse clw-${p.kind}`} style={{ left: p.x, top: p.y }} />
			))}
		</div>
	)
}
```

## API reference

### `<ClickSurface>`

| Prop              | Type                         | Description                                                   |
| ----------------- | ---------------------------- | ------------------------------------------------------------- |
| `defaultSettings` | `Partial<DemoSettings>`      | Initial settings merged on top of the `"Default"` profile.    |
| `className`       | `string`                     | Extra CSS class added to the wrapper `<div>`.                 |
| `style`           | `React.CSSProperties`        | Inline styles merged with the injected CSS custom properties. |
| `id`              | `string`                     | Forwarded to the wrapper `<div>`.                             |
| `children`        | `React.ReactNode`            | Content rendered inside the surface.                          |
| `ref`             | `React.Ref<ClickSurfaceRef>` | Attach to call `applySettings` imperatively.                  |

### `ClickSurfaceRef`

```ts
type ClickSurfaceRef = {
	applySettings: (partial: Partial<DemoSettings>) => void
}
```

### `DemoSettings`

```ts
type DemoSettings = {
	press: boolean // Primary button down pulse
	release: boolean // Primary button up pulse
	right: boolean // Right-click pulse
	middle: boolean // Middle-click pulse
	drag: boolean // Drag indicator dots
	laser: boolean // Laser pointer trail
	keys: boolean // Keyboard shortcut display
	pulseDuration: number // Animation length in ms
	pulseSize: number // Pulse ring diameter in px
	theme: "blue" | "amber" | "red"
}
```

### Exports

```ts
// Components & hooks
export { ClickSurface } // Wrapper component
export { useClickSurface } // Headless hook

// Presets
export { profiles } // Record<ProfileName, DemoSettings>
export { themePalettes } // Record<ThemeName, ThemePalette>
export { displayKey } // (event: KeyboardEvent) => string | null

// Types
export type {
	ClickSurfaceProps,
	ClickSurfaceRef,
	DemoSettings,
	ThemePalette,
	ClickKind,
	ThemeName,
	ProfileName,
	ToggleKey,
	Pulse,
	TrailPoint,
	Stroke,
	UseClickSurfaceResult,
}

// Constants
export { LASER_CURSOR_FADE_MS, LASER_STROKE_FADE_MS, LASER_MIN_POINT_DISTANCE, SHORTCUT_VISIBLE_MS, SHORTCUT_FADE_MS }
```

## Themes

Three colour palettes are available. Set `theme` in `DemoSettings` or pass via `profiles`.

| Name    | Pulse colour | Laser colour |
| ------- | ------------ | ------------ |
| `blue`  | Blue         | Crimson red  |
| `amber` | Amber        | Crimson red  |
| `red`   | Red          | Crimson red  |

Access raw colour values:

```ts
import { themePalettes } from "clicklight-web"

const { active, laserMain } = themePalettes["blue"]
```

## Optional: manual CSS import

Styles are normally injected automatically at runtime. If you need server-side CSS extraction (e.g. to include them in a critical CSS bundle), you can import the stylesheet directly instead:

```ts
import "clicklight-web/styles.css"
```

## Requirements

- React ≥ 18
- A bundler that handles `import "./some.css"` in JS (Webpack, Vite, Turbopack, etc.)
