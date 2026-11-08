/**
 * Vite plugin that writes the pre-paint theme script (`themeScript`) into an SPA's
 * `index.html` as the first child of `<head>`, so a stored theme applies before anything
 * paints. Pass the same options as the app's `<ThemeProvider>`.
 *
 * Usage in an app's `vite.config.ts`:
 * ```ts
 * import { themeScriptPlugin } from "@max-health-inc/shared-ui/vite"
 * export default defineConfig({ plugins: [react(), themeScriptPlugin(THEME_OPTIONS)] })
 * ```
 */
import { themeScript } from "../lib/theme.js"

/**
 * @param {import("../lib/theme.js").ThemeScriptOptions} [options]
 * @returns {import("vite").Plugin}
 */
export function themeScriptPlugin(options = {}) {
  const children = themeScript(options)

  return {
    name: "maxhealth-theme-script",
    transformIndexHtml: () => [{ tag: "script", children, injectTo: "head-prepend" }],
  }
}
