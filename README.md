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
- `theme.css` — CSS custom properties (light + dark mode) for the MaxHealth design system

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

## Publishing

Push a tag to trigger the GitHub Actions workflow:

```bash
git tag v0.1.0
git push origin v0.1.0
```
