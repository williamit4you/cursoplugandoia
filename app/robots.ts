import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plugandoia.cloud";

  return {
    rules: {
      userAgent: "*",
      allow: ["/noticias", "/noticias/"],
      disallow: ["/admin", "/api", "/_next"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
