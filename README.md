# 售后服务工单管理系统

一套面向售后服务团队的工单管理系统，支持工单录入、客户管理、售后人员管理、费用统计、结款追踪、权限控制等核心功能。

## 技术栈

### 前端
- **React 18** + **Vite** — 快速开发与构建
- **MUI (Material-UI)** — 组件库
- **Tailwind CSS** — 原子化 CSS
- **Zustand** — 状态管理
- **Axios** — HTTP 请求
- **React Hook Form** + **Zod** — 表单校验
- **Notistack** — 消息通知

### 后端
- **Node.js** + **Express** — Web 框架
- **Prisma** — ORM（MySQL 数据库）
- **JWT** — 身份认证
- **Bcryptjs** — 密码加密
- **Zod** — 请求参数校验
- **Helmet** + **express-rate-limit** — 安全防护

### 数据库
- **MySQL 8.0**

### 部署
- **Docker** + **Docker Compose** — 容器化部署

## 功能模块

| 模块 | 说明 |
|------|------|
| 仪表盘 | 关键指标卡片、快捷操作、最近工单 |
| 工单管理 | 工单录入/编辑/删除/查看、多售后人员关联、费用计算、结款状态管理 |
| 汇总查询 | 总体汇总、组合条件查询（客户/日期/结款状态）、各售后人员汇总 |
| 售后人员 | 人员增删改查、启用/禁用 |
| 客户管理 | 客户及联系人管理、展开查看联系人 |
| 用户管理 | 用户增删改查、启用/禁用、重置密码 |
| 角色管理 | 角色增删改查、权限分配（按模块分组） |
| 权限控制 | 基于角色的权限控制（RBAC），12 项细粒度权限 |

## 本地开发指南

### 环境要求
- Node.js >= 18
- MySQL >= 8.0
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd 售后服务工单系统
```

### 2. 配置环境变量
```bash
cp .env.example server/.env
# 根据实际情况修改 server/.env 中的数据库连接信息
```

### 3. 启动后端
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```
后端默认运行在 `http://localhost:3000`

### 4. 启动前端
```bash
cd client
npm install
npm run dev
```
前端默认运行在 `http://localhost:5173`

### 5. 默认账号
| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |

## Docker 部署指南

### 一键部署
```bash
# 在项目根目录执行
docker-compose up -d
```

部署完成后：
- 前端访问：`http://localhost:8080`
- 后端 API：`http://localhost:3000`
- MySQL：`localhost:3306`

### 查看日志
```bash
docker-compose logs -f server
docker-compose logs -f client
```

### 停止服务
```bash
docker-compose down
```

### 停止并清除数据
```bash
docker-compose down -v
```

## 项目结构概览

```
售后服务工单系统/
├── docker-compose.yml          # Docker 编排文件
├── .env.example                # 环境变量模板
├── README.md                   # 项目说明文档
├── server/                     # 后端服务
│   ├── Dockerfile              # 后端 Docker 构建文件
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma       # 数据库模型定义
│   │   ├── seed.ts             # 种子数据脚本
│   │   └── migrations/         # 数据库迁移文件
│   └── src/
│       ├── server.ts           # 应用入口
│       ├── app.ts              # Express 应用配置
│       ├── routes/             # 路由定义
│       ├── controllers/        # 控制器
│       ├── services/           # 业务逻辑层
│       ├── middleware/         # 中间件（认证、错误处理、权限）
│       ├── utils/              # 工具函数
│       ├── types/              # 类型定义
│       └── config/             # 配置文件
├── client/                     # 前端应用
│   ├── Dockerfile              # 前端 Docker 构建文件
│   ├── nginx.conf              # Nginx 配置文件
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx            # 应用入口
│       ├── App.tsx             # 根组件
│       ├── index.css           # 全局样式
│       ├── api/                # API 请求层
│       ├── components/         # 通用组件
│       │   ├── common/         # 通用组件（PageHeader, StatCard 等）
│       │   ├── basicData/      # 基础数据组件（StaffDialog 等）
│       │   └── workOrder/      # 工单相关组件
│       ├── pages/              # 页面组件
│       │   ├── DashboardPage.tsx
│       │   ├── WorkOrderListPage.tsx
│       │   ├── WorkOrderFormPage.tsx
│       │   ├── WorkOrderDetailPage.tsx
│       │   ├── SummaryPage.tsx
│       │   ├── StaffPage.tsx
│       │   ├── CustomerPage.tsx
│       │   ├── UserPage.tsx
│       │   ├── RolePage.tsx
│       │   └── LoginPage.tsx
│       ├── hooks/              # 自定义 Hooks
│       ├── store/              # Zustand 状态管理
│       ├── types/              # TypeScript 类型定义
│       └── utils/              # 工具函数（格式化、常量）
```
