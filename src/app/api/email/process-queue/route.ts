import { assertValidEmailCronSecret } from "@/lib/email/config";
import { processQueuedEmail } from "@/lib/email/queue";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

async function readLimit(request: Request) {
  const url = new URL(request.url);
  const queryLimit = Number(url.searchParams.get("limit") ?? "");

  if (Number.isFinite(queryLimit) && queryLimit > 0) {
    return queryLimit;
  }

  try {
    const body = (await request.json()) as { limit?: unknown };
    const bodyLimit = Number(body.limit);

    return Number.isFinite(bodyLimit) && bodyLimit > 0 ? bodyLimit : undefined;
  } catch {
    return undefined;
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
    const result = await processQueuedEmail(await readLimit(request));

    return jsonResponse({
      failed: result.failed,
      processed: result.total,
      sent: result.sent,
      skipped: result.skipped,
    });
  } catch (error) {
    console.error("Email queue processing failed.", {
      error:
        error instanceof Error
          ? error.message
          : "Unknown email queue processing error",
    });

    return jsonResponse({ error: "Email queue processing failed." }, 500);
  }
}
