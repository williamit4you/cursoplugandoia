import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Search, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export const dynamic = "force-dynamic";

function normalizeText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

async function loadCategory(slug: string) {
  return prisma.bioCategory.findUnique({
    where: { slug },
    include: {
      products: {
        where: { active: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 60,
      },
    },
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = normalizeText(params.slug);
  const category = await prisma.bioCategory.findUnique({
    where: { slug },
    include: {
      products: {
        where: { active: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!category?.active || category.products.length === 0) {
    return {
      title: "Categoria nao encontrada | Compra Esperta Promocoes",
      robots: { index: false, follow: false },
    };
  }

  const canonical = `${getCommerceSiteUrl()}/bio/categoria/${category.slug}`;
  const description = `Explore produtos de ${category.name} na Compra Esperta Promocoes e encontre mais rapido o item certo para comprar na Shopee.`;

  return {
    title: `${category.name} | Compra Esperta Promocoes`,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${category.name} | Compra Esperta Promocoes`,
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function BioCategoryPage({ params }: { params: { slug: string } }) {
  const slug = normalizeText(params.slug);
  const category = await loadCategory(slug);

  if (!category || !category.active) notFound();

  return (
    <main className="min-h-screen bg-[#fff8fb] text-[#351a27]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,121,181,0.18),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,176,87,0.2),transparent_28%),linear-gradient(180deg,#fff8fb_0%,#fffdf8_58%,#fff6ef_100%)]" />

      <section className="relative mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8">
        <Link href="/ofertas" className="inline-flex items-center gap-2 text-sm font-bold text-[#a64e76] transition hover:text-[#ff4f95]">
          <ArrowLeft className="h-4 w-4" />
          Voltar para ofertas
        </Link>

        <div className="mt-4 rounded-[30px] border border-[#f3d7e4] bg-white/95 p-5 shadow-[0_24px_60px_rgba(255,112,164,0.12)] sm:p-6">
          <div className="inline-flex items-center rounded-full bg-[#fff0f6] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#ff4f95]">
            Categoria da bio
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#2d1830] sm:text-4xl">{category.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#7b5366]">
            Veja todos os produtos publicados nesta categoria e navegue mais rapido para o item que voce quer encontrar na Shopee.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="rounded-full border border-[#f1d2df] bg-white px-4 py-2 text-sm font-bold text-[#8d3a63]">
              {category.products.length} produto(s)
            </div>
            <Link
              href="/ofertas"
              className="inline-flex items-center gap-2 rounded-full border border-[#f1d2df] bg-white px-4 py-2 text-sm font-bold text-[#8d3a63] transition hover:bg-[#fff5f9]"
            >
              Buscar outro item
              <Search className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {category.products.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {category.products.map((product) => (
              <Link
                key={product.id}
                href={`/bio/${product.slug}`}
                className="rounded-[24px] border border-[#f3d7e4] bg-white p-3 shadow-[0_14px_32px_rgba(255,112,164,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(255,112,164,0.12)]"
              >
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.title} className="aspect-square w-full rounded-2xl object-cover bg-[#fff6f9]" loading="lazy" />
                ) : (
                  <div className="grid aspect-square place-items-center rounded-2xl bg-[linear-gradient(180deg,#fff4f8_0%,#fffaf0_100%)] text-[#e1a4bc]">
                    <ShoppingBag className="h-10 w-10" />
                  </div>
                )}

                <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff4f95]">Achado Shopee</div>
                <div className="mt-1 line-clamp-2 min-h-[48px] text-sm font-black leading-6 text-[#2d1830]">{product.title}</div>
                <div className="mt-2 text-xs leading-5 text-[#8b6074]">{truncateText(normalizeText(product.description), 90)}</div>
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#a64e76]">
                  Ver detalhes
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[28px] border border-dashed border-[#f1d2df] bg-white/92 p-5 text-sm leading-6 text-[#7b5366]">
            Nenhum produto desta categoria esta ativo no momento.
          </div>
        )}
      </section>
    </main>
  );
}
