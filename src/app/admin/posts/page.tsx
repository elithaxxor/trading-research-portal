import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { AuthNotice } from "@/components/auth-notice";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPostActions } from "@/components/admin/AdminPostActions";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { listAdminPosts } from "@/lib/admin/posts";
import type { AdminContentVisibility } from "@/lib/admin/types";
import { contentVisibilityValues } from "@/lib/admin/validation";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDate, formatVisibilityLabel } from "@/lib/content/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: {
    canonical: "/admin/posts",
  },
  description:
    "Admin-only research posts workspace for Trading Research Portal.",
  title: "Admin Research Posts",
};

export const dynamic = "force-dynamic";

type AdminPostsPageProps = {
  searchParams?: Promise<{
    page?: string | string[];
    notice?: string | string[];
    published?: string | string[];
    q?: string | string[];
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
    return "Research post published.";
  }

  if (firstValue === "unpublished") {
    return "Research post unpublished.";
  }

  if (firstValue === "deleted") {
    return "Research post deleted.";
  }

  return null;
}

function buildAdminPostsHref({
  page,
  published,
  query,
  visibility,
}: {
  page: number;
  published?: boolean;
  query?: string;
  visibility?: AdminContentVisibility;
}) {
  const searchParams = new URLSearchParams();

  if (query) {
    searchParams.set("q", query);
  }

  if (visibility) {
    searchParams.set("visibility", visibility);
  }

  if (published !== undefined) {
    searchParams.set("published", published ? "published" : "draft");
  }

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const queryString = searchParams.toString();

  return queryString ? `/admin/posts?${queryString}` : "/admin/posts";
}

function SelectFilter({
  children,
  defaultValue,
  label,
  name,
}: {
  children: ReactNode;
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

function AdminPostsFilters({
  published,
  query,
  visibility,
}: {
  published?: boolean;
  query?: string;
  visibility?: AdminContentVisibility;
}) {
  return (
    <CardShell padding="md" tone="subtle">
      <form
        action="/admin/posts"
        className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(9rem,0.35fr)_minmax(9rem,0.35fr)_auto]"
        method="get"
      >
        <label className="relative">
          <span className="sr-only">Search research posts</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            defaultValue={query ?? ""}
            name="q"
            placeholder="Search title, slug, or excerpt"
            type="search"
          />
        </label>

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

        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <button
            className={cn(buttonVariants({ size: "lg", variant: "default" }))}
            type="submit"
          >
            Apply
          </button>
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="/admin/posts"
          >
            Clear
          </Link>
        </div>
      </form>
    </CardShell>
  );
}

export default async function AdminPostsPage({
  searchParams,
}: AdminPostsPageProps) {
  await requireAdmin("/admin/posts");

  const params = await searchParams;
  const query = parseSearch(params?.q);
  const visibility = parseEnum(params?.visibility, contentVisibilityValues);
  const published = parsePublished(params?.published);
  const notice = parseNotice(params?.notice);
  const page = parsePage(params?.page);
  const offset = (page - 1) * PAGE_SIZE;
  const posts = await listAdminPosts({
    limit: PAGE_SIZE,
    offset,
    published,
    search: query,
    visibility,
  });
  const hasPreviousPage = page > 1;
  const hasNextPage = posts.count
    ? offset + posts.items.length < posts.count
    : posts.items.length === PAGE_SIZE;
  const previousHref = buildAdminPostsHref({
    page: page - 1,
    published,
    query,
    visibility,
  });
  const nextHref = buildAdminPostsHref({
    page: page + 1,
    published,
    query,
    visibility,
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "default" }))}
            href="/admin/posts/new"
          >
            <Plus data-icon="inline-start" />
            New Post
          </Link>
        }
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { label: "Posts" },
        ]}
        description="Browse, search, filter, publish, unpublish, and remove research post records from the protected admin workspace."
        eyebrow="Research Posts"
        title="Research posts"
      />

      <AdminPostsFilters
        published={published}
        query={query}
        visibility={visibility}
      />

      {notice ? <AuthNotice message={notice} tone="success" /> : null}

      <CardShell padding="none" tone="elevated">
        {posts.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] text-left text-sm">
              <thead className="border-b border-border bg-secondary/35 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Post</th>
                  <th className="px-4 py-3 font-medium">Access</th>
                  <th className="px-4 py-3 font-medium">Publishing</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.items.map((post) => (
                  <tr className="align-top" key={post.id}>
                    <td className="px-4 py-4">
                      <div className="flex min-w-72 flex-col gap-2">
                        <span className="text-xs text-muted-foreground">
                          /{post.slug}
                        </span>
                        <div>
                          <h2 className="line-clamp-2 font-semibold text-foreground">
                            {post.title}
                          </h2>
                          {post.excerpt ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                              {post.excerpt}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone="muted">
                        {formatVisibilityLabel(post.visibility)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <Badge tone={post.published ? "positive" : "muted"}>
                          {post.published ? "Published" : "Draft"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {post.published_at
                            ? formatDate(post.published_at)
                            : "Not published"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span>Updated {formatDate(post.updated_at)}</span>
                        <span>Created {formatDate(post.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <AdminPostActions
                        id={post.id}
                        published={post.published}
                        slug={post.slug}
                        title={post.title}
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
              actionHref="/admin/posts/new"
              actionLabel="New Research Post"
              description="No research posts match the current filters. Adjust the filters or create a new research draft."
              title="No research posts found"
            />
          </div>
        )}
      </CardShell>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page}
          {posts.count !== null ? ` | ${posts.count} total posts` : null}
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
