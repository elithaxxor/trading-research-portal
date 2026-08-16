import { NextResponse } from "next/server";

import { canAccessPineScriptLibrary, getCurrentSoftwareAccessTier } from "@/lib/software/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const access = await getCurrentSoftwareAccessTier();

  if (!access.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!canAccessPineScriptLibrary(access.userTier, access.isAdmin)) {
    return NextResponse.json({ error: "Premium or Pro access required." }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: product, error } = await supabase
    .from("software_products")
    .select("download_file_name,download_storage_path,member_download_enabled,software_type")
    .eq("id", id)
    .eq("published", true)
    .eq("software_type", "pinescript")
    .maybeSingle();

  if (error || !product || !product.member_download_enabled || !product.download_storage_path) {
    return NextResponse.json({ error: "Download is not available." }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error: signedUrlError } = await admin.storage
    .from("pinescript-files")
    .createSignedUrl(product.download_storage_path, 60, {
      download: product.download_file_name ?? "pinescript.pine",
    });

  if (signedUrlError || !data?.signedUrl) {
    return NextResponse.json({ error: "Unable to prepare the download." }, { status: 503 });
  }

  return NextResponse.redirect(data.signedUrl, 303);
}

