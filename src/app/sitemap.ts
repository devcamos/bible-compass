import type { MetadataRoute } from "next";
import { TOPIC_SLUGS } from "@/content";
import { CONCEPT_SLUGS } from "@/content/concepts";
import { getSiteUrl, isPreviewDeployment } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (isPreviewDeployment()) {
    return [];
  }

  const origin = getSiteUrl();
  const lastModified = new Date();
  const paths = ["/", "/how-to-use", "/concepts", ...TOPIC_SLUGS.map((slug) => `/topics/${slug}`), ...CONCEPT_SLUGS.map((slug) => `/concepts/${slug}`)];

  return paths.map((path) => ({
    url: `${origin}${path}`,
    lastModified,
  }));
}
