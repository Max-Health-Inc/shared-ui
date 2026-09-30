import { useState, useEffect } from 'react'

// Minimal inline types for FHIR brand bundle parsing (avoids external dependency)
interface BundleExtensionInner {
  url: string
  valueUrl?: string
}

interface BundleExtension {
  url: string
  extension?: BundleExtensionInner[]
}

interface BundleTelecom {
  system?: string
  value?: string
}

interface BundleEntry {
  resource?: {
    resourceType?: string
    name?: string
    extension?: (BundleExtension | null | undefined)[]
    telecom?: (BundleTelecom | null | undefined)[]
  }
}

export interface BrandInfo {
  name: string
  logoUrl: string | null
  website: string | null
}

function isBundleEntry(value: unknown): value is BundleEntry {
  return typeof value === 'object' && value !== null && 'resource' in value && typeof value.resource === 'object' && value.resource !== null
}

const FALLBACK_BRAND: BrandInfo = { name: 'Proxy Smart', logoUrl: null, website: null }

/** Extract brand name and logo from a User-Access Brand Bundle. */
export function parseBrandBundle(bundle: unknown): BrandInfo {
  const fallback = FALLBACK_BRAND
  if (typeof bundle !== 'object' || bundle === null) return fallback
  const entries: unknown = 'entry' in bundle ? bundle.entry : undefined
  if (!Array.isArray(entries)) return fallback

  const list: readonly unknown[] = entries
  const org = list.filter(isBundleEntry).find(e => e.resource?.resourceType === 'Organization')?.resource
  if (!org) return fallback

  const name = org.name != null && org.name !== "" ? org.name : fallback.name

  let logoUrl: string | null = null
  let website: string | null = null

  if (Array.isArray(org.extension)) {
    const brandExt = org.extension.find(
      (e) => e?.url === 'http://hl7.org/fhir/StructureDefinition/organization-brand'
    )
    if (brandExt) {
      const inner = brandExt.extension
      logoUrl = inner?.find(e => e.url === 'brandLogo')?.valueUrl ?? null
    }
  }

  const telecoms = org.telecom
  if (Array.isArray(telecoms)) {
    website = telecoms.find(t => t?.system === 'url')?.value ?? null
  }

  return { name, logoUrl, website }
}

let cachedBrand: BrandInfo | null = null
let fetchPromise: Promise<BrandInfo> | null = null
let fhirBaseUrl: string | null = null

/** Point branding at the FHIR server the app launches against, whose SMART configuration names the brand bundle. */
export function setBrandingSource(url: string | null): void {
  fhirBaseUrl = url ? url.replace(/\/+$/, '') : null
  cachedBrand = null
}

function brandBundleUrlFrom(config: unknown): string | null {
  if (typeof config !== 'object' || config === null || !('user_access_brand_bundle' in config)) return null
  const url = config.user_access_brand_bundle
  return typeof url === 'string' && url !== '' ? url : null
}

export async function resolveBrandBundleUrl(fetchFn: typeof fetch = fetch): Promise<string> {
  if (!fhirBaseUrl) return '/branding.json'
  try {
    const res = await fetchFn(`${fhirBaseUrl}/.well-known/smart-configuration`, { headers: { Accept: 'application/json' } })
    if (res.ok) {
      const advertised = brandBundleUrlFrom(await res.json())
      if (advertised) return advertised
    }
  } catch {
    // fall through to the server's conventional location
  }
  return new URL('/branding.json', fhirBaseUrl).href
}

function fetchBrand(): Promise<BrandInfo> {
  if (cachedBrand) return Promise.resolve(cachedBrand)
  if (fetchPromise) return fetchPromise

  fetchPromise = resolveBrandBundleUrl()
    .then(url => fetch(url, { headers: { Accept: 'application/fhir+json, application/json' } }))
    .then(res => {
      if (!res.ok) throw new Error(String(res.status))
      return res.json()
    })
    .then(bundle => {
      cachedBrand = parseBrandBundle(bundle)
      return cachedBrand
    })
    .catch(() => {
      cachedBrand = FALLBACK_BRAND
      return cachedBrand
    })
    .finally(() => { fetchPromise = null })

  return fetchPromise
}

/** The User-Access Brand of the FHIR server the app launched against (cached, singleton). */
export function useBranding(): BrandInfo | null {
  const [brand, setBrand] = useState<BrandInfo | null>(cachedBrand)

  useEffect(() => {
    void fetchBrand().then(setBrand)
  }, [])

  return brand
}
