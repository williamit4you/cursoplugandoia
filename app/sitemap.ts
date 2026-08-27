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
        { url: `${siteUrl}/curso-completo`, changeFrequency: "weekly", priority: 0.9 },
        { url: `${siteUrl}/curso-programacao`, changeFrequency: "weekly", priority: 0.9 },
        { url: `${siteUrl}/guia-programacao/aprender-programacao-do-zero`, changeFrequency: "monthly", priority: 0.8 },
        { url: `${siteUrl}/guia-programacao/logica-de-programacao`, changeFrequency: "monthly", priority: 0.8 },
        { url: `${siteUrl}/guia-programacao/csharp-para-iniciantes`, changeFrequency: "monthly", priority: 0.8 },
        { url: `${siteUrl}/guia-programacao/curso-backend-para-iniciantes`, changeFrequency: "monthly", priority: 0.8 },
        { url: `${siteUrl}/guia-programacao/o-que-e-backend`, changeFrequency: "monthly", priority: 0.75 },
        { url: `${siteUrl}/guia-programacao/frontend-ou-backend`, changeFrequency: "monthly", priority: 0.75 },
        { url: `${siteUrl}/guia-programacao/primeiros-projetos-de-programacao`, changeFrequency: "monthly", priority: 0.78 },
        { url: `${siteUrl}/guia-programacao/como-estudar-programacao`, changeFrequency: "monthly", priority: 0.78 },
        { url: `${siteUrl}/guia-programacao/csharp-ou-python-para-iniciantes`, changeFrequency: "monthly", priority: 0.75 },
        { url: `${siteUrl}/guia-programacao/banco-de-dados-para-iniciantes`, changeFrequency: "monthly", priority: 0.75 },
        { url: `${siteUrl}/guia-programacao/api-rest-para-iniciantes`, changeFrequency: "monthly", priority: 0.78 },
        { url: `${siteUrl}/guia-programacao/roadmap-desenvolvedor-iniciante`, changeFrequency: "monthly", priority: 0.8 },
        { url: `${siteUrl}/guia-programacao/quanto-tempo-para-aprender-programacao`, changeFrequency: "monthly", priority: 0.72 },
        { url: `${siteUrl}/curso-fundamentos-ia`, changeFrequency: "monthly", priority: 0.8 },
        { url: `${siteUrl}/noticias`, changeFrequency: "daily", priority: 0.9 },
        { url: `${siteUrl}/solucoes-ia`, changeFrequency: "monthly", priority: 0.7 },
      ];

  try {
    if (!commerceRequest) {
      return staticPages;
    }

    const [stores, comparisons, editorialArticles, bioCategories, bioProducts, petPages] = await Promise.all([
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
      prisma.petContentPage.findMany({
        where: { status: "PUBLISHED", indexable: true, publishedAt: { not: null }, contentJson: { not: null }, affiliateStore: { slug: "cobasi", status: "ACTIVE" } },
        select: { path: true, type: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
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
      ...petPages.map((page) => ({
        url: `${siteUrl}/${page.path}`,
        lastModified: page.updatedAt,
        changeFrequency: page.type === "LOCAL" ? "weekly" as const : "monthly" as const,
        priority: page.type === "HUB" ? 0.9 : page.type === "CATEGORY" ? 0.85 : 0.78,
      })),
    ];
  } catch (error) {
    console.warn("sitemap fallback: unable to load dynamic content", error);
    return staticPages;
  }
}
