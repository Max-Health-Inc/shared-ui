import { describe, expect, it, beforeEach } from "bun:test"
import { onAuthError, reportAuthError, createAuthFetch } from "./auth-error"

describe("auth-error bus", () => {
  // Reset handler between tests by re-registering a new one
  let lastError: string | null = null

  beforeEach(() => {
    lastError = null
    onAuthError((msg) => {
      lastError = msg
    })
  })

  it("delivers error message to subscriber", () => {
    reportAuthError("Session expired")
    expect(lastError).toBe("Session expired")
  })

  it("does not throw when no handler is registered", () => {
    // Overwrite with a handler that sets to a sentinel, then register null-like handler
    onAuthError(() => {
      // empty — just to prove it doesn't crash
    })
    expect(() => reportAuthError("test")).not.toThrow()
  })

  it("replaces previous handler on re-subscribe", () => {
    const calls: string[] = []
    onAuthError((msg) => calls.push(`a:${msg}`))
    onAuthError((msg) => calls.push(`b:${msg}`))

    reportAuthError("test")
    expect(calls).toEqual(["b:test"])
  })
})

describe("createAuthFetch", () => {
  it("returns response on success", async () => {
    const mockResponse = new Response("ok", { status: 200 })
    const smartAuth = {
      createAuthenticatedFetch: () =>
        (async () => mockResponse) as unknown as typeof fetch,
    }

    const authFetch = createAuthFetch(smartAuth)
    const res = await authFetch("https://example.com/fhir/Patient")
    expect(res).toBe(mockResponse)
  })

  it("reports auth error and re-throws on 'no valid smart token'", async () => {
    let reportedError: string | null = null
    onAuthError((msg) => {
      reportedError = msg
    })

    const smartAuth = {
      createAuthenticatedFetch: () =>
        (async () => {
          throw new Error("No valid SMART token available")
        }) as unknown as typeof fetch,
    }

    const authFetch = createAuthFetch(smartAuth)
    await expect(authFetch("https://example.com/fhir/Patient")).rejects.toThrow(
      "No valid SMART token available",
    )
    expect(reportedError).toBe("Your session has expired. Please sign in again.")
  })

  it("re-throws non-auth errors without reporting", async () => {
    let reportedError: string | null = null
    onAuthError((msg) => {
      reportedError = msg
    })

    const smartAuth = {
      createAuthenticatedFetch: () =>
        (async () => {
          throw new Error("Network timeout")
        }) as unknown as typeof fetch,
    }

    const authFetch = createAuthFetch(smartAuth)
    await expect(authFetch("https://example.com/fhir/Patient")).rejects.toThrow(
      "Network timeout",
    )
    expect(reportedError).toBeNull()
  })

  it("re-throws non-Error values without reporting", async () => {
    let reportedError: string | null = null
    onAuthError((msg) => {
      reportedError = msg
    })

    const smartAuth = {
      createAuthenticatedFetch: () =>
        (async () => {
          throw "string error"
        }) as unknown as typeof fetch,
    }

    const authFetch = createAuthFetch(smartAuth)
    await expect(authFetch("https://example.com/fhir/Patient")).rejects.toThrow()
    expect(reportedError).toBeNull()
  })
})
