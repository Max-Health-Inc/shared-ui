/**
 * Injected FHIR write client. shared-ui never talks to a FHIR server directly —
 * each app passes its own authenticated create/update/delete functions (which
 * enforce the app's SMART scopes, consent, and audit). This keeps the record
 * components reusable across patient-portal, AIHR, and any future consumer.
 */
export interface FhirRecordClient {
  create: (resource: Record<string, unknown>) => Promise<Record<string, unknown> & { id?: string }>
  update: (resource: Record<string, unknown>) => Promise<Record<string, unknown> & { id?: string }>
  /** Optional — omit in read/append-only contexts. */
  delete?: (resourceType: string, id: string) => Promise<void>
}
