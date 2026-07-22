import { expect, test } from "bun:test"
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

test("the SW source carries the cache-poison guard", () => {
  expect(SERVICE_WORKER_SOURCE).toContain("isHtmlFallback")
  expect(SERVICE_WORKER_SOURCE).toContain("!isHtmlFallback(response)")
})

test("the SW source deliberately omits skipWaiting on install (prompt-to-reload)", () => {
  // skipWaiting only appears in the SKIP_WAITING message handler, never at install
  const installBlock = SERVICE_WORKER_SOURCE.slice(
    SERVICE_WORKER_SOURCE.indexOf('addEventListener("install"'),
    SERVICE_WORKER_SOURCE.indexOf('addEventListener("activate"'),
  )
  expect(installBlock).not.toContain("self.skipWaiting")
})
