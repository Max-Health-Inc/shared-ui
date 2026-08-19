import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../card"
import { Button } from "../button"
import { Spinner } from "../spinner"
import { Progress } from "../progress"
import { CheckCircle2, AlertTriangle, XCircle, Check, X } from "lucide-react"
import { ResourceReviewCard } from "./resource-review-card"
import type { FailedResource, ImportedResource } from "./editable-fields"
import type { FhirRecordClient } from "./client"
import { useUiText, type TFn } from "../../lib/ui-text"
import {
  buildProvenance, isPatientRole, stampAuthorship, type FhirUserRole,
} from "../../lib/fhir-verification"

type Step = "review" | "saving" | "done"

interface Selection {
  resource: ImportedResource
  selected: boolean
  editedResource?: Record<string, unknown>
}

export interface ResourceReviewFlowProps {
  /** AI-extracted resources to review (from patient-scribe / document-import). */
  resources: ImportedResource[]
  /** Resources the extractor could not validate (shown read-only). */
  failed?: FailedResource[]
  /** Optional DocumentReference wrapping the source PDF (document-import only). */
  documentReference?: Record<string, unknown>
  /** Injected authenticated FHIR client. */
  client: FhirRecordClient
  /** Author role — drives verified vs. provisional attribution on every save. */
  role: FhirUserRole
  /** Author reference, e.g. "Patient/123", recorded as recorder/asserter + Provenance agent. */
  authorReference?: string
  /** Optional assisting device, e.g. "Device/aihr-assistant", recorded in Provenance. */
  assemblerDevice?: string
  /** Optional summary line context. */
  fileName?: string
  processingTimeMs?: number
  onClose: () => void
  onSaved?: () => void
  t?: TFn
}

/**
 * The shared review → save → done flow for AI-extracted FHIR resources. Every
 * kept resource is stamped with role-based verification (patient → provisional,
 * clinician → confirmed) and backed by a Provenance; declined resources are
 * recorded in an AuditEvent. Apps own the preceding input/fetch step and mount
 * this once they have resources to review.
 */
export function ResourceReviewFlow({
  resources, failed = [], documentReference, client, role, authorReference, assemblerDevice,
  fileName, processingTimeMs, onClose, onSaved, t: appT,
}: ResourceReviewFlowProps) {
  const t = useUiText(appT)
  const [step, setStep] = useState<Step>("review")
  const [selections, setSelections] = useState<Selection[]>(() => resources.map((r) => ({ resource: r, selected: true })))
  const [saveProgress, setSaveProgress] = useState({ saved: 0, total: 0 })
  const [saveErrors, setSaveErrors] = useState<string[]>([])

  const selectedCount = selections.filter((s) => s.selected).length

  const toggleSelection = useCallback((i: number) => {
    setSelections((prev) => prev.map((s, idx) => (idx === i ? { ...s, selected: !s.selected } : s)))
  }, [])
  const toggleAll = useCallback((selected: boolean) => {
    setSelections((prev) => prev.map((s) => ({ ...s, selected })))
  }, [])
  const handleEdited = useCallback((i: number, updated: Record<string, unknown>) => {
    setSelections((prev) => prev.map((s, idx) => (idx === i ? { ...s, editedResource: updated } : s)))
  }, [])

  const handleConfirm = useCallback(async () => {
    const toSave = selections.filter((s) => s.selected)
    const rejected = selections.filter((s) => !s.selected)
    if (toSave.length === 0) return

    const level = isPatientRole(role) ? "provisional" : "confirmed"
    const totalSteps = toSave.length
      + (documentReference ? 1 : 0)
      + (authorReference ? 1 : 0) // provenance
      + (rejected.length > 0 && authorReference ? 1 : 0) // audit
    setStep("saving")
    setSaveProgress({ saved: 0, total: totalSteps })
    const errors: string[] = []
    const savedRefs: string[] = []

    for (const sel of toSave) {
      const data = sel.editedResource ?? sel.resource.resource
      try {
        const stamped = stampAuthorship({ ...data }, { role, authorReference })
        const saved = await client.create(stamped)
        if (typeof saved.id === "string") savedRefs.push(`${sel.resource.resourceType}/${saved.id}`)
        setSaveProgress((p) => ({ ...p, saved: p.saved + 1 }))
      } catch (err) {
        errors.push(`${sel.resource.resourceType}: ${err instanceof Error ? err.message : "Failed"}`)
      }
    }

    if (documentReference) {
      try {
        const docRef: Record<string, unknown> = { ...documentReference }
        if (savedRefs.length > 0) {
          const context = docRef.context && typeof docRef.context === "object" ? docRef.context : {}
          docRef.context = { ...context, related: savedRefs.map((reference) => ({ reference })) }
        }
        await client.create(docRef)
        setSaveProgress((p) => ({ ...p, saved: p.saved + 1 }))
      } catch (err) {
        errors.push(`DocumentReference: ${err instanceof Error ? err.message : "Failed"}`)
      }
    }

    if (authorReference && savedRefs.length > 0) {
      try {
        await client.create(buildProvenance({ targets: savedRefs, author: authorReference, level, assemblerDevice }))
        setSaveProgress((p) => ({ ...p, saved: p.saved + 1 }))
      } catch (err) {
        errors.push(`Provenance: ${err instanceof Error ? err.message : "Failed"}`)
      }
    }

    if (rejected.length > 0 && authorReference) {
      try {
        await client.create({
          resourceType: "AuditEvent",
          type: { system: "http://terminology.hl7.org/CodeSystem/audit-event-type", code: "rest", display: "RESTful Operation" },
          subtype: [{ system: "http://maxhealth.tech/audit", code: "extraction-rejection", display: "Extracted Resource Rejection" }],
          action: "C",
          recorded: new Date().toISOString(),
          outcome: "0",
          outcomeDesc: `User declined ${String(rejected.length)} extracted resource(s)${fileName ? ` from ${fileName}` : ""}`,
          agent: [{ who: { reference: authorReference }, requestor: true }],
          source: { observer: { display: "AIHR / Patient Portal — Resource Review" } },
          entity: rejected.map((r) => ({
            what: { display: `${r.resource.resourceType} (rejected)` },
            detail: [{ type: "resource-json", valueString: JSON.stringify(r.resource.resource) }],
          })),
        })
        setSaveProgress((p) => ({ ...p, saved: p.saved + 1 }))
      } catch (err) {
        errors.push(`Audit trail: ${err instanceof Error ? err.message : "Failed"}`)
      }
    }

    setSaveErrors(errors)
    setStep("done")
    onSaved?.()
  }, [selections, role, authorReference, assemblerDevice, documentReference, fileName, client, onSaved])

  if (step === "saving") {
    const pct = saveProgress.total > 0 ? (saveProgress.saved / saveProgress.total) * 100 : 0
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Spinner size="sm" />{t("Saving Resources")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 py-4">
            <Progress value={pct} />
            <p className="text-sm text-muted-foreground text-center">
              {t("{{n}} of {{total}} saved…", { n: saveProgress.saved, total: saveProgress.total })}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === "done") {
    const hasErrors = saveErrors.length > 0
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {hasErrors ? <AlertTriangle className="size-4 text-amber-500" /> : <CheckCircle2 className="size-4 text-green-500" />}
            {hasErrors ? t("Completed with Errors") : t("Records Saved")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("{{n}} resource(s) saved to the health record.", { n: Math.max(0, selectedCount - saveErrors.length) })}
          </p>
          {hasErrors && (
            <ul className="space-y-1">
              {saveErrors.map((err, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-destructive"><X className="size-3 shrink-0" />{err}</li>
              ))}
            </ul>
          )}
          <div className="flex justify-end"><Button size="sm" onClick={onClose}>{t("Done")}</Button></div>
        </CardContent>
      </Card>
    )
  }

  // review
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{fileName ?? t("Review Extracted Records")}</p>
              <p className="text-xs text-muted-foreground">
                {t("{{n}} resource(s) extracted", { n: resources.length })}
                {failed.length > 0 && <span className="text-destructive">{" · "}{failed.length} failed</span>}
                {processingTimeMs != null && <>{" · "}{(processingTimeMs / 1000).toFixed(1)}s</>}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { toggleAll(selectedCount < selections.length) }}>
              {selectedCount === selections.length ? t("Deselect All") : t("Select All")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {selections.map((sel, i) => (
          <ResourceReviewCard
            key={i}
            resource={sel.editedResource ? { ...sel.resource, resource: sel.editedResource } : sel.resource}
            selected={sel.selected}
            onToggleSelect={() => { toggleSelection(i) }}
            onResourceEdited={(updated) => { handleEdited(i, updated) }}
            t={t}
          />
        ))}
      </div>

      {failed.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="size-4" />{t("Failed to Extract ({{n}})", { n: failed.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {failed.map((f, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{f.resourceType}</span>
                  <span className="text-muted-foreground ml-2">— {f.errors[0] ?? t("validation failed")}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onClose}>{t("Cancel")}</Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("{{n}} of {{total}} selected", { n: selectedCount, total: selections.length })}
          </span>
          <Button size="sm" disabled={selectedCount === 0} onClick={() => { void handleConfirm() }}>
            <Check className="size-4" />{t("Save {{n}} Resource(s)", { n: selectedCount })}
          </Button>
        </div>
      </div>
    </div>
  )
}
