import { prisma } from "@/lib/prisma";

export async function getSalesPageConfig(pageKey: string) {
  return prisma.salesPageConfig.findUnique({
    where: { pageKey },
  });
}
