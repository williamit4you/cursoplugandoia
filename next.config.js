/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "remotion",
    "@remotion/studio-shared",
    "@remotion/cli"
  ],
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
        "./node_modules/@remotion/**/*",
        "./node_modules/remotion/**/*",
        "./node_modules/puppeteer/**/*",
        "./node_modules/puppeteer-core/**/*",
        "./node_modules/@remotion/studio-shared/**/*",
        "./node_modules/@rspack/**/*",
        "./node_modules/webpack/**/*",
        "./node_modules/execa/**/*",
        "./node_modules/cross-spawn/**/*",
        "./node_modules/path-key/**/*",
        "./node_modules/shebang-command/**/*",
        "./node_modules/shebang-regex/**/*",
        "./node_modules/which/**/*",
        "./node_modules/isexe/**/*",
        "./node_modules/signal-exit/**/*",
        "./node_modules/puppeteer-core/**/*",
      ],
    },
  },
};

module.exports = nextConfig;
