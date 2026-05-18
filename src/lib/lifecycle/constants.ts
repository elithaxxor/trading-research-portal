import type {
  IdeaLifecycleEventType,
  IdeaOutcome,
  IdeaStatus,
} from "./types";

export const allowedIdeaStatuses = [
  "watching",
  "active",
  "triggered",
  "invalidated",
  "target_hit",
  "closed",
] as const satisfies readonly IdeaStatus[];

export const allowedIdeaOutcomes = [
  "pending",
  "no_trade",
  "invalidated",
  "stopped_out",
  "target_1_hit",
  "target_2_hit",
  "target_3_hit",
  "partial_win",
  "win",
  "loss",
  "breakeven",
  "closed_manual",
] as const satisfies readonly IdeaOutcome[];

export const allowedLifecycleEventTypes = [
  "note",
  "status_change",
  "activated",
  "triggered",
  "target_hit",
  "invalidated",
  "closed",
  "review_posted",
] as const satisfies readonly IdeaLifecycleEventType[];

export const statusDisplayLabels: Record<IdeaStatus, string> = {
  active: "Active",
  closed: "Closed",
  invalidated: "Invalidated",
  target_hit: "Target Hit",
  triggered: "Triggered",
  watching: "Watching",
};

export const outcomeDisplayLabels: Record<IdeaOutcome, string> = {
  breakeven: "Breakeven",
  closed_manual: "Closed Manually",
  invalidated: "Invalidated",
  loss: "Loss",
  no_trade: "No Trade",
  partial_win: "Partial Win",
  pending: "Pending",
  stopped_out: "Stopped Out",
  target_1_hit: "Target 1 Hit",
  target_2_hit: "Target 2 Hit",
  target_3_hit: "Target 3 Hit",
  win: "Win",
};

export const eventTypeDisplayLabels: Record<IdeaLifecycleEventType, string> = {
  activated: "Activated",
  closed: "Closed",
  invalidated: "Invalidated",
  note: "Note",
  review_posted: "Review Posted",
  status_change: "Status Change",
  target_hit: "Target Hit",
  triggered: "Triggered",
};
