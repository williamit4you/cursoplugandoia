import type { Metadata } from "next";
import { VibeCodeLanding } from "@/components/course-sales/VibeCodeLanding";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

const pageKey = "vibecode";

export const metadata: Metadata = {
  title: "Vibe Coding para Leigos | Crie Aplicações com IA",
  description: "Aprenda a transformar suas ideias em aplicações utilizando Inteligência Artificial, mesmo sem saber programar.",
  alternates: { canonical: "/vibecode" },
  openGraph: {
    title: "Vibe Coding para Leigos | Crie Aplicações com IA",
    description: "Da ideia à aplicação: aprenda um processo simples para planejar, construir, testar e publicar com IA.",
    type: "website",
    locale: "pt_BR",
    url: "/vibecode",
  },
};

export default async function VibeCodePage() {
  const metaPixelId = await resolveSalesPageMetaPixelId(pageKey, { preferEnvFallback: true });
  const checkoutUrl = process.env.NEXT_PUBLIC_VIBECODE_CHECKOUT_URL?.trim() || "https://pay.hotmart.com/W107908356O";
  return <VibeCodeLanding checkoutUrl={checkoutUrl} metaPixelId={metaPixelId || undefined} />;
}
