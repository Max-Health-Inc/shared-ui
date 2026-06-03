import * as React from "react"
import { cn } from "../lib/utils"

/* -------------------------------------------------------------------------- */
/*  DataList — a compact, responsive list for displaying records.             */
/*  Think of it as a lighter alternative to <Table> for card-like rows.       */
/* -------------------------------------------------------------------------- */

type DataListDensity = "compact" | "default" | "relaxed"

const densityStyles: Record<DataListDensity, string> = {
  compact: "divide-y divide-border/50",
  default: "divide-y divide-border/50",
  relaxed: "divide-y divide-border/30 [&>[data-slot=data-list-item]]:py-5",
}

/* -------------------------------- DataList -------------------------------- */

interface DataListProps extends React.ComponentProps<"div"> {
  /** Controls vertical padding per row */
  density?: DataListDensity
  /** Strip outer border (useful when nested inside a Card) */
  borderless?: boolean
}

function DataList({
  density = "default",
  borderless = false,
  className,
  children,
  ...props
}: DataListProps) {
  return (
    <div
      data-slot="data-list"
      data-density={density}
      className={cn(
        "rounded-xl overflow-hidden",
        !borderless && "border border-border/50",
        densityStyles[density],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ------------------------------ DataListItem ----------------------------- */

interface DataListItemProps extends React.ComponentProps<"div"> {
  /** Dim the row (e.g. inactive/hidden items) */
  muted?: boolean
  /** Highlight on hover */
  hoverable?: boolean
}

function DataListItem({
  muted = false,
  hoverable = true,
  className,
  children,
  ...props
}: DataListItemProps) {
  return (
    <div
      data-slot="data-list-item"
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors duration-150",
        hoverable && "hover:bg-muted/50",
        muted && "opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ------------------------------ DataListIcon ----------------------------- */

interface DataListIconProps extends React.ComponentProps<"div"> {
  /** Size variant for the icon container */
  size?: "sm" | "md" | "lg"
}

const iconSizes: Record<NonNullable<DataListIconProps["size"]>, string> = {
  sm: "w-8 h-8 rounded-lg text-sm",
  md: "w-10 h-10 rounded-xl text-base",
  lg: "w-12 h-12 rounded-xl text-lg",
}

function DataListIcon({
  size = "md",
  className,
  children,
  ...props
}: DataListIconProps) {
  return (
    <div
      data-slot="data-list-icon"
      className={cn(
        "shrink-0 flex items-center justify-center bg-muted/50",
        iconSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ---------------------------- DataListContent ---------------------------- */

type DataListContentProps = React.ComponentProps<"div">

function DataListContent({ className, children, ...props }: DataListContentProps) {
  return (
    <div
      data-slot="data-list-content"
      className={cn("min-w-0 flex-1", className)}
      {...props}
    >
      {children}
    </div>
  )
}

/* ----------------------------- DataListTitle ----------------------------- */

type DataListTitleProps = React.ComponentProps<"div">

function DataListTitle({ className, children, ...props }: DataListTitleProps) {
  return (
    <div
      data-slot="data-list-title"
      className={cn(
        "font-medium text-sm text-foreground truncate",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* -------------------------- DataListDescription -------------------------- */

type DataListDescriptionProps = React.ComponentProps<"div">

function DataListDescription({ className, children, ...props }: DataListDescriptionProps) {
  return (
    <div
      data-slot="data-list-description"
      className={cn(
        "text-xs text-muted-foreground truncate mt-0.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ----------------------------- DataListBadges ---------------------------- */

type DataListBadgesProps = React.ComponentProps<"div">

function DataListBadges({ className, children, ...props }: DataListBadgesProps) {
  return (
    <div
      data-slot="data-list-badges"
      className={cn(
        "flex flex-wrap items-center gap-1.5 mt-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ---------------------------- DataListActions ---------------------------- */

type DataListActionsProps = React.ComponentProps<"div">

function DataListActions({ className, children, ...props }: DataListActionsProps) {
  return (
    <div
      data-slot="data-list-actions"
      className={cn(
        "shrink-0 flex items-center gap-1.5 ml-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* -------------------------------- Exports -------------------------------- */

export {
  DataList,
  DataListItem,
  DataListIcon,
  DataListContent,
  DataListTitle,
  DataListDescription,
  DataListBadges,
  DataListActions,
  type DataListProps,
  type DataListItemProps,
  type DataListIconProps,
  type DataListContentProps,
  type DataListTitleProps,
  type DataListDescriptionProps,
  type DataListBadgesProps,
  type DataListActionsProps,
  type DataListDensity,
}
