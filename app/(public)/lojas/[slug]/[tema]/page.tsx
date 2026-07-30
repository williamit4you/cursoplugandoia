import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const RETIRED_GENERIC_TOPICS = new Set([
  "guia-de-compras",
  "como-escolher",
  "ideias-e-inspiracoes",
  "antes-de-comprar",
  "ofertas-e-novidades",
]);

export default async function RetiredStoreArticlePage({
  params,
}: {
  params: { slug: string; tema: string };
}) {
  if (!RETIRED_GENERIC_TOPICS.has(params.tema)) notFound();

  const store = await prisma.affiliateStore.findFirst({
    where: { slug: params.slug, status: "ACTIVE" },
    select: { slug: true },
  });
  if (!store) notFound();

  permanentRedirect(`/lojas/${store.slug}`);
}
