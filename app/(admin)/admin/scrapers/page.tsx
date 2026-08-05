import ScrapersTable from "@/components/ScrapersTable"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function ScrapersPage() {
  const scrapers = await prisma.scrapingSource.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Fontes de Noticias</h1>
        <p className="mt-2 text-sm text-slate-600">
          O motor de noticias consulta todas as fontes ativas cadastradas aqui e alterna entre elas nas execucoes.
        </p>
      </div>
      <ScrapersTable initialData={scrapers} />
    </div>
  )
}
