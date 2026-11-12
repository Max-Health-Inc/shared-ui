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
- SignInLanding — the signed-out screen with "SMART Login"; `SmartAppShell` renders it, and apps that need more on that screen (an FAQ, sign-up, identity provider shortcuts) pass it as `notice`, `actions` or children; `background` renders behind the page (fixed at `z-0`) and lifts the landing content to `relative z-10`. Once clicked the button shows "Signing in…" with a spinner until `onLogin` rejects or the page comes back from the back/forward cache; `loginHref` links get the same treatment
- PendingButton — a button or link (`href`) that swaps its label for a spinner and `pendingLabel` while `pending`, disabled and `aria-busy`, at the same width
- FloatingPanel — a non-modal panel that floats over a view: drag its header or use the arrow keys on its grip to move it, fold it to its header, and pass `storageKey` to keep its place across visits; it never leaves the window
- FilterToolbar, PageHeader, StatCard, ResponsiveTabsList
- Faq — the org-wide question/answer disclosure list (one answer open at a time)
- LegalDocument — a Privacy Policy or Terms page: effective date, jump-to contents, numbered sections; the app supplies the copy

### Hooks
- `useSmartAuth` — SMART on FHIR auth state management. When a session ends mid-use, `SmartAppShell` keeps the app
  on screen under a sign-in dialog and signs in again in a popup (`authorizeInPopup` from `@babelfhir-ts/smart-auth`
  0.8+), falling back to the redirect when the popup is blocked
  - `redirecting` is true from a sign-in click until the redirect fails or the page is restored from the back/forward cache
- `usePendingAction` — pending state for an action that leaves the page; `SignInLanding`, `SmartAppShell` and `useSmartAuth` share it
- `useBranding` — Dynamic brand theming from backend
- `useModalLayer` / `ModalStackProvider` — Z-index stacking for modals

### Utilities
- `cn()` — Tailwind class merging
- `createSmartAppConfig()` / `createSmartAuth()` / `buildFhirBaseUrl()` — SMART app bootstrap
- `mountApp(app, { rootId?, tooltipDelay? })` — renders `main.tsx`'s app into `#root` inside StrictMode, an
  ErrorBoundary and a TooltipProvider; app-specific providers and the Toaster go in `app`
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
and spacing steps, and the whole radius ladder through `4xl`) and follows brandc when
it changes.

### Light / dark

`ThemeProvider` holds the choice (`light`, `dark` or `system`), stores it in localStorage,
follows the OS while it is `system` and follows other tabs. It sets the `.light`/`.dark`
class, `data-theme` and `color-scheme` on `<html>`. `useTheme()` reads and changes it, and
`<ModeToggle />` is the header control (`variant="toggle"` for a one-click light/dark button).

A prerendered or server-rendered page also needs `ThemeScript` in `<head>`, with the same
options as the provider. It applies the stored or default theme before first paint, so the
page does not flash the wrong theme while React loads:

```tsx
import { ThemeProvider, ThemeScript, type ThemeScriptOptions } from "@max-health-inc/shared-ui"

const theme: ThemeScriptOptions = { defaultTheme: { daytime: { from: 8, to: 20 } }, storageKey: "theme" }

<html suppressHydrationWarning>
  <head><ThemeScript {...theme} nonce={nonce} /></head>
  <body><ThemeProvider {...theme} disableTransitionOnChange>{children}</ThemeProvider></body>
</html>
```

| Option | Where | Default | |
| --- | --- | --- | --- |
| `defaultTheme` | both | `"system"` | A `Theme`, or `{ daytime: { from, to } }`: light from `from` up to `to` (local hours), dark otherwise |
| `storageKey` | both | `"theme"` | localStorage key |
| `enableColorScheme` | both | `true` | Also set `color-scheme`, so native controls and scrollbars follow |
| `disableTransitionOnChange` | provider | `false` | Suppress CSS transitions while switching |
| `nonce` | both | | CSP nonce for the script, and for the provider's transition-suppressing `<style>` |

A Vite SPA, whose `<head>` lives in `index.html`, gets the script from the build instead:

```ts
import { themeScriptPlugin } from "@max-health-inc/shared-ui/vite"

export default defineConfig({ plugins: [react(), themeScriptPlugin(theme)] })
```

Keep `theme` in one module that both `vite.config.ts` and the `<ThemeProvider>` import, so
the script and the provider read the same key and default.

`themeScript(options)` returns the same script as a string, for any other `<head>` that is
not rendered by React. A Content-Security-Policy without `'unsafe-inline'` must allow it: pass the
page's nonce, or stamp the nonce onto every inline script where the HTML is served. The
script resolves the theme with the same functions the provider uses (`chooseTheme`,
`resolveTheme`), serialized, so the two cannot drift.

The app's CSS must declare `@custom-variant dark (&:where(.dark, .dark *));`, otherwise its
`dark:` utilities keep tracking the OS instead of the chosen theme.

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

An app whose server also renders text (error pages, API messages) can have the choice
mirrored into a cookie the server reads. It is opt-in, so other apps set no cookie:

```tsx
createAppI18n(translations, { cookie: {} }) // `locale=de; Path=/; SameSite=Lax`, one year
createAppI18n(translations, { cookie: { name: "lang" } })
```

The cookie holds the primary subtag (`fr-CA` is stored as `fr`), is `Secure` on https, and is
also read during detection, after localStorage.

To reword any of it, pass the app's `t` — it wins for every key the app actually
translates, and the catalogue covers the rest:

```tsx
<SmartAppShell t={t} … />   // also forwarded to AppHeader
```

**Adding a string to a component here:** put the English source in the JSX via
`useUiText()` (or `uiText()` in a class component) and add its row to the catalogue. Do not
inline English in the markup — an app has no way to translate that.

### FHIR display helpers without React

`@max-health-inc/shared-ui/fhir` is the org's one HumanName formatter, importable from a
Worker, an MCP server or any headless package (the module imports nothing):

```ts
import { formatHumanNames, humanNameText } from "@max-health-inc/shared-ui/fhir"

formatHumanNames(patient.name) // official name, else the first; undefined when empty
humanNameText(practitioner.name?.[0]) // text, else prefix + given + family + suffix
medicalRecordNumber(patient.identifier) // the current identifier typed MR; undefined when none is
parseFhirReference(token.fhirUser) // { resourceType, id } of a relative or absolute literal reference, else null
referenceId(link.target?.reference, "Patient") // the id when it names a Patient, else null
isPractitionerReference(token.fhirUser) // a Practitioner or PractitionerRole signed in
```

`formatHumanName(names)` (root export) is the UI label: the same name, or "Unknown".

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
