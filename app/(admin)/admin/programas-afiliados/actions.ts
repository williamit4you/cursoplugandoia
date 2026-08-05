"use server";

import { revalidatePath } from "next/cache";
import { bootstrapAffiliateProgram, runAffiliateProgramNow } from "@/lib/affiliate-programs/operations";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function refresh() {
  revalidatePath("/admin/programas-afiliados");
  revalidatePath("/admin/seo-pet-cobasi");
  revalidatePath("/sitemap.xml");
}

export async function bootstrapAffiliateProgramAction(formData: FormData) {
  const storeSlug = value(formData, "storeSlug");
  if (!storeSlug) throw new Error("Programa nao informado");
  await bootstrapAffiliateProgram(storeSlug);
  refresh();
}

export async function runAffiliateProgramNowAction(formData: FormData) {
  const storeSlug = value(formData, "storeSlug");
  if (!storeSlug) throw new Error("Programa nao informado");
  await runAffiliateProgramNow(storeSlug);
  refresh();
}
