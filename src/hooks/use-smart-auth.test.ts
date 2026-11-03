import { describe, expect, test } from "bun:test"
import { authorizationRefusalOf, deepLinkOf, displayNameFromIdToken, restorableDeepLink, trustedRefusalUri } from "./use-smart-auth"

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

describe("deepLinkOf without one-time launch params", () => {
  test("keeps the study query but drops launch and iss, which are spent by the EHR launch", () => {
    expect(
      deepLinkOf(
        { pathname: "/", search: "?StudyInstanceUID=1.2&mode=3d&launch=abc&iss=https%3A%2F%2Ffhir", hash: "" },
        ["launch", "iss"],
      ),
    ).toBe("/?StudyInstanceUID=1.2&mode=3d")
  })

  test("leaves no dangling question mark when nothing else remains", () => {
    expect(deepLinkOf({ pathname: "/viewer", search: "?launch=abc&iss=x", hash: "#h" }, ["launch", "iss"])).toBe("/viewer#h")
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

describe("authorizationRefusalOf", () => {
  test("reads the code, the server's description and its page", () => {
    expect(authorizationRefusalOf("?error=access_denied&error_description=Not+linked&error_uri=https%3A%2F%2Fa.example%2Fsetup&state=x"))
      .toEqual({ error: "access_denied", description: "Not linked", uri: "https://a.example/setup" })
  })

  test("keeps the bare code when the server said nothing more", () => {
    expect(authorizationRefusalOf("?error=access_denied&state=x")).toEqual({ error: "access_denied" })
  })

  test("is null on a successful callback or an ordinary page", () => {
    expect(authorizationRefusalOf("?code=abc&state=x")).toBeNull()
    expect(authorizationRefusalOf("")).toBeNull()
  })
})

describe("trustedRefusalUri", () => {
  const origin = "https://account.example"
  const refusalTo = (uri: string) => ({ error: "access_denied", uri })

  test("follows a page on a trusted origin", () => {
    expect(trustedRefusalUri(refusalTo(`${origin}/setup?x=1`), [origin])).toBe(`${origin}/setup?x=1`)
  })

  test.each([
    ["another origin", "https://elsewhere.example/setup"],
    ["plain http on the trusted host", `http://${new URL(origin).host}/setup`],
    ["a script URL", "javascript:alert(1)"],
    ["no URL at all", "not a url"],
  ])("refuses %s", (_label, uri) => {
    expect(trustedRefusalUri(refusalTo(uri), [origin])).toBeUndefined()
  })

  test("has nothing to follow without a refusal or a page", () => {
    expect(trustedRefusalUri(null, [origin])).toBeUndefined()
    expect(trustedRefusalUri({ error: "access_denied" }, [origin])).toBeUndefined()
  })
})
