import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { AuthNotice } from "@/components/auth-notice";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminIdeaActions } from "@/components/admin/AdminIdeaActions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminIdeas } from "@/lib/admin/ideas";
import {
  assetClassValues,
  contentVisibilityValues,
  ideaStatusValues,
} from "@/lib/admin/validation";
import {
  formatBias,
  formatDate,
  formatIdeaStatus,
  formatRiskLevel,
  formatVisibilityLabel,
} from "@/lib/content/format";
import type {
  AdminAssetClass,
  AdminContentVisibility,
  AdminIdeaStatus,
} from "@/lib/admin/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: {
    canonical: "/admin/ideas",
  },
  description:
    "Admin-only trading ideas workspace for Trading Research Portal.",
  title: "Admin Trading Ideas",
};

export const dynamic = "force-dynamic";

type AdminIdeasPageProps = {
  searchParams?: Promise<{
    asset_class?: string | string[];
    notice?: string | string[];
    page?: string | string[];
    published?: string | string[];
    q?: string | string[];
    status?: string | string[];
    visibility?: string | string[];
  }>;
};

const PAGE_SIZE = 12;

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseSearch(value?: string | string[]) {
  const query = getFirstParam(value)?.trim().replace(/\s+/g, " ");

  return query ? query.slice(0, 120) : undefined;
}

function parsePage(value?: string | string[]) {
  const page = Number(getFirstParam(value) ?? "1");

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function parseEnum<TValue extends string>(
  value: string | string[] | undefined,
  allowedValues: readonly TValue[]
) {
  const firstValue = getFirstParam(value);

  return firstValue && allowedValues.includes(firstValue as TValue)
    ? (firstValue as TValue)
    : undefined;
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

function parseNotice(value?: string | string[]) {
  const firstValue = getFirstParam(value);

  if (firstValue === "published") {
    return "Trading idea published.";
  }

  if (firstValue === "unpublished") {
    return "Trading idea unpublished.";
  }

  if (firstValue === "deleted") {
    return "Trading idea deleted.";
  }

  return null;
}

function buildAdminIdeasHref({
  assetClass,
  page,
  published,
  query,
  status,
  visibility,
}: {
  assetClass?: AdminAssetClass;
  page: number;
  published?: boolean;
  query?: string;
  status?: AdminIdeaStatus;
  visibility?: AdminContentVisibility;
}) {
  const searchParams = new URLSearchParams();

  if (query) {
    searchParams.set("q", query);
  }

  if (status) {
    searchParams.set("status", status);
  }

  if (visibility) {
    searchParams.set("visibility", visibility);
  }

  if (assetClass) {
    searchParams.set("asset_class", assetClass);
  }

  if (published !== undefined) {
    searchParams.set("published", published ? "published" : "draft");
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const queryString = searchParams.toString();

  return queryString ? `/admin/ideas?${queryString}` : "/admin/ideas";
}

function formatAssetClass(value: AdminAssetClass) {
  return value === "etf"
    ? "ETF"
    : value.charAt(0).toUpperCase() + value.slice(1);
}

function AdminIdeasFilters({
  assetClass,
  published,
  query,
  status,
  visibility,
}: {
  assetClass?: AdminAssetClass;
  published?: boolean;
  query?: string;
  status?: AdminIdeaStatus;
  visibility?: AdminContentVisibility;
}) {
  return (
    <CardShell padding="md" tone="subtle">
      <form
        action="/admin/ideas"
        className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_repeat(4,minmax(9rem,0.35fr))_auto]"
        method="get"
      >
        <label className="relative">
          <span className="sr-only">Search trading ideas</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            defaultValue={query ?? ""}
            name="q"
            placeholder="Search title, ticker, slug, or setup"
            type="search"
          />
        </label>

        <SelectFilter defaultValue={status ?? ""} label="Status" name="status">
          <option value="">All statuses</option>
          {ideaStatusValues.map((value) => (
            <option key={value} value={value}>
              {formatIdeaStatus(value)}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter
          defaultValue={visibility ?? ""}
          label="Visibility"
          name="visibility"
        >
          <option value="">All visibility</option>
          {contentVisibilityValues.map((value) => (
            <option key={value} value={value}>
              {formatVisibilityLabel(value)}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter
          defaultValue={assetClass ?? ""}
          label="Asset class"
          name="asset_class"
        >
          <option value="">All assets</option>
          {assetClassValues.map((value) => (
            <option key={value} value={value}>
              {formatAssetClass(value)}
            </option>
          ))}
        </SelectFilter>

        <SelectFilter
          defaultValue={
            published === undefined ? "" : published ? "published" : "draft"
          }
          label="Published state"
          name="published"
        >
          <option value="">All states</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </SelectFilter>

        <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
          <button
            className={cn(buttonVariants({ size: "lg", variant: "default" }))}
            type="submit"
          >
            Apply
          </button>
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="/admin/ideas"
          >
            Clear
          </Link>
        </div>
      </form>
    </CardShell>
  );
}

function SelectFilter({
  children,
  defaultValue,
  label,
  name,
}: {
  children: React.ReactNode;
  defaultValue: string;
  label: string;
  name: string;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        defaultValue={defaultValue}
        name={name}
      >
        {children}
      </select>
    </label>
  );
}

export default async function AdminIdeasPage({
  searchParams,
}: AdminIdeasPageProps) {
  await requireAdmin("/admin/ideas");

  const params = await searchParams;
  const query = parseSearch(params?.q);
  const status = parseEnum(params?.status, ideaStatusValues);
  const visibility = parseEnum(params?.visibility, contentVisibilityValues);
  const assetClass = parseEnum(params?.asset_class, assetClassValues);
  const published = parsePublished(params?.published);
  const notice = parseNotice(params?.notice);
  const page = parsePage(params?.page);
  const offset = (page - 1) * PAGE_SIZE;
  const ideas = await listAdminIdeas({
    assetClass,
    limit: PAGE_SIZE,
    offset,
    published,
    search: query,
    status,
    visibility,
  });
  const hasPreviousPage = page > 1;
  const hasNextPage = ideas.count
    ? offset + ideas.items.length < ideas.count
    : ideas.items.length === PAGE_SIZE;
  const previousHref = buildAdminIdeasHref({
    assetClass,
    page: page - 1,
    published,
    query,
    status,
    visibility,
  });
  const nextHref = buildAdminIdeasHref({
    assetClass,
    page: page + 1,
    published,
    query,
    status,
    visibility,
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "default" }))}
            href="/admin/ideas/new"
          >
            <Plus data-icon="inline-start" />
            New Idea
          </Link>
        }
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { label: "Ideas" },
        ]}
        description="Browse, search, filter, publish, unpublish, and remove trading idea records from the protected admin workspace."
        eyebrow="Trading Ideas"
        title="Trading ideas"
      />

      <AdminIdeasFilters
        assetClass={assetClass}
        published={published}
        query={query}
        status={status}
        visibility={visibility}
      />

      {notice ? <AuthNotice message={notice} tone="success" /> : null}

      <CardShell padding="none" tone="elevated">
        {ideas.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[72rem] text-left text-sm">
              <thead className="border-b border-border bg-secondary/35 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Idea</th>
                  <th className="px-4 py-3 font-medium">Access</th>
                  <th className="px-4 py-3 font-medium">Setup</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Publishing</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ideas.items.map((idea) => (
                  <tr className="align-top" key={idea.id}>
                    <td className="px-4 py-4">
                      <div className="flex min-w-64 flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="gold">{idea.ticker}</Badge>
                          <span className="text-xs text-muted-foreground">
                            /{idea.slug}
                          </span>
                        </div>
                        <div>
                          <h2 className="line-clamp-2 font-semibold text-foreground">
                            {idea.title}
                          </h2>
                          {idea.setup_type ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {idea.setup_type}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Badge tone="muted">
                          {formatVisibilityLabel(idea.visibility)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatAssetClass(idea.asset_class)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Badge tone="default">{formatBias(idea.bias)}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatIdeaStatus(idea.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone="default">
                        {formatRiskLevel(idea.risk_level)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Badge tone={idea.published ? "positive" : "muted"}>
                          {idea.published ? "Published" : "Draft"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {idea.published_at
                            ? formatDate(idea.published_at)
                            : "Not published"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span>Updated {formatDate(idea.updated_at)}</span>
                        <span>Created {formatDate(idea.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <AdminIdeaActions
                        id={idea.id}
                        published={idea.published}
                        slug={idea.slug}
                        title={idea.title}
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
              actionHref="/admin/ideas/new"
              actionLabel="Create New Idea"
              description="No trading ideas match the current filters. Adjust the filters or start a new admin idea draft."
              title="No trading ideas found"
            />
          </div>
        )}
      </CardShell>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page}
          {ideas.count !== null ? ` | ${ideas.count} total ideas` : null}
        </p>
        <div className="flex gap-2">
          <Link
            aria-disabled={!hasPreviousPage}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              !hasPreviousPage && "pointer-events-none opacity-50"
            )}
            href={hasPreviousPage ? previousHref : "#"}
          >
            <ChevronLeft data-icon="inline-start" />
            Previous
          </Link>
          <Link
            aria-disabled={!hasNextPage}
            className={cn(
              buttonVariants({ size: "sm", variant: "outline" }),
              !hasNextPage && "pointer-events-none opacity-50"
            )}
            href={hasNextPage ? nextHref : "#"}
          >
            Next
            <ChevronRight data-icon="inline-end" />
          </Link>
        </div>
      </div>
    </div>
  );
}
