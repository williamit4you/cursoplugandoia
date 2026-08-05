import "server-only";

import { prisma } from "@/lib/prisma";
import { AFFILIATE_PROGRAMS, getAffiliateProgram, type AffiliateProgramSpec } from "@/lib/affiliatePrograms";
import { runCommerceEditorialOnce } from "@/lib/commerce-editorial/pipeline";
import { bootstrapPetSeoProgram } from "@/lib/pet-seo/bootstrap";
import { runPetSeoOnce } from "@/lib/pet-seo/pipeline";

export type AffiliateProgramSummary = {
  spec: AffiliateProgramSpec;
  store: {
    id: string;
    name: string;
    slug: string;
    category: string;
    status: string;
    complianceClass: string;
    updatedAt: Date;
    clickCount: number;
    clickCount7d: number;
    clickCount30d: number;
  } | null;
  support: {
    bootstrap: boolean;
    runNow: boolean;
    cron: boolean;
  };
  runtime: {
    configStatus: string | null;
    cadenceLabel: string | null;
    queueCount: number;
    reviewCount: number;
    publishedCount: number;
    localUnits: number;
    locations: number;
    nextRunAt: Date | null;
    lastRunAt: Date | null;
  };
};

export async function listAffiliateProgramSummaries(): Promise<AffiliateProgramSummary[]> {
  const now = new Date();
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [stores, clicks7d, clicks30d, petConfig, petPagesByStatus, petLocations, petUnits, editorialRows] = await Promise.all([
    prisma.affiliateStore.findMany({
      where: { slug: { in: AFFILIATE_PROGRAMS.map((item) => item.storeSlug) } },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        status: true,
        complianceClass: true,
        updatedAt: true,
        _count: { select: { clicks: true } },
      },
    }),
    prisma.affiliateStoreClick.groupBy({
      by: ["storeId"],
      where: { createdAt: { gte: last7d } },
      _count: { _all: true },
    }),
    prisma.affiliateStoreClick.groupBy({
      by: ["storeId"],
      where: { createdAt: { gte: last30d } },
      _count: { _all: true },
    }),
    prisma.petSeoConfig.findUnique({ where: { id: "cobasi" } }),
    prisma.petContentPage.groupBy({
      by: ["status"],
      where: { affiliateStore: { slug: "cobasi" } },
      _count: { _all: true },
    }),
    prisma.petLocation.count(),
    prisma.petStoreUnit.count({ where: { affiliateStore: { slug: "cobasi" }, status: "ACTIVE" } }),
    prisma.seoBrief.findMany({
      where: {
        product: {
          affiliateStore: {
            slug: { in: AFFILIATE_PROGRAMS.map((item) => item.storeSlug).filter((slug) => slug !== "cobasi") },
          },
        },
      },
      select: {
        status: true,
        product: { select: { affiliateStore: { select: { slug: true } } } },
      },
    }),
  ]);

  const clickMap7d = new Map(clicks7d.map((row) => [row.storeId, row._count._all]));
  const clickMap30d = new Map(clicks30d.map((row) => [row.storeId, row._count._all]));

  const storeMap = new Map(
    stores.map((store) => [
      store.slug,
      {
        id: store.id,
        name: store.name,
        slug: store.slug,
        category: store.category,
        status: store.status,
        complianceClass: store.complianceClass,
        updatedAt: store.updatedAt,
        clickCount: store._count.clicks,
        clickCount7d: Number(clickMap7d.get(store.id) || 0),
        clickCount30d: Number(clickMap30d.get(store.id) || 0),
      },
    ]),
  );
  const petTotals = Object.fromEntries(petPagesByStatus.map((row) => [row.status, row._count._all]));
  const editorialCountsByStore = new Map<string, { queueCount: number; reviewCount: number; publishedCount: number }>();
  for (const row of editorialRows) {
    const storeSlug = row.product.affiliateStore?.slug;
    if (!storeSlug) continue;
    const current = editorialCountsByStore.get(storeSlug) || { queueCount: 0, reviewCount: 0, publishedCount: 0 };
    if (row.status === "DRAFT" || row.status === "APPROVED") current.queueCount += 1;
    if (row.status === "REVIEW") current.reviewCount += 1;
    if (row.status === "PUBLISHED") current.publishedCount += 1;
    editorialCountsByStore.set(storeSlug, current);
  }

  return AFFILIATE_PROGRAMS.map((spec) => {
    const isCobasi = spec.storeSlug === "cobasi";
    const isElectrolux = spec.storeSlug === "electrolux";
    const isBrascol = spec.storeSlug === "brascol";
    const isTng = spec.storeSlug === "tng";
    const editorialCounts = editorialCountsByStore.get(spec.storeSlug) || { queueCount: 0, reviewCount: 0, publishedCount: 0 };
    return {
      spec,
      store: storeMap.get(spec.storeSlug) || null,
      support: {
        bootstrap: isCobasi,
        runNow: isCobasi || isElectrolux || isBrascol || isTng,
        cron: isCobasi,
      },
      runtime: {
        configStatus: isCobasi ? (petConfig?.enabled ? "ACTIVE" : "PAUSED") : (isElectrolux || isBrascol || isTng) ? "ACTIVE" : null,
        cadenceLabel: isCobasi ? `${petConfig?.runEveryHours || 24}h / ${petConfig?.maxItemsPerRun || 1} item(ns)` : (isElectrolux || isBrascol || isTng) ? "Sob demanda via pipeline editorial" : null,
        queueCount: isCobasi ? Number(petTotals.QUEUED || 0) + Number(petTotals.GENERATING || 0) : editorialCounts.queueCount,
        reviewCount: isCobasi ? Number(petTotals.REVIEW || 0) : editorialCounts.reviewCount,
        publishedCount: isCobasi ? Number(petTotals.PUBLISHED || 0) : editorialCounts.publishedCount,
        localUnits: isCobasi ? petUnits : 0,
        locations: isCobasi ? petLocations : 0,
        nextRunAt: isCobasi ? petConfig?.nextRunAt || null : null,
        lastRunAt: isCobasi ? petConfig?.lastRunAt || null : null,
      },
    };
  });
}

export async function bootstrapAffiliateProgram(storeSlug: string) {
  const spec = getAffiliateProgram(storeSlug);
  if (!spec) throw new Error("Programa afiliado nao encontrado");
  if (storeSlug === "cobasi") return bootstrapPetSeoProgram();
  throw new Error(`Bootstrap ainda nao implementado para ${spec.displayName}`);
}

export async function runAffiliateProgramNow(storeSlug: string) {
  const spec = getAffiliateProgram(storeSlug);
  if (!spec) throw new Error("Programa afiliado nao encontrado");
  if (storeSlug === "cobasi") return runPetSeoOnce({ force: true });
  if (storeSlug === "electrolux") return runCommerceEditorialOnce({ force: true, storeSlug });
  if (storeSlug === "brascol") return runCommerceEditorialOnce({ force: true, storeSlug });
  if (storeSlug === "tng") return runCommerceEditorialOnce({ force: true, storeSlug });
  throw new Error(`Execucao ainda nao implementada para ${spec.displayName}`);
}

export async function runAffiliateProgramsCron() {
  const summaries = await listAffiliateProgramSummaries();
  const results: Array<Record<string, unknown>> = [];

  for (const summary of summaries) {
    if (!summary.support.cron) {
      results.push({ storeSlug: summary.spec.storeSlug, skipped: true, reason: "cron_not_implemented" });
      continue;
    }

    if (summary.spec.storeSlug === "cobasi") {
      const result = await runPetSeoOnce();
      results.push({ storeSlug: summary.spec.storeSlug, ...result });
      continue;
    }

    results.push({ storeSlug: summary.spec.storeSlug, skipped: true, reason: "handler_missing" });
  }

  return { ok: true, ranAt: new Date().toISOString(), results };
}
