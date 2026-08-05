import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { SUGGESTED_NEWS_SCRAPING_SOURCES } from "@/lib/newsScrapingSources";

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const urls = SUGGESTED_NEWS_SCRAPING_SOURCES.map((item) => item.url);
    const existing = await prisma.scrapingSource.findMany({
      where: { url: { in: urls } },
      select: { url: true },
    });

    const existingUrls = new Set(existing.map((item) => item.url));
    const pendingSources = SUGGESTED_NEWS_SCRAPING_SOURCES.filter(
      (item) => !existingUrls.has(item.url),
    ).map((item) => ({
      name: item.name,
      url: item.url,
      isActive: true,
    }));

    if (pendingSources.length > 0) {
      await prisma.scrapingSource.createMany({
        data: pendingSources,
        skipDuplicates: true,
      });
    }

    console.log(
      JSON.stringify(
        {
          totalPreset: SUGGESTED_NEWS_SCRAPING_SOURCES.length,
          inserted: pendingSources.length,
          skipped: existingUrls.size,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
