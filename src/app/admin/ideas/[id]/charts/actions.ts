"use server";

import { revalidatePath } from "next/cache";

import {
  createIdeaChart,
  deleteIdeaChart,
  updateIdeaChart,
} from "@/lib/admin/charts";
import { getAdminIdeaById } from "@/lib/admin/ideas";
import type {
  CreateIdeaChartInput,
  UpdateIdeaChartInput,
} from "@/lib/admin/types";
import {
  normalizeEmptyString,
  validateChartType,
} from "@/lib/admin/validation";
import { requireAdmin } from "@/lib/auth/admin";

export type IdeaChartActionState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "error";
};

export const initialIdeaChartActionState: IdeaChartActionState = {
  status: "idle",
};

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getRequiredId(formData: FormData, key: string) {
  const id = getFormValue(formData, key);

  if (!id) {
    throw new Error(`${key} is required.`);
  }

  return id;
}

function addFieldError(
  fieldErrors: Record<string, string>,
  key: string,
  message: string
) {
  if (!fieldErrors[key]) {
    fieldErrors[key] = message;
  }
}

function errorState(
  message: string,
  fieldErrors: Record<string, string> = {}
): IdeaChartActionState {
  return {
    fieldErrors,
    message,
    status: "error",
  };
}

function sanitizeOptionalUrl(
  value: string,
  fieldName: "embed_url" | "image_url",
  fieldErrors: Record<string, string>
) {
  const normalized = normalizeEmptyString(value);

  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      addFieldError(fieldErrors, fieldName, "Use an http or https URL.");
      return null;
    }

    return url.toString();
  } catch {
    addFieldError(fieldErrors, fieldName, "Enter a valid URL.");
    return null;
  }
}

async function getParentIdea(ideaId: string) {
  const idea = await getAdminIdeaById(ideaId);

  if (!idea) {
    throw new Error("Trading idea not found.");
  }

  return idea;
}

function revalidateChartPaths(ideaId: string, slug: string) {
  revalidatePath(`/admin/ideas/${ideaId}/charts`);
  revalidatePath("/ideas");
  revalidatePath(`/ideas/${slug}`);
}

function buildChartInput(
  formData: FormData
): {
  fieldErrors: Record<string, string>;
  input: CreateIdeaChartInput | UpdateIdeaChartInput | null;
} {
  const fieldErrors: Record<string, string> = {};
  const chartType = validateChartType(getFormValue(formData, "chart_type"));

  if (!chartType.ok) {
    addFieldError(fieldErrors, "chart_type", chartType.error);
  }

  const embedUrl = sanitizeOptionalUrl(
    getFormValue(formData, "embed_url"),
    "embed_url",
    fieldErrors
  );
  const imageUrl = sanitizeOptionalUrl(
    getFormValue(formData, "image_url"),
    "image_url",
    fieldErrors
  );

  if (Object.keys(fieldErrors).length > 0 || !chartType.ok) {
    return {
      fieldErrors,
      input: null,
    };
  }

  return {
    fieldErrors,
    input: {
      caption: normalizeEmptyString(getFormValue(formData, "caption")),
      chart_type: chartType.value,
      embed_url: embedUrl,
      image_url: imageUrl,
      interval: normalizeEmptyString(getFormValue(formData, "interval")),
      symbol: normalizeEmptyString(getFormValue(formData, "symbol")),
      tradingview_symbol: normalizeEmptyString(
        getFormValue(formData, "tradingview_symbol")
      ),
    },
  };
}

export async function createIdeaChartAction(
  _state: IdeaChartActionState,
  formData: FormData
): Promise<IdeaChartActionState> {
  await requireAdmin("/admin/ideas");

  const ideaId = getRequiredId(formData, "idea_id");
  const idea = await getParentIdea(ideaId);
  const { fieldErrors, input } = buildChartInput(formData);

  if (!input || Object.keys(fieldErrors).length > 0) {
    return errorState("Review the chart metadata and try again.", fieldErrors);
  }

  try {
    await createIdeaChart(ideaId, input as CreateIdeaChartInput);
  } catch {
    return errorState("Chart metadata could not be created.");
  }

  revalidateChartPaths(ideaId, idea.slug);

  return {
    message: "Chart metadata created.",
    status: "idle",
  };
}

export async function updateIdeaChartAction(
  _state: IdeaChartActionState,
  formData: FormData
): Promise<IdeaChartActionState> {
  await requireAdmin("/admin/ideas");

  const ideaId = getRequiredId(formData, "idea_id");
  const chartId = getRequiredId(formData, "chart_id");
  const idea = await getParentIdea(ideaId);
  const { fieldErrors, input } = buildChartInput(formData);

  if (!input || Object.keys(fieldErrors).length > 0) {
    return errorState("Review the chart metadata and try again.", fieldErrors);
  }

  try {
    await updateIdeaChart(chartId, input);
  } catch {
    return errorState("Chart metadata could not be saved.");
  }

  revalidateChartPaths(ideaId, idea.slug);

  return {
    message: "Chart metadata saved.",
    status: "idle",
  };
}

export async function deleteIdeaChartAction(
  _state: IdeaChartActionState,
  formData: FormData
): Promise<IdeaChartActionState> {
  await requireAdmin("/admin/ideas");

  const ideaId = getRequiredId(formData, "idea_id");
  const chartId = getRequiredId(formData, "chart_id");
  const idea = await getParentIdea(ideaId);

  try {
    await deleteIdeaChart(chartId);
  } catch {
    return errorState("Chart metadata could not be deleted.");
  }

  revalidateChartPaths(ideaId, idea.slug);

  return {
    message: "Chart metadata deleted.",
    status: "idle",
  };
}
