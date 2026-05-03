import { useState, useEffect } from 'react'

// Minimal inline types for FHIR brand bundle parsing (avoids external dependency)
interface BundleEntry {
  resource?: {
    resourceType?: string
    name?: string
    extension?: Array<{ url: string; extension?: Array<{ url: string; valueUrl?: string }> }>
    telecom?: Array<{ system?: string; value?: string }>
  }
}

interface BrandBundle {
  entry?: BundleEntry[]
}

export interface BrandInfo {
  name: string
  logoUrl: string | null
  website: string | null
}

/** Extract brand name and logo from the /branding.json FHIR Bundle */
function parseBrandBundle(bundle: BrandBundle): BrandInfo {
  const fallback: BrandInfo = { name: 'Proxy Smart', logoUrl: null, website: null }
  const entries = bundle.entry
  if (!Array.isArray(entries)) return fallback

  const org = entries.find(e => e.resource?.resourceType === 'Organization')?.resource
  if (!org) return fallback

  const name = org.name || fallback.name

  let logoUrl: string | null = null
  let website: string | null = null

  if (Array.isArray(org.extension)) {
    const brandExt = org.extension.find(
      (e) => e.url === 'http://hl7.org/fhir/StructureDefinition/organization-brand'
    )
    if (brandExt) {
      const inner = brandExt.extension
      logoUrl = inner?.find(e => e.url === 'brandLogo')?.valueUrl ?? null
    }
  }

  const telecoms = org.telecom
  if (Array.isArray(telecoms)) {
    website = telecoms.find(t => t.system === 'url')?.value ?? null
  }

  return { name, logoUrl, website }
}

let cachedBrand: BrandInfo | null = null
let fetchPromise: Promise<BrandInfo> | null = null

function fetchBrand(): Promise<BrandInfo> {
  if (cachedBrand) return Promise.resolve(cachedBrand)
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('/branding.json')
    .then(res => {
      if (!res.ok) throw new Error(`${res.status}`)
      return res.json()
    })
    .then(bundle => {
      cachedBrand = parseBrandBundle(bundle)
      return cachedBrand
    })
    .catch(() => {
      cachedBrand = { name: 'Proxy Smart', logoUrl: null, website: null }
      return cachedBrand
    })
    .finally(() => { fetchPromise = null })

  return fetchPromise
}

/** Fetch brand info from /branding.json (cached, singleton) */
export function useBranding(): BrandInfo | null {
  const [brand, setBrand] = useState<BrandInfo | null>(cachedBrand)

  useEffect(() => {
    fetchBrand().then(setBrand)
  }, [])

  return brand
}
