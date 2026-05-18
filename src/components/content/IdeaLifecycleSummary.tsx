import { CardShell } from "@/components/card-shell";
import type { IdeaDetail } from "@/lib/content/types";
import {
  formatIdeaOutcome,
  formatIdeaStatus,
  formatLifecycleDate,
} from "@/lib/lifecycle/format";

import { IdeaStatusBadge } from "./idea-status-badge";
import { OutcomeBadge } from "./OutcomeBadge";

type IdeaLifecycleSummaryProps = {
  idea: IdeaDetail;
};

export function IdeaLifecycleSummary({ idea }: IdeaLifecycleSummaryProps) {
  return (
    <CardShell padding="lg" tone="elevated">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              Research timeline
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Lifecycle summary
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <IdeaStatusBadge status={idea.status} />
            {idea.outcome !== "pending" ? (
              <OutcomeBadge outcome={idea.outcome} />
            ) : null}
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <LifecycleMetric
            label="Current status"
            value={formatIdeaStatus(idea.status)}
          />
          <LifecycleMetric
            label="Current outcome"
            value={
              idea.outcome === "pending"
                ? "Pending review"
                : formatIdeaOutcome(idea.outcome)
            }
          />
          <LifecycleMetric
            label="Triggered"
            value={formatLifecycleDate(idea.triggered_at)}
          />
          <LifecycleMetric
            label="Target 1"
            value={formatLifecycleDate(idea.target_1_hit_at)}
          />
          <LifecycleMetric
            label="Target 2"
            value={formatLifecycleDate(idea.target_2_hit_at)}
          />
          <LifecycleMetric
            label="Target 3"
            value={formatLifecycleDate(idea.target_3_hit_at)}
          />
          <LifecycleMetric
            label="Invalidated"
            value={formatLifecycleDate(idea.invalidated_at)}
          />
          <LifecycleMetric
            label="Closed"
            value={formatLifecycleDate(idea.closed_at)}
          />
          <LifecycleMetric
            label="Last lifecycle event"
            value={formatLifecycleDate(idea.last_lifecycle_event_at)}
          />
          <LifecycleMetric
            label="Review"
            value={idea.review_published ? "Published" : "Not published"}
          />
          <LifecycleMetric
            label="Review published"
            value={formatLifecycleDate(idea.review_published_at)}
          />
        </dl>
      </div>
    </CardShell>
  );
}

function LifecycleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/28 p-4">
      <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}
