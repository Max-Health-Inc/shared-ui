import { Component, type ErrorInfo, type ReactNode } from "react"
import { ServiceUnavailable } from "./service-unavailable"

export interface ErrorBoundaryProps {
  children: ReactNode
  /** Optional custom fallback UI. Receives the error and a reset function. */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /** Called when an error is caught — useful for telemetry/logging */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /**
   * When any value in this array changes, the boundary resets automatically.
   * Useful for recovering after navigation or prop changes.
   */
  resetKeys?: unknown[]
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Shared React error boundary for all Max Health apps.
 * Catches render-time exceptions and shows a themed fallback.
 *
 * Features:
 * - Theme-aware default fallback (respects dark mode via Tailwind)
 * - Custom fallback via render prop
 * - `onError` callback for telemetry
 * - `resetKeys` for automatic recovery
 * - Manual reset via button
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (!this.state.hasError || !this.props.resetKeys) return
    const prev = prevProps.resetKeys ?? []
    const curr = this.props.resetKeys
    if (prev.length !== curr.length || prev.some((k, i) => k !== curr[i])) {
      this.reset()
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }

      return <ServiceUnavailable variant="generic" error={this.state.error} />
    }

    return this.props.children
  }
}

export { ErrorBoundary }
