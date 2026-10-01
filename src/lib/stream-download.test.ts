import { describe, expect, it } from "bun:test"
import { prefersBlobDownload, pumpToPort } from "./stream-download"

/** The pump's outcome, captured at once so an early rejection is never unhandled. */
function settle(promise: Promise<void>): Promise<unknown> {
  return promise.then(() => null, (error: unknown) => error)
}

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

/** Plays the worker: pulls until END and collects what the page sent. */
function drainAsWorker(port: MessagePort): Promise<{ text: string; ended: boolean; aborted: string | null }> {
  const decoder = new TextDecoder()
  let text = ""
  return new Promise((resolve) => {
    port.onmessage = (event: MessageEvent<{ type: string; chunk?: Uint8Array; reason?: string }>) => {
      const { type, chunk, reason } = event.data
      if (type === "CHUNK" && chunk) {
        text += decoder.decode(chunk)
        port.postMessage({ type: "PULL" })
      } else if (type === "END") resolve({ text, ended: true, aborted: null })
      else if (type === "ABORT") resolve({ text, ended: false, aborted: reason ?? "" })
    }
    port.postMessage({ type: "PULL" })
  })
}

describe("pumpToPort", () => {
  it("hands every chunk over in order, then END", async () => {
    const channel = new MessageChannel()
    const pumped = pumpToPort(streamOf("PK", "zip", "data"), channel.port1)
    const received = await drainAsWorker(channel.port2)
    await pumped
    expect(received).toEqual({ text: "PKzipdata", ended: true, aborted: null })
    channel.port2.close()
  })

  it("tells the worker when the source fails, so the browser marks the download failed", async () => {
    const channel = new MessageChannel()
    const failing = new ReadableStream<Uint8Array>({
      pull() {
        throw new Error("PACS went away")
      },
    })
    const outcome = settle(pumpToPort(failing, channel.port1))
    const received = await drainAsWorker(channel.port2)
    expect(received.aborted).toBe("PACS went away")
    expect(String(await outcome)).toContain("PACS went away")
    channel.port2.close()
  })

  it("stops reading when the browser cancels the download", async () => {
    const channel = new MessageChannel()
    let cancelled = false
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array([1]))
      },
      cancel() {
        cancelled = true
      },
    })
    const outcome = settle(pumpToPort(endless, channel.port1))
    channel.port2.postMessage({ type: "CANCEL" })
    expect(String(await outcome)).toContain("cancelled")
    expect(cancelled).toBe(true)
    channel.port2.close()
  })

  it("aborts on the page's signal and says so to the worker", async () => {
    const channel = new MessageChannel()
    const controller = new AbortController()
    const outcome = settle(pumpToPort(streamOf("a", "b"), channel.port1, controller.signal))
    const message = new Promise<string>((resolve) => {
      channel.port2.onmessage = (event: MessageEvent<{ type: string }>) => resolve(event.data.type)
    })
    controller.abort()
    expect(await message).toBe("ABORT")
    expect(await outcome).not.toBeNull()
    channel.port2.close()
  })
})

describe("prefersBlobDownload", () => {
  it("falls back to a Blob on Safari, desktop and iOS", () => {
    expect(prefersBlobDownload("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15")).toBe(true)
    expect(prefersBlobDownload("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1")).toBe(true)
  })

  it("streams on Chrome, Edge, Firefox and Android, whose user agents also say Safari", () => {
    expect(prefersBlobDownload("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36")).toBe(false)
    expect(prefersBlobDownload("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0")).toBe(false)
    expect(prefersBlobDownload("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0")).toBe(false)
    expect(prefersBlobDownload("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36")).toBe(false)
  })
})
