import type { MetadataRoute } from "next";
import { TOPIC_SLUGS } from "@/content";
import { getSiteUrl, isPreviewDeployment } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (isPreviewDeployment()) {
    return [];
  }

  const origin = getSiteUrl();
  const lastModified = new Date();
  const paths = ["/", "/how-to-use", ...TOPIC_SLUGS.map((slug) => `/topics/${slug}`)];

  return paths.map((path) => ({
    url: `${origin}${path}`,
    lastModified,
  }));
}
