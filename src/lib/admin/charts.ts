import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { CreateIdeaChartInput, UpdateIdeaChartInput } from "./types";

function throwIdeaChartsError(action: string): never {
  throw new Error(`Unable to ${action} idea chart metadata.`);
}

async function getCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throwIdeaChartsError("identify admin user for");
  }

  return user.id;
}

export async function listIdeaCharts(ideaId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("idea_charts")
    .select("*")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: true });

  if (error) {
    throwIdeaChartsError("list");
  }

  return data ?? [];
}

export async function createIdeaChart(
  ideaId: string,
  input: CreateIdeaChartInput
) {
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("idea_charts")
    .insert({
      ...input,
      created_by: userId,
      idea_id: ideaId,
    })
    .select("*")
    .single();

  if (error) {
    throwIdeaChartsError("create");
  }

  return data;
}

export async function updateIdeaChart(
  chartId: string,
  input: UpdateIdeaChartInput
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("idea_charts")
    .update(input)
    .eq("id", chartId)
    .select("*")
    .single();

  if (error) {
    throwIdeaChartsError("update");
  }

  return data;
}

export async function deleteIdeaChart(chartId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("idea_charts")
    .delete()
    .eq("id", chartId);

  if (error) {
    throwIdeaChartsError("delete");
  }
}
