"use client"

import * as React from "react"

const DEFAULT_Z_INDEX = 50
const Z_INDEX_INCREMENT = 10

type NextZIndexFn = () => number

const ModalStackContext = React.createContext<NextZIndexFn | null>(null)

/** The enclosing dialog's z-index, so portaled dropdowns, selects and tooltips render above its overlay. */
const LayerContext = React.createContext<number | undefined>(undefined)

interface ModalStackProviderProps {
  children: React.ReactNode
  /** Base z-index for the first modal. Defaults to 50. */
  baseZIndex?: number
}

/** Wrap the app root so each shared-ui dialog opens above the previous one; without it dialogs use z-50. */
function ModalStackProvider({ children, baseZIndex = DEFAULT_Z_INDEX }: ModalStackProviderProps) {
  const counterRef = React.useRef(baseZIndex)

  const nextZIndex = React.useCallback(() => {
    counterRef.current += Z_INDEX_INCREMENT
    return counterRef.current
  }, [])

  return (
    <ModalStackContext.Provider value={nextZIndex}>
      {children}
    </ModalStackContext.Provider>
  )
}

/** A z-index above every previously opened dialog, fixed at mount; `undefined` outside a provider. */
function useModalLayer(): number | undefined {
  const nextZIndex = React.useContext(ModalStackContext)
  const [zIndex] = React.useState(() => nextZIndex !== null ? nextZIndex() : undefined)
  return zIndex
}

/** One above the enclosing dialog's layer for portaled popovers; `undefined` outside a dialog. */
function useLayerZIndex(): number | undefined {
  const parentZ = React.useContext(LayerContext)
  return parentZ !== undefined ? parentZ + 1 : undefined
}

export {
  ModalStackProvider,
  useModalLayer,
  useLayerZIndex,
  LayerContext,
  ModalStackContext,
  DEFAULT_Z_INDEX,
  Z_INDEX_INCREMENT,
  type ModalStackProviderProps,
}
