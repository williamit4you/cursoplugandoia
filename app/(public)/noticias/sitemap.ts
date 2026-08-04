import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getPortalSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getPortalSiteUrl();
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return posts.map((post) => ({
    url: `${siteUrl}/noticias/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));
}
