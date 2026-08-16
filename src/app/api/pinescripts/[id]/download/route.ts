import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import {
  canAccessPineScriptLibrary,
  getCurrentSoftwareAccessTier,
} from "@/lib/software/access";
import { getImportedPineScript } from "@/lib/software/imported-pinescripts";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const access = await getCurrentSoftwareAccessTier();

  if (!access.user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  if (!canAccessPineScriptLibrary(access.userTier, access.isAdmin)) {
    return NextResponse.json(
      { error: "Premium or Pro access required." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const script = await getImportedPineScript(id);

  if (!script) {
    return NextResponse.json({ error: "Script not found." }, { status: 404 });
  }

  try {
    const body = await readFile(
      path.join(process.cwd(), "private", "pinescripts", script.fileName),
      "utf8"
    );

    return new Response(body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${script.downloadName}"`,
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "The script export is temporarily unavailable." },
      { status: 503 }
    );
  }
}
