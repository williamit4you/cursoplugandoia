FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

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

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json

COPY app ./app
COPY components ./components
COPY lib ./lib
COPY prisma ./prisma
COPY public ./public
COPY middleware.ts ./middleware.ts
COPY next-env.d.ts ./next-env.d.ts
COPY next.config.js ./next.config.js
COPY postcss.config.js ./postcss.config.js
COPY prisma.config.ts ./prisma.config.ts
COPY tailwind.config.ts ./tailwind.config.ts
COPY tsconfig.json ./tsconfig.json

RUN npx prisma generate

RUN npm run build

RUN npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ARG INSTALL_CHROMIUM=0
RUN if [ "$INSTALL_CHROMIUM" = "1" ]; then \
      apk add --no-cache \
        chromium \
        nss \
        freetype \
        harfbuzz \
        ca-certificates \
        ttf-freefont \
        libc6-compat ; \
    else \
      apk add --no-cache \
        ca-certificates \
        libc6-compat ; \
    fi

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV REMOTION_CHROME_BIN=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/which ./node_modules/which
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
