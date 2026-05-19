import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { AuthNotice } from "@/components/auth-notice";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSoftwareActions } from "@/components/admin/AdminSoftwareActions";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import {
  formatSoftwareAccessTier,
  formatSoftwareDeliveryType,
  formatSoftwareType,
} from "@/lib/software/format";
import { listAdminSoftwareProducts } from "@/lib/software/products";
import type { SoftwareAccessTier } from "@/lib/software/types";
import { softwareAccessTierValues } from "@/lib/software/validation";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Software",
};

export const dynamic = "force-dynamic";

type AdminSoftwarePageProps = {
  searchParams?: Promise<{
    access_tier?: string | string[];
    notice?: string | string[];
    published?: string | string[];
    q?: string | string[];
  }>;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseSearch(value?: string | string[]) {
  const query = getFirstParam(value)?.trim().replace(/\s+/g, " ");

  return query ? query.slice(0, 120) : undefined;
}

function parsePublished(value?: string | string[]) {
  const firstValue = getFirstParam(value);

  if (firstValue === "published") {
    return true;
  }

  if (firstValue === "draft") {
    return false;
  }

  return undefined;
}

function parseAccessTier(value?: string | string[]) {
  const firstValue = getFirstParam(value);

  return firstValue && softwareAccessTierValues.includes(firstValue as SoftwareAccessTier)
    ? (firstValue as SoftwareAccessTier)
    : undefined;
}

function parseNotice(value?: string | string[]) {
  const firstValue = getFirstParam(value);

  if (firstValue === "published") {
    return "Software product published.";
  }

  if (firstValue === "unpublished") {
    return "Software product unpublished.";
  }

  if (firstValue === "deleted") {
    return "Software product deleted.";
  }

  return null;
}

export default async function AdminSoftwarePage({
  searchParams,
}: AdminSoftwarePageProps) {
  await requireAdmin("/admin/software");

  const params = await searchParams;
  const query = parseSearch(params?.q);
  const published = parsePublished(params?.published);
  const accessTier = parseAccessTier(params?.access_tier);
  const notice = parseNotice(params?.notice);
  const products = await listAdminSoftwareProducts({
    accessTier,
    limit: 100,
    published,
    search: query,
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        actions={
          <>
            <Link
              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              href="/admin/software/requests"
            >
              Access Requests
            </Link>
            <Link
              className={cn(buttonVariants({ size: "sm", variant: "default" }))}
              href="/admin/software/new"
            >
              <Plus data-icon="inline-start" />
              New Software
            </Link>
          </>
        }
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { label: "Software" },
        ]}
        description="Manage tier-gated member software documentation and manual access workflows."
        eyebrow="Software"
        title="Software library"
      />

      <CardShell padding="md" tone="subtle">
        <form
          action="/admin/software"
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,0.35fr)_minmax(10rem,0.35fr)_auto]"
          method="get"
        >
          <label className="relative">
            <span className="sr-only">Search software</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              defaultValue={query ?? ""}
              name="q"
              placeholder="Search title, slug, description, or version"
              type="search"
            />
          </label>

          <select
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            defaultValue={accessTier ?? ""}
            name="access_tier"
          >
            <option value="">All tiers</option>
            {softwareAccessTierValues.map((tier) => (
              <option key={tier} value={tier}>
                {formatSoftwareAccessTier(tier)}
              </option>
            ))}
          </select>

          <select
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            defaultValue={published === undefined ? "" : published ? "published" : "draft"}
            name="published"
          >
            <option value="">All states</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <button
              className={cn(buttonVariants({ size: "lg", variant: "default" }))}
              type="submit"
            >
              Apply
            </button>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href="/admin/software"
            >
              Clear
            </Link>
          </div>
        </form>
      </CardShell>

      {notice ? <AuthNotice message={notice} tone="success" /> : null}

      <CardShell padding="none" tone="elevated">
        {products.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] text-left text-sm">
              <thead className="border-b border-border bg-secondary/35 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Software</th>
                  <th className="px-4 py-3 font-medium">Access</th>
                  <th className="px-4 py-3 font-medium">Delivery</th>
                  <th className="px-4 py-3 font-medium">Publishing</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.items.map((product) => (
                  <tr className="align-top" key={product.id}>
                    <td className="px-4 py-4">
                      <div className="flex min-w-80 flex-col gap-2">
                        <span className="text-xs text-muted-foreground">
                          /{product.slug}
                        </span>
                        <div>
                          <h2 className="line-clamp-2 font-semibold text-foreground">
                            {product.title}
                          </h2>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Version {product.version ?? "not listed"}
                          </p>
                          {product.short_description ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                              {product.short_description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Badge tone="gold">
                          {formatSoftwareAccessTier(product.access_tier)}
                        </Badge>
                        <Badge tone="muted">
                          {formatSoftwareType(product.software_type)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone="muted">
                        {formatSoftwareDeliveryType(product.delivery_type)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Badge tone={product.published ? "positive" : "muted"}>
                          {product.published ? "Published" : "Draft"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(product.published_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <AdminSoftwareActions
                        id={product.id}
                        published={product.published}
                        slug={product.slug}
                        title={product.title}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <AdminEmptyState
              actionHref="/admin/software/new"
              actionLabel="New Software"
              description="No software products match the current filters."
              title="No software products found"
            />
          </div>
        )}
      </CardShell>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not published";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not published";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}
