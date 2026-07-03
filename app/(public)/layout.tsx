import { Providers } from "@/components/Providers";
import { MetaPixelPageTracker } from "@/components/MetaPixelPageTracker";
import { MetaPixelScript } from "@/components/MetaPixelScript";
import "./../globals.css";

export const metadata = {
  title: "Portal de Inteligência Estratégica",
  description: "As melhores notícias e cursos diários focados em Inteligência Artificial, LLMs, Langchain e automações.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="pt-BR" className="dark">
      <body className="theme-dark bg-[#0b0c10] text-gray-100 antialiased min-h-screen">
        <MetaPixelScript pixelId={metaPixelId} />
        <Providers>
          <MetaPixelPageTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
