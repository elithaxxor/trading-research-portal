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
import {
  normalizeTickerSymbol,
  normalizeTradingViewSymbol,
  sanitizeChartUrl,
  validateTradingViewInterval,
} from "@/lib/charts/validation";

const maxCaptionLength = 300;

export type IdeaChartActionState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "error";
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

  const sanitized = sanitizeChartUrl(normalized);

  if (!sanitized) {
    addFieldError(
      fieldErrors,
      fieldName,
      "Enter a valid http or https URL. JavaScript, data, and malformed URLs are not allowed."
    );
    return null;
  }

  return sanitized;
}

function normalizeOptionalTickerSymbol(
  value: string,
  fieldErrors: Record<string, string>
) {
  const normalized = normalizeEmptyString(value);

  if (!normalized) {
    return null;
  }

  const result = normalizeTickerSymbol(normalized);

  if (!result.ok) {
    addFieldError(fieldErrors, "symbol", result.error);
    return null;
  }

  return result.value;
}

function normalizeOptionalTradingViewSymbol(
  value: string,
  fieldErrors: Record<string, string>
) {
  const normalized = normalizeEmptyString(value);

  if (!normalized) {
    return null;
  }

  const result = normalizeTradingViewSymbol(normalized);

  if (!result.ok) {
    addFieldError(fieldErrors, "tradingview_symbol", result.error);
    return null;
  }

  return result.value;
}

function normalizeOptionalCaption(
  value: string,
  fieldErrors: Record<string, string>
) {
  const normalized = normalizeEmptyString(value);

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxCaptionLength) {
    addFieldError(
      fieldErrors,
      "caption",
      `Caption must be ${maxCaptionLength} characters or fewer.`
    );
    return null;
  }

  return normalized;
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
  const symbol = normalizeOptionalTickerSymbol(
    getFormValue(formData, "symbol"),
    fieldErrors
  );
  const tradingviewSymbol = normalizeOptionalTradingViewSymbol(
    getFormValue(formData, "tradingview_symbol"),
    fieldErrors
  );
  const interval = validateTradingViewInterval(
    getFormValue(formData, "interval")
  );
  const caption = normalizeOptionalCaption(
    getFormValue(formData, "caption"),
    fieldErrors
  );

  if (!interval.ok) {
    addFieldError(fieldErrors, "interval", interval.error);
  }

  if (chartType.ok && chartType.value === "tradingview_embed") {
    if (!symbol && !tradingviewSymbol) {
      addFieldError(
        fieldErrors,
        "tradingview_symbol",
        "TradingView charts require a TradingView symbol or symbol."
      );
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !chartType.ok || !interval.ok) {
    return {
      fieldErrors,
      input: null,
    };
  }

  return {
    fieldErrors,
    input: {
      caption,
      chart_type: chartType.value,
      embed_url: embedUrl,
      image_url: imageUrl,
      interval: interval.value,
      symbol,
      tradingview_symbol: tradingviewSymbol,
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
