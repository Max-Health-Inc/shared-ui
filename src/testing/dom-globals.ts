import type { Window } from "happy-dom"

/** What libraries probe at import to choose a browser code path. */
export const BROWSER_PRESENCE = [
  "window", "document", "navigator", "location", "sessionStorage", "localStorage",
  "HTMLElement", "Element", "Node", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame",
] as const

/** Everything a rendering test needs, events included; these replace Node's own Event classes. */
export const DOM_GLOBALS = [
  ...BROWSER_PRESENCE,
  "Event", "CustomEvent", "KeyboardEvent", "MouseEvent", "PointerEvent", "FocusEvent",
  "MutationObserver", "ResizeObserver", "NodeFilter", "DOMRect",
] as const

/**
 * Points the DOM globals at `window` and returns the restore. Bun shares globals across test
 * files and does not promise when each file's top level runs, so install in beforeAll or
 * beforeEach and restore after; a file that installs only at import time gets another file's window.
 */
export function installDomGlobals(window: Window, keys: readonly string[] = DOM_GLOBALS): () => void {
  const saved = keys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const)
  for (const key of keys) {
    Object.defineProperty(globalThis, key, {
      value: key === "window" ? window : Reflect.get(window, key),
      configurable: true,
      writable: true,
    })
  }
  return () => {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }
}
