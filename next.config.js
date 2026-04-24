/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    outputFileTracingIncludes: {
      "/**/*": [
        "./node_modules/@remotion/bundler/**/*",
        "./node_modules/@remotion/renderer/**/*",
        "./node_modules/remotion/**/*",
        "./node_modules/puppeteer/**/*",
      ],
    },
  },
};

module.exports = nextConfig;
