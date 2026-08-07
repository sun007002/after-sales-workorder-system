# NAS 生产部署手册

> 目标环境：绿联 NAS (192.168.11.100)，全部服务 host 网络模式
> 最后验证：2026-08-05 v2 增量需求上线

## 一、环境拓扑

| 容器 | 端口 | 说明 |
|------|------|------|
| `workorder-mysql` | 3307 | MySQL 8.0，库名 `workorder_db` |
| `workorder-server` | 3100 | Express + Prisma |
| `workorder-client` | 8080 | Nginx 静态站 + 反向代理 |

访问地址：<http://192.168.11.100:8080>，默认账号 `admin` / `admin123`

源码目录：`/home/sun007002/server`、`/home/sun007002/client`
附件持久化：`/home/sun007002/uploads` → 挂载至容器 `/app/uploads`
备份目录：`/home/sun007002/backup`

## 二、六个必须遵守的环境约束

这些坑每一个都曾导致部署失败，务必逐条检查。

### 1. `docker build` 必须加 `--network host`

宿主机 `/etc/resolv.conf` 首行是 `nameserver 127.0.0.1`（本机 nestingdns 容器 + 代理，
返回 fake-IP `198.18.x.x`）。docker 默认 bridge 网络会剥掉 `127.0.0.1` 这条记录，
导致构建容器内所有 npm 请求失败：

```
npm error code EAI_AGAIN
npm error request to https://registry.npmjs.org/... getaddrinfo EAI_AGAIN
```

症状具有迷惑性：`npm ci` 可能仍标记 DONE，但实际没装上包，
后续报 `sh: tsc: not found` 或 `npx prisma` 去联网下载。

**正确做法**：`docker build --network host -t <image> .`
不要去改 `/etc/docker/daemon.json`（UGOS 系统托管，改动可能被覆盖）。

### 2. 后端基础镜像必须是 `node:20-slim`，禁用 Alpine

Alpine 用 musl libc，Prisma schema engine 无法探测 libssl 版本，
`prisma db push` 阶段直接崩，且容器陷入无限重启：

```
Error: Could not parse schema engine response: SyntaxError: Unexpected token E in JSON at position 0
prisma:warn Prisma failed to detect the libssl/openssl version to use
```

`server/Dockerfile` 两个 stage 都需：

```dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
```

同时 `prisma/schema.prisma` 需声明：

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

### 3. 生产 nginx 配置与仓库版不同

仓库 `client/nginx.conf` 面向 docker-compose（`listen 80` + `proxy_pass http://server:3000`），
但 NAS 是 host 网络，**没有 `server` 这个 DNS 名**，照搬会导致全站 API 502。

生产版已固化为 `client/nginx.prod.conf`，构建前必须覆盖：

```bash
cp client/nginx.prod.conf client/nginx.conf   # Dockerfile 硬编码 COPY nginx.conf
```

关键差异：`listen 8080`、`proxy_pass http://127.0.0.1:3100`、
`client_max_body_size 12M`（缺失会让 >1MB 附件被 nginx 直接 413，且返回 HTML 而非 JSON）。

### 4. 附件目录必须挂卷

历史容器 `Mounts=[]`，附件写在容器内 `/app/uploads`，容器一重建全部丢失。
启动时必须带 `-v /home/sun007002/uploads:/app/uploads`。

### 5. 源码同步用 tar 管道，不要用 rsync

macOS 自带 openrsync（protocol 29）与 NAS rsync 3.4.1 不兼容，报 `invalid path`。

```bash
tar czf - --exclude='node_modules' --exclude='dist' --exclude='.env' \
    --exclude='._*' --exclude='.DS_Store' -C ./server . \
  | ssh <nas> "tar xzf - -C /home/sun007002/server"
```

**同步前务必备份 NAS 现有源码** —— NAS 上的 Dockerfile / schema 可能含有未回流到仓库的
环境特化修复，直接覆盖会让老坑复现（本次即因此踩雷）。

### 6. 每次容器启动都会跑 seed

容器 CMD 为 `prisma db push --accept-data-loss && prisma db seed && node dist/server.js`。

- 业务数据**安全**：所有 `create` 都有 `findFirst` 守卫，脚本内无 `deleteMany`
- 但 `user.upsert` 会把 **admin 密码重置回 `admin123`**，自定义密码每次重启失效

## 三、标准部署流程

### Step 0 — 备份（不可跳过）

```bash
ssh <nas> "mkdir -p ~/backup && \
  sudo docker exec workorder-mysql mysqldump -uroot -pWorkOrder2026 \
    --single-transaction --routines --triggers workorder_db \
    > ~/backup/workorder_db_\$(date +%Y%m%d_%H%M%S).sql
  cd ~ && tar czf backup/server_src_\$(date +%Y%m%d_%H%M%S).tar.gz server/
  cd ~ && tar czf backup/client_src_\$(date +%Y%m%d_%H%M%S).tar.gz client/"
```

### Step 1 — 同步源码

前端同步前先执行 `cp client/nginx.prod.conf client/nginx.conf`，然后用第 5 条的 tar 管道传输。

### Step 2 — 构建镜像

```bash
ssh <nas> "cd ~/server && sudo docker build --network host -t workorder-server:latest ."
ssh <nas> "cd ~/client && sudo docker build --network host -t workorder-client:latest ."
```

### Step 3 — 重建容器

```bash
# 后端（CMD 自动执行 db push 迁移 + seed）
sudo docker rm -f workorder-server
sudo docker run -d --name workorder-server \
  --network host --restart unless-stopped \
  -v /home/sun007002/uploads:/app/uploads \
  -e PORT=3100 \
  -e DATABASE_URL='mysql://root:WorkOrder2026@127.0.0.1:3307/workorder_db' \
  -e JWT_SECRET='workorder-jwt-secret-key-2026-nas-deploy-32chars' \
  -e JWT_EXPIRES_IN=8h -e BCRYPT_SALT_ROUNDS=10 \
  -e CLIENT_URL='http://192.168.11.100:8080' \
  workorder-server:latest

# 前端
sudo docker rm -f workorder-client
sudo docker run -d --name workorder-client \
  --network host --restart unless-stopped workorder-client:latest
```

### Step 4 — 验证

```bash
sudo docker logs workorder-server | tail -20   # 应出现 "✓ Server running on http://localhost:3100"
```

冒烟检查清单：

- [ ] `GET /` 返回 200
- [ ] `POST /api/auth/login`（admin/admin123）返回 token
- [ ] `GET /api/summary/dashboard` 五组数据齐全
- [ ] 创建带 `startTime`/`endTime` 的工单，且 start>end 被 400 拒绝
- [ ] 上传图片 201、上传 `.exe` 被 400 拒绝
- [ ] 带 token 下载 200、不带 token 401
- [ ] `GET /uploads/<filePath>` 返回图片（缩略图代理）
- [ ] 附件落盘到宿主机 `~/uploads/`

## 四、回滚

```bash
# 数据库
sudo docker exec -i workorder-mysql mysql -uroot -pWorkOrder2026 workorder_db \
  < ~/backup/workorder_db_<时间戳>.sql

# 源码
cd ~ && tar xzf backup/server_src_<时间戳>.tar.gz
```

注意：`db push` 只做加表/加可空列时不会丢数据；但回滚 schema 需手动 `DROP TABLE work_order_files`
及 `ALTER TABLE work_orders DROP COLUMN start_time, DROP COLUMN end_time`。
