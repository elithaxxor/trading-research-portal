import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, PlusCircle } from "lucide-react";

import {
  createIncidentAction,
  resolveIncidentAction,
  updateIncidentAction,
} from "@/app/admin/ops/actions";
import { IncidentSeverityBadge } from "@/components/admin/ops/IncidentSeverityBadge";
import { OpsEmptyState } from "@/components/admin/ops/OpsEmptyState";
import { OpsPageHeader } from "@/components/admin/ops/OpsPageHeader";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import { formatMetricDate } from "@/lib/ops/format";
import { listIncidents } from "@/lib/ops/incidents";
import { incidentSeverityValues } from "@/lib/ops/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations Incidents",
};

const incidentStatusOptions = ["open", "investigating", "monitoring", "resolved"];

export default async function AdminOpsIncidentsPage() {
  await requireAdmin("/admin/ops/incidents");

  const incidents = await listIncidents();
  const openIncidents = incidents.filter((incident) => !incident.resolved_at);

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
        description="Track operational issues, launch blockers, and resolution notes without exposing private user or secret data."
        title="Incidents"
      />

      <CardShell padding="md" tone="subtle">
        <form
          action={createIncidentAction}
          className="grid gap-4 xl:grid-cols-[minmax(12rem,0.7fr)_minmax(8rem,0.25fr)_minmax(10rem,0.35fr)]"
        >
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Title</span>
            <input
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              name="title"
              placeholder="Incident title"
              required
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              Severity
            </span>
            <select
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              defaultValue="low"
              name="severity"
            >
              {incidentSeverityValues.map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              Affected Area
            </span>
            <input
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              name="affected_area"
              placeholder="App area"
            />
          </label>
          <label className="flex flex-col gap-2 xl:col-span-2">
            <span className="text-sm font-medium text-foreground">
              Summary
            </span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              name="summary"
              placeholder="Safe operational summary. Do not include secrets or private member content."
            />
          </label>
          <div className="flex items-end">
            <button
              className={cn(
                buttonVariants({ size: "lg", variant: "default" }),
                "w-full"
              )}
              type="submit"
            >
              <PlusCircle aria-hidden="true" className="size-4" />
              Create
            </button>
          </div>
        </form>
      </CardShell>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Incident Log
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {openIncidents.length} unresolved incident
            {openIncidents.length === 1 ? "" : "s"} across {incidents.length}{" "}
            total records.
          </p>
        </div>

        {incidents.length === 0 ? (
          <OpsEmptyState
            description="No operational incidents are currently recorded."
            title="No incidents"
          />
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <CardShell key={incident.id} padding="md" tone="default">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.4fr)]">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <IncidentSeverityBadge severity={incident.severity} />
                      <Badge tone={incident.resolved_at ? "positive" : "gold"}>
                        {incident.status}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {incident.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {incident.affected_area || "General operations"}
                      </p>
                    </div>
                    {incident.summary ? (
                      <p className="text-sm leading-6 text-muted-foreground">
                        {incident.summary}
                      </p>
                    ) : null}
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          Started
                        </dt>
                        <dd className="mt-1 text-foreground">
                          {formatMetricDate(incident.started_at)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          Resolved
                        </dt>
                        <dd className="mt-1 text-foreground">
                          {formatMetricDate(incident.resolved_at)}
                        </dd>
                      </div>
                    </dl>
                    {incident.resolution_note ? (
                      <div className="rounded-lg border border-positive/20 bg-positive/10 p-3 text-sm leading-6 text-positive">
                        {incident.resolution_note}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
                    <form action={updateIncidentAction} className="space-y-3">
                      <input name="id" type="hidden" value={incident.id} />
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-foreground">
                          Status
                        </span>
                        <select
                          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                          defaultValue={incident.status}
                          name="status"
                        >
                          {incidentStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-foreground">
                          Severity
                        </span>
                        <select
                          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                          defaultValue={incident.severity}
                          name="severity"
                        >
                          {incidentSeverityValues.map((severity) => (
                            <option key={severity} value={severity}>
                              {severity}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className={cn(
                          buttonVariants({ size: "lg", variant: "outline" }),
                          "w-full"
                        )}
                        type="submit"
                      >
                        Save
                      </button>
                    </form>

                    {!incident.resolved_at ? (
                      <form action={resolveIncidentAction} className="space-y-3">
                        <input name="id" type="hidden" value={incident.id} />
                        <label className="flex flex-col gap-2">
                          <span className="text-sm font-medium text-foreground">
                            Resolution Note
                          </span>
                          <textarea
                            className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                            name="resolution_note"
                            placeholder="Safe resolution note"
                          />
                        </label>
                        <button
                          className={cn(
                            buttonVariants({ size: "lg", variant: "default" }),
                            "w-full"
                          )}
                          type="submit"
                        >
                          <CheckCircle2 aria-hidden="true" className="size-4" />
                          Resolve
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </CardShell>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
