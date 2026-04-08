import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plugando IA — Aprenda IA na prática e crie projetos que vendem",
  description:
    "Curso online para devs que querem dominar automação (n8n), agentes de IA e Next.js para criar chatbots, apps e um SaaS completo com IA + pagamento + deploy.",
  metadataBase: new URL("https://plugandoia.com"),
  openGraph: {
    title: "Plugando IA",
    description:
      "Aprenda IA na prática: automações com n8n, agentes com memória e tools, Next.js completo e um SaaS com IA do zero ao deploy.",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Plugando IA",
    description: "IA na prática para devs: automação, agentes e Next.js para construir projetos reais."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

