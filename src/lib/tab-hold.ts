import { isJsonObject } from "./safe-fetch"

export interface TabHeld<T> {
  value: T
  expiresAt: number
}

export interface TabHoldOptions<T> {
  key: string
  retentionMs: number
  parse: (json: unknown) => T | null
}

export interface TabHoldWrite {
  now?: number
  expiresAt?: number
}

/** A value kept gzipped in this tab's sessionStorage, read as gone once it expires. */
export interface TabHold<T> {
  hold(value: T, write?: TabHoldWrite): Promise<number>
  read(now?: number): Promise<TabHeld<T> | null>
  expiresAt(): number | null
  forget(): void
  forgetOnExpiry(onExpired?: () => void, now?: number): () => void
}

interface Envelope {
  expiresAt: number
  data: string
}

function attempt<T>(run: () => T): T | undefined {
  try {
    return run()
  } catch {
    return undefined
  }
}

const storage = (): Storage | undefined => attempt(() => globalThis.sessionStorage)

async function transform(input: string | Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await new Response(new Blob([input]).stream().pipeThrough(stream)).arrayBuffer())
}

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

const fromBase64 = (text: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(text), (char) => char.charCodeAt(0))

/**
 * Keeps one value for this tab only: gzipped in sessionStorage (or in memory when the tab refuses
 * storage), gone when the tab closes, on `forget`, or once `expiresAt` passes. A hold that is
 * still compressing when `forget` runs is dropped rather than written after it.
 */
export function createTabHold<T>({ key, retentionMs, parse }: TabHoldOptions<T>): TabHold<T> {
  let unstored: string | null = null
  let generation = 0

  const clear = (): void => {
    unstored = null
    attempt(() => storage()?.removeItem(key))
  }

  const envelope = (): Envelope | null => {
    const raw = attempt(() => storage()?.getItem(key)) ?? unstored
    const parsed = raw ? attempt((): unknown => JSON.parse(raw)) : undefined
    if (!isJsonObject(parsed) || typeof parsed.expiresAt !== "number" || typeof parsed.data !== "string") return null
    return { expiresAt: parsed.expiresAt, data: parsed.data }
  }

  const forget = (): void => {
    generation += 1
    clear()
  }

  return {
    async hold(value, write = {}) {
      const started = generation
      const expiresAt = write.expiresAt ?? (write.now ?? Date.now()) + retentionMs
      const data = toBase64(await transform(JSON.stringify(value), new CompressionStream("gzip")))
      if (started !== generation) return expiresAt
      const serialized = JSON.stringify({ expiresAt, data })
      clear()
      const stored = attempt(() => {
        const target = storage()
        target?.setItem(key, serialized)
        return target !== undefined
      })
      if (!stored) unstored = serialized
      return expiresAt
    },

    async read(now = Date.now()) {
      const held = envelope()
      if (!held) return null
      if (held.expiresAt <= now) {
        forget()
        return null
      }
      try {
        const text = new TextDecoder().decode(await transform(fromBase64(held.data), new DecompressionStream("gzip")))
        const value = parse(JSON.parse(text))
        if (value !== null) return { value, expiresAt: held.expiresAt }
      } catch {
        forget()
        return null
      }
      forget()
      return null
    },

    expiresAt: () => envelope()?.expiresAt ?? null,

    forget,

    forgetOnExpiry(onExpired, now = Date.now()) {
      const held = envelope()
      if (!held) return () => undefined
      const timer = setTimeout(() => {
        forget()
        onExpired?.()
      }, Math.max(0, held.expiresAt - now))
      return () => { clearTimeout(timer) }
    },
  }
}
