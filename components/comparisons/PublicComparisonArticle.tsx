import Link from "next/link";
import { safeJsonParse } from "@/lib/comparisons/utils";

function isDisplayableProduct(product: any) {
  const title = String(product?.productTitle || "").trim();
  if (!title) return false;
  if (/^produto\s+\d+$/i.test(title)) return false;
  return true;
}

function normalizeArticleHtml(content: string) {
  const raw = String(content || "").trim();
  if (!raw) return "<p>Este comparativo ainda nao possui conteudo renderizavel.</p>";
  if (/<(section|h1|h2|h3|p|ul|ol|li|table|blockquote)\b/i.test(raw)) return raw;

  const blocks = raw
    .split(/\n{2,}/)
    .map((block) => block.split(/\n+/).map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0);

  return blocks
    .map((lines) => {
      if (lines.length === 1) return `<p>${lines[0]}</p>`;
      return lines.map((line) => `<p>${line}</p>`).join("");
    })
    .join("");
}

export default function PublicComparisonArticle({ item }: { item: any }) {
  const faq = safeJsonParse<Array<{ question: string; answer: string }>>(item.faqJson, []);
  const visibleProducts = (item.items || []).filter(isDisplayableProduct);
  const articleHtml = normalizeArticleHtml(item.contentHtml);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr),380px]">
        <article className="mx-auto min-w-0 w-full max-w-[860px]">
          <nav className="mb-6 text-sm font-semibold text-slate-500">
            <Link href="/comparativo" className="hover:text-amber-700">
              Comparativos
            </Link>
            <span className="mx-2">/</span>
            <span>{item.title}</span>
          </nav>

          <header className="rounded-[2rem] border border-amber-200/70 bg-[radial-gradient(circle_at_top_right,#fde68a_0%,#fff7ed_28%,white_64%)] p-8 shadow-[0_28px_80px_rgba(120,53,15,0.10)] md:p-10">
            <div className="text-xs font-black uppercase tracking-[0.28em] text-amber-700">Guia de compra</div>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
              {item.heroTitle || item.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{item.heroSubtitle || item.introSummary}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
              <span>Publicado em {new Date(item.publishedAt || item.createdAt).toLocaleDateString("pt-BR")}</span>
              <span className="rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                {visibleProducts.length} produtos confirmados
              </span>
            </div>
          </header>

          <div
            className="prose prose-lg mt-10 max-w-none rounded-[2rem] border border-slate-200/70 bg-white px-7 py-8 text-slate-800 shadow-sm prose-headings:scroll-mt-24 prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-950 prose-h2:mt-10 prose-h2:border-t prose-h2:border-slate-100 prose-h2:pt-8 prose-h2:text-3xl prose-h3:text-xl prose-p:text-[1.08rem] prose-p:leading-8 prose-p:text-slate-800 prose-li:leading-8 prose-li:text-slate-800 prose-strong:text-slate-950 prose-a:font-black prose-a:text-amber-700 prose-a:no-underline hover:prose-a:underline [&_blockquote]:border-amber-200 [&_blockquote]:text-slate-700 [&_h1]:text-slate-950 [&_h2]:text-slate-950 [&_h3]:text-slate-900 [&_ol]:text-slate-800 [&_p]:text-slate-800 [&_table]:text-slate-800 [&_td]:text-slate-800 [&_th]:text-slate-950 [&_ul]:text-slate-800 md:px-10 md:py-10"
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />

          {faq.length > 0 && (
            <section className="mt-10 rounded-[1.75rem] border border-slate-200/70 bg-white p-6 shadow-sm md:p-8">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Perguntas frequentes</h2>
              <div className="mt-5 space-y-4">
                {faq.map((entry, index) => (
                  <div key={`${entry.question}-${index}`} className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-lg font-black text-slate-900">{entry.question}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{entry.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="space-y-5 xl:sticky xl:top-6">
          {visibleProducts.length > 0 && (
            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Onde comprar</div>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Links dos produtos</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Alguns links podem gerar comissao de afiliado sem custo adicional para voce.
              </p>
              <div className="mt-6 space-y-4">
                {visibleProducts.map((product: any, index: number) => (
                  <a
                    key={product.id}
                    href={product.affiliateUrl}
                    target="_blank"
                    rel="nofollow sponsored noopener noreferrer"
                    className="group block rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {index + 1}. {product.storeName || product.sourceDomain}
                      </div>
                      <div className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 shadow-sm">
                        Clique
                      </div>
                    </div>
                    <div className="mt-3 text-base font-black leading-6 text-slate-900 group-hover:text-amber-800">
                      {product.productTitle}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-500">
                      {product.priceText || "Preco sob consulta na loja"}
                    </div>
                    <div className="mt-4 inline-flex items-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-amber-600/20 transition group-hover:bg-amber-700">
                      Ver link de afiliado
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
