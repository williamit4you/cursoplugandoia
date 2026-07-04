import { Providers } from "@/components/Providers";
import { MetaPixelPageTracker } from "@/components/MetaPixelPageTracker";
import { MetaPixelScript } from "@/components/MetaPixelScript";
import { META_PIXEL_ID } from "@/lib/metaPixelConfig";
import "./../globals.css"; // Usa os estios globais base

export const metadata = {
  title: "Admin - Portal IA",
  description: "Área administrativa do Portal de Notícias IA",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="theme-light bg-[#f5f7fb] text-slate-900 antialiased min-h-screen">
        <MetaPixelScript pixelId={META_PIXEL_ID} />
        <Providers>
          <MetaPixelPageTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
