import {
  eventTypeDisplayLabels,
  outcomeDisplayLabels,
  statusDisplayLabels,
} from "./constants";
import type {
  IdeaLifecycleEventType,
  IdeaOutcome,
  IdeaStatus,
  LifecycleTone,
} from "./types";

export function formatIdeaStatus(status: IdeaStatus) {
  return statusDisplayLabels[status];
}

export function formatIdeaOutcome(outcome: IdeaOutcome) {
  return outcomeDisplayLabels[outcome];
}

export function formatLifecycleEventType(eventType: IdeaLifecycleEventType) {
  return eventTypeDisplayLabels[eventType];
}

export function formatLifecycleDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getStatusTone(status: IdeaStatus): LifecycleTone {
  const tones: Record<IdeaStatus, LifecycleTone> = {
    active: "info",
    closed: "muted",
    invalidated: "danger",
    target_hit: "success",
    triggered: "warning",
    watching: "neutral",
  };

  return tones[status];
}

export function getOutcomeTone(outcome: IdeaOutcome): LifecycleTone {
  const tones: Record<IdeaOutcome, LifecycleTone> = {
    breakeven: "neutral",
    closed_manual: "muted",
    invalidated: "danger",
    loss: "danger",
    no_trade: "muted",
    partial_win: "success",
    pending: "neutral",
    stopped_out: "danger",
    target_1_hit: "success",
    target_2_hit: "success",
    target_3_hit: "success",
    win: "success",
  };

  return tones[outcome];
}
