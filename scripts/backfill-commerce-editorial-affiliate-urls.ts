import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { resolveAffiliateStoreDestination } from "@/lib/affiliateStores";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL nao configurada");

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const products = await prisma.productCatalog.findMany({
      where: {
        affiliateStoreId: { not: null },
        productUrl: { not: null },
        affiliateStore: { status: "ACTIVE" },
      },
      select: {
        id: true,
        productUrl: true,
        affiliateUrl: true,
        affiliateStore: {
          select: {
            affiliateUrl: true,
          },
        },
      },
    });

    let updated = 0;

    for (const product of products) {
      const productUrl = String(product.productUrl || "").trim();
      const storeAffiliateUrl = String(product.affiliateStore?.affiliateUrl || "").trim();
      if (!productUrl || !storeAffiliateUrl) continue;

      const resolvedAffiliateUrl = resolveAffiliateStoreDestination(storeAffiliateUrl, productUrl).toString();
      if (resolvedAffiliateUrl === String(product.affiliateUrl || "").trim()) continue;

      await prisma.productCatalog.update({
        where: { id: product.id },
        data: { affiliateUrl: resolvedAffiliateUrl },
      });
      updated += 1;
    }

    console.log(JSON.stringify({ scanned: products.length, updated }, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
