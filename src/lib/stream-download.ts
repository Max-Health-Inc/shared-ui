/**
 * Save a stream as a real browser download: it shows in the download list from the first byte,
 * with live progress, instead of appearing as a finished Blob after everything is in memory.
 *
 * Works through the canonical service worker (src/vite/service-worker.js): the page hands the
 * stream over a MessagePort, a hidden frame navigates to the URL the worker returns, and the
 * worker answers with an attachment whose body pulls chunks from the page. Without an active
 * worker (first visit, dev server) or on Safari, where worker-streamed downloads are unreliable,
 * it falls back to collecting the stream into a Blob.
 */

export interface StreamDownloadOptions {
  contentType?: string
  /** Total bytes, when known; lets the browser show a percentage instead of a running count. */
  size?: number
  signal?: AbortSignal
}

export type StreamDownloadMode = "native" | "blob"

/** The slice of MessagePort the pump needs, so it can be exercised without a worker. */
export interface DownloadPort {
  postMessage(message: unknown, transfer?: Transferable[]): void
  onmessage: ((event: MessageEvent) => void) | null
  close(): void
}

const HANDSHAKE_TIMEOUT_MS = 2000
const OBJECT_URL_REVOKE_DELAY_MS = 60_000
const FRAME_REMOVE_DELAY_MS = 60_000

function ownBuffer(chunk: Uint8Array): Uint8Array<ArrayBuffer> {
  return chunk.buffer instanceof ArrayBuffer && chunk.byteOffset === 0 && chunk.byteLength === chunk.buffer.byteLength
    ? new Uint8Array(chunk.buffer)
    : new Uint8Array(chunk)
}

function abortReason(signal: AbortSignal | undefined): Error {
  return signal?.reason instanceof Error ? signal.reason : new DOMException("Download aborted", "AbortError")
}

/**
 * Answer the worker's PULL messages from `stream` until it ends, errors or is cancelled.
 * Resolves once the last chunk is handed over; rejects when the source fails or is aborted.
 */
export function pumpToPort(stream: ReadableStream<Uint8Array>, port: DownloadPort, signal?: AbortSignal): Promise<void> {
  const reader = stream.getReader()
  return new Promise<void>((resolve, reject) => {
    const finish = (error?: unknown) => {
      port.onmessage = null
      signal?.removeEventListener("abort", onAbort)
      port.close()
      if (error === undefined) resolve()
      else reject(error instanceof Error ? error : new Error("Download failed"))
    }
    const onAbort = () => {
      const reason = abortReason(signal)
      port.postMessage({ type: "ABORT", reason: reason.message })
      void reader.cancel(reason).catch(() => undefined)
      finish(reason)
    }
    if (signal?.aborted) {
      onAbort()
      return
    }
    signal?.addEventListener("abort", onAbort, { once: true })

    port.onmessage = (event: MessageEvent) => {
      const data: unknown = event.data
      const type = typeof data === "object" && data !== null && "type" in data ? data.type : null
      if (type === "CANCEL") {
        void reader.cancel().catch(() => undefined)
        finish(new DOMException("Download cancelled", "AbortError"))
        return
      }
      if (type !== "PULL") return
      reader.read().then(
        ({ done, value }) => {
          if (done) {
            port.postMessage({ type: "END" })
            finish()
            return
          }
          const chunk = ownBuffer(value)
          port.postMessage({ type: "CHUNK", chunk }, [chunk.buffer])
        },
        (error: unknown) => {
          port.postMessage({ type: "ABORT", reason: error instanceof Error ? error.message : String(error) })
          finish(error)
        },
      )
    }
  })
}

/** Safari (desktop and iOS) does not reliably download a worker-streamed response. */
export function prefersBlobDownload(userAgent: string): boolean {
  return /safari/i.test(userAgent) && !/chrome|chromium|crios|fxios|edg|android/i.test(userAgent)
}

function handshake(worker: ServiceWorker, filename: string, options: StreamDownloadOptions): Promise<{ url: string; port: MessagePort } | null> {
  const channel = new MessageChannel()
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      channel.port1.onmessage = null
      channel.port1.close()
      resolve(null)
    }, HANDSHAKE_TIMEOUT_MS)
    channel.port1.onmessage = (event: MessageEvent) => {
      const data: unknown = event.data
      if (typeof data !== "object" || data === null || !("type" in data) || data.type !== "READY" || !("url" in data) || typeof data.url !== "string") return
      clearTimeout(timer)
      resolve({ url: data.url, port: channel.port1 })
    }
    worker.postMessage(
      { type: "STREAM_DOWNLOAD", filename, contentType: options.contentType, size: options.size },
      [channel.port2],
    )
  })
}

function openInHiddenFrame(url: string): void {
  const frame = document.createElement("iframe")
  frame.hidden = true
  frame.src = url
  document.body.appendChild(frame)
  setTimeout(() => {
    frame.remove()
  }, FRAME_REMOVE_DELAY_MS)
}

async function saveAsBlob(stream: ReadableStream<Uint8Array>, filename: string, contentType: string | undefined, signal?: AbortSignal): Promise<void> {
  const parts: Uint8Array<ArrayBuffer>[] = []
  const reader = stream.getReader()
  for (let next = await reader.read(); !next.done; next = await reader.read()) {
    if (signal?.aborted) {
      await reader.cancel(abortReason(signal)).catch(() => undefined)
      throw abortReason(signal)
    }
    parts.push(ownBuffer(next.value))
  }
  const url = URL.createObjectURL(new Blob(parts, { type: contentType ?? "application/octet-stream" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, OBJECT_URL_REVOKE_DELAY_MS)
}

/** Download `stream` as `filename`; resolves with how it was saved once the last byte is handed over. */
export async function streamDownload(
  stream: ReadableStream<Uint8Array>,
  filename: string,
  options: StreamDownloadOptions = {},
): Promise<StreamDownloadMode> {
  const worker = typeof navigator !== "undefined" && "serviceWorker" in navigator ? navigator.serviceWorker.controller : null
  if (worker && !prefersBlobDownload(navigator.userAgent)) {
    const session = await handshake(worker, filename, options)
    if (session) {
      const pumped = pumpToPort(stream, session.port, options.signal)
      openInHiddenFrame(session.url)
      await pumped
      return "native"
    }
  }
  await saveAsBlob(stream, filename, options.contentType, options.signal)
  return "blob"
}
