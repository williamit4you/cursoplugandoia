import { prisma } from "@/lib/prisma";
import PublicComparisonList from "@/components/comparisons/PublicComparisonList";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Comparativos de produtos | Compra Esperta",
  description: "Guias comparativos com informações práticas para conferir e comparar os produtos analisados.",
  alternates: { canonical: `${getCommerceSiteUrl()}/comparativo` },
};

export default async function ComparisonListPage() {
  const items = await prisma.affiliateComparison.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return <PublicComparisonList items={items} />;
}
