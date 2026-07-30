import { Providers } from "@/components/Providers";
import CommerceAnalyticsTracker from "@/components/CommerceAnalyticsTracker";
import { hostnameFromSiteUrl, getCommerceSiteUrl } from "@/lib/siteUrls";
import "./../globals.css";

export const metadata = {
  title: "Portal de Inteligência Estratégica",
  description: "As melhores notícias e cursos diários focados em Inteligência Artificial, LLMs, Langchain e automações.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const commerceHostname = hostnameFromSiteUrl(getCommerceSiteUrl());
  return (
    <html lang="pt-BR" className="dark">
      <body className="theme-dark bg-[#0b0c10] text-gray-100 antialiased min-h-screen">
        <Providers>
          <CommerceAnalyticsTracker commerceHostname={commerceHostname} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
