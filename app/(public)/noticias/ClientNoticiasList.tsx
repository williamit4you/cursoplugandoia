"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, Clock3, Flame, Search } from "lucide-react";

function relativeDate(value: string | Date) {
  return formatDistanceToNow(new Date(value), { locale: ptBR, addSuffix: true });
}

function primaryCategory(post: any) {
  return post?.categories?.[0]?.category || null;
}

function readTime(post: any) {
  const minutes = Number(post?.readTimeMinutes || 0);
  if (minutes > 0) return `${minutes} min de leitura`;
  return "Leitura rapida";
}

function titleTrim(value: string, max = 110) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function summaryTrim(value: string, max = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function imageOf(post: any) {
  return String(post?.coverImage || "").trim() || null;
}

function productBadge(product: any) {
  return product?.affiliateStore?.name || product?.category || "Oferta parceira";
}

export default function ClientNoticiasList({
  posts,
  categories = [],
  query = { q: "", category: "", page: 1 },
  total = 0,
  pageSize = 12,
  trendingPosts = [],
  sponsoredProducts = [],
}: {
  posts: any[];
  categories?: any[];
  query?: { q: string; category: string; page: number };
  total?: number;
  pageSize?: number;
  trendingPosts?: any[];
  sponsoredProducts?: any[];
}) {
  if (!posts.length) {
    return (
      <main className="min-h-[60vh] bg-[#f4f1ea] px-4 py-10 text-[#1f2937] sm:px-8">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-black/10 bg-white p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-[#a63b2f]">Portal de noticias</div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-[#122033]">Nenhuma noticia publicada agora</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#5b6473]">
            Assim que novas materias forem publicadas, elas aparecerao aqui com destaque editorial, categorias e blocos patrocinados.
          </p>
        </div>
      </main>
    );
  }

  const hero = posts[0];
  const featuredGrid = posts.slice(1, 5);
  const listPosts = posts.slice(5);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const linkFor = (params: { q?: string; category?: string; page?: number }) => {
    const next = { ...query, ...params };
    const search = new URLSearchParams();
    if (next.q) search.set("q", next.q);
    if (next.category) search.set("categoria", next.category);
    if (next.page && next.page > 1) search.set("page", String(next.page));
    return `/noticias${search.toString() ? `?${search}` : ""}`;
  };

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#122033]">
      <div className="border-b border-black/10 bg-[#171717] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/80 sm:px-8">
          <span>Portal inteligente</span>
          <span>Noticias</span>
          <span>IA</span>
          <span>Mercado digital</span>
          <span>Afiliados</span>
          <span>Conteudo editorial</span>
        </div>
      </div>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-[#a63b2f]">Noticias em destaque</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0f172a] sm:text-4xl">Portal Inteligente</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5b6473]">
                Conteudo com foco em tecnologia, IA, tendencias digitais e oportunidades comerciais com linguagem mais editorial e profissional.
              </p>
            </div>

            <form action="/noticias" className="flex w-full max-w-xl items-center gap-2 rounded-[22px] border border-black/10 bg-[#f5f3ee] p-2 shadow-inner">
              <div className="flex flex-1 items-center gap-3 rounded-[16px] bg-white px-4 py-3">
                <Search className="h-4 w-4 text-[#a63b2f]" />
                <input
                  name="q"
                  defaultValue={query.q}
                  placeholder="Busque noticias, IA, tecnologia, mercado..."
                  className="w-full bg-transparent text-sm text-[#122033] outline-none placeholder:text-[#7b8594]"
                />
              </div>
              {query.category ? <input type="hidden" name="categoria" value={query.category} /> : null}
              <button className="rounded-[16px] bg-[#b3261e] px-5 py-3 text-sm font-black text-white transition hover:bg-[#971e18]">
                Buscar
              </button>
            </form>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            <Link
              href={linkFor({ category: "", page: 1 })}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-black transition ${
                !query.category ? "border-[#b3261e] bg-[#b3261e] text-white" : "border-black/10 bg-white text-[#122033] hover:border-[#b3261e]/30 hover:text-[#b3261e]"
              }`}
            >
              Todas
            </Link>
            {categories.map((category: any) => (
              <Link
                key={category.id}
                href={linkFor({ category: category.slug, page: 1 })}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-black transition ${
                  query.category === category.slug
                    ? "border-[#b3261e] bg-[#b3261e] text-white"
                    : "border-black/10 bg-white text-[#122033] hover:border-[#b3261e]/30 hover:text-[#b3261e]"
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1.55fr)_320px] lg:gap-10 sm:px-8">
        <div className="space-y-8">
          {hero ? (
            <article className="grid gap-5 border-b border-black/10 pb-8 md:grid-cols-[1.1fr_.95fr]">
              <Link href={`/noticias/${hero.slug}`} className="group block overflow-hidden rounded-[28px] bg-[#171c2b]">
                {imageOf(hero) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageOf(hero)!}
                    alt={hero.title}
                    className="h-full min-h-[280px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="relative flex min-h-[280px] items-end overflow-hidden bg-[radial-gradient(circle_at_top_right,#7c3aed_0%,transparent_32%),linear-gradient(135deg,#1e1b4b,#0f766e)] p-6">
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">Destaque</div>
                  </div>
                )}
              </Link>

              <div className="flex flex-col justify-center">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-[#a63b2f]">
                  {primaryCategory(hero)?.name || "Noticias"}
                </div>
                <Link href={`/noticias/${hero.slug}`} className="mt-3 block">
                  <h2 className="text-3xl font-black leading-[1.02] tracking-tight text-[#081120] transition hover:text-[#b3261e] md:text-5xl">
                    {hero.title}
                  </h2>
                </Link>
                <p className="mt-4 text-base leading-8 text-[#475467]">{summaryTrim(hero.summary, 260)}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#7b8594]">
                  <span>{relativeDate(hero.publishedAt || hero.createdAt)}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {readTime(hero)}</span>
                  <span>{Number(hero.views || 0).toLocaleString("pt-BR")} leituras</span>
                </div>
              </div>
            </article>
          ) : null}

          {featuredGrid.length ? (
            <section className="grid gap-5 md:grid-cols-2">
              {featuredGrid.map((post: any) => (
                <article key={post.id} className="group rounded-[26px] border border-black/10 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,23,42,0.1)]">
                  <Link href={`/noticias/${post.slug}`} className="block overflow-hidden rounded-[22px] bg-[#e5e7eb]">
                    {imageOf(post) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageOf(post)!} alt={post.title} className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="h-52 w-full bg-[radial-gradient(circle_at_top_right,#8b5cf6_0%,transparent_34%),linear-gradient(135deg,#1f2937,#0f766e)]" />
                    )}
                  </Link>
                  <div className="mt-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#a63b2f]">
                    {primaryCategory(post)?.name || "Noticias"}
                  </div>
                  <Link href={`/noticias/${post.slug}`} className="mt-2 block">
                    <h3 className="text-xl font-black leading-tight tracking-tight text-[#081120] transition hover:text-[#b3261e]">
                      {titleTrim(post.title, 88)}
                    </h3>
                  </Link>
                  <p className="mt-3 text-sm leading-7 text-[#556070]">{summaryTrim(post.summary, 150)}</p>
                  <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#7b8594]">
                    <span>{relativeDate(post.publishedAt || post.createdAt)}</span>
                    <span>{readTime(post)}</span>
                  </div>
                </article>
              ))}
            </section>
          ) : null}

          <section className="space-y-6">
            {listPosts.map((post: any, index: number) => (
              <div key={post.id}>
                {index === 1 && sponsoredProducts[0] ? (
                  <a
                    href={sponsoredProducts[0].affiliateUrl}
                    target="_blank"
                    rel="sponsored noreferrer"
                    className="mb-6 block rounded-[30px] bg-[linear-gradient(135deg,#111827,#1f2937)] p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]"
                  >
                    <div className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">Publicidade parceira</div>
                    <div className="mt-3 grid items-center gap-5 md:grid-cols-[1fr_220px]">
                      <div>
                        <h3 className="text-3xl font-black tracking-tight">{sponsoredProducts[0].name}</h3>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                          {summaryTrim(sponsoredProducts[0].description || "Produto patrocinado do nosso modulo de afiliados, pronto para levar trafego com seu link rastreado.", 180)}
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-[#082032]">
                          Conferir oferta <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                      {sponsoredProducts[0].imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sponsoredProducts[0].imageUrl} alt={sponsoredProducts[0].name} className="h-48 w-full rounded-[24px] object-cover" />
                      ) : null}
                    </div>
                  </a>
                ) : null}

                <article className="grid gap-4 border-b border-black/10 pb-6 md:grid-cols-[250px_1fr]">
                  <Link href={`/noticias/${post.slug}`} className="block overflow-hidden rounded-[24px] bg-[#e5e7eb]">
                    {imageOf(post) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageOf(post)!} alt={post.title} className="h-52 w-full object-cover transition duration-500 hover:scale-[1.03]" />
                    ) : (
                      <div className="h-52 w-full bg-[radial-gradient(circle_at_top_right,#7c3aed_0%,transparent_34%),linear-gradient(135deg,#1f2937,#0f766e)]" />
                    )}
                  </Link>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#a63b2f]">
                      {primaryCategory(post)?.name || "Noticias"}
                    </div>
                    <Link href={`/noticias/${post.slug}`} className="mt-2 block">
                      <h3 className="text-2xl font-black leading-tight tracking-tight text-[#081120] transition hover:text-[#b3261e]">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="mt-3 text-sm leading-7 text-[#556070]">{summaryTrim(post.summary, 220)}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#7b8594]">
                      <span>{relativeDate(post.publishedAt || post.createdAt)}</span>
                      <span>{readTime(post)}</span>
                      <span>{Number(post.views || 0).toLocaleString("pt-BR")} views</span>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </section>

          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-3 rounded-[24px] border border-black/10 bg-white px-5 py-4">
              {query.page > 1 ? (
                <Link href={linkFor({ page: query.page - 1 })} className="rounded-full border border-black/10 px-4 py-2 text-sm font-black text-[#122033]">
                  Anterior
                </Link>
              ) : null}
              <span className="text-sm font-bold text-[#556070]">Pagina {query.page} de {totalPages}</span>
              {query.page < totalPages ? (
                <Link href={linkFor({ page: query.page + 1 })} className="rounded-full bg-[#b3261e] px-4 py-2 text-sm font-black text-white">
                  Proxima
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-black/10 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="border-b border-black/10 px-5 py-4">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-[#a63b2f]">
                <Flame className="h-3.5 w-3.5" /> Mais lidas
              </div>
            </div>
            <div className="divide-y divide-black/10">
              {trendingPosts.slice(0, 5).map((post: any) => (
                <Link key={post.id} href={`/noticias/${post.slug}`} className="grid grid-cols-[1fr_72px] gap-3 px-5 py-4 transition hover:bg-[#faf8f3]">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a63b2f]">
                      {primaryCategory(post)?.name || "Noticias"}
                    </div>
                    <div className="mt-1 text-base font-black leading-tight text-[#081120]">{titleTrim(post.title, 72)}</div>
                    <div className="mt-2 text-[11px] font-semibold text-[#7b8594]">{Number(post.views || 0).toLocaleString("pt-BR")} leituras</div>
                  </div>
                  <div className="overflow-hidden rounded-[18px] bg-[#e5e7eb]">
                    {imageOf(post) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageOf(post)!} alt={post.title} className="h-[72px] w-[72px] object-cover" />
                    ) : (
                      <div className="h-[72px] w-[72px] bg-[linear-gradient(135deg,#312e81,#0f766e)]" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-[#a63b2f]">Ofertas parceiras</div>
            <div className="mt-4 space-y-4">
              {sponsoredProducts.slice(0, 4).map((product: any) => (
                <a
                  key={product.id}
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="sponsored noreferrer"
                  className="grid grid-cols-[84px_1fr] gap-3 rounded-[20px] border border-black/10 p-3 transition hover:border-[#b3261e]/30 hover:bg-[#faf8f3]"
                >
                  <div className="overflow-hidden rounded-[16px] bg-[#f3f4f6]">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt={product.name} className="h-[84px] w-[84px] object-cover" />
                    ) : (
                      <div className="h-[84px] w-[84px] bg-[linear-gradient(135deg,#312e81,#0f766e)]" />
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a63b2f]">{productBadge(product)}</div>
                    <div className="mt-1 text-sm font-black leading-5 text-[#081120]">{titleTrim(product.name, 58)}</div>
                    <div className="mt-2 text-xs leading-5 text-[#556070]">{summaryTrim(product.description || "Produto patrocinado do nosso ecossistema de afiliados.", 88)}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <Link
            href="/solucoes-ia"
            className="block rounded-[28px] bg-[linear-gradient(135deg,#111827,#0f172a)] p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]"
          >
            <div className="text-xs font-black uppercase tracking-[0.26em] text-emerald-300">Treinamento exclusivo</div>
            <div className="mt-3 text-3xl font-black tracking-tight">Plugando IA</div>
            <p className="mt-3 text-sm leading-7 text-white/80">
              Aprenda IA na pratica e transforme conteudo, automacao e afiliacao em uma operacao forte de crescimento.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-[#082032]">
              Acessar agora <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </aside>
      </section>
    </main>
  );
}
