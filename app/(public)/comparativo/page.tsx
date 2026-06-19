import { prisma } from "@/lib/prisma";
import PublicComparisonList from "@/components/comparisons/PublicComparisonList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Comparativos de produtos | Portal IA",
  description: "Guias comparativos com foco em SEO e links afiliados para conferir os produtos analisados.",
};

export default async function ComparisonListPage() {
  const items = await prisma.affiliateComparison.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return <PublicComparisonList items={items} />;
}
