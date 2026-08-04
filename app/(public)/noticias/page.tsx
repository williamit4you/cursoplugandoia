import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import ClientNoticiasList from "./ClientNoticiasList";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

export const dynamic = "force-dynamic";

export default async function NoticiasList({
  searchParams,
}: {
  searchParams: { q?: string; categoria?: string; page?: string };
}) {
  const q = String(searchParams.q || "").trim();
  const category = String(searchParams.categoria || "").trim();
  const page = Math.max(1, Number.parseInt(String(searchParams.page || "1"), 10) || 1);
  const pageSize = 12;
  const where = {
    status: "PUBLISHED",
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { summary: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(category ? { categories: { some: { category: { slug: category } } } } : {}),
  };

  const [posts, categories, total, trendingPosts, sponsoredProducts] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      include: { categories: { include: { category: true }, orderBy: { category: { sortOrder: "asc" } } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.newsCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.post.count({ where }),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
      take: 6,
      include: { categories: { include: { category: true }, orderBy: { category: { sortOrder: "asc" } } } },
    }),
    prisma.productCatalog.findMany({
      where: {
        status: "ACTIVE",
        affiliateUrl: { not: null },
        imageUrl: { not: null },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 5,
      include: {
        affiliateStore: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  return (
    <ClientNoticiasList
      posts={posts}
      categories={categories}
      query={{ q, category, page }}
      total={total}
      pageSize={pageSize}
      trendingPosts={trendingPosts}
      sponsoredProducts={sponsoredProducts}
    />
  );
}
