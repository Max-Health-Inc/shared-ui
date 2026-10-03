import { describe, expect, test } from "bun:test"
import { deepLinkOf, displayNameFromIdToken, restorableDeepLink } from "./use-smart-auth"

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

describe("deepLinkOf", () => {
  test("keeps the path, so sign-in returns to the page it left rather than the callback", () => {
    expect(deepLinkOf({ pathname: "/admin", search: "", hash: "" })).toBe("/admin")
  })

  test("keeps the fragment as well as the query, so a code in the hash survives sign-in", () => {
    expect(deepLinkOf({ pathname: "/", search: "?tab=records", hash: "#medicare-import=abc" })).toBe("/?tab=records#medicare-import=abc")
    expect(deepLinkOf({ pathname: "/app/", search: "", hash: "#medicare-import=abc" })).toBe("/app/#medicare-import=abc")
  })
})

describe("restorableDeepLink", () => {
  test("restores a saved same-origin path", () => {
    expect(restorableDeepLink("/admin?x=1#y", "/callback")).toBe("/admin?x=1#y")
  })

  test("falls back to the current path when nothing usable was saved", () => {
    expect(restorableDeepLink(null, "/callback")).toBe("/callback")
    expect(restorableDeepLink("//evil.example/x", "/callback")).toBe("/callback")
    expect(restorableDeepLink("/\\evil.example", "/callback")).toBe("/callback")
    expect(restorableDeepLink("https://evil.example/", "/callback")).toBe("/callback")
  })
})
