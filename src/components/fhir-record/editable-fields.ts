/**
 * Editable-field configuration + safe path helpers shared by the FHIR record
 * components (ResourceReviewCard, RecordEditModal). Centralized here so the two
 * views never drift on which fields are editable per resource type.
 */

export interface EditableField {
  label: string
  /** Dot-notation path into the FHIR resource, e.g. "code.coding.0.display". */
  path: string
  type: "text" | "date" | "number"
}

/** Per-resource-type editable fields. Keyed by FHIR resourceType. */
export const EDITABLE_FIELDS: Record<string, EditableField[]> = {
  Condition: [
    { label: "Condition Name", path: "code.coding.0.display", type: "text" },
    { label: "Condition Code", path: "code.coding.0.code", type: "text" },
    { label: "Onset Date", path: "onsetDateTime", type: "date" },
    { label: "Clinical Status", path: "clinicalStatus.coding.0.code", type: "text" },
    { label: "Verification Status", path: "verificationStatus.coding.0.code", type: "text" },
  ],
  AllergyIntolerance: [
    { label: "Substance", path: "code.coding.0.display", type: "text" },
    { label: "Substance Code", path: "code.coding.0.code", type: "text" },
    { label: "Criticality", path: "criticality", type: "text" },
    { label: "Reaction", path: "reaction.0.manifestation.0.coding.0.display", type: "text" },
    { label: "Onset Date", path: "onsetDateTime", type: "date" },
  ],
  MedicationRequest: [
    { label: "Medication", path: "medicationCodeableConcept.coding.0.display", type: "text" },
    { label: "Medication Code", path: "medicationCodeableConcept.coding.0.code", type: "text" },
    { label: "Dosage Instructions", path: "dosageInstruction.0.text", type: "text" },
    { label: "Authored On", path: "authoredOn", type: "date" },
    { label: "Status", path: "status", type: "text" },
  ],
  MedicationStatement: [
    { label: "Medication", path: "medicationCodeableConcept.coding.0.display", type: "text" },
    { label: "Medication Code", path: "medicationCodeableConcept.coding.0.code", type: "text" },
    { label: "Dosage", path: "dosage.0.text", type: "text" },
    { label: "Status", path: "status", type: "text" },
  ],
  Observation: [
    { label: "Name", path: "code.coding.0.display", type: "text" },
    { label: "Observation Code", path: "code.coding.0.code", type: "text" },
    { label: "Value", path: "valueQuantity.value", type: "number" },
    { label: "Unit", path: "valueQuantity.unit", type: "text" },
    { label: "Effective Date", path: "effectiveDateTime", type: "date" },
    { label: "Status", path: "status", type: "text" },
  ],
  Immunization: [
    { label: "Vaccine", path: "vaccineCode.coding.0.display", type: "text" },
    { label: "Vaccine Code", path: "vaccineCode.coding.0.code", type: "text" },
    { label: "Date Given", path: "occurrenceDateTime", type: "date" },
    { label: "Status", path: "status", type: "text" },
  ],
  Procedure: [
    { label: "Procedure Name", path: "code.coding.0.display", type: "text" },
    { label: "Procedure Code", path: "code.coding.0.code", type: "text" },
    { label: "Performed Date", path: "performedDateTime", type: "date" },
    { label: "Status", path: "status", type: "text" },
  ],
  DiagnosticReport: [
    { label: "Report Name", path: "code.coding.0.display", type: "text" },
    { label: "Report Code", path: "code.coding.0.code", type: "text" },
    { label: "Issued Date", path: "issued", type: "date" },
    { label: "Status", path: "status", type: "text" },
    { label: "Conclusion", path: "conclusion", type: "text" },
  ],
}

/** Resource types a patient may add/edit through the record UI. */
export const EDITABLE_TYPES: ReadonlySet<string> = new Set(Object.keys(EDITABLE_FIELDS))

/** Editable fields for a resource type, or [] when none are defined. */
export function getEditableFields(resourceType: string | undefined): EditableField[] {
  if (!resourceType) return []
  // `Object.hasOwn` guards the lookup but does not narrow the index signature, so the
  // fallback is what actually satisfies the return type.
  return EDITABLE_FIELDS[resourceType] ?? []
}

/** Coerce an unknown FHIR value into a display/input string ("" for objects/nullish). */
export function asDisplayString(val: unknown): string {
  if (val == null) return ""
  if (typeof val === "string") return val
  if (typeof val === "number" || typeof val === "boolean") return String(val)
  return ""
}

// ── Path helpers ──────────────────────────────────────────────────────────────

/** Read a dot-notation path from a resource, tolerating missing intermediates. */
export function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined
    return (acc as Record<string, unknown>)[key]
  }, obj)
}

/**
 * Immutably set a dot-notation path, auto-creating intermediate objects/arrays
 * (a numeric next-key creates an array). Returns a deep clone with the change.
 */
export function setByPath<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  const clone = structuredClone(obj)
  const keys = path.split(".")
  // `split` always yields at least one element, but the index signature cannot say so.
  const leafKey = keys.at(-1)
  if (leafKey === undefined) return clone
  let current: unknown = clone
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    const nextKey = keys[i + 1]
    if (k === undefined || nextKey === undefined) return clone
    if (current == null || typeof current !== "object") return clone
    const container = current as Record<string, unknown>
    const next = container[k]
    if (next == null || typeof next !== "object") {
      container[k] = /^\d+$/.test(nextKey) ? [] : {}
    }
    current = container[k]
  }
  if (current != null && typeof current === "object") {
    (current as Record<string, unknown>)[leafKey] = value
  }
  return clone
}

// ── AI-extraction result shapes (patient-scribe / document-import) ────────────

export interface ImportedResource {
  resourceType: string
  resource: Record<string, unknown>
  retriesNeeded: number
  warnings: string[]
}

export interface FailedResource {
  resourceType: string
  errors: string[]
  warnings: string[]
  retriesAttempted: number
}
