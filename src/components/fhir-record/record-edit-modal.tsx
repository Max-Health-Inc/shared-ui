import { useState, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../dialog"
import { Button } from "../button"
import { Input } from "../input"
import { Label } from "../label"
import { Badge } from "../badge"
import { Loader2, Pencil, Save, X, AlertTriangle } from "lucide-react"
import { asDisplayString, getByPath, getEditableFields, setByPath } from "./editable-fields"
import type { FhirRecordClient } from "./client"
import { identityT, type TFn } from "./i18n"
import { isResourceVerified, markAsProvisional, type VerifiableResource } from "../../lib/fhir-verification"

export interface RecordEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  resource: VerifiableResource | null
  /** Injected authenticated FHIR client (uses `.update`). */
  client: FhirRecordClient
  /** Called after a successful save with the server's updated resource. */
  onSaved: (updated: VerifiableResource) => void
  /** Practitioner edits keep the record verified; patient edits downgrade it. */
  isPractitioner?: boolean
  t?: TFn
}

/**
 * Edit the whitelisted fields of a FHIR resource. A patient editing a verified
 * record downgrades it to `provisional` (snapshotting the original for revert);
 * a practitioner's edit stays verified. All verification bookkeeping is delegated
 * to the shared verification model.
 */
export function RecordEditModal({
  open, onOpenChange, resource, client, onSaved, isPractitioner = false, t = identityT,
}: RecordEditModalProps) {
  const resourceType = typeof resource?.resourceType === "string" ? resource.resourceType : undefined
  const fields = useMemo(() => getEditableFields(resourceType), [resourceType])

  const [editValues, setEditValues] = useState<Record<string, string>>(() => {
    if (!resource || !fields.length) return {}
    const vals: Record<string, string> = {}
    for (const f of fields) {
      vals[f.path] = asDisplayString(getByPath(resource, f.path))
    }
    return vals
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wasVerified = resource ? isResourceVerified(resource) : false
  const willDowngrade = wasVerified && !isPractitioner

  const handleSave = useCallback(async () => {
    if (!resource) return
    setSaving(true)
    setError(null)
    try {
      let updated: VerifiableResource = structuredClone(resource)
      for (const f of fields) {
        const val = editValues[f.path]
        const coerced = f.type === "number" ? (val === "" ? undefined : Number(val)) : (val === "" ? undefined : val)
        updated = setByPath(updated, f.path, coerced)
      }
      if (willDowngrade) updated = markAsProvisional(updated, resource)

      const result = await client.update(updated)
      onSaved(result)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Failed to save changes"))
    } finally {
      setSaving(false)
    }
  }, [resource, fields, editValues, willDowngrade, client, onSaved, onOpenChange, t])

  if (!resource || !fields.length) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-4" />
            {t("Edit {{resourceType}}", { resourceType: resourceType ?? "" })}
          </DialogTitle>
          <DialogDescription>
            {willDowngrade && (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mt-1">
                <AlertTriangle className="size-3.5" />
                {t("This record is verified. Your changes will be saved as provisional until re-verified.")}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          {willDowngrade && (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              {t("Pending review after save")}
            </Badge>
          )}
          {fields.map((f) => (
            <div key={f.path} className="space-y-1.5">
              <Label className="text-sm">{t(f.label)}</Label>
              <Input
                type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                value={editValues[f.path] ?? ""}
                onChange={(e) => { setEditValues((prev) => ({ ...prev, [f.path]: e.target.value })) }}
                className="text-sm"
              />
            </div>
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => { onOpenChange(false) }} disabled={saving}>
            <X className="size-4 mr-1" />{t("Cancel")}
          </Button>
          <Button size="sm" onClick={() => { void handleSave() }} disabled={saving}>
            {saving
              ? <><Loader2 className="size-4 mr-1 animate-spin" />{t("Saving…")}</>
              : <><Save className="size-4 mr-1" />{willDowngrade ? t("Save as Provisional") : t("Save Changes")}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
