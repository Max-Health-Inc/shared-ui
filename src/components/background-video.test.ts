import { describe, expect, it } from "bun:test"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { BackgroundVideo } from "./background-video"
import { SignInLanding } from "./sign-in-landing"

const Icon = () => null

describe("BackgroundVideo", () => {
  it("prerenders only the poster, so nothing downloads or moves before the motion preference is known", () => {
    const html = renderToStaticMarkup(createElement(BackgroundVideo, { src: "/video/hero-v1.mp4", poster: "/video/hero-v1-poster.webp" }))
    expect(html).toContain('src="/video/hero-v1-poster.webp"')
    expect(html).not.toContain("<video")
  })

  it("is hidden from screen readers unless the caller names it", () => {
    const unnamed = renderToStaticMarkup(createElement(BackgroundVideo, { src: "/a.mp4", poster: "/a.webp" }))
    expect(unnamed).toContain('aria-hidden="true"')
    const named = renderToStaticMarkup(createElement(BackgroundVideo, { src: "/a.mp4", poster: "/a.webp", label: "Airflow through a nose" }))
    expect(named).toContain('role="img"')
    expect(named).toContain('aria-label="Airflow through a nose"')
    expect(named).not.toContain("aria-hidden")
  })

  it("covers a dark clip more under a light scheme than under a dark one", () => {
    const html = renderToStaticMarkup(createElement(BackgroundVideo, { src: "/a.mp4", poster: "/a.webp", scrim: 30, lightScrim: 85 }))
    expect(html).toContain("light-dark(color-mix(in oklab, var(--background) 85%, transparent), color-mix(in oklab, var(--background) 30%, transparent))")
  })
})

describe("SignInLanding background", () => {
  it("lifts the landing content above the background", () => {
    const html = renderToStaticMarkup(
      createElement(SignInLanding, {
        title: "Viewer",
        description: "Look at scans",
        icon: Icon,
        background: createElement(BackgroundVideo, { src: "/a.mp4", poster: "/a.webp" }),
      }),
    )
    expect(html.indexOf('src="/a.webp"')).toBeLessThan(html.indexOf("Viewer"))
    expect(html).toContain("relative z-10")
  })

  it("keeps the plain layout when there is no background", () => {
    const html = renderToStaticMarkup(createElement(SignInLanding, { title: "Viewer", description: "Look at scans", icon: Icon }))
    expect(html).not.toContain("z-10")
  })
})
