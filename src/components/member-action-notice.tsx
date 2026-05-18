import { AuthNotice } from "@/components/auth-notice";

type MemberActionNoticeProps = {
  notice?: string | string[];
};

const noticeMessages: Record<
  string,
  { message: string; tone: "error" | "info" | "success" }
> = {
  followed: {
    message: "Ticker followed. Related research will appear in your dashboard.",
    tone: "success",
  },
  "member-error": {
    message:
      "That dashboard action could not be completed. Review the fields and try again.",
    tone: "error",
  },
  "preferences-reset": {
    message: "Dashboard preferences reset to defaults.",
    tone: "success",
  },
  "preferences-default": {
    message:
      "You are using the default dashboard preferences. Change any setting below to personalize this view.",
    tone: "info",
  },
  "preferences-saved": {
    message: "Dashboard preferences saved.",
    tone: "success",
  },
  saved: {
    message: "Idea saved to your dashboard.",
    tone: "success",
  },
  "saved-note": {
    message: "Saved idea note updated.",
    tone: "success",
  },
  seen: {
    message: "Dashboard activity marked as seen.",
    tone: "success",
  },
  "software-request-updated": {
    message: "Software access request updated.",
    tone: "success",
  },
  "software-requested": {
    message:
      "Software access request submitted. Manual TradingView access is still handled by an admin.",
    tone: "success",
  },
  "ticker-note": {
    message: "Followed ticker note updated.",
    tone: "success",
  },
  unfollowed: {
    message: "Ticker removed from following.",
    tone: "success",
  },
  unsaved: {
    message: "Idea removed from saved ideas.",
    tone: "success",
  },
  "watchlist-added": {
    message: "Watchlist item added.",
    tone: "success",
  },
  "watchlist-removed": {
    message: "Watchlist item removed.",
    tone: "success",
  },
  "watchlist-updated": {
    message: "Watchlist item updated.",
    tone: "success",
  },
};

export function MemberActionNotice({ notice }: MemberActionNoticeProps) {
  const key = Array.isArray(notice) ? notice[0] : notice;

  if (!key) {
    return null;
  }

  const noticeConfig = noticeMessages[key];

  if (!noticeConfig) {
    return null;
  }

  return (
    <AuthNotice message={noticeConfig.message} tone={noticeConfig.tone} />
  );
}
