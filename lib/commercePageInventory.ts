import "server-only";

import { prisma } from "@/lib/prisma";
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
  PET_HUB: "Hub pet",
  PET_CATEGORY: "Categoria pet",
  PET_GUIDE: "Guia pet",
  PET_COMPARISON: "Comparativo pet",
  PET_LOCAL: "Página local pet",
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
  if (/^\/lojas\/[^/]+\/artigos\/[^/]+$/.test(path)) return "PRODUCT_ARTICLE";
  if (/^\/lojas\/[^/]+\/produtos\/[^/]+$/.test(path)) return "PRODUCT_ARTICLE";
  if (/^\/lojas\/[^/]+\/[^/]+$/.test(path)) return "STORE_ARTICLE";
  if (/^\/lojas\/[^/]+$/.test(path)) return "STORE";
  if (path === "/produtos") return "PRODUCTS";
  if (/^\/bio\/categoria\/[^/]+$/.test(path)) return "BIO_CATEGORY";
  if (/^\/bio\/[^/]+$/.test(path)) return "BIO_PRODUCT";
  if (path === "/comparativo") return "COMPARISONS";
  if (/^\/comparativo\/[^/]+$/.test(path)) return "COMPARISON";
  if (path === "/pets" || path === "/pet-shop" || /^\/pets\/[^/]+$/.test(path)) return "PET_HUB";
  if (/^\/pets\/[^/]+\/[^/]+$/.test(path) && !/^\/pets\/guias\/[^/]+$/.test(path) && !/^\/pets\/comparativos\/[^/]+$/.test(path)) return "PET_CATEGORY";
  if (/^\/pets\/comparativos\/[^/]+$/.test(path)) return "PET_COMPARISON";
  if (/^\/pets\/guias\/[^/]+$/.test(path)) return "PET_GUIDE";
  if (/^\/pet-shop\/[^/]+$/.test(path) || /^\/loja-pet\/[^/]+$/.test(path)) return "PET_LOCAL";
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
  const [stores, bioCategories, bioProducts, comparisons, editorialArticles, petPages] = await Promise.all([
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
    prisma.seoBrief.findMany({
      where: {
        status: "PUBLISHED",
        indexable: true,
        contentJson: { not: null },
        product: { affiliateStore: { status: "ACTIVE" } },
      },
      include: { product: { include: { affiliateStore: true } } },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.petContentPage.findMany({
      where: {
        status: "PUBLISHED",
        indexable: true,
        contentJson: { not: null },
        affiliateStore: { status: "ACTIVE" },
      },
      include: {
        affiliateStore: true,
        location: true,
      },
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
  }

  for (const article of editorialArticles) {
    const store = article.product.affiliateStore;
    if (!store) continue;
    let secondaryKeywords: string[] = [];
    try {
      const content = JSON.parse(article.contentJson || "{}");
      secondaryKeywords = Array.isArray(content.secondaryKeywords) ? content.secondaryKeywords : [];
    } catch {}
    pages.push(item(siteUrl, {
      path: `/lojas/${store.slug}/artigos/${article.slug}`,
      title: article.title,
      pageType: "PRODUCT_ARTICLE",
      storeSlug: store.slug,
      storeName: store.name,
      category: store.category,
      primaryKeyword: article.primaryKeyword,
      secondaryKeywords,
      updatedAt: article.updatedAt.toISOString(),
    }));
  }

  for (const page of petPages) {
    const store = page.affiliateStore;
    if (!store) continue;
    const locationKeywords = page.location
      ? [page.location.city, page.location.state].filter(Boolean).join(" ")
      : "";
    pages.push(item(siteUrl, {
      path: `/${page.path}`,
      title: page.title,
      pageType:
        page.type === "LOCAL"
          ? "PET_LOCAL"
          : page.type === "COMPARISON"
            ? "PET_COMPARISON"
            : page.type === "CATEGORY"
              ? "PET_CATEGORY"
              : page.type === "HUB"
                ? "PET_HUB"
                : "PET_GUIDE",
      storeSlug: store.slug,
      storeName: store.name,
      category: store.category,
      primaryKeyword: page.primaryKeyword,
      secondaryKeywords: [page.searchIntent, locationKeywords].filter((value): value is string => Boolean(value)),
      updatedAt: page.updatedAt.toISOString(),
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
    a.title.localeCompare(b.title, "pt-BR"),
  );
}
