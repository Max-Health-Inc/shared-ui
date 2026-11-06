"use client"

import { useSyncExternalStore } from "react"

const REDUCE_MOTION = "(prefers-reduced-motion: reduce)"

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCE_MOTION)
  query.addEventListener("change", onChange)
  return () => {
    query.removeEventListener("change", onChange)
  }
}

function getSnapshot(): boolean {
  return window.matchMedia(REDUCE_MOTION).matches
}

/** Assume reduced motion until the client says otherwise, so prerendered HTML holds only the poster. */
function getServerSnapshot(): boolean {
  return true
}

export interface BackgroundVideoProps {
  /** Muted, seamlessly looping clip with any blur baked in (`encode-background-video`). Version the filename. */
  src: string
  /** First frame of the clip, shown while it loads and instead of it under reduced motion. */
  poster: string
  /** Scrim coverage 0-100 in the `background` token under a dark scheme; it compounds with the vignette. */
  scrim?: number
  /** The same under a light scheme, where a dark clip needs more cover to keep muted text legible. */
  lightScrim?: number
  /** Accessible description; omit for a decorative background. */
  label?: string
}

function scrimColor(percent: number): string {
  return `color-mix(in oklab, var(--background) ${String(percent)}%, transparent)`
}

/** Ambient looping video behind a page. Sits at `z-0`, so the content above it needs `relative z-10`. */
export function BackgroundVideo({ src, poster, scrim = 45, lightScrim = 80, label }: BackgroundVideoProps) {
  const reducedMotion = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <div
      data-slot="background-video"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden={label === undefined ? true : undefined}
      role={label === undefined ? undefined : "img"}
      aria-label={label}
    >
      {reducedMotion ? (
        <img src={poster} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <video
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <div className="absolute inset-0" style={{ backgroundColor: `light-dark(${scrimColor(lightScrim)}, ${scrimColor(scrim)})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-transparent to-background/70" />
    </div>
  )
}
