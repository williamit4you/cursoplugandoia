"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { runCommerceEditorialOnce } from "@/lib/commerce-editorial/pipeline";

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
  const briefId = String(formData.get("briefId") || "").trim();
  if (!briefId) throw new Error("Artigo não informado");
  const brief = await prisma.seoBrief.findUnique({
    where: { id: briefId },
    include: { product: { select: { affiliateStoreId: true } } },
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
  revalidatePath("/admin/editorial-commerce");
  revalidatePath(`/admin/editorial-commerce/${brief.id}`);
  revalidatePath("/sitemap.xml");
}
