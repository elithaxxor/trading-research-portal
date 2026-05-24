import packageJson from "../../../../../package.json";

import { getCurrentAdmin } from "@/lib/auth/admin";
import { getStripePriceConfig, getStripeWebhookSecret } from "@/lib/billing/config";
import { getEmailConfig } from "@/lib/email/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HealthStatus = "ok" | "warning" | "error";

type CheckResult = {
  details?: Record<string, boolean | number | string | null>;
  status: HealthStatus;
};

const coreTables = [
  "profiles",
  "trading_ideas",
  "posts",
  "subscriptions",
  "software_products",
  "email_notifications",
  "ops_readiness_checks",
  "ops_events",
] as const;

function getOptionalEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function getSecretFromRequest(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return (
    request.headers.get("x-ops-health-secret") ??
    request.headers.get("x-health-secret") ??
    null
  );
}

function isHealthSecretValid(request: Request) {
  const expected = getOptionalEnv("OPS_HEALTH_SECRET");
  const received = getSecretFromRequest(request);

  return Boolean(expected && received && received === expected);
}

async function isAuthorized(request: Request) {
  if (isHealthSecretValid(request)) {
    return true;
  }

  return Boolean(await getCurrentAdmin());
}

function createConfigPresenceCheck(): CheckResult {
  const stripePriceConfig = getStripePriceConfig();
  const emailConfig = getEmailConfig();
  const stripePricesPresent = Object.values(stripePriceConfig).every((plan) =>
    Object.values(plan).every(Boolean)
  );
  const postmarkConfigured =
    Boolean(emailConfig.postmarkServerToken) &&
    Boolean(emailConfig.postmarkWebhookUsername) &&
    Boolean(emailConfig.postmarkWebhookPassword);

  return {
    details: {
      emailCronSecretConfigured: Boolean(emailConfig.cronSecret),
      emailFromConfigured: Boolean(emailConfig.from),
      emailProviderConfigured: Boolean(emailConfig.provider),
      emailReplyToConfigured: Boolean(emailConfig.replyTo),
      emailSendEnabled: emailConfig.sendEnabled,
      postmarkConfigured,
      postmarkMessageStreamConfigured: Boolean(emailConfig.postmarkMessageStream),
      stripePriceIdsConfigured: stripePricesPresent,
      stripeSecretConfigured: Boolean(getOptionalEnv("STRIPE_SECRET_KEY")),
      stripeWebhookRouteConfigured: true,
      stripeWebhookSecretConfigured: Boolean(getStripeWebhookSecret()),
    },
    status: postmarkConfigured || stripePricesPresent ? "ok" : "warning",
  };
}

function createBuildMetadata() {
  const commitRef =
    getOptionalEnv("COMMIT_REF") ||
    getOptionalEnv("REVIEW_ID") ||
    getOptionalEnv("VERCEL_GIT_COMMIT_SHA");

  return {
    branchConfigured: Boolean(getOptionalEnv("BRANCH")),
    commitShort: commitRef ? commitRef.slice(0, 8) : null,
    deployContext: getOptionalEnv("CONTEXT") || null,
    deployIdConfigured: Boolean(getOptionalEnv("DEPLOY_ID")),
    version: packageJson.version,
  };
}

async function checkSupabaseTables(): Promise<CheckResult> {
  const canUseAdminClient = Boolean(
    getOptionalEnv("SUPABASE_SECRET_KEY") ||
      getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
  const supabase = canUseAdminClient
    ? createSupabaseAdminClient()
    : await createSupabaseServerClient();
  const results: Record<string, boolean> = {};

  for (const table of coreTables) {
    const { error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    results[table] = !error;
  }

  const availableCount = Object.values(results).filter(Boolean).length;
  const allAvailable = availableCount === coreTables.length;

  return {
    details: {
      ...results,
      availableTables: availableCount,
      checkedTables: coreTables.length,
      usedAdminClient: canUseAdminClient,
    },
    status: allAvailable ? "ok" : "error",
  };
}

function aggregateStatus(checks: Record<string, CheckResult>): HealthStatus {
  const statuses = Object.values(checks).map((check) => check.status);

  if (statuses.includes("error")) {
    return "error";
  }

  if (statuses.includes("warning")) {
    return "warning";
  }

  return "ok";
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const checks = {
    configPresence: createConfigPresenceCheck(),
    supabase: await checkSupabaseTables(),
  };

  return Response.json({
    app: "Trading Research Portal",
    build: createBuildMetadata(),
    checks,
    status: aggregateStatus(checks),
    timestamp: new Date().toISOString(),
  });
}
