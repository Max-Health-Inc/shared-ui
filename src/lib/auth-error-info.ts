import { AlertTriangle, ShieldAlert, WifiOff, type LucideIcon } from "lucide-react"
import type { AuthorizationRefusal } from "../hooks/use-smart-auth"

export interface AuthErrorInfo {
  icon: LucideIcon
  /** Source strings, resolved by the view — this helper runs outside React. */
  title: string
  message: string
  isNetwork: boolean
}

/** Every kind of sign-in failure the shell tells apart. */
export const AUTH_ERRORS = {
  connection: {
    icon: WifiOff,
    title: "Connection Problem",
    message: "Unable to reach the authentication server. Please check your internet connection and try again.",
    isNetwork: true,
  },
  timedOut: {
    icon: WifiOff,
    title: "Request Timed Out",
    message: "The authentication server took too long to respond. This is usually temporary — please try again.",
    isNetwork: true,
  },
  misconfigured: {
    icon: ShieldAlert,
    title: "Configuration Error",
    message: "This application is not properly registered with the identity provider. Please contact your administrator.",
    isNetwork: false,
  },
  accessDenied: {
    icon: ShieldAlert,
    title: "Access Denied",
    message: "You do not have permission to access this application, or the required consent was not granted.",
    isNetwork: false,
  },
  unknown: {
    icon: AlertTriangle,
    title: "Something Went Wrong",
    message: "We couldn’t complete the sign-in process. This may be a temporary issue.",
    isNetwork: false,
  },
} satisfies Record<string, AuthErrorInfo>

/** RFC 6749 §4.1.2.1 codes, and the OIDC ones that refuse for the same reason. */
const REFUSALS: Partial<Record<string, AuthErrorInfo>> = {
  access_denied: AUTH_ERRORS.accessDenied,
  consent_required: AUTH_ERRORS.accessDenied,
  invalid_client: AUTH_ERRORS.misconfigured,
  unauthorized_client: AUTH_ERRORS.misconfigured,
}

/** A refusal by its code; anything else by its text, which is all a thrown error carries. */
export function classifyAuthError(error: string | null, refusal: AuthorizationRefusal | null = null): AuthErrorInfo {
  const known = refusal ? REFUSALS[refusal.error] : undefined
  if (known) return known
  if (refusal) return AUTH_ERRORS.unknown

  const msg = (error ?? "").toLowerCase()
  if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("network")) return AUTH_ERRORS.connection
  if (msg.includes("timeout") || msg.includes("timed out")) return AUTH_ERRORS.timedOut
  if (msg.includes("invalid_client") || msg.includes("unauthorized_client")) return AUTH_ERRORS.misconfigured
  if (msg.includes("access_denied") || msg.includes("consent")) return AUTH_ERRORS.accessDenied
  return AUTH_ERRORS.unknown
}
