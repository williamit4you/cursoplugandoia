import Link from "next/link";
import { safeJsonParse } from "@/lib/comparisons/utils";

export default function PublicComparisonArticle({ item }: { item: any }) {
  const faq = safeJsonParse<Array<{ question: string; answer: string }>>(item.faqJson, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr),320px]">
        <article className="min-w-0">
          <nav className="mb-5 text-sm font-semibold text-slate-500">
            <Link href="/comparativo" className="hover:text-amber-700">
              Comparativos
            </Link>
            <span className="mx-2">/</span>
            <span>{item.title}</span>
          </nav>

          <header className="rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(135deg,#fff7ed,white_52%,#fde68a)] p-8 shadow-[0_20px_60px_rgba(120,53,15,0.08)]">
            <div className="text-xs font-black uppercase tracking-[0.28em] text-amber-700">Guia de compra</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">{item.heroTitle || item.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{item.heroSubtitle || item.introSummary}</p>
            <div className="mt-5 text-sm font-semibold text-slate-500">
              Publicado em {new Date(item.publishedAt || item.createdAt).toLocaleDateString("pt-BR")} • {item.validSourceCount} produtos analisados
            </div>
          </header>

          <div
            className="prose prose-slate mt-8 max-w-none prose-headings:scroll-mt-24 prose-a:text-amber-700 prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: item.contentHtml }}
          />

          {faq.length > 0 && (
            <section className="mt-10 rounded-[1.75rem] border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Perguntas frequentes</h2>
              <div className="mt-5 space-y-4">
                {faq.map((entry, index) => (
                  <div key={`${entry.question}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-lg font-black text-slate-900">{entry.question}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{entry.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="space-y-5">
          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Onde comprar</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Links dos produtos</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Alguns links podem gerar comissao de afiliado sem custo adicional para voce.
            </p>
            <div className="mt-5 space-y-3">
              {item.items.map((product: any, index: number) => (
                <a
                  key={product.id}
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  className="block rounded-2xl border border-slate-200 p-4 transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{index + 1}. {product.storeName || product.sourceDomain}</div>
                  <div className="mt-2 text-sm font-black text-slate-800">{product.productTitle || `Produto ${index + 1}`}</div>
                  <div className="mt-1 text-xs font-semibold text-amber-700">{product.priceText || "Verificar preco"}</div>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
