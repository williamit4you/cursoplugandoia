/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  eslint: {
    // Ignorar linting no build para economizar memória (já validado no dev)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar erros de TS no build se necessário para economizar RAM
    // mas mantemos false para garantir qualidade, a menos que o OOM persista.
    ignoreBuildErrors: false,
  },
  experimental: {
    outputFileTracingIncludes: {
      "/**/*": [
        "./node_modules/puppeteer-core/**/*",
        "./node_modules/puppeteer/**/*"
      ],
    },
  },
};

module.exports = nextConfig;
