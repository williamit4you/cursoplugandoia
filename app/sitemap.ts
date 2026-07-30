import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { STORE_ARTICLE_TOPICS } from "@/lib/affiliateSeoContent";
import { PRODUCT_SEO_ARTICLES } from "@/lib/productSeoArticles";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plugandoia.cloud";
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/noticias`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/ofertas`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/lojas`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/produtos`, changeFrequency: "weekly", priority: 0.9 },
  ];

  try {
    const [posts, stores] = await Promise.all([
      prisma.post.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.affiliateStore.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const activeStoreSlugs = new Set(stores.map((store) => store.slug));
    return [
      ...staticPages,
      ...posts.map((post) => ({
        url: `${siteUrl}/noticias/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
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
    ];
  } catch (error) {
    console.warn("sitemap fallback: unable to load dynamic content", error);
    return staticPages;
  }
}
