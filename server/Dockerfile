FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM build AS migration

CMD ["npx", "prisma", "migrate", "deploy"]

FROM build AS production-dependencies

RUN npm prune --omit=dev

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=production-dependencies --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=production-dependencies --chown=node:node /app/dist ./dist

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/health || exit 1

CMD ["node", "dist/server.js"]
