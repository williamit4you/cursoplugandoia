import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import DashboardMetrics from "@/components/DashboardMetrics"

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const postsCount = await prisma.post.count()
  const totalViews = await prisma.post.aggregate({
    _sum: { views: true }
  })
  const leadsCount = await prisma.lead.count()

  const stats = {
    posts: postsCount,
    views: totalViews._sum.views || 0,
    leads: leadsCount
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Visão Geral</h1>
      <DashboardMetrics stats={stats} />
    </div>
  )
}
