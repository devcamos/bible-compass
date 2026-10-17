import type { MetadataRoute } from "next";
import { TOPIC_SLUGS } from "@/content";
import { CONCEPT_SLUGS } from "@/content/concepts";
import { PROVERBS_CATEGORIES, PROVERBS_VERSES } from "@/content/proverbs";
import { getSiteUrl, isPreviewDeployment } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (isPreviewDeployment()) {
    return [];
  }

  const origin = getSiteUrl();
  const lastModified = new Date();
  const paths = ["/", "/how-to-use", "/concepts", "/proverbs", ...TOPIC_SLUGS.map((slug) => `/topics/${slug}`), ...CONCEPT_SLUGS.map((slug) => `/concepts/${slug}`), ...PROVERBS_CATEGORIES.map(({ slug }) => `/proverbs/${slug}`), ...PROVERBS_VERSES.map(({ id }) => `/proverbs/verses/${id}`)];

  return paths.map((path) => ({
    url: `${origin}${path}`,
    lastModified,
  }));
}
