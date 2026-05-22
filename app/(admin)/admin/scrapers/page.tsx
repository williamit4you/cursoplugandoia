import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import PipelineScrapersView from "@/components/PipelineScrapersView"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export const dynamic = "force-dynamic"

export default async function ScrapersPage() {
  const scrapers = await prisma.scrapingSource.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 mb-6">Pipeline: Scrapings (ML / Shopee)</h1>
      <PipelineScrapersView initialData={scrapers} />
    </div>
  )
}
