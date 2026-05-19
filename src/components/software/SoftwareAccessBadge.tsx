import { Badge } from "@/components/badge";
import {
  formatSoftwareAccessStatus,
  formatSoftwareAccessTier,
  formatSoftwareDeliveryType,
  formatSoftwareType,
} from "@/lib/software/format";
import type {
  SoftwareAccessRequestStatus,
  SoftwareAccessTier,
  SoftwareDeliveryType,
  SoftwareType,
} from "@/lib/software/types";

type SoftwareAccessBadgeProps =
  | {
      accessTier: SoftwareAccessTier;
      kind: "tier";
    }
  | {
      kind: "status";
      status: SoftwareAccessRequestStatus;
    }
  | {
      deliveryType: SoftwareDeliveryType;
      kind: "delivery";
    }
  | {
      kind: "type";
      softwareType: SoftwareType;
    };

export function SoftwareAccessBadge(props: SoftwareAccessBadgeProps) {
  if (props.kind === "tier") {
    return <Badge tone="gold">{formatSoftwareAccessTier(props.accessTier)}</Badge>;
  }

  if (props.kind === "delivery") {
    return (
      <Badge tone="muted">
        {formatSoftwareDeliveryType(props.deliveryType)}
      </Badge>
    );
  }

  if (props.kind === "type") {
    return <Badge tone="muted">{formatSoftwareType(props.softwareType)}</Badge>;
  }

  return (
    <Badge tone={getStatusTone(props.status)}>
      {formatSoftwareAccessStatus(props.status)}
    </Badge>
  );
}

function getStatusTone(status: SoftwareAccessRequestStatus) {
  if (status === "approved" || status === "granted") {
    return "positive";
  }

  if (status === "rejected" || status === "revoked") {
    return "muted";
  }

  return "gold";
}
