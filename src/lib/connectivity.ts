export interface Connectivity {
  isOnline(): boolean
  whenOnline(signal?: AbortSignal): Promise<void>
}

interface OnlineStatus {
  readonly onLine: boolean
}

interface OnlineEvents {
  addEventListener(type: "online", listener: () => void): void
  removeEventListener(type: "online", listener: () => void): void
}

/** Connectivity read from `status.onLine`, waiting on `events`' "online" event. */
export function connectivityOf(status: OnlineStatus | undefined, events: OnlineEvents | undefined): Connectivity {
  const isOnline = () => status?.onLine !== false
  return {
    isOnline,
    whenOnline: (signal) =>
      new Promise((resolve) => {
        if (isOnline() || signal?.aborted || !events) {
          resolve()
          return
        }
        const done = () => {
          events.removeEventListener("online", done)
          signal?.removeEventListener("abort", done)
          resolve()
        }
        events.addEventListener("online", done)
        signal?.addEventListener("abort", done)
      }),
  }
}

export const browserConnectivity: Connectivity = connectivityOf(
  typeof navigator === "undefined" ? undefined : navigator,
  typeof window === "undefined" ? undefined : window,
)
