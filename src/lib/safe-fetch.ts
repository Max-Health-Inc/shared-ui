import { reportAuthError } from "./auth-error"

export interface SafeFetchOptions extends RequestInit {
  /** Skip auth-error reporting for this request */
  suppressAuthError?: boolean
}

export interface ApiError {
  status: number
  message: string
  body?: unknown
}

class ApiErrorImpl extends Error implements ApiError {
  status: number
  body?: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

/**
 * Centralized fetch wrapper for BFF (backend-for-frontend) apps.
 * Validates responses, extracts error messages, and reports auth errors
 * through the shared auth-error bus.
 *
 * Use this for apps that authenticate via session cookies (AIHR, admin-ui)
 * rather than SMART bearer tokens (use `createAuthFetch` for those).
 *
 * `parse` turns the JSON body into the caller's type, so the response is checked rather than
 * asserted; a 204 hands it `undefined`.
 *
 * @example
 * ```ts
 * const session = await safeFetch("/api/auth/session", parseSessionInfo)
 * ```
 *
 * @throws {ApiError} on non-2xx responses (after reporting to auth-error bus if applicable)
 */
export async function safeFetch<T>(url: string, parse: (body: unknown) => T, init?: SafeFetchOptions): Promise<T> {
  const { suppressAuthError, ...fetchInit } = init ?? {}

  let res: Response
  try {
    res = await fetch(url, fetchInit)
  } catch {
    if (!suppressAuthError) {
      reportAuthError("Unable to reach the server. Check your connection and try again.")
    }
    throw new ApiErrorImpl(0, "Network error", null)
  }

  if (!res.ok) {
    const parsed: unknown = await res.json().catch(() => null)
    const body = isJsonObject(parsed) ? parsed : null

    const message = extractErrorMessage(body, res)

    if (!suppressAuthError && isAuthError(res.status, body)) {
      reportAuthError(message)
    }

    throw new ApiErrorImpl(res.status, message, body)
  }

  if (res.status === 204) return parse(undefined)
  const body: unknown = await res.json()
  return parse(body)
}

/**
 * Non-throwing variant: returns `{ data, error }` instead of throwing.
 * Useful in components that want to handle errors without try/catch.
 */
export async function safeFetchResult(
  url: string,
  init?: SafeFetchOptions,
): Promise<{ data: unknown; error: null } | { data: null; error: ApiError }> {
  try {
    const data = await safeFetch(url, (body) => body, init)
    return { data, error: null }
  } catch (err) {
    if (err instanceof ApiErrorImpl) {
      return { data: null, error: { status: err.status, message: err.message, body: err.body } }
    }
    return { data: null, error: { status: 0, message: "Unknown error" } }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function extractErrorMessage(body: Record<string, unknown> | null, res: Response): string {
  if (!body) return `Unexpected error (HTTP ${String(res.status)})`
  // Standard error shapes from our backends
  if (typeof body.error_description === "string") return body.error_description
  if (typeof body.error === "string") return body.error
  if (typeof body.message === "string") return body.message
  return `Unexpected error (HTTP ${String(res.status)})`
}

function isAuthError(status: number, body: Record<string, unknown> | null): boolean {
  if (status === 401) return true
  if (!body) return false
  const err = typeof body.error === "string" ? body.error.toLowerCase() : ""
  const desc = typeof body.error_description === "string" ? body.error_description.toLowerCase() : ""
  return err.includes("session_expired") || desc.includes("expired") || err.includes("unauthenticated")
}

