import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ComparisonAdminDetailView from "@/components/comparisons/ComparisonAdminDetailView";

export const dynamic = "force-dynamic";

export default async function ComparisonDetailPage({ params }: { params: { id: string } }) {
  const item = await prisma.affiliateComparison.findUnique({
    where: { id: params.id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      steps: { orderBy: { updatedAt: "desc" } },
      events: { orderBy: { createdAt: "desc" }, take: 200 },
    },
  });

  if (!item) notFound();
  return <ComparisonAdminDetailView initialItem={item as any} />;
}
