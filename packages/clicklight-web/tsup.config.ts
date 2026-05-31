/**
 * tsup build configuration for `clicklight-web`.
 *
 * Produces ESM + CJS dual output with TypeScript declarations. Overlay styles
 * are injected into the document at runtime via `injectStyle: true`, so
 * consumers do not need to import any CSS separately.
 *
 * A `dist/index.css` sidecar is still emitted for consumers who prefer to
 * import it manually via `"clicklight-web/styles.css"`.
 *
 * @example
 * ```bash
 * npx tsup          # production build
 * npx tsup --watch  # development watch mode
 * ```
 * ### Use Cases:
 * - Run via `npm run build` in the `packages/clicklight-web` directory
 * - Outputs `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts`, and `dist/index.css`
 */
import { defineConfig } from "tsup"

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	injectStyle: true,
	external: ["react", "react-dom", "react/jsx-runtime"],
})
