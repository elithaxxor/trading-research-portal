import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuthNotice } from "@/components/auth-notice";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminSoftwareProductById } from "@/lib/software/products";

import { SoftwareProductForm } from "../../software-form";

type EditSoftwareProductPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    notice?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Edit Admin Software",
};

export const dynamic = "force-dynamic";

export default async function EditSoftwareProductPage({
  params,
  searchParams,
}: EditSoftwareProductPageProps) {
  await requireAdmin("/admin/software");
  const { id } = await params;
  const search = await searchParams;
  const product = await getAdminSoftwareProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        breadcrumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/software", label: "Software" },
          { label: "Edit" },
        ]}
        description="Edit software metadata, documentation, access tier, and publishing state."
        eyebrow="Software"
        title={product.title}
      />
      {parseNotice(search?.notice) ? (
        <AuthNotice message={parseNotice(search?.notice)!} tone="success" />
      ) : null}
      <SoftwareProductForm mode="edit" product={product} />
    </div>
  );
}

function parseNotice(value?: string | string[]) {
  const firstValue = Array.isArray(value) ? value[0] : value;

  if (firstValue === "created") {
    return "Software product created. Review publishing and access settings before sharing it with members.";
  }

  return null;
}
