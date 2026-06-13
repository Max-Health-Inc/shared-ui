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
export { PatientBanner, type PatientBannerProps, type BannerPatient } from "./components/patient-banner"
export { UserProfileFormFields, type UserProfileFormFieldsProps, type UserProfileData } from "./components/user-profile-fields"
export { SmartAppShell, usePatientId, type SmartAppShellProps } from "./components/smart-app-shell"
export { PwaInstallButton, type PwaInstallButtonProps } from "./components/pwa-install-button"
export { ServiceWorkerUpdatePrompt, type ServiceWorkerUpdatePromptProps } from "./components/service-worker-update-banner"

// New generic components
export { Textarea } from "./components/textarea"
export { Checkbox } from "./components/checkbox"
export { Switch } from "./components/switch"
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./components/collapsible"
export { EmptyState, type EmptyStateProps } from "./components/empty-state"
export { MessageBanner, messageBannerVariants, type MessageBannerProps } from "./components/message-banner"
export { CloseButton, type CloseButtonProps } from "./components/close-button"
export { SectionHeader, type SectionHeaderProps } from "./components/section-header"
export { FilterTabs, filterTabsVariants, type FilterTabsProps, type FilterOption } from "./components/filter-tabs"
export { Combobox, type ComboboxProps, type ComboboxOption } from "./components/combobox"
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "./components/popover"
export { ConfirmProvider, useConfirm } from "./components/confirm-dialog"
export { Form, FormField, FormError, FormActions } from "./components/form"
export { Loader, LoaderOverlay } from "./components/loader"
export { NativeSelect, type NativeSelectProps } from "./components/native-select"

// Utilities
export { cn } from "./lib/utils"
export { createSmartAppConfig, createSmartAuth, buildFhirBaseUrl, type SmartAppConfig } from "./lib/smart-app-config"
export { CHART_COLORS } from "./lib/chart-colors"

// FHIR helpers
export { formatHumanName, formatFhirDate } from "./lib/fhir-helpers"

// Auth utilities
export { onAuthError, reportAuthError, createAuthFetch } from "./lib/auth-error"
export { safeFetch, safeFetchResult, type SafeFetchOptions, type ApiError } from "./lib/safe-fetch"

// Hooks
export { useBranding, type BrandInfo } from "./hooks/use-branding"
export { ModalStackProvider, useModalLayer, useLayerZIndex, LayerContext, type ModalStackProviderProps } from "./hooks/use-modal-stack"
export {
  useSmartAuth,
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
