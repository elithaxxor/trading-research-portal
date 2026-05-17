"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ExternalLink, Trash2 } from "lucide-react";

import { AuthNotice } from "@/components/auth-notice";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminFormSection } from "@/components/admin/forms/AdminFormSection";
import { AdminSelect } from "@/components/admin/forms/AdminSelect";
import { AdminTextInput } from "@/components/admin/forms/AdminTextInput";
import { AdminTextarea } from "@/components/admin/forms/AdminTextarea";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { ChartCard } from "@/components/charts/ChartCard";
import { buttonVariants } from "@/components/ui/button";
import type { AdminIdea, AdminIdeaChart } from "@/lib/admin/types";
import { chartTypeValues } from "@/lib/admin/validation";
import { sanitizeChartUrl } from "@/lib/charts/validation";
import { formatDate } from "@/lib/content/format";
import { cn } from "@/lib/utils";

import {
  createIdeaChartAction,
  deleteIdeaChartAction,
  initialIdeaChartActionState,
  updateIdeaChartAction,
} from "./actions";

type IdeaChartsManagerProps = {
  charts: AdminIdeaChart[];
  idea: AdminIdea;
};

function formatChartType(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function IdeaChartsManager({ charts, idea }: IdeaChartsManagerProps) {
  const [state, formAction] = useActionState(
    createIdeaChartAction,
    initialIdeaChartActionState
  );

  function fieldError(name: string) {
    return state.fieldErrors?.[name];
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <AdminFormSection
        description="Add metadata for chart rendering. Saved TradingView metadata can be previewed after it is created."
        title="Create chart metadata"
      >
        <form action={formAction} className="flex flex-col gap-5">
          <input name="idea_id" type="hidden" value={idea.id} />

          {state.status === "error" && state.message ? (
            <AuthNotice message={state.message} tone="error" />
          ) : null}
          {state.status === "idle" && state.message ? (
            <AuthNotice message={state.message} tone="success" />
          ) : null}

          <ChartTypeSelect
            defaultValue="tradingview_embed"
            error={fieldError("chart_type")}
            id="new-chart-type"
            name="chart_type"
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminTextInput
              description="Recommended when available."
              error={fieldError("symbol")}
              id="new-chart-symbol"
              label="Symbol"
              name="symbol"
              placeholder="SPY"
            />
            <AdminTextInput
              description="Required for TradingView charts when the symbol field is empty."
              error={fieldError("tradingview_symbol")}
              id="new-chart-tradingview-symbol"
              label="TradingView symbol"
              name="tradingview_symbol"
              placeholder="NASDAQ:NVDA"
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminTextInput
              error={fieldError("interval")}
              id="new-chart-interval"
              label="Interval"
              name="interval"
              placeholder="D"
            />
            <AdminTextInput
              error={fieldError("embed_url")}
              id="new-chart-embed-url"
              label="Embed URL"
              name="embed_url"
              placeholder="https://..."
              type="url"
            />
          </div>
          <AdminTextInput
            error={fieldError("image_url")}
            id="new-chart-image-url"
            label="Image URL"
            name="image_url"
            placeholder="https://..."
            type="url"
          />
          <AdminTextarea
            error={fieldError("caption")}
            id="new-chart-caption"
            label="Caption"
            name="caption"
            placeholder="Short context for the chart metadata."
          />
          <CreateChartButton />
        </form>
      </AdminFormSection>

      <CardShell padding="lg" tone="elevated">
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Existing chart metadata
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              TradingView previews are rendered from validated metadata. Embed
              HTML from the database is never rendered.
            </p>
          </div>

          {charts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {charts.map((chart) => (
                <ChartEditor chart={chart} idea={idea} key={chart.id} />
              ))}
            </div>
          ) : (
            <AdminEmptyState
              description="No chart metadata has been added for this idea yet. Add symbol and interval context now; embeds stay reserved for a later phase."
              framed={false}
              title="No chart metadata yet"
            />
          )}
        </div>
      </CardShell>
    </div>
  );
}

function ChartEditor({
  chart,
  idea,
}: {
  chart: AdminIdeaChart;
  idea: AdminIdea;
}) {
  const [updateState, updateFormAction] = useActionState(
    updateIdeaChartAction,
    initialIdeaChartActionState
  );
  const [deleteState, deleteFormAction] = useActionState(
    deleteIdeaChartAction,
    initialIdeaChartActionState
  );

  function fieldError(name: string) {
    return updateState.fieldErrors?.[name];
  }

  const safeEmbedUrl = sanitizeChartUrl(chart.embed_url);
  const safeImageUrl = sanitizeChartUrl(chart.image_url);

  return (
    <CardShell padding="md" tone="subtle">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted">{formatChartType(chart.chart_type)}</Badge>
            {chart.symbol ? <Badge tone="gold">{chart.symbol}</Badge> : null}
            <span className="text-xs text-muted-foreground">
              Added {formatDate(chart.created_at)}
            </span>
          </div>
          <form action={deleteFormAction}>
            <input name="idea_id" type="hidden" value={idea.id} />
            <input name="chart_id" type="hidden" value={chart.id} />
            <DeleteChartButton label={chart.symbol ?? chart.tradingview_symbol ?? "chart"} />
          </form>
        </div>

        {deleteState.status === "error" && deleteState.message ? (
          <AuthNotice message={deleteState.message} tone="error" />
        ) : null}
        {deleteState.status === "idle" && deleteState.message ? (
          <AuthNotice message={deleteState.message} tone="success" />
        ) : null}

        <form action={updateFormAction} className="flex flex-col gap-4">
          <input name="idea_id" type="hidden" value={idea.id} />
          <input name="chart_id" type="hidden" value={chart.id} />
          {updateState.status === "error" && updateState.message ? (
            <AuthNotice message={updateState.message} tone="error" />
          ) : null}
          {updateState.status === "idle" && updateState.message ? (
            <AuthNotice message={updateState.message} tone="success" />
          ) : null}
          <ChartTypeSelect
            defaultValue={chart.chart_type}
            error={fieldError("chart_type")}
            id={`chart-type-${chart.id}`}
            name="chart_type"
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminTextInput
              defaultValue={chart.symbol ?? ""}
              error={fieldError("symbol")}
              id={`chart-symbol-${chart.id}`}
              label="Symbol"
              name="symbol"
            />
            <AdminTextInput
              defaultValue={chart.tradingview_symbol ?? ""}
              error={fieldError("tradingview_symbol")}
              id={`chart-tradingview-symbol-${chart.id}`}
              label="TradingView symbol"
              name="tradingview_symbol"
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminTextInput
              defaultValue={chart.interval ?? ""}
              error={fieldError("interval")}
              id={`chart-interval-${chart.id}`}
              label="Interval"
              name="interval"
            />
            <AdminTextInput
              defaultValue={chart.embed_url ?? ""}
              error={fieldError("embed_url")}
              id={`chart-embed-url-${chart.id}`}
              label="Embed URL"
              name="embed_url"
              type="url"
            />
          </div>
          <AdminTextInput
            defaultValue={chart.image_url ?? ""}
            error={fieldError("image_url")}
            id={`chart-image-url-${chart.id}`}
            label="Image URL"
            name="image_url"
            type="url"
          />
          <AdminTextarea
            defaultValue={chart.caption ?? ""}
            error={fieldError("caption")}
            id={`chart-caption-${chart.id}`}
            label="Caption"
            name="caption"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {safeEmbedUrl ? (
                <MetadataLink href={safeEmbedUrl} label="Open embed URL" />
              ) : null}
              {safeImageUrl ? (
                <MetadataLink href={safeImageUrl} label="Open image URL" />
              ) : null}
            </div>
            <SaveChartButton />
          </div>
        </form>

        <div className="border-t border-border pt-4">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Saved preview
          </p>
          <ChartCard chart={chart} />
        </div>
      </div>
    </CardShell>
  );
}

function ChartTypeSelect({
  defaultValue,
  error,
  id,
  name,
}: {
  defaultValue?: string;
  error?: string;
  id: string;
  name: string;
}) {
  return (
    <AdminSelect
      defaultValue={defaultValue}
      error={error}
      id={id}
      label="Chart type"
      name={name}
      required
    >
      {chartTypeValues.map((chartType) => (
        <option key={chartType} value={chartType}>
          {formatChartType(chartType)}
        </option>
      ))}
    </AdminSelect>
  );
}

function MetadataLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className={cn(buttonVariants({ size: "xs", variant: "outline" }))}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <ExternalLink data-icon="inline-start" />
      {label}
    </Link>
  );
}

function CreateChartButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant: "default" }))}
      disabled={pending}
      type="submit"
    >
      {pending ? "Adding metadata..." : "Add Chart Metadata"}
    </button>
  );
}

function SaveChartButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "sm", variant: "default" }))}
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving..." : "Save Metadata"}
    </button>
  );
}

function DeleteChartButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "xs", variant: "destructive" }))}
      disabled={pending}
      onClick={(event) => {
        if (
          !window.confirm(
            `Delete metadata for "${label}"? This cannot be undone.`
          )
        ) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      <Trash2 data-icon="inline-start" />
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
