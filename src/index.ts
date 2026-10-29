// Components
export { Button, buttonVariants } from "./components/button"
export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from "./components/card"
export { Badge, badgeVariants } from "./components/badge"
export { Input } from "./components/input"
export { Label } from "./components/label"
export { Spinner } from "./components/spinner"
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue } from "./components/select"
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from "./components/tabs"
export { ResponsiveTabsList, type ResponsiveTabsListProps } from "./components/responsive-tabs-list"
export { PageHeader, type PageHeaderProps } from "./components/page-header"
export { PageLayout, type PageLayoutProps } from "./components/page-layout"
export { FilterToolbar, FilterToolbarItem, type FilterToolbarProps, type FilterToolbarItemProps } from "./components/filter-toolbar"
export { StatCard, colorMap, type StatCardProps, type StatCardColor } from "./components/stat-card"
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/tooltip"
export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./components/dialog"
export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription } from "./components/sheet"
export { Separator } from "./components/separator"
export { DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "./components/dropdown-menu"
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from "./components/table"
export { DataList, DataListItem, DataListIcon, DataListContent, DataListTitle, DataListDescription, DataListBadges, DataListActions, type DataListProps, type DataListItemProps, type DataListIconProps, type DataListContentProps, type DataListTitleProps, type DataListDescriptionProps, type DataListBadgesProps, type DataListActionsProps, type DataListDensity } from "./components/data-list"
export { Alert, AlertTitle, AlertDescription, alertVariants } from "./components/alert"
export { ScrollArea, ScrollBar } from "./components/scroll-area"
export { Progress } from "./components/progress"
export { Toaster, type ThemedToasterProps } from "./components/sonner"
export { ErrorBoundary, type ErrorBoundaryProps } from "./components/error-boundary"
export { ServiceUnavailable, type ServiceUnavailableProps, type ServiceErrorVariant } from "./components/service-unavailable"
export { AppHeader, type AppHeaderProps } from "./components/app-header"
export { UserProfileFormFields, type UserProfileFormFieldsProps, type UserProfileData } from "./components/user-profile-fields"
export { SmartAppShell, usePatientId, type SmartAppShellProps } from "./components/smart-app-shell"
export { SignInLanding, type SignInLandingProps } from "./components/sign-in-landing"
export { PwaInstallButton, type PwaInstallButtonProps } from "./components/pwa-install-button"
export { ServiceWorkerUpdatePrompt, type ServiceWorkerUpdatePromptProps } from "./components/service-worker-update-banner"

// New generic components
export { Textarea } from "./components/textarea"
export { Checkbox } from "./components/checkbox"
export { Switch } from "./components/switch"
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./components/collapsible"
export { Faq, type FaqProps, type QandA } from "./components/faq"
export { EmptyState, type EmptyStateProps } from "./components/empty-state"
export { LegalDocument, type LegalDocumentProps, type LegalSection } from "./components/legal-document"
export { MessageBanner, messageBannerVariants, type MessageBannerProps } from "./components/message-banner"
export { CloseButton, type CloseButtonProps } from "./components/close-button"
export { SectionHeader, type SectionHeaderProps } from "./components/section-header"
export { FilterTabs, filterTabsVariants, type FilterTabsProps, type FilterOption } from "./components/filter-tabs"
export { Combobox, type ComboboxProps, type ComboboxOption } from "./components/combobox"
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "./components/popover"
export { ConfirmProvider, useConfirm } from "./components/confirm-dialog"
export { Form, FormField, FormError, FormActions } from "./components/form"
export { useFormFieldControl } from "./components/form-field-context"
export { Loader, LoaderOverlay } from "./components/loader"
export { NativeSelect, type NativeSelectProps } from "./components/native-select"

// Utilities
export { cn } from "./lib/utils"
export { streamDownload, pumpToPort, prefersBlobDownload, type StreamDownloadOptions, type StreamDownloadMode, type DownloadPort } from "./lib/stream-download"
export { createSmartAppConfig, createSmartAuth, buildFhirBaseUrl, buildAppStoreUrl, appBaseUrl, setAppBasePath, type SmartAppConfig, type SmartAppEnv } from "./lib/smart-app-config"
export { CHART_COLORS } from "./lib/chart-colors"

// FHIR helpers
export { formatHumanName, formatHumanNames, humanNameText, type FhirHumanName } from "./lib/fhir-helpers"

export {
  formatDate,
  formatDate as formatFhirDate,
  formatDateTime,
  formatMonth,
  formatTime,
  formatRelativeTime,
  parseFhirDate,
  displayLocale,
  type DateInput,
  type DateFormatOptions,
  type DateTimeFormatOptions,
} from "./lib/datetime"

// This package's own strings and how they resolve. `setUiLanguage` is called for
// you by `createAppI18n` (see the `/i18n` subpath); it is exported for an app
// that wires i18n by hand.
export {
  setUiLanguage,
  getUiLanguage,
  useUiText,
  useUiLanguage,
  uiText,
  identityT,
  interpolate,
  type TFn,
} from "./lib/ui-text"
export { UI_TEXT, UI_TEXT_LANGUAGES } from "./lib/ui-text-catalog"

/*
 * The FHIR verification model and the clinical record components moved to
 * `@max-health-inc/ui`. They encoded product-specific clinical decisions rather than reusable
 * UI, so they belong to the product that makes them.
 *
 * What stays here is what any SMART on FHIR app can use: the primitives, the app shell, the
 * translate contract, and the FHIR formatting helpers those components consume from this side.
 */

// Auth utilities
export { onAuthError, reportAuthError, createAuthFetch } from "./lib/auth-error"
export { safeFetch, safeFetchResult, type SafeFetchOptions, type ApiError } from "./lib/safe-fetch"
export { errorStatus, serviceErrorVariant } from "./lib/service-error"
export { browserConnectivity, connectivityOf, type Connectivity } from "./lib/connectivity"

// Hooks
export { useBranding, setBrandingSource, resolveBrandBundleUrl, parseBrandBundle, type BrandInfo } from "./hooks/use-branding"
export { useCopyToClipboard, type CopyToClipboard } from "./hooks/use-copy-to-clipboard"
export { silentSignIn, type SilentSignIn } from "./lib/silent-sign-in"
export { ModalStackProvider, useModalLayer, useLayerZIndex, LayerContext, type ModalStackProviderProps } from "./hooks/use-modal-stack"
export {
  useSmartAuth,
  isSilentSignInRefusal,
  type AuthorizeOptions,
  type SmartAppState,
  type SmartAuthLike,
  type UseSmartAuthOptions,
} from "./hooks/use-smart-auth"
export {
  useScene,
  SCENES,
  type Scene,
  type UseSceneOptions,
} from "./hooks/use-scene"
export { ScenePicker, type ScenePickerProps } from "./components/scene-picker"
export {
  ThemeProvider,
  useTheme,
  ThemeContext,
  resolveTheme,
  isTheme,
  THEMES,
  type Theme,
  type ResolvedTheme,
  type ThemeProviderProps,
  type ThemeProviderState,
} from "./hooks/use-theme"
export { ModeToggle, type ModeToggleProps } from "./components/mode-toggle"
export { SettingsDialog, type SettingsDialogProps } from "./components/settings-dialog"
export { SettingsLayout, type SettingsLayoutProps, type SettingsSection } from "./components/settings-layout"
export { SidebarLayout, type SidebarLayoutProps, type SidebarGroup, type SidebarItem } from "./components/sidebar-layout"
export { CodeBlock, type CodeBlockProps } from "./components/code-block"
export { CopyButton, type CopyButtonProps } from "./components/copy-button"
export { HeaderLabel } from "./components/header-label"
export { useHeaderCompact } from "./lib/header-compact"
export { formatPlanPrice } from "./components/billing/price"
export {
  PlanCard,
  type PlanCardProps,
  type PricingPlan,
  type BillingInterval,
} from "./components/billing/plan-card"
export { PricingGrid, type PricingGridProps } from "./components/billing/pricing-grid"
export {
  useBillingRedirect,
  requestRedirect,
  readBillingReturn,
  withoutBillingReturn,
  type BillingRedirect,
  type BillingReturnFlag,
  type BillingNotice,
  type UseBillingRedirectOptions,
  type FetchLike,
} from "./components/billing/use-billing-redirect"
export {
  usePwaInstall,
  type UsePwaInstallReturn,
  PWA_INSTALL_CAPTURE_SCRIPT,
} from "./hooks/use-pwa-install"
export {
  useServiceWorkerUpdate,
  type UseServiceWorkerUpdateOptions,
  type UseServiceWorkerUpdateReturn,
} from "./hooks/use-service-worker-update"
