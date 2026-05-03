# @max-health-inc/shared-ui

Shared React UI components, hooks, and utilities for SMART on FHIR healthcare apps.

## Installation

```bash
# Configure GitHub Packages registry for @max-health-inc scope
echo "@max-health-inc:registry=https://npm.pkg.github.com" >> .npmrc

# Install
bun add @max-health-inc/shared-ui
```

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

## Publishing

Push a tag to trigger the GitHub Actions workflow:

```bash
git tag v0.1.0
git push origin v0.1.0
```
