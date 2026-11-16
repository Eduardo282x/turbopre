# syntax=docker/dockerfile:1

# ============================================================
# TurboPre — Frontend (Vite + React + pnpm monorepo)
# Build context: repository root
# ============================================================

FROM node:22-alpine AS build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm@11.21.0

WORKDIR /app

# Workspace manifests first, so dependency installation is cached separately
# from the application source.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install only the frontend and its workspace dependency. The backend is not
# needed to build the static site.
RUN pnpm install --frozen-lockfile --filter frontend --filter @turbopre/shared

COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend

# Vite reads VITE_* variables at build time. Leave empty for the preview.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @turbopre/shared build \
  && pnpm --filter frontend build

# ------------------------------------------------------------
# Runtime: static files served by Nginx
# ------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

RUN rm -f /etc/nginx/conf.d/default.conf

COPY docker/nginx.frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
