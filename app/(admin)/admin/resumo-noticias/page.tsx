import Link from "next/link";

import DailyNewsEditionsTable from "@/components/DailyNewsEditionsTable";
import QuickScrapeTestButton from "@/components/QuickScrapeTestButton";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewsSummaryPage() {
  const dailyNewsEdition = (prisma as any).dailyNewsEdition;
  let editions: any[] = [];
  let loadError = "";

  if (!dailyNewsEdition) {
    loadError =
      "O client do Prisma em execucao ainda nao reconhece DailyNewsEdition. Verifique deploy da migration e prisma generate no ambiente.";
  } else {
    try {
      editions = await dailyNewsEdition.findMany({
        orderBy: [{ editionDate: "desc" }, { createdAt: "desc" }],
        include: {
          codeVideoProject: {
            select: {
              id: true,
              status: true,
              videoUrl: true,
              thumbUrl: true,
              renderProgress: true,
            },
          },
          items: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              postId: true,
              position: true,
              titleSnapshot: true,
              category: true,
            },
          },
          assets: {
            select: {
              id: true,
              status: true,
              assetType: true,
            },
          },
        },
      });
    } catch (error: any) {
      loadError =
        error?.message ||
        "Falha ao carregar as edicoes de resumo de noticias.";
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-sm">
        <h1 className="text-3xl font-black tracking-tight">Resumo de Noticias</h1>
        <p className="mt-1 text-sm font-medium text-slate-300">
          Modulo dedicado do resumo de noticias com listagem padronizada, acoes em lote e detalhe operacional.
        </p>
        <div className="mt-4">
          <div className="flex flex-wrap items-start gap-3">
            <Link
              href="/admin/operations/NEWS_CONTENT"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/30 bg-indigo-400/10 px-4 py-2 text-xs font-black text-indigo-100"
            >
              Abrir analytics de Noticias
            </Link>
            <Link
              href="/admin/video-code"
              className="inline-flex items-center gap-2 rounded-xl border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-xs font-black text-violet-100"
            >
              Abrir videos de Noticias
            </Link>
            <QuickScrapeTestButton />
          </div>
        </div>
      </div>
      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          {loadError}
        </div>
      ) : null}
      <DailyNewsEditionsTable initialData={editions} />
    </div>
  );
}
