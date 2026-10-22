export const SITE_NAME = "Bible Compass";

export const SITE_DESCRIPTION =
  "Meet Scripture with an open heart, understand it in context, and take one faithful step at a time.";

/** Default Buy Me a Coffee link for the maintainer's personal sole-trader project. */
export const DEFAULT_SUPPORT_URL = "https://buymeacoffee.com/devoamos";

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

/**
 * Optional support link (Buy Me a Coffee). Override with NEXT_PUBLIC_SUPPORT_URL.
 * Empty or whitespace env values fall back to the default personal link.
 */
export function getSupportUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SUPPORT_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return DEFAULT_SUPPORT_URL;
}

export function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}
