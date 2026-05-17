type SupabasePublicConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

type SupabaseAdminConfig = SupabasePublicConfig & {
  supabaseSecretKey: string;
};

// Keep env reads inside functions so static public pages can import modules
// without requiring Supabase variables at build/import time.
function getOptionalEnv(name: string) {
  return process.env[name]?.trim();
}

function requireEnv(value: string | undefined, names: string[]) {
  if (value) {
    return value;
  }

  throw new Error(
    `Missing Supabase environment variable. Set one of: ${names.join(", ")}.`
  );
}

function assertServerOnlySecretAccess() {
  if (typeof window !== "undefined") {
    throw new Error("Supabase secret keys can only be read on the server.");
  }
}

export function getSupabaseBrowserConfig(): SupabasePublicConfig {
  return {
    supabaseUrl: requireEnv(getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL"), [
      "NEXT_PUBLIC_SUPABASE_URL",
    ]),
    supabasePublishableKey: requireEnv(
      getOptionalEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ??
        getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      [
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ]
    ),
  };
}

export function getSupabaseServerConfig(): SupabasePublicConfig {
  return getSupabaseBrowserConfig();
}

export function getSiteUrl() {
  return requireEnv(getOptionalEnv("NEXT_PUBLIC_SITE_URL"), [
    "NEXT_PUBLIC_SITE_URL",
  ]).replace(/\/$/, "");
}

export function getSupabaseAdminConfig(): SupabaseAdminConfig {
  assertServerOnlySecretAccess();

  return {
    ...getSupabaseServerConfig(),
    supabaseSecretKey: requireEnv(
      getOptionalEnv("SUPABASE_SECRET_KEY") ??
        getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
      ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"]
    ),
  };
}
