/**
 * useServiceWorkerUpdate — focused behavioral tests.
 *
 * Service workers cannot be exercised in a unit harness, so we mock
 * `navigator.serviceWorker` with a controllable fake registration whose
 * `installing` worker we can drive through its `statechange` lifecycle. The
 * hook is rendered into a real React tree (react-dom/client over happy-dom) so
 * its effects, refs, and state transitions run exactly as in the browser.
 *
 * Covered:
 *   - An installed worker WITH a controller present flips `updateAvailable`.
 *   - `reload()` posts `{type:'SKIP_WAITING'}` to the waiting worker and
 *     reloads the page exactly once on the next `controllerchange`.
 *   - Disabled / unsupported environments are inert (register never called).
 */
import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { Window } from "happy-dom"
import { createElement } from "react"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { useServiceWorkerUpdate, type UseServiceWorkerUpdateReturn } from "./use-service-worker-update"

// Opt into React's act() environment so state updates flush synchronously and
// without "not configured to support act(...)" warnings.
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Listener = (ev?: unknown) => void

/** Minimal EventTarget-ish stub shared by the fake worker / registration. */
class FakeEmitter {
  private listeners = new Map<string, Set<Listener>>()
  addEventListener(type: string, fn: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(fn)
  }
  removeEventListener(type: string, fn: Listener) {
    this.listeners.get(type)?.delete(fn)
  }
  emit(type: string, ev?: unknown) {
    for (const fn of this.listeners.get(type) ?? []) fn(ev)
  }
}

class FakeWorker extends FakeEmitter {
  state = "installing"
  postMessage = mockFn()
}

class FakeRegistration extends FakeEmitter {
  installing: FakeWorker | null = null
  waiting: FakeWorker | null = null
  update = mockFn(() => Promise.resolve())
}

/** Tiny call-recording stub (bun's mock requires a module; this stays local). */
function mockFn<T extends (...args: never[]) => unknown>(impl?: T) {
  const calls: unknown[][] = []
  const fn = ((...args: unknown[]) => {
    calls.push(args)
    return impl?.(...(args as never[]))
  }) as T & { calls: unknown[][] }
  fn.calls = calls
  return fn
}

class FakeServiceWorkerContainer extends FakeEmitter {
  controller: object | null = null
  registration = new FakeRegistration()
  register = mockFn(() => Promise.resolve(this.registration))
}

let window: Window
let container: FakeServiceWorkerContainer
let reloadCalls: number
let root: Root
let host: HTMLElement

/** Install a fresh global DOM + navigator.serviceWorker mock before each test. */
beforeEach(() => {
  window = new Window({ url: "https://app.test/" })
  const g = globalThis as unknown as Record<string, unknown>
  g.window = window
  g.document = window.document
  g.navigator = window.navigator

  container = new FakeServiceWorkerContainer()
  Object.defineProperty(window.navigator, "serviceWorker", {
    configurable: true,
    value: container,
  })

  reloadCalls = 0
  Object.defineProperty(window.location, "reload", {
    configurable: true,
    value: () => {
      reloadCalls++
    },
  })

  host = window.document.createElement("div")
  window.document.body.appendChild(host)
  root = createRoot(host as unknown as Element)
})

afterEach(() => {
  act(() => root.unmount())
})

/** Render the hook and expose its latest return value via a captured ref. */
function renderHook(opts?: Parameters<typeof useServiceWorkerUpdate>[0]) {
  const captured: { current: UseServiceWorkerUpdateReturn | null } = { current: null }
  function Harness() {
    captured.current = useServiceWorkerUpdate(opts)
    return null
  }
  act(() => {
    root.render(createElement(Harness))
  })
  return captured
}

describe("useServiceWorkerUpdate", () => {
  it("flags updateAvailable when a new worker installs with a controller present", async () => {
    container.controller = {} // a controller exists => this is an UPDATE
    const captured = renderHook()

    // Let the registration promise resolve and updatefound wire up.
    await act(async () => {
      await Promise.resolve()
    })

    expect(container.register.calls.length).toBe(1)
    expect(captured.current?.updateAvailable).toBe(false)

    // A new worker begins installing, then finishes.
    const worker = new FakeWorker()
    container.registration.installing = worker
    act(() => {
      container.registration.emit("updatefound")
    })
    act(() => {
      worker.state = "installed"
      worker.emit("statechange")
    })

    expect(captured.current?.updateAvailable).toBe(true)
  })

  it("reload() posts SKIP_WAITING and reloads exactly once on controllerchange", async () => {
    container.controller = {}
    const captured = renderHook()
    await act(async () => {
      await Promise.resolve()
    })

    const worker = new FakeWorker()
    container.registration.installing = worker
    act(() => container.registration.emit("updatefound"))
    act(() => {
      worker.state = "installed"
      worker.emit("statechange")
    })
    expect(captured.current?.updateAvailable).toBe(true)

    act(() => captured.current?.reload())
    expect(worker.postMessage.calls.length).toBe(1)
    expect(worker.postMessage.calls[0]?.[0]).toEqual({ type: "SKIP_WAITING" })

    // The new worker takes control twice; we must reload only once.
    act(() => container.emit("controllerchange"))
    act(() => container.emit("controllerchange"))
    expect(reloadCalls).toBe(1)
  })

  it("does not flag an update on first install (no controller)", async () => {
    container.controller = null // first install: nothing to update over
    const captured = renderHook()
    await act(async () => {
      await Promise.resolve()
    })

    const worker = new FakeWorker()
    container.registration.installing = worker
    act(() => container.registration.emit("updatefound"))
    act(() => {
      worker.state = "installed"
      worker.emit("statechange")
    })

    expect(captured.current?.updateAvailable).toBe(false)
  })

  it("is inert when disabled (never registers)", async () => {
    const captured = renderHook({ enabled: false })
    await act(async () => {
      await Promise.resolve()
    })
    expect(container.register.calls.length).toBe(0)
    expect(captured.current?.updateAvailable).toBe(false)
  })

  it("dismiss() clears updateAvailable without reloading", async () => {
    container.controller = {}
    const captured = renderHook()
    await act(async () => {
      await Promise.resolve()
    })
    const worker = new FakeWorker()
    container.registration.installing = worker
    act(() => container.registration.emit("updatefound"))
    act(() => {
      worker.state = "installed"
      worker.emit("statechange")
    })
    expect(captured.current?.updateAvailable).toBe(true)

    act(() => captured.current?.dismiss())
    expect(captured.current?.updateAvailable).toBe(false)
    expect(reloadCalls).toBe(0)
  })
})
