import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { STORE_ARTICLE_TOPICS } from "@/lib/affiliateSeoContent";
import { PRODUCT_SEO_ARTICLES } from "@/lib/productSeoArticles";
import { getCommerceSiteUrl, getPortalSiteUrl, isCommerceHostname } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHost = headers().get("x-forwarded-host") || headers().get("host");
  const commerceRequest = isCommerceHostname(requestHost);
  const siteUrl = commerceRequest ? getCommerceSiteUrl() : getPortalSiteUrl();
  const staticPages: MetadataRoute.Sitemap = commerceRequest
    ? [
        { url: siteUrl, changeFrequency: "daily", priority: 1 },
        { url: `${siteUrl}/lojas`, changeFrequency: "weekly", priority: 0.9 },
        { url: `${siteUrl}/produtos`, changeFrequency: "weekly", priority: 0.95 },
        { url: `${siteUrl}/comparativo`, changeFrequency: "weekly", priority: 0.8 },
      ]
    : [
        { url: `${siteUrl}/curso-saas`, changeFrequency: "monthly", priority: 0.9 },
        { url: `${siteUrl}/curso-fundamentos-ia`, changeFrequency: "monthly", priority: 0.8 },
        { url: `${siteUrl}/noticias`, changeFrequency: "daily", priority: 0.9 },
        { url: `${siteUrl}/solucoes-ia`, changeFrequency: "monthly", priority: 0.7 },
      ];

  try {
    if (!commerceRequest) {
      const posts = await prisma.post.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      });
      return [
        ...staticPages,
        ...posts.map((post) => ({
          url: `${siteUrl}/noticias/${post.slug}`,
          lastModified: post.updatedAt,
          changeFrequency: "daily" as const,
          priority: 0.8,
        })),
      ];
    }

    const [stores, comparisons] = await Promise.all([
      prisma.affiliateStore.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.affiliateComparison.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const activeStoreSlugs = new Set(stores.map((store) => store.slug));
    return [
      ...staticPages,
      ...stores.flatMap((store) => [
        {
          url: `${siteUrl}/lojas/${store.slug}`,
          lastModified: store.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.75,
        },
        ...STORE_ARTICLE_TOPICS.map((topic) => ({
          url: `${siteUrl}/lojas/${store.slug}/${topic.slug}`,
          lastModified: store.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.65,
        })),
      ]),
      ...PRODUCT_SEO_ARTICLES.filter((article) => activeStoreSlugs.has(article.storeSlug)).map((article) => ({
        url: `${siteUrl}/lojas/${article.storeSlug}/produtos/${article.slug}`,
        lastModified: new Date(article.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.85,
      })),
      ...comparisons.map((comparison) => ({
        url: `${siteUrl}/comparativo/${comparison.slug}`,
        lastModified: comparison.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.75,
      })),
    ];
  } catch (error) {
    console.warn("sitemap fallback: unable to load dynamic content", error);
    return staticPages;
  }
}
