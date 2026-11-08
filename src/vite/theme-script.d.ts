import type { Plugin } from "vite"
import type { ThemeScriptOptions } from "../lib/theme.js"

/**
 * Vite plugin that writes the pre-paint theme script into `index.html` as the first child of
 * `<head>`. Pass the same options as the app's `<ThemeProvider>`.
 */
export declare function themeScriptPlugin(options?: ThemeScriptOptions): Plugin
