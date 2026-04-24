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
      ],
    },
  },
};

module.exports = nextConfig;
