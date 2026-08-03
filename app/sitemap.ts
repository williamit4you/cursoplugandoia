import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCommerceSiteUrl, getPortalSiteUrl, isCommerceHostname } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHost = headers().get("x-forwarded-host") || headers().get("host");
  const commerceRequest = isCommerceHostname(requestHost);
  const siteUrl = commerceRequest ? getCommerceSiteUrl() : getPortalSiteUrl();
  const staticPages: MetadataRoute.Sitemap = commerceRequest
    ? [
        { url: siteUrl, changeFrequency: "daily", priority: 1 },
        { url: `${siteUrl}/ofertas`, changeFrequency: "daily", priority: 0.95 },
        { url: `${siteUrl}/lojas`, changeFrequency: "weekly", priority: 0.9 },
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

    const [stores, comparisons, editorialArticles, bioCategories, bioProducts] = await Promise.all([
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
      prisma.seoBrief.findMany({
        where: {
          status: "PUBLISHED",
          indexable: true,
          publishedAt: { not: null },
          contentJson: { not: null },
          product: { affiliateStore: { status: "ACTIVE" } },
        },
        select: {
          slug: true,
          updatedAt: true,
          product: { select: { affiliateStore: { select: { slug: true } } } },
        },
        orderBy: { publishedAt: "desc" },
      }),
      prisma.bioCategory.findMany({
        where: { active: true, products: { some: { active: true } } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.bioProduct.findMany({
        where: { active: true },
        select: { slug: true, updatedAt: true },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      }),
    ]);

    return [
      ...staticPages,
      ...bioCategories.map((category) => ({
        url: `${siteUrl}/bio/categoria/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.72,
      })),
      ...bioProducts.map((product) => ({
        url: `${siteUrl}/bio/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.78,
      })),
      ...stores.map((store) => ({
        url: `${siteUrl}/lojas/${store.slug}`,
        lastModified: store.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...editorialArticles.flatMap((article) => article.product.affiliateStore ? [{
        url: `${siteUrl}/lojas/${article.product.affiliateStore.slug}/artigos/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      }] : []),
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
