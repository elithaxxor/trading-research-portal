import packageJson from "../../../../package.json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return Response.json({
    app: "Trading Research Portal",
    status: "ok",
    timestamp: new Date().toISOString(),
    version: packageJson.version,
  });
}
