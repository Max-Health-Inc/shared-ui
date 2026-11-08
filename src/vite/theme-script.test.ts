import { afterAll, describe, expect, it } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { build } from "vite"
import { themeScript, type ThemeScriptOptions } from "../lib/theme"
import { themeScriptPlugin } from "./index"

const options: ThemeScriptOptions = { defaultTheme: { daytime: { from: 8, to: 20 } }, storageKey: "app-theme" }

function transform(plugin: ReturnType<typeof themeScriptPlugin>) {
  const hook = plugin.transformIndexHtml
  if (typeof hook !== "function") throw new Error("expected a plain transformIndexHtml function")
  return Reflect.apply(hook, {}, ["<html><head></head><body></body></html>", { path: "/index.html", filename: "index.html" }])
}

describe("themeScriptPlugin", () => {
  it("prepends the provider's own pre-paint script to <head>", () => {
    expect(transform(themeScriptPlugin(options))).toEqual([
      { tag: "script", children: themeScript(options), injectTo: "head-prepend" },
    ])
  })

  it("defaults to the provider's defaults", () => {
    expect(transform(themeScriptPlugin())).toEqual([
      { tag: "script", children: themeScript(), injectTo: "head-prepend" },
    ])
  })

  describe("in a real Vite build", () => {
    const dirs: string[] = []
    afterAll(async () => {
      await Promise.all(dirs.map((dir) => rm(dir, { recursive: true, force: true })))
    })

    it("writes the script as the first child of <head>", async () => {
      const root = await mkdtemp(join(tmpdir(), "theme-script-"))
      dirs.push(root)
      await writeFile(
        join(root, "index.html"),
        '<!doctype html><html><head><meta charset="UTF-8" /><title>t</title></head><body><script type="module" src="./main.js"></script></body></html>',
      )
      await writeFile(join(root, "main.js"), "document.title = 'ok'\n")

      await build({
        root,
        configFile: false,
        logLevel: "silent",
        plugins: [themeScriptPlugin(options)],
        build: { outDir: join(root, "dist") },
      })

      const html = await readFile(join(root, "dist", "index.html"), "utf8")
      const head = html.slice(html.indexOf("<head>") + "<head>".length).trimStart()
      expect(head.startsWith(`<script>${themeScript(options)}</script>`)).toBe(true)
    })
  })
})
