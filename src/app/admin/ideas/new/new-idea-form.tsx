"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { AuthNotice } from "@/components/auth-notice";
import { AdminCheckbox } from "@/components/admin/forms/AdminCheckbox";
import { AdminFormSection } from "@/components/admin/forms/AdminFormSection";
import { AdminTextInput } from "@/components/admin/forms/AdminTextInput";
import { AdminTextarea } from "@/components/admin/forms/AdminTextarea";
import { AssetClassSelect } from "@/components/admin/forms/AssetClassSelect";
import { IdeaBiasSelect } from "@/components/admin/forms/IdeaBiasSelect";
import { IdeaStatusSelect } from "@/components/admin/forms/IdeaStatusSelect";
import { RiskLevelSelect } from "@/components/admin/forms/RiskLevelSelect";
import { SlugFieldHelper } from "@/components/admin/forms/SlugFieldHelper";
import { VisibilitySelect } from "@/components/admin/forms/VisibilitySelect";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { initialTradingIdeaActionState } from "../action-state";
import { createTradingIdeaAction } from "../actions";

export function NewIdeaForm() {
  const [title, setTitle] = useState("");
  const [state, formAction] = useActionState(
    createTradingIdeaAction,
    initialTradingIdeaActionState
  );

  function fieldError(name: string) {
    return state.fieldErrors?.[name];
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.status === "error" && state.message ? (
        <AuthNotice message={state.message} tone="error" />
      ) : null}

      <AdminFormSection
        description="These fields define how the idea is identified, categorized, and surfaced across the public and member content routes."
        title="Core details"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <AdminTextInput
            error={fieldError("title")}
            id="title"
            label="Title"
            name="title"
            onChange={(event) => setTitle(event.currentTarget.value)}
            placeholder="Example SPY Risk-Defined Watch"
            required
          />
          <AdminTextInput
            description="Leave blank to generate from the title."
            error={fieldError("slug")}
            id="slug"
            label="Slug"
            name="slug"
            placeholder="example-spy-risk-defined-watch"
          />
        </div>

        <SlugFieldHelper title={title} />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <AdminTextInput
            error={fieldError("ticker")}
            id="ticker"
            label="Ticker"
            maxLength={20}
            name="ticker"
            placeholder="SPY"
            required
          />
          <AssetClassSelect
            defaultValue="stock"
            error={fieldError("asset_class")}
            name="asset_class"
            required
          />
          <IdeaBiasSelect
            defaultValue="watch"
            error={fieldError("bias")}
            name="bias"
            required
          />
          <IdeaStatusSelect
            defaultValue="watching"
            error={fieldError("status")}
            name="status"
            required
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <VisibilitySelect
            defaultValue="free"
            error={fieldError("visibility")}
            name="visibility"
            required
          />
          <RiskLevelSelect
            defaultValue="medium"
            error={fieldError("risk_level")}
            name="risk_level"
            required
          />
          <AdminTextInput
            id="timeframe"
            label="Timeframe"
            name="timeframe"
            placeholder="Swing"
          />
          <AdminTextInput
            id="setup_type"
            label="Setup type"
            name="setup_type"
            placeholder="Breakout watch"
          />
        </div>
      </AdminFormSection>

      <AdminFormSection
        description="Use safe preview copy for locked content. Premium and pro previews must not reveal exact levels, targets, or the full thesis."
        title="Research preview and thesis"
      >
        <AdminTextarea
          description="Required for premium/pro content. Keep it safe for public preview cards."
          error={fieldError("public_preview")}
          id="public_preview"
          label="Public preview"
          name="public_preview"
          placeholder="A concise, public-safe overview of the research idea without exact trade levels."
        />
        <AdminTextarea
          id="summary"
          label="Summary"
          name="summary"
          placeholder="Brief internal/member summary."
        />
        <AdminTextarea
          id="thesis"
          label="Thesis"
          name="thesis"
          placeholder="Full research thesis for authorized readers."
        />
      </AdminFormSection>

      <AdminFormSection
        description="These fields are full-content fields. They are protected by RLS and should not be copied into public previews for premium/pro ideas."
        title="Levels and risk"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <AdminTextInput
            id="entry_zone"
            label="Entry zone"
            name="entry_zone"
            placeholder="Example only"
          />
          <AdminTextInput
            id="invalidation_level"
            label="Invalidation level"
            name="invalidation_level"
            placeholder="Example only"
          />
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <AdminTextInput
            id="target_1"
            label="Target 1"
            name="target_1"
            placeholder="Example only"
          />
          <AdminTextInput
            id="target_2"
            label="Target 2"
            name="target_2"
            placeholder="Example only"
          />
          <AdminTextInput
            id="target_3"
            label="Target 3"
            name="target_3"
            placeholder="Example only"
          />
        </div>
        <AdminTextarea
          id="position_disclosure"
          label="Position disclosure"
          name="position_disclosure"
          placeholder="No position disclosure for this educational sample."
        />
        <AdminTextarea
          id="risk_disclosure"
          label="Risk disclosure"
          name="risk_disclosure"
          placeholder="Educational content only. Not personalized financial advice."
        />
      </AdminFormSection>

      <AdminFormSection
        description="Publishing makes the idea visible according to its free, premium, or pro access level. Paid access is controlled by the user's verified subscription state."
        title="Publishing"
      >
        <AdminCheckbox
          description="You can also use the Publish button below to publish immediately."
          id="published"
          label="Publish immediately"
          name="published"
        />
        <AdminCheckbox
          description="Queues safe preview emails for opted-in members who can access this idea. Sending still depends on the email queue configuration."
          id="notify-email"
          label="Notify eligible members by email"
          name="notify_email"
        />
        <AdminTextInput
          description="Optional. Leave blank to use the current time when publishing."
          error={fieldError("published_at")}
          id="published_at"
          label="Published at"
          name="published_at"
          type="datetime-local"
        />
      </AdminFormSection>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          href="/admin/ideas"
        >
          Cancel
        </Link>
        <CreateIdeaSubmitButton intent="draft" label="Save Draft" />
        <CreateIdeaSubmitButton intent="publish" label="Publish" />
      </div>
    </form>
  );
}

function CreateIdeaSubmitButton({
  intent,
  label,
}: {
  intent: "draft" | "publish";
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        buttonVariants({
          size: "lg",
          variant: intent === "publish" ? "default" : "outline",
        })
      )}
      disabled={pending}
      name="intent"
      type="submit"
      value={intent}
    >
      {pending ? "Saving..." : label}
    </button>
  );
}
