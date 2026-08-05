import "server-only";

import { prisma } from "@/lib/prisma";
import type { PetSeoArticle } from "./agents";

function parse<T>(value: string | null | undefined, fallback: T): T {
  try { return JSON.parse(value || "") as T; } catch { return fallback; }
}

export async function getPublishedPetPage(path: string) {
  const page = await prisma.petContentPage.findFirst({
    where: { path, status: "PUBLISHED", indexable: true, contentJson: { not: null }, affiliateStore: { slug: "cobasi", status: "ACTIVE" } },
    include: { location: { include: { units: { where: { status: "ACTIVE", expiresAt: { gt: new Date() } }, orderBy: { name: "asc" } } } } },
  });
  if (!page) return null;
  const relatedPaths = parse<string[]>(page.internalLinksJson, []).map((item) => item.replace(/^\//, ""));
  const related = relatedPaths.length ? await prisma.petContentPage.findMany({ where: { path: { in: relatedPaths }, status: "PUBLISHED", indexable: true }, select: { path: true, title: true } }) : [];
  return { ...page, article: parse<PetSeoArticle>(page.contentJson, { eyebrow: "Guia Compra Esperta", intro: "", sections: [], faq: [], sourceNotes: [] }), related };
}

