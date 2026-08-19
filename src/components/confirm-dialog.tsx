"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog"
import { Button } from "./button"
import { AlertTriangle } from "lucide-react"
import { useUiText } from "../lib/ui-text"

// ============================================================================
// Confirm Dialog
// ============================================================================

interface ConfirmDialogState {
  open: boolean
  message: string
  resolve: ((value: boolean) => void) | null
}

const ConfirmContext = React.createContext<{
  confirm: (message: string) => Promise<boolean>
} | null>(null)

function useConfirm() {
  const context = React.useContext(ConfirmContext)
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context.confirm
}

function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const t = useUiText()
  const [state, setState] = React.useState<ConfirmDialogState>({
    open: false,
    message: "",
    resolve: null,
  })

  const confirm = React.useCallback((message: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, message, resolve })
    })
  }, [])

  const resolveRef = React.useRef<((value: boolean) => void) | null>(null)

  React.useEffect(() => {
    resolveRef.current = state.resolve
  }, [state.resolve])

  const handleResponse = React.useCallback((value: boolean) => {
    resolveRef.current?.(value)
    setState({ open: false, message: "", resolve: null })
  }, [])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={state.open} onOpenChange={(open) => { if (!open) { handleResponse(false) } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="size-5 text-amber-500" />
              </div>
              <div>
                <DialogTitle>{t("Confirm Action")}</DialogTitle>
                <DialogDescription className="mt-1">
                  {state.message}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { handleResponse(false) }}>
              {t("Cancel")}
            </Button>
            <Button variant="destructive" onClick={() => { handleResponse(true) }}>
              {t("Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export { ConfirmProvider, useConfirm }
