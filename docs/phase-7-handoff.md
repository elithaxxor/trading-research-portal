# Phase 7 Handoff Report

## Summary

Phase 7 refines trading idea lifecycle management across the admin dashboard,
public idea pages, and member dashboard. The work adds structured lifecycle
status transitions, educational outcome tracking, closed idea reviews, richer
update timelines, lifecycle-aware idea filtering, and a foundation for
"new since last visit" member behavior.

The implementation preserves the existing access model. Full lifecycle details
are only shown when Supabase RLS and server-side access checks allow the viewer
to access the full idea. Locked premium/pro pages continue to expose safe
preview fields only.

## Files Created

- `src/app/admin/ideas/[id]/edit/lifecycle-panel.tsx`
- `src/app/admin/ideas/lifecycle-actions.ts`
- `src/app/dashboard/actions.ts`
- `src/app/dashboard/mark-seen-submit-button.tsx`
- `src/components/content/IdeaLifecycleSummary.tsx`
- `src/components/content/IdeaOutcomeReview.tsx`
- `src/components/content/IdeaTimeline.tsx`
- `src/components/content/IdeaTimelineItem.tsx`
- `src/components/content/LifecycleEventBadge.tsx`
- `src/components/content/OutcomeBadge.tsx`
- `src/lib/activity/user-activity.ts`
- `src/lib/lifecycle/constants.ts`
- `src/lib/lifecycle/format.ts`
- `src/lib/lifecycle/transitions.ts`
- `src/lib/lifecycle/types.ts`
- `src/lib/lifecycle/validation.ts`
- `supabase/migrations/20260518095114_phase_7_lifecycle.sql`
- `supabase/migrations/20260518111531_phase_7_idea_preview_lifecycle_filters.sql`
- `docs/phase-7-handoff.md`

## Files Modified

- `README.md`
- `src/app/admin/ideas/[id]/edit/page.tsx`
- `src/app/admin/ideas/[id]/updates/actions.ts`
- `src/app/admin/ideas/[id]/updates/idea-updates-manager.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/ideas/[slug]/page.tsx`
- `src/app/ideas/page.tsx`
- `src/components/content/content-filter-bar.tsx`
- `src/components/content/idea-card.tsx`
- `src/lib/content/ideas.ts`
- `src/lib/content/search-params.ts`
- `src/lib/content/types.ts`
- `src/types/database.types.ts`

## Migrations Added

- `20260518095114_phase_7_lifecycle.sql`
  - Adds `idea_outcome`.
  - Adds `idea_lifecycle_event_type`.
  - Adds lifecycle timestamps, outcome fields, review publication fields, and
    `last_lifecycle_event_at` to `trading_ideas`.
  - Adds lifecycle event metadata to `idea_updates`.
  - Adds `user_activity_state` with RLS for user-owned seen timestamps.
  - Adds indexes for status/outcome, lifecycle recency, closed ideas, update
    event ordering, and user activity lookup.

- `20260518111531_phase_7_idea_preview_lifecycle_filters.sql`
  - Updates safe idea preview RPC behavior for lifecycle-aware filters and
    sorting.
  - Returns only safe preview fields.
  - Keeps private update bodies, outcome summaries, lessons learned, thesis,
    levels, targets, and chart details out of unauthorized preview responses.

## Routes and Components Updated

- `/ideas`
  - Adds lifecycle status, outcome, recently updated, closed review, and sort
    controls.
  - Idea cards show safe lifecycle summary fields only when the viewer can
    access them.

- `/ideas/[slug]`
  - Full-access pages show lifecycle summary, research timeline, event badges,
    major-update indicators, and published outcome review.
  - Locked premium/pro pages keep private lifecycle details hidden.

- `/dashboard`
  - Adds lifecycle-aware widgets and mark-seen behavior.

- `/admin/ideas/[id]/edit`
  - Adds lifecycle panel and actions.

- `/admin/ideas/[id]/updates`
  - Shows lifecycle metadata and supports manual update notes.

## Lifecycle Actions Added

- `transitionIdeaStatusAction`
- `markTargetHitAction`
- `closeIdeaWithReviewAction`
- `reopenIdeaAction`
- `publishReviewAction`
- `unpublishReviewAction`
- `markDashboardSeenAction`

Every admin lifecycle mutation calls `requireAdmin()` and uses the normal
server Supabase client so admin RLS policies are exercised.

## Dashboard Widgets Added

- New Since Last Visit
- Recently Updated Ideas
- Active / Triggered Ideas
- Closed Reviews
- Invalidated Ideas

The dashboard uses RLS-aware server-side utilities. Locked premium/pro content
continues to display safe preview cards only.

## QA Result

Local and deploy-preview QA passed for:

- Anonymous public route access and protected route redirects.
- Anonymous full free lifecycle timeline access.
- Anonymous locked premium/pro lifecycle access.
- Authenticated free user lifecycle access.
- Authenticated premium user lifecycle access.
- Authenticated pro user lifecycle access.
- Admin lifecycle controls visibility.
- Admin lifecycle transition flow.
- Close with review and public review visibility.
- Reopen behavior with historical review fields preserved.
- Dashboard lifecycle widgets and mark-seen UI.
- Premium/pro leak checks for update bodies, outcome summaries, lessons learned,
  thesis, levels, targets, and private chart metadata.
- Cleanup of temporary Phase 7 QA records.

## Deploy Preview Result

Deploy preview:

```text
https://deploy-preview-8--trading-research-portal.netlify.app
```

Passing on deploy preview:

- Public routes return `200`.
- `/dashboard`, `/account`, and `/admin` redirect anonymous users to login.
- Free idea detail pages show lifecycle summary and timeline.
- Premium/pro idea detail pages show locked panels to unauthorized users.
- Authenticated tier checks passed for free, premium, pro, and admin users.
- Admin lifecycle QA passed with a temporary QA idea.
- Temporary QA idea and related updates were cleaned up.
- CSS assets load.
- TradingView chart regression passed.
- No duplicate iframes after navigation.
- Browser console showed no errors during chart/lifecycle QA.
- Narrow viewport check showed no horizontal overflow.

## Commands Verified

```bash
npm run build
npm run lint
npx tsc --noEmit
```

All passed.

## Remaining Risks

- Supabase deploy-preview magic-link/email redirect behavior still needs
  dedicated auth-email QA before production email workflows are promoted.
- Phase 7 does not add email notifications; lifecycle updates are not sent to
  users yet.
- Phase 7 does not add analytics, broker integrations, order execution, copy
  trading, payment logic, or performance reporting.
- Subscription tiers are still managed manually for QA until the future Stripe
  subscription phase.

## Recommended Next Step

Proceed to Phase 8 - Advanced Member Dashboard.

Phase 8 should build richer authenticated member dashboard workflows on top of
the existing content, chart, lifecycle, and activity-state foundations. It
should continue to avoid Stripe payments, broker integrations, order execution,
copy trading, and email notification backend work until their dedicated phases.
