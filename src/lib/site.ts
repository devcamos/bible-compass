export const SITE_NAME = "Bible Compass";

export const SITE_DESCRIPTION =
  "Meet Scripture with an open heart, understand it in context, and take one faithful step at a time.";

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3003";
}

export function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}
