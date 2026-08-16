import type { MetadataRoute } from "next";
import { getSiteUrl, isPreviewDeployment } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (isPreviewDeployment()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
