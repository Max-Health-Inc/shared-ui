"use client"

import type * as React from "react"
import { ArrowLeft, Info } from "lucide-react"
import { useUiText, type TFn } from "../../lib/ui-text"
import { cn } from "../../lib/utils"
import { Badge } from "../badge"
import { Button } from "../button"
import { DataList, DataListBadges, DataListContent, DataListDescription, DataListItem, DataListTitle } from "../data-list"
import { PageHeader } from "../page-header"
import { Separator } from "../separator"
import { ChangelogSection, type ChangelogRelease } from "./changelog-section"

export interface AboutProduct {
  label: string
  description?: string
  pitch?: string
}

export interface AboutPageProps {
  /** Omit when the page should not describe the product, e.g. where a regulatory statement in `lead` does. */
  product?: AboutProduct
  manufacturer: string
  contactEmail: string
  version: string
  termsUrl?: string
  privacyUrl?: string
  changelog?: readonly ChangelogRelease[]
  onBack: () => void
  backLabel?: string
  /** Replaces the header's default subtitle. */
  description?: string
  /** Shown first, under the header. */
  lead?: React.ReactNode
  /** Further `DataListItem`s after the version. */
  details?: React.ReactNode
  /** Further sections after the changelog. */
  children?: React.ReactNode
  t?: TFn
  className?: string
}

const LINK = "underline underline-offset-2"

/** Who makes the software, which version is running, what changed and where the terms are. */
export function AboutPage({
  product,
  manufacturer,
  contactEmail,
  version,
  termsUrl,
  privacyUrl,
  changelog = [],
  onBack,
  backLabel,
  description,
  lead,
  details,
  children,
  t: appT,
  className,
}: AboutPageProps) {
  const t = useUiText(appT)
  const hasLegal = Boolean(termsUrl ?? privacyUrl)

  return (
    <div data-slot="about-page" className={cn("mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6", className)}>
      <PageHeader
        title={t("About this software")}
        description={description ?? t("Who makes it, which version you are running, and what changed.")}
        icon={<Info className="size-6" />}
        actions={
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="size-4" />
            {backLabel ?? t("Back")}
          </Button>
        }
      />

      {lead}

      {product && (
        <section className="space-y-2" data-slot="about-product">
          <h2 className="text-sm font-medium">{t(product.label)}</h2>
          {product.description && <p className="text-sm text-muted-foreground">{t(product.description)}</p>}
          {product.pitch && <p className="text-sm text-muted-foreground">{t(product.pitch)}</p>}
        </section>
      )}

      {(lead ?? product) && <Separator />}

      <DataList>
        <DataListItem>
          <DataListContent>
            <DataListTitle>{t("Manufacturer")}</DataListTitle>
            <DataListDescription>
              <a className={LINK} href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
            </DataListDescription>
          </DataListContent>
          <DataListBadges>
            <Badge variant="secondary">{manufacturer}</Badge>
          </DataListBadges>
        </DataListItem>

        <DataListItem>
          <DataListContent>
            <DataListTitle>{t("Software version")}</DataListTitle>
            <DataListDescription>{t("Quote this when reporting a problem.")}</DataListDescription>
          </DataListContent>
          <DataListBadges>
            <Badge variant="outline" className="font-mono normal-case" data-slot="about-version">
              {version}
            </Badge>
          </DataListBadges>
        </DataListItem>

        {details}
      </DataList>

      <ChangelogSection releases={changelog} t={t} />

      {children}

      {hasLegal && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-4 text-sm">
            {termsUrl && (
              <a className={LINK} href={termsUrl} target="_blank" rel="noreferrer">
                {t("Terms")}
              </a>
            )}
            {privacyUrl && (
              <a className={LINK} href={privacyUrl} target="_blank" rel="noreferrer">
                {t("Privacy")}
              </a>
            )}
          </div>
        </>
      )}
    </div>
  )
}
