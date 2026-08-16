import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";

import { CardShell } from "@/components/card-shell";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { MemberActionNotice } from "@/components/member-action-notice";
import { SoftwareAccessBadge } from "@/components/software/SoftwareAccessBadge";
import { SoftwareAccessRequestForm } from "@/components/software/SoftwareAccessRequestForm";
import { SoftwareLockedPanel } from "@/components/software/SoftwareLockedPanel";
import { SoftwareSetupInstructions } from "@/components/software/SoftwareSetupInstructions";
import { SoftwareVersionPanel } from "@/components/software/SoftwareVersionPanel";
import { buttonVariants } from "@/components/ui/button";
import {
  formatSoftwareAccessTier,
} from "@/lib/software/format";
import { recordOpsEventSafely } from "@/lib/ops/events";
import { getSoftwareProductPageData } from "@/lib/software/products";
import { getMySoftwareAccessRequest } from "@/lib/software/requests";
import { sanitizeSoftwareUrl } from "@/lib/software/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type SoftwareProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: SoftwareProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSoftwareProductPageData(slug).catch(() => ({
    kind: "not_found" as const,
  }));

  if (data.kind !== "full") {
    return {
      description: "Tier-gated software library access.",
      title: "Software Library",
    };
  }

  return {
    description:
      data.product.short_description ??
      "Tier-gated software documentation and access details.",
    title: data.product.title,
  };
}

export default async function SoftwareProductPage({
  params,
  searchParams,
}: SoftwareProductPageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const data = await getSoftwareProductPageData(slug);

  if (data.kind === "not_found") {
    notFound();
  }

  if (data.kind === "locked") {
    return <LockedSoftwareProduct reason={data.reason} />;
  }

  const product = data.product;
  await recordSoftwareProductViewEvent({
    accessTier: product.access_tier,
    deliveryType: product.delivery_type,
    productId: product.id,
    slug,
    softwareType: product.software_type,
  });
  const existingRequest = await getMySoftwareAccessRequest(product.id).catch(
    () => null
  );
  const tradingViewScriptUrl = getSafeSoftwareUrl(
    product.tradingview_script_url
  );
  const externalUrl = getSafeSoftwareUrl(product.external_url);

  return (
    <div className="grid gap-8">
      <DashboardPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href="/dashboard/software"
          >
            <ArrowLeft data-icon="inline-start" />
            Software library
          </Link>
        }
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/dashboard/software", label: "Software" },
          { label: product.title },
        ]}
        description={
          product.short_description ??
          "Software documentation and manual access details."
        }
        eyebrow={formatSoftwareAccessTier(product.access_tier)}
        title={product.title}
      />

      <MemberActionNotice notice={search?.notice} />

      <CardShell padding="lg" tone="elevated">
        <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <SoftwareAccessBadge accessTier={product.access_tier} kind="tier" />
              <SoftwareAccessBadge kind="type" softwareType={product.software_type} />
              <SoftwareAccessBadge deliveryType={product.delivery_type} kind="delivery" />
              {existingRequest ? (
                <SoftwareAccessBadge
                  kind="status"
                  status={existingRequest.status}
                />
              ) : null}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {product.full_description ??
                product.short_description ??
                "No full description has been published yet."}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              Software is provided for educational workflow support. This app
              does not execute trades, connect to a broker, or automate
              TradingView invite permissions.
            </p>
          </div>
          <SoftwareVersionPanel product={product} />
        </div>
      </CardShell>

      <SoftwareAccessRequestForm
        deliveryType={product.delivery_type}
        existingRequest={existingRequest}
        productId={product.id}
        slug={product.slug}
      />

      {product.software_type === "pinescript" &&
      product.member_download_enabled &&
      product.download_storage_path ? (
        <DashboardSection title="Member download">
          <CardShell padding="md" tone="subtle">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-muted-foreground">
                This protected file link is generated after a fresh Premium or Pro access check.
              </p>
              <a className={cn(buttonVariants({ size: "lg" }))} href={`/api/software/${product.id}/download`}>
                <Download data-icon="inline-start" />
                Download Pine Script
              </a>
            </div>
          </CardShell>
        </DashboardSection>
      ) : null}

      <DashboardSection title="Documentation">
        <SoftwareSetupInstructions
          fallback="Documentation has not been published yet."
          value={product.documentation}
        />
      </DashboardSection>

      <DashboardSection title="Setup instructions">
        <SoftwareSetupInstructions
          fallback="Setup instructions have not been published yet."
          value={product.setup_instructions}
        />
      </DashboardSection>

      <DashboardSection title="Release notes">
        <SoftwareSetupInstructions
          fallback="Release notes have not been published yet."
          value={product.release_notes}
        />
      </DashboardSection>

      {tradingViewScriptUrl || externalUrl ? (
        <DashboardSection title="Links">
          <div className="flex flex-col gap-3 sm:flex-row">
            {tradingViewScriptUrl ? (
              <a
                className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
                href={tradingViewScriptUrl}
                rel="noreferrer"
                target="_blank"
              >
                TradingView script
                <ExternalLink data-icon="inline-end" />
              </a>
            ) : null}
            {externalUrl ? (
              <a
                className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
                href={externalUrl}
                rel="noreferrer"
                target="_blank"
              >
                External documentation
                <ExternalLink data-icon="inline-end" />
              </a>
            ) : null}
          </div>
        </DashboardSection>
      ) : null}

      <DashboardSection title="Risk disclosure">
        <SoftwareSetupInstructions
          fallback="Software tools are educational workflow aids and are not financial advice."
          value={product.risk_disclosure}
        />
      </DashboardSection>
    </div>
  );
}

function LockedSoftwareProduct({ reason }: { reason: string }) {
  return (
    <div className="grid gap-8">
      <DashboardPageHeader
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/dashboard/software", label: "Software" },
          { label: "Locked" },
        ]}
        description="This software product requires a higher access tier."
        title="Software locked"
      />
      <SoftwareLockedPanel message="Software access is available to Premium and Pro members." reason={reason} />
    </div>
  );
}

async function getCurrentUserIdForOpsView() {
  const supabase = await createSupabaseServerClient().catch(() => null);

  if (!supabase) {
    return null;
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function recordSoftwareProductViewEvent({
  accessTier,
  deliveryType,
  productId,
  slug,
  softwareType,
}: {
  accessTier: string;
  deliveryType: string;
  productId: string;
  slug: string;
  softwareType: string;
}) {
  await recordOpsEventSafely({
    entityId: productId,
    entityType: "software_product",
    eventName: "software_product_viewed",
    metadata: {
      access_tier: accessTier,
      delivery_type: deliveryType,
      software_type: softwareType,
    },
    route: `/dashboard/software/${slug}`,
    source: "server",
    userId: await getCurrentUserIdForOpsView(),
  });
}

function getSafeSoftwareUrl(value: string | null) {
  try {
    return sanitizeSoftwareUrl(value);
  } catch {
    return null;
  }
}
