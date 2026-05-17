# Phase 3 Authenticated RLS Smoke Test Plan

This plan is development-only. It must never run against production and must
never commit real passwords, service-role keys, or Supabase secret keys.

## Safety Gates

- Require `NODE_ENV !== "production"`.
- Require `CONFIRM_DEV_AUTH_TESTS=true`.
- Use environment variables for Supabase URL, publishable key, and secret key.
- Generate temporary test passwords at runtime only.
- Print masked test emails only.
- Clean up temporary users and test records after the run.

## Expected Access Model

- Anonymous users can read published free content only.
- Anonymous users cannot read premium/pro content.
- Anonymous users cannot write content.
- Authenticated free users can read free content only.
- Authenticated free users can manage their own watchlist records only.
- Authenticated free users cannot manage other users' watchlist records.
- Premium users can read free and premium content.
- Premium users cannot read pro content.
- Pro users can read free, premium, and pro content.
- Admin users can read and manage all content in development tests.

## Test Data

The smoke test creates temporary records with obvious `rls-auth-smoke` markers:

- one free trading idea and post
- one premium trading idea and post
- one pro trading idea and post
- temporary watchlist records
- temporary admin-created content

All temporary records are deleted in cleanup.

## Deferred Production Work

These tests validate RLS behavior only. They do not add Stripe, billing,
premium upgrades, admin dashboards, charts, or notification delivery.
