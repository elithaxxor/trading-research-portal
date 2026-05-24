import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Filter } from "lucide-react";

import { updateReadinessCheckAction } from "@/app/admin/ops/actions";
import { OpsEmptyState } from "@/components/admin/ops/OpsEmptyState";
import { OpsPageHeader } from "@/components/admin/ops/OpsPageHeader";
import { ReadinessStatusBadge } from "@/components/admin/ops/ReadinessStatusBadge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { formatMetricDate, formatOpsCategory } from "@/lib/ops/format";
import { listReadinessChecks } from "@/lib/ops/readiness";
import { opsCheckCategoryValues, opsCheckStatusValues } from "@/lib/ops/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations Readiness",
};

type ReadinessPageProps = {
  searchParams?: Promise<{
    blocking?: string | string[];
    category?: string | string[];
    status?: string | string[];
  }>;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
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

function parseBlocking(value?: string | string[]) {
  const firstValue = getFirstParam(value);

  if (firstValue === "true") {
    return true;
  }

  if (firstValue === "false") {
    return false;
  }

  return undefined;
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

export default async function AdminOpsReadinessPage({
  searchParams,
}: ReadinessPageProps) {
  await requireAdmin("/admin/ops/readiness");

  const params = await searchParams;
  const category = parseEnum(params?.category, opsCheckCategoryValues);
  const status = parseEnum(params?.status, opsCheckStatusValues);
  const blocking = parseBlocking(params?.blocking);
  const checks = (await listReadinessChecks()).filter((check) => {
    if (category && check.category !== category) {
      return false;
    }

    if (status && check.status !== status) {
      return false;
    }

    if (blocking !== undefined && check.blocking_launch !== blocking) {
      return false;
    }

    return true;
  });
  const blockingChecks = checks.filter((check) => check.blocking_launch);

  return (
    <div className="space-y-8">
      <OpsPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="/admin/ops"
          >
            Operations
          </Link>
        }
        description="Review launch gates, update evidence, and keep blockers visible before enabling live billing or production email."
        title="Readiness"
      />

      <CardShell padding="md" tone="subtle">
        <form
          action="/admin/ops/readiness"
          className="grid gap-3 lg:grid-cols-[minmax(10rem,0.5fr)_minmax(10rem,0.5fr)_minmax(10rem,0.4fr)_auto]"
          method="get"
        >
          <SelectFilter
            defaultValue={category ?? ""}
            label="Readiness category"
            name="category"
          >
            <option value="">All categories</option>
            {opsCheckCategoryValues.map((value) => (
              <option key={value} value={value}>
                {formatOpsCategory(value)}
              </option>
            ))}
          </SelectFilter>

          <SelectFilter
            defaultValue={status ?? ""}
            label="Readiness status"
            name="status"
          >
            <option value="">All statuses</option>
            {opsCheckStatusValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectFilter>

          <SelectFilter
            defaultValue={
              blocking === undefined ? "" : blocking ? "true" : "false"
            }
            label="Blocking launch"
            name="blocking"
          >
            <option value="">All launch gates</option>
            <option value="true">Blocking only</option>
            <option value="false">Non-blocking only</option>
          </SelectFilter>

          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <button
              className={cn(buttonVariants({ size: "lg", variant: "default" }))}
              type="submit"
            >
              <Filter aria-hidden="true" className="size-4" />
              Apply
            </button>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href="/admin/ops/readiness"
            >
              Reset
            </Link>
          </div>
        </form>
      </CardShell>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Launch-Blocking Checklist
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {blockingChecks.length} blocking check
              {blockingChecks.length === 1 ? "" : "s"} in the current view.
            </p>
          </div>
        </div>

        {checks.length === 0 ? (
          <OpsEmptyState
            description="No readiness checks match the current filters."
            title="No readiness checks"
          />
        ) : (
          <div className="space-y-4">
            {checks.map((check) => (
              <CardShell key={check.id} padding="md" tone="default">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.45fr)]">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ReadinessStatusBadge status={check.status} />
                      <span className="rounded-md border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground">
                        {formatOpsCategory(check.category)}
                      </span>
                      {check.blocking_launch ? (
                        <span className="rounded-md border border-gold-400/25 bg-gold-400/10 px-2 py-1 text-xs text-gold-200">
                          Blocks launch
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {check.title}
                      </h3>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {check.key}
                      </p>
                    </div>
                    {check.description ? (
                      <p className="text-sm leading-6 text-muted-foreground">
                        {check.description}
                      </p>
                    ) : null}
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          Owner
                        </dt>
                        <dd className="mt-1 text-foreground">
                          {check.owner || "Unassigned"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          Last Checked
                        </dt>
                        <dd className="mt-1 text-foreground">
                          {formatMetricDate(check.last_checked_at)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <form
                    action={updateReadinessCheckAction}
                    className="space-y-3 rounded-lg border border-border bg-background/50 p-4"
                  >
                    <input name="id" type="hidden" value={check.id} />
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Status
                      </span>
                      <select
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                        defaultValue={check.status}
                        name="status"
                      >
                        {opsCheckStatusValues.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Owner
                      </span>
                      <input
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                        defaultValue={check.owner ?? ""}
                        name="owner"
                        placeholder="Owner or team"
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Evidence Note
                      </span>
                      <textarea
                        className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                        defaultValue={check.evidence_note ?? ""}
                        name="evidence_note"
                        placeholder="Safe evidence summary"
                      />
                    </label>
                    <button
                      className={cn(
                        buttonVariants({ size: "lg", variant: "default" }),
                        "w-full"
                      )}
                      type="submit"
                    >
                      Save Check
                    </button>
                  </form>
                </div>
              </CardShell>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
