"use client"

import { useCallback, useEffect, useState } from "react"
import { useUiText, type TFn } from "../../lib/ui-text"

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export interface BillingReturnFlag {
  param: string
  success: string
  cancel: string
}

export type BillingNotice = "success" | "cancel"

export function readBillingReturn(search: string, flag: BillingReturnFlag): BillingNotice | null {
  const value = new URLSearchParams(search).get(flag.param)
  if (value === flag.success) return "success"
  if (value === flag.cancel) return "cancel"
  return null
}

export function withoutBillingReturn(href: string, param: string): string | null {
  const url = new URL(href)
  if (!url.searchParams.has(param)) return null
  url.searchParams.delete(param)
  return url.toString()
}

function errorOf(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || !("error" in body)) return undefined
  return typeof body.error === "string" ? body.error : undefined
}

function urlOf(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || !("url" in body)) return undefined
  return typeof body.url === "string" ? body.url : undefined
}

export async function requestRedirect(
  fetchImpl: FetchLike,
  path: string,
  body: unknown,
): Promise<{ url: string } | { error: string }> {
  try {
    const res = await fetchImpl(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json: unknown = await res.json().catch(() => null)
    const url = urlOf(json)
    if (res.ok && url) return { url }
    return { error: errorOf(json) ?? `HTTP ${String(res.status)}` }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export interface UseBillingRedirectOptions {
  fetch?: FetchLike
  returnFlag?: BillingReturnFlag
  t?: TFn
}

export interface BillingRedirect {
  notice: BillingNotice | null
  busy: string | null
  error: string | null
  redirect: (path: string, body: unknown, key: string, fallbackUrl?: string) => Promise<void>
}

const plainFetch: FetchLike = (url, init) => fetch(url, init)

export function useBillingRedirect({ fetch: fetchImpl = plainFetch, returnFlag, t: appT }: UseBillingRedirectOptions = {}): BillingRedirect {
  const t = useUiText(appT)
  const [notice] = useState<BillingNotice | null>(() =>
    returnFlag && typeof window !== "undefined" ? readBillingReturn(window.location.search, returnFlag) : null,
  )
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const param = returnFlag?.param

  useEffect(() => {
    if (!param) return
    const stripped = withoutBillingReturn(window.location.href, param)
    if (stripped) window.history.replaceState(window.history.state, "", stripped)
  }, [param])

  const redirect = useCallback(async (path: string, body: unknown, key: string, fallbackUrl?: string) => {
    setBusy(key)
    setError(null)
    const result = await requestRedirect(fetchImpl, path, body)
    if ("url" in result) {
      window.location.href = result.url
      return
    }
    if (fallbackUrl) {
      window.location.href = fallbackUrl
      return
    }
    setError(result.error || t("Something went wrong. Please try again."))
    setBusy(null)
  }, [fetchImpl, t])

  return { notice, busy, error, redirect }
}
