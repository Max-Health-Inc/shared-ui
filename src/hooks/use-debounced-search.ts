"use client"

import * as React from "react"

export type SearchFn<T> = (query: string, signal: AbortSignal) => Promise<readonly T[]>

export interface SearchOutcome<T> {
  results: readonly T[]
  error: unknown
}

/**
 * Runs searches so that only the latest one reports: a slow earlier request that resolves after
 * a newer one is aborted and its answer dropped, instead of overwriting the newer results.
 */
export function createLatestSearch<T>(report: (outcome: SearchOutcome<T>) => void) {
  let current: AbortController | undefined
  return {
    run: async (search: SearchFn<T>, query: string): Promise<void> => {
      current?.abort()
      const controller = new AbortController()
      current = controller
      try {
        const results = await search(query, controller.signal)
        if (current === controller) report({ results, error: undefined })
      } catch (error) {
        if (current === controller) report({ results: [], error })
      }
    },
    cancel: (): void => {
      current?.abort()
      current = undefined
    },
  }
}

export interface DebouncedSearchOptions {
  /** Milliseconds of quiet typing before a search runs. Default 300. */
  delayMs?: number
  /** Search for the empty query too, e.g. to list the first page on open. Default false. */
  searchEmpty?: boolean
}

export interface DebouncedSearch<T> {
  query: string
  setQuery: (query: string) => void
  results: readonly T[]
  loading: boolean
  error: unknown
  /** True once a search has answered, so "no results" can be told apart from "not searched yet". */
  searched: boolean
  /** Search now, skipping the delay (a search button, Enter). */
  submit: () => void
}

/** A search box's state: debounced, latest answer wins, cancelled on unmount. */
export function useDebouncedSearch<T>(search: SearchFn<T>, options: DebouncedSearchOptions = {}): DebouncedSearch<T> {
  const { delayMs = 300, searchEmpty = false } = options
  const [query, setQuery] = React.useState("")
  const [outcome, setOutcome] = React.useState<SearchOutcome<T> & { searched: boolean }>({
    results: [],
    error: undefined,
    searched: false,
  })
  const [loading, setLoading] = React.useState(false)

  const searchRef = React.useRef(search)
  React.useEffect(() => {
    searchRef.current = search
  }, [search])

  const runner = React.useMemo(
    () =>
      createLatestSearch<T>((next) => {
        setOutcome({ ...next, searched: true })
        setLoading(false)
      }),
    [],
  )
  React.useEffect(() => runner.cancel, [runner])

  const start = React.useCallback(
    (q: string) => {
      if (!searchEmpty && !q.trim()) {
        runner.cancel()
        setLoading(false)
        setOutcome({ results: [], error: undefined, searched: false })
        return
      }
      setLoading(true)
      void runner.run(searchRef.current, q.trim())
    },
    [runner, searchEmpty],
  )

  React.useEffect(() => {
    const timer = setTimeout(() => { start(query) }, delayMs)
    return () => { clearTimeout(timer) }
  }, [query, delayMs, start])

  const submit = React.useCallback(() => { start(query) }, [start, query])

  return { query, setQuery, results: outcome.results, loading, error: outcome.error, searched: outcome.searched, submit }
}
