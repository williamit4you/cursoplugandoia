FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

ARG NEXTAUTH_SECRET
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

ARG NEXTAUTH_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL

ARG FASTAPI_URL
ENV FASTAPI_URL=$FASTAPI_URL

ARG ADMIN_EMAIL
ENV ADMIN_EMAIL=$ADMIN_EMAIL

ARG ADMIN_PASSWORD
ENV ADMIN_PASSWORD=$ADMIN_PASSWORD

ARG MINIO_ENDPOINT
ENV MINIO_ENDPOINT=$MINIO_ENDPOINT

ARG MINIO_ACCESS_KEY
ENV MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY

ARG MINIO_SECRET_KEY
ENV MINIO_SECRET_KEY=$MINIO_SECRET_KEY

ARG MINIO_BUCKET_NAME
ENV MINIO_BUCKET_NAME=$MINIO_BUCKET_NAME

ARG MINIO_PUBLIC_URL
ENV MINIO_PUBLIC_URL=$MINIO_PUBLIC_URL

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

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

RUN npx prisma generate

RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ARG INSTALL_CHROMIUM=0
ARG INSTALL_TIKTOK_UPLOADER=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV TIKTOK_UPLOADER_VENV=/opt/tiktok-uploader-venv
RUN if [ "$INSTALL_CHROMIUM" = "1" ] || [ "$INSTALL_TIKTOK_UPLOADER" = "1" ]; then \
      apt-get update && \
      apt-get install -y --no-install-recommends \
        python3 \
        python3-venv \
        python3-pip \
        chromium \
        xvfb \
        xauth \
        libnss3 \
        libfreetype6 \
        libharfbuzz0b \
        ca-certificates \
        fonts-freefont-ttf ; \
    else \
      apt-get update && \
      apt-get install -y --no-install-recommends \
        ca-certificates ; \
    fi \
    && rm -rf /var/lib/apt/lists/* \
    && if [ "$INSTALL_TIKTOK_UPLOADER" = "1" ]; then \
      python3 -m venv "$TIKTOK_UPLOADER_VENV" && \
      "$TIKTOK_UPLOADER_VENV/bin/pip" install --no-cache-dir --upgrade pip && \
      "$TIKTOK_UPLOADER_VENV/bin/pip" install --no-cache-dir tiktok-uploader playwright && \
      "$TIKTOK_UPLOADER_VENV/bin/python" -m playwright install chromium && \
      chmod -R a+rX /ms-playwright ; \
    fi

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
ENV REMOTION_CHROME_BIN=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV TIKTOK_UPLOADER_BROWSER=chromium
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

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Evita embutir segredos do build dentro da imagem (o "standalone" pode conter `.env`)
RUN rm -f .env

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
