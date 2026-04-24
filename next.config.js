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
        "./node_modules/which/**/*",
        "./node_modules/isexe/**/*",
        "./node_modules/signal-exit/**/*",
        "./node_modules/puppeteer-core/**/*",
      ],
    },
  },
};

module.exports = nextConfig;
