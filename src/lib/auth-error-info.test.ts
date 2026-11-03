import { describe, expect, test } from "bun:test"
import { AUTH_ERRORS, classifyAuthError } from "./auth-error-info"

describe("classifyAuthError", () => {
  test("reads a refusal by its code, whatever the server wrote", () => {
    const description = "This account is not yet linked to a patient record."
    expect(classifyAuthError(description, { error: "access_denied", description })).toBe(AUTH_ERRORS.accessDenied)
    expect(classifyAuthError("network", { error: "unauthorized_client" })).toBe(AUTH_ERRORS.misconfigured)
  })

  test("does not guess at a refusal code it does not know, even when its text would match", () => {
    expect(classifyAuthError("network down", { error: "temporarily_unavailable" })).toBe(AUTH_ERRORS.unknown)
  })

  test.each([
    ["Failed to fetch", AUTH_ERRORS.connection],
    ["The request timed out", AUTH_ERRORS.timedOut],
    ["token endpoint said invalid_client", AUTH_ERRORS.misconfigured],
    ["callback said access_denied", AUTH_ERRORS.accessDenied],
    ["state mismatch", AUTH_ERRORS.unknown],
  ])("reads a thrown error %j by its text", (error, kind) => {
    expect(classifyAuthError(error)).toBe(kind)
  })
})
