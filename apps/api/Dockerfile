# Contexto de build: raiz do repositório.
#   docker build -f apps/api/Dockerfile -t flex-api .
FROM node:24-bookworm-slim AS build
RUN npm install --global pnpm@12.3.4
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile --filter @flex/api...

COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @flex/api build \
 && pnpm --filter @flex/api deploy --legacy --prod /out \
 && cp -r apps/api/dist apps/api/drizzle /out/

FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/v1/health/live').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
# Migrações: executar `node dist/migrate.js` antes de iniciar uma nova versão.
CMD ["node", "dist/server.js"]
