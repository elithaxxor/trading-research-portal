import { CardShell } from "@/components/card-shell";
import type { IdeaDetail } from "@/lib/content/types";
import { formatLifecycleDate } from "@/lib/lifecycle/format";

import { OutcomeBadge } from "./OutcomeBadge";

type IdeaOutcomeReviewProps = {
  idea: IdeaDetail;
};

export function IdeaOutcomeReview({ idea }: IdeaOutcomeReviewProps) {
  if (idea.status !== "closed") {
    return null;
  }

  if (!idea.review_published) {
    return (
      <CardShell padding="lg" tone="subtle">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
            Outcome review
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            Review not published yet.
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            This idea is closed, but the structured outcome review has not been
            published to members yet.
          </p>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell padding="lg" tone="elevated">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              Outcome review
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Closed idea review
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Outcomes are educational review labels and are not performance
              guarantees.
            </p>
          </div>
          {idea.outcome !== "pending" ? (
            <OutcomeBadge outcome={idea.outcome} />
          ) : null}
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <ReviewMetric
            label="Closed at"
            value={formatLifecycleDate(idea.closed_at)}
          />
          <ReviewMetric
            label="Review published"
            value={formatLifecycleDate(idea.review_published_at)}
          />
        </dl>

        <ReviewSection
          body={idea.outcome_summary}
          fallback="No outcome summary has been published yet."
          title="Outcome summary"
        />
        <ReviewSection
          body={idea.lessons_learned}
          fallback="No lessons learned have been published yet."
          title="Lessons learned"
        />
      </div>
    </CardShell>
  );
}

function ReviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/28 p-4">
      <dt className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ReviewSection({
  body,
  fallback,
  title,
}: {
  body: string | null;
  fallback: string;
  title: string;
}) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
        {body ?? fallback}
      </p>
    </section>
  );
}
