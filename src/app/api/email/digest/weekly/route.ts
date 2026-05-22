import { assertValidEmailCronSecret } from "@/lib/email/config";
import { queueWeeklyDigestRun } from "@/lib/email/digest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WeeklyDigestRequestBody = {
  limit?: unknown;
  runKey?: unknown;
  since?: unknown;
  until?: unknown;
};

function jsonResponse(payload: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(payload, { headers, status });
}

function getCronSecretFromRequest(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return (
    request.headers.get("x-email-cron-secret") ??
    request.headers.get("x-cron-secret") ??
    null
  );
}

function authorizeCronRequest(request: Request) {
  try {
    assertValidEmailCronSecret(getCronSecretFromRequest(request));
    return null;
  } catch {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }
}

function normalizeDateInput(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeRunKey(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 200)
    : undefined;
}

function normalizeLimit(value: unknown) {
  const limit = Number(value);

  return Number.isFinite(limit) && limit > 0 ? limit : undefined;
}

async function readDigestOptions(request: Request) {
  try {
    const body = (await request.json()) as WeeklyDigestRequestBody;

    return {
      limit: normalizeLimit(body.limit),
      runKey: normalizeRunKey(body.runKey),
      since: normalizeDateInput(body.since),
      until: normalizeDateInput(body.until),
    };
  } catch {
    return {};
  }
}

export function GET() {
  return jsonResponse(
    { error: "Method not allowed." },
    405,
    { Allow: "POST" }
  );
}

export async function POST(request: Request) {
  const unauthorized = authorizeCronRequest(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await queueWeeklyDigestRun(await readDigestOptions(request));

    return jsonResponse({
      failed: result.failed,
      queued: result.queued,
      runKey: result.runKey,
      skipped: result.skipped,
      totalEligible: result.totalEligible,
    });
  } catch (error) {
    console.error("Weekly digest queueing failed.", {
      error:
        error instanceof Error
          ? error.message
          : "Unknown weekly digest queueing error",
    });

    return jsonResponse({ error: "Weekly digest queueing failed." }, 500);
  }
}
