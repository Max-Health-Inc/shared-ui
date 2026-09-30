export type ServiceErrorVariant = "unavailable" | "offline" | "unauthorized" | "forbidden" | "notFound" | "generic"

/** The HTTP status an error carries (FhirHttpError, safeFetch's ApiError), read by shape. */
export function errorStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null || !("status" in err)) return undefined
  const { status } = err
  return typeof status === "number" ? status : undefined
}

function browserOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine
}

/** Which error screen fits a failed request. Status 0 is safeFetch's network failure. */
export function serviceErrorVariant(err: unknown, online: boolean = browserOnline()): ServiceErrorVariant {
  if (!online) return "offline"
  const status = errorStatus(err)
  if (status === undefined) return err instanceof TypeError ? "unavailable" : "generic"
  if (status === 401) return "unauthorized"
  if (status === 403) return "forbidden"
  if (status === 404 || status === 410) return "notFound"
  if (status === 0 || status === 408 || status === 429 || status >= 500) return "unavailable"
  return "generic"
}
