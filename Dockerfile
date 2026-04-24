FROM node:20-alpine AS base

# Install system dependencies for Remotion
# We need ffmpeg for video encoding, and chromium + fonts for rendering frames
RUN apk add --no-cache \
    ffmpeg \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libc6-compat

# Tell Remotion/Puppeteer where the browser is
ENV REMOTION_CHROME_BIN=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# --- INÍCIO DA CORREÇÃO ---
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

# --- VARIÁVEIS DO MINIO ADICIONADAS AQUI ---
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
# --- FIM DA CORREÇÃO ---

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 1. Gera o Prisma Client antes do Build
RUN npx prisma generate

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# --- A GARANTIA DEFINITIVA ---
# 1. Copia o Prisma Client e a Engine (o standalone SEMPRE esquece de copiar a engine)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# 2. Copia explicitamente os pacotes que o Remotion precisa para rodar o vídeo
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/execa ./node_modules/execa
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/which ./node_modules/which
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/cross-spawn ./node_modules/cross-spawn
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/path-key ./node_modules/path-key
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/shebang-command ./node_modules/shebang-command
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/shebang-regex ./node_modules/shebang-regex
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/isexe ./node_modules/isexe

# Fallback: garante `node_modules` completo no runtime (evita faltar deps transitivas em produção).
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]