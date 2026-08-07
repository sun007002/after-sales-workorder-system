# 售后服务工单管理系统 - 增量需求 PRD v2

> **版本**: v2.0（增量）
> **日期**: 2025-07-14
> **作者**: 许清楚（产品经理）
> **基线版本**: v1.0（见 `docs/PRD.md`）
> **状态**: 待评审

---

## 目录

1. [变更概述](#1-变更概述)
2. [需求一：仪表盘重设计](#2-需求一仪表盘重设计)
3. [需求二：工单增加开始/结束时间字段](#3-需求二工单增加开始结束时间字段)
4. [需求三：工单新增文件上传功能](#4-需求三工单新增文件上传功能)
5. [数据库变更汇总](#5-数据库变更汇总)
6. [新增 API 接口汇总](#6-新增-api-接口汇总)
7. [待确认问题](#7-待确认问题)

---

## 1. 变更概述

本次增量需求在 v1.0 基线上新增三个功能模块，均为 **P0 优先级**：

| 编号 | 需求 | 优先级 | 影响范围 |
|------|------|--------|----------|
| FEAT-1 | 仪表盘重设计 — 替换现有 6 卡片 + 最近工单布局，改为指标卡片 + 4 个图表 + 数据库表状态 | P0 | 前端仪表盘页面、后端新增图表数据 API |
| FEAT-2 | 工单增加开始时间和结束时间字段 | P0 | 数据库 schema、后端工单 CRUD、前端表单/列表/详情 |
| FEAT-3 | 工单新增文件上传功能 | P0 | 数据库新增表、后端文件上传/下载服务、前端表单/详情 |

**技术栈不变**：前端 React 18 + Vite + MUI 5 + Tailwind CSS；后端 Node.js + Express + Prisma + MySQL。

---

## 2. 需求一：仪表盘重设计

### 2.1 背景与目标

当前仪表盘页面（`DashboardPage.tsx`）采用 6 个指标卡片 + 快捷操作 + 最近工单表格的布局，信息密度低且缺少数据可视化能力。用户需要更直观的图表来洞察业务趋势。

**目标**：重新设计仪表盘，引入 4 类图表 + 数据库表状态概览，提升数据可视化能力。

### 2.2 用户故事

> **US-D1**：作为管理员，我希望在仪表盘顶部看到 4 个核心指标卡片（工单总数含已结款/未结款细分、工单总金额、已结款金额、未结款金额），以便快速掌握业务全貌。
>
> **US-D2**：作为售后主管，我希望看到月度工单金额趋势柱状图，以便了解业务量随月份的变化趋势。
>
> **US-D3**：作为售后主管，我希望看到费用构成环形图（人工费/材料费/交通差旅费占比），以便分析成本结构。
>
> **US-D4**：作为管理员，我希望看到客户金额排行横向条形图（按工单合计金额排序的 Top N 客户），以便识别重点客户。
>
> **US-D5**：作为管理员，我希望看到数据库各表记录数的状态表格，以便监控数据规模。

### 2.3 UI/UX 设计说明

#### 2.3.1 整体布局

参照用户上传的截图，仪表盘采用以下布局结构（PC 端 ≥ 1200px）：

```
┌────────────────────────────────────────────────────────────────────┐
│  PageHeader: 仪表盘 / 关键指标总览                    [新建工单]     │
├──────────────┬──────────────┬──────────────┬──────────────────────┤
│  指标卡片 1   │  指标卡片 2   │  指标卡片 3   │    指标卡片 4         │
│  工单总数     │  工单总金额   │  已结款金额   │    未结款金额         │
│  (已结款/    │              │              │                      │
│   未结款)    │              │              │                      │
├─────────────────────────────┬──────────────────────────────────────┤
│                             │                                      │
│  月度工单金额趋势            │     费用构成                         │
│  (柱状图)                    │     (环形图)                         │
│                             │                                      │
│  X轴: 月份(近12个月)         │     人工费 / 材料费 / 交通差旅费      │
│  Y轴: 金额(元)              │     百分比占比                       │
│                             │                                      │
├─────────────────────────────┼──────────────────────────────────────┤
│                             │                                      │
│  客户金额排行                │     数据库表状态                      │
│  (横向条形图)                │     (表格)                           │
│                             │                                      │
│  Y轴: 客户名称(Top 10)       │     表名 | 记录数                    │
│  X轴: 工单合计金额           │                                      │
│                             │                                      │
└─────────────────────────────┴──────────────────────────────────────┘
```

#### 2.3.2 指标卡片设计（顶部一行 4 个）

| 卡片 | 标题 | 主数值 | 副数值 | 图标 | 主色 |
|------|------|--------|--------|------|------|
| 卡片 1 | 工单总数 | 总工单数（数字） | 已结款 N / 未结款 M | AssignmentIcon | primary（`#1976D2`） |
| 卡片 2 | 工单总金额 | `¥` 格式化金额 | — | AttachMoneyIcon | primary（`#1976D2`） |
| 卡片 3 | 已结款金额 | `¥` 格式化金额（绿色） | 已结款 N 笔 | CheckCircleIcon | success（`#4CAF50`） |
| 卡片 4 | 未结款金额 | `¥` 格式化金额（红色） | 未结款 M 笔 | MoneyOffIcon | error（`#F44336`） |

- 卡片宽度：4 列等分（`xs={12} sm={6} md={3}`）
- 卡片高度统一，使用 `StatCard` 组件（已有），需扩展支持副数值显示
- 移动端：2×2 网格布局

#### 2.3.3 月度工单金额趋势（左上柱状图）

- **图表类型**：柱状图（Bar Chart）
- **数据维度**：X 轴 = 月份（近 12 个月，格式 `YYYY-MM`），Y 轴 = 该月工单合计金额总和
- **交互**：鼠标悬停显示 Tooltip（月份 + 金额）
- **空状态**：无数据月份柱高为 0，显示 "暂无数据"
- **配色**：柱体使用主色 `#1976D2`，悬停高亮 `#1565C0`
- **尺寸**：高度 300px，宽度自适应（左侧 50%）

#### 2.3.4 费用构成（右上环形图）

- **图表类型**：环形图（Doughnut Chart）
- **数据**：全部工单的三项费用总和占比
  - 人工费（`#1976D2` 蓝色）
  - 材料费（`#FF9800` 橙色）
  - 交通差旅费（`#4CAF50` 绿色）
- **中心显示**：总费用金额
- **图例**：底部图例显示各项费用名称 + 金额 + 百分比
- **交互**：悬停高亮对应扇区，显示详细金额
- **尺寸**：高度 300px，宽度自适应（右侧 50%）

#### 2.3.5 客户金额排行（左下横向条形图）

- **图表类型**：横向条形图（Horizontal Bar Chart）
- **数据**：按客户工单合计金额降序排列的 Top 10 客户
- **维度**：Y 轴 = 客户名称，X 轴 = 合计金额
- **交互**：鼠标悬停显示 Tooltip（客户名 + 工单数 + 合计金额）
- **配色**：条形使用主色 `#1976D2`，排名第一的条形用 `#1565C0` 加深
- **尺寸**：高度 300px，宽度自适应（左侧 50%）

#### 2.3.6 数据库表状态（右下表格）

- **展示形式**：简单表格
- **列**：表名（中文名称）、记录数
- **数据来源**：后端查询各数据表的 `COUNT(*)`
- **展示的表**：

  | 表名 | 中文名称 |
  |------|----------|
  | `work_orders` | 工单表 |
  | `customers` | 客户表 |
  | `customer_contacts` | 客户联系人表 |
  | `after_sales_staff` | 售后人员表 |
  | `users` | 用户表 |
  | `roles` | 角色表 |
  | `operation_logs` | 操作日志表 |

- **样式**：斑马纹表格，表头灰色背景
- **尺寸**：高度 300px，宽度自适应（右侧 50%），表格内可滚动

#### 2.3.7 响应式适配

| 断点 | 布局策略 |
|------|----------|
| Desktop (≥1200px) | 4 列指标卡片 + 2×2 图表网格 |
| Tablet (768~1199px) | 2×2 指标卡片 + 2×2 图表网格（图表可能略小） |
| Mobile (<768px) | 1 列指标卡片 + 1 列图表纵向排列 |

#### 2.3.8 图表库选型

项目前端已安装 `@mui/x-data-grid`，但未安装图表库。建议引入 **Recharts**（轻量、React 原生、与 MUI 风格兼容）：

```
npm install recharts
```

替代方案：`@mui/x-charts`（MUI 官方图表库，但当前处于 Labs 阶段，API 可能不稳定）。推荐 Recharts 作为首选。

#### 2.3.9 保留功能

- 顶部 PageHeader 及「新建工单」按钮保留
- 删除原有的「最近工单」表格（如需保留可移至页面底部，但截图未展示，建议移除）
- 删除原有的「未结款工单」快捷按钮（截图未展示，建议移除）

### 2.4 新增 API 接口

#### 2.4.1 `GET /api/summary/dashboard`

获取仪表盘所需的全部图表数据，一次性返回，减少前端请求次数。

**权限**：`summary:view`

**响应体**：

```typescript
interface DashboardData {
  // 指标卡片数据（复用现有 OverviewSummary）
  overview: {
    totalOrders: number;
    totalLaborCost: number;
    totalMaterialCost: number;
    totalTravelCost: number;
    totalAmount: number;
    paidOrderCount: number;
    paidAmount: number;
    unpaidOrderCount: number;
    unpaidAmount: number;
  };

  // 月度工单金额趋势（近12个月）
  monthlyTrend: Array<{
    month: string;       // 格式 "YYYY-MM"
    amount: number;      // 该月工单合计金额总和
    count: number;       // 该月工单数量
  }>;

  // 费用构成
  costBreakdown: {
    laborCost: number;      // 人工费总计
    materialCost: number;   // 材料费总计
    travelCost: number;     // 交通差旅费总计
    totalCost: number;      // 总费用（=三项之和）
  };

  // 客户金额排行（Top 10）
  customerRanking: Array<{
    customerId: number;
    customerName: string;
    totalAmount: number;    // 该客户所有工单合计金额总和
    orderCount: number;     // 该客户工单数量
  }>;

  // 数据库表状态
  tableStats: Array<{
    tableName: string;      // 数据库表名
    displayName: string;    // 中文显示名
    recordCount: number;    // 记录数
  }>;
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "overview": {
      "totalOrders": 156,
      "totalLaborCost": 125000.00,
      "totalMaterialCost": 89000.00,
      "totalTravelCost": 34000.00,
      "totalAmount": 248000.00,
      "paidOrderCount": 98,
      "paidAmount": 156000.00,
      "unpaidOrderCount": 58,
      "unpaidAmount": 92000.00
    },
    "monthlyTrend": [
      { "month": "2024-08", "amount": 18000.00, "count": 12 },
      { "month": "2024-09", "amount": 22000.00, "count": 15 }
    ],
    "costBreakdown": {
      "laborCost": 125000.00,
      "materialCost": 89000.00,
      "travelCost": 34000.00,
      "totalCost": 248000.00
    },
    "customerRanking": [
      { "customerId": 1, "customerName": "华为技术有限公司", "totalAmount": 58000.00, "orderCount": 28 },
      { "customerId": 2, "customerName": "比亚迪股份有限公司", "totalAmount": 42000.00, "orderCount": 22 }
    ],
    "tableStats": [
      { "tableName": "work_orders", "displayName": "工单表", "recordCount": 156 },
      { "tableName": "customers", "displayName": "客户表", "recordCount": 8 }
    ]
  }
}
```

**数据说明**：
- `monthlyTrend`：基于 `created_at` 按月分组聚合，仅取近 12 个月（含当前月），无数据的月份返回 amount=0, count=0
- `costBreakdown`：基于全部未删除工单的三项费用 SUM
- `customerRanking`：按客户分组合计金额降序排列，取前 10 条
- `tableStats`：使用 Prisma 的 `$queryRaw` 执行各表 COUNT 查询，仅统计有效记录（工单表排除软删除记录）
- **数据级权限**：售后人员角色仅统计自己参与的工单数据（与现有 `buildBaseWhere` 逻辑一致）

### 2.5 涉及文件清单

#### 前端（client）

| 文件 | 操作 | 说明 |
|------|------|------|
| `package.json` | 修改 | 新增 `recharts` 依赖 |
| `src/pages/DashboardPage.tsx` | 重写 | 替换整个仪表盘页面布局和逻辑 |
| `src/api/summary.api.ts` | 修改 | 新增 `getDashboardData()` 函数 |
| `src/types/index.ts` | 修改 | 新增 `DashboardData` 等接口类型 |
| `src/components/common/StatCard.tsx` | 修改 | 扩展支持副数值（subValue）显示 |
| `src/components/dashboard/MonthlyTrendChart.tsx` | 新增 | 月度趋势柱状图组件 |
| `src/components/dashboard/CostBreakdownChart.tsx` | 新增 | 费用构成环形图组件 |
| `src/components/dashboard/CustomerRankingChart.tsx` | 新增 | 客户排行横向条形图组件 |
| `src/components/dashboard/TableStatusTable.tsx` | 新增 | 数据库表状态表格组件 |

#### 后端（server）

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/services/summary.service.ts` | 修改 | 新增 `getDashboardData()` 方法 |
| `src/controllers/summary.controller.ts` | 修改 | 新增 `getDashboard` 控制器方法 |
| `src/routes/summary.routes.ts` | 修改 | 新增 `GET /dashboard` 路由 |
| `src/types/index.ts` | 修改 | 新增 `DashboardData` 接口类型 |

---

## 3. 需求二：工单增加开始/结束时间字段

### 3.1 背景与目标

当前工单仅有 `created_at`（录入时间），无法记录实际服务的起止时间。需要增加「开始时间」和「结束时间」字段，用于反映实际服务时长，支持后续的服务效率分析。

### 3.2 用户故事

> **US-T1**：作为售后人员，我希望在录入工单时填写服务的开始时间和结束时间（精确到小时），以便准确记录服务时长。
>
> **US-T2**：作为售后主管，我希望在工单列表和详情页中看到开始时间和结束时间，以便了解每项服务的耗时。
>
> **US-T3**：作为售后人员，我希望系统校验开始时间不晚于结束时间，以避免录入错误。

### 3.3 字段定义

| 字段名 | 数据库列名 | 类型 | 必填 | 默认值 | 说明 |
|--------|-----------|------|------|--------|------|
| 开始时间 | `start_time` | `DateTime` | 否 | `null` | 服务实际开始时间，精确到小时（分钟部分存储为 00） |
| 结束时间 | `end_time` | `DateTime` | 否 | `null` | 服务实际结束时间，精确到小时 |

**设计决策**：
- 设为**可选字段**（`null` 允许），因为部分历史工单或紧急工单可能无法立即填写起止时间
- 精度：精确到小时。前端使用 `datetime-local` 输入控件（`type="datetime-local"` + `step={3600}`），后端 DateTime 存储
- 校验规则：若两个字段都填写了，`start_time` 必须 ≤ `end_time`，否则后端返回 400 错误
- 仅当两个字段都填写时才计算服务时长（`end_time - start_time`），可在详情页显示

### 3.4 UI/UX 设计

#### 3.4.1 工单表单（`WorkOrderForm.tsx`）

- 在「售后人员」字段下方、「售后描述」字段上方新增一行，放置两个 `datetime-local` 输入框：

```
┌─────────────────────────────────────┐
│  客户名称          联系人            │
│  联系电话          售后人员          │
│  开始时间          结束时间    ← 新增 │
│  售后描述                            │
│  人工费  材料费  交通差旅费          │
│  合计金额          是否结款          │
└─────────────────────────────────────┘
```

- 使用 MUI `TextField` 组件，`type="datetime-local"`，`InputProps={{ inputProps: { step: 3600 } }}` 实现小时级选择
- 标签：「开始时间」「结束时间」，不标记为必填（无 `required` 属性）
- 校验提示：若开始时间 > 结束时间，提交时弹出 Snackbar 提示「开始时间不能晚于结束时间」
- 布局：`Grid item xs={12} md={6}` 两个并排

#### 3.4.2 工单列表（`WorkOrderTable.tsx`）

- 在「录入时间」列后新增两列：「开始时间」「结束时间」
- 列宽适中，格式化为 `YYYY-MM-DD HH:00`
- 空值显示 `-`
- 移动端卡片列表（`WorkOrderMobileList.tsx`）：在展开详情中显示

#### 3.4.3 工单详情（`WorkOrderDetail.tsx`）

- 在「基本信息」表格中，「录入时间」行后新增两行：

  | 字段 | 值 |
  |------|-----|
  | 开始时间 | `formatDateTime(workOrder.startTime)` 或 `-` |
  | 结束时间 | `formatDateTime(workOrder.endTime)` 或 `-` |

- 若两个字段都有值，在「结束时间」行后追加一行「服务时长」，显示如 `3小时` / `2天5小时`

### 3.5 后端变更

#### 3.5.1 数据库 Schema 变更

在 `WorkOrder` model 中新增两个字段：

```prisma
model WorkOrder {
  // ... 现有字段 ...
  startTime   DateTime? @map("start_time")
  endTime     DateTime? @map("end_time")
  // ... 现有字段 ...
  files       WorkOrderFile[]   // 关联文件（需求三）
}
```

#### 3.5.2 Service 层变更

**`workOrder.service.ts`**：

1. `toWorkOrderDTO()` 函数：新增 `startTime` 和 `endTime` 字段映射（`Date | null` → `string | null` ISO 格式）
2. `CreateWorkOrderInput` 接口：新增 `startTime?: string | null` 和 `endTime?: string | null`
3. `UpdateWorkOrderInput` 接口：同上
4. `createWorkOrder()` 函数：
   - 新增参数解析
   - 校验：若 `startTime` 和 `endTime` 都提供，检查 `startTime <= endTime`
   - 写入 `startTime` 和 `endTime` 到 `prisma.workOrder.create`
5. `updateWorkOrder()` 函数：
   - 同上校验逻辑
   - 更新 `startTime` 和 `endTime`（若请求中提供）

#### 3.5.3 Controller 层变更

**`workOrder.controller.ts`**：无需额外修改，透传 request body 即可（现有模式已在 service 层做校验）。

### 3.6 涉及文件清单

#### 前端（client）

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/index.ts` | 修改 | `WorkOrder` 接口新增 `startTime` / `endTime` 字段；`CreateWorkOrderRequest` 同步 |
| `src/api/workOrder.api.ts` | 修改 | `CreateWorkOrderRequest` 接口新增字段 |
| `src/components/workOrder/WorkOrderForm.tsx` | 修改 | 新增开始/结束时间输入控件 + 校验 |
| `src/components/workOrder/WorkOrderTable.tsx` | 修改 | 新增两列 |
| `src/components/workOrder/WorkOrderDetail.tsx` | 修改 | 基本信息表格新增两行 + 服务时长 |
| `src/components/workOrder/WorkOrderMobileList.tsx` | 修改 | 展开详情新增时间字段 |
| `src/utils/format.ts` | 修改 | 新增 `formatDuration()` 工具函数（计算时长） |

#### 后端（server）

| 文件 | 操作 | 说明 |
|------|------|------|
| `prisma/schema.prisma` | 修改 | `WorkOrder` model 新增 `startTime` / `endTime` 字段 |
| `src/types/index.ts` | 修改 | `WorkOrderDTO` 新增字段 |
| `src/services/workOrder.service.ts` | 修改 | DTO 转换、创建/更新逻辑新增字段处理与校验 |

---

## 4. 需求三：工单新增文件上传功能

### 4.1 背景与目标

售后工单经常需要关联现场照片、维修报告等附件。当前系统无文件上传能力（v1.0 PRD 中 Q8 列为待确认，P2 优先级）。现提升为 P0 优先级，需实现完整的文件上传、存储、查看、下载功能。

### 4.2 用户故事

> **US-F1**：作为售后人员，我希望在创建/编辑工单时上传多个文件（图片、Excel、Word等），以便关联现场照片和维修报告等附件。
>
> **US-F2**：作为售后主管，我希望在工单详情页查看和下载已上传的文件，以便审核工单内容。
>
> **US-F3**：作为售后人员，我希望在上传文件后可以删除误传的文件，以保持工单附件的准确性。

### 4.3 功能详细需求

#### 4.3.1 文件上传

| 需求项 | 描述 |
|--------|------|
| 支持的文件类型 | 图片（jpg, jpeg, png, gif, webp）、Excel（xls, xlsx）、Word（doc, docx）、PDF（pdf） |
| 单文件大小限制 | ≤ 10MB |
| 每工单文件数量限制 | ≤ 20 个 |
| 上传时机 | 在工单表单页面选择文件，提交工单时统一上传；或在工单已保存后单独上传 |
| 上传方式 | 支持拖拽上传和点击选择文件 |
| 上传进度 | 显示上传进度条 |
| 文件名处理 | 服务器生成唯一文件名（UUID + 原始扩展名），保留原始文件名用于展示 |
| 存储位置 | 服务器文件系统，路径通过环境变量 `UPLOAD_DIR` 配置，默认 `./uploads` |
| 静态文件服务 | Express 配置 `express.static` 暴露上传目录，或通过专用 API 流式下载 |

#### 4.3.2 文件查看与下载

| 需求项 | 描述 |
|--------|------|
| 工单详情页 | 展示文件列表（文件名、类型图标、大小、上传人、上传时间） |
| 图片预览 | 图片类型支持缩略图预览，点击放大查看 |
| 文件下载 | 点击下载按钮，触发文件下载（`Content-Disposition: attachment`） |
| 文件删除 | 在详情页可删除文件（权限：工单创建人或管理员），删除同时删除物理文件 |

#### 4.3.3 文件上传交互流程

**方案 A（推荐）：工单保存后单独上传**

1. 用户填写工单表单并保存（创建/编辑）
2. 保存成功后跳转到工单详情页
3. 详情页底部显示「附件」区域，含上传按钮
4. 用户点击上传按钮 / 拖拽文件到上传区域
5. 文件逐个上传，显示进度
6. 上传完成后刷新文件列表

**方案 B：表单内预上传**

1. 用户在工单表单页面选择文件
2. 文件暂存在前端（File 对象数组），展示文件列表
3. 提交工单时，先创建工单，再逐个上传文件关联到该工单
4. 上传完成后跳转详情页

**决策**：采用 **方案 A**（工单保存后单独上传），原因：
- 工单创建和文件上传解耦，降低复杂度
- 避免工单创建失败后已上传文件的清理问题
- 编辑模式下无需特殊处理已有文件

### 4.4 数据库设计

新增 `WorkOrderFile` model：

```prisma
// ========== WorkOrderFile ==========
model WorkOrderFile {
  id             Int      @id @default(autoincrement())
  workOrderId    Int      @map("work_order_id")
  fileName       String   @map("file_name") @db.VarChar(255)    // 服务器存储的唯一文件名
  originalName   String   @map("original_name") @db.VarChar(255) // 用户上传时的原始文件名
  filePath       String   @map("file_path") @db.VarChar(500)    // 相对路径或完整路径
  fileType       String   @map("file_type") @db.VarChar(50)     // MIME 类型
  fileSize       Int      @map("file_size")                      // 文件大小（字节）
  uploadedBy     Int      @map("uploaded_by")
  createdAt      DateTime @default(now()) @map("created_at")

  workOrder      WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  uploader       User      @relation("WorkOrderFileUploadedBy", fields: [uploadedBy], references: [id])

  @@map("work_order_files")
  @@index([workOrderId])
  @@index([uploadedBy])
}
```

**关系说明**：
- `WorkOrderFile` → `WorkOrder`：多对一（一个工单可有多个文件），级联删除（工单删除时文件记录一并删除）
- `WorkOrderFile` → `User`：多对一（记录上传人）
- `WorkOrder` model 需新增反向关联字段 `files WorkOrderFile[]`
- `User` model 需新增反向关联字段 `uploadedFiles WorkOrderFile[] @relation("WorkOrderFileUploadedBy")`

### 4.5 文件存储方案

#### 4.5.1 存储目录结构

```
uploads/
├── work_orders/
│   ├── {work_order_id}/
│   │   ├── {uuid}.{ext}
│   │   ├── {uuid}.{ext}
│   │   └── ...
│   └── ...
```

- 按工单 ID 分目录存储，便于管理和清理
- 文件名使用 UUID v4 + 原始扩展名，避免重名冲突

#### 4.5.2 配置

在 `server/src/config/index.ts` 中新增：

```typescript
upload: {
  dir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
  ],
},
```

#### 4.5.3 静态文件服务

在 `app.ts` 中配置：

```typescript
import path from 'path';
// 静态文件服务 - 上传的文件
app.use('/uploads', express.static(path.resolve(config.upload.dir)));
```

或通过专用下载 API（更安全，可鉴权）：

```
GET /api/work-orders/:id/files/:fileId/download
```

**推荐**：使用专用下载 API，确保文件访问经过 JWT 鉴权。

### 4.6 新增 API 接口

#### 4.6.1 `POST /api/work-orders/:id/files`

上传文件到指定工单。

**权限**：`workorder:update`（有编辑权限的用户可上传文件）

**请求**：`multipart/form-data`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | File | 是 | 上传的文件（支持单文件上传，前端循环调用实现多文件） |

**响应**：

```typescript
interface WorkOrderFileDTO {
  id: number;
  workOrderId: number;
  fileName: string;       // 服务器存储文件名
  originalName: string;   // 原始文件名
  filePath: string;       // 相对路径
  fileType: string;       // MIME 类型
  fileSize: number;       // 字节数
  uploadedBy: number;
  uploadedByName: string;
  createdAt: string;      // ISO 时间
}
```

**错误处理**：
- 文件大小超限：400，`文件大小不能超过10MB`
- 文件类型不允许：400，`不支持的文件类型: {type}`
- 工单不存在：404
- 文件数量超限：400，`每个工单最多上传20个文件`

#### 4.6.2 `GET /api/work-orders/:id/files`

获取指定工单的所有文件列表。

**权限**：`workorder:read`

**响应**：`WorkOrderFileDTO[]`

#### 4.6.3 `GET /api/work-orders/:id/files/:fileId/download`

下载指定文件。

**权限**：`workorder:read`

**响应**：文件流（`Content-Type` 为文件 MIME 类型，`Content-Disposition: attachment; filename="{originalName}"`）

#### 4.6.4 `DELETE /api/work-orders/:id/files/:fileId`

删除指定文件。

**权限**：`workorder:update`（工单创建人或管理员）

**行为**：
1. 删除数据库中的文件记录
2. 删除服务器上的物理文件
3. 返回 204 No Content

### 4.7 UI/UX 设计

#### 4.7.1 工单详情页附件区域

在工单详情页（`WorkOrderDetail.tsx`）底部新增「附件」区域：

```
┌─────────────────────────────────────────┐
│  附件                                    │
│  ┌─────────────────────────────────┐    │
│  │  [拖拽文件到此处或点击上传]       │    │
│  │                                  │    │
│  │  支持图片、Excel、Word、PDF      │    │
│  │  单文件最大10MB                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  文件列表:                               │
│  ┌──────────────────────────────────┐   │
│  │ 📎 现场照片1.jpg    2.3MB  张伟  │   │
│  │    2025-07-14 10:30  [下载][删除] │   │
│  ├──────────────────────────────────┤   │
│  │ 📊 维修报告.xlsx    156KB  张伟  │   │
│  │    2025-07-14 10:31  [下载][删除] │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

- 上传区域：MUI `Box` + 虚线边框 + 拖拽事件监听（`onDrop`, `onDragOver`, `onDragLeave`）
- 文件列表：卡片或列表项形式，显示文件类型图标、文件名、大小、上传人、上传时间
- 图片缩略图：图片类型文件显示 64×64 缩略图，点击放大（使用 MUI `Dialog` + `img`）
- 操作按钮：下载（所有有权查看的用户）、删除（仅创建人或管理员）
- 权限控制：无 `workorder:update` 权限时不显示上传区域和删除按钮

#### 4.7.2 文件类型图标映射

| 文件类型 | 图标 | MUI Icon |
|----------|------|----------|
| 图片 | 🖼️ | `ImageIcon` |
| Excel | 📊 | `TableChartIcon` |
| Word | 📄 | `DescriptionIcon` |
| PDF | 📕 | `PictureAsPdfIcon` |
| 其他 | 📎 | `AttachFileIcon` |

### 4.8 涉及文件清单

#### 前端（client）

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/index.ts` | 修改 | 新增 `WorkOrderFile` 接口类型 |
| `src/api/workOrder.api.ts` | 修改 | 新增文件上传/列表/下载/删除 API 函数 |
| `src/api/client.ts` | 可能修改 | 确保 axios 支持 multipart/form-data（默认支持） |
| `src/components/workOrder/WorkOrderDetail.tsx` | 修改 | 新增附件区域（上传 + 文件列表） |
| `src/components/workOrder/FileUploadZone.tsx` | 新增 | 拖拽上传区域组件 |
| `src/components/workOrder/FileList.tsx` | 新增 | 文件列表组件（含下载/删除操作） |
| `src/components/workOrder/FilePreviewDialog.tsx` | 新增 | 图片预览弹窗组件 |

#### 后端（server）

| 文件 | 操作 | 说明 |
|------|------|------|
| `prisma/schema.prisma` | 修改 | 新增 `WorkOrderFile` model；`WorkOrder`/`User` 新增反向关联 |
| `package.json` | 修改 | 新增 `multer` + `@types/multer` 依赖 |
| `src/config/index.ts` | 修改 | 新增 `upload` 配置段 |
| `src/app.ts` | 修改 | 新增静态文件服务或确认下载 API 路由 |
| `src/services/workOrderFile.service.ts` | 新增 | 文件上传/列表/下载/删除业务逻辑 |
| `src/controllers/workOrderFile.controller.ts` | 新增 | 文件相关控制器 |
| `src/routes/workOrder.routes.ts` | 修改 | 新增文件相关子路由 |
| `src/types/index.ts` | 修改 | 新增 `WorkOrderFileDTO` 接口 |

---

## 5. 数据库变更汇总

### 5.1 修改现有表

#### `work_orders` 表 — 新增字段

| 列名 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| `start_time` | `DATETIME` | 是 | `NULL` | 服务开始时间 |
| `end_time` | `DATETIME` | 是 | `NULL` | 服务结束时间 |

### 5.2 新增表

#### `work_order_files` 表

| 列名 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | `INT AUTO_INCREMENT` | 否 | — | 主键 |
| `work_order_id` | `INT` | 否 | — | 外键 → `work_orders.id`，级联删除 |
| `file_name` | `VARCHAR(255)` | 否 | — | 服务器存储的唯一文件名 |
| `original_name` | `VARCHAR(255)` | 否 | — | 用户上传时的原始文件名 |
| `file_path` | `VARCHAR(500)` | 否 | — | 文件相对路径 |
| `file_type` | `VARCHAR(50)` | 否 | — | MIME 类型 |
| `file_size` | `INT` | 否 | — | 文件大小（字节） |
| `uploaded_by` | `INT` | 否 | — | 外键 → `users.id` |
| `created_at` | `DATETIME` | 否 | `CURRENT_TIMESTAMP` | 上传时间 |

**索引**：
- `idx_work_order_files_work_order_id` ON (`work_order_id`)
- `idx_work_order_files_uploaded_by` ON (`uploaded_by`)

### 5.3 Prisma Schema 变更完整示例

```prisma
// ========== WorkOrder (修改) ==========
model WorkOrder {
  id           Int             @id @default(autoincrement())
  orderNo      String          @unique @map("order_no") @db.VarChar(20)
  customerId   Int             @map("customer_id")
  contactId    Int             @map("contact_id")
  contactPhone String?         @map("contact_phone") @db.VarChar(20)
  staffNames   String          @map("staff_names") @db.Text
  description  String          @db.Text
  laborCost    Decimal         @default(0) @map("labor_cost") @db.Decimal(10, 2)
  materialCost Decimal         @default(0) @map("material_cost") @db.Decimal(10, 2)
  travelCost   Decimal         @default(0) @map("travel_cost") @db.Decimal(10, 2)
  totalAmount  Decimal         @default(0) @map("total_amount") @db.Decimal(10, 2)
  isPaid       Boolean         @default(false) @map("is_paid")
  isDeleted    Boolean         @default(false) @map("is_deleted")

  // ★ 新增字段
  startTime    DateTime?       @map("start_time")
  endTime      DateTime?       @map("end_time")

  createdBy    Int             @map("created_by")
  updatedBy    Int?            @map("updated_by")
  createdAt    DateTime        @default(now()) @map("created_at")
  updatedAt    DateTime        @updatedAt @map("updated_at")

  customer     Customer        @relation(fields: [customerId], references: [id])
  contact      CustomerContact @relation(fields: [contactId], references: [id])
  creator      User            @relation("WorkOrderCreatedBy", fields: [createdBy], references: [id])
  updater      User?           @relation("WorkOrderUpdatedBy", fields: [updatedBy], references: [id])

  // ★ 新增反向关联
  files        WorkOrderFile[]

  @@map("work_orders")
  @@index([customerId])
  @@index([contactId])
  @@index([isPaid])
  @@index([isDeleted])
  @@index([createdAt])
}

// ========== WorkOrderFile (新增) ==========
model WorkOrderFile {
  id           Int      @id @default(autoincrement())
  workOrderId  Int      @map("work_order_id")
  fileName     String   @map("file_name") @db.VarChar(255)
  originalName String   @map("original_name") @db.VarChar(255)
  filePath     String   @map("file_path") @db.VarChar(500)
  fileType     String   @map("file_type") @db.VarChar(50)
  fileSize     Int      @map("file_size")
  uploadedBy   Int      @map("uploaded_by")
  createdAt    DateTime @default(now()) @map("created_at")

  workOrder    WorkOrder @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  uploader     User      @relation("WorkOrderFileUploadedBy", fields: [uploadedBy], references: [id])

  @@map("work_order_files")
  @@index([workOrderId])
  @@index([uploadedBy])
}

// ========== User (修改 - 新增反向关联) ==========
model User {
  // ... 现有字段 ...
  workOrdersCreated  WorkOrder[] @relation("WorkOrderCreatedBy")
  workOrdersUpdated  WorkOrder[] @relation("WorkOrderUpdatedBy")

  // ★ 新增反向关联
  uploadedFiles      WorkOrderFile[] @relation("WorkOrderFileUploadedBy")

  @@map("users")
}
```

### 5.4 迁移命令

```bash
cd server
npx prisma migrate dev --name add_workorder_time_and_files
npx prisma generate
```

---

## 6. 新增 API 接口汇总

| 方法 | 路径 | 说明 | 权限 | 所属需求 |
|------|------|------|------|----------|
| `GET` | `/api/summary/dashboard` | 获取仪表盘全部图表数据 | `summary:view` | FEAT-1 |
| `POST` | `/api/work-orders/:id/files` | 上传文件到指定工单 | `workorder:update` | FEAT-3 |
| `GET` | `/api/work-orders/:id/files` | 获取工单文件列表 | `workorder:read` | FEAT-3 |
| `GET` | `/api/work-orders/:id/files/:fileId/download` | 下载指定文件 | `workorder:read` | FEAT-3 |
| `DELETE` | `/api/work-orders/:id/files/:fileId` | 删除指定文件 | `workorder:update` | FEAT-3 |

**现有接口变更**：

| 方法 | 路径 | 变更说明 |
|------|------|----------|
| `POST` | `/api/work-orders` | 请求体新增可选字段 `startTime` / `endTime` |
| `PUT` | `/api/work-orders/:id` | 请求体新增可选字段 `startTime` / `endTime` |
| `GET` | `/api/work-orders` | 响应 DTO 新增 `startTime` / `endTime` |
| `GET` | `/api/work-orders/:id` | 响应 DTO 新增 `startTime` / `endTime` |
| `GET` | `/api/work-orders/recent` | 响应 DTO 新增 `startTime` / `endTime` |

---

## 7. 待确认问题

| 编号 | 问题 | 影响 | 建议 |
|------|------|------|------|
| Q-V2-1 | 仪表盘月度趋势图的时间范围是固定近 12 个月，还是支持用户自定义时间范围？ | 仪表盘交互复杂度 | 建议 v2 固定近 12 个月，后续版本可增加时间筛选器 |
| Q-V2-2 | 客户金额排行的 Top N 默认为 10，是否需要支持用户调整？ | 仪表盘交互 | 建议固定 10，保持简洁 |
| Q-V2-3 | 数据库表状态中 `operation_logs` 表当前为 P2 功能可能未启用，是否展示？ | 仪表盘数据 | 建议展示，记录数为 0 也展示，便于了解系统全貌 |
| Q-V2-4 | 工单开始/结束时间是否应该设为必填？ | 表单校验规则 | 建议可选，兼容历史数据和紧急工单场景 |
| Q-V2-5 | 文件上传是否需要在工单表单页面内集成（方案 B），还是仅在详情页上传（方案 A）？ | 前端交互流程 | 推荐 方案 A（详情页上传），降低复杂度 |
| Q-V2-6 | 文件删除是否仅限上传人和管理员，还是有工单编辑权限即可？ | 权限控制 | 建议有 `workorder:update` 权限即可删除，简化权限逻辑 |
| Q-V2-7 | 上传目录是否需要纳入 Docker Volume 持久化？ | 部署配置 | 必须。`docker-compose.yml` 需新增 uploads 目录的 volume 映射 |
| Q-V2-8 | 文件上传是否需要支持断点续传或分片上传？ | 大文件体验 | 当前单文件 ≤ 10MB，无需分片上传。如未来需求可扩展 |
| Q-V2-9 | 图片预览是否需要支持旋转、缩放等操作？ | 前端组件复杂度 | 建议基础预览即可（点击放大查看），不增加旋转缩放 |
| Q-V2-10 | 仪表盘数据是否需要缓存（如 Redis），还是每次实时查询？ | 后端性能 | 当前数据量不大，建议实时查询。如性能有问题可后续加缓存 |

---

## 附录：实施建议与依赖关系

### A. 依赖关系

```
FEAT-2（开始/结束时间）和 FEAT-3（文件上传）互相独立，可并行开发。
FEAT-1（仪表盘重设计）不依赖 FEAT-2 和 FEAT-3，可独立开发。

但建议实施顺序：
1. FEAT-2（数据库迁移优先，影响 schema）
2. FEAT-3（数据库迁移 + 文件上传服务）
3. FEAT-1（仪表盘重写，前端工作量最大）

FEAT-2 和 FEAT-3 的数据库迁移建议合并为一次 migration。
```

### B. 前端新增依赖

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| `recharts` | `^2.12.0` | 仪表盘图表渲染 |

### C. 后端新增依赖

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| `multer` | `^1.4.5-lts.1` | 文件上传中间件 |
| `@types/multer` | `^1.4.11` | Multer TypeScript 类型定义 |
| `uuid` | `^9.0.1` | 生成唯一文件名 |
| `@types/uuid` | `^9.0.8` | UUID TypeScript 类型定义 |

---

> **文档结束** — 请架构师基于此增量 PRD 进行系统设计与任务分解。
