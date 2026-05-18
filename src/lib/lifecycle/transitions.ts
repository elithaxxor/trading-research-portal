import { allowedIdeaStatuses } from "./constants";
import type {
  IdeaLifecycleEventType,
  IdeaStatus,
  LifecycleTransitionResult,
} from "./types";

const normalTransitions: Record<IdeaStatus, readonly IdeaStatus[]> = {
  active: ["triggered", "invalidated", "closed"],
  closed: [],
  invalidated: ["closed"],
  target_hit: ["closed"],
  triggered: ["target_hit", "invalidated", "closed"],
  watching: ["active", "invalidated", "closed"],
};

type TransitionOptions = {
  allowAdminOverride?: boolean;
};

export function getAllowedNextStatuses(
  status: IdeaStatus,
  options: TransitionOptions = {}
) {
  if (options.allowAdminOverride) {
    return allowedIdeaStatuses.filter((nextStatus) => nextStatus !== status);
  }

  return normalTransitions[status];
}

export function canTransitionIdeaStatus(
  from: IdeaStatus,
  to: IdeaStatus,
  options: TransitionOptions = {}
): LifecycleTransitionResult {
  if (from === to) {
    return {
      allowed: true,
      eventType: "note",
      reason: "Status is unchanged.",
    };
  }

  if (options.allowAdminOverride) {
    return {
      allowed: true,
      eventType: getLifecycleEventTypeForStatusChange(from, to),
      shouldSetClosedAt: shouldSetClosedAt(from, to),
      shouldSetInvalidatedAt: shouldSetInvalidatedAt(from, to),
      shouldSetTriggeredAt: shouldSetTriggeredAt(from, to),
    };
  }

  if (getAllowedNextStatuses(from).includes(to)) {
    return {
      allowed: true,
      eventType: getLifecycleEventTypeForStatusChange(from, to),
      shouldSetClosedAt: shouldSetClosedAt(from, to),
      shouldSetInvalidatedAt: shouldSetInvalidatedAt(from, to),
      shouldSetTriggeredAt: shouldSetTriggeredAt(from, to),
    };
  }

  return {
    allowed: false,
    reason:
      "This lifecycle change is outside the normal review flow. Use an admin correction override if this is intentional.",
  };
}

export function getLifecycleEventTypeForStatusChange(
  from: IdeaStatus,
  to: IdeaStatus
): IdeaLifecycleEventType {
  if (from === to) {
    return "note";
  }

  if (to === "active" && from === "watching") {
    return "activated";
  }

  if (to === "triggered") {
    return "triggered";
  }

  if (to === "target_hit") {
    return "target_hit";
  }

  if (to === "invalidated") {
    return "invalidated";
  }

  if (to === "closed") {
    return "closed";
  }

  return "status_change";
}

export function shouldSetTriggeredAt(from: IdeaStatus, to: IdeaStatus) {
  return from !== "triggered" && to === "triggered";
}

export function shouldSetInvalidatedAt(from: IdeaStatus, to: IdeaStatus) {
  return from !== "invalidated" && to === "invalidated";
}

export function shouldSetClosedAt(from: IdeaStatus, to: IdeaStatus) {
  return from !== "closed" && to === "closed";
}

export function shouldSetTargetHitAt(targetNumber: number) {
  return Number.isInteger(targetNumber) && targetNumber >= 1 && targetNumber <= 3;
}
