import { Providers } from "@/components/Providers";
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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
