import { Providers } from "@/components/Providers";
import { MetaPixelPageTracker } from "@/components/MetaPixelPageTracker";
import { MetaPixelScript } from "@/components/MetaPixelScript";
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
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="pt-BR">
      <body className="theme-light bg-[#f5f7fb] text-slate-900 antialiased min-h-screen">
        <MetaPixelScript pixelId={metaPixelId} />
        <Providers>
          <MetaPixelPageTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
