# Contexto de build: raiz do repositório.
#   docker build -f apps/dashboard/Dockerfile -t flex-dashboard .
FROM node:24-bookworm-slim AS build
RUN npm install --global pnpm@12.3.4
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile --filter @flex/dashboard...

COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/dashboard apps/dashboard
RUN pnpm --filter @flex/dashboard build

FROM nginx:1.29-alpine
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/dashboard/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
