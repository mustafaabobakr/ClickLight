"use client"
import React, { forwardRef, useImperativeHandle } from "react"
import "./ClickSurface.css"
import type { ClickSurfaceRef, DemoSettings } from "./types"
import { useClickSurface } from "./useClickSurface"

/**
 * Props accepted by the `<ClickSurface>` component.
 *
 * @example
 * ```tsx
 * <ClickSurface
 *   defaultSettings={{ theme: "red", laser: true }}
 *   className="my-surface"
 *   id="demo"
 * >
 *   <p>Click anywhere</p>
 * </ClickSurface>
 * ```
 * ### Use Cases:
 * - Wrapping a full-page interactive area to visualize all pointer events
 * - Passing `ref` to obtain an imperative handle for external settings updates
 */
export type ClickSurfaceProps = {
	/** Elements to render inside the click surface. */
	children?: React.ReactNode
	/**
	 * Initial settings merged on top of the `"Default"` profile. Applied once
	 * on mount; use the `ref` to drive subsequent updates.
	 */
	defaultSettings?: Partial<DemoSettings>
	/** Additional CSS class applied to the wrapper `<div>`. */
	className?: string
	/** Inline styles applied to the wrapper `<div>` (merged with CSS variables). */
	style?: React.CSSProperties
	/** `id` attribute forwarded to the wrapper `<div>`. */
	id?: string
}

/**
 * A wrapper `<div>` that overlays animated click-visualization elements on top
 * of its children in response to pointer and keyboard events.
 *
 * All overlay logic lives in `useClickSurface`; this component is UI-only.
 * Attach a `ref` to get an imperative `applySettings` handle for external
 * settings panels or profile switchers.
 *
 * Import the stylesheet once in your app root:
 * ```ts
 * import "clicklight-web/styles.css";
 * ```
 *
 * @example
 * ```tsx
 * import { ClickSurface, profiles } from "clicklight-web";
 * import "clicklight-web/styles.css";
 *
 * const surfaceRef = useRef<ClickSurfaceRef>(null);
 *
 * <ClickSurface
 *   ref={surfaceRef}
 *   defaultSettings={profiles.Presentation}
 *   className="my-surface"
 * >
 *   <p>Your content here</p>
 * </ClickSurface>
 * ```
 * ### Use Cases:
 * - Drop-in click visualizer for demos and screen-sharing setups
 * - Controlled via `ref.current.applySettings(...)` from an external UI panel
 */
export const ClickSurface = forwardRef<ClickSurfaceRef, ClickSurfaceProps>(function ClickSurface(
	{ children, defaultSettings, className, style, id },
	ref,
) {
	const {
		settings,
		palette,
		pulses,
		activeStroke,
		fadingStrokes,
		laserCursor,
		laserCursorFading,
		shortcut,
		shortcutFading,
		surfaceRef,
		pointerHandlers,
		applySettings,
	} = useClickSurface({ defaultSettings })

	useImperativeHandle(ref, () => ({ applySettings }), [applySettings])

	const wrapperClass = className ? `clw-wrapper ${className}` : "clw-wrapper"

	const cssVars = {
		"--active": palette.active,
		"--drag-color": palette.drag,
		"--laser-inner": palette.laserInner,
		"--laser-middle": palette.laserMiddle,
		"--laser-outer": palette.laserOuter,
		"--laser-main": palette.laserMain,
		"--middle-color": palette.middle,
		"--press-color": palette.active,
		"--pulse-duration": `${settings.pulseDuration}ms`,
		"--release-color": palette.active,
		"--pulse-size": `${settings.pulseSize}px`,
		"--right-color": palette.right,
	} as React.CSSProperties

	return (
		<div
			id={id}
			ref={surfaceRef}
			className={wrapperClass}
			style={{ ...cssVars, ...style }}
			tabIndex={settings.keys ? 0 : undefined}
			{...pointerHandlers}>
			{children}

			{settings.keys && shortcut && (
				<div className={shortcutFading ? "clw-shortcut-display clw-fading" : "clw-shortcut-display"}>{shortcut}</div>
			)}

			{settings.laser && (activeStroke || fadingStrokes.length > 0) && (
				<svg className='clw-laser-strokes' aria-hidden='true'>
					{fadingStrokes.map((stroke) => (
						<g key={stroke.id} className='clw-laser-stroke-group clw-fading'>
							<polyline
								className='clw-laser-stroke clw-outer'
								points={stroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
							/>
							<polyline
								className='clw-laser-stroke clw-main'
								points={stroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
							/>
							<polyline
								className='clw-laser-stroke clw-middle'
								points={stroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
							/>
							<polyline
								className='clw-laser-stroke clw-inner'
								points={stroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
							/>
						</g>
					))}
					{activeStroke && activeStroke.points.length > 1 && (
						<g className='clw-laser-stroke-group'>
							<polyline
								className='clw-laser-stroke clw-outer'
								points={activeStroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
							/>
							<polyline
								className='clw-laser-stroke clw-main'
								points={activeStroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
							/>
							<polyline
								className='clw-laser-stroke clw-middle'
								points={activeStroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
							/>
							<polyline
								className='clw-laser-stroke clw-inner'
								points={activeStroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
							/>
						</g>
					)}
				</svg>
			)}

			{settings.laser && laserCursor && (
				<span
					className={laserCursorFading ? "clw-laser-cursor clw-fading" : "clw-laser-cursor"}
					style={{ left: laserCursor.x, top: laserCursor.y }}
				/>
			)}

			{pulses.map((pulse) => (
				<span className={`clw-pulse clw-${pulse.kind}`} key={pulse.id} style={{ left: pulse.x, top: pulse.y }} />
			))}
		</div>
	)
})

ClickSurface.displayName = "ClickSurface"
