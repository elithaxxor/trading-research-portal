import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { updateSoftwareAccessRequestAction } from "@/app/admin/software/request-actions";
import { AuthNotice } from "@/components/auth-notice";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSoftwareRequestStatusButton } from "@/components/admin/AdminSoftwareRequestStatusButton";
import { Badge } from "@/components/badge";
import { CardShell } from "@/components/card-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/admin";
import {
  formatSoftwareAccessStatus,
  formatSoftwareAccessTier,
  formatSoftwareDeliveryType,
  formatSoftwareType,
} from "@/lib/software/format";
import { listAdminSoftwareAccessRequests } from "@/lib/software/requests";
import type { SoftwareAccessRequestStatus } from "@/lib/software/types";
import { softwareAccessRequestStatusValues } from "@/lib/software/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Software Requests",
};

export const dynamic = "force-dynamic";

type AdminSoftwareRequestsPageProps = {
  searchParams?: Promise<{
    notice?: string | string[];
    status?: string | string[];
  }>;
};

function getFirstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value?: string | string[]) {
  const firstValue = getFirstParam(value);

  return firstValue &&
    softwareAccessRequestStatusValues.includes(
      firstValue as SoftwareAccessRequestStatus
    )
    ? (firstValue as SoftwareAccessRequestStatus)
    : undefined;
}

function parseNotice(value?: string | string[]) {
  return getFirstParam(value) === "updated"
    ? "Software access request updated."
    : null;
}

export default async function AdminSoftwareRequestsPage({
  searchParams,
}: AdminSoftwareRequestsPageProps) {
  await requireAdmin("/admin/software/requests");

  const params = await searchParams;
  const status = parseStatus(params?.status);
  const notice = parseNotice(params?.notice);
  const allRequests = await listAdminSoftwareAccessRequests();
  const requests = status
    ? allRequests.filter((request) => request.status === status)
    : allRequests;
  const profilesById = await getRequestProfiles(
    requests.map((request) => request.user_id)
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        actions={
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
            href="/admin/software"
          >
            Software Products
          </Link>
        }
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/software", label: "Software" },
          { label: "Requests" },
        ]}
        description="Review manual software access requests. Updating a request status does not automatically grant TradingView script access."
        eyebrow="Software"
        title="Software access requests"
      />

      <AuthNotice
        message="Grant TradingView invite-only access manually in TradingView, then mark this request as granted."
        tone="info"
      />

      <CardShell padding="md" tone="subtle">
        <form
          action="/admin/software/requests"
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          method="get"
        >
          <label className="relative">
            <span className="sr-only">Filter request status</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <select
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              defaultValue={status ?? ""}
              name="status"
            >
              <option value="">All statuses</option>
              {softwareAccessRequestStatusValues.map((value) => (
                <option key={value} value={value}>
                  {formatSoftwareAccessStatus(value)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              className={cn(buttonVariants({ size: "lg", variant: "default" }))}
              type="submit"
            >
              Apply
            </button>
            <Link
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
              href="/admin/software/requests"
            >
              Clear
            </Link>
          </div>
        </form>
      </CardShell>

      {notice ? <AuthNotice message={notice} tone="success" /> : null}

      <CardShell padding="none" tone="elevated">
        {requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[74rem] text-left text-sm">
              <thead className="border-b border-border bg-secondary/35 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Member</th>
                  <th className="px-4 py-3 font-medium">Software</th>
                  <th className="px-4 py-3 font-medium">Request</th>
                  <th className="px-4 py-3 font-medium">Admin action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((request) => {
                  const product = request.software_products;
                  const profile = profilesById.get(request.user_id);

                  return (
                    <tr className="align-top" key={request.id}>
                      <td className="px-4 py-4">
                        <div className="flex min-w-52 flex-col gap-1">
                          <span className="font-medium text-foreground">
                            {profile?.email ?? "Email unavailable"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {request.user_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-64 flex-col gap-2">
                          <h2 className="font-semibold text-foreground">
                            {product?.title ?? "Software unavailable"}
                          </h2>
                          {product ? (
                            <div className="flex flex-wrap gap-2">
                              <Badge tone="gold">
                                {formatSoftwareAccessTier(product.access_tier)}
                              </Badge>
                              <Badge tone="muted">
                                {formatSoftwareType(product.software_type)}
                              </Badge>
                              <Badge tone="muted">
                                {formatSoftwareDeliveryType(product.delivery_type)}
                              </Badge>
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="grid min-w-80 gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="gold">
                              {formatSoftwareAccessStatus(request.status)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Requested {formatDateTime(request.requested_at)}
                            </span>
                          </div>
                          <RequestDetail
                            label="TradingView username"
                            value={request.tradingview_username}
                          />
                          <RequestDetail label="User note" value={request.user_note} />
                          <RequestDetail label="Admin note" value={request.admin_note} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <form
                          action={updateSoftwareAccessRequestAction}
                          className="grid min-w-72 gap-3"
                        >
                          <input
                            name="request_id"
                            type="hidden"
                            value={request.id}
                          />
                          <label className="grid gap-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                              Admin note
                            </span>
                            <textarea
                              className="min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                              defaultValue={request.admin_note ?? ""}
                              maxLength={4000}
                              name="admin_note"
                              placeholder="Manual access notes."
                            />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {softwareAccessRequestStatusValues
                              .filter((value) => value !== "requested")
                              .map((value) => (
                                <AdminSoftwareRequestStatusButton
                                  destructive={
                                    value === "rejected" || value === "revoked"
                                  }
                                  key={value}
                                  label={`Mark ${formatSoftwareAccessStatus(value)}`}
                                  value={value}
                                />
                              ))}
                          </div>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <AdminEmptyState
              description="No software access requests match the current filter."
              title="No access requests found"
            />
          </div>
        )}
      </CardShell>
    </div>
  );
}

async function getRequestProfiles(userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));

  if (uniqueIds.length === 0) {
    return new Map<string, { email: string | null }>();
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,email")
    .in("id", uniqueIds);

  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

function RequestDetail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">
        {value ?? "Not provided"}
      </p>
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
