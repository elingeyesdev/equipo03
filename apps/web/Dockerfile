# Build context debe ser la raíz del monorepo (equipo03-2/)
# docker-compose lo configura con: context: ../ dockerfile: apps/web/Dockerfile

# ─── Stage 1: Builder ─────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Manifiestos del workspace raíz y paquetes — capa de caché separada
COPY package*.json ./
COPY packages/core/package.json ./packages/core/
COPY apps/web/package.json ./apps/web/

# Instala todas las dependencias del workspace (crea symlinks de packages/core)
RUN npm ci --ignore-scripts

# geolib es importado por packages/core pero no está en sus dependencies.
# --no-save instala solo en node_modules sin modificar ningún archivo fuente.
RUN npm install geolib --ignore-scripts --no-save

# Copia el código fuente
COPY packages/core ./packages/core
COPY apps/web ./apps/web

# tsc -b se omite: incompatibilidades de tipos entre tsconfig del web (TS 5.9)
# y packages/core (TS 5.0). Vite usa esbuild internamente y no requiere tsc limpio.
WORKDIR /app/apps/web
RUN npx vite build

# ─── Stage 2: Production (Nginx) ──────────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# nginx.conf copiado desde el contexto del monorepo
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
