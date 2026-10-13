# Contexto de build: raiz do repositório.
#   docker build -f apps/catalog/Dockerfile -t flex-catalog .
FROM node:24-bookworm-slim AS build
RUN npm install --global pnpm@12.3.4
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/catalog/package.json apps/catalog/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile --filter @flex/catalog...

COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/catalog apps/catalog
# Endereço público da API embutido no bundle Astro.
ARG PUBLIC_API_URL
ENV PUBLIC_API_URL=$PUBLIC_API_URL
RUN pnpm --filter @flex/catalog build \
 && pnpm --filter @flex/catalog deploy --legacy --prod /out \
 && cp -r apps/catalog/dist /out/

FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "dist/server/entry.mjs"]
