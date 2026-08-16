"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

import { AuthNotice } from "@/components/auth-notice";
import { AdminCheckbox } from "@/components/admin/forms/AdminCheckbox";
import { AdminFormSection } from "@/components/admin/forms/AdminFormSection";
import { AdminSelect } from "@/components/admin/forms/AdminSelect";
import { AdminTextInput } from "@/components/admin/forms/AdminTextInput";
import { AdminTextarea } from "@/components/admin/forms/AdminTextarea";
import { SlugFieldHelper } from "@/components/admin/forms/SlugFieldHelper";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import {
  formatSoftwareAccessTier,
  formatSoftwareDeliveryType,
  formatSoftwareType,
} from "@/lib/software/format";
import type { SoftwareProduct } from "@/lib/software/types";
import {
  softwareAccessTierValues,
  softwareDeliveryTypeValues,
  softwareTypeValues,
} from "@/lib/software/validation";
import { cn } from "@/lib/utils";

import {
  createSoftwareProductAction,
  deleteSoftwareProductAction,
  publishSoftwareProductAction,
  removePineScriptFileAction,
  unpublishSoftwareProductAction,
  uploadPineScriptFileAction,
  updateSoftwareProductAction,
} from "./actions";
import type { SoftwareProductActionState } from "./actions";

const initialSoftwareProductActionState: SoftwareProductActionState = {
  status: "idle",
};

type SoftwareProductFormProps =
  | {
      mode: "create";
      product?: never;
    }
  | {
      mode: "edit";
      product: SoftwareProduct;
    };

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

export function SoftwareProductForm({ mode, product }: SoftwareProductFormProps) {
  const [softwareType, setSoftwareType] = useState(
    product?.software_type ?? "pinescript"
  );
  const [title, setTitle] = useState(product?.title ?? "");
  const [state, formAction] = useActionState(
    mode === "create" ? createSoftwareProductAction : updateSoftwareProductAction,
    initialSoftwareProductActionState
  );

  function fieldError(name: string) {
    return state.fieldErrors?.[name];
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-6">
        {product ? (
          <input name="id" type="hidden" value={product.id} />
        ) : null}

        {state.status === "error" && state.message ? (
          <AuthNotice message={state.message} tone="error" />
        ) : null}
        {state.status === "idle" && state.message ? (
          <AuthNotice message={state.message} tone="success" />
        ) : null}

        <AdminFormSection
          description="Software records describe documentation and manual access workflows. Do not store private Pine Script source code here."
          title="Core software details"
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminTextInput
              defaultValue={product?.title ?? ""}
              error={fieldError("title")}
              id="title"
              label="Title"
              name="title"
              onChange={(event) => setTitle(event.currentTarget.value)}
              placeholder="Research Toolkit Lite"
              required
            />
            <AdminTextInput
              defaultValue={product?.slug ?? ""}
              description="Use lowercase letters, numbers, and hyphens."
              error={fieldError("slug")}
              id="slug"
              label="Slug"
              name="slug"
              placeholder="research-toolkit-lite"
              required
            />
          </div>

          <SlugFieldHelper currentSlug={product?.slug} title={title} />

          <div className="grid gap-5 md:grid-cols-3">
            <AdminSelect
              defaultValue={product?.software_type ?? "pinescript"}
              error={fieldError("software_type")}
              id="software_type"
              label="Software type"
              name="software_type"
              onChange={(event) => setSoftwareType(event.currentTarget.value as SoftwareProduct["software_type"])}
              options={softwareTypeValues.map((value) => ({
                label: formatSoftwareType(value),
                value,
              }))}
              required
            />
            <AdminSelect
              defaultValue={product?.access_tier ?? "premium_lite"}
              description={
                softwareType === "tool" || softwareType === "strategy"
                  ? "Tools and strategies are always saved as Pro-only."
                  : undefined
              }
              error={fieldError("access_tier")}
              id="access_tier"
              label="Access tier"
              name="access_tier"
              options={softwareAccessTierValues.map((value) => ({
                label: formatSoftwareAccessTier(value),
                value,
              }))}
              required
            />
            <AdminSelect
              defaultValue={product?.delivery_type ?? "tradingview_invite_only"}
              error={fieldError("delivery_type")}
              id="delivery_type"
              label="Delivery type"
              name="delivery_type"
              options={softwareDeliveryTypeValues.map((value) => ({
                label: formatSoftwareDeliveryType(value),
                value,
              }))}
              required
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <AdminTextInput
              defaultValue={product?.version ?? ""}
              error={fieldError("version")}
              id="version"
              label="Version"
              name="version"
              placeholder="v1.0"
              required
            />
            <AdminTextInput
              defaultValue={product?.tradingview_script_name ?? ""}
              id="tradingview_script_name"
              label="TradingView script name"
              name="tradingview_script_name"
              placeholder="Research Toolkit Lite"
            />
          </div>
        </AdminFormSection>

        {softwareType === "pinescript" ? (
          <AdminFormSection
            description="All published Pine Scripts are included for active Premium and Pro members. Individual purchases remain unavailable until pricing and checkout are added later."
            title="Pine Script distribution"
          >
            <AdminCheckbox
              defaultChecked={product?.member_download_enabled ?? false}
              description="Allow protected member download when a private file has been uploaded."
              id="member_download_enabled"
              label="Enable Premium + Pro member download"
              name="member_download_enabled"
            />
            <AdminCheckbox
              defaultChecked={product?.individual_purchase_enabled ?? false}
              description="Show that an individual purchase option is planned. This does not add pricing, checkout, or access."
              id="individual_purchase_enabled"
              label="Show individual purchase as coming soon"
              name="individual_purchase_enabled"
            />
          </AdminFormSection>
        ) : null}

        <AdminFormSection
          description="Member pages render this content as plain text. Software tools are educational and are not trade execution."
          title="Descriptions and documentation"
        >
          <AdminTextarea
            defaultValue={product?.short_description ?? ""}
            error={fieldError("short_description")}
            id="short_description"
            label="Short description"
            name="short_description"
            placeholder="A concise member-facing summary."
            required
          />
          <AdminTextarea
            defaultValue={product?.full_description ?? ""}
            error={fieldError("full_description")}
            id="full_description"
            label="Full description"
            name="full_description"
            placeholder="Detailed overview for authorized members."
          />
          <AdminTextarea
            defaultValue={product?.documentation ?? ""}
            error={fieldError("documentation")}
            id="documentation"
            label="Documentation"
            name="documentation"
            placeholder="Plain-text documentation. Do not paste private Pine Script source code."
          />
          <AdminTextarea
            defaultValue={product?.setup_instructions ?? ""}
            error={fieldError("setup_instructions")}
            id="setup_instructions"
            label="Setup instructions"
            name="setup_instructions"
            placeholder="Manual setup and usage instructions."
          />
          <AdminTextarea
            defaultValue={product?.release_notes ?? ""}
            error={fieldError("release_notes")}
            id="release_notes"
            label="Release notes"
            name="release_notes"
            placeholder="Plain-text version notes."
          />
          <AdminTextarea
            defaultValue={product?.risk_disclosure ?? ""}
            error={fieldError("risk_disclosure")}
            id="risk_disclosure"
            label="Risk disclosure"
            name="risk_disclosure"
            placeholder="Software is educational research tooling and not financial advice."
          />
        </AdminFormSection>

        <AdminFormSection
          description="URLs must be safe http/https links. Do not use public URLs for private source code or protected downloads."
          title="Links"
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminTextInput
              defaultValue={product?.tradingview_script_url ?? ""}
              error={fieldError("tradingview_script_url")}
              id="tradingview_script_url"
              label="TradingView script URL"
              name="tradingview_script_url"
              placeholder="https://www.tradingview.com/script/..."
              type="url"
            />
            <AdminTextInput
              defaultValue={product?.external_url ?? ""}
              error={fieldError("external_url")}
              id="external_url"
              label="External URL"
              name="external_url"
              placeholder="https://example.com/docs"
              type="url"
            />
          </div>
          <AdminTextInput
            defaultValue={product?.download_url ?? ""}
            description="The portal does not provide protected file storage. Leave blank unless the URL is safe for the intended access model."
            error={fieldError("download_url")}
            id="download_url"
            label="Download URL"
            name="download_url"
            placeholder="https://example.com/protected-download"
            type="url"
          />
        </AdminFormSection>

        <AdminFormSection
          description="Publishing makes the software visible according to the Premium Lite / Pro access tier. Invite-only access is still manual."
          title="Publishing"
        >
          <AdminCheckbox
            defaultChecked={product?.published ?? false}
            id="published"
            label="Published"
            name="published"
          />
          <AdminTextInput
            defaultValue={toDateTimeLocalValue(product?.published_at)}
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
            href="/admin/software"
          >
            Back to Software
          </Link>
          {mode === "create" ? (
            <>
              <SoftwareSubmitButton intent="draft" label="Save Draft" />
              <SoftwareSubmitButton intent="publish" label="Publish" />
            </>
          ) : (
            <SoftwareSubmitButton intent="save" label="Save Changes" />
          )}
        </div>
      </form>

      {product?.software_type === "pinescript" ? (
        <PineScriptFileManager product={product} />
      ) : null}
      {product ? <SoftwareProductManagement product={product} /> : null}
    </div>
  );
}

function PineScriptFileManager({ product }: { product: SoftwareProduct }) {
  return (
    <CardShell padding="lg" tone="subtle">
      <div className="grid gap-5">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Protected Pine Script file</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Files are stored privately and delivered through short-lived signed links after a server-side Premium or Pro check.
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">
            Current file: {product.download_file_name ?? "None uploaded"}
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <form action={uploadPineScriptFileAction} className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
            <input name="id" type="hidden" value={product.id} />
            <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-foreground">
              Pine Script file (.pine or .txt, max 1 MB)
              <input
                accept=".pine,.txt,text/plain"
                className="min-h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-foreground"
                name="pinescript_file"
                required
                type="file"
              />
            </label>
            <button className={cn(buttonVariants({ variant: "outline" }))} type="submit">
              {product.download_storage_path ? "Replace file" : "Upload file"}
            </button>
          </form>
          {product.download_storage_path ? (
            <form action={removePineScriptFileAction}>
              <input name="id" type="hidden" value={product.id} />
              <button className={cn(buttonVariants({ variant: "destructive" }))} type="submit">
                Remove file
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </CardShell>
  );
}

function SoftwareSubmitButton({
  intent,
  label,
}: {
  intent: "draft" | "publish" | "save";
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

function SoftwareProductManagement({ product }: { product: SoftwareProduct }) {
  return (
    <CardShell padding="lg" tone="subtle">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Publishing and removal
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Publishing controls member visibility only. Grant TradingView
            invite-only access manually in TradingView, then mark requests as
            granted.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <form
            action={
              product.published
                ? unpublishSoftwareProductAction
                : publishSoftwareProductAction
            }
          >
            <input name="id" type="hidden" value={product.id} />
            <PublishToggleButton
              published={product.published}
              title={product.title}
            />
          </form>
          <form action={deleteSoftwareProductAction}>
            <input name="id" type="hidden" value={product.id} />
            <DeleteButton title={product.title} />
          </form>
        </div>
      </div>
    </CardShell>
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
          ? `Unpublish "${title}"? It will no longer appear in the member software library.`
          : `Publish "${title}"? It will become visible to eligible members.`;

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
            `Delete "${title}"? This removes the software product and related access requests.`
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
