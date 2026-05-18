import { Badge } from "@/components/badge";
import type { IdeaUpdate } from "@/lib/content/types";
import {
  formatIdeaOutcome,
  formatIdeaStatus,
  formatLifecycleDate,
} from "@/lib/lifecycle/format";

import { LifecycleEventBadge } from "./LifecycleEventBadge";

type IdeaTimelineItemProps = {
  update: IdeaUpdate;
};

export function IdeaTimelineItem({ update }: IdeaTimelineItemProps) {
  return (
    <li className="relative rounded-lg border border-border bg-secondary/28 p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <LifecycleEventBadge eventType={update.event_type} />
              {update.is_major ? <Badge tone="gold">Major update</Badge> : null}
            </div>
            <h3 className="mt-3 text-base font-semibold text-foreground">
              {update.title}
            </h3>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {formatLifecycleDate(update.event_at)}
            </p>
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-3">
          <TimelineMeta
            label="Status before"
            value={
              update.status_before
                ? formatIdeaStatus(update.status_before)
                : "Not recorded"
            }
          />
          <TimelineMeta
            label="Status after"
            value={
              update.status_after_update
                ? formatIdeaStatus(update.status_after_update)
                : "No status change"
            }
          />
          <TimelineMeta
            label="Outcome after"
            value={
              update.outcome_after
                ? formatIdeaOutcome(update.outcome_after)
                : "No outcome change"
            }
          />
        </dl>

        {update.body ? (
          <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {update.body}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function TimelineMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/45 p-3">
      <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
