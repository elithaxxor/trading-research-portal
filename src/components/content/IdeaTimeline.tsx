import type { ComponentPropsWithoutRef } from "react";

import { CardShell } from "@/components/card-shell";
import type { IdeaUpdate } from "@/lib/content/types";
import { cn } from "@/lib/utils";

import { IdeaTimelineItem } from "./IdeaTimelineItem";

type IdeaTimelineProps = ComponentPropsWithoutRef<"section"> & {
  updates: IdeaUpdate[];
};

export function IdeaTimeline({
  className,
  updates,
  ...props
}: IdeaTimelineProps) {
  const sortedUpdates = [...updates].sort((a, b) => {
    const eventDelta =
      new Date(b.event_at).getTime() - new Date(a.event_at).getTime();

    if (eventDelta !== 0) {
      return eventDelta;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <section className={cn("grid gap-6", className)} {...props}>
      <CardShell padding="lg">
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              Research timeline
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              Lifecycle history
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Lifecycle updates are educational research notes and are not trade
              instructions.
            </p>
          </div>

          {sortedUpdates.length > 0 ? (
            <ol className="grid gap-4">
              {sortedUpdates.map((update) => (
                <IdeaTimelineItem key={update.id} update={update} />
              ))}
            </ol>
          ) : (
            <p className="rounded-lg border border-border bg-secondary/28 px-4 py-3 text-sm leading-6 text-muted-foreground">
              No lifecycle updates have been published for this research item
              yet.
            </p>
          )}
        </div>
      </CardShell>
    </section>
  );
}
