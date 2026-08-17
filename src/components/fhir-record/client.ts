/**
 * Injected FHIR write client. shared-ui never talks to a FHIR server directly —
 * each app passes its own authenticated create/update/delete functions (which
 * enforce the app's SMART scopes, consent, and audit). This keeps the record
 * components reusable across patient-portal, AIHR, and any future consumer.
 */
import type { VerifiableResource } from "@/lib/fhir-verification"

/** Parameterise with the app's own resource union. An index-signature type is not usable here — it excludes every generated FHIR type. */
export interface FhirRecordClient<TResource extends object = VerifiableResource> {
  /** Takes any new resource (Provenance, AuditEvent, …), so only the assigned id comes back. */
  create: (resource: object) => Promise<{ id?: string }>
  /** Round-trips an existing resource, so the caller's type is preserved. */
  update: (resource: TResource) => Promise<TResource & { id?: string }>
  /** Optional — omit in read/append-only contexts. */
  delete?: (resourceType: string, id: string) => Promise<void>
}
