import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PublicComparisonArticle from "@/components/comparisons/PublicComparisonArticle";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const item = await prisma.affiliateComparison.findUnique({
    where: { slug: params.slug },
  });

  if (!item || item.status !== "PUBLISHED") {
    return { title: "Comparativo nao encontrado" };
  }

  return {
    title: item.seoTitle || `${item.title} | Portal IA`,
    description: item.metaDescription || item.introSummary || undefined,
    alternates: { canonical: `/comparativo/${item.slug}` },
    openGraph: {
      title: item.seoTitle || item.title,
      description: item.metaDescription || item.introSummary || undefined,
      type: "article",
      url: `/comparativo/${item.slug}`,
    },
  };
}

export default async function ComparisonArticlePage({ params }: { params: { slug: string } }) {
  const item = await prisma.affiliateComparison.findUnique({
    where: { slug: params.slug },
    include: {
      items: {
        where: { status: { in: ["SCRAPED", "NORMALIZED"] as any } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!item || item.status !== "PUBLISHED") notFound();

  const visibleItems = item.items.filter((product: any) => {
    const title = String(product?.productTitle || "").trim();
    return Boolean(title) && !/^produto\s+\d+$/i.test(title);
  });

  await prisma.affiliateComparison.update({
    where: { id: item.id },
    data: { views: { increment: 1 } },
  });

  return <PublicComparisonArticle item={{ ...item, items: visibleItems }} />;
}
