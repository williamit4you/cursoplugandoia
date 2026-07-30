import "server-only";

import { prisma } from "@/lib/prisma";
import { STORE_ARTICLE_TOPICS, buildStoreArticle } from "@/lib/affiliateSeoContent";
import { PRODUCT_SEO_ARTICLES } from "@/lib/productSeoArticles";
import { getCommerceSiteUrl } from "@/lib/siteUrls";

export type CommercePageInventoryItem = {
  key: string;
  path: string;
  url: string;
  title: string;
  pageType: string;
  pageTypeLabel: string;
  storeSlug: string | null;
  storeName: string | null;
  category: string;
  primaryKeyword: string | null;
  secondaryKeywords: string[];
  updatedAt: string | null;
};

const PAGE_TYPE_LABELS: Record<string, string> = {
  HOME: "Início",
  STORES: "Lista de lojas",
  STORE: "Página da loja",
  STORE_ARTICLE: "Guia da loja",
  PRODUCTS: "Lista de produtos",
  PRODUCT_ARTICLE: "Artigo de produto",
  BIO_CATEGORY: "Categoria de ofertas",
  BIO_PRODUCT: "Oferta de produto",
  COMPARISONS: "Lista de comparativos",
  COMPARISON: "Comparativo",
  OTHER: "Outra página",
};

export function commercePageTypeLabel(type: string) {
  return PAGE_TYPE_LABELS[type] || PAGE_TYPE_LABELS.OTHER;
}

export function inferCommercePageType(path: string) {
  if (path === "/" || path === "/ofertas") return "HOME";
  if (path === "/lojas") return "STORES";
  if (/^\/lojas\/[^/]+\/produtos\/[^/]+$/.test(path)) return "PRODUCT_ARTICLE";
  if (/^\/lojas\/[^/]+\/[^/]+$/.test(path)) return "STORE_ARTICLE";
  if (/^\/lojas\/[^/]+$/.test(path)) return "STORE";
  if (path === "/produtos") return "PRODUCTS";
  if (/^\/bio\/categoria\/[^/]+$/.test(path)) return "BIO_CATEGORY";
  if (/^\/bio\/[^/]+$/.test(path)) return "BIO_PRODUCT";
  if (path === "/comparativo") return "COMPARISONS";
  if (/^\/comparativo\/[^/]+$/.test(path)) return "COMPARISON";
  return "OTHER";
}

function item(
  siteUrl: string,
  input: Omit<CommercePageInventoryItem, "key" | "url" | "pageTypeLabel">,
): CommercePageInventoryItem {
  return {
    ...input,
    key: `commerce:${input.path}`,
    url: `${siteUrl}${input.path === "/" ? "" : input.path}`,
    pageTypeLabel: commercePageTypeLabel(input.pageType),
  };
}

export async function buildCommercePageInventory() {
  const siteUrl = getCommerceSiteUrl();
  const [stores, bioCategories, bioProducts, comparisons] = await Promise.all([
    prisma.affiliateStore.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.bioCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.bioProduct.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.affiliateComparison.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  const pages: CommercePageInventoryItem[] = [
    item(siteUrl, {
      path: "/",
      title: "Compra Esperta Promoções",
      pageType: "HOME",
      storeSlug: null,
      storeName: null,
      category: "Institucional",
      primaryKeyword: "Compra Esperta Promoções",
      secondaryKeywords: ["ofertas", "guias de compra", "lojas"],
      updatedAt: null,
    }),
    item(siteUrl, {
      path: "/lojas",
      title: "Todas as lojas",
      pageType: "STORES",
      storeSlug: null,
      storeName: null,
      category: "Lojas",
      primaryKeyword: "lojas online",
      secondaryKeywords: ["guias de lojas", "onde comprar"],
      updatedAt: null,
    }),
    item(siteUrl, {
      path: "/produtos",
      title: "Guias de produtos",
      pageType: "PRODUCTS",
      storeSlug: null,
      storeName: null,
      category: "Produtos",
      primaryKeyword: "guias de produtos",
      secondaryKeywords: ["como escolher produtos", "produtos valem a pena"],
      updatedAt: null,
    }),
    item(siteUrl, {
      path: "/comparativo",
      title: "Comparativos de produtos",
      pageType: "COMPARISONS",
      storeSlug: null,
      storeName: null,
      category: "Comparativos",
      primaryKeyword: "comparativos de produtos",
      secondaryKeywords: ["qual produto escolher", "melhores produtos"],
      updatedAt: null,
    }),
  ];

  for (const store of stores) {
    pages.push(item(siteUrl, {
      path: `/lojas/${store.slug}`,
      title: `${store.name}: ofertas e guias`,
      pageType: "STORE",
      storeSlug: store.slug,
      storeName: store.name,
      category: store.category,
      primaryKeyword: `${store.name} ${store.category}`.toLowerCase(),
      secondaryKeywords: [`ofertas ${store.name}`, `produtos ${store.name}`],
      updatedAt: store.updatedAt.toISOString(),
    }));

    for (const topic of STORE_ARTICLE_TOPICS) {
      const article = buildStoreArticle(store, topic.slug);
      if (!article) continue;
      pages.push(item(siteUrl, {
        path: `/lojas/${store.slug}/${topic.slug}`,
        title: article.title,
        pageType: "STORE_ARTICLE",
        storeSlug: store.slug,
        storeName: store.name,
        category: store.category,
        primaryKeyword: `${topic.shortLabel} ${store.name}`.toLowerCase(),
        secondaryKeywords: [topic.intent, `${store.category} ${store.name}`],
        updatedAt: store.updatedAt.toISOString(),
      }));
    }
  }

  const activeStoreSlugs = new Set(stores.map((store) => store.slug));
  for (const article of PRODUCT_SEO_ARTICLES) {
    if (!activeStoreSlugs.has(article.storeSlug)) continue;
    const store = stores.find((entry) => entry.slug === article.storeSlug);
    pages.push(item(siteUrl, {
      path: `/lojas/${article.storeSlug}/produtos/${article.slug}`,
      title: article.title,
      pageType: "PRODUCT_ARTICLE",
      storeSlug: article.storeSlug,
      storeName: store?.name || article.storeName,
      category: store?.category || article.category,
      primaryKeyword: article.primaryKeyword,
      secondaryKeywords: article.secondaryKeywords,
      updatedAt: article.updatedAt,
    }));
  }

  for (const category of bioCategories) {
    pages.push(item(siteUrl, {
      path: `/bio/categoria/${category.slug}`,
      title: `Ofertas de ${category.name}`,
      pageType: "BIO_CATEGORY",
      storeSlug: null,
      storeName: "Shopee",
      category: category.name,
      primaryKeyword: `ofertas de ${category.name}`.toLowerCase(),
      secondaryKeywords: [`produtos ${category.name}`, `achados ${category.name}`],
      updatedAt: category.updatedAt.toISOString(),
    }));
  }

  for (const product of bioProducts) {
    pages.push(item(siteUrl, {
      path: `/bio/${product.slug}`,
      title: product.title,
      pageType: "BIO_PRODUCT",
      storeSlug: "shopee",
      storeName: "Shopee",
      category: product.category?.name || "Shopee",
      primaryKeyword: product.title.toLowerCase(),
      secondaryKeywords: product.description ? [product.description.slice(0, 160)] : [],
      updatedAt: product.updatedAt.toISOString(),
    }));
  }

  for (const comparison of comparisons) {
    pages.push(item(siteUrl, {
      path: `/comparativo/${comparison.slug}`,
      title: comparison.seoTitle || comparison.title,
      pageType: "COMPARISON",
      storeSlug: null,
      storeName: null,
      category: comparison.theme || "Comparativos",
      primaryKeyword: comparison.title.toLowerCase(),
      secondaryKeywords: comparison.metaDescription ? [comparison.metaDescription] : [],
      updatedAt: comparison.updatedAt.toISOString(),
    }));
  }

  return pages.sort((a, b) =>
    a.pageTypeLabel.localeCompare(b.pageTypeLabel, "pt-BR") ||
    a.title.localeCompare(b.title, "pt-BR")
  );
}
