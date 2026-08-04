import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getCommerceSiteUrl, getPortalSiteUrl, isCommerceHostname } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const requestHost = headers().get("x-forwarded-host") || headers().get("host");
  const commerceRequest = isCommerceHostname(requestHost);
  const siteUrl = commerceRequest ? getCommerceSiteUrl() : getPortalSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: commerceRequest
        ? ["/admin", "/api", "/crm", "/limpezavideo", "/noticias", "/curso-saas", "/curso-fundamentos-ia"]
        : ["/admin", "/api", "/crm", "/limpezavideo"],
    },
    sitemap: commerceRequest ? `${siteUrl}/sitemap.xml` : [`${siteUrl}/sitemap.xml`, `${siteUrl}/noticias/sitemap.xml`],
    host: siteUrl,
  };
}
