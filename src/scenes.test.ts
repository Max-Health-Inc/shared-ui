import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"
import { maxhealth } from "brandc"

/**
 * The scene stylesheet is a CONTRACT TEST, not a snapshot: scenes paint the whole
 * viewport behind the app, so the rule these tests enforce is that every scene colour
 * is (a) derived from a brandc token rather than a hardcoded literal, and (b) NEUTRAL.
 *
 * (b) is the one that regressed. A full-viewport haze tinted with the brand ACCENT
 * reads as a coloured wash over the entire product, not as depth — see the green
 * horizon glow shipped by "drive scene colours from the brandc contract", which swapped
 * a near-neutral cool tint (chroma 0.025) for `--maxhealth` (chroma 0.17, hue 162).
 */

const CSS = readFileSync(new URL("./scenes.css", import.meta.url), "utf8")

/**
 * Highest oklch chroma that still reads as neutral tinting rather than a colour wash.
 * The scene's original hand-tuned glow sat at chroma 0.025-0.04; the brand accent sits
 * at 0.17. Anything at or below this is a grey the eye reads as light, not as a hue.
 */
const NEUTRAL_CHROMA = 0.05

/** `--scene-*: <value>;` custom-property declarations, in source order. */
function sceneDeclarations(): Array<{ name: string; value: string }> {
  return [...CSS.matchAll(/(--scene-[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => ({
    name,
    value: value.trim(),
  }))
}

/** Contract tokens a declaration reads through `var(--x)`. */
function referencedTokens(value: string): string[] {
  return [...value.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map(([, token]) => token)
}

/** The oklab/oklch mix percentages in a `color-mix()` value. */
function mixPercentages(value: string): number[] {
  return [...value.matchAll(/([\d.]+)%/g)].map(([, pct]) => Number(pct))
}

/** Chroma component of an `oklch(L C H)` string — the "how colourful is it" axis. */
function chromaOf(colour: string): number {
  const match = /^oklch\(\s*[\d.]+%?\s+([\d.]+)/.exec(colour)
  if (!match) throw new Error(`cannot read chroma from "${colour}"`)
  return Number(match[1])
}

/** Both scheme values of a brandc contract colour, or undefined if it isn't one. */
function contractColour(token: string): { light: string; dark: string } | undefined {
  return maxhealth.colors[token.replace(/^--/, "")]
}

describe("scenes.css", () => {
  it("declares the scene palette", () => {
    const names = sceneDeclarations().map((d) => d.name)
    expect(names).toContain("--scene-glow")
    expect(names).toContain("--scene-line")
  })

  it("derives every scene colour from the contract, never a hardcoded literal", () => {
    for (const { name, value } of sceneDeclarations()) {
      expect(referencedTokens(value).length, `${name} must read a contract token`).toBeGreaterThan(0)
      expect(value, `${name} must not hardcode a colour`).not.toMatch(/oklch\(|#[0-9a-f]{3}|rgba?\(/i)
    }
  })

  it("only ever tints the viewport with NEUTRAL contract tokens", () => {
    for (const { name, value } of sceneDeclarations()) {
      for (const token of referencedTokens(value)) {
        const colour = contractColour(token)
        expect(colour, `${name} reads ${token}, which is not a brandc colour`).toBeDefined()
        if (!colour) continue
        for (const scheme of ["light", "dark"] as const) {
          expect(
            chromaOf(colour[scheme]),
            `${name} reads ${token}, whose ${scheme} value ${colour[scheme]} is a hue, not a neutral — ` +
              `a full-viewport scene tinted with it washes the whole product in brand colour`,
          ).toBeLessThanOrEqual(NEUTRAL_CHROMA)
        }
      }
    }
  })

  it("keeps the horizon glow a haze rather than a wash", () => {
    // The glow covers the full viewport, so its strength is the difference between
    // "depth cue" and "tinted screen". Restoring the original look means a mix of a
    // few percent: the pre-regression literals shifted lightness by ~0.02 against the
    // background in both schemes, which against `--foreground` is a ~2-3% mix.
    for (const { name, value } of sceneDeclarations().filter((d) => d.name === "--scene-glow")) {
      for (const pct of mixPercentages(value)) {
        expect(pct, `${name} mixes ${pct}% — strong enough to read as a colour wash`).toBeLessThanOrEqual(5)
      }
    }
  })

  it("uses no scene variable it does not declare", () => {
    const declared = new Set(sceneDeclarations().map((d) => d.name))
    const used = [...CSS.matchAll(/var\(\s*(--scene-[\w-]+)\s*\)/g)].map(([, token]) => token)
    for (const token of used) {
      expect(declared.has(token), `${token} is used but never declared`).toBe(true)
    }
  })
})
