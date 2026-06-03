import { Component } from "react"
import type { ErrorInfo, ReactNode } from "react"

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
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

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <div className="text-center max-w-[480px] p-8">
            <div className="text-5xl mb-4" aria-hidden="true">⚠</div>
            <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {this.state.error.message}
            </p>
            <button
              onClick={() => { window.location.reload() }}
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary }
