import { describe, expect, test } from "bun:test"
import { displayNameFromIdToken } from "./use-smart-auth"

/** Build an id_token whose payload is base64url, UNPADDED — the shape a real IdP emits. */
function idTokenFor(payload: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  const b64url = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return `header.${b64url}.signature`
}

describe("displayNameFromIdToken", () => {
  test("decodes a non-ASCII name from an unpadded base64url payload", () => {
    // The regression: no padding + non-ASCII once returned undefined / mojibake.
    expect(displayNameFromIdToken(idTokenFor({ name: "Ærøskøbing Klinik" }))).toBe("Ærøskøbing Klinik")
  })

  test("prefers name, then preferred_username, then email", () => {
    expect(displayNameFromIdToken(idTokenFor({ name: "A", preferred_username: "b", email: "c@d" }))).toBe("A")
    expect(displayNameFromIdToken(idTokenFor({ preferred_username: "b", email: "c@d" }))).toBe("b")
    expect(displayNameFromIdToken(idTokenFor({ email: "c@d" }))).toBe("c@d")
  })

  test("returns undefined when no name-like claim, when blank, and for malformed input", () => {
    expect(displayNameFromIdToken(idTokenFor({ sub: "123" }))).toBeUndefined()
    expect(displayNameFromIdToken(idTokenFor({ name: "   " }))).toBeUndefined()
    expect(displayNameFromIdToken(undefined)).toBeUndefined()
    expect(displayNameFromIdToken("not-a-jwt")).toBeUndefined()
  })
})
