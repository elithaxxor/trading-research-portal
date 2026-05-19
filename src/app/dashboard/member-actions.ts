"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  followTicker,
  unfollowTicker,
  updateFollowedTickerNote,
} from "@/lib/member/followed-tickers";
import {
  ensureMemberPreferences,
  updateMemberPreferences,
} from "@/lib/member/preferences";
import {
  saveIdea,
  unsaveIdea,
  updateSavedIdeaNote,
} from "@/lib/member/saved-ideas";
import type { MemberPreferencesInput } from "@/lib/member/types";
import {
  addWatchlistItem,
  removeWatchlistItem,
  updateWatchlistItem,
} from "@/lib/member/watchlist";
import { validateMemberNote, validateTicker } from "@/lib/member/validation";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getFormStringList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getFormBoolean(formData: FormData, key: string) {
  const value = formData.get(key);

  return value === "on" || value === "true" || value === "1";
}

function getReturnTo(formData: FormData, fallback: string) {
  const returnTo = getFormString(formData, "return_to");

  if (
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//") &&
    !returnTo.includes("\\")
  ) {
    return returnTo;
  }

  return fallback;
}

function redirectWithNotice(path: string, notice: string): never {
  const [pathname, queryString = ""] = path.split("?");
  const searchParams = new URLSearchParams(queryString);
  searchParams.set("notice", notice);
  const nextQueryString = searchParams.toString();

  redirect(nextQueryString ? `${pathname}?${nextQueryString}` : pathname);
}

function validateIdeaId(value: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  ) {
    throw new Error("A valid idea id is required.");
  }

  return value;
}

function validateOptionalIdeaId(value: string) {
  if (!value) {
    return null;
  }

  return validateIdeaId(value);
}

function validateWatchlistItemId(value: string) {
  return validateIdeaId(value);
}

function validateSlug(value: string) {
  if (!value) {
    return null;
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new Error("A valid idea slug is required.");
  }

  return value;
}

function getActionPayload(formData: FormData) {
  const ideaId = validateIdeaId(getFormString(formData, "idea_id"));
  const slug = validateSlug(getFormString(formData, "slug"));
  const note = validateMemberNote(getFormString(formData, "note"));
  const returnTo = getReturnTo(
    formData,
    slug ? `/ideas/${slug}` : "/dashboard/saved"
  );

  return {
    ideaId,
    note,
    returnTo,
    slug,
  };
}

function getTickerActionPayload(formData: FormData) {
  const ticker = validateTicker(getFormString(formData, "ticker"));
  const slug = validateSlug(getFormString(formData, "slug"));
  const note = validateMemberNote(getFormString(formData, "note"));
  const returnTo = getReturnTo(
    formData,
    slug ? `/ideas/${slug}` : "/dashboard/following"
  );

  return {
    note,
    returnTo,
    slug,
    ticker,
  };
}

function revalidateSavedIdeaPaths(slug: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/saved");
  revalidatePath("/ideas");

  if (slug) {
    revalidatePath(`/ideas/${slug}`);
  }
}

function revalidateFollowedTickerPaths(slug: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/following");
  revalidatePath("/dashboard/watchlist");
  revalidatePath("/ideas");

  if (slug) {
    revalidatePath(`/ideas/${slug}`);
  }
}

function revalidateWatchlistPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/watchlist");
}

function revalidatePreferencePaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/preferences");
}

function loginRedirect(slug: string | null): never {
  redirect(
    `/login?redirectedFrom=${encodeURIComponent(slug ? `/ideas/${slug}` : "/dashboard/saved")}`
  );
}

const defaultMemberPreferences: Required<MemberPreferencesInput> = {
  default_sort: "recently_updated",
  default_view: "overview",
  preferred_asset_classes: [],
  preferred_statuses: [],
  preferred_visibility: [],
  show_charts_on_dashboard: true,
  show_closed_reviews: true,
  show_locked_previews: true,
  show_software_section: true,
};

function getPreferencePayload(formData: FormData): MemberPreferencesInput {
  if (getFormString(formData, "intent") === "reset") {
    return defaultMemberPreferences;
  }

  return {
    default_sort: getFormString(
      formData,
      "default_sort"
    ) as MemberPreferencesInput["default_sort"],
    default_view: getFormString(
      formData,
      "default_view"
    ) as MemberPreferencesInput["default_view"],
    preferred_asset_classes: getFormStringList(
      formData,
      "preferred_asset_classes"
    ) as MemberPreferencesInput["preferred_asset_classes"],
    preferred_statuses: getFormStringList(
      formData,
      "preferred_statuses"
    ) as MemberPreferencesInput["preferred_statuses"],
    preferred_visibility: getFormStringList(
      formData,
      "preferred_visibility"
    ) as MemberPreferencesInput["preferred_visibility"],
    show_charts_on_dashboard: getFormBoolean(
      formData,
      "show_charts_on_dashboard"
    ),
    show_closed_reviews: getFormBoolean(formData, "show_closed_reviews"),
    show_locked_previews: getFormBoolean(formData, "show_locked_previews"),
    show_software_section: getFormBoolean(formData, "show_software_section"),
  };
}

export async function saveIdeaAction(formData: FormData) {
  const { ideaId, note, returnTo, slug } = getActionPayload(formData);

  try {
    await saveIdea(ideaId, note);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("signed in")
    ) {
      loginRedirect(slug);
    }

    throw error;
  }

  revalidateSavedIdeaPaths(slug);
  redirectWithNotice(returnTo, "saved");
}

export async function updateMemberPreferencesAction(formData: FormData) {
  const payload = getPreferencePayload(formData);
  const isReset = getFormString(formData, "intent") === "reset";

  try {
    await ensureMemberPreferences();
    await updateMemberPreferences(payload);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("signed in")
    ) {
      redirect("/login?redirectedFrom=%2Fdashboard%2Fpreferences");
    }

    throw error;
  }

  revalidatePreferencePaths();
  redirectWithNotice(
    "/dashboard/preferences",
    isReset ? "preferences-reset" : "preferences-saved"
  );
}

export async function followTickerAction(formData: FormData) {
  const { note, returnTo, slug, ticker } = getTickerActionPayload(formData);

  try {
    await followTicker(ticker, note);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("signed in")
    ) {
      loginRedirect(slug);
    }

    throw error;
  }

  revalidateFollowedTickerPaths(slug);
  redirectWithNotice(returnTo, "followed");
}

export async function unfollowTickerAction(formData: FormData) {
  const ticker = validateTicker(getFormString(formData, "ticker"));
  const slug = validateSlug(getFormString(formData, "slug"));
  const returnTo = getReturnTo(
    formData,
    slug ? `/ideas/${slug}` : "/dashboard/following"
  );

  try {
    await unfollowTicker(ticker);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("signed in")
    ) {
      loginRedirect(slug);
    }

    throw error;
  }

  revalidateFollowedTickerPaths(slug);
  redirectWithNotice(returnTo, "unfollowed");
}

export async function updateFollowedTickerNoteAction(formData: FormData) {
  const { note, returnTo, slug, ticker } = getTickerActionPayload(formData);

  try {
    await updateFollowedTickerNote(ticker, note);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("signed in")
    ) {
      loginRedirect(slug);
    }

    throw error;
  }

  revalidateFollowedTickerPaths(slug);
  redirectWithNotice(returnTo, "ticker-note");
}

export async function addWatchlistItemAction(formData: FormData) {
  const ticker = validateTicker(getFormString(formData, "ticker"));
  const ideaId = validateOptionalIdeaId(getFormString(formData, "idea_id"));
  const note = validateMemberNote(getFormString(formData, "note"));

  try {
    await addWatchlistItem({
      ideaId,
      note,
      ticker,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("signed in")
    ) {
      redirect("/login?redirectedFrom=%2Fdashboard%2Fwatchlist");
    }

    throw error;
  }

  revalidateWatchlistPaths();
  redirectWithNotice("/dashboard/watchlist", "watchlist-added");
}

export async function updateWatchlistItemAction(formData: FormData) {
  const id = validateWatchlistItemId(getFormString(formData, "watchlist_item_id"));
  const ticker = validateTicker(getFormString(formData, "ticker"));
  const ideaId = validateOptionalIdeaId(getFormString(formData, "idea_id"));
  const note = validateMemberNote(getFormString(formData, "note"));

  try {
    await updateWatchlistItem(id, {
      ideaId,
      note,
      ticker,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("signed in")
    ) {
      redirect("/login?redirectedFrom=%2Fdashboard%2Fwatchlist");
    }

    throw error;
  }

  revalidateWatchlistPaths();
  redirectWithNotice("/dashboard/watchlist", "watchlist-updated");
}

export async function removeWatchlistItemAction(formData: FormData) {
  const id = validateWatchlistItemId(getFormString(formData, "watchlist_item_id"));

  try {
    await removeWatchlistItem(id);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("signed in")
    ) {
      redirect("/login?redirectedFrom=%2Fdashboard%2Fwatchlist");
    }

    throw error;
  }

  revalidateWatchlistPaths();
  redirectWithNotice("/dashboard/watchlist", "watchlist-removed");
}

export async function unsaveIdeaAction(formData: FormData) {
  const ideaId = validateIdeaId(getFormString(formData, "idea_id"));
  const slug = validateSlug(getFormString(formData, "slug"));
  const returnTo = getReturnTo(
    formData,
    slug ? `/ideas/${slug}` : "/dashboard/saved"
  );

  try {
    await unsaveIdea(ideaId);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("signed in")
    ) {
      loginRedirect(slug);
    }

    throw error;
  }

  revalidateSavedIdeaPaths(slug);
  redirectWithNotice(returnTo, "unsaved");
}

export async function updateSavedIdeaNoteAction(formData: FormData) {
  const { ideaId, note, returnTo, slug } = getActionPayload(formData);

  try {
    await updateSavedIdeaNote(ideaId, note);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("signed in")
    ) {
      loginRedirect(slug);
    }

    throw error;
  }

  revalidateSavedIdeaPaths(slug);
  redirectWithNotice(returnTo, "saved-note");
}
