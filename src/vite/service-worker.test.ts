import { describe, expect, it, test } from "bun:test"
import {
  SERVICE_WORKER_SOURCE,
  BUILD_ID_PLACEHOLDER,
  stampServiceWorker,
  contentDisposition,
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
    location: new URL("https://app.test/"),
    registration: { scope: "https://app.test/" },
  }
  const { caches, stores } = makeCacheStorage()
  const fetched: string[] = []
  const fetch_ = async (request: Request) => {
    fetched.push(urlOf(request))
    return respond(request)
  }

  new Function("self", "caches", "fetch", renderWorker())(worker, caches, fetch_)

  /** Dispatch a fetch; resolves to null when the worker leaves the request to the browser. */
  async function dispatchFetch(url: string, init?: RequestInit): Promise<Response | null> {
    const handler = listeners.get("fetch")
    if (!handler) throw new Error("worker registered no fetch handler")
    let responded: Promise<Response> | undefined
    handler({ request: new Request(url, init), respondWith: (p: Promise<Response>) => void (responded = p) })
    return responded ? await responded : null
  }

  async function handleFetch(url: string): Promise<Response> {
    const response = await dispatchFetch(url)
    if (!response) throw new Error(`worker did not respond to ${url}`)
    return response
  }

  function postMessage(data: unknown, ports: MessagePort[] = []) {
    const handler = listeners.get("message")
    if (!handler) throw new Error("worker registered no message handler")
    handler({ data, ports })
  }

  return { handleFetch, dispatchFetch, postMessage, caches, stores, fetched }
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

describe("generated worker: patient data never reaches Cache Storage", () => {
  it("leaves a cross-origin request (DICOMweb, FHIR) entirely to the browser", async () => {
    const worker = loadWorker(() => new Response("frame"))
    const response = await worker.dispatchFetch("https://api.proxy-smart.com/dicomweb/studies/1/series/2/instances/3/frames/1")
    expect(response).toBeNull()
    expect(worker.stores.size).toBe(0)
  })

  it("does not cache a same-origin request that carries a bearer token", async () => {
    const worker = loadWorker(() => new Response("record"))
    const response = await worker.dispatchFetch("https://app.test/fhir/Patient/1", { headers: { Authorization: "Bearer x" } })
    expect(response).toBeNull()
  })

  it("does not cache a partial (Range) response", async () => {
    const worker = loadWorker(() => new Response("part"))
    expect(await worker.dispatchFetch("https://app.test/video.mp4", { headers: { Range: "bytes=0-99" } })).toBeNull()
  })
})

describe("generated worker: streamed downloads", () => {
  it("serves bytes the page pushes over the port as an attachment", async () => {
    const worker = loadWorker(() => new Response("network"))
    const channel = new MessageChannel()
    const ready = new Promise<string>((resolve) => {
      channel.port1.onmessage = (event: MessageEvent<{ type: string; url: string }>) => resolve(event.data.url)
    })
    worker.postMessage({ type: "STREAM_DOWNLOAD", filename: "Röntgen.zip", contentType: "application/zip" }, [channel.port2])
    const url = await ready

    const chunks = [new TextEncoder().encode("PK"), new TextEncoder().encode("data")]
    channel.port1.onmessage = (event: MessageEvent<{ type: string }>) => {
      if (event.data.type !== "PULL") return
      const chunk = chunks.shift()
      channel.port1.postMessage(chunk ? { type: "CHUNK", chunk } : { type: "END" })
    }

    const response = await worker.handleFetch(url)
    expect(response.headers.get("content-disposition")).toContain("filename*=UTF-8''R%C3%B6ntgen.zip")
    expect(response.headers.get("content-type")).toBe("application/zip")
    expect(await response.text()).toBe("PKdata")
    expect(worker.fetched, "a streamed download never goes to the network").toEqual([])
    channel.port1.close()
  })

  it("answers an unknown or already-used download id with 404", async () => {
    const worker = loadWorker(() => new Response("network"))
    const response = await worker.handleFetch("https://app.test/__stream-download__/nope")
    expect(response.status).toBe(404)
  })
})

test("contentDisposition keeps the real name for modern clients and a safe ASCII one for old ones", () => {
  expect(contentDisposition('Knie "links".zip')).toBe(`attachment; filename="Knie _links_.zip"; filename*=UTF-8''Knie%20%22links%22.zip`)
  expect(contentDisposition("")).toBe(`attachment; filename="download"; filename*=UTF-8''download`)
})

describe("generated worker: navigations", () => {
  it("hands a navigation's own request to fetch, so a sign-in redirect reaches the browser to follow", async () => {
    let seen: Request | undefined
    const worker = loadWorker((request) => {
      seen = request
      return new Response(null, { status: 302, headers: { Location: "https://idp.test/authorize" } })
    })
    const response = await worker.dispatchFetch("https://app.test/dashboard", { redirect: "manual" })
    expect(seen?.redirect).toBe("manual")
    expect(response?.status).toBe(302)
    expect(await worker.caches.match("https://app.test/dashboard")).toBeUndefined()
  })
})

describe("serviceWorkerPlugin", () => {
  async function build(environment: string | undefined, outDir: string) {
    const { serviceWorkerPlugin } = await import("./service-worker")
    const { mkdtemp, readdir } = await import("node:fs/promises")
    const { tmpdir } = await import("node:os")
    const { join } = await import("node:path")
    const written = await mkdtemp(join(tmpdir(), "sw-"))
    const plugin = serviceWorkerPlugin({ cacheName: "app" })
    plugin.configResolved({ build: { ssr: false, outDir } })
    await plugin.writeBundle.call(environment ? { environment: { name: environment } } : {}, { dir: written }, { "assets/a.js": {} })
    return readdir(written)
  }

  it("writes the worker into the directory the bundle is written to", async () => {
    // React Router builds through Vite environments: the client writes to build/client while
    // the top-level config still says dist.
    expect(await build("client", "dist-that-does-not-exist")).toContain("sw.js")
  })

  it("writes nothing for a server environment", async () => {
    expect(await build("ssr", "dist-that-does-not-exist")).not.toContain("sw.js")
  })
})
