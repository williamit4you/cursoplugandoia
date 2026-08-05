"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { bootstrapPetSeoProgram } from "@/lib/pet-seo/bootstrap";
import { runPetSeoOnce, validatePetPageForPublication } from "@/lib/pet-seo/pipeline";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function refresh(path?: string) {
  revalidatePath("/admin/seo-pet-cobasi");
  revalidatePath("/sitemap.xml");
  if (path) revalidatePath(`/${path}`);
}

export async function bootstrapPetSeo() {
  await bootstrapPetSeoProgram();
  refresh();
}

export async function runPetSeoNow() {
  await runPetSeoOnce({ force: true }).catch((error) => console.error("[runPetSeoNow]", error));
  refresh();
}

export async function togglePetSeo() {
  const current = await prisma.petSeoConfig.findUnique({ where: { id: "cobasi" } });
  await prisma.petSeoConfig.upsert({ where: { id: "cobasi" }, update: { enabled: !current?.enabled }, create: { id: "cobasi", enabled: true } });
  refresh();
}

export async function updatePetSeoCadence(formData: FormData) {
  const runEveryHours = Math.min(168, Math.max(1, Number(value(formData, "runEveryHours")) || 24));
  const maxItemsPerRun = Math.min(5, Math.max(1, Number(value(formData, "maxItemsPerRun")) || 1));
  await prisma.petSeoConfig.upsert({ where: { id: "cobasi" }, update: { runEveryHours, maxItemsPerRun }, create: { id: "cobasi", runEveryHours, maxItemsPerRun } });
  refresh();
}

export async function queuePetContent(formData: FormData) {
  const pageId = value(formData, "pageId");
  const page = await prisma.petContentPage.findUnique({ where: { id: pageId }, include: { location: true } });
  if (!page) throw new Error("Pauta não encontrada");
  if (page.type === "LOCAL" && page.location?.status !== "VERIFIED") throw new Error("Verifique a cidade antes de colocá-la na fila");
  await prisma.petContentPage.update({ where: { id: page.id }, data: { status: "QUEUED", indexable: false, publishedAt: null, scheduledAt: new Date(), lastError: null } });
  refresh(page.path);
}

export async function publishPetContent(formData: FormData) {
  const pageId = value(formData, "pageId");
  const page = await validatePetPageForPublication(pageId);
  const publishedAt = page.publishedAt || new Date();
  await prisma.petContentPage.update({ where: { id: page.id }, data: { status: "PUBLISHED", indexable: true, publishedAt, reviewedAt: new Date(), lastError: null } });
  await prisma.petSeoRun.updateMany({ where: { pageId: page.id }, data: { status: "PUBLISHED", step: "MANUAL_PUBLISH", message: "Revisado e publicado manualmente; liberado para o sitemap", completedAt: new Date() } });
  refresh(page.path);
}

export async function unpublishPetContent(formData: FormData) {
  const pageId = value(formData, "pageId");
  const page = await prisma.petContentPage.findUniqueOrThrow({ where: { id: pageId } });
  await prisma.petContentPage.update({ where: { id: page.id }, data: { status: "REVIEW", indexable: false, publishedAt: null } });
  refresh(page.path);
}

export async function verifyPetLocation(formData: FormData) {
  const locationId = value(formData, "locationId");
  const sourceUrl = value(formData, "sourceUrl");
  const unitName = value(formData, "unitName");
  const address = value(formData, "address");
  const facts = value(formData, "facts");
  if (!locationId || !sourceUrl || !unitName || !address) throw new Error("Informe fonte, nome e endereço da unidade");
  const parsed = new URL(sourceUrl);
  if (parsed.protocol !== "https:") throw new Error("A fonte precisa usar HTTPS");
  const store = await prisma.affiliateStore.findUnique({ where: { slug: "cobasi" } });
  if (!store || store.status !== "ACTIVE") throw new Error("Cobasi não está ativa");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 86400_000);
  await prisma.$transaction([
    prisma.petLocation.update({ where: { id: locationId }, data: { status: "VERIFIED", sourceUrl, factsJson: JSON.stringify({ notes: facts }), verifiedAt: now, expiresAt } }),
    prisma.petStoreUnit.create({ data: { locationId, affiliateStoreId: store.id, name: unitName, address, sourceUrl, verifiedAt: now, expiresAt } }),
  ]);
  refresh();
}

