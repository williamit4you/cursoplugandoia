import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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
