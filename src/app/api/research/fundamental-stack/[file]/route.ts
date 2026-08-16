import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import {
  canAccessVisibility,
  getCurrentTier,
  getCurrentUser,
} from "@/lib/content/access";
import { getFundamentalResearchStackFile } from "@/lib/content/fundamental-research-stack";

type RouteContext = { params: Promise<{ file: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const tier = await getCurrentTier();

  if (!canAccessVisibility("premium", tier)) {
    return NextResponse.json(
      { error: "Premium or Pro access required." },
      { status: 403 }
    );
  }

  const { file: fileId } = await params;
  const resource = getFundamentalResearchStackFile(fileId);

  if (!resource) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "private",
      "research",
      "fundamental-research-stack",
      resource.fileName
    );
    const body = await readFile(filePath, "utf8");

    return new Response(body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${resource.downloadName}"`,
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "The research file is temporarily unavailable." },
      { status: 503 }
    );
  }
}
