import { describe, expect, it, test } from "bun:test"
import {
  SERVICE_WORKER_SOURCE,
  BUILD_ID_PLACEHOLDER,
  stampServiceWorker,
} from "./service-worker"

test("stampServiceWorker replaces every build-id placeholder", () => {
  const stamped = stampServiceWorker(`a-${BUILD_ID_PLACEHOLDER}-${BUILD_ID_PLACEHOLDER}`, "abc123")
  expect(stamped).toBe("a-abc123-abc123")
  expect(stamped).not.toContain(BUILD_ID_PLACEHOLDER)
})

test("stampServiceWorker inserts the id literally (no regex expansion)", () => {
  // ids containing `$` must not be treated as replacement patterns
  expect(stampServiceWorker(BUILD_ID_PLACEHOLDER, "$&x")).toBe("$&x")
})

test("stampServiceWorker leaves source without the token unchanged", () => {
  expect(stampServiceWorker("no token here", "x")).toBe("no token here")
})

test("the SW source carries the cache-poison guard on BOTH read and write", () => {
  expect(SERVICE_WORKER_SOURCE).toContain("isHtmlFallback")
  // write path: never store an HTML fallback under an asset URL
  expect(SERVICE_WORKER_SOURCE).toContain("!isHtmlFallback(response)")
  // read path: never serve one either. This assertion is the one that was missing;
  // the write guard alone left already-poisoned clients broken forever.
  expect(SERVICE_WORKER_SOURCE).toContain("isHtmlFallback(cached)")
})

/* ── Behavioural tests: actually RUN the generated worker ──────────────────────
 *
 * The string assertions above are not enough. "carries the cache-poison guard"
 * passed while the guard was applied on the WRITE path only, so a poisoned entry
 * already in a user's cache was still served forever. These tests execute the
 * source against CacheStorage/fetch doubles and assert on what it responds with.
 */

/** Render the worker the way the plugin does, without its file IO. */
function renderWorker(): string {
  return stampServiceWorker(
    SERVICE_WORKER_SOURCE.split("__APP_NAME__").join("test-app").split("__PRECACHE__").join("[]"),
    "buildid",
  )
}

const CACHE_NAME = "test-app-buildid"

function urlOf(request: Request | string): string {
  return typeof request === "string" ? request : request.url
}

/** Minimal CacheStorage double: a Map of cache name -> (url -> Response). */
function makeCacheStorage() {
  const stores = new Map<string, Map<string, Response>>()
  const openStore = (name: string) => {
    const existing = stores.get(name)
    if (existing) return existing
    const created = new Map<string, Response>()
    stores.set(name, created)
    return created
  }
  const caches = {
    async open(name: string) {
      const store = openStore(name)
      return {
        async addAll(paths: string[]) {
          for (const path of paths) store.set(path, new Response(""))
        },
        async put(request: Request | string, response: Response) {
          store.set(urlOf(request), response)
        },
        async match(request: Request | string) {
          return store.get(urlOf(request))
        },
        async delete(request: Request | string) {
          return store.delete(urlOf(request))
        },
      }
    },
    async keys() {
      return [...stores.keys()]
    },
    async delete(name: string) {
      return stores.delete(name)
    },
    /** Global match searches every cache, like the real CacheStorage. */
    async match(request: Request | string) {
      for (const store of stores.values()) {
        const hit = store.get(urlOf(request))
        if (hit) return hit
      }
      return undefined
    },
  }
  return { caches, stores }
}

/** Load the worker source with doubles in scope and expose its fetch handler. */
function loadWorker(respond: (request: Request) => Response) {
  const listeners = new Map<string, (event: unknown) => void>()
  const worker = {
    addEventListener(type: string, handler: (event: unknown) => void) {
      listeners.set(type, handler)
    },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
  }
  const { caches, stores } = makeCacheStorage()
  const fetched: string[] = []
  const fetch_ = async (request: Request) => {
    fetched.push(urlOf(request))
    return respond(request)
  }

  new Function("self", "caches", "fetch", renderWorker())(worker, caches, fetch_)

  async function handleFetch(url: string): Promise<Response> {
    const handler = listeners.get("fetch")
    if (!handler) throw new Error("worker registered no fetch handler")
    let responded: Promise<Response> | undefined
    handler({ request: new Request(url), respondWith: (p: Promise<Response>) => void (responded = p) })
    if (!responded) throw new Error(`worker did not respond to ${url}`)
    return await responded
  }

  return { handleFetch, caches, stores, fetched }
}

const html = () => new Response("<!doctype html>", { headers: { "content-type": "text/html" } })
const js = (body = "export default 1") =>
  new Response(body, { headers: { "content-type": "application/javascript" } })

const ASSET = "https://app.test/assets/main-abc123.js"

describe("generated worker: asset requests", () => {
  it("never serves a poisoned HTML entry already sitting in the cache", async () => {
    const worker = loadWorker(() => js())
    // Exactly what a build predating the write guard left behind.
    const cache = await worker.caches.open(CACHE_NAME)
    await cache.put(ASSET, html())

    const response = await worker.handleFetch(ASSET)

    expect(
      response.headers.get("content-type"),
      "the worker replayed a cached SPA fallback for a .js request, which is the " +
        'browser error "Expected a JavaScript-or-Wasm module script but the server ' +
        'responded with a MIME type of text/html"',
    ).toContain("javascript")
  })

  it("evicts the poisoned entry so the cache heals instead of failing forever", async () => {
    const worker = loadWorker(() => js())
    const cache = await worker.caches.open(CACHE_NAME)
    await cache.put(ASSET, html())

    await worker.handleFetch(ASSET)

    const leftover = await worker.caches.match(ASSET)
    const leftoverType = leftover?.headers.get("content-type") ?? ""
    expect(leftoverType, "a poisoned entry survived, so the next load breaks again").not.toContain(
      "text/html",
    )
  })

  it("still serves a genuinely cached asset without hitting the network", async () => {
    const worker = loadWorker(() => js("from network"))
    const cache = await worker.caches.open(CACHE_NAME)
    await cache.put(ASSET, js("from cache"))

    const response = await worker.handleFetch(ASSET)

    expect(await response.text()).toBe("from cache")
    expect(worker.fetched, "cache-first must not go to the network on a hit").toEqual([])
  })

  it("does not store an HTML fallback the network returns for an asset", async () => {
    const worker = loadWorker(() => html())

    await worker.handleFetch(ASSET)

    expect(await worker.caches.match(ASSET)).toBeUndefined()
  })

  it("caches a real asset response from the network", async () => {
    const worker = loadWorker(() => js())

    await worker.handleFetch(ASSET)

    const stored = await worker.caches.match(ASSET)
    expect(stored?.headers.get("content-type")).toContain("javascript")
  })
})

test("the SW source deliberately omits skipWaiting on install (prompt-to-reload)", () => {
  // skipWaiting only appears in the SKIP_WAITING message handler, never at install
  const installBlock = SERVICE_WORKER_SOURCE.slice(
    SERVICE_WORKER_SOURCE.indexOf('addEventListener("install"'),
    SERVICE_WORKER_SOURCE.indexOf('addEventListener("activate"'),
  )
  expect(installBlock).not.toContain("self.skipWaiting")
})
