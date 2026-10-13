"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

import { cn } from "../lib/utils"
import { uiText } from "../lib/ui-text"
import { useModalLayer, LayerContext } from "../hooks/use-modal-stack"
import { Dialog, DialogClose, DialogDescription, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from "./dialog"

const SIDE_CLASSES = {
  left: "inset-y-0 left-0 h-full w-[85vw] max-w-sm border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  right: "inset-y-0 right-0 h-full w-[85vw] max-w-sm border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
} as const

/**
 * A panel that slides in from a screen edge: a sidebar that has no room on a phone. Built on
 * {@link Dialog}, so focus trapping, Escape, the overlay and modal stacking behave the same.
 */
function SheetContent({
  side = "left",
  className,
  children,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: keyof typeof SIDE_CLASSES }) {
  const zIndex = useModalLayer()
  const layerStyle = zIndex !== undefined ? { ...style, zIndex } : style

  return (
    <DialogPortal>
      <DialogOverlay style={zIndex !== undefined ? { zIndex } : undefined} />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 overflow-y-auto bg-background p-4 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
          SIDE_CLASSES[side],
          className,
        )}
        style={layerStyle}
        {...props}
      >
        <LayerContext.Provider value={zIndex}>{children}</LayerContext.Provider>
        <DialogPrimitive.Close
          data-slot="sheet-close"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">{uiText("Close")}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export {
  Dialog as Sheet,
  DialogTrigger as SheetTrigger,
  DialogClose as SheetClose,
  DialogTitle as SheetTitle,
  DialogDescription as SheetDescription,
  SheetContent,
}
