/**
 * Optional translation function for the FHIR record components. These components
 * keep react-i18next an *optional* peer dependency (matching the rest of
 * shared-ui), so callers pass their app's `t`; when omitted, the key is returned
 * with `{{var}}` placeholders interpolated so English fallbacks still read well.
 */
export type TFn = (key: string, vars?: Record<string, string | number>) => string

export const identityT: TFn = (key, vars) =>
  vars ? key.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars[k] ?? `{{${k}}}`)) : key
