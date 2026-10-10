export const dynamic = "force-static";

export function GET() {
  return Response.json({
    ok: true,
    product: "bible-compass",
    version: "0.1.0",
    surface: process.env.VERCEL_ENV ?? "local",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
  });
}
