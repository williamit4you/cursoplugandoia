import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://plugandoia.cloud";
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return [
    { url: `${siteUrl}/noticias`, changeFrequency: "daily", priority: 0.9 },
    ...posts.map((post) => ({
      url: `${siteUrl}/noticias/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
