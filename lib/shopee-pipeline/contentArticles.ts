import "server-only";

import { prisma } from "@/lib/prisma";
import { buildTitleCoverDataUrl } from "@/lib/titleCover";

type ArticleAngleDefinition = {
  angle: string;
  categoryName: string;
  categorySlug: string;
  intent: string;
  titleHint: string;
  summaryHint: string;
  promptFocus: string;
};

type GeneratedArticle = {
  angle: string;
  title: string;
  summary: string;
  seoTitle: string;
  metaDescription: string;
  contentHtml: string;
};

const ARTICLE_DEFINITIONS: ArticleAngleDefinition[] = [
  {
    angle: "PAIN",
    categoryName: "Dor do cliente",
    categorySlug: "dor-do-cliente",
    intent: "informacional",
    titleHint: "problema que resolve",
    summaryHint: "conteudo de topo de funil, educativo e focado na dor",
    promptFocus: "escreva para quem ainda esta descobrindo o problema e buscando uma solucao pratica",
  },
  {
    angle: "PRODUCT",
    categoryName: "Demonstracao",
    categorySlug: "demonstracao",
    intent: "comercial",
    titleHint: "como funciona no dia a dia",
    summaryHint: "conteudo de meio de funil, mostrando uso, praticidade e beneficios reais",
    promptFocus: "mostre cenarios de uso, beneficios e como o produto se encaixa na rotina",
  },
  {
    angle: "SALES",
    categoryName: "Oferta",
    categorySlug: "oferta",
    intent: "transacional",
    titleHint: "vale a pena comprar",
    summaryHint: "conteudo de fundo de funil com CTA comercial e foco em decisao de compra",
    promptFocus: "fale com quem ja considera a compra e precisa de motivos objetivos para agir agora",
  },
];

const LINKS_SECTION_START = "<!-- SHOPEE_SOCIAL_LINKS_START -->";
const LINKS_SECTION_END = "<!-- SHOPEE_SOCIAL_LINKS_END -->";

function clean(value: unknown, maxLength: number) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function slugify(value: string) {
  return clean(value, 120)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function externalRefForColeta(coletaId: string) {
  return `shopee-sales:${coletaId}`;
}

function angleSourceUrl(coletaId: string, angle: string) {
  return `shopee://content/${coletaId}/${angle.toLowerCase()}`;
}

async function ensureCategory(name: string, slug: string) {
  const existing = await prisma.newsCategory.findUnique({ where: { slug } });
  if (existing) return existing;
  return prisma.newsCategory.create({
    data: {
      name,
      slug,
      active: true,
    },
  });
}

async function ensureUniquePostSlug(base: string, excludedPostId?: string | null) {
  const raw = slugify(base) || "artigo-shopee";
  let slug = raw;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (!existing || existing.id === excludedPostId) return slug;
    slug = `${raw}-${attempt + 2}`;
  }
  return `${raw}-${Date.now()}`;
}

function buildSocialLinksSection(params: {
  affiliateUrl: string;
  productUrl?: string | null;
  links: Array<{ platform: string; url?: string | null; scheduledTo?: Date | null }>;
}) {
  const rows = params.links
    .map((entry) => {
      const label = entry.platform === "META" ? "Instagram" : entry.platform;
      if (entry.url) {
        return `<li><a href="${entry.url}" target="_blank" rel="noreferrer noopener">Ver no ${label}</a></li>`;
      }
      if (entry.scheduledTo) {
        return `<li>${label}: publicacao prevista para ${entry.scheduledTo.toLocaleString("pt-BR")}</li>`;
      }
      return `<li>${label}: aguardando publicacao</li>`;
    })
    .join("");

  const ctas = [
    params.productUrl ? `<li><a href="${params.productUrl}" target="_blank" rel="noreferrer noopener">Ver a pagina do produto</a></li>` : "",
    params.affiliateUrl ? `<li><a href="${params.affiliateUrl}" target="_blank" rel="sponsored noreferrer noopener">Conferir a oferta com nosso link de afiliado</a></li>` : "",
  ]
    .filter(Boolean)
    .join("");

  return [
    LINKS_SECTION_START,
    `<section><h2>Video e links da campanha</h2><p>Esta secao acompanha as publicacoes geradas a partir deste produto e os links mais importantes para continuar a jornada.</p><ul>${rows}${ctas}</ul></section>`,
    LINKS_SECTION_END,
  ].join("");
}

function upsertManagedSection(content: string, sectionHtml: string) {
  const pattern = new RegExp(`${LINKS_SECTION_START}[\\s\\S]*?${LINKS_SECTION_END}`, "i");
  if (pattern.test(content)) {
    return content.replace(pattern, sectionHtml);
  }
  return `${content}\n\n${sectionHtml}`.trim();
}

function validateGeneratedArticle(article: any, fallbackAngle: string): GeneratedArticle {
  const angle = clean(article?.angle || fallbackAngle, 20).toUpperCase();
  const title = clean(article?.title, 160);
  const summary = clean(article?.summary, 240);
  const seoTitle = clean(article?.seoTitle || title, 160);
  const metaDescription = clean(article?.metaDescription || summary, 240);
  const contentHtml = String(article?.contentHtml || "").trim();
  if (!title || !summary || !contentHtml) {
    throw new Error(`Artigo invalido para ${fallbackAngle}.`);
  }
  return { angle, title, summary, seoTitle, metaDescription, contentHtml };
}

function buildFallbackArticle(params: {
  item: { titulo?: string | null; descricao?: string | null; detalhes?: string | null; aiPromptVendas?: string | null; affiliateUrl?: string | null; url?: string | null };
  definition: ArticleAngleDefinition;
}): GeneratedArticle {
  const productName = clean(params.item.titulo, 160) || "Produto Shopee";
  const description = clean(params.item.descricao || params.item.detalhes, 1500);
  const salesCopy = clean(params.item.aiPromptVendas, 1500);
  const affiliateUrl = clean(params.item.affiliateUrl, 1000);
  const productUrl = clean(params.item.url, 1000);

  const title =
    params.definition.angle === "PAIN"
      ? `${productName}: qual problema este produto ajuda a resolver?`
      : params.definition.angle === "PRODUCT"
        ? `${productName}: como funciona e quando faz sentido usar`
        : `${productName}: vale a pena comprar agora?`;

  const summary =
    params.definition.angle === "PAIN"
      ? `Entenda a dor que ${productName} se propõe a resolver, para quem faz sentido e quais sinais mostram que esse tipo de solução pode ajudar no dia a dia.`
      : params.definition.angle === "PRODUCT"
        ? `Veja como ${productName} pode ser usado na prática, quais benefícios aparecem com mais clareza e o que observar antes de decidir.`
        : `Um guia direto para avaliar se ${productName} faz sentido para a sua necessidade, com foco em benefício, contexto de uso e decisão de compra.`;

  const contentHtml = [
    `<p>${summary}</p>`,
    `<h2>O que observar antes de escolher</h2>`,
    `<p>${description || `Antes de comprar ${productName}, o ideal é entender a sua necessidade real, o contexto de uso e o que este tipo de produto entrega na prática.`}</p>`,
    params.definition.angle === "PAIN"
      ? `<h2>Qual dor esse tipo de produto ataca</h2><p>Em muitos casos, a busca por ${productName} nasce de uma frustração recorrente: falta de praticidade, perda de tempo, desconforto ou dificuldade para manter uma rotina mais eficiente. Quando a dor aparece com frequência, buscar uma solução específica deixa de ser impulso e passa a ser uma decisão racional.</p>`
      : params.definition.angle === "PRODUCT"
        ? `<h2>Como ${productName} pode entrar na rotina</h2><p>O melhor jeito de avaliar ${productName} é imaginar o uso real no dia a dia. Pense nas tarefas em que ele pode economizar tempo, reduzir esforço ou melhorar a experiência de uso. Esse tipo de leitura ajuda mais do que olhar apenas para uma lista técnica.</p>`
        : `<h2>Quando faz sentido comprar</h2><p>Se ${productName} ataca uma dor que aparece toda semana, a compra tende a fazer mais sentido. O ideal é comparar o custo com o ganho de tempo, conforto ou praticidade. Quando o benefício é recorrente, a decisão costuma ser mais fácil.</p>`,
    salesCopy ? `<h2>Pontos de destaque</h2><p>${salesCopy}</p>` : "",
    `<h2>Conclusao</h2><p>${productName} pode fazer sentido para quem busca uma solução objetiva, sem complicação e com foco em resultado prático. O importante é alinhar expectativa, necessidade e contexto de uso antes da compra.</p>`,
    `<h2>Onde conferir mais detalhes</h2><ul>${productUrl ? `<li><a href="${productUrl}" target="_blank" rel="noreferrer noopener">Pagina original do produto</a></li>` : ""}${affiliateUrl ? `<li><a href="${affiliateUrl}" target="_blank" rel="sponsored noreferrer noopener">Oferta com link de afiliado</a></li>` : ""}</ul>`,
  ]
    .filter(Boolean)
    .join("");

  return {
    angle: params.definition.angle,
    title,
    summary,
    seoTitle: title,
    metaDescription: summary,
    contentHtml,
  };
}

async function generateArticlesWithOpenAI(params: {
  item: { id: string; titulo?: string | null; descricao?: string | null; detalhes?: string | null; aiPromptVendas?: string | null; affiliateUrl?: string | null; url?: string | null };
  definitions: ArticleAngleDefinition[];
}) {
  const apiKey = clean(process.env.OPENAI_API_KEY, 200);
  if (!apiKey) {
    return {
      model: "fallback-template",
      articles: params.definitions.map((definition) => buildFallbackArticle({ item: params.item, definition })),
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.SHOPEE_CONTENT_ARTICLES_MODEL || "gpt-4o-mini",
        temperature: 0.45,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Voce e um redator senior de SEO e marketing de conteudo em portugues do Brasil. Escreva com acentos, sem inventar fatos, sem plagio e sem afirmar preco, frete, prazo ou desconto quando isso nao estiver claramente informado.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Crie artigos HTML para um portal de noticias/conteudo, todos ligados ao mesmo produto. Responda JSON com a chave articles. Cada item precisa conter angle, title, summary, seoTitle, metaDescription e contentHtml.",
              product: {
                id: params.item.id,
                title: clean(params.item.titulo, 160),
                description: clean(params.item.descricao || params.item.detalhes, 1800),
                narrationScript: clean(params.item.aiPromptVendas, 1600),
                affiliateUrl: clean(params.item.affiliateUrl, 1000),
                sourceUrl: clean(params.item.url, 1000),
              },
              angles: params.definitions.map((definition) => ({
                angle: definition.angle,
                objective: definition.promptFocus,
                titleHint: definition.titleHint,
                summaryHint: definition.summaryHint,
                intent: definition.intent,
              })),
              rules: [
                "Nao cite preco, promocao, frete ou prazo se isso nao estiver no contexto.",
                "Use HTML semantico com <p>, <h2>, <ul> e <li>.",
                "Cada artigo precisa ser distinto do outro em angulo e abordagem.",
                "Inclua uma conclusao e uma secao final sobre como avaliar o produto.",
                "Nao coloque o link social ainda; ele sera sincronizado depois.",
              ],
            }),
          },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(90_000),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(String(payload?.error?.message || `OpenAI HTTP ${response.status}`));
    }

    const rawContent = String(payload?.choices?.[0]?.message?.content || "");
    const parsed = JSON.parse(rawContent);
    const list = Array.isArray(parsed?.articles) ? parsed.articles : [];
    if (list.length === 0) {
      throw new Error("OpenAI nao retornou artigos.");
    }

    const articles = params.definitions.map((definition) => {
      const match = list.find((entry: any) => clean(entry?.angle, 20).toUpperCase() === definition.angle) || list.shift();
      return validateGeneratedArticle(match, definition.angle);
    });

    return {
      model: process.env.SHOPEE_CONTENT_ARTICLES_MODEL || "gpt-4o-mini",
      articles,
    };
  } catch {
    return {
      model: "fallback-template",
      articles: params.definitions.map((definition) => buildFallbackArticle({ item: params.item, definition })),
    };
  }
}

async function ensureShopeeProductCatalog(item: {
  id: string;
  titulo?: string | null;
  descricao?: string | null;
  detalhes?: string | null;
  affiliateUrl?: string | null;
  url?: string | null;
  mediaImageUrls?: string[];
}) {
  const externalRef = externalRefForColeta(item.id);
  const name = clean(item.titulo, 160) || "Produto Shopee";
  const slug = slugify(`${name}-${item.id.slice(-6)}`) || `produto-shopee-${item.id.slice(-6)}`;
  const imageUrl = Array.isArray(item.mediaImageUrls) ? clean(item.mediaImageUrls[0], 1000) : "";
  const description = clean(item.descricao || item.detalhes, 2000);

  return prisma.productCatalog.upsert({
    where: { externalRef },
    update: {
      name,
      slug,
      description: description || null,
      productUrl: clean(item.url, 1000) || null,
      affiliateUrl: clean(item.affiliateUrl, 1000) || null,
      imageUrl: imageUrl || null,
      status: "ACTIVE",
      metadataJson: JSON.stringify({ source: "SHOPEE_PIPELINE", coletaId: item.id }),
    },
    create: {
      externalRef,
      name,
      slug,
      description: description || null,
      productUrl: clean(item.url, 1000) || null,
      affiliateUrl: clean(item.affiliateUrl, 1000) || null,
      imageUrl: imageUrl || null,
      status: "ACTIVE",
      metadataJson: JSON.stringify({ source: "SHOPEE_PIPELINE", coletaId: item.id }),
    },
  });
}

async function loadSocialLinksForColeta(coletaId: string) {
  const storyAd = await prisma.storyAd.findUnique({
    where: { coletaId },
    include: { publications: true },
  });

  if (!storyAd) return [];

  const socialPostIds = storyAd.publications
    .map((publication) => String((publication.responsePayload as any)?.socialPostId || "").trim())
    .filter(Boolean);

  const socialPosts = socialPostIds.length
    ? await prisma.socialPost.findMany({
        where: { id: { in: socialPostIds } },
        select: {
          id: true,
          platform: true,
          scheduledTo: true,
          postUrl: true,
          youtubePostUrl: true,
          metaReelPostUrl: true,
          tiktokPostUrl: true,
        },
      })
    : [];

  return storyAd.publications.map((publication) => {
    const linked = socialPosts.find((item) => item.id === String((publication.responsePayload as any)?.socialPostId || "").trim());
    const platform = publication.platform === "INSTAGRAM" ? "Instagram" : publication.platform;
    const url =
      linked?.youtubePostUrl ||
      linked?.metaReelPostUrl ||
      linked?.tiktokPostUrl ||
      linked?.postUrl ||
      null;

    return {
      platform,
      url,
      scheduledTo: linked?.scheduledTo || null,
    };
  });
}

export async function syncShopeeContentArticleLinks(coletaId: string) {
  const item = await prisma.coletaDadosShoppe.findUnique({
    where: { id: coletaId },
    select: { id: true, affiliateUrl: true, url: true },
  });
  if (!item) return { updated: 0, posts: [] as Array<{ id: string; slug: string }> };

  const product = await prisma.productCatalog.findUnique({
    where: { externalRef: externalRefForColeta(coletaId) },
    select: { id: true, productUrl: true, affiliateUrl: true },
  });
  if (!product) return { updated: 0, posts: [] as Array<{ id: string; slug: string }> };

  const briefs = await prisma.seoBrief.findMany({
    where: { productId: product.id, postId: { not: null } },
    select: { postId: true },
  });
  const postIds = briefs.map((brief) => String(brief.postId || "").trim()).filter(Boolean);
  if (postIds.length === 0) return { updated: 0, posts: [] as Array<{ id: string; slug: string }> };

  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    select: { id: true, slug: true, content: true },
  });
  const socialLinks = await loadSocialLinksForColeta(coletaId);
  const sectionHtml = buildSocialLinksSection({
    affiliateUrl: clean(product.affiliateUrl || item.affiliateUrl, 1000),
    productUrl: clean(product.productUrl || item.url, 1000) || null,
    links: socialLinks,
  });

  let updated = 0;
  for (const post of posts) {
    const nextContent = upsertManagedSection(String(post.content || ""), sectionHtml);
    if (nextContent === post.content) continue;
    await prisma.post.update({
      where: { id: post.id },
      data: { content: nextContent },
    });
    updated += 1;
  }

  return { updated, posts: posts.map((post) => ({ id: post.id, slug: post.slug })) };
}

export async function ensureShopeeContentArticles(coletaId: string) {
  const item = await prisma.coletaDadosShoppe.findUnique({
    where: { id: coletaId },
    select: {
      id: true,
      titulo: true,
      descricao: true,
      detalhes: true,
      aiPromptVendas: true,
      affiliateUrl: true,
      url: true,
      mediaImageUrls: true,
    },
  });

  if (!item) throw new Error("Item da Shopee nao encontrado para gerar artigos.");

  const product = await ensureShopeeProductCatalog(item);
  const existingBriefs = await prisma.seoBrief.findMany({
    where: { productId: product.id },
    include: { product: true },
  });

  const missingDefinitions = ARTICLE_DEFINITIONS.filter((definition) => {
    const brief = existingBriefs.find((entry) => entry.angle === definition.angle);
    return !brief?.postId;
  });

  const generated = missingDefinitions.length
    ? await generateArticlesWithOpenAI({ item, definitions: missingDefinitions })
    : { model: "existing-posts", articles: [] as GeneratedArticle[] };

  const createdPosts: Array<{ id: string; slug: string; title: string; angle: string; status: string }> = [];
  const updatedPosts: Array<{ id: string; slug: string; title: string; angle: string; status: string }> = [];

  for (const definition of ARTICLE_DEFINITIONS) {
    const category = await ensureCategory(definition.categoryName, definition.categorySlug);
    const article = generated.articles.find((entry) => entry.angle === definition.angle) || buildFallbackArticle({ item, definition });
    const existingBrief = existingBriefs.find((entry) => entry.angle === definition.angle);

    let post = existingBrief?.postId
      ? await prisma.post.findUnique({ where: { id: existingBrief.postId } })
      : await prisma.post.findFirst({ where: { sourceUrl: angleSourceUrl(item.id, definition.angle) } });

    if (!post) {
      const slug = await ensureUniquePostSlug(`${article.title}-${item.id.slice(-6)}-${definition.angle.toLowerCase()}`);
      const contentWithSection = upsertManagedSection(
        article.contentHtml,
        buildSocialLinksSection({
          affiliateUrl: clean(product.affiliateUrl || item.affiliateUrl, 1000),
          productUrl: clean(product.productUrl || item.url, 1000) || null,
          links: [],
        }),
      );

      post = await prisma.post.create({
        data: {
          title: article.title,
          slug,
          summary: article.summary,
          content: contentWithSection,
          status: "PUBLISHED",
          publishedAt: new Date(),
          featured: definition.angle === "SALES",
          seoTitle: article.seoTitle,
          metaDescription: article.metaDescription,
          origin: "SHOPEE_PIPELINE",
          sourceUrl: angleSourceUrl(item.id, definition.angle),
          coverImage: clean(product.imageUrl, 1000) || buildTitleCoverDataUrl(article.title, definition.categoryName),
        },
      });

      await prisma.postNewsCategory.upsert({
        where: { postId_categoryId: { postId: post.id, categoryId: category.id } },
        update: {},
        create: { postId: post.id, categoryId: category.id },
      });

      createdPosts.push({ id: post.id, slug: post.slug, title: post.title, angle: definition.angle, status: post.status });
    } else {
      const contentWithSection = upsertManagedSection(String(post.content || article.contentHtml), buildSocialLinksSection({
        affiliateUrl: clean(product.affiliateUrl || item.affiliateUrl, 1000),
        productUrl: clean(product.productUrl || item.url, 1000) || null,
        links: [],
      }));

      post = await prisma.post.update({
        where: { id: post.id },
        data: {
          status: post.status === "PUBLISHED" ? post.status : "PUBLISHED",
          publishedAt: post.publishedAt || new Date(),
          content: contentWithSection,
          origin: post.origin || "SHOPEE_PIPELINE",
          coverImage: post.coverImage || clean(product.imageUrl, 1000) || buildTitleCoverDataUrl(article.title, definition.categoryName),
        },
      });

      await prisma.postNewsCategory.upsert({
        where: { postId_categoryId: { postId: post.id, categoryId: category.id } },
        update: {},
        create: { postId: post.id, categoryId: category.id },
      });

      updatedPosts.push({ id: post.id, slug: post.slug, title: post.title, angle: definition.angle, status: post.status });
    }

    const briefTitle = article.title || `${product.name}: ${definition.titleHint}`;
    const keyword = clean(product.name, 160) || briefTitle;
    const outlineJson = JSON.stringify(["Contexto do problema", "Como avaliar", "Beneficios praticos", "CTA e proximos passos"]);
    const internalLinksJson = JSON.stringify([product.productUrl, product.affiliateUrl].filter(Boolean));
    const sourcesJson = JSON.stringify([{ source: "SHOPEE_PIPELINE", coletaId: item.id, url: item.url || item.affiliateUrl || null }]);

    await prisma.seoBrief.upsert({
      where: { productId_angle: { productId: product.id, angle: definition.angle } },
      update: {
        title: briefTitle,
        primaryKeyword: keyword,
        intent: definition.intent,
        status: "PUBLISHED",
        postId: post.id,
        outlineJson,
        internalLinksJson,
        sourcesJson,
      },
      create: {
        productId: product.id,
        angle: definition.angle,
        status: "PUBLISHED",
        title: briefTitle,
        slug:
          `${slugify(product.name)}-${slugify(definition.angle)}-${item.id.slice(-6)}` ||
          `${slugify(post.title)}-${definition.angle.toLowerCase()}-${item.id.slice(-6)}`,
        primaryKeyword: keyword,
        intent: definition.intent,
        outlineJson,
        internalLinksJson,
        sourcesJson,
        postId: post.id,
      },
    });
  }

  const sync = await syncShopeeContentArticleLinks(coletaId);

  return {
    model: generated.model,
    productId: product.id,
    createdCount: createdPosts.length,
    updatedCount: updatedPosts.length + sync.updated,
    posts: [...createdPosts, ...updatedPosts],
  };
}

export async function getShopeeContentArticles(coletaId: string) {
  const product = await prisma.productCatalog.findUnique({
    where: { externalRef: externalRefForColeta(coletaId) },
    select: { id: true, name: true },
  });
  if (!product) return [];

  const briefs = await prisma.seoBrief.findMany({
    where: { productId: product.id },
    orderBy: { angle: "asc" },
    select: {
      id: true,
      angle: true,
      status: true,
      title: true,
      postId: true,
    },
  });

  const postIds = briefs.map((brief) => String(brief.postId || "").trim()).filter(Boolean);
  const posts = postIds.length
    ? await prisma.post.findMany({
        where: { id: { in: postIds } },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    : [];

  const postMap = new Map(posts.map((post) => [post.id, post]));
  return briefs.map((brief) => {
    const post = brief.postId ? postMap.get(brief.postId) || null : null;
    return {
      briefId: brief.id,
      angle: brief.angle,
      briefStatus: brief.status,
      briefTitle: brief.title,
      postId: post?.id || null,
      postTitle: post?.title || null,
      postStatus: post?.status || null,
      slug: post?.slug || null,
      publishedAt: post?.publishedAt || null,
      adminUrl: post ? `/admin/posts/${post.id}` : null,
      publicUrl: post?.slug ? `/noticias/${post.slug}` : null,
    };
  });
}
