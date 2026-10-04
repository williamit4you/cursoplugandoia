FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

ARG NEXTAUTH_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL

ARG PORTAL_SITE_URL
ENV PORTAL_SITE_URL=$PORTAL_SITE_URL

ARG COMMERCE_SITE_URL
ENV COMMERCE_SITE_URL=$COMMERCE_SITE_URL

ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

ARG FASTAPI_URL
ENV FASTAPI_URL=$FASTAPI_URL

ARG WORKER_FASTAPI_BASE_URL
ENV WORKER_FASTAPI_BASE_URL=$WORKER_FASTAPI_BASE_URL

ARG ADMIN_EMAIL
ENV ADMIN_EMAIL=$ADMIN_EMAIL

ARG MINIO_ENDPOINT
ENV MINIO_ENDPOINT=$MINIO_ENDPOINT

ARG MINIO_BUCKET_NAME
ENV MINIO_BUCKET_NAME=$MINIO_BUCKET_NAME

ARG MINIO_PUBLIC_URL
ENV MINIO_PUBLIC_URL=$MINIO_PUBLIC_URL

COPY package.json package-lock.json ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY prisma ./prisma
COPY public ./public
COPY middleware.ts ./middleware.ts
COPY instrumentation.ts ./instrumentation.ts
COPY next-env.d.ts ./next-env.d.ts
COPY next.config.js ./next.config.js
COPY postcss.config.js ./postcss.config.js
COPY prisma.config.ts ./prisma.config.ts
COPY tailwind.config.ts ./tailwind.config.ts
COPY tsconfig.json ./tsconfig.json

RUN npm ci --no-audit --no-fund \
    && npx prisma generate \
    && npm run build \
    && npm cache clean --force \
    && rm -rf node_modules /root/.npm

FROM node:22-bookworm-slim AS runner
WORKDIR /app

# A dependência explícita do estágio builder evita que Chromium e npm ci
# consumam espaço em disco simultaneamente durante o build.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=1001:1001 /app/.next/standalone ./
COPY --from=builder --chown=1001:1001 /app/.next/static ./.next/static

ARG FASTAPI_URL
ENV FASTAPI_URL=$FASTAPI_URL

ARG WORKER_FASTAPI_BASE_URL
ENV WORKER_FASTAPI_BASE_URL=$WORKER_FASTAPI_BASE_URL

ARG INSTALL_CHROMIUM=0
ARG INSTALL_TIKTOK_UPLOADER=1
ENV TIKTOK_UPLOADER_VENV=/opt/tiktok-uploader-venv
RUN rm -rf /var/lib/apt/lists/* \
    && apt-get -o Acquire::Retries=5 update \
    && apt-get -o Acquire::Retries=5 install -y --no-install-recommends \
      ca-certificates \
    && if [ "$INSTALL_CHROMIUM" = "1" ] || [ "$INSTALL_TIKTOK_UPLOADER" = "1" ]; then \
      apt-get -o Acquire::Retries=5 install -y --no-install-recommends \
        python3 \
        python3-venv \
        chromium ; \
    fi \
    && rm -rf /var/lib/apt/lists/*

RUN if [ "$INSTALL_TIKTOK_UPLOADER" = "1" ]; then \
      python3 -m venv "$TIKTOK_UPLOADER_VENV" \
      && "$TIKTOK_UPLOADER_VENV/bin/pip" install --no-cache-dir --upgrade pip \
      && "$TIKTOK_UPLOADER_VENV/bin/pip" install --no-cache-dir "tiktok-uploader==1.2.0" ; \
    fi

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
ENV REMOTION_CHROME_BIN=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV TIKTOK_UPLOADER_BROWSER=chromium
ENV TIKTOK_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
ENV PATH="/opt/tiktok-uploader-venv/bin:${PATH}"
ENV HOME=/home/nextjs
ENV XDG_CONFIG_HOME=/home/nextjs/.config
ENV XDG_CACHE_HOME=/home/nextjs/.cache
ENV XDG_RUNTIME_DIR=/tmp/runtime-nextjs

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN mkdir -p /home/nextjs/.config /home/nextjs/.cache /tmp/runtime-nextjs \
    && chown -R nextjs:nodejs /home/nextjs /tmp/runtime-nextjs \
    && chmod 700 /tmp/runtime-nextjs

# Evita embutir segredos do build dentro da imagem (o "standalone" pode conter `.env`)
RUN rm -f .env

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
