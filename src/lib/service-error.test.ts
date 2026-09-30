import { describe, expect, it } from "bun:test"
import { errorStatus, serviceErrorVariant } from "./service-error"

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`GET Patient/1: ${String(status)}`)
  }
}

describe("errorStatus", () => {
  it("reads a numeric status off any error shape", () => {
    expect(errorStatus(new HttpError(503))).toBe(503)
    expect(errorStatus({ status: 404, message: "x" })).toBe(404)
  })

  it("is undefined when there is no numeric status", () => {
    expect(errorStatus(new Error("GET Patient/1: 503"))).toBeUndefined()
    expect(errorStatus({ status: "503" })).toBeUndefined()
    expect(errorStatus(null)).toBeUndefined()
    expect(errorStatus("503")).toBeUndefined()
  })
})

describe("serviceErrorVariant", () => {
  const online = true

  it("maps HTTP statuses to the screen the user needs", () => {
    expect(serviceErrorVariant(new HttpError(503), online)).toBe("unavailable")
    expect(serviceErrorVariant(new HttpError(502), online)).toBe("unavailable")
    expect(serviceErrorVariant(new HttpError(429), online)).toBe("unavailable")
    expect(serviceErrorVariant(new HttpError(401), online)).toBe("unauthorized")
    expect(serviceErrorVariant(new HttpError(403), online)).toBe("forbidden")
    expect(serviceErrorVariant(new HttpError(404), online)).toBe("notFound")
    expect(serviceErrorVariant(new HttpError(410), online)).toBe("notFound")
    expect(serviceErrorVariant(new HttpError(400), online)).toBe("generic")
  })

  it("treats safeFetch's status 0 and a fetch TypeError as unreachable", () => {
    expect(serviceErrorVariant({ status: 0 }, online)).toBe("unavailable")
    expect(serviceErrorVariant(new TypeError("Failed to fetch"), online)).toBe("unavailable")
  })

  it("says offline whenever the browser is, whatever the error", () => {
    expect(serviceErrorVariant(new HttpError(503), false)).toBe("offline")
    expect(serviceErrorVariant(new Error("x"), false)).toBe("offline")
  })

  it("falls back to generic for an error without a status", () => {
    expect(serviceErrorVariant(new Error("boom"), online)).toBe("generic")
  })
})
