/**
 * FHIR data-verification model — the shared vocabulary for "who asserted this
 * record and has a clinician confirmed it", used by every SMART on FHIR app in
 * the org (patient-portal, AIHR).
 *
 * The model rides on FHIR's own `verificationStatus` where the resource type has
 * that element (Condition, AllergyIntolerance) and falls back to a `meta.tag`
 * for every other type — so a patient-entered Observation or MedicationStatement
 * is just as unambiguously "unverified" as a patient-entered Condition.
 *
 * Lifecycle:
 *   patient adds / edits  → provisional  (unverified, pending clinician review)
 *   practitioner adds     → confirmed    (verified on creation)
 *   practitioner approves → confirmed    (provisional → confirmed, snapshot dropped)
 *
 * This module is framework-agnostic (no React, no FHIR SDK dependency) so it can
 * run in the browser, in a Worker, or in tests. Structural types keep it free of
 * a hard `@types/fhir` dependency while staying precise about the fields touched.
 */

// ── Canonical systems / URLs (wire-compatible with patient-portal) ────────────

/** verificationStatus coding system (shared by Condition + AllergyIntolerance). */
export const VERIFICATION_STATUS_SYSTEM = "http://terminology.hl7.org/CodeSystem/condition-ver-status"

/** Extension holding the pre-edit resource JSON, enabling discard/revert. */
export const ORIGINAL_SNAPSHOT_EXT = "http://proxy-smart.com/fhir/StructureDefinition/original-snapshot"

/** meta.tag system for the general (type-agnostic) verification signal. */
export const DATA_VERIFICATION_TAG_SYSTEM = "http://maxhealth.tech/fhir/data-verification"

/** The two verification levels. */
export type VerificationLevel = "confirmed" | "provisional"

/** Resource types that carry a native `verificationStatus` element in R4. */
const SUPPORTS_VERIFICATION_STATUS: ReadonlySet<string> = new Set(["Condition", "AllergyIntolerance"])

/** Codes that count as "verified" for display / gating purposes. */
const VERIFIED_CODES: ReadonlySet<string> = new Set(["confirmed", "verified"])

// ── Structural FHIR shapes (only the fields this module reads or writes) ───────

export interface Coding {
  system?: string
  code?: string
  display?: string
}

export interface CodeableConcept {
  coding?: Coding[]
  text?: string
}

export interface Extension {
  url: string
  valueString?: string
}

export interface Reference {
  reference?: string
  display?: string
}

/**
 * A resource this module can attribute/verify. No index signature on purpose: one
 * here rejects every generated FHIR type, which gets no implicit index signature.
 */
export interface VerifiableResource {
  resourceType?: string
  id?: string
  subject?: Reference
  verificationStatus?: CodeableConcept
  extension?: Extension[]
  meta?: { tag?: Coding[] }
  recorder?: Reference
  asserter?: Reference
  performer?: unknown
}

// ── Role parsing (single source of truth for fhirUser → role) ─────────────────

export type FhirUserRole = "patient" | "practitioner" | "related-person" | "person" | "unknown"

export interface ClassifiedFhirUser {
  role: FhirUserRole
  /** The logical id, e.g. "123" for "Patient/123". */
  id?: string
  /** The normalized relative reference, e.g. "Patient/123". */
  reference?: string
}

/**
 * Classify a FHIR user reference (absolute or relative) into a role + id.
 * Accepts `fhirUser` claims, `subject`/`sender` references, and bare refs.
 */
export function parseFhirUser(ref?: string): ClassifiedFhirUser {
  if (!ref) return { role: "unknown" }
  const trimmed = ref.trim().replace(/\/+$/, "")
  const parts = trimmed.split("/")
  // Read the trailing "<Type>/<id>" pair through `at`, which types as possibly-undefined and
  // so covers the short-reference case in one guard rather than a separate length check.
  const id = parts.at(-1)
  const type = parts.at(-2)
  if (id === undefined || type === undefined) return { role: "unknown" }
  const reference = `${type}/${id}`
  switch (type) {
    case "Patient":
      return { role: "patient", id, reference }
    case "Practitioner":
    case "PractitionerRole":
      return { role: "practitioner", id, reference }
    case "RelatedPerson":
      return { role: "related-person", id, reference }
    case "Person":
      return { role: "person", id, reference }
    default:
      return { role: "unknown", id, reference }
  }
}

/** A patient (or their proxy) authors "unverified" data; clinicians author "verified". */
export function isPatientRole(role: FhirUserRole): boolean {
  return role === "patient" || role === "related-person"
}

// ── Verification reads ────────────────────────────────────────────────────────

/** The verificationStatus / tag code, preferring the native element. */
export function getVerificationCode(resource: VerifiableResource): string | undefined {
  const native = resource.verificationStatus?.coding?.[0]?.code ?? resource.verificationStatus?.text
  if (native) return native
  const tag = resource.meta?.tag?.find((t) => t.system === DATA_VERIFICATION_TAG_SYSTEM)
  return tag?.code
}

/** True when a code represents a verified record. */
export function isVerifiedCode(code: string | undefined): boolean {
  return code !== undefined && VERIFIED_CODES.has(code)
}

/**
 * Whether a resource is verified. Mirrors patient-portal's semantics: an explicit
 * verified code wins; otherwise a resource that carries a `performer` (i.e. was
 * recorded by a clinician) is treated as verified, and everything else is not.
 */
export function isResourceVerified(resource: VerifiableResource): boolean {
  const code = getVerificationCode(resource)
  if (code !== undefined) return isVerifiedCode(code)
  return resource.performer != null
}

/** A short, human-facing label + verified flag for badges. */
export function describeVerification(resource: VerifiableResource): { verified: boolean; label: string } {
  const code = getVerificationCode(resource)
  const display = resource.verificationStatus?.coding?.[0]?.display
    ?? resource.verificationStatus?.text
    ?? code
    ?? (resource.performer != null ? "Verified" : "Unverified")
  return { verified: isResourceVerified(resource), label: display }
}

// ── Snapshot (discard / revert) helpers ───────────────────────────────────────

/** True when the resource holds a pre-edit snapshot (i.e. it was patient-edited). */
export function hasSnapshot(resource: VerifiableResource): boolean {
  return (resource.extension ?? []).some((e) => e.url === ORIGINAL_SNAPSHOT_EXT)
}

function isVerifiableResource(value: unknown): value is VerifiableResource {
  return value !== null && typeof value === "object"
}

/** The stored pre-edit resource, if any, for revert/discard. */
export function getSnapshot(resource: VerifiableResource): VerifiableResource | undefined {
  const ext = (resource.extension ?? []).find((e) => e.url === ORIGINAL_SNAPSHOT_EXT)
  if (!ext?.valueString) return undefined
  try {
    const parsed: unknown = JSON.parse(ext.valueString)
    return isVerifiableResource(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

// ── Verification writes ───────────────────────────────────────────────────────

function withoutSnapshot(extensions: Extension[] | undefined): Extension[] {
  return (extensions ?? []).filter((e) => e.url !== ORIGINAL_SNAPSHOT_EXT)
}

function setVerificationTag(resource: VerifiableResource, level: VerificationLevel): void {
  const tags = (resource.meta?.tag ?? []).filter((t) => t.system !== DATA_VERIFICATION_TAG_SYSTEM)
  tags.push({
    system: DATA_VERIFICATION_TAG_SYSTEM,
    code: level,
    display: level === "confirmed" ? "Verified" : "Unverified",
  })
  resource.meta = { ...resource.meta, tag: tags }
}

function setVerificationStatus(resource: VerifiableResource, level: VerificationLevel): void {
  if (!resource.resourceType || !SUPPORTS_VERIFICATION_STATUS.has(resource.resourceType)) return
  resource.verificationStatus = {
    coding: [{
      system: resource.verificationStatus?.coding?.[0]?.system ?? VERIFICATION_STATUS_SYSTEM,
      code: level,
      display: level === "confirmed" ? "Confirmed" : "Provisional",
    }],
    text: level === "confirmed" ? "Confirmed" : "Provisional",
  }
}

/**
 * Set a resource's verification level on both the native element (where the type
 * supports it) and the type-agnostic `meta.tag`. Mutates a clone, never the input.
 */
export function setVerificationLevel<T extends VerifiableResource>(resource: T, level: VerificationLevel): T {
  const next = structuredClone(resource)
  setVerificationStatus(next, level)
  setVerificationTag(next, level)
  return next
}

/**
 * Downgrade a resource to `provisional` after a patient edit, snapshotting the
 * pre-edit resource (once) so the change can be discarded/reverted.
 */
export function markAsProvisional<T extends VerifiableResource>(resource: T, original: T): T {
  const next = setVerificationLevel(resource, "provisional")
  const existing = next.extension ?? []
  if (!existing.some((e) => e.url === ORIGINAL_SNAPSHOT_EXT)) {
    next.extension = [...existing, { url: ORIGINAL_SNAPSHOT_EXT, valueString: JSON.stringify(original) }]
  }
  return next
}

/**
 * Upgrade a resource to `confirmed` (the practitioner "Approve" action) and drop
 * the pre-edit snapshot — the change is now blessed.
 */
export function markAsConfirmed<T extends VerifiableResource>(resource: T): T {
  const next = setVerificationLevel(resource, "confirmed")
  next.extension = withoutSnapshot(next.extension)
  if (next.extension.length === 0) delete next.extension
  return next
}

// ── Write-time attribution ────────────────────────────────────────────────────

export interface AuthorshipOptions {
  /** The authoring user's role — drives verified vs. provisional. */
  role: FhirUserRole
  /** The authoring user's reference, e.g. "Patient/123" (recorded as recorder/asserter). */
  authorReference?: string
}

/**
 * Stamp a freshly-created resource with a verification level and author derived
 * from the current user's role. Patient/proxy authors produce `provisional`
 * (unverified) records; clinicians produce `confirmed` (verified) ones. This is
 * the single choke point every write path (manual add, AI scribe, document
 * import, chat-derived) should route through so attribution stays consistent.
 */
export function stampAuthorship<T extends VerifiableResource>(resource: T, opts: AuthorshipOptions): T {
  const level: VerificationLevel = isPatientRole(opts.role) ? "provisional" : "confirmed"
  const next = setVerificationLevel(resource, level)
  if (opts.authorReference) {
    const ref: Reference = { reference: opts.authorReference }
    // recorder is broadly supported; asserter is the patient-reported signal on
    // Condition/AllergyIntolerance. Set whichever the resource already models.
    next.recorder ??= ref
    if (next.resourceType && SUPPORTS_VERIFICATION_STATUS.has(next.resourceType)) {
      next.asserter ??= ref
    }
  }
  return next
}

// ── Provenance ────────────────────────────────────────────────────────────────

export interface ProvenanceOptions {
  /** References of the resources this provenance attests, e.g. ["Observation/1"]. */
  targets: string[]
  /** The authoring agent reference, e.g. "Patient/123" or "Practitioner/45". */
  author: string
  /** The verification level captured at authorship time. */
  level: VerificationLevel
  /** ISO timestamp; defaults to now. Inject in tests / workflows for determinism. */
  when?: string
  /** Optional device/software that assisted (e.g. "Device/aihr-assistant"). */
  assemblerDevice?: string
}

/**
 * Build a Provenance resource recording who asserted a set of resources and at
 * what verification level — the auditable, type-agnostic backbone of the model.
 */
export function buildProvenance(opts: ProvenanceOptions): Record<string, unknown> {
  const recorded = opts.when ?? new Date().toISOString()
  const authorRole = parseFhirUser(opts.author).role
  const agentType = isPatientRole(authorRole) ? "informant" : "author"
  const agent: Record<string, unknown>[] = [{
    type: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
        code: agentType,
      }],
    },
    who: { reference: opts.author },
  }]
  if (opts.assemblerDevice) {
    agent.push({
      type: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type",
          code: "assembler",
        }],
      },
      who: { reference: opts.assemblerDevice },
    })
  }
  return {
    resourceType: "Provenance",
    target: opts.targets.map((reference) => ({ reference })),
    recorded,
    agent,
    // A coded tag mirroring the resource-level verification level, for querying.
    meta: { tag: [{ system: DATA_VERIFICATION_TAG_SYSTEM, code: opts.level }] },
  }
}
