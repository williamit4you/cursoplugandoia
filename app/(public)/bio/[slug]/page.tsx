import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import BioCtaButton from "./BioCtaButton";

export const dynamic = "force-dynamic";

export default async function BioProductPage({ params }: { params: { slug: string } }) {
  const slug = String(params.slug || "").trim();
  const product = await prisma.bioProduct.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product || !product.active) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/bio" className="text-sm text-slate-400 hover:text-slate-200">
        ← Voltar
      </Link>

      <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs text-slate-400">{product.category?.name || "Produto"}</div>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-100">{product.title}</h1>

        {product.videoUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl bg-black">
            <video src={product.videoUrl} controls playsInline className="w-full" />
          </div>
        ) : product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.title} className="mt-4 w-full rounded-2xl object-cover" />
        ) : null}

        <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-200">{product.description}</div>

        <div className="mt-6">
          <BioCtaButton slug={product.slug} href={product.affiliateUrl} />
          <div className="mt-2 text-xs text-slate-500">Você será redirecionado para a Shopee.</div>
        </div>
      </div>
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-400">
        <div>© {new Date().getFullYear()} PlugandoIA</div>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-slate-200">
            Termos
          </Link>
          <Link href="/privacy" className="hover:text-slate-200">
            Privacidade
          </Link>
        </div>
      </footer>
    </main>
  );
}
