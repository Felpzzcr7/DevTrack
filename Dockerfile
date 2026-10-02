# ---------- 1) build do frontend (Vite) ----------
FROM node:22-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- 2) dependências do backend ----------
# sqlite3 e bcrypt são módulos nativos; as ferramentas de compilação só entram aqui
# como plano B caso não exista binário pronto para a plataforma.
FROM node:22-bookworm-slim AS backend-deps
WORKDIR /app/backend
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm ci --omit=dev

# ---------- 3) imagem final ----------
FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/devtrack.db
WORKDIR /app/backend
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/ ./
COPY --from=frontend /app/frontend/dist /app/frontend/dist
RUN mkdir -p /data
# /data precisa ser um volume/disco persistente na hospedagem (é onde o SQLite fica)
EXPOSE 3000
CMD ["node", "server.js"]
