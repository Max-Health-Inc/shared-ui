import { useState, useCallback, useMemo } from "react"
import { Card, CardContent } from "../card"
import { Badge } from "../badge"
import { Button } from "../button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../dialog"
import { Input } from "../input"
import { Label } from "../label"
import {
  CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, Pencil,
  FileText, Heart, ShieldAlert, Pill, Syringe, TestTubes, Stethoscope,
  ClipboardList, Save, X,
} from "lucide-react"
import { formatFhirDate } from "../../lib/fhir-helpers"
import { asDisplayString, getByPath, getEditableFields, setByPath, type ImportedResource } from "./editable-fields"
import { useUiText, type TFn } from "../../lib/ui-text"

/** Validation warnings not useful to a patient (missing narrative, etc.). */
const SUPPRESSED_WARNING_PATTERNS = [/narrative/i, /text\.div/i, /text\.status/i, /dom-6/i]
function filterWarnings(warnings: string[]): string[] {
  return warnings.filter((w) => !SUPPRESSED_WARNING_PATTERNS.some((p) => p.test(w)))
}

const RESOURCE_ICONS: Record<string, typeof Heart> = {
  Condition: Heart,
  AllergyIntolerance: ShieldAlert,
  MedicationRequest: Stethoscope,
  MedicationStatement: Pill,
  Observation: TestTubes,
  Immunization: Syringe,
  Procedure: ClipboardList,
  DiagnosticReport: FileText,
}

const RESOURCE_COLORS: Record<string, string> = {
  Condition: "text-rose-500",
  AllergyIntolerance: "text-amber-500",
  MedicationRequest: "text-cyan-500",
  MedicationStatement: "text-blue-500",
  Observation: "text-purple-500",
  Immunization: "text-green-500",
  Procedure: "text-indigo-500",
  DiagnosticReport: "text-orange-500",
}

// ── Type-safe FHIR reads ──────────────────────────────────────────────────────

function record(val: unknown): Record<string, unknown> | undefined {
  return val != null && typeof val === "object" ? (val as Record<string, unknown>) : undefined
}

/** display of coding[0], falling back to `.text`, of a CodeableConcept-shaped value. */
function conceptText(val: unknown): string | undefined {
  const cc = record(val)
  if (!cc) return undefined
  const coding = cc.coding
  if (Array.isArray(coding)) {
    const first = record(coding[0])
    const display = first?.display
    if (typeof display === "string" && display) return display
  }
  return typeof cc.text === "string" && cc.text ? cc.text : undefined
}

/** `.<key>` of the first element of an array-shaped value, when it is a string. */
function firstArrayText(val: unknown, key: string): string | undefined {
  if (!Array.isArray(val)) return undefined
  const first = record(val[0])
  const v = first?.[key]
  return typeof v === "string" ? v : undefined
}

// ── Display helpers ──────────────────────────────────────────────────────────

function getResourceTitle(resource: Record<string, unknown>): string {
  const rt = typeof resource.resourceType === "string" ? resource.resourceType : "resource"
  return conceptText(resource.code)
    ?? conceptText(resource.medicationCodeableConcept)
    ?? conceptText(resource.vaccineCode)
    ?? `${rt} resource`
}

function getResourceDetail(resource: Record<string, unknown>): string | null {
  if (typeof resource.onsetDateTime === "string") return `Onset: ${formatFhirDate(resource.onsetDateTime)}`
  const dosage = firstArrayText(resource.dosageInstruction, "text") ?? firstArrayText(resource.dosage, "text")
  if (dosage) return dosage
  const vq = record(resource.valueQuantity)
  if (vq && typeof vq.value === "number") {
    const unit = typeof vq.unit === "string" ? vq.unit : ""
    return `${String(vq.value)} ${unit}`.trim()
  }
  if (typeof resource.valueString === "string") return resource.valueString
  const reaction = record(Array.isArray(resource.reaction) ? resource.reaction[0] : undefined)
  const manifestation = reaction ? conceptText(Array.isArray(reaction.manifestation) ? reaction.manifestation[0] : undefined) : undefined
  if (manifestation) return `Reaction: ${manifestation}`
  if (typeof resource.authoredOn === "string") return `Authored: ${formatFhirDate(resource.authoredOn)}`
  if (typeof resource.occurrenceDateTime === "string") return formatFhirDate(resource.occurrenceDateTime)
  return null
}

interface DetailField { label: string; value: string }

function getDetailFields(resource: Record<string, unknown>): DetailField[] {
  const fields: DetailField[] = []
  const rt = typeof resource.resourceType === "string" ? resource.resourceType : undefined
  for (const f of getEditableFields(rt)) {
    const val = getByPath(resource, f.path)
    if (val != null && val !== "") {
      fields.push({ label: f.label, value: f.type === "date" ? formatFhirDate(asDisplayString(val)) : asDisplayString(val) })
    }
  }
  const subjectRef = record(resource.subject)?.reference
  if (typeof subjectRef === "string") fields.push({ label: "Patient", value: subjectRef })
  const tags = record(resource.meta)?.tag
  if (Array.isArray(tags) && tags.length) {
    const codes = tags.map((tag) => record(tag)?.code).filter((c): c is string => typeof c === "string")
    if (codes.length) fields.push({ label: "Tags", value: codes.join(", ") })
  }
  return fields
}

// ── Component ────────────────────────────────────────────────────────────────

export interface ResourceReviewCardProps {
  resource: ImportedResource
  selected: boolean
  onToggleSelect: () => void
  onResourceEdited: (updated: Record<string, unknown>) => void
  /** Optional translation function; falls back to interpolated English. */
  t?: TFn
}

/**
 * A single AI-extracted resource card in the review step: select to keep, expand
 * for detail, edit inline before saving. Presentation-only — the parent owns the
 * selection/edit state and the eventual write.
 */
export function ResourceReviewCard({ resource, selected, onToggleSelect, onResourceEdited, t: appT }: ResourceReviewCardProps) {
  const t = useUiText(appT)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  const res = resource.resource
  const Icon = RESOURCE_ICONS[resource.resourceType] ?? FileText
  const color = RESOURCE_COLORS[resource.resourceType] ?? "text-gray-500"
  const detailFields = useMemo(() => getDetailFields(res), [res])
  const editableFields = useMemo(() => getEditableFields(resource.resourceType), [resource.resourceType])
  const filteredWarnings = useMemo(() => filterWarnings(resource.warnings), [resource.warnings])
  const detail = getResourceDetail(res)

  const openEditDialog = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const vals: Record<string, string> = {}
    for (const f of editableFields) {
      vals[f.path] = asDisplayString(getByPath(res, f.path))
    }
    setEditValues(vals)
    setEditing(true)
  }, [editableFields, res])

  const handleSaveEdit = useCallback(() => {
    let updated: Record<string, unknown> = { ...res }
    for (const f of editableFields) {
      const val = editValues[f.path]
      const coerced = f.type === "number" ? (val === "" ? undefined : Number(val)) : (val === "" ? undefined : val)
      updated = setByPath(updated, f.path, coerced)
    }
    onResourceEdited(updated)
    setEditing(false)
  }, [editValues, editableFields, res, onResourceEdited])

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded((prev) => !prev)
  }, [])

  return (
    <>
      <Card className={`transition-all ${selected ? "ring-2 ring-primary/50" : "opacity-60"}`}>
        <CardContent className="py-3">
          <div className="flex items-start gap-3 cursor-pointer" onClick={onToggleSelect}>
            <div className={`mt-0.5 ${selected ? "text-primary" : "text-muted-foreground"}`}>
              {selected
                ? <CheckCircle2 className="size-5" />
                : <div className="size-5 rounded-full border-2 border-muted-foreground/30" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Icon className={`size-4 ${color}`} />
                <Badge variant="outline" className="text-xs">{resource.resourceType}</Badge>
                {resource.retriesNeeded > 0 && (
                  <Badge variant="secondary" className="text-xs">{t("{{n}} fix(es)", { n: resource.retriesNeeded })}</Badge>
                )}
              </div>
              <p className="text-sm font-medium mt-1 truncate">{getResourceTitle(res)}</p>
              {detail && <p className="text-xs text-muted-foreground mt-0.5 truncate">{detail}</p>}
              {filteredWarnings.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="size-3 text-amber-500" />
                  <span className="text-xs text-amber-600">
                    {filteredWarnings.length} warning{filteredWarnings.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {editableFields.length > 0 && selected && (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={openEditDialog} title={t("Edit Record")}>
                  <Pencil className="size-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleExpand} title={t("Show details")}>
                {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </Button>
            </div>
          </div>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
              {detailFields.length > 0 ? (
                <div className="grid gap-2">
                  {detailFields.map((f, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 text-xs">
                      <span className="font-medium text-muted-foreground sm:w-32 sm:shrink-0">{t(f.label)}:</span>
                      <span className="text-foreground break-all">{f.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">{t("No structured details available")}</p>
              )}
              {filteredWarnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-amber-600">{t("Warnings")}:</p>
                  {filteredWarnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-600 pl-2">• {w}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4" />
              {t("Edit {{resourceType}}", { resourceType: resource.resourceType })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            {editableFields.map((f) => (
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
            {editableFields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("No editable fields defined for {{resourceType}}.", { resourceType: resource.resourceType })}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditing(false) }}>
              <X className="size-4 mr-1" />{t("Cancel")}
            </Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={editableFields.length === 0}>
              <Save className="size-4 mr-1" />{t("Save Changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
