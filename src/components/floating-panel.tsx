"use client"

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react"
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react"
import { browserStorage, clampToBounds, nudge, readPanelState, writePanelState, type PanelPosition, type PanelState } from "../lib/panel-position"
import { useUiText, type TFn } from "../lib/ui-text"
import { cn } from "../lib/utils"

export interface FloatingPanelProps {
  title: string
  children: ReactNode
  /** Window pixels of the top-left corner when nothing is stored. */
  defaultPosition?: PanelPosition
  defaultMinimized?: boolean
  /** Remembers position and minimised state across visits under this localStorage key. */
  storageKey?: string
  className?: string
  t?: TFn
}

/**
 * A non-modal panel that floats over a view, moves by its header (drag or arrow keys on the grip)
 * and folds down to its header, so the view behind it stays usable.
 */
export function FloatingPanel({ title, children, defaultPosition = { x: 16, y: 96 }, defaultMinimized = false, storageKey, className, t: appT }: FloatingPanelProps) {
  const t = useUiText(appT)
  const bodyId = useId()
  const panel = useRef<HTMLElement>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const [state, setState] = useState<PanelState>(() => {
    const fallback = { position: defaultPosition, minimized: defaultMinimized }
    return storageKey ? readPanelState(browserStorage(), storageKey, fallback) : fallback
  })

  useEffect(() => {
    if (storageKey) writePanelState(browserStorage(), storageKey, state)
  }, [state, storageKey])

  const placed = useCallback((position: PanelPosition) => {
    const rect = panel.current?.getBoundingClientRect()
    return clampToBounds(position, { width: rect?.width ?? 0, height: rect?.height ?? 0 }, { width: window.innerWidth, height: window.innerHeight })
  }, [])

  useEffect(() => {
    const refit = () => {
      setState((current) => ({ ...current, position: placed(current.position) }))
    }
    window.addEventListener("resize", refit)
    const frame = requestAnimationFrame(refit)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", refit)
    }
  }, [placed, state.minimized])

  const startDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target instanceof Element && e.target.closest("button:not([data-grip])"))) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { dx: e.clientX - state.position.x, dy: e.clientY - state.position.y }
  }
  const moveDrag = (e: PointerEvent<HTMLDivElement>) => {
    const grab = drag.current
    if (!grab) return
    setState((current) => ({ ...current, position: placed({ x: e.clientX - grab.dx, y: e.clientY - grab.dy }) }))
  }
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }
  const keyMove = (e: KeyboardEvent<HTMLButtonElement>) => {
    const next = nudge(state.position, e.key, e.shiftKey)
    if (!next) return
    e.preventDefault()
    setState((current) => ({ ...current, position: placed(next) }))
  }

  return (
    <section
      ref={panel}
      role="region"
      aria-label={title}
      data-slot="floating-panel"
      className={cn("fixed z-40 flex max-h-[calc(100vh-1rem)] max-w-[calc(100vw-1rem)] flex-col rounded-md border border-border/60 bg-card/90 text-card-foreground shadow-lg backdrop-blur", className)}
      style={{ left: state.position.x, top: state.position.y }}
    >
      <div
        className="flex cursor-move touch-none select-none items-center gap-1 border-b border-border/60 px-1 py-0.5"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <button type="button" data-grip className="rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label={t("Move panel")} title={t("Move panel")} onKeyDown={keyMove}>
          <GripVertical className="size-3.5" />
        </button>
        <span className="flex-1 truncate text-xs font-medium">{title}</span>
        <button
          type="button"
          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-expanded={!state.minimized}
          aria-controls={bodyId}
          aria-label={state.minimized ? t("Expand panel") : t("Minimise panel")}
          title={state.minimized ? t("Expand panel") : t("Minimise panel")}
          onClick={() => {
            setState((current) => ({ ...current, minimized: !current.minimized }))
          }}
        >
          {state.minimized ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
        </button>
      </div>
      {!state.minimized && (
        <div id={bodyId} className="overflow-auto p-2">
          {children}
        </div>
      )}
    </section>
  )
}
