import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import ScrapersTable from "@/components/ScrapersTable"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export const dynamic = "force-dynamic"

export default async function ScrapersPage() {
  const scrapers = await prisma.scrapingSource.findMany()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Fontes (Scraping)</h1>
      <ScrapersTable initialData={scrapers} />
    </div>
  )
}
