"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  if (!storeSlug) redirect("/admin/programas-afiliados?error=Programa%20nao%20informado");

  try {
    await bootstrapAffiliateProgram(storeSlug);
    refresh();
    redirect(`/admin/programas-afiliados?ok=${encodeURIComponent(`Bootstrap concluído para ${storeSlug}`)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao executar bootstrap";
    redirect(`/admin/programas-afiliados?error=${encodeURIComponent(message)}`);
  }
}

export async function runAffiliateProgramNowAction(formData: FormData) {
  const storeSlug = value(formData, "storeSlug");
  if (!storeSlug) redirect("/admin/programas-afiliados?error=Programa%20nao%20informado");

  try {
    await runAffiliateProgramNow(storeSlug);
    refresh();
    redirect(`/admin/programas-afiliados?ok=${encodeURIComponent(`Execução concluída para ${storeSlug}`)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao executar programa";
    redirect(`/admin/programas-afiliados?error=${encodeURIComponent(message)}`);
  }
}
