"use client"

import { useScene, SCENES, type Scene } from "../hooks/use-scene"
// `TFn` lives under fhir-record/ for historical reasons but is a generic
// "optional translate function" contract, re-exported from the package root.
// Reused here rather than declaring a second identical type.
import { identityT, type TFn } from "./fhir-record/i18n"
import { cn } from "../lib/utils"
import { Label } from "./label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select"

export interface ScenePickerProps {
  /** localStorage key used to persist the active scene. @default "scene" */
  storageKey?: string
  /** Scene to use when nothing is stored yet. @default "perspective-grid" */
  defaultScene?: Scene
  /** Render the label + description above the select. @default true */
  showLabel?: boolean
  /** Overrides the default label text. */
  label?: string
  /** Overrides the default description text. Pass `null` to omit it. */
  description?: string | null
  /**
   * The app's translate function. Omit it and the English source strings are used
   * verbatim — react-i18next is an optional peer dependency of this package, so
   * this component never imports it (see `LanguageSwitcher`, which is exported
   * only from the `/i18n` subpath for that reason).
   */
  t?: TFn
  className?: string
}

const DEFAULT_LABEL = "Background Theme"
const DEFAULT_DESCRIPTION = "Choose the 3D background effect for the application."

/**
 * Select for the background scene, backed by {@link useScene}.
 *
 * Owns the hook call, so dropping it into a settings screen is all an app needs to
 * offer scene switching:
 *
 * ```tsx
 * <ScenePicker storageKey="aihr-scene" />
 * ```
 *
 * Renders the control and its labelling only — the surrounding card/section is the
 * app's own chrome. Requires `@max-health-inc/shared-ui/scenes.css` to be imported
 * for the scenes to have any visible effect.
 */
function ScenePicker({
  storageKey,
  defaultScene,
  showLabel = true,
  label,
  description,
  t = identityT,
  className,
}: ScenePickerProps) {
  const { scene, setScene } = useScene({ storageKey, defaultScene })

  const labelText = label ?? t(DEFAULT_LABEL)
  const descriptionText =
    description === null ? null : (description ?? t(DEFAULT_DESCRIPTION))

  return (
    <div className={cn("space-y-3", className)}>
      {showLabel && (
        <div className="space-y-1">
          <Label className="text-sm font-medium">{labelText}</Label>
          {descriptionText && (
            <p className="text-xs text-muted-foreground">{descriptionText}</p>
          )}
        </div>
      )}
      <Select
        value={scene}
        onValueChange={(value) => {
          setScene(value as Scene)
        }}
      >
        <SelectTrigger className="w-full" aria-label={labelText}>
          <SelectValue placeholder={t("Select a theme")} />
        </SelectTrigger>
        <SelectContent>
          {SCENES.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              <span className="flex items-center gap-2">
                <span className="font-medium">{t(option.name)}</span>
                <span className="text-xs text-muted-foreground">
                  — {t(option.description)}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export { ScenePicker }
