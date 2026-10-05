import type { Metadata } from "next";
import { FormacaoCompletaLanding } from "@/components/course-sales/FormacaoCompletaLanding";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

const pageKey = "formacao-completa";

export const metadata: Metadata = {
  title: "Formação Completa Plugando IA | 4 cursos com acesso vitalício",
  description: "Arquitetura de Software, RabbitMQ com .NET, Fundamentos de IA Generativa e SaaS com Antigravity por R$ 149,90, com acesso vitalício, futuras atualizações e garantia de 7 dias.",
  alternates: { canonical: "/formacao-completa" },
  openGraph: {
    title: "Formação Completa Plugando IA — 4 cursos por R$ 149,90",
    description: "Quatro cursos para aprender arquitetura, mensageria, IA Generativa e construção de SaaS.",
    type: "website",
    locale: "pt_BR",
    url: "/formacao-completa",
    images: [{ url: "/images/formacao-completa-combo.png", width: 1060, height: 431, alt: "Os quatro cursos da Formação Completa Plugando IA" }],
  },
};

export default async function FormacaoCompletaPage() {
  const metaPixelId = await resolveSalesPageMetaPixelId(pageKey, { preferEnvFallback: true });
  const checkoutUrl = process.env.NEXT_PUBLIC_FORMACAO_COMPLETA_CHECKOUT_URL?.trim() || "https://pay.hotmart.com/T107895423M";
  return <FormacaoCompletaLanding checkoutUrl={checkoutUrl} metaPixelId={metaPixelId || undefined} />;
}
