FROM node:24-alpine AS builder
WORKDIR /app

# Copier d'abord les fichiers de config et sources AVANT npm install
COPY package*.json tsconfig.json next.config.ts postcss.config.mjs ./
COPY src ./src
COPY public ./public
COPY prisma ./prisma

# Installer et générer
RUN npm ci
RUN npx prisma generate

# Builder (le prefixe doit exister des le build : il est fige dans le HTML)
ARG NEXT_PUBLIC_BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
RUN npm run build

# Runtime
FROM node:24-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
# `next start` relit next.config.ts au démarrage : sans ce fichier dans l'image
# finale, la config est perdue au runtime (dont serverExternalPackages, qui
# garde pdfkit hors du bundle pour qu'il retrouve ses métriques de polices).
COPY --from=builder /app/next.config.ts ./
ARG NEXT_PUBLIC_BASE_PATH=""
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
EXPOSE 3000
