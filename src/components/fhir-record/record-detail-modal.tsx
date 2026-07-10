import { useState, useCallback, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../dialog"
import { Badge } from "../badge"
import { Button } from "../button"
import { ShieldCheck, ShieldAlert, Pencil, Trash2, Undo2, CheckCircle2 } from "lucide-react"
import { asDisplayString, EDITABLE_TYPES, getByPath, getEditableFields } from "./editable-fields"
import { RecordEditModal } from "./record-edit-modal"
import type { FhirRecordClient } from "./client"
import { identityT, type TFn } from "./i18n"
import { formatFhirDate } from "../../lib/fhir-helpers"
import {
  describeVerification, getSnapshot, hasSnapshot, isResourceVerified, markAsConfirmed,
  type VerifiableResource,
} from "../../lib/fhir-verification"

export interface RecordDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  resource: VerifiableResource | null
  client: FhirRecordClient
  onResourceUpdated?: (updated: VerifiableResource) => void
  onResourceDeleted?: () => void
  /** Enables practitioner-only actions (Approve, unrestricted delete). */
  isPractitioner?: boolean
  t?: TFn
}

interface DetailRow { label: string; value: string }

function buildRows(resource: VerifiableResource): DetailRow[] {
  const rows: DetailRow[] = []
  const rt = typeof resource.resourceType === "string" ? resource.resourceType : undefined
  for (const f of getEditableFields(rt)) {
    const val = getByPath(resource, f.path)
    if (val != null && val !== "") {
      rows.push({ label: f.label, value: f.type === "date" ? formatFhirDate(asDisplayString(val)) : asDisplayString(val) })
    }
  }
  const subject = resource.subject
  if (subject != null && typeof subject === "object" && "reference" in subject) {
    const ref = subject.reference
    if (typeof ref === "string") rows.push({ label: "Patient", value: ref })
  }
  return rows
}

/**
 * Read-only detail view of a FHIR record with its verification badge and the
 * role-gated lifecycle actions: patient Edit (→ provisional) / Discard-changes,
 * and practitioner Approve (provisional → confirmed) / Delete.
 */
export function RecordDetailModal({
  open, onOpenChange, title, resource, client, onResourceUpdated, onResourceDeleted, isPractitioner = false, t = identityT,
}: RecordDetailModalProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [approving, setApproving] = useState(false)

  const verified = resource ? isResourceVerified(resource) : false
  const verification = useMemo(() => (resource ? describeVerification(resource) : undefined), [resource])
  const rows = useMemo(() => (resource ? buildRows(resource) : []), [resource])

  const resourceType = typeof resource?.resourceType === "string" ? resource.resourceType : undefined
  const resourceId = typeof resource?.id === "string" ? resource.id : undefined
  const editable = !!resourceType && EDITABLE_TYPES.has(resourceType)

  const canEdit = !!onResourceUpdated && editable
  const canApprove = isPractitioner && !!onResourceUpdated && editable && !verified
  const canDelete = !!onResourceDeleted && !!resourceType && !!resourceId && editable && (isPractitioner || !verified)
  const snapshotPresent = resource ? hasSnapshot(resource) : false

  const handleApprove = useCallback(async () => {
    if (!resource || !onResourceUpdated) return
    setApproving(true)
    try {
      const result = await client.update(markAsConfirmed(resource))
      onResourceUpdated(result)
      onOpenChange(false)
    } catch { /* keep modal open */ } finally { setApproving(false) }
  }, [resource, client, onResourceUpdated, onOpenChange])

  const handleDelete = useCallback(async () => {
    if (!resource || !resourceType || !resourceId) return
    setDeleting(true)
    try {
      const snapshot = getSnapshot(resource)
      if (snapshot) {
        await client.update(snapshot)
      } else if (client.delete) {
        await client.delete(resourceType, resourceId)
      }
      onResourceDeleted?.()
      onOpenChange(false)
    } catch { /* keep modal open */ } finally { setDeleting(false); setConfirmDelete(false) }
  }, [resource, resourceType, resourceId, client, onResourceDeleted, onOpenChange])

  if (!resource) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {title}
              {verification && (
                <Badge
                  variant={verification.verified ? "default" : "secondary"}
                  className={verification.verified
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"}
                >
                  {verification.verified ? <ShieldCheck className="size-3 mr-1" /> : <ShieldAlert className="size-3 mr-1" />}
                  {t(verification.label)}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {resourceType && <span className="text-xs font-mono">{resourceType}</span>}
              {resourceId && <span className="text-xs font-mono text-muted-foreground"> / {resourceId}</span>}
            </DialogDescription>
            {canEdit && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Button variant="outline" size="sm" className="w-fit" onClick={() => { setEditOpen(true) }}>
                  <Pencil className="size-3.5 mr-1" />{t("Edit Record")}
                </Button>
                {canApprove && (
                  <Button
                    variant="outline" size="sm"
                    className="w-fit text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                    onClick={() => { void handleApprove() }} disabled={approving}
                  >
                    <CheckCircle2 className="size-3.5 mr-1" />{approving ? t("Approving…") : t("Approve")}
                  </Button>
                )}
                {canDelete && !confirmDelete && (
                  <Button variant="outline" size="sm" className="w-fit text-destructive hover:bg-destructive/10" onClick={() => { setConfirmDelete(true) }}>
                    {snapshotPresent
                      ? <><Undo2 className="size-3.5 mr-1" />{t("Discard Changes")}</>
                      : <><Trash2 className="size-3.5 mr-1" />{t("Delete")}</>}
                  </Button>
                )}
                {canDelete && confirmDelete && (
                  <div className="flex items-center gap-2">
                    <Button variant="destructive" size="sm" disabled={deleting} onClick={() => { void handleDelete() }}>
                      {deleting ? t("Deleting…") : t("Yes, Delete")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setConfirmDelete(false) }}>{t("Cancel")}</Button>
                  </div>
                )}
              </div>
            )}
          </DialogHeader>

          <div className="space-y-3 pt-2 overflow-y-auto">
            {rows.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t(f.label)}</p>
                  <p className="text-sm break-all">{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {onResourceUpdated && (
        <RecordEditModal
          key={resourceId}
          open={editOpen}
          onOpenChange={setEditOpen}
          resource={resource}
          client={client}
          isPractitioner={isPractitioner}
          t={t}
          onSaved={(updated) => { onResourceUpdated(updated); setEditOpen(false); onOpenChange(false) }}
        />
      )}
    </>
  )
}
