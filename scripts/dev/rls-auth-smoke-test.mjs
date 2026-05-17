#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const RUN_ID = `rls-auth-smoke-${Date.now()}-${randomBytes(4).toString("hex")}`;
const VISIBILITIES = ["free", "premium", "pro"];
const results = [];
const cleanup = {
  ideaIds: [],
  ideaSlugs: [],
  postIds: [],
  postSlugs: [],
  userIds: [],
  watchlistIds: [],
};

function requiredEnv(name, fallbackName) {
  const rawValue =
    process.env[name]?.trim() || process.env[fallbackName]?.trim();
  const value = rawValue?.replace(/^["']|["']$/g, "");

  if (!value) {
    const names = fallbackName ? `${name} or ${fallbackName}` : name;
    throw new Error(`Missing required environment variable: ${names}`);
  }

  return value;
}

function assertSafeEnvironment() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run authenticated RLS tests in production.");
  }

  if (process.env.CONFIRM_DEV_AUTH_TESTS !== "true") {
    throw new Error(
      "Set CONFIRM_DEV_AUTH_TESTS=true to run development auth RLS tests."
    );
  }
}

function maskEmail(email) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 3)}***@${domain}`;
}

function makePassword() {
  return `Rls!${randomBytes(18).toString("base64url")}1a`;
}

function makeEmail(role) {
  return `${RUN_ID}-${role}@example.test`;
}

function createBrowserLikeClient(supabaseUrl, supabasePublishableKey) {
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function createAdminClient(supabaseUrl, supabaseSecretKey) {
  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function record(name, passed, details = "") {
  results.push({
    details,
    name,
    passed,
  });

  const marker = passed ? "PASS" : "FAIL";
  console.log(`${marker} ${name}${details ? ` - ${details}` : ""}`);
}

function isBlockedResult({ data, error }) {
  return Boolean(error) || !data || data.length === 0;
}

async function createTempUser(
  admin,
  supabaseUrl,
  supabasePublishableKey,
  role,
  tier,
  status
) {
  const email = makeEmail(role);
  const password = makePassword();
  const fullName = `RLS ${role} user`;

  const { data: createdUser, error: createError } =
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: {
        full_name: fullName,
      },
    });

  if (createError || !createdUser.user) {
    throw new Error(`Unable to create ${role} test user.`);
  }

  const userId = createdUser.user.id;
  cleanup.userIds.push(userId);

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      email,
      full_name: fullName,
      id: userId,
      role: role === "admin" ? "admin" : "user",
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) {
    throw new Error(`Unable to prepare ${role} profile.`);
  }

  const { error: subscriptionError } = await admin
    .from("subscriptions")
    .upsert(
      {
        status,
        tier,
        user_id: userId,
      },
      {
        onConflict: "user_id",
      }
    );

  if (subscriptionError) {
    throw new Error(`Unable to prepare ${role} subscription.`);
  }

  const client = createBrowserLikeClient(supabaseUrl, supabasePublishableKey);
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    throw new Error(`Unable to sign in ${role} test user.`);
  }

  console.log(`Prepared ${role} user: ${maskEmail(email)}`);

  return {
    client,
    email,
    id: userId,
    role,
  };
}

async function createTempContent(admin) {
  const now = new Date().toISOString();
  const ideas = VISIBILITIES.map((visibility) => ({
    educational_purpose_only: true,
    published: true,
    published_at: now,
    risk_disclosure: "Development-only RLS smoke test. Not financial advice.",
    slug: `${RUN_ID}-idea-${visibility}`,
    summary: "Development-only RLS smoke test record.",
    thesis: "Used only to validate row level security access.",
    ticker: "RLS",
    title: `RLS Auth Smoke ${visibility} idea`,
    visibility,
  }));

  const posts = VISIBILITIES.map((visibility) => ({
    body: "Development-only RLS smoke test record.",
    excerpt: "Used only to validate row level security access.",
    published: true,
    published_at: now,
    slug: `${RUN_ID}-post-${visibility}`,
    title: `RLS Auth Smoke ${visibility} post`,
    visibility,
  }));

  const { data: ideaRows, error: ideaError } = await admin
    .from("trading_ideas")
    .insert(ideas)
    .select("id,slug,visibility");

  if (ideaError || !ideaRows) {
    throw new Error("Unable to create temporary trading ideas.");
  }

  cleanup.ideaIds.push(...ideaRows.map((row) => row.id));
  cleanup.ideaSlugs.push(...ideaRows.map((row) => row.slug));

  const { data: postRows, error: postError } = await admin
    .from("posts")
    .insert(posts)
    .select("id,slug,visibility,title");

  if (postError || !postRows) {
    throw new Error("Unable to create temporary posts.");
  }

  cleanup.postIds.push(...postRows.map((row) => row.id));
  cleanup.postSlugs.push(...postRows.map((row) => row.slug));

  return {
    ideas: Object.fromEntries(ideaRows.map((row) => [row.visibility, row])),
    posts: Object.fromEntries(postRows.map((row) => [row.visibility, row])),
  };
}

async function expectVisibilityAccess(client, table, rowsByVisibility, allowed) {
  for (const visibility of VISIBILITIES) {
    const row = rowsByVisibility[visibility];
    const { data, error } = await client
      .from(table)
      .select("id,slug,visibility")
      .eq("slug", row.slug);

    const shouldRead = allowed.includes(visibility);
    const didRead = !error && data?.length === 1;

    record(
      `${table} ${visibility} ${shouldRead ? "readable" : "blocked"}`,
      shouldRead ? didRead : !didRead,
      error && shouldRead ? error.message : ""
    );
  }
}

async function testContentWriteProtection(
  client,
  label,
  tempContent,
  expectBlocked = true
) {
  const ideaInsert = await client
    .from("trading_ideas")
    .insert({
      slug: `${RUN_ID}-${label}-blocked-idea`,
      ticker: "RLS",
      title: `${label} blocked idea insert`,
    })
    .select("id,slug");

  if (ideaInsert.data?.length) {
    cleanup.ideaIds.push(...ideaInsert.data.map((row) => row.id));
    cleanup.ideaSlugs.push(...ideaInsert.data.map((row) => row.slug));
  }

  record(
    `${label} cannot insert trading ideas`,
    expectBlocked ? isBlockedResult(ideaInsert) : !ideaInsert.error,
    ideaInsert.error?.message ?? ""
  );

  const postUpdate = await client
    .from("posts")
    .update({ title: `${label} should not update this post` })
    .eq("id", tempContent.posts.free.id)
    .select("id,title");

  record(
    `${label} cannot update posts`,
    expectBlocked ? isBlockedResult(postUpdate) : !postUpdate.error,
    postUpdate.error?.message ?? ""
  );

  const chartInsert = await client
    .from("idea_charts")
    .insert({
      caption: `${label} blocked chart insert`,
      chart_type: "tradingview_embed",
      idea_id: tempContent.ideas.free.id,
      symbol: "RLS",
      tradingview_symbol: "RLS",
    })
    .select("id");

  record(
    `${label} cannot insert idea charts`,
    expectBlocked ? isBlockedResult(chartInsert) : !chartInsert.error,
    chartInsert.error?.message ?? ""
  );

  const updateInsert = await client
    .from("idea_updates")
    .insert({
      body: `${label} blocked update insert`,
      idea_id: tempContent.ideas.free.id,
      title: `${label} blocked update insert`,
    })
    .select("id");

  record(
    `${label} cannot insert idea updates`,
    expectBlocked ? isBlockedResult(updateInsert) : !updateInsert.error,
    updateInsert.error?.message ?? ""
  );
}

async function testWatchlistOwnership(admin, owner, other) {
  const ticker = `RLS${randomBytes(3).toString("hex").toUpperCase()}`;
  const note = `${RUN_ID} owner watchlist`;

  const ownInsert = await owner.client
    .from("watchlist_items")
    .insert({
      note,
      ticker,
      user_id: owner.id,
    })
    .select("id,note,user_id")
    .single();

  record(
    "free user can insert own watchlist item",
    !ownInsert.error && ownInsert.data?.user_id === owner.id,
    ownInsert.error?.message ?? ""
  );

  if (!ownInsert.data) {
    return;
  }

  cleanup.watchlistIds.push(ownInsert.data.id);

  const otherRead = await other.client
    .from("watchlist_items")
    .select("id")
    .eq("id", ownInsert.data.id);

  record(
    "other user cannot read another user's watchlist item",
    isBlockedResult(otherRead),
    otherRead.error?.message ?? ""
  );

  const otherUpdate = await other.client
    .from("watchlist_items")
    .update({ note: `${RUN_ID} unauthorized update` })
    .eq("id", ownInsert.data.id)
    .select("id");

  record(
    "other user cannot update another user's watchlist item",
    isBlockedResult(otherUpdate),
    otherUpdate.error?.message ?? ""
  );

  const otherInsert = await other.client
    .from("watchlist_items")
    .insert({
      note: `${RUN_ID} unauthorized insert`,
      ticker: `${ticker}X`,
      user_id: owner.id,
    })
    .select("id");

  record(
    "other user cannot insert a watchlist item for another user",
    isBlockedResult(otherInsert),
    otherInsert.error?.message ?? ""
  );

  if (otherInsert.data?.length) {
    cleanup.watchlistIds.push(...otherInsert.data.map((row) => row.id));
  }

  const ownUpdate = await owner.client
    .from("watchlist_items")
    .update({ note: `${RUN_ID} owner updated` })
    .eq("id", ownInsert.data.id)
    .select("id,note")
    .single();

  record(
    "free user can update own watchlist item",
    !ownUpdate.error && ownUpdate.data?.note === `${RUN_ID} owner updated`,
    ownUpdate.error?.message ?? ""
  );

  const ownDelete = await owner.client
    .from("watchlist_items")
    .delete()
    .eq("id", ownInsert.data.id)
    .select("id");

  record(
    "free user can delete own watchlist item",
    !ownDelete.error && ownDelete.data?.length === 1,
    ownDelete.error?.message ?? ""
  );

  const verifyDeleted = await admin
    .from("watchlist_items")
    .select("id")
    .eq("id", ownInsert.data.id);

  record(
    "deleted own watchlist item is removed",
    !verifyDeleted.error && verifyDeleted.data.length === 0,
    verifyDeleted.error?.message ?? ""
  );
}

async function testAdminWrites(adminUser) {
  const slug = `${RUN_ID}-admin-created-idea`;
  const insert = await adminUser.client
    .from("trading_ideas")
    .insert({
      published: false,
      slug,
      ticker: "RLS",
      title: "RLS admin created idea",
    })
    .select("id,slug,title")
    .single();

  record(
    "admin can insert trading ideas",
    !insert.error && insert.data?.slug === slug,
    insert.error?.message ?? ""
  );

  if (!insert.data) {
    return;
  }

  cleanup.ideaIds.push(insert.data.id);
  cleanup.ideaSlugs.push(insert.data.slug);

  const update = await adminUser.client
    .from("trading_ideas")
    .update({ title: "RLS admin updated idea" })
    .eq("id", insert.data.id)
    .select("id,title")
    .single();

  record(
    "admin can update trading ideas",
    !update.error && update.data?.title === "RLS admin updated idea",
    update.error?.message ?? ""
  );

  const remove = await adminUser.client
    .from("trading_ideas")
    .delete()
    .eq("id", insert.data.id)
    .select("id");

  record(
    "admin can delete trading ideas",
    !remove.error && remove.data?.length === 1,
    remove.error?.message ?? ""
  );
}

async function cleanupTempData(admin) {
  if (!admin) {
    return;
  }

  if (cleanup.watchlistIds.length > 0) {
    await admin.from("watchlist_items").delete().in("id", cleanup.watchlistIds);
  }

  if (cleanup.ideaIds.length > 0) {
    await admin.from("idea_charts").delete().in("idea_id", cleanup.ideaIds);
    await admin.from("idea_updates").delete().in("idea_id", cleanup.ideaIds);
    await admin.from("trading_ideas").delete().in("id", cleanup.ideaIds);
  }

  if (cleanup.postIds.length > 0) {
    await admin.from("posts").delete().in("id", cleanup.postIds);
  }

  for (const userId of cleanup.userIds) {
    await admin.auth.admin.deleteUser(userId);
  }
}

async function main() {
  assertSafeEnvironment();

  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabasePublishableKey = requiredEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
  const supabaseSecretKey = requiredEnv(
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  );

  const publicClient = createBrowserLikeClient(
    supabaseUrl,
    supabasePublishableKey
  );
  const admin = createAdminClient(supabaseUrl, supabaseSecretKey);

  console.log("Running development-only authenticated RLS smoke test.");
  console.log(`Run marker: ${RUN_ID}`);

  try {
    const tempContent = await createTempContent(admin);

    const freeUser = await createTempUser(
      admin,
      supabaseUrl,
      supabasePublishableKey,
      "free",
      "free",
      "none"
    );
    const premiumUser = await createTempUser(
      admin,
      supabaseUrl,
      supabasePublishableKey,
      "premium",
      "premium",
      "active"
    );
    const proUser = await createTempUser(
      admin,
      supabaseUrl,
      supabasePublishableKey,
      "pro",
      "pro",
      "active"
    );
    const adminUser = await createTempUser(
      admin,
      supabaseUrl,
      supabasePublishableKey,
      "admin",
      "free",
      "none"
    );

    console.log("\nAnonymous read tests");
    await expectVisibilityAccess(publicClient, "trading_ideas", tempContent.ideas, [
      "free",
    ]);
    await expectVisibilityAccess(publicClient, "posts", tempContent.posts, [
      "free",
    ]);
    await testContentWriteProtection(
      publicClient,
      "anonymous user",
      tempContent
    );

    console.log("\nFree user tests");
    await expectVisibilityAccess(freeUser.client, "trading_ideas", tempContent.ideas, [
      "free",
    ]);
    await expectVisibilityAccess(freeUser.client, "posts", tempContent.posts, [
      "free",
    ]);
    await testWatchlistOwnership(admin, freeUser, premiumUser);
    await testContentWriteProtection(freeUser.client, "free user", tempContent);

    console.log("\nPremium user tests");
    await expectVisibilityAccess(
      premiumUser.client,
      "trading_ideas",
      tempContent.ideas,
      ["free", "premium"]
    );
    await expectVisibilityAccess(premiumUser.client, "posts", tempContent.posts, [
      "free",
      "premium",
    ]);

    console.log("\nPro user tests");
    await expectVisibilityAccess(proUser.client, "trading_ideas", tempContent.ideas, [
      "free",
      "premium",
      "pro",
    ]);
    await expectVisibilityAccess(proUser.client, "posts", tempContent.posts, [
      "free",
      "premium",
      "pro",
    ]);

    console.log("\nAdmin user tests");
    await expectVisibilityAccess(
      adminUser.client,
      "trading_ideas",
      tempContent.ideas,
      ["free", "premium", "pro"]
    );
    await expectVisibilityAccess(adminUser.client, "posts", tempContent.posts, [
      "free",
      "premium",
      "pro",
    ]);
    await testAdminWrites(adminUser);
  } finally {
    await cleanupTempData(admin);
  }

  const failed = results.filter((result) => !result.passed);

  console.log(
    `\nAuthenticated RLS smoke test complete: ${results.length - failed.length}/${results.length} passed.`
  );

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`RLS smoke test aborted: ${error.message}`);
  process.exitCode = 1;
});
