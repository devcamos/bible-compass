import type { MetadataRoute } from "next";
import { TOPIC_SLUGS } from "@/content";
import { CONCEPT_SLUGS } from "@/content/concepts";
import { PROVERBS_CATEGORIES, PROVERBS_VERSES } from "@/content/proverbs";
import { PSALMS_CATEGORIES, PSALMS_VERSES } from "@/content/psalms";
import { REVELATION_CATEGORIES, REVELATION_PASSAGES, revelationPassageUrl } from "@/content/revelation";
import { getSiteUrl, isPreviewDeployment } from "@/lib/site";
import { GIFTS_READING_PAGES } from "@/content/gifts";

export default function sitemap(): MetadataRoute.Sitemap {
  if (isPreviewDeployment()) {
    return [];
  }

  const origin = getSiteUrl();
  const lastModified = new Date();
  const paths = [
    "/", "/how-to-use", "/concepts", "/proverbs", "/psalms", "/revelation",
    ...TOPIC_SLUGS.map((slug) => `/topics/${slug}`),
    ...CONCEPT_SLUGS.map((slug) => `/concepts/${slug}`),
    ...PROVERBS_CATEGORIES.map(({ slug }) => `/proverbs/${slug}`),
    ...PROVERBS_VERSES.map(({ id }) => `/proverbs/verses/${id}`),
    ...PSALMS_CATEGORIES.map(({ slug }) => `/psalms/${slug}`),
    ...PSALMS_VERSES.flatMap(({ id, categorySlugs }) =>
      categorySlugs.map((slug) => `/psalms/${slug}/verses/${id}`)),
    ...REVELATION_CATEGORIES.map(({ slug }) => `/revelation/${slug}`),
    ...REVELATION_PASSAGES.flatMap(({ id, categorySlugs }) =>
      categorySlugs.map((slug) => revelationPassageUrl(slug, id))),
    ...GIFTS_READING_PAGES.map(({ path }) => path),
  ];

  return paths.map((path) => ({
    url: `${origin}${path}`,
    lastModified,
  }));
}
