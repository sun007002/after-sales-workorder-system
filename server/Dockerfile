# 注意：基础镜像必须是 node:20-slim（Debian），不能用 node:*-alpine。
# Alpine 用 musl libc，Prisma 的 schema engine 无法探测 libssl 版本，
# 会在 `prisma db push` 阶段报 "Could not parse schema engine response"
# 并使容器陷入崩溃重启循环。

# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app
# Prisma 引擎依赖 openssl，node:*-slim 未预装
RUN apt-get update && apt-get install -y --no-install-recommends \
        openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
        openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
# 工单附件目录，生产环境需挂载卷到宿主机以免容器重建后丢失
RUN mkdir -p /app/uploads
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && node dist/server.js"]
