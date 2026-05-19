import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { validateMemberNote, validateTicker } from "./validation";

async function getMemberContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to manage followed tickers.");
  }

  return {
    supabase,
    userId: user.id,
  };
}

export async function listFollowedTickers() {
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("followed_tickers")
    .select("*")
    .eq("user_id", userId)
    .order("ticker", { ascending: true });

  if (error) {
    throw new Error("Unable to load followed tickers.");
  }

  return data ?? [];
}

export async function isTickerFollowed(ticker: string) {
  const normalizedTicker = validateTicker(ticker);
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("followed_tickers")
    .select("id")
    .eq("user_id", userId)
    .eq("ticker", normalizedTicker)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to check followed ticker state.");
  }

  return Boolean(data);
}

export async function followTicker(ticker: string, note?: string | null) {
  const normalizedTicker = validateTicker(ticker);
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("followed_tickers")
    .upsert(
      {
        note: validateMemberNote(note),
        ticker: normalizedTicker,
        user_id: userId,
      },
      {
        onConflict: "user_id,ticker",
      }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to follow ticker.");
  }

  return data;
}

export async function updateFollowedTickerNote(
  ticker: string,
  note: string | null
) {
  const normalizedTicker = validateTicker(ticker);
  const { supabase, userId } = await getMemberContext();
  const { data, error } = await supabase
    .from("followed_tickers")
    .update({
      note: validateMemberNote(note),
    })
    .eq("user_id", userId)
    .eq("ticker", normalizedTicker)
    .select("*")
    .single();

  if (error) {
    throw new Error("Unable to update followed ticker note.");
  }

  return data;
}

export async function unfollowTicker(ticker: string) {
  const normalizedTicker = validateTicker(ticker);
  const { supabase, userId } = await getMemberContext();
  const { error } = await supabase
    .from("followed_tickers")
    .delete()
    .eq("user_id", userId)
    .eq("ticker", normalizedTicker);

  if (error) {
    throw new Error("Unable to unfollow ticker.");
  }
}
