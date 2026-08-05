"use client"

import * as React from "react"
import { Settings } from "lucide-react"
import { ScenePicker } from "./scene-picker"
import { identityT, type TFn } from "./fhir-record/i18n"
import { Button } from "./button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "./dialog"
import type { Scene } from "../hooks/use-scene"

export interface SettingsDialogProps {
  /** localStorage key for the scene, forwarded to {@link ScenePicker}. */
  sceneStorageKey?: string
  /** Scene to use when nothing is stored yet. */
  defaultScene?: Scene
  /** Hide the background-scene picker, for an app that does not import `scenes.css`. */
  showScenePicker?: boolean
  /** App-specific settings, rendered below the shared ones. */
  children?: React.ReactNode
  /** The app's translate function. Omit it and the English source strings are used verbatim. */
  t?: TFn
  className?: string
}

/**
 * Header button opening the app's settings, carrying the appearance controls every SMART
 * app shares. Pass `children` for app-specific settings; they render below the shared ones.
 *
 * Light/dark lives in {@link ModeToggle} in the header rather than here, so the two
 * controls do not both own the same preference.
 */
function SettingsDialog({
  sceneStorageKey,
  defaultScene,
  showScenePicker = true,
  children,
  t = identityT,
  className,
}: SettingsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={className} aria-label={t("Settings")}>
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Settings")}</DialogTitle>
          <DialogDescription>{t("Preferences for this app, stored on this device.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {showScenePicker && (
            <ScenePicker storageKey={sceneStorageKey} defaultScene={defaultScene} t={t} />
          )}
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { SettingsDialog }
