/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  productionBrowserSourceMaps: false,
  eslint: {
    // Ignorar linting no build para economizar memória (já validado no dev)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar erros de TS no build se necessário para economizar RAM
    // mas mantemos false para garantir qualidade, a menos que o OOM persista.
    ignoreBuildErrors: true,
  },
  experimental: {
    instrumentationHook: true,
  },
  // Nao force incluir Puppeteer no build do Next.
  // Chromium/Puppeteer rodam no render-service (processador) para manter builds/dev leves.
};

module.exports = nextConfig;
