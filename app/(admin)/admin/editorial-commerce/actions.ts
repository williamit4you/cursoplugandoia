"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeAffiliateHost, resolveAffiliateStoreDestination } from "@/lib/affiliateStores";
import { runCommerceEditorialOnce } from "@/lib/commerce-editorial/pipeline";

function text(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function revalidateEditorialPaths(briefId: string, storeSlug?: string | null, articleSlug?: string | null) {
  revalidatePath("/admin/editorial-commerce");
  revalidatePath(`/admin/editorial-commerce/${briefId}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/lojas");
  revalidatePath("/produtos");
  if (storeSlug) {
    revalidatePath(`/lojas/${storeSlug}`);
    if (articleSlug) revalidatePath(`/lojas/${storeSlug}/artigos/${articleSlug}`);
  }
}

export async function runEditorialNow() {
  await runCommerceEditorialOnce({ force: true }).catch(() => null);
  revalidatePath("/admin/editorial-commerce");
}

export async function toggleEditorialAutomation() {
  const config = await prisma.commerceEditorialConfig.findUnique({ where: { id: "default" } });
  await prisma.commerceEditorialConfig.upsert({
    where: { id: "default" },
    update: { enabled: !config?.enabled },
    create: { id: "default", enabled: true },
  });
  revalidatePath("/admin/editorial-commerce");
}

export async function publishEditorialArticle(formData: FormData) {
  const briefId = text(formData.get("briefId"));
  if (!briefId) throw new Error("Artigo nao informado");

  const brief = await prisma.seoBrief.findUnique({
    where: { id: briefId },
    include: {
      product: {
        include: {
          affiliateStore: { select: { slug: true } },
        },
      },
    },
  });
  if (!brief?.contentJson || !brief.product.affiliateStoreId) throw new Error("Artigo incompleto ou sem loja vinculada");

  const publishedAt = brief.publishedAt || new Date();
  await prisma.$transaction([
    prisma.seoBrief.update({
      where: { id: brief.id },
      data: { status: "PUBLISHED", indexable: true, publishedAt },
    }),
    prisma.commerceEditorialRun.updateMany({
      where: { briefId: brief.id },
      data: {
        status: "PUBLISHED",
        step: "MANUAL_PUBLISH",
        message: "Artigo revisado e publicado manualmente pelo operador. Liberado para o sitemap.",
        completedAt: new Date(),
      },
    }),
  ]);

  revalidateEditorialPaths(brief.id, brief.product.affiliateStore?.slug, brief.slug);
}

export async function unpublishEditorialArticle(formData: FormData) {
  const briefId = text(formData.get("briefId"));
  if (!briefId) throw new Error("Artigo nao informado");

  const brief = await prisma.seoBrief.findUnique({
    where: { id: briefId },
    include: {
      product: {
        include: {
          affiliateStore: { select: { slug: true } },
        },
      },
    },
  });
  if (!brief?.product?.affiliateStoreId) throw new Error("Artigo sem loja vinculada");

  await prisma.$transaction([
    prisma.seoBrief.update({
      where: { id: brief.id },
      data: {
        status: "REVIEW",
        indexable: false,
        publishedAt: null,
      },
    }),
    prisma.commerceEditorialRun.updateMany({
      where: { briefId: brief.id },
      data: {
        status: "REVIEW",
        step: "EDITORIAL_REVIEW",
        message: "Artigo despublicado manualmente pelo operador. Removido do sitemap ate nova publicacao.",
        completedAt: new Date(),
      },
    }),
  ]);

  revalidateEditorialPaths(brief.id, brief.product.affiliateStore?.slug, brief.slug);
}

export async function updateEditorialProductUrl(formData: FormData) {
  const briefId = text(formData.get("briefId"));
  const rawProductUrl = text(formData.get("productUrl"));
  if (!briefId) throw new Error("Artigo nao informado");
  if (!rawProductUrl) throw new Error("Informe a URL correta do produto");

  const brief = await prisma.seoBrief.findUnique({
    where: { id: briefId },
    include: {
      product: {
        include: {
          affiliateStore: {
            select: { slug: true, affiliateUrl: true, domain: true },
          },
        },
      },
    },
  });
  if (!brief?.product?.affiliateStore) throw new Error("Artigo sem loja afiliada vinculada");

  const productUrl = new URL(rawProductUrl);
  if (productUrl.protocol !== "https:") throw new Error("Use uma URL https valida");
  if (normalizeAffiliateHost(productUrl.hostname) !== normalizeAffiliateHost(brief.product.affiliateStore.domain)) {
    throw new Error("A URL informada precisa ser da mesma loja do artigo");
  }

  const resolvedAffiliateUrl = resolveAffiliateStoreDestination(
    brief.product.affiliateStore.affiliateUrl,
    productUrl.toString(),
  ).toString();

  let nextSources: unknown = [];
  try {
    const currentSources = JSON.parse(brief.sourcesJson || "[]");
    nextSources = Array.isArray(currentSources)
      ? currentSources.map((item) => (
          item && typeof item === "object" && (item as { source?: string }).source === "STORE_PAGE"
            ? { ...(item as Record<string, unknown>), url: productUrl.toString() }
            : item
        ))
      : currentSources;
  } catch {
    nextSources = [];
  }

  await prisma.$transaction([
    prisma.productCatalog.update({
      where: { id: brief.productId },
      data: {
        productUrl: productUrl.toString(),
        affiliateUrl: resolvedAffiliateUrl,
      },
    }),
    prisma.seoBrief.update({
      where: { id: brief.id },
      data: {
        sourcesJson: JSON.stringify(nextSources),
        status: brief.status === "PUBLISHED" ? "REVIEW" : brief.status,
        indexable: brief.status === "PUBLISHED" ? false : brief.indexable,
        publishedAt: brief.status === "PUBLISHED" ? null : brief.publishedAt,
      },
    }),
    prisma.commerceEditorialRun.updateMany({
      where: { briefId: brief.id },
      data: {
        status: "REVIEW",
        step: "EDITORIAL_REVIEW",
        sourceUrl: productUrl.toString(),
        message: "URL do produto ajustada manualmente pelo operador. Artigo voltou para revisao antes de nova publicacao.",
        completedAt: new Date(),
      },
    }),
  ]);

  revalidateEditorialPaths(brief.id, brief.product.affiliateStore.slug, brief.slug);
}

export async function deleteEditorialArticle(formData: FormData) {
  const briefId = text(formData.get("briefId"));
  if (!briefId) throw new Error("Artigo nao informado");

  const brief = await prisma.seoBrief.findUnique({
    where: { id: briefId },
    include: {
      product: {
        include: {
          affiliateStore: { select: { slug: true } },
        },
      },
    },
  });
  if (!brief) throw new Error("Artigo nao encontrado");

  await prisma.$transaction([
    prisma.seoBrief.delete({ where: { id: brief.id } }),
    prisma.commerceEditorialRun.updateMany({
      where: { briefId: brief.id },
      data: {
        briefId: null,
        status: "SKIPPED",
        step: "EDITORIAL_REMOVED",
        message: "Artigo excluido manualmente pelo operador.",
        completedAt: new Date(),
      },
    }),
  ]);

  revalidateEditorialPaths(brief.id, brief.product.affiliateStore?.slug, brief.slug);
}
