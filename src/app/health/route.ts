export const dynamic = "force-static";

export function GET() {
  return Response.json({
    ok: true,
    product: "bible-compass",
    version: "0.1.0",
    surface: "preview-or-local",
  });
}
