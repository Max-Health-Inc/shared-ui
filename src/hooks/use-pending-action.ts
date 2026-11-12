import { useCallback, useEffect, useState } from "react"

export type PendingAction = () => unknown

export interface UsePendingActionReturn {
  pending: boolean
  run: (action?: PendingAction) => Promise<void>
  reset: () => void
}

/** For an action that leaves the page: stays pending once it resolves, clears on rejection or a back/forward-cache restore. */
export function usePendingAction(): UsePendingActionReturn {
  const [pending, setPending] = useState(false)
  const reset = useCallback(() => { setPending(false) }, [])

  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) setPending(false)
    }
    window.addEventListener("pageshow", restore)
    return () => { window.removeEventListener("pageshow", restore) }
  }, [])

  const run = useCallback(async (action?: PendingAction) => {
    setPending(true)
    try {
      await action?.()
    } catch (error) {
      setPending(false)
      throw error
    }
  }, [])

  return { pending, run, reset }
}
