# @max-health-inc/shared-ui

Shared React UI components, hooks, and utilities for SMART on FHIR healthcare apps.

## Installation

Published to **GitHub Packages** on every merge to `main`, so depend on it by semver
range like any other `@max-health-inc` package — not by git URL or commit SHA.

```bash
# Point the @max-health-inc scope at GitHub Packages (once, per consuming repo)
echo "@max-health-inc:registry=https://npm.pkg.github.com" >> .npmrc

bun add @max-health-inc/shared-ui
```

```jsonc
// package.json
"@max-health-inc/shared-ui": "^0.5.0"   // ✅
"@max-health-inc/shared-ui": "github:Max-Health-Inc/shared-ui#0f05673"  // ❌ pinned, no upgrade path
```

Installing needs a token with `read:packages`; CI reads it from `${GITHUB_TOKEN}`.

## Usage

```tsx
import { Button, Card, Spinner } from "@max-health-inc/shared-ui"
import "@max-health-inc/shared-ui/theme.css"
```

## What's included

### Components
- Button, Card, Badge, Input, Label, Select, Tabs, Dialog, Table, ScrollArea, Progress, Tooltip, DropdownMenu, Separator
- AppHeader, PatientBanner, ErrorBoundary, Spinner, Toaster
- FilterToolbar, PageHeader, StatCard, ResponsiveTabsList

### Hooks
- `useSmartAuth` — SMART on FHIR auth state management
- `useBranding` — Dynamic brand theming from backend
- `useModalLayer` / `ModalStackProvider` — Z-index stacking for modals

### Utilities
- `cn()` — Tailwind class merging
- `createSmartAppConfig()` / `createSmartAuth()` / `buildFhirBaseUrl()` — SMART app bootstrap
- `formatHumanName()` — FHIR HumanName formatter
- `createAuthFetch()` / `onAuthError()` / `reportAuthError()` — Auth fetch wrapper

### Theme
- `theme.css` — the MaxHealth design system: brandc's token values, the `@theme inline`
  bridge that maps them onto Tailwind utility names, and this package's base layer and
  utilities.

Importing it is all a consuming app needs. An app that also declares its own
`@theme inline { --color-*: var(--*) }` block in `src/index.css` is maintaining a
second, narrower copy of that bridge — delete it and take this one, which carries the
full token surface (`success`/`warning`/`info`, the `main-*` scale, the shadow, text
and spacing steps) and follows brandc when it changes.

### Text in this package

The components here render some text of their own — "Sign Out", "Session Expired",
"Confirm Action". That text belongs to the component, so its translations ship with it in
`src/lib/ui-text-catalog.ts` (currently de, fr, es, it) rather than being re-translated in
every consuming app.

An app that calls `createAppI18n()` gets it with no wiring: the helper publishes the active
language to this package, and the shared chrome follows a language switch.

```tsx
import { createAppI18n } from "@max-health-inc/shared-ui/i18n"
export default createAppI18n(translations) // shared chrome now follows the app's language
```

Wiring i18n by hand instead? Call `setUiLanguage(lng)` whenever the language changes.

To reword any of it, pass the app's `t` — it wins for every key the app actually
translates, and the catalogue covers the rest:

```tsx
<SmartAppShell t={t} … />   // also forwarded to AppHeader
```

**Adding a string to a component here:** put the English source in the JSX via
`useUiText()` (or `uiText()` in a class component) and add its row to the catalogue. Do not
inline English in the markup — an app has no way to translate that.

## Development

```bash
bun install
bun run build      # Build library
bun run dev        # Watch mode
bun run typecheck  # Type-check without emitting
```

### Releasing

**Bump `version` in `package.json` as part of your PR.** Merging to `main` runs lint,
typecheck, tests and the build, then publishes that version and tags the commit.

A merge whose version is already on the registry publishes nothing and says so in the
run summary — so docs-only and CI-only merges are a safe no-op, and forgetting to bump
means "not released" rather than a failed build.

Pushing a `v*` tag re-runs the same workflow, which is only useful for retrying a
release — the already-published check makes it a no-op otherwise.
