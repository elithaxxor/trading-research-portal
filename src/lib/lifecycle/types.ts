import type { Database } from "@/types/database.types";

export type IdeaStatus = Database["public"]["Enums"]["idea_status"];
export type IdeaOutcome = Database["public"]["Enums"]["idea_outcome"];
export type IdeaLifecycleEventType =
  Database["public"]["Enums"]["idea_lifecycle_event_type"];

export type LifecycleTone =
  | "danger"
  | "info"
  | "muted"
  | "neutral"
  | "success"
  | "warning";

export type IdeaLifecycleAction =
  | "add_note"
  | "change_status"
  | "mark_triggered"
  | "mark_target_hit"
  | "mark_invalidated"
  | "close"
  | "publish_review"
  | "reopen";

export type LifecycleTransitionResult = {
  allowed: boolean;
  eventType?: IdeaLifecycleEventType;
  reason?: string;
  shouldSetClosedAt?: boolean;
  shouldSetInvalidatedAt?: boolean;
  shouldSetTriggeredAt?: boolean;
};

export type LifecycleTimelineItem = {
  body: string | null;
  createdAt: string;
  eventAt: string;
  eventType: IdeaLifecycleEventType;
  id: string;
  isMajor: boolean;
  outcomeAfter: IdeaOutcome | null;
  statusAfterUpdate: IdeaStatus | null;
  statusBefore: IdeaStatus | null;
  title: string;
};

export type LifecycleStatusSummary = {
  closedAt: string | null;
  invalidatedAt: string | null;
  lastLifecycleEventAt: string | null;
  outcome: IdeaOutcome;
  reviewPublished: boolean;
  status: IdeaStatus;
  target1HitAt: string | null;
  target2HitAt: string | null;
  target3HitAt: string | null;
  triggeredAt: string | null;
};

export type ValidationResult<TValue> =
  | {
      error: string;
      ok: false;
    }
  | {
      ok: true;
      value: TValue;
    };

export type LifecycleUpdateInput = {
  body?: unknown;
  event_at?: unknown;
  event_type?: unknown;
  is_major?: unknown;
  outcome_after?: unknown;
  status_after_update?: unknown;
  status_before?: unknown;
  title?: unknown;
};

export type ValidatedLifecycleUpdateInput = {
  body: string | null;
  event_at: string;
  event_type: IdeaLifecycleEventType;
  is_major: boolean;
  outcome_after: IdeaOutcome | null;
  status_after_update: IdeaStatus | null;
  status_before: IdeaStatus | null;
  title: string;
};
