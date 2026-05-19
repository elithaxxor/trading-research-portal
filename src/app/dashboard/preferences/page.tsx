import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Settings, SlidersHorizontal } from "lucide-react";

import { updateMemberPreferencesAction } from "@/app/dashboard/member-actions";
import { CardShell } from "@/components/card-shell";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { PreferencesSubmitButton } from "@/components/dashboard/PreferencesSubmitButton";
import { MemberActionNotice } from "@/components/member-action-notice";
import {
  assetClassValues,
  contentVisibilityValues,
  ideaStatusValues,
} from "@/lib/content/search-params";
import {
  formatMemberDashboardView,
  formatMemberSortPreference,
} from "@/lib/member/format";
import { ensureMemberPreferences } from "@/lib/member/preferences";
import {
  memberDashboardViewValues,
  memberSortPreferenceValues,
} from "@/lib/member/validation";

export const metadata: Metadata = {
  title: "Dashboard Preferences",
};

export const dynamic = "force-dynamic";

type DashboardPreferencesPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

export default async function DashboardPreferencesPage({
  searchParams,
}: DashboardPreferencesPageProps) {
  const params = await searchParams;
  const preferences = await ensureMemberPreferences();
  const enabledCount = [
    preferences.show_locked_previews,
    preferences.show_charts_on_dashboard,
    preferences.show_closed_reviews,
    preferences.show_software_section,
  ].filter(Boolean).length;

  return (
    <div className="grid gap-8">
      <DashboardPageHeader
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { label: "Preferences" },
        ]}
        description="Tune your member dashboard defaults, filters, and optional sections."
        title="Preferences"
      />

      <MemberActionNotice notice={params?.notice} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardStatCard
          description="Preference records are owned by your authenticated user through RLS."
          icon={Settings}
          label="Enabled sections"
          value={`${enabledCount}/4`}
        />
        <DashboardStatCard
          description="Preferences customize your dashboard only. They do not create alerts, trade instructions, broker actions, or software permissions."
          icon={SlidersHorizontal}
          label="Scope"
          value="Dashboard only"
        />
      </div>

      <DashboardSection
        description="These settings are saved server-side for your account and applied to the overview where practical."
        title="Dashboard settings"
      >
        {isDefaultPreferences(preferences) ? (
          <div className="mb-4">
            <MemberActionNotice notice="preferences-default" />
          </div>
        ) : null}
        <form action={updateMemberPreferencesAction}>
          <CardShell padding="lg" tone="elevated">
            <div className="grid gap-8">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Default view
                  </span>
                  <select
                    className="min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
                    defaultValue={preferences.default_view}
                    name="default_view"
                  >
                    {memberDashboardViewValues.map((view) => (
                      <option key={view} value={view}>
                        {formatMemberDashboardView(view)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Default sort
                  </span>
                  <select
                    className="min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
                    defaultValue={preferences.default_sort}
                    name="default_sort"
                  >
                    {memberSortPreferenceValues.map((sort) => (
                      <option key={sort} value={sort}>
                        {formatMemberSortPreference(sort)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <PreferenceGroup
                description="Choose which optional dashboard sections and preview styles are visible."
                title="Display options"
              >
                <CheckboxField
                  defaultChecked={preferences.show_locked_previews}
                  description="Show safe locked cards for ideas outside your current tier."
                  label="Show locked previews"
                  name="show_locked_previews"
                />
                <CheckboxField
                  defaultChecked={preferences.show_charts_on_dashboard}
                  description="Allow dashboard widgets to highlight chart-enabled research when available."
                  label="Show charts on dashboard"
                  name="show_charts_on_dashboard"
                />
                <CheckboxField
                  defaultChecked={preferences.show_closed_reviews}
                  description="Include closed review widgets on your dashboard overview."
                  label="Show closed reviews"
                  name="show_closed_reviews"
                />
                <CheckboxField
                  defaultChecked={preferences.show_software_section}
                  description="Show the software library preview on the dashboard overview."
                  label="Show software section"
                  name="show_software_section"
                />
              </PreferenceGroup>

              <PreferenceGroup
                description="Leave a group empty to include all values in that category."
                title="Preferred filters"
              >
                <CheckboxGrid
                  name="preferred_asset_classes"
                  selectedValues={preferences.preferred_asset_classes}
                  title="Asset classes"
                  values={assetClassValues}
                />
                <CheckboxGrid
                  name="preferred_statuses"
                  selectedValues={preferences.preferred_statuses}
                  title="Lifecycle statuses"
                  values={ideaStatusValues}
                />
                <CheckboxGrid
                  name="preferred_visibility"
                  selectedValues={preferences.preferred_visibility}
                  title="Visibility"
                  values={contentVisibilityValues}
                />
              </PreferenceGroup>

              <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-muted-foreground">
                  Changes apply to dashboard views and never change research
                  access rules.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <PreferencesSubmitButton
                    label="Save preferences"
                    pendingLabel="Saving..."
                  />
                </div>
              </div>
            </div>
          </CardShell>
        </form>
      </DashboardSection>

      <DashboardSection
        description="Resetting restores the original Phase 8 dashboard defaults for your account."
        title="Reset preferences"
      >
        <CardShell padding="lg" tone="subtle">
          <form
            action={updateMemberPreferencesAction}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <input name="intent" type="hidden" value="reset" />
            <p className="text-sm leading-6 text-muted-foreground">
              Restore overview defaults, recently updated sorting, all filters,
              and all optional dashboard sections.
            </p>
            <PreferencesSubmitButton
              intent="reset"
              label="Reset to defaults"
              pendingLabel="Resetting..."
              variant="outline"
            />
          </form>
        </CardShell>
      </DashboardSection>
    </div>
  );
}

function PreferenceGroup({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  );
}

function CheckboxField({
  defaultChecked,
  description,
  label,
  name,
}: {
  defaultChecked: boolean;
  description: string;
  label: string;
  name: string;
}) {
  return (
    <label className="flex gap-3 rounded-lg border border-border bg-secondary/25 p-4">
      <input
        className="mt-1 size-4 rounded border-border accent-primary"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
      />
      <span>
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

function CheckboxGrid<TValue extends string>({
  name,
  selectedValues,
  title,
  values,
}: {
  name: string;
  selectedValues: readonly TValue[];
  title: string;
  values: readonly TValue[];
}) {
  return (
    <fieldset className="rounded-lg border border-border bg-secondary/25 p-4">
      <legend className="px-1 text-sm font-medium text-foreground">
        {title}
      </legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {values.map((value) => (
          <label
            className="flex items-center gap-2 rounded-md border border-border bg-background/55 px-3 py-2 text-sm text-foreground"
            key={value}
          >
            <input
              className="size-4 rounded border-border accent-primary"
              defaultChecked={selectedValues.includes(value)}
              name={name}
              type="checkbox"
              value={value}
            />
            {formatEnumLabel(value)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isDefaultPreferences(preferences: Awaited<ReturnType<typeof ensureMemberPreferences>>) {
  return (
    preferences.default_view === "overview" &&
    preferences.default_sort === "recently_updated" &&
    preferences.show_locked_previews &&
    preferences.show_charts_on_dashboard &&
    preferences.show_closed_reviews &&
    preferences.show_software_section &&
    preferences.preferred_asset_classes.length === 0 &&
    preferences.preferred_statuses.length === 0 &&
    preferences.preferred_visibility.length === 0
  );
}
