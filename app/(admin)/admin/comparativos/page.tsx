import { prisma } from "@/lib/prisma";
import ComparisonsAdminView from "@/components/comparisons/ComparisonsAdminView";

export const dynamic = "force-dynamic";

export default async function ComparisonsPage() {
  const items = await prisma.affiliateComparison.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, status: true, productTitle: true, storeName: true, sourceUrl: true },
      },
      steps: {
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
    },
  });

  return <ComparisonsAdminView initialItems={items as any} />;
}
