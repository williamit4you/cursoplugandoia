import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink, Search, ShoppingBag, Sparkles } from "lucide-react";
import BioCtaButton from "./BioCtaButton";
import { prisma } from "@/lib/prisma";
import { getCommerceSiteUrl } from "@/lib/siteUrls";
import { getShopeeContentArticles } from "@/lib/shopee-pipeline/contentArticles";

export const dynamic = "force-dynamic";

function normalizeText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function sentencesFromText(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function bulletsFromDescription(value: string) {
  const base = normalizeText(value);
  if (!base) return [];

  const pieces = base
    .split(/(?:\s+-\s+|\s+\|\s+|\.\s+)/)
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 20);

  const source = pieces.length ? pieces : sentencesFromText(base);
  return source.slice(0, 4).map((item) => truncateText(item, 110));
}

function buildSearchDescription(params: { title: string; description: string; category?: string | null }) {
  const intro = params.category
    ? `Veja detalhes sobre ${params.title} na categoria ${params.category}.`
    : `Veja detalhes sobre ${params.title}.`;
  const body = truncateText(normalizeText(params.description), 120);
  const text = normalizeText(`${intro} ${body} Comprar na Shopee com acesso rapido pela Compra Esperta Promocoes.`);
  return truncateText(text, 155);
}

async function loadBioProduct(slug: string) {
  return prisma.bioProduct.findUnique({
    where: { slug },
    include: {
      category: true,
      coleta: {
        select: {
          id: true,
          titulo: true,
          descricao: true,
          detalhes: true,
          aiPromptVendas: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = normalizeText(params.slug);
  const product = await prisma.bioProduct.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product?.active) {
    return {
      title: "Produto nao encontrado | Compra Esperta Promocoes",
      robots: { index: false, follow: false },
    };
  }

  const canonical = `${getCommerceSiteUrl()}/bio/${product.slug}`;
  const description = buildSearchDescription({
    title: product.title,
    description: product.description,
    category: product.category?.name,
  });

  return {
    title: `${truncateText(product.title, 70)} | Compra Esperta Promocoes`,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${product.title} | Compra Esperta Promocoes`,
      description,
      url: canonical,
      type: "website",
      images: product.imageUrl ? [{ url: product.imageUrl, alt: product.title }] : undefined,
    },
    twitter: {
      card: product.imageUrl ? "summary_large_image" : "summary",
      title: `${product.title} | Compra Esperta Promocoes`,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

export default async function BioProductPage({ params }: { params: { slug: string } }) {
  const slug = normalizeText(params.slug);
  const product = await loadBioProduct(slug);

  if (!product || !product.active) notFound();

  const [relatedProducts, relatedArticles] = await Promise.all([
    prisma.bioProduct.findMany({
      where: {
        active: true,
        id: { not: product.id },
        ...(product.categoryId ? { categoryId: product.categoryId } : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 4,
      include: { category: true },
    }),
    getShopeeContentArticles(product.coletaId),
  ]);

  const canonical = `${getCommerceSiteUrl()}/bio/${product.slug}`;
  const fallbackDescription =
    normalizeText(product.coleta?.descricao) ||
    normalizeText(product.coleta?.detalhes) ||
    normalizeText(product.coleta?.aiPromptVendas) ||
    normalizeText(product.description);
  const summary = truncateText(fallbackDescription || product.title, 220);
  const bullets = bulletsFromDescription(fallbackDescription || product.description);
  const articleLinks = relatedArticles.filter((item) => item.publicUrl && item.postTitle);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: buildSearchDescription({
      title: product.title,
      description: fallbackDescription || product.description,
      category: product.category?.name,
    }),
    image: product.imageUrl ? [product.imageUrl] : undefined,
    category: product.category?.name || "Shopee",
    brand: {
      "@type": "Brand",
      name: "Shopee",
    },
    url: canonical,
    offers: {
      "@type": "Offer",
      url: product.affiliateUrl,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Compra Esperta Promocoes",
      },
    },
  };

  return (
    <main className="min-h-screen bg-[#fff8fb] text-[#351a27]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,121,181,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,176,87,0.2),transparent_28%),linear-gradient(180deg,#fff8fb_0%,#fffdf8_58%,#fff6ef_100%)]" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="relative mx-auto max-w-6xl px-4 py-5 sm:px-8 sm:py-8">
        <Link href="/ofertas" className="inline-flex items-center gap-2 text-sm font-bold text-[#a64e76] transition hover:text-[#ff4f95]">
          <ArrowLeft className="h-4 w-4" />
          Voltar para ofertas
        </Link>

        <div className="mt-4 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[30px] border border-[#f3d7e4] bg-white/95 p-4 shadow-[0_24px_60px_rgba(255,112,164,0.12)] sm:p-5">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.title}
                className="aspect-square w-full rounded-[24px] object-cover bg-[#fff6f9]"
                loading="eager"
              />
            ) : product.videoUrl ? (
              <div className="overflow-hidden rounded-[24px] bg-[#1a0f18]">
                <video src={product.videoUrl} controls playsInline className="aspect-square w-full object-cover" />
              </div>
            ) : (
              <div className="grid aspect-square place-items-center rounded-[24px] bg-[linear-gradient(180deg,#fff4f8_0%,#fffaf0_100%)] text-[#e1a4bc]">
                <ShoppingBag className="h-14 w-14" />
              </div>
            )}
          </div>

          <div className="rounded-[30px] border border-[#f3d7e4] bg-white/95 p-5 shadow-[0_24px_60px_rgba(255,112,164,0.1)] sm:p-7">
            <div className="inline-flex items-center rounded-full bg-[#fff0f6] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff4f95]">
              {product.category?.name || "Achado Shopee"}
            </div>
            <h1 className="mt-3 text-[29px] font-black leading-[1.05] tracking-tight text-[#2d1830] sm:text-[38px]">
              {product.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-[#7b5366]">{summary}</p>

            {bullets.length ? (
              <div className="mt-5 grid gap-2">
                {bullets.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#f6dbe7] bg-[#fff9fc] px-4 py-3 text-sm leading-6 text-[#5f3a4a]">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#ff4f95]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-6">
              <BioCtaButton slug={product.slug} href={product.affiliateUrl} />
              <div className="mt-2 text-xs text-[#9b6d82]">Clique para abrir o produto na Shopee em uma nova etapa da sua jornada.</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {product.category?.slug ? (
                <Link
                  href={`/bio/categoria/${product.category.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#f1d2df] bg-white px-4 py-2 text-sm font-bold text-[#8d3a63] transition hover:bg-[#fff5f9]"
                >
                  Ver categoria
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              <Link
                href="/ofertas"
                className="inline-flex items-center gap-2 rounded-full border border-[#f1d2df] bg-white px-4 py-2 text-sm font-bold text-[#8d3a63] transition hover:bg-[#fff5f9]"
              >
                Buscar outro produto
                <Search className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[28px] border border-[#f3d7e4] bg-white/92 p-5 shadow-[0_18px_44px_rgba(255,112,164,0.08)] sm:p-6">
            <h2 className="text-xl font-black text-[#2d1830]">Sobre este produto</h2>
            <p className="mt-3 text-sm leading-7 text-[#6f4a5c]">{fallbackDescription || "Este item foi publicado na vitrine da Compra Esperta para facilitar a busca, a comparacao e o acesso rapido ao produto."}</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoBlock
                title="Por que ele chama atencao"
                content="Ele aparece na vitrine porque atende uma intencao de compra clara: ajudar o visitante da bio a localizar o item com menos atrito e chegar rapido ao link certo."
              />
              <InfoBlock
                title="Para quem faz sentido"
                content={`Esse item tende a funcionar melhor para quem procura ${product.category?.name?.toLowerCase() || "uma compra pratica"} com decisao mais rapida e quer validar o produto antes de sair da pagina.`}
              />
              <InfoBlock
                title="O que observar antes de comprar"
                content="Confira variacao, medidas, material, quantidade e reputacao do anuncio antes de finalizar. Assim a visita sai da bio com mais seguranca e mais chance de conversao."
              />
              <InfoBlock
                title="Como usar esta pagina a seu favor"
                content="Use esta pagina para validar rapidamente o nome do produto, entender o contexto e seguir para a Shopee apenas quando o item fizer sentido para a sua busca."
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-[#f3d7e4] bg-white/92 p-5 shadow-[0_18px_44px_rgba(255,112,164,0.08)] sm:p-6">
            <h2 className="text-xl font-black text-[#2d1830]">Conteudo relacionado</h2>
            <p className="mt-2 text-sm leading-6 text-[#7b5366]">
              Estes artigos ajudam o Google e o cliente a entender melhor o contexto desse produto em diferentes intencoes de busca.
            </p>

            <div className="mt-4 space-y-3">
              {articleLinks.length ? (
                articleLinks.map((article) => (
                  <Link
                    key={article.briefId}
                    href={article.publicUrl || "#"}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-[#f6dbe7] bg-[#fff9fc] p-4 transition hover:bg-white"
                  >
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff4f95]">
                        {article.angle === "PAIN" ? "Dor do cliente" : article.angle === "PRODUCT" ? "Demonstracao" : "Oferta"}
                      </div>
                      <div className="mt-1 text-sm font-black leading-6 text-[#2d1830]">{article.postTitle || article.briefTitle}</div>
                    </div>
                    <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-[#b25a82]" />
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#f1d2df] bg-[#fff9fc] p-4 text-sm leading-6 text-[#7b5366]">
                  Os artigos de apoio deste produto ainda nao foram conectados publicamente, mas a estrutura ja esta pronta para evoluir esse cluster SEO.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[28px] border border-[#f3d7e4] bg-white/92 p-5 shadow-[0_18px_44px_rgba(255,112,164,0.08)] sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff4f95]">Mais nessa linha</div>
              <h2 className="mt-2 text-xl font-black text-[#2d1830]">Produtos relacionados</h2>
            </div>
            {product.category?.slug ? (
              <Link href={`/bio/categoria/${product.category.slug}`} className="text-sm font-bold text-[#a64e76] hover:text-[#ff4f95]">
                Ver categoria completa
              </Link>
            ) : null}
          </div>

          {relatedProducts.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/bio/${item.slug}`}
                  className="rounded-[24px] border border-[#f3d7e4] bg-white p-3 shadow-[0_12px_28px_rgba(255,112,164,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(255,112,164,0.12)]"
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.title} className="aspect-square w-full rounded-2xl object-cover bg-[#fff6f9]" loading="lazy" />
                  ) : (
                    <div className="grid aspect-square place-items-center rounded-2xl bg-[linear-gradient(180deg,#fff4f8_0%,#fffaf0_100%)] text-[#e1a4bc]">
                      <ShoppingBag className="h-10 w-10" />
                    </div>
                  )}
                  <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff4f95]">
                    {item.category?.name || "Achado"}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-black leading-6 text-[#2d1830]">{item.title}</div>
                  <div className="mt-2 text-xs leading-5 text-[#8b6074]">{truncateText(normalizeText(item.description), 85)}</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[#f1d2df] bg-[#fff9fc] p-4 text-sm leading-6 text-[#7b5366]">
              Ainda nao ha outros produtos relacionados publicados nesta categoria.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function InfoBlock({ title, content }: { title: string; content: string }) {
  return (
    <article className="rounded-2xl border border-[#f6dbe7] bg-[#fff9fc] p-4">
      <h3 className="text-sm font-black text-[#2d1830]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#6f4a5c]">{content}</p>
    </article>
  );
}
