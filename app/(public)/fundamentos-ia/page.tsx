import type { Metadata } from "next";
import { FundamentosIaLanding } from "@/components/course-sales/FundamentosIaLanding";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

export const metadata: Metadata = {
  title: "Fundamentos de IA Generativa | Curso prático da Plugando IA",
  description: "Aprenda IA Generativa do zero e construa uma aplicação real com API de IA, contexto, Tools, Prisma, SQLite e agendamentos.",
  keywords: ["Fundamentos de IA Generativa", "curso de Inteligência Artificial", "curso IA Generativa", "aprender Inteligência Artificial", "aplicações com IA"],
  alternates: { canonical: "/fundamentos-ia" },
  openGraph: { title: "Do zero à sua primeira aplicação com Inteligência Artificial", description: "Fundamentos, prática e uma aplicação real com IA por R$ 79,90.", type: "website", url: "/fundamentos-ia" },
};

export default async function FundamentosIaPage() {
  const metaPixelId = await resolveSalesPageMetaPixelId("curso-fundamentos-ia", { preferEnvFallback: true });
  return <FundamentosIaLanding metaPixelId={metaPixelId || undefined} />;
}
