"use client"

import { createContext, useContext, useLayoutEffect, useState, type RefObject } from "react"

export const HeaderCompactContext = createContext(false)

export function useHeaderCompact(): boolean {
  return useContext(HeaderCompactContext)
}

export interface CompactState {
  compact: boolean
  expandedWidth: number
}

export function decideCompact(state: CompactState, available: number, contentWidth: number): CompactState {
  if (!state.compact) {
    return contentWidth > available ? { compact: true, expandedWidth: contentWidth } : { compact: false, expandedWidth: contentWidth }
  }
  return available >= state.expandedWidth ? { compact: false, expandedWidth: state.expandedWidth } : state
}

function innerWidth(element: HTMLElement): number {
  const style = getComputedStyle(element)
  return element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
}

function contentWidth(row: HTMLElement): number {
  const groups = Array.from(row.children).filter((child): child is HTMLElement => child instanceof HTMLElement)
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0
  return groups.reduce((sum, group) => sum + group.offsetWidth, 0) + gap * Math.max(0, groups.length - 1)
}

export function useHeaderOverflow(rowRef: RefObject<HTMLElement | null>): boolean {
  const [state, setState] = useState<CompactState>({ compact: false, expandedWidth: 0 })

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row || typeof ResizeObserver === "undefined") return
    const measure = () => {
      setState((current) => {
        const next = decideCompact(current, innerWidth(row), contentWidth(row))
        return next.compact === current.compact && next.expandedWidth === current.expandedWidth ? current : next
      })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    for (const child of Array.from(row.children)) observer.observe(child)
    measure()
    return () => { observer.disconnect() }
  }, [rowRef])

  return state.compact
}
