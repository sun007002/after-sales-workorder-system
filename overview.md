# 售后服务工单系统 v2 — 增量需求交付概览

**交付日期**：2026-08-05
**线上地址**：<http://192.168.11.100:8080>（账号 `admin` / `admin123`）
**状态**：✅ 已上线，端到端验证全部通过

---

## 一、本次交付的三个需求

### FEAT-1 仪表盘重构

原仪表盘无法显示，按参考截图重新设计：

- **4 个指标卡**：工单总数、总金额、已结款、未结款
- **月度趋势柱状图**：近 12 个月，无数据月份零填充
- **费用构成环形图**：人工费 / 材料费 / 差旅费
- **客户金额排行 TOP 10**：横向条形图
- **数据库表状态表格**：7 张业务表实时记录数

后端新增单接口 `GET /api/summary/dashboard`，内部 5 组查询并行执行，前端一次请求渲染整页。

### FEAT-2 工单起止时间

`work_orders` 新增 `start_time` / `end_time`（可空，精确到小时）。
表单用 `datetime-local` 输入（`step=3600`），创建与编辑均校验 `开始时间 ≤ 结束时间`。

### FEAT-3 工单附件上传

新增 `work_order_files` 表 + 4 个 API（上传/列表/下载/删除）。

- 支持图片、Excel、Word、PDF；单文件 ≤ 10MB，单工单 ≤ 20 个
- 拖拽上传区 + 文件列表 + 图片缩略图预览
- 下载走鉴权接口，未登录返回 401

---

## 二、质量过程

**SOP 流程**：工程师批量实现 → QA 两轮验证 → 主理人部署验收

QA 第 1 轮发现 7 个 Bug，全部修复后第 2 轮回归通过（`IS_VERIFIED: YES`）。其中三个 P0：

| 编号 | 问题 | 修复 |
|------|------|------|
| BUG-1 | 环形图悬浮即白屏 | tooltip 误用不存在的 `data.percent`，改为自算百分比 |
| BUG-2 | 文件下载必定 401 | 原生 `<a>` 不带 Authorization，改 axios blob 下载 |
| BUG-3 | 图片缩略图不显示 | nginx / vite 缺 `/uploads` 代理，已补 |

---

## 三、部署过程中修复的环境问题

这些是 QA 在本地测不出来、只在生产环境暴露的问题：

| 问题 | 影响 | 修复 |
|------|------|------|
| `docker build` 容器内无 DNS | `npm ci` 静默失败，构建产物缺依赖 | 构建加 `--network host` |
| 后端镜像用 Alpine | Prisma 引擎崩溃，容器无限重启 | 改 `node:20-slim` + openssl + `binaryTargets` |
| 仓库 nginx.conf 面向 compose | host 网络下全站 API 502 | 新增 `client/nginx.prod.conf` |
| nginx 默认请求体 1MB | >1MB 附件被 413 且返回 HTML | 加 `client_max_body_size 12M` |
| 容器无挂载卷 | 容器重建后附件全丢 | 加 `-v ~/uploads:/app/uploads` |

全部沉淀至 **`docs/NAS部署手册.md`**。

---

## 四、上线验证结果

数据库迁移后业务数据零丢失：工单 2 条、客户 9 个、用户 1 个、售后人员 7 名。

| 验证项 | 结果 |
|--------|------|
| 前端页面 / 登录 | 200 / token 正常 |
| 仪表盘 5 组数据 | 全部返回，软删除工单已正确排除 |
| 起止时间创建 + 非法时间拦截 | 201 / 400「开始时间不能晚于结束时间」 |
| 上传图片 + 拦截 .exe | 201 / 400「不支持的文件类型」 |
| 下载鉴权 | 带 token 200 且内容一致，不带 token 401 |
| 缩略图代理 | `/uploads/...` 200 image/png |
| 附件落盘宿主机 | ✓ 已持久化 |
| 删除文件 | 记录与物理文件同步清除 |

---

## 五、上线后修复的两个问题（2026-08-05 17:52）

### 1. 仪表盘白屏 — 已修复 ✅（2026-08-06 完成真正修复）

**根因（**推翻上一轮"纯缓存"判断**）**：不是 nginx 缓存缺失，而是一个 React 运行时 Bug
—— `client/src/hooks/usePermission.ts` 返回的 `hasPermission` 等函数每次渲染都是新引用
（未用 `useCallback`）。`DashboardPage` 中：

```ts
const loadData = useCallback(async () => { ... }, [hasPermission]); // hasPermission 每次变
useEffect(() => { loadData(); }, [loadData]);                       // 每次重建都触发
```

`hasPermission` 每次渲染是新的函数引用 → `loadData` 重建 → `useEffect` 触发 → `setState` →
重渲染 → 永久循环。疯狂请求 `/api/summary/dashboard`（30s 内累计 **2153 次**），浏览器抛出
`net::ERR_INSUFFICIENT_RESOURCES` 资源耗尽，整页白屏。

**修复**：`usePermission.ts` 所有返回函数用 `useCallback` 稳定，依赖项只放 `[permissions]`：

```ts
export function usePermission() {
  const permissions = useAuthStore((s) => s.permissions);
  const hasPermission = useCallback((code: string) => permissions.includes(code), [permissions]);
  const hasAllPermissions = useCallback((codes: string[]) => codes.every(...), [permissions]);
  const hasAnyPermission = useCallback((codes: string[]) => codes.some(...), [permissions]);
  const isEngineer = useCallback(() => /* ... */, [hasPermission]);
  return { permissions, hasPermission, hasAllPermissions, hasAnyPermission, isEngineer };
}
```

**验证**（puppeteer + 系统 Chrome 无头复测）：

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| `/api/summary/dashboard` 请求次数 | 2153 | **1** |
| `goto /` 导航 | 30s 超时（networkidle0 达不到） | 成功 |
| `#root` 内容长度 | 10029（仅侧边栏） | **33538**（完整渲染） |
| 控制台错误 | 3924 条 ERR_INSUFFICIENT_RESOURCES | **0** |
| 仪表盘指标卡 + 趋势图 + 环形图 + 排行 + 表状态 | 全部空白 | **全部正常** |

**附**：上一轮加的 nginx 缓存策略（`/assets/*` immutable + `index.html` no-cache）和
`ErrorBoundary` 仍是好的改进（避免「旧 index.html 引用失效 hash」导致的 404 白屏），
但**它们没解决本次的运行时 Bug**。两者叠加后，仪表盘现在行为正确、缓存策略也合理。

### 2. admin 密码每次重启自动还原 — 已修复 ✅

**根因**：`seed.ts` 的 `user.upsert` 的 `update` 块每次启动都把密码写回 `admin123`。

**修复**：`update` 块改为只保 `roleId`/`status`，不再覆盖密码与改密标记（仅首次创建用 admin123）。

**已验证**：改密 → 重启容器（seed 重跑）→ 新密码仍可登录、旧密码失效。当前 admin 密码已重置回
默认 `admin123`，请登录后自行修改，**现在重启不会再丢**。

### 3. 一个非阻塞的健壮性问题

API 入参 `staffNames` 若传字符串而非数组，后端返回 500 而非 400。前端不会触发（始终传数组），
但接口健壮性可加强。

### 4. 附件上传"数据库错误" + 创建页无上传区 — 已修复 ✅

**根因**：`work_order_files.file_type` 列是 `VarChar(50)`，而 Word/Excel 文件的 mimetype 有 64–71
字符（如 `.docx` 的 `application/vnd.openxmlformats-officedocument.wordprocessingml.document`），
写入时溢出 → Prisma `P2000` → 返回 500「数据库错误」。图片 mimetype 短所以能传，Word/Excel 必崩。

**修复**：
- `file_type` 列扩容为 `VarChar(255)`（`prisma db push` 自动 ALTER，无数据丢失）。
- `errorHandler` 增加 `P2000` 分支，返回 400「数据超出字段长度限制」而非 500。
- 创建工单成功后自动跳转到**工单详情页**（附件上传区在详情页），而非回到列表页——这样创建后即可上传附件。

**验证**：`.docx` / `.xlsx` / 图片 三种类型上传均 201，完整 mimetype 正确入库。

### 5. 新建工单报"违反唯一约束" — 已修复 ✅（2026-08-06）

**根因**（SQL 实证）：`server/src/utils/orderNo.ts` 的 `generateOrderNo()` 用
`where: { isDeleted: false }` 只查未删除工单。DB 里 `order_no='0003'` 是软删除的，未删除最大值是
`'0002'` → 生成 `'0003'` → 撞上软删除行 → Prisma P2002。`order_no` 是**全局唯一约束**（不分软删除），
所以任何新建工单都会失败，不只是某个客户。

**修复**：改用 raw SQL 跨**所有**工单（含软删除）取数值最大值 +1：
```sql
SELECT MAX(CAST(order_no AS UNSIGNED)) AS maxNum FROM work_orders
```
数值比较（非字符串排序）避免超过 9999 时的排序错误。同时 `errorHandler` 的 P2002 分支从 500
改为 409「数据重复，违反唯一约束」，错误提示更清晰。

**验证**：API 创建工单成功，HTTP 201，orderNo=`0004`（最大值 0003 +1）。

### 6. 创建工单页面没有上传文件的地方 — 已修复 ✅（2026-08-06）

**根因**：`WorkOrderForm.tsx`（创建模式）无 `FileUploadZone`，上传区只在工单详情页。
上一轮加的"创建后跳详情页"跳转，但用户希望在创建流程里直接上传。

**修复**：创建成功后不再立即跳转，`setCreatedId` 后在表单下方内嵌附件区——成功 Alert +
`FileUploadZone` + `FileList`，用户可当场上传。按钮区切换为「再建一单」（重置表单）和
「完成」（跳转详情页）。

**验证**：部署 bundle `index-DHIg6Zw_.js` 含"再建一单"文案，代码核对 + 构建通过。

### 7. 上传文件中文名乱码 — 已修复 ✅（2026-08-06）

**根因**：multer（`diskStorage`，未设 `defParamCharset`）默认按 latin1 解码 `file.originalname`，
中文 UTF-8 字节变乱码直接存入 `work_order_files.original_name`，下载时也是乱码。

**修复**：`workOrderFile.service.ts` 的 `uploadFile()` 在校验通过后、使用 originalname 前，
加 `Buffer.from(file.originalname, 'latin1').toString('utf8')` 解码，后续扩展名提取和入库
`originalName` 都用解码后的值。multer 配置不改。已存的乱码历史数据不迁移（基本是测试文件）。

**验证**：上传 `测试报告.png`，API 返回 `"originalName":"测试报告.png"` 正确 UTF-8。

## 六、后续 UI/UX 增强（2026-08-06）

### 8. 科技感主题 + 日间/夜间模式切换 — 已完成 ✅

**目标**：摆脱单调配色，深色赛博/浅色现代双色，支持切换 + 持久化。

**改动**：
- `client/src/theme/index.ts` 重构：导出 `lightTheme`（bg `#F8FAFC`, primary `#2563EB`, secondary `#7C3AED`）+
  `darkTheme`（bg `#0F172A`, paper `#1E293B`, primary `#06B6D4` cyan-500, secondary `#8B5CF6` violet-500,
  text `#F1F5F9`）+ `ColorModeContext`。按钮 contained 变体加 `linear-gradient(135deg, primary, secondary)`
  渐变 + hover brightness(1.1) + focus 微光。`MuiTableCell.head` 背景色从硬编码 `#F5F5F5` 改为
  `theme.palette.mode === 'dark' ? background.paper : grey[100]`，否则深色模式下表头还是浅灰。
- `client/src/main.tsx`：`Root` 组件管 `useState<ColorMode>`，`getInitialMode` 优先读
  `localStorage['workorder-color-mode']`、其次 `prefers-color-scheme`、默认 `light`；包
  `ColorModeContext.Provider`；额外加 `LocalizationProvider` + `AdapterDayjs`（为 DatePicker 提供
  全局日期本地化）。
- `client/src/components/layout/TopBar.tsx`：AppBar 右侧加 IconButton，
  `{mode === 'dark' ? <LightModeIcon/> : <DarkModeIcon/>}`，`onClick={toggle}`。
  MainLayout 和 MobileLayout 都渲染 TopBar，所以两种布局都有切换按钮。

**验证**：puppeteer 复测，body bg 浅色 `rgb(248,250,252)` → 点击切换 → 深色 `rgb(15,23,42)`。

### 9. 工单表格列宽对齐 — 已完成 ✅

**目标**：修复"客户名竖排"等列宽混乱，提升表格观感。

**改动**：
- `client/src/components/workOrder/WorkOrderTable.tsx`（主改）：14 列全部设
  `width`+`minWidth`（客户名称 180/160、合计 130/110 右对齐加粗、状态 110/100 居中、
  时间列 170/150 等）。客户名/售后人员加 `whiteSpace:nowrap` + `textOverflow:ellipsis` +
  `title` tooltip。`TableContainer` 外包 `<Box sx={{ overflowX:'auto' }}>` 支持横向滚动。
  保留 `stickyHeader`、`hover` 行反馈、未结款底色。
- 顺手统一 `StaffPage/CustomerPage/UserPage/RolePage` 表头列宽与 ellipsis 模式。

**验证**：puppeteer 复测，客户名单元格 160×47px 单行（修复前为竖排），14 个表头，控制台 0 错误。

### 10. 仪表盘时间区间筛选 — 已完成 ✅

**目标**：仪表盘加年月精度时间筛选，默认当前年，过滤掉历史数据。

**改动**：
- 前端 `client/src/api/summary.api.ts`：`getDashboard(params?)` 接受 `{ startDate, endDate }`，
  通过 `apiClient.get('/summary/dashboard', { params })` 传。
- 前端 `client/src/pages/DashboardPage.tsx`：PageHeader 下方加一行，
  两个 `DatePicker`（`views={['year','month']}`，label="开始"/"结束"）+ "重置"按钮。
  默认 `startDate = new Date(year, 0, 1)`、`endDate = new Date(year, 11, 31)`。
  `loadData` 用 `useCallback` 依赖 `[hasPermission, startDate, endDate]`，调用
  `getDashboard({ startDate: toMonthStartISO(startDate), endDate: toMonthEndISO(endDate) })`。
  依赖 `hasPermission` 不会触发无限循环（已 useCallback 稳定）。
- 后端 `server/src/services/summary.service.ts`：`getDashboardData(authUser, query?)` 接受
  `{ startDate, endDate }`。`fullWhere` 加 `createdAt: { gte, lte }` 用于 overview/cost 聚合。
  月度趋势和客户排名的 raw SQL 用 `Prisma.sql` 参数化片段
  （`AND created_at >= ${query.startDate}` 防注入）。月度趋势由 `generateLast12Months()`
  替换为 `generateMonthsBetween(startDate?, endDate?)`（按起止月生成 'YYYY-MM' 列表，
  零填充）。`tableStats` 不受时间区间影响（保持用 `baseWhere`）。
- 后端 `server/src/controllers/summary.controller.ts`：`getDashboard` 从 `req.query` 读
  `startDate/endDate`（string|undefined），传给 service。

**验证**：API `dashboard?startDate=2026-01-01&endDate=2026-12-31` → `totalOrders=2`；
`startDate=2020-01-01` → `totalOrders=0`（区间过滤生效）；月度趋势返回 2026 年 1–12 月共 12 条。

---

## 七、变更文件清单

**新增**
- `client/nginx.prod.conf` — 生产 nginx 配置
- `client/src/components/dashboard/{MonthlyTrendChart,CostBreakdownChart,CustomerRankingChart,TableStatusTable}.tsx`
- `client/src/components/workOrder/{FileUploadZone,FileList}.tsx`
- `server/src/services/workOrderFile.service.ts`、`server/src/controllers/workOrderFile.controller.ts`
- `docs/NAS部署手册.md`

**修改（主要）**
- `server/Dockerfile` — 改 node:20-slim + openssl
- `server/prisma/schema.prisma` — 新增表/字段 + `binaryTargets`
- `server/package.json` — seed 改用显式 tsx 路径
- `server/src/services/{workOrder,summary}.service.ts`、`server/src/middleware/errorHandler.ts`、`server/src/app.ts`
- `client/src/pages/DashboardPage.tsx` — 整页重写
- `client/src/hooks/usePermission.ts` — useCallback 稳定所有返回函数（修复仪表盘无限渲染循环）
- `client/src/components/workOrder/{WorkOrderForm,WorkOrderTable,WorkOrderDetail,WorkOrderMobileList}.tsx`
- `client/src/api/{workOrder,summary}.api.ts`
