import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { PetSeoArticle } from "@/lib/pet-seo/agents";
import { PetContentArticle } from "@/components/pet-seo/PetContentArticle";
import { publishPetContent, queuePetContent, unpublishPetContent } from "../actions";

export const dynamic = "force-dynamic";

function parse<T>(value: string | null | undefined, fallback: T): T { try { return JSON.parse(value || "") as T; } catch { return fallback; } }

export default async function PetSeoReviewPage({ params }: { params: { id: string } }) {
  const page = await prisma.petContentPage.findUnique({ where: { id: params.id }, include: { location: { include: { units: true } } } });
  if (!page) notFound();
  const article = parse<PetSeoArticle | null>(page.contentJson, null);
  const review = parse<Record<string, unknown>>(page.reviewJson, {});
  return <main className="p-5 sm:p-8"><Link href="/admin/seo-pet-cobasi" className="text-sm font-black text-emerald-700">← Voltar para SEO Pet</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-black uppercase text-emerald-700">{page.type} • {page.status}</div><h1 className="mt-2 text-3xl font-black">{page.title}</h1><p className="mt-2 text-sm text-slate-500">/{page.path} • nota {page.qualityScore ?? "—"}</p></div><div className="flex gap-2">{["DRAFT", "FAILED", "STALE"].includes(page.status) ? <form action={queuePetContent}><input type="hidden" name="pageId" value={page.id} /><button className="rounded-lg border px-4 py-3 font-black">Colocar na fila</button></form> : null}{page.status === "REVIEW" ? <form action={publishPetContent}><input type="hidden" name="pageId" value={page.id} /><button className="rounded-lg bg-emerald-600 px-4 py-3 font-black text-white">Aprovar e publicar</button></form> : null}{page.status === "PUBLISHED" ? <form action={unpublishPetContent}><input type="hidden" name="pageId" value={page.id} /><button className="rounded-lg border border-red-200 px-4 py-3 font-black text-red-700">Despublicar</button></form> : null}</div></div><section className="mt-7 rounded-2xl border bg-white p-5"><h2 className="font-black">SEO e revisão</h2><dl className="mt-4 grid gap-3 md:grid-cols-2"><div><dt className="text-xs font-bold uppercase text-slate-500">Title</dt><dd className="mt-1">{page.seoTitle || "—"}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Meta description</dt><dd className="mt-1">{page.metaDescription || "—"}</dd></div></dl><pre className="mt-5 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(review, null, 2)}</pre></section>{article ? <article className="mt-7 rounded-2xl border bg-[#f8faf7] p-5 sm:p-8"><div className="text-xs font-black uppercase text-emerald-700">Prévia editorial</div><h1 className="mt-2 font-serif text-4xl font-black">{page.title}</h1><PetContentArticle article={article} path={page.path} localUnits={page.location?.units || []} /></article> : <div className="mt-7 rounded-2xl border bg-white p-8 text-slate-500">A pauta ainda não foi produzida.</div>}</main>;
}

