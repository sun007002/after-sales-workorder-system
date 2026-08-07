# 售后服务工单管理系统 — 系统架构设计文档

> **版本**: v1.0  
> **日期**: 2025-08-05  
> **作者**: 高见远（架构师）  
> **状态**: 评审中

---

## 目录

1. [实现方案与框架选型](#1-实现方案与框架选型)
2. [完整文件列表](#2-完整文件列表)
3. [数据结构和接口](#3-数据结构和接口)
4. [程序调用流程](#4-程序调用流程)
5. [任务列表](#5-任务列表)
6. [依赖包列表](#6-依赖包列表)
7. [共享知识（跨文件约定）](#7-共享知识跨文件约定)
8. [待明确事项](#8-待明确事项)

---

## 1. 实现方案与框架选型

### 1.1 整体架构

系统采用**前后端分离 + 单体部署**架构：

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (Client)                       │
│  React 18 + Vite + MUI + Tailwind CSS + React Router     │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTP / RESTful API (JSON)
┌──────────────────▼───────────────────────────────────────┐
│                   Backend Server                          │
│  Node.js + Express + Prisma ORM                          │
│  ├── 中间件层 (auth / rbac / error / cors / logger)       │
│  ├── 路由层 (routes)                                      │
│  ├── 控制器层 (controllers)                                │
│  ├── 服务层 (services)                                    │
│  └── 数据访问层 (Prisma Client)                           │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│                   MySQL 8.0                               │
│  users / roles / work_orders / customers / ...           │
└──────────────────────────────────────────────────────────┘
```

### 1.2 技术选型与理由

| 层级 | 技术 | 版本 | 理由 |
|------|------|------|------|
| 前端框架 | React | ^18.2.0 | 生态成熟、组件化开发、虚拟DOM性能优 |
| 构建工具 | Vite | ^5.0.0 | 极速冷启动、HMR热更新、原生ESM |
| UI组件库 | MUI | ^5.14.0 | 企业级组件丰富、主题定制强、无障碍支持好 |
| CSS框架 | Tailwind CSS | ^3.4.0 | 原子化CSS、响应式工具类、与MUI互补 |
| 路由 | React Router | ^6.20.0 | 声明式路由、嵌套路由、懒加载 |
| 状态管理 | Zustand | ^4.4.0 | 轻量、TypeScript友好、无样板代码 |
| HTTP客户端 | Axios | ^1.6.0 | 拦截器机制、请求/响应转换、取消令牌 |
| 表单管理 | React Hook Form | ^7.48.0 | 性能优、验证集成、与MUI无缝配合 |
| 后端框架 | Express | ^4.18.0 | 成熟稳定、中间件生态丰富、学习曲线低 |
| ORM | Prisma | ^5.8.0 | 类型安全、自动迁移、查询API直观 |
| 数据库 | MySQL | 8.0 | 关系型、事务支持、社区成熟 |
| 认证 | jsonwebtoken | ^9.0.0 | 无状态JWT、标准RFC 7519 |
| 密码加密 | bcryptjs | ^2.4.3 | 纯JS实现、跨平台、盐值自适应 |
| 参数校验 | zod | ^3.22.0 | TypeScript优先、运行时验证、类型推导 |
| 部署 | Docker + Docker Compose | — | 容器化、一键启动、环境隔离 |

### 1.3 目录结构

```
售后服务工单系统/
├── docs/                          # 文档目录
│   ├── PRD.md                     # 产品需求文档
│   └── ARCHITECTURE.md            # 系统架构设计文档（本文件）
├── server/                        # 后端项目
│   ├── prisma/
│   │   ├── schema.prisma          # Prisma 数据模型定义
│   │   └── seed.ts                # 初始数据种子脚本
│   ├── src/
│   │   ├── config/
│   │   │   └── index.ts           # 环境变量与配置
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT 认证中间件
│   │   │   ├── rbac.ts            # 角色权限校验中间件
│   │   │   ├── errorHandler.ts    # 全局错误处理
│   │   │   ├── notFound.ts        # 404 处理
│   │   │   └── requestLogger.ts   # 请求日志
│   │   ├── routes/
│   │   │   ├── index.ts           # 路由聚合
│   │   │   ├── auth.routes.ts     # 认证路由
│   │   │   ├── workOrder.routes.ts# 工单路由
│   │   │   ├── staff.routes.ts    # 售后人员路由
│   │   │   ├── customer.routes.ts # 客户路由
│   │   │   ├── summary.routes.ts  # 汇总查询路由
│   │   │   ├── user.routes.ts     # 用户管理路由
│   │   │   └── role.routes.ts     # 角色管理路由
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── workOrder.controller.ts
│   │   │   ├── staff.controller.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── summary.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── role.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── workOrder.service.ts
│   │   │   ├── staff.service.ts
│   │   │   ├── customer.service.ts
│   │   │   ├── summary.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── role.service.ts
│   │   ├── utils/
│   │   │   ├── prisma.ts          # Prisma Client 单例
│   │   │   ├── jwt.ts             # JWT 签发与验证
│   │   │   ├── password.ts        # 密码哈希与比对
│   │   │   ├── orderNo.ts         # 工单编号生成
│   │   │   └── apiResponse.ts     # 统一响应封装
│   │   ├── types/
│   │   │   └── index.ts           # 共享类型定义
│   │   ├── app.ts                 # Express 应用实例
│   │   └── server.ts              # 应用入口
│   ├── .env.example               # 环境变量模板
│   ├── Dockerfile                 # 后端Docker镜像
│   ├── package.json
│   └── tsconfig.json
├── client/                        # 前端项目
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts          # Axios 实例 + 拦截器
│   │   │   ├── auth.api.ts        # 认证 API
│   │   │   ├── workOrder.api.ts   # 工单 API
│   │   │   ├── staff.api.ts       # 售后人员 API
│   │   │   ├── customer.api.ts    # 客户 API
│   │   │   ├── summary.api.ts     # 汇总查询 API
│   │   │   ├── user.api.ts        # 用户管理 API
│   │   │   └── role.api.ts        # 角色管理 API
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx      # PC侧边栏布局
│   │   │   │   ├── MobileLayout.tsx    # 移动端底部Tab布局
│   │   │   │   ├── Sidebar.tsx         # 侧边栏导航
│   │   │   │   ├── TopBar.tsx          # 顶部栏
│   │   │   │   └── MobileTabBar.tsx    # 移动端底部导航
│   │   │   ├── common/
│   │   │   │   ├── StatCard.tsx        # 指标卡片
│   │   │   │   ├── ConfirmDialog.tsx   # 确认对话框
│   │   │   │   ├── EmptyState.tsx      # 空状态
│   │   │   │   └── PageHeader.tsx      # 页面标题栏
│   │   │   ├── workOrder/
│   │   │   │   ├── WorkOrderForm.tsx        # 工单表单（新增/编辑共用）
│   │   │   │   ├── WorkOrderTable.tsx       # PC端工单列表表格
│   │   │   │   ├── WorkOrderMobileList.tsx  # 移动端工单卡片列表
│   │   │   │   └── WorkOrderDetail.tsx     # 工单详情
│   │   │   └── basicData/
│   │   │       ├── StaffDialog.tsx      # 售后人员编辑对话框
│   │   │       ├── CustomerDialog.tsx   # 客户编辑对话框
│   │   │       └── ContactDialog.tsx    # 联系人编辑对话框
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx           # 登录页
│   │   │   ├── DashboardPage.tsx       # 仪表盘
│   │   │   ├── WorkOrderListPage.tsx   # 工单列表
│   │   │   ├── WorkOrderFormPage.tsx   # 工单新增/编辑
│   │   │   ├── WorkOrderDetailPage.tsx # 工单详情
│   │   │   ├── StaffPage.tsx           # 售后人员管理
│   │   │   ├── CustomerPage.tsx        # 客户管理
│   │   │   ├── SummaryPage.tsx         # 汇总查询
│   │   │   ├── UserPage.tsx            # 用户管理
│   │   │   └── RolePage.tsx            # 角色管理
│   │   ├── store/
│   │   │   ├── authStore.ts     # 认证状态（Zustand）
│   │   │   └── uiStore.ts       # UI状态（侧边栏折叠等）
│   │   ├── hooks/
│   │   │   ├── useAuth.ts       # 认证 hook
│   │   │   └── usePermission.ts # 权限 hook
│   │   ├── theme/
│   │   │   └── index.ts         # MUI 主题配置
│   │   ├── types/
│   │   │   └── index.ts         # 前端类型定义
│   │   ├── utils/
│   │   │   ├── format.ts        # 格式化（金额、日期）
│   │   │   └── constants.ts     # 常量定义
│   │   ├── App.tsx              # 根组件（路由 + 布局）
│   │   └── main.tsx             # 入口文件
│   ├── index.html
│   ├── Dockerfile               # 前端Docker镜像
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml           # 容器编排配置
├── .env.example                 # 全局环境变量模板
└── README.md
```

### 1.4 认证与权限控制方案

#### 认证流程

1. 用户提交用户名 + 密码 → 后端校验 → 签发 JWT（payload 含 `userId`, `roleId`, `username`）
2. 前端将 JWT 存储在 `localStorage`，每次请求通过 Axios 拦截器在 `Authorization: Bearer <token>` 头中携带
3. 后端 `auth` 中间件验证 Token，将 `req.user` 注入请求上下文
4. `rbac` 中间件根据路由所需权限码，校验 `req.user.roleId` 对应角色的 `permissions` 数组

#### 权限模型

权限采用**模块 + 操作**的二维编码：

```
格式：module:action
示例：workorder:create, workorder:read, workorder:update, workorder:delete
      staff:manage, customer:manage, summary:view
      user:manage, role:manage, payment:manage
```

角色的 `permissions` 字段存储 JSON 数组，例如：
```json
["workorder:create", "workorder:read", "workorder:update", "summary:view"]
```

#### 数据级权限

- **售后人员角色**：查询工单时，后端自动追加 `WHERE staff_names LIKE '%当前用户姓名%'` 条件
- **工单编辑**：售后人员仅能编辑 `staff_names` 包含自己且 `is_paid = false` 的工单

---

## 2. 完整文件列表

### 2.1 根目录配置文件

| # | 文件路径 | 说明 |
|---|---------|------|
| 1 | `docker-compose.yml` | 容器编排：MySQL + server + client |
| 2 | `.env.example` | 全局环境变量模板 |
| 3 | `README.md` | 项目说明与启动指南 |

### 2.2 后端文件（server/）

| # | 文件路径 | 说明 |
|---|---------|------|
| 1 | `server/package.json` | 后端依赖与脚本 |
| 2 | `server/tsconfig.json` | TypeScript 配置 |
| 3 | `server/.env.example` | 后端环境变量模板 |
| 4 | `server/Dockerfile` | 后端镜像构建 |
| 5 | `server/prisma/schema.prisma` | Prisma 数据模型 |
| 6 | `server/prisma/seed.ts` | 初始数据种子脚本 |
| 7 | `server/src/config/index.ts` | 配置中心 |
| 8 | `server/src/middleware/auth.ts` | JWT 认证中间件 |
| 9 | `server/src/middleware/rbac.ts` | RBAC 权限中间件 |
| 10 | `server/src/middleware/errorHandler.ts` | 全局错误处理 |
| 11 | `server/src/middleware/notFound.ts` | 404 处理 |
| 12 | `server/src/middleware/requestLogger.ts` | 请求日志 |
| 13 | `server/src/routes/index.ts` | 路由聚合 |
| 14 | `server/src/routes/auth.routes.ts` | 认证路由 |
| 15 | `server/src/routes/workOrder.routes.ts` | 工单路由 |
| 16 | `server/src/routes/staff.routes.ts` | 售后人员路由 |
| 17 | `server/src/routes/customer.routes.ts` | 客户路由 |
| 18 | `server/src/routes/summary.routes.ts` | 汇总查询路由 |
| 19 | `server/src/routes/user.routes.ts` | 用户管理路由 |
| 20 | `server/src/routes/role.routes.ts` | 角色管理路由 |
| 21 | `server/src/controllers/auth.controller.ts` | 认证控制器 |
| 22 | `server/src/controllers/workOrder.controller.ts` | 工单控制器 |
| 23 | `server/src/controllers/staff.controller.ts` | 售后人员控制器 |
| 24 | `server/src/controllers/customer.controller.ts` | 客户控制器 |
| 25 | `server/src/controllers/summary.controller.ts` | 汇总查询控制器 |
| 26 | `server/src/controllers/user.controller.ts` | 用户管理控制器 |
| 27 | `server/src/controllers/role.controller.ts` | 角色管理控制器 |
| 28 | `server/src/services/auth.service.ts` | 认证服务 |
| 29 | `server/src/services/workOrder.service.ts` | 工单服务 |
| 30 | `server/src/services/staff.service.ts` | 售后人员服务 |
| 31 | `server/src/services/customer.service.ts` | 客户服务 |
| 32 | `server/src/services/summary.service.ts` | 汇总查询服务 |
| 33 | `server/src/services/user.service.ts` | 用户管理服务 |
| 34 | `server/src/services/role.service.ts` | 角色管理服务 |
| 35 | `server/src/utils/prisma.ts` | Prisma Client 单例 |
| 36 | `server/src/utils/jwt.ts` | JWT 工具 |
| 37 | `server/src/utils/password.ts` | 密码工具 |
| 38 | `server/src/utils/orderNo.ts` | 工单编号生成 |
| 39 | `server/src/utils/apiResponse.ts` | 统一响应封装 |
| 40 | `server/src/types/index.ts` | 共享类型 |
| 41 | `server/src/app.ts` | Express 应用 |
| 42 | `server/src/server.ts` | 应用入口 |

### 2.3 前端文件（client/）

| # | 文件路径 | 说明 |
|---|---------|------|
| 1 | `client/package.json` | 前端依赖与脚本 |
| 2 | `client/tsconfig.json` | TypeScript 配置 |
| 3 | `client/vite.config.ts` | Vite 配置 |
| 4 | `client/tailwind.config.ts` | Tailwind 配置 |
| 5 | `client/index.html` | HTML 入口 |
| 6 | `client/Dockerfile` | 前端镜像构建 |
| 7 | `client/public/favicon.ico` | 网站图标 |
| 8 | `client/src/main.tsx` | 入口文件 |
| 9 | `client/src/App.tsx` | 根组件 |
| 10 | `client/src/api/client.ts` | Axios 实例 |
| 11 | `client/src/api/auth.api.ts` | 认证 API |
| 12 | `client/src/api/workOrder.api.ts` | 工单 API |
| 13 | `client/src/api/staff.api.ts` | 售后人员 API |
| 14 | `client/src/api/customer.api.ts` | 客户 API |
| 15 | `client/src/api/summary.api.ts` | 汇总查询 API |
| 16 | `client/src/api/user.api.ts` | 用户管理 API |
| 17 | `client/src/api/role.api.ts` | 角色管理 API |
| 18 | `client/src/components/layout/MainLayout.tsx` | PC 布局 |
| 19 | `client/src/components/layout/MobileLayout.tsx` | 移动端布局 |
| 20 | `client/src/components/layout/Sidebar.tsx` | 侧边栏 |
| 21 | `client/src/components/layout/TopBar.tsx` | 顶部栏 |
| 22 | `client/src/components/layout/MobileTabBar.tsx` | 移动端底部导航 |
| 23 | `client/src/components/common/StatCard.tsx` | 指标卡片 |
| 24 | `client/src/components/common/ConfirmDialog.tsx` | 确认对话框 |
| 25 | `client/src/components/common/EmptyState.tsx` | 空状态 |
| 26 | `client/src/components/common/PageHeader.tsx` | 页面标题栏 |
| 27 | `client/src/components/workOrder/WorkOrderForm.tsx` | 工单表单 |
| 28 | `client/src/components/workOrder/WorkOrderTable.tsx` | PC 工单表格 |
| 29 | `client/src/components/workOrder/WorkOrderMobileList.tsx` | 移动端工单列表 |
| 30 | `client/src/components/workOrder/WorkOrderDetail.tsx` | 工单详情 |
| 31 | `client/src/components/basicData/StaffDialog.tsx` | 售后人员对话框 |
| 32 | `client/src/components/basicData/CustomerDialog.tsx` | 客户对话框 |
| 33 | `client/src/components/basicData/ContactDialog.tsx` | 联系人对话框 |
| 34 | `client/src/pages/LoginPage.tsx` | 登录页 |
| 35 | `client/src/pages/DashboardPage.tsx` | 仪表盘 |
| 36 | `client/src/pages/WorkOrderListPage.tsx` | 工单列表 |
| 37 | `client/src/pages/WorkOrderFormPage.tsx` | 工单新增/编辑 |
| 38 | `client/src/pages/WorkOrderDetailPage.tsx` | 工单详情 |
| 39 | `client/src/pages/StaffPage.tsx` | 售后人员管理 |
| 40 | `client/src/pages/CustomerPage.tsx` | 客户管理 |
| 41 | `client/src/pages/SummaryPage.tsx` | 汇总查询 |
| 42 | `client/src/pages/UserPage.tsx` | 用户管理 |
| 43 | `client/src/pages/RolePage.tsx` | 角色管理 |
| 44 | `client/src/store/authStore.ts` | 认证状态 |
| 45 | `client/src/store/uiStore.ts` | UI 状态 |
| 46 | `client/src/hooks/useAuth.ts` | 认证 hook |
| 47 | `client/src/hooks/usePermission.ts` | 权限 hook |
| 48 | `client/src/theme/index.ts` | 主题配置 |
| 49 | `client/src/types/index.ts` | 类型定义 |
| 50 | `client/src/utils/format.ts` | 格式化工具 |
| 51 | `client/src/utils/constants.ts` | 常量 |

---

## 3. 数据结构和接口

### 3.1 数据库表结构（完整定义）

#### 3.1.1 Prisma Schema

```prisma
// server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ========== 角色 ==========
model Role {
  id          Int      @id @default(autoincrement())
  name        String   @unique @db.VarChar(50)
  description String?  @db.VarChar(200)
  permissions Json     @default("[]")    // ["workorder:create", "workorder:read", ...]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  users       User[]

  @@map("roles")
}

// ========== 用户 ==========
model User {
  id                 Int       @id @default(autoincrement())
  username           String    @unique @db.VarChar(50)
  passwordHash       String    @map("password_hash") @db.VarChar(255)
  displayName        String    @map("display_name") @db.VarChar(50)
  phone              String?   @db.VarChar(20)
  roleId             Int       @map("role_id")
  status             String    @default("active") @db.VarChar(20)  // active | disabled
  mustChangePassword Boolean   @default(true) @map("must_change_password")
  failedLoginCount   Int       @default(0) @map("failed_login_count")
  lockedUntil        DateTime? @map("locked_until")
  lastLoginAt        DateTime? @map("last_login_at")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")
  role               Role      @relation(fields: [roleId], references: [id])
  workOrdersCreated  WorkOrder[] @relation("WorkOrderCreatedBy")
  workOrdersUpdated  WorkOrder[] @relation("WorkOrderUpdatedBy")

  @@map("users")
}

// ========== 售后人员 ==========
model AfterSalesStaff {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(50)
  phone     String?  @db.VarChar(20)
  status    String   @default("active") @db.VarChar(20)  // active | disabled
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("after_sales_staff")
}

// ========== 客户 ==========
model Customer {
  id        Int                @id @default(autoincrement())
  name      String             @unique @db.VarChar(100)
  status    String             @default("active") @db.VarChar(20)
  createdAt DateTime           @default(now()) @map("created_at")
  updatedAt DateTime           @updatedAt @map("updated_at")
  contacts  CustomerContact[]
  workOrders WorkOrder[]

  @@map("customers")
}

// ========== 客户联系人 ==========
model CustomerContact {
  id         Int      @id @default(autoincrement())
  customerId Int      @map("customer_id")
  name       String   @db.VarChar(50)
  phone      String?  @db.VarChar(20)
  status     String   @default("active") @db.VarChar(20)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  workOrders WorkOrder[]

  @@map("customer_contacts")
  @@index([customerId])
}

// ========== 工单 ==========
model WorkOrder {
  id            Int       @id @default(autoincrement())
  orderNo       String    @unique @map("order_no") @db.VarChar(20)  // 0001, 0002...
  customerId    Int       @map("customer_id")
  contactId     Int       @map("contact_id")
  contactPhone  String?   @map("contact_phone") @db.VarChar(20)
  staffNames    String    @map("staff_names") @db.Text  // "张伟、李娜" 顿号分隔
  description   String    @db.Text
  laborCost     Decimal   @default(0) @map("labor_cost") @db.Decimal(10, 2)
  materialCost  Decimal   @default(0) @map("material_cost") @db.Decimal(10, 2)
  travelCost    Decimal   @default(0) @map("travel_cost") @db.Decimal(10, 2)
  totalAmount   Decimal   @default(0) @map("total_amount") @db.Decimal(10, 2)
  isPaid        Boolean   @default(false) @map("is_paid")
  isDeleted     Boolean   @default(false) @map("is_deleted")
  createdBy     Int       @map("created_by")
  updatedBy     Int?      @map("updated_by")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  customer      Customer  @relation(fields: [customerId], references: [id])
  contact       CustomerContact @relation(fields: [contactId], references: [id])
  creator       User      @relation("WorkOrderCreatedBy", fields: [createdBy], references: [id])
  updater       User?     @relation("WorkOrderUpdatedBy", fields: [updatedBy], references: [id])

  @@map("work_orders")
  @@index([customerId])
  @@index([contactId])
  @@index([isPaid])
  @@index([isDeleted])
  @@index([createdAt])
}

// ========== 操作日志（P2） ==========
model OperationLog {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  action    String   @db.VarChar(50)  // create | update | delete | login | logout
  module    String   @db.VarChar(50)  // workorder | staff | customer | user | role
  targetId  Int?     @map("target_id")
  detail    String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at")

  @@map("operation_logs")
  @@index([userId])
  @@index([createdAt])
}
```

#### 3.1.2 索引策略

| 表名 | 索引名 | 字段 | 用途 |
|------|--------|------|------|
| work_orders | idx_customer_id | customer_id | 按客户筛选 |
| work_orders | idx_contact_id | contact_id | 按联系人筛选 |
| work_orders | idx_is_paid | is_paid | 结款状态筛选 |
| work_orders | idx_is_deleted | is_deleted | 软删除过滤 |
| work_orders | idx_created_at | created_at | 时间排序与范围查询 |
| customer_contacts | idx_customer_id | customer_id | 客户→联系人联动查询 |
| operation_logs | idx_user_id | user_id | 按用户查日志 |
| operation_logs | idx_created_at | created_at | 时间范围查日志 |

### 3.2 RESTful API 接口列表

#### 3.2.1 认证接口

| Method | Path | 描述 | 权限 | 备注 |
|--------|------|------|------|------|
| POST | `/api/auth/login` | 用户登录 | 公开 | 返回 JWT + 用户信息 |
| POST | `/api/auth/logout` | 用户登出 | 已登录 | 清除客户端 Token |
| GET | `/api/auth/me` | 获取当前用户信息 | 已登录 | 返回用户 + 角色权限 |
| PUT | `/api/auth/change-password` | 修改密码 | 已登录 | 首次登录强制改密 |

#### 3.2.2 工单接口

| Method | Path | 描述 | 权限码 | 备注 |
|--------|------|------|--------|------|
| GET | `/api/work-orders` | 工单列表（分页+筛选） | `workorder:read` | 数据级权限过滤 |
| GET | `/api/work-orders/:id` | 工单详情 | `workorder:read` | |
| POST | `/api/work-orders` | 新建工单 | `workorder:create` | 自动生成编号 |
| PUT | `/api/work-orders/:id` | 编辑工单 | `workorder:update` | 售后人员限自己且未结款 |
| DELETE | `/api/work-orders/:id` | 删除工单（软删除） | `workorder:delete` | 仅管理员 |
| PATCH | `/api/work-orders/:id/payment` | 更新结款状态 | `payment:manage` | 仅管理员/财务 |

#### 3.2.3 基础数据接口

| Method | Path | 描述 | 权限码 |
|--------|------|------|--------|
| GET | `/api/staff` | 售后人员列表 | `staff:read` |
| POST | `/api/staff` | 新增售后人员 | `staff:manage` |
| PUT | `/api/staff/:id` | 编辑售后人员 | `staff:manage` |
| DELETE | `/api/staff/:id` | 删除售后人员 | `staff:manage` |
| PATCH | `/api/staff/:id/status` | 启用/禁用售后人员 | `staff:manage` |
| GET | `/api/customers` | 客户列表 | `customer:read` |
| POST | `/api/customers` | 新增客户 | `customer:manage` |
| PUT | `/api/customers/:id` | 编辑客户 | `customer:manage` |
| DELETE | `/api/customers/:id` | 删除客户 | `customer:manage` |
| GET | `/api/customers/:id/contacts` | 客户的联系人列表 | `customer:read` |
| POST | `/api/customers/:id/contacts` | 新增联系人 | `customer:manage` |
| PUT | `/api/customers/:id/contacts/:contactId` | 编辑联系人 | `customer:manage` |
| DELETE | `/api/customers/:id/contacts/:contactId` | 删除联系人 | `customer:manage` |

#### 3.2.4 汇总查询接口

| Method | Path | 描述 | 权限码 |
|--------|------|------|--------|
| GET | `/api/summary/overview` | 总体汇总 | `summary:view` |
| GET | `/api/summary/composite` | 组合查询 | `summary:view` |
| GET | `/api/summary/staff` | 各售后人员汇总 | `summary:view` |

#### 3.2.5 用户管理接口

| Method | Path | 描述 | 权限码 |
|--------|------|------|--------|
| GET | `/api/users` | 用户列表 | `user:manage` |
| POST | `/api/users` | 新增用户 | `user:manage` |
| PUT | `/api/users/:id` | 编辑用户 | `user:manage` |
| DELETE | `/api/users/:id` | 删除用户 | `user:manage` |
| PATCH | `/api/users/:id/status` | 启用/禁用用户 | `user:manage` |
| PUT | `/api/users/:id/reset-password` | 重置密码 | `user:manage` |

#### 3.2.6 角色管理接口

| Method | Path | 描述 | 权限码 |
|--------|------|------|--------|
| GET | `/api/roles` | 角色列表 | `role:manage` |
| POST | `/api/roles` | 新增角色 | `role:manage` |
| PUT | `/api/roles/:id` | 编辑角色 | `role:manage` |
| DELETE | `/api/roles/:id` | 删除角色 | `role:manage` |

### 3.3 数据模型类图

```mermaid
classDiagram
    class Role {
        +Int id
        +String name
        +String description
        +Json permissions
        +DateTime createdAt
        +DateTime updatedAt
    }

    class User {
        +Int id
        +String username
        +String passwordHash
        +String displayName
        +String phone
        +Int roleId
        +String status
        +Boolean mustChangePassword
        +Int failedLoginCount
        +DateTime lockedUntil
        +DateTime lastLoginAt
        +DateTime createdAt
        +DateTime updatedAt
        +login(password) Object
        +changePassword(oldPwd, newPwd) void
        +isLocked() Boolean
    }

    class AfterSalesStaff {
        +Int id
        +String name
        +String phone
        +String status
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Customer {
        +Int id
        +String name
        +String status
        +DateTime createdAt
        +DateTime updatedAt
    }

    class CustomerContact {
        +Int id
        +Int customerId
        +String name
        +String phone
        +String status
        +DateTime createdAt
        +DateTime updatedAt
    }

    class WorkOrder {
        +Int id
        +String orderNo
        +Int customerId
        +Int contactId
        +String contactPhone
        +String staffNames
        +String description
        +Decimal laborCost
        +Decimal materialCost
        +Decimal travelCost
        +Decimal totalAmount
        +Boolean isPaid
        +Boolean isDeleted
        +Int createdBy
        +Int updatedBy
        +DateTime createdAt
        +DateTime updatedAt
        +calculateTotal() Decimal
    }

    class OperationLog {
        +Int id
        +Int userId
        +String action
        +String module
        +Int targetId
        +String detail
        +DateTime createdAt
    }

    Role "1" --> "*" User : roleId
    Customer "1" --> "*" CustomerContact : customerId
    Customer "1" --> "*" WorkOrder : customerId
    CustomerContact "1" --> "*" WorkOrder : contactId
    User "1" --> "*" WorkOrder : createdBy (creator)
    User "1" --> "*" WorkOrder : updatedBy (updater)
    User "1" --> "*" OperationLog : userId
```

---

## 4. 程序调用流程

### 4.1 登录认证流程

```mermaid
sequenceDiagram
    participant U as 用户浏览器
    participant F as 前端 React App
    participant A as Axios 拦截器
    participant E as Express Server
    participant MW as authMiddleware
    participant C as authController
    participant S as authService
    participant P as Prisma Client
    participant DB as MySQL

    U->>F: 输入用户名 + 密码，点击登录
    F->>A: POST /api/auth/login {username, password}
    A->>E: 发送请求

    E->>C: 路由进入 login()
    C->>S: login(username, password)
    S->>P: findFirst({username, status: active})
    P->>DB: SELECT * FROM users WHERE username=? AND status='active'
    DB-->>P: User record
    P-->>S: user | null

    alt 用户不存在
        S-->>C: throw AppError(用户名或密码错误)
        C-->>E: {code: 401, message: "用户名或密码错误"}
        E-->>A: HTTP 401
        A-->>F: 错误响应
        F-->>U: 提示错误信息
    else 账号锁定
        S->>S: 检查 lockedUntil > now
        S-->>C: throw AppError(账号已锁定)
    else 密码正确
        S->>S: bcrypt.compare(password, user.passwordHash)
        S->>S: 重置 failedLoginCount = 0
        S->>P: update({lastLoginAt: now})
        S->>S: jwt.sign({userId, roleId, username})
        S-->>C: {token, user, mustChangePassword}
        C-->>E: {code: 200, data: {token, user}}
        E-->>A: HTTP 200
        A-->>F: 响应数据
        F->>F: authStore.setAuth(token, user)
        alt mustChangePassword = true
            F-->>U: 弹出修改密码对话框
            U->>F: 输入新密码
            F->>A: PUT /api/auth/change-password
            A->>E: 请求（带Token）
            E->>MW: 验证JWT
            MW->>C: changePassword()
            C->>S: changePassword(userId, oldPwd, newPwd)
            S->>P: update({passwordHash, mustChangePassword: false})
            P-->>S: 更新成功
            S-->>C: 成功
            C-->>F: {code: 200}
            F->>F: 跳转仪表盘
        else 无需改密
            F->>F: 跳转仪表盘
        end
    else 密码错误
        S->>S: failedLoginCount += 1
        alt failedLoginCount >= 5
            S->>P: update({lockedUntil: now + 30min})
        end
        S-->>C: throw AppError(用户名或密码错误，剩余N次)
    end
```

### 4.2 工单录入流程（含客户→联系人联动）

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as WorkOrderForm
    participant API as API Layer
    participant E as Express
    participant MW as RBAC Middleware
    participant C as workOrderController
    participant S as workOrderService
    participant ON as orderNo Util
    participant P as Prisma
    participant DB as MySQL

    Note over F: 页面初始化：加载客户列表和售后人员列表
    F->>API: GET /api/customers + GET /api/staff
    API->>E: 并发请求
    E->>C: customerController.list() + staffController.list()
    C->>P: findMany()
    P-->>C: customers[] / staff[]
    C-->>F: 返回数据
    F->>F: 填充客户下拉框、售后人员多选框

    Note over U,F: 用户选择客户
    U->>F: 选择客户 "华为技术有限公司"
    F->>API: GET /api/customers/:id/contacts
    API->>E: 请求联系人列表
    E->>C: customerController.listContacts()
    C->>P: findMany({where: {customerId, status: active}})
    P-->>C: contacts[]
    C-->>F: 返回联系人列表
    F->>F: 联系人下拉框仅显示华为的联系人（周工、王工）

    Note over U,F: 用户选择联系人
    U->>F: 选择联系人 "周工"
    F->>F: 自动填充联系电话 = "13800010001"（前端从contacts数据中查找）

    Note over U,F: 填写其他字段
    U->>F: 选择售后人员[张伟、李娜]、填写描述、输入费用
    F->>F: 实时计算合计金额 = 人工费 + 材料费 + 交通差旅费

    Note over U,F: 提交表单
    U->>F: 点击保存
    F->>F: React Hook Form 校验
    alt 校验失败
        F-->>U: 显示错误提示
    else 校验通过
        F->>API: POST /api/work-orders {customerId, contactId, staffNames, ...}
        API->>E: 请求（带JWT）
        E->>MW: 验证JWT + 校验 workorder:create 权限
        MW-->>E: 通过，注入 req.user
        E->>C: create()
        C->>S: create(data, req.user.id)
        S->>ON: generateOrderNo()
        ON->>P: findFirst({orderBy: {orderNo: desc}})
        P-->>ON: 最新工单 orderNo = "0042"
        ON->>ON: 生成 "0043" = (42+1).padStart(4, '0')
        ON-->>S: "0043"
        S->>S: totalAmount = laborCost + materialCost + travelCost
        S->>P: create({orderNo: "0043", ...data, totalAmount, createdBy: userId})
        P->>DB: INSERT INTO work_orders ...
        DB-->>P: 插入成功
        P-->>S: workOrder
        S-->>C: workOrder
        C-->>E: {code: 200, data: workOrder}
        E-->>API: HTTP 200
        API-->>F: 响应数据
        F-->>U: 提示"工单创建成功"，跳转工单列表
    end
```

### 4.3 汇总查询流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as SummaryPage
    participant API as API Layer
    participant E as Express
    participant MW as RBAC Middleware
    participant C as summaryController
    participant S as summaryService
    participant P as Prisma
    participant DB as MySQL

    Note over F: 初始加载：获取总体汇总
    F->>API: GET /api/summary/overview
    API->>E: 请求（带JWT）
    E->>MW: 验证JWT + 校验 summary:view 权限
    MW-->>E: 通过
    E->>C: getOverview()
    C->>S: getOverview(userRole, userId)
    
    alt 用户是售后人员角色
        S->>P: aggregate({where: {isDeleted: false, staffNames: {contains: userName}}})
    else 管理员/主管/财务
        S->>P: aggregate({where: {isDeleted: false}})
    end
    
    P->>DB: SELECT COUNT(*), SUM(labor_cost), SUM(material_cost), ...
    DB-->>P: 聚合结果
    P-->>S: {count, sumLabor, sumMaterial, sumTravel, sumTotal, ...}
    S-->>C: overviewData
    C-->>F: {code: 200, data: overview}
    F->>F: 渲染指标卡片网格

    Note over U,F: 用户使用组合查询
    U->>F: 选择客户[华为, 比亚迪]、日期范围[2025-01-01 ~ 2025-06-30]、结款状态[未结款]
    F->>API: GET /api/summary/composite?customerIds=1,2&startDate=2025-01-01&endDate=2025-06-30&isPaid=false
    API->>E: 请求
    E->>C: getComposite(query)
    C->>S: getComposite(filters)
    S->>P: findMany({where: {customerId: {in: [1,2]}, createdAt: {gte, lte}, isPaid: false, isDeleted: false}, take: 50, orderBy: {createdAt: desc}})
    P->>DB: SELECT * FROM work_orders WHERE ...
    DB-->>P: workOrders[]
    P-->>S: workOrders
    S->>S: 计算合计行（SUM各项费用）
    S-->>C: {items: workOrders, summary: {count, sumLabor, ...}, total: N}
    C-->>F: {code: 200, data: {items, summary, total}}
    F->>F: 渲染明细表格 + 合计行

    Note over U,F: 查看各售后人员汇总
    U->>F: 切换到"人员汇总"标签
    F->>API: GET /api/summary/staff
    API->>E: 请求
    E->>C: getStaffSummary()
    C->>S: getStaffSummary()
    S->>P: findMany({where: {status: active}}, after_sales_staff)
    P-->>S: staffList[]
    loop 每个售后人员
        S->>P: aggregate({where: {staffNames: {contains: staff.name}, isDeleted: false}})
        P-->>S: {count, sumTotal, sumUnpaid}
    end
    S-->>C: staffSummary[]
    C-->>F: {code: 200, data: staffSummary}
    F->>F: 渲染人员汇总表格
```

### 4.4 权限校验流程

```mermaid
sequenceDiagram
    participant F as 前端
    participant E as Express
    participant AuthMW as authMiddleware
    participant RBACMW as rbacMiddleware
    participant DB as MySQL
    participant C as Controller

    F->>E: 请求 API（带 Authorization: Bearer <token>）
    
    E->>AuthMW: 验证JWT
    AuthMW->>AuthMW: jwt.verify(token, JWT_SECRET)
    alt Token 无效/过期
        AuthMW-->>E: 401 Unauthorized
        E-->>F: {code: 401, message: "未授权"}
    else Token 有效
        AuthMW->>AuthMW: req.user = {userId, roleId, username}
        AuthMW->>RBACMW: next()
        
        RBACMW->>RBACMW: 检查路由所需权限码 (如 "workorder:delete")
        RBACMW->>DB: SELECT permissions FROM roles WHERE id = req.user.roleId
        DB-->>RBACMW: role.permissions = ["workorder:create", "workorder:read", ...]
        
        alt 权限不足
            RBACMW-->>E: 403 Forbidden
            E-->>F: {code: 403, message: "权限不足"}
        else 权限通过
            RBACMW->>C: next() 进入控制器
            C->>C: 业务逻辑处理
            Note over C: 数据级权限：<br/>售后人员角色查询工单时<br/>追加 staffNames LIKE '%userName%'
            C-->>E: 返回业务结果
            E-->>F: {code: 200, data: ...}
        end
    end
```

---

## 5. 任务列表

> 工程师请按以下顺序执行任务。每个任务包含完整的文件创建/修改列表。

### 任务依赖图

```mermaid
graph TD
    T01[T01: 后端基础设施<br/>配置+Prisma+认证+全部API]
    T02[T02: 前端基础设施<br/>配置+路由+布局+主题+API层+状态]
    T03[T03: 前端核心页面<br/>登录+仪表盘+工单+基础数据+汇总+权限]
    T04[T04: Docker部署配置<br/>Dockerfile+docker-compose]
    
    T01 --> T03
    T02 --> T03
    T01 --> T04
    T02 --> T04
```

---

### T01: 后端完整实现（基础设施 + 数据库 + API）

**任务描述**: 创建后端全部代码，包括项目配置、Prisma数据模型、种子数据、Express应用骨架、所有中间件、全部路由/控制器/服务层、工具函数。

**源文件列表**:
```
server/package.json
server/tsconfig.json
server/.env.example
server/prisma/schema.prisma
server/prisma/seed.ts
server/src/config/index.ts
server/src/middleware/auth.ts
server/src/middleware/rbac.ts
server/src/middleware/errorHandler.ts
server/src/middleware/notFound.ts
server/src/middleware/requestLogger.ts
server/src/routes/index.ts
server/src/routes/auth.routes.ts
server/src/routes/workOrder.routes.ts
server/src/routes/staff.routes.ts
server/src/routes/customer.routes.ts
server/src/routes/summary.routes.ts
server/src/routes/user.routes.ts
server/src/routes/role.routes.ts
server/src/controllers/auth.controller.ts
server/src/controllers/workOrder.controller.ts
server/src/controllers/staff.controller.ts
server/src/controllers/customer.controller.ts
server/src/controllers/summary.controller.ts
server/src/controllers/user.controller.ts
server/src/controllers/role.controller.ts
server/src/services/auth.service.ts
server/src/services/workOrder.service.ts
server/src/services/staff.service.ts
server/src/services/customer.service.ts
server/src/services/summary.service.ts
server/src/services/user.service.ts
server/src/services/role.service.ts
server/src/utils/prisma.ts
server/src/utils/jwt.ts
server/src/utils/password.ts
server/src/utils/orderNo.ts
server/src/utils/apiResponse.ts
server/src/types/index.ts
server/src/app.ts
server/src/server.ts
```

**依赖**: 无

**优先级**: P0

**实现要点**:
1. `schema.prisma` 定义全部7张表（roles, users, after_sales_staff, customers, customer_contacts, work_orders, operation_logs），字段类型和索引按第3节定义
2. `seed.ts` 初始化4个内置角色（管理员/售后主管/售后人员/财务人员）、admin用户（密码 admin123, bcrypt加密）、4个售后人员、8个客户、10个联系人
3. 各角色权限种子数据：
   - 管理员：所有权限码
   - 售后主管：`workorder:create, workorder:read, workorder:update, customer:read, staff:read, summary:view`
   - 售后人员：`workorder:create, workorder:read, workorder:update, summary:view`
   - 财务人员：`workorder:read, customer:read, staff:read, summary:view, payment:manage`
4. 工单编号生成：查询当前最大 `order_no`（转为整数）+1，`padStart(4, '0')`
5. 登录锁定逻辑：`failed_login_count >= 5` 时设置 `locked_until = now + 30min`
6. 数据级权限：售后人员查询工单时自动追加 `staffNames LIKE '%当前用户displayName%'`
7. 工单软删除：`DELETE` 请求设置 `is_deleted = true`，所有查询默认 `WHERE is_deleted = false`
8. 汇总查询使用 Prisma `aggregate` + `groupBy` 实现
9. `app.ts` 注册中间件顺序：cors → express.json → requestLogger → routes → notFound → errorHandler
10. CORS 配置允许 `http://localhost:5173`（开发）和生产域名

---

### T02: 前端基础设施（配置 + 路由 + 布局 + 主题 + API层 + 状态管理）

**任务描述**: 创建前端项目配置文件、Vite/Tailwind/TS配置、MUI主题、路由系统、响应式布局组件（PC侧边栏 + 移动端底部Tab）、Axios封装与全部API模块、Zustand状态管理、认证与权限hooks、通用组件。

**源文件列表**:
```
client/package.json
client/tsconfig.json
client/vite.config.ts
client/tailwind.config.ts
client/index.html
client/public/favicon.ico
client/src/main.tsx
client/src/App.tsx
client/src/theme/index.ts
client/src/types/index.ts
client/src/api/client.ts
client/src/api/auth.api.ts
client/src/api/workOrder.api.ts
client/src/api/staff.api.ts
client/src/api/customer.api.ts
client/src/api/summary.api.ts
client/src/api/user.api.ts
client/src/api/role.api.ts
client/src/store/authStore.ts
client/src/store/uiStore.ts
client/src/hooks/useAuth.ts
client/src/hooks/usePermission.ts
client/src/utils/format.ts
client/src/utils/constants.ts
client/src/components/layout/MainLayout.tsx
client/src/components/layout/MobileLayout.tsx
client/src/components/layout/Sidebar.tsx
client/src/components/layout/TopBar.tsx
client/src/components/layout/MobileTabBar.tsx
client/src/components/common/StatCard.tsx
client/src/components/common/ConfirmDialog.tsx
client/src/components/common/EmptyState.tsx
client/src/components/common/PageHeader.tsx
```

**依赖**: 无（可与 T01 并行开发，前端 API 层先按约定接口对接）

**优先级**: P0

**实现要点**:
1. `vite.config.ts` 配置代理：`/api` → `http://localhost:3000`，避免跨域
2. `tailwind.config.ts` 与 MUI 主题协调，prefix 设为 `tw-` 避免冲突
3. MUI 主题：主色 `#1976D2`，已结款绿色 `#4CAF50`，未结款红色 `#F44336`，圆角 8px
4. 路由结构：
   - `/login` → LoginPage（无布局）
   - `/` → DashboardPage（有布局）
   - `/work-orders` → WorkOrderListPage
   - `/work-orders/new` → WorkOrderFormPage
   - `/work-orders/:id` → WorkOrderDetailPage
   - `/work-orders/:id/edit` → WorkOrderFormPage
   - `/staff` → StaffPage
   - `/customers` → CustomerPage
   - `/summary` → SummaryPage
   - `/users` → UserPage
   - `/roles` → RolePage
5. 路由守卫：未登录跳转 `/login`，已登录访问 `/login` 跳转 `/`，无权限路由跳转 403
6. 响应式布局：`useMediaQuery('(max-width:768px)')` 切换 MainLayout / MobileLayout
7. Sidebar 根据 `usePermission` hook 动态渲染菜单项（无权限的模块不显示）
8. Axios 拦截器：请求拦截器添加 `Authorization` 头；响应拦截器处理 401（跳转登录）和统一错误提示
9. `authStore`：存储 token、user、permissions；提供 `setAuth`、`clearAuth`、`hasPermission(code)` 方法
10. `format.ts`：金额格式化 `¥1,234.56`，日期格式化 `YYYY-MM-DD HH:mm`，工单编号保持4位

---

### T03: 前端业务页面（登录 + 仪表盘 + 工单 + 基础数据 + 汇总 + 权限管理）

**任务描述**: 实现全部业务页面和工单相关组件，包括登录页、仪表盘、工单管理（列表/表单/详情）、基础数据管理（售后人员/客户/联系人）、汇总查询、用户管理、角色管理。

**源文件列表**:
```
client/src/pages/LoginPage.tsx
client/src/pages/DashboardPage.tsx
client/src/pages/WorkOrderListPage.tsx
client/src/pages/WorkOrderFormPage.tsx
client/src/pages/WorkOrderDetailPage.tsx
client/src/pages/StaffPage.tsx
client/src/pages/CustomerPage.tsx
client/src/pages/SummaryPage.tsx
client/src/pages/UserPage.tsx
client/src/pages/RolePage.tsx
client/src/components/workOrder/WorkOrderForm.tsx
client/src/components/workOrder/WorkOrderTable.tsx
client/src/components/workOrder/WorkOrderMobileList.tsx
client/src/components/workOrder/WorkOrderDetail.tsx
client/src/components/basicData/StaffDialog.tsx
client/src/components/basicData/CustomerDialog.tsx
client/src/components/basicData/ContactDialog.tsx
```

**依赖**: T01（需要后端 API 可用）, T02（需要路由、布局、API层、组件库）

**优先级**: P0

**实现要点**:
1. **LoginPage**：居中卡片布局，用户名+密码输入，登录成功后判断 `mustChangePassword` 弹出改密对话框
2. **DashboardPage**：6个指标卡片（工单总数/总金额/已结款金额/未结款金额/已结款数/未结款数），快捷操作按钮，最近5条工单列表
3. **WorkOrderListPage**：
   - PC端使用 `WorkOrderTable`（MUI DataGrid/Table），展示完整列
   - 移动端使用 `WorkOrderMobileList`（卡片列表，点击展开详情）
   - 搜索栏（工单编号/客户名称）、筛选器（客户/日期范围/结款状态/售后人员）
   - 未结款行背景色 `#FFF0F0`，文字色 `#D32F2F`
   - 分页：每页20条
   - 操作列：查看详情、编辑、删除（根据权限显示/隐藏）
4. **WorkOrderForm**（新增/编辑共用组件）：
   - 客户下拉选择 → 联动加载联系人列表 → 选择联系人自动带出电话
   - 售后人员多选（MUI Autocomplete multi）
   - 费用输入：数字输入框，onchange 实时计算合计金额
   - React Hook Form + Zod 校验
   - 工单编号和录入时间只读（编辑模式）
5. **WorkOrderDetailPage**：展示全部字段 + 创建人/创建时间/修改人/修改时间
6. **StaffPage**：MUI Table + 新增/编辑对话框（StaffDialog），删除前检查是否关联工单
7. **CustomerPage**：客户列表 + 点击客户展开联系人管理（ContactDialog），客户编辑用 CustomerDialog
8. **SummaryPage**：三个 Tab（总体汇总 / 组合查询 / 人员汇总）
   - 总体汇总：9个指标卡片（3×3网格）
   - 组合查询：筛选条件 + 明细表格 + 合计行（最多50条，超出提示）
   - 人员汇总：表格展示，支持按工单数/金额排序
9. **UserPage**：用户列表 + 新增/编辑/删除/启用禁用/重置密码
10. **RolePage**：角色列表 + 新增/编辑 + 权限勾选矩阵（模块 × 读/写/无）

---

### T04: Docker 容器化部署配置

**任务描述**: 创建前后端 Dockerfile 和 docker-compose.yml，实现一键启动 MySQL + 后端 + 前端，包含数据库自动迁移和种子数据初始化。

**源文件列表**:
```
server/Dockerfile
client/Dockerfile
docker-compose.yml
.env.example
README.md
```

**依赖**: T01（后端代码完成）, T02（前端代码完成）

**优先级**: P1

**实现要点**:
1. **server/Dockerfile**：
   - 多阶段构建：Stage 1 `node:18-alpine` 安装依赖 + 编译 TS；Stage 2 仅复制 dist + node_modules + prisma
   - 启动命令：`npx prisma migrate deploy && npx prisma db seed && node dist/server.js`
2. **client/Dockerfile**：
   - 多阶段构建：Stage 1 `node:18-alpine` npm install + build；Stage 2 `nginx:alpine` 部署静态文件
   - Nginx 配置：SPA history 模式 fallback + `/api` 反向代理到后端
3. **docker-compose.yml**：
   - `mysql` 服务：MySQL 8.0，Volume 持久化数据，healthcheck
   - `server` 服务：依赖 mysql healthy，暴露 3000 端口，环境变量注入数据库连接
   - `client` 服务：依赖 server，暴露 80 端口
   - 网络隔离：app-network
4. **.env.example**：DATABASE_URL, JWT_SECRET, PORT, CLIENT_URL, MYSQL_ROOT_PASSWORD, MYSQL_DATABASE
5. **README.md**：项目说明、技术栈、本地开发指南、Docker 部署指南、默认账号

---

## 6. 依赖包列表

### 6.1 后端依赖（server/package.json）

#### dependencies

| 包名 | 版本 | 说明 |
|------|------|------|
| express | ^4.18.2 | Web 框架 |
| @prisma/client | ^5.8.0 | Prisma ORM 客户端 |
| jsonwebtoken | ^9.0.2 | JWT 签发与验证 |
| bcryptjs | ^2.4.3 | 密码哈希加密 |
| cors | ^2.8.5 | 跨域中间件 |
| zod | ^3.22.4 | 参数校验 |
| dotenv | ^16.3.1 | 环境变量加载 |
| morgan | ^1.10.0 | HTTP 请求日志 |
| helmet | ^7.1.0 | HTTP 安全头 |
| express-rate-limit | ^7.1.5 | 速率限制（登录保护） |

#### devDependencies

| 包名 | 版本 | 说明 |
|------|------|------|
| typescript | ^5.3.3 | TypeScript 编译器 |
| tsx | ^4.7.0 | TS 运行时（seed脚本） |
| prisma | ^5.8.0 | Prisma CLI |
| @types/express | ^4.17.21 | Express 类型 |
| @types/jsonwebtoken | ^9.0.5 | JWT 类型 |
| @types/bcryptjs | ^2.4.6 | bcryptjs 类型 |
| @types/cors | ^2.8.17 | cors 类型 |
| @types/morgan | ^1.9.9 | morgan 类型 |
| @types/node | ^20.10.0 | Node.js 类型 |
| nodemon | ^3.0.2 | 开发热重载 |
| eslint | ^8.56.0 | 代码检查 |
| @typescript-eslint/eslint-plugin | ^6.19.0 | TS ESLint 插件 |
| @typescript-eslint/parser | ^6.19.0 | TS ESLint 解析器 |

### 6.2 前端依赖（client/package.json）

#### dependencies

| 包名 | 版本 | 说明 |
|------|------|------|
| react | ^18.2.0 | UI 框架 |
| react-dom | ^18.2.0 | React DOM 渲染 |
| react-router-dom | ^6.21.3 | 路由 |
| @mui/material | ^5.15.6 | MUI 组件库 |
| @mui/icons-material | ^5.15.6 | MUI 图标 |
| @emotion/react | ^11.11.3 | MUI 依赖 |
| @emotion/styled | ^11.11.0 | MUI 依赖 |
| @mui/x-data-grid | ^6.18.6 | MUI 数据表格 |
| @mui/x-date-pickers | ^6.18.6 | 日期选择器 |
| dayjs | ^1.11.10 | 日期处理 |
| axios | ^1.6.5 | HTTP 客户端 |
| zustand | ^4.5.0 | 状态管理 |
| react-hook-form | ^7.49.3 | 表单管理 |
| @hookform/resolvers | ^3.3.4 | 表单校验适配器 |
| zod | ^3.22.4 | 参数校验（前后端共享） |
| notistack | ^3.0.1 | 消息通知（Snackbar） |

#### devDependencies

| 包名 | 版本 | 说明 |
|------|------|------|
| typescript | ^5.3.3 | TypeScript 编译器 |
| vite | ^5.0.12 | 构建工具 |
| @vitejs/plugin-react | ^4.2.1 | Vite React 插件 |
| tailwindcss | ^3.4.1 | Tailwind CSS |
| postcss | ^8.4.33 | PostCSS |
| autoprefixer | ^10.4.17 | 自动前缀 |
| @types/react | ^18.2.48 | React 类型 |
| @types/react-dom | ^18.2.18 | React DOM 类型 |
| eslint | ^8.56.0 | 代码检查 |
| @typescript-eslint/eslint-plugin | ^6.19.0 | TS ESLint 插件 |
| @typescript-eslint/parser | ^6.19.0 | TS ESLint 解析器 |
| eslint-plugin-react-hooks | ^4.6.0 | React Hooks 规则 |

---

## 7. 共享知识（跨文件约定）

### 7.1 API 响应格式

所有 API 统一返回以下 JSON 结构：

```typescript
// 成功响应
{
  "code": 200,
  "data": T,            // 业务数据
  "message": "success"  // 可选，默认 "success"
}

// 分页列表响应
{
  "code": 200,
  "data": {
    "items": T[],        // 数据列表
    "total": number,     // 总记录数
    "page": number,      // 当前页码（从1开始）
    "pageSize": number   // 每页条数
  }
}

// 错误响应
{
  "code": number,        // HTTP状态码或业务错误码
  "message": string,     // 错误描述
  "errors"?: object[]    // 字段级校验错误（可选）
}
```

### 7.2 认证 Token 格式

- **Header**: `Authorization: Bearer <token>`
- **JWT Payload**:
  ```json
  {
    "userId": 1,
    "roleId": 1,
    "username": "admin",
    "iat": 1709600000,
    "exp": 1709628800   // 8小时后过期
  }
  ```
- **JWT_SECRET**: 通过环境变量配置，至少32位随机字符串

### 7.3 错误码定义

| 错误码 | 含义 | HTTP Status |
|--------|------|-------------|
| 200 | 成功 | 200 |
| 400 | 请求参数错误 | 400 |
| 401 | 未认证 / Token 无效 | 401 |
| 403 | 权限不足 | 403 |
| 404 | 资源不存在 | 404 |
| 409 | 资源冲突（如用户名重复） | 409 |
| 423 | 账号已锁定 | 423 |
| 500 | 服务器内部错误 | 500 |

### 7.4 前后端共享类型定义

以下类型在前后端保持一致，前端 `client/src/types/index.ts` 与后端 `server/src/types/index.ts` 定义相同：

```typescript
// 权限码枚举
type PermissionCode =
  | 'workorder:create' | 'workorder:read' | 'workorder:update' | 'workorder:delete'
  | 'staff:read' | 'staff:manage'
  | 'customer:read' | 'customer:manage'
  | 'summary:view'
  | 'payment:manage'
  | 'user:manage' | 'role:manage';

// 工单状态
interface WorkOrder {
  id: number;
  orderNo: string;
  customerId: number;
  customerName: string;       // 关联查询带出
  contactId: number;
  contactName: string;        // 关联查询带出
  contactPhone: string | null;
  staffNames: string;         // "张伟、李娜"
  description: string;
  laborCost: number;
  materialCost: number;
  travelCost: number;
  totalAmount: number;
  isPaid: boolean;
  isDeleted: boolean;
  createdBy: number;
  createdByName: string;      // 关联查询带出
  updatedBy: number | null;
  updatedByName: string | null;
  createdAt: string;          // ISO 8601
  updatedAt: string;
}

// 售后人员分隔符
const STAFF_NAMES_SEPARATOR = '、';  // 中文顿号

// 日期格式
const DATE_FORMAT = 'YYYY-MM-DD';
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';
```

### 7.5 环境变量定义

#### 后端（server/.env）

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | MySQL 连接字符串 | `mysql://root:password@localhost:3306/workorder_db` |
| `JWT_SECRET` | JWT 签名密钥 | `your-super-secret-key-at-least-32-chars` |
| `JWT_EXPIRES_IN` | Token 有效期 | `8h` |
| `PORT` | 服务端口 | `3000` |
| `CLIENT_URL` | 前端地址（CORS） | `http://localhost:5173` |
| `BCRYPT_SALT_ROUNDS` | bcrypt 盐值轮数 | `10` |
| `LOGIN_MAX_ATTEMPTS` | 最大登录尝试次数 | `5` |
| `LOCK_DURATION_MINUTES` | 锁定时长（分钟） | `30` |

#### 前端（client/.env）

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | API 基础地址 | `/api`（开发环境走代理） |

### 7.6 关键业务规则约定

1. **工单编号生成**：查询 `MAX(CAST(order_no AS UNSIGNED))` + 1，`padStart(4, '0')`。并发场景使用数据库事务 + 乐观锁（通过唯一索引兜底，冲突时重试）。
2. **金额计算**：`total_amount = labor_cost + material_cost + travel_cost`，在后端 service 层保存时重新计算（不信任前端传入的 totalAmount）。
3. **售后人员匹配**：`staff_names` 字段使用中文顿号 `、` 分隔，如 `"张伟、李娜"`。查询时使用 `LIKE '%张伟%'`。
4. **软删除**：所有查询默认 `WHERE is_deleted = false`，删除操作设置 `is_deleted = true`。
5. **客户→联系人联动**：前端选择客户后调用 `GET /api/customers/:id/contacts` 获取联系人列表，选择联系人后从前端缓存的联系人数据中提取电话号码自动填充。
6. **未结款标红**：前端通过行 `isPaid === false` 判断，设置行样式 `backgroundColor: '#FFF0F0', color: '#D32F2F'`。
7. **密码策略**：至少8位，必须包含至少1个字母和1个数字。正则：`/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/`。

---

## 8. 待明确事项

| 编号 | 待明确事项 | 当前处理方案 | 影响 |
|------|-----------|-------------|------|
| A1 | 售后人员与系统用户是否需要关联（PRD Q2） | 当前版本不关联，售后人员表与用户表独立。售后人员角色用户查看"自己参与"的工单时，使用用户 `displayName` 与工单 `staff_names` 做字符串匹配 | 若后续需精确关联，需新增 `after_sales_staff.user_id` 外键 |
| A2 | 售后人员参与统计使用姓名字符串匹配是否改为关联表（PRD Q7） | 当前版本使用 `staff_names` 字符串字段 + `LIKE` 匹配，符合 PRD 要求 | 大数据量下 LIKE 查询性能有限，建议后续优化为 `work_order_staff` 多对多关联表 |
| A3 | 组合查询明细是否需要分页（PRD Q4） | 当前版本限制最多展示50条，超出提示总数 | 后续可增加分页参数 |
| A4 | 操作日志功能（P2）是否在本期实现 | 数据库表已预留 `operation_logs`，但前端页面和 API 在 P2 阶段实现 | 仅建表，无功能入口 |
| A5 | 数据导出功能（P2）是否在本期实现 | 本期不实现，后续可增加 `xlsx` 库导出 | 无影响 |
| A6 | 工单编号是否包含年份前缀（PRD Q1） | 采用纯数字递增 `0001` 格式，符合 PRD 建议 | 若需改为 `2025-0001` 格式，仅需修改 `orderNo.ts` |
| A7 | Docker 部署中前端是否需要独立服务还是由后端提供静态文件 | 当前方案为前端独立 Nginx 容器，通过 docker-compose 编排 | 后端无需处理静态文件，前后端可独立部署 |
| A8 | JWT 刷新机制是否在本期实现 | PRD 提到"支持刷新"，当前方案为8小时有效期，过期需重新登录。刷新机制可在 P1 后续迭代增加 | 用户可能需要频繁登录 |

---

> **文档结束** — 工程师请按 T01 → T02 → T03 → T04 的顺序执行任务。T01 和 T02 可并行开发。
