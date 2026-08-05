import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SUGGESTED_NEWS_SCRAPING_SOURCES } from "@/lib/newsScrapingSources";

export async function GET(req: NextRequest) {
  try {
    const scrapers = await prisma.scrapingSource.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(scrapers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch scrapers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body?.mode === "seed_preset") {
      const urls = SUGGESTED_NEWS_SCRAPING_SOURCES.map((item) => item.url);
      const existing = await prisma.scrapingSource.findMany({
        where: { url: { in: urls } },
        select: { url: true },
      });
      const existingUrls = new Set(existing.map((item) => item.url));
      const createManyData = SUGGESTED_NEWS_SCRAPING_SOURCES.filter(
        (item) => !existingUrls.has(item.url),
      ).map((item) => ({
        name: item.name,
        url: item.url,
        isActive: true,
      }));

      if (createManyData.length > 0) {
        await prisma.scrapingSource.createMany({
          data: createManyData,
          skipDuplicates: true,
        });
      }

      return NextResponse.json({
        ok: true,
        inserted: createManyData.length,
        skipped: existingUrls.size,
        totalPreset: SUGGESTED_NEWS_SCRAPING_SOURCES.length,
      });
    }

    const scraper = await prisma.scrapingSource.create({
      data: {
        name: body.name,
        url: body.url,
        isActive: body.isActive ?? true
      }
    });
    return NextResponse.json(scraper, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: "URL já cadastrada." }, { status: 400 });
    return NextResponse.json({ error: "Failed to create scraper" }, { status: 500 });
  }
}
