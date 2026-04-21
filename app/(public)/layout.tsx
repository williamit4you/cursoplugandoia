import { Providers } from "@/components/Providers";
import "./../globals.css";

export const metadata = {
  title: "Portal de Inteligência Estratégica",
  description: "As melhores notícias e cursos diários focados em Inteligência Artificial, LLMs, Langchain e automações.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0b0c10] text-gray-100 antialiased min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
