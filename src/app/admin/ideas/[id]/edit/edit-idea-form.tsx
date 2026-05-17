"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

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
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import type { AdminIdea } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

import {
  deleteTradingIdeaAction,
  initialTradingIdeaActionState,
  publishTradingIdeaAction,
  unpublishTradingIdeaAction,
  updateTradingIdeaAction,
} from "../../actions";

type EditIdeaFormProps = {
  idea: AdminIdea;
};

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

export function EditIdeaForm({ idea }: EditIdeaFormProps) {
  const [title, setTitle] = useState(idea.title);
  const [state, formAction] = useActionState(
    updateTradingIdeaAction,
    initialTradingIdeaActionState
  );

  function fieldError(name: string) {
    return state.fieldErrors?.[name];
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-6">
        <input name="id" type="hidden" value={idea.id} />

        {state.status === "error" && state.message ? (
          <AuthNotice message={state.message} tone="error" />
        ) : null}
        {state.status === "idle" && state.message ? (
          <AuthNotice message={state.message} tone="success" />
        ) : null}

        <AdminFormSection
          description="Update the identifying fields, classification, access level, and current research status."
          title="Core details"
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminTextInput
              defaultValue={idea.title}
              error={fieldError("title")}
              id="title"
              label="Title"
              name="title"
              onChange={(event) => setTitle(event.currentTarget.value)}
              required
            />
            <AdminTextInput
              defaultValue={idea.slug}
              error={fieldError("slug")}
              id="slug"
              label="Slug"
              name="slug"
              required
            />
          </div>

          <SlugFieldHelper currentSlug={idea.slug} title={title} />

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <AdminTextInput
              defaultValue={idea.ticker}
              error={fieldError("ticker")}
              id="ticker"
              label="Ticker"
              maxLength={20}
              name="ticker"
              required
            />
            <AssetClassSelect
              defaultValue={idea.asset_class}
              error={fieldError("asset_class")}
              name="asset_class"
              required
            />
            <IdeaBiasSelect
              defaultValue={idea.bias}
              error={fieldError("bias")}
              name="bias"
              required
            />
            <IdeaStatusSelect
              defaultValue={idea.status}
              error={fieldError("status")}
              name="status"
              required
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <VisibilitySelect
              defaultValue={idea.visibility}
              error={fieldError("visibility")}
              name="visibility"
              required
            />
            <RiskLevelSelect
              defaultValue={idea.risk_level}
              error={fieldError("risk_level")}
              name="risk_level"
              required
            />
            <AdminTextInput
              defaultValue={idea.timeframe ?? ""}
              id="timeframe"
              label="Timeframe"
              name="timeframe"
            />
            <AdminTextInput
              defaultValue={idea.setup_type ?? ""}
              id="setup_type"
              label="Setup type"
              name="setup_type"
            />
          </div>
        </AdminFormSection>

        <AdminFormSection
          description="Keep public preview copy safe for premium and pro ideas. Do not include exact entries, invalidation, targets, or full thesis details."
          title="Research preview and thesis"
        >
          <AdminTextarea
            defaultValue={idea.public_preview ?? ""}
            description="Required for premium/pro content."
            error={fieldError("public_preview")}
            id="public_preview"
            label="Public preview"
            name="public_preview"
          />
          <AdminTextarea
            defaultValue={idea.summary ?? ""}
            id="summary"
            label="Summary"
            name="summary"
          />
          <AdminTextarea
            defaultValue={idea.thesis ?? ""}
            id="thesis"
            label="Thesis"
            name="thesis"
          />
        </AdminFormSection>

        <AdminFormSection
          description="Full-content levels are protected by RLS for locked premium/pro ideas."
          title="Levels and risk"
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminTextInput
              defaultValue={idea.entry_zone ?? ""}
              id="entry_zone"
              label="Entry zone"
              name="entry_zone"
            />
            <AdminTextInput
              defaultValue={idea.invalidation_level ?? ""}
              id="invalidation_level"
              label="Invalidation level"
              name="invalidation_level"
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <AdminTextInput
              defaultValue={idea.target_1 ?? ""}
              id="target_1"
              label="Target 1"
              name="target_1"
            />
            <AdminTextInput
              defaultValue={idea.target_2 ?? ""}
              id="target_2"
              label="Target 2"
              name="target_2"
            />
            <AdminTextInput
              defaultValue={idea.target_3 ?? ""}
              id="target_3"
              label="Target 3"
              name="target_3"
            />
          </div>
          <AdminTextarea
            defaultValue={idea.position_disclosure ?? ""}
            id="position_disclosure"
            label="Position disclosure"
            name="position_disclosure"
          />
          <AdminTextarea
            defaultValue={idea.risk_disclosure ?? ""}
            id="risk_disclosure"
            label="Risk disclosure"
            name="risk_disclosure"
          />
        </AdminFormSection>

        <AdminFormSection
          description="Unpublishing clears the publish timestamp so the record returns to a clean draft state."
          title="Publishing"
        >
          <AdminCheckbox
            defaultChecked={idea.published}
            description="When checked, the idea is visible according to its access level."
            id="published"
            label="Published"
            name="published"
          />
          <AdminTextInput
            defaultValue={toDateTimeLocalValue(idea.published_at)}
            description="Optional. If publishing with no date, the current time is used."
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
            Back to Ideas
          </Link>
          <EditIdeaSubmitButton />
        </div>
      </form>

      <CardShell padding="lg" tone="subtle">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Publishing and removal
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Use these actions when you do not need to edit the rest of the
              idea. Deleting relies on database cascades for updates, charts,
              and tag links.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <form
              action={
                idea.published
                  ? unpublishTradingIdeaAction
                  : publishTradingIdeaAction
              }
            >
              <input name="id" type="hidden" value={idea.id} />
              <PublishToggleButton published={idea.published} title={idea.title} />
            </form>
            <form action={deleteTradingIdeaAction}>
              <input name="id" type="hidden" value={idea.id} />
              <DeleteButton title={idea.title} />
            </form>
          </div>
        </div>
      </CardShell>
    </div>
  );
}

function EditIdeaSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant: "default" }))}
      disabled={pending}
      name="intent"
      type="submit"
      value="save"
    >
      {pending ? "Saving..." : "Save Changes"}
    </button>
  );
}

function PublishToggleButton({
  published,
  title,
}: {
  published: boolean;
  title: string;
}) {
  const { pending } = useFormStatus();
  const label = published ? "Unpublish" : "Publish";

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
      disabled={pending}
      onClick={(event) => {
        const message = published
          ? `Unpublish "${title}"? This clears the publish timestamp and removes it from public/member content pages.`
          : `Publish "${title}"? It will appear according to its access level.`;

        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? "Working..." : label}
    </button>
  );
}

function DeleteButton({ title }: { title: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg", variant: "destructive" }))}
      disabled={pending}
      onClick={(event) => {
        if (
          !window.confirm(
            `Delete "${title}"? This removes the idea and cascades related updates, charts, and tag links. This cannot be undone.`
          )
        ) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      <Trash2 data-icon="inline-start" />
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
