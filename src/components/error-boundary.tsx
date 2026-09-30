import { Component, type ErrorInfo, type ReactNode } from "react"
import { ServiceUnavailable } from "./service-unavailable"

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Resets the boundary when any value changes. */
  resetKeys?: unknown[]
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

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
