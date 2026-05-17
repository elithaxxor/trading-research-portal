import type { ComponentPropsWithoutRef } from "react";

import { CardShell } from "@/components/card-shell";
import { formatDate } from "@/lib/content/format";
import type { IdeaStatus } from "@/lib/content/types";

import { IdeaStatusBadge } from "./idea-status-badge";

type UpdateTimelineItem = {
  body: string | null;
  created_at: string;
  status_after_update: IdeaStatus | null;
  title: string;
};

type UpdateTimelineProps = ComponentPropsWithoutRef<"section"> & {
  updates: UpdateTimelineItem[];
};

export function UpdateTimeline({
  className,
  updates,
  ...props
}: UpdateTimelineProps) {
  return (
    <section className={className} {...props}>
      <CardShell padding="lg">
        <div className="flex flex-col gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              Update log
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Research updates
            </h2>
          </div>

          {updates.length > 0 ? (
            <ol className="grid gap-4">
              {updates.map((update, index) => (
                <li
                  className="relative rounded-lg border border-border bg-secondary/28 p-4"
                  key={`${update.created_at}-${update.title}-${index}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {update.title}
                      </p>
                      <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {formatDate(update.created_at)}
                      </p>
                    </div>
                    {update.status_after_update ? (
                      <IdeaStatusBadge status={update.status_after_update} />
                    ) : null}
                  </div>

                  {update.body ? (
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {update.body}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-lg border border-border bg-secondary/28 px-4 py-3 text-sm leading-6 text-muted-foreground">
              No updates have been published for this research item yet.
            </p>
          )}
        </div>
      </CardShell>
    </section>
  );
}
