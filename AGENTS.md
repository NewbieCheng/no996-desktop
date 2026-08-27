# AGENTS.md — no996-desktop（不加班工作台桌面端）

面向 AI Agent 与开发者的本仓库导航。架构背景、V1 范围与产品决策见本仓库
[docs/product/](docs/product/README.md)（01 认知 / 02 架构 / 03 性能安全 / **04 开发规划与进度**；
权威源在 `deepseek-harness-不加班智能体/docs/no996-product/`，改文档先改源再同步覆盖）。
本仓库开发进度唯一权威是 [PROGRESS.md](PROGRESS.md)——**每完成一项打勾并更新日期**。

## 项目是什么

- **产品**：不加班工作台 Windows 桌面端（Electron + React），V1
- **页面来源**：`不加班工作台-v1.0-前端交付包-2026-08-25`（`src/web` 已整体迁入 `src/renderer`，仅取业务逻辑与交互；**旧组件不再向上游回改**）
- **UI 组件规范**：新组件统一复用 `不加班智能团后端/.worktrees/v1-backend/web/admin/src/components/ui/` 的 shadcn/ui 体系（Tailwind v4 + Base UI）；React 当前 19（交付包原样），迁移 shadcn 体系时如需降到 18.3 再统一降
- **打包**：Windows x64 NSIS 优先（`npm run pack:win`）；macOS 配置已预留（`npm run pack:mac`，待签名证书）
- **V1 不做**：短视频剪辑 Module（❌ 待讨论，见 no996-product 文档）
- **用户旅程**：启动 → 加载动画 → 点击进入 → 登录 → 工作台首页；顶栏双模式（面板 / 智能工作台）

## 目录地图（核心文件与代码位置）

```text
no996-desktop/
├── index.html                     # Vite 入口 HTML（加载 /src/renderer/main.tsx）
├── vite.config.ts                 # dev:web 与 build:web 配置；/api 代理到本地 Go 后端
├── tsconfig.json                  # 覆盖 src/renderer + src/main + src/shared
├── electron-builder.config.mjs    # 双端打包配置（win nsis / mac dmg 预留）
├── package.json                   # scripts：dev / dev:electron / build / pack:win / pack:mac
├── scripts/
│   ├── build-main.mjs             # esbuild 打包主进程+preload → dist/main/*.cjs
│   └── dev-electron.mjs           # esbuild watch + 拉起 Electron（指向 Vite dev server）
├── src/
│   ├── main/                      # Electron 主进程（Node 侧）
│   │   ├── index.ts               # 进程入口：创建窗口、加载 #/boot、外链走系统浏览器
│   │   └── preload.ts             # contextBridge 白名单 API（window.no996）
│   ├── renderer/                  # 渲染层（React，迁移自交付包 src/web）
│   │   ├── main.tsx               # hash 路由解析（#overview 等 12 页）
│   │   ├── styles.css             # 全局样式（交付包原样）
│   │   ├── *Page.tsx              # 12 个业务页（HomePage、TopicPoolPage、…）
│   │   ├── *MockData.ts / mockData.ts   # 页面 Mock 数据
│   │   ├── *Storage.ts            # localStorage 状态层（后续换 API adapter）
│   │   └── components/            # 页面组件（ProductSidebar、DocumentEditor 等）
│   └── shared/                    # 渲染层/主进程共用类型（待补）
├── docs/
│   └── product/                   # 产品架构文档副本（权威源在 deepseek-harness 仓库，见顶部说明）
├── resources/                     # 打包资源（icon.ico / icon.icns，待补）
├── AGENTS.md                      # 本文件（含后端核心文件对照表、web/admin 组件复用表）
└── PROGRESS.md                    # 开发进度（打勾统计，唯一权威）
```

## 关联仓库（后端与组件源）

| 仓库 | 本机位置 | 用途 |
|------|----------|------|
| Go 后端（V1 已实现） | `F:\Dev\Desktop-Projects\不加班智能团后端`（现行代码在 `.worktrees/v1-backend`） | 登录/积分/lease/billing 接口；开发预览的 API 来源 |
| 后端管理台前端 | 同上 `.worktrees/v1-backend/web/admin` | **UI 设计组件与规则的复用源**（见下节） |

### Go 后端核心文件（已实现，桌面端对接时直接对照）

| 能力 | 代码位置 | 说明 |
|------|----------|------|
| HTTP 路由挂载 | `internal/platform/httpserver/router.go` | 全部 `/api/v1` 路由入口 |
| 认证（登录/OTP/JWT） | `internal/auth/`（入口 `routes.go`、`service.go`） | `POST /api/v1/auth/*`；公开注册须邀请码+OTP |
| 积分账户/流水 | `internal/asset/` | `GET /api/v1/account`（余额）；管理端 grant/adjust |
| Key 租约 + envelope | `internal/modelkey/application.go` | `POST /api/v1/model-keys/leases`；桌面端 Main 解密 |
| 用量上报（HMAC） | `internal/billing/`（`canonicaljson.go` 为签名规范） | `POST /api/v1/usage/report`；与桌面端逐字节一致 |
| Skill 目录 | `internal/skill/` | `GET /api/v1/skills`；专家团页数据源 |
| 统一响应/错误码 | `pkg/response/` | 桌面端解析 API 响应的格式依据 |
| API 契约 | `api/openapi/openapi.yaml`（含 contract_test） | 改协议先改这里并跑 `go test ./api/openapi/...` |
| 协议文档 | `docs/architecture/modelkey-wire-v1.md`、`billing-wire-v1.md`、`electron-client-snippets.md` | lease/HMAC/Electron 集成示例 |
| 本地启动 | `scripts/dev.ps1`（`-Seed` 首次） | 需本机 MySQL 8；默认 API 地址 `http://127.0.0.1:8080` |

### web/admin 设计组件复用（必守）

来源目录：`不加班智能团后端/.worktrees/v1-backend/web/admin/`

| 复用内容 | 位置 | 用法 |
|----------|------|------|
| shadcn/ui 基础组件（约 39 个：`button`/`card`/`dialog`/`data-table`/`sheet`/`sonner`/`PageShell` 等） | `src/components/ui/` | **整体复制到本仓库**后按需改，不手写第三套；不逐个从 npm 拉 |
| 业务组件参考（登录表单、知识库树、表格操作组、状态徽章） | `src/components/{login,knowledge,shared,layout}/` | 抄结构与交互模式，不直接 import 跨仓库 |
| 主题 token（颜色/圆角/暗色模式） | `src/index.css`、`src/theme/`、`src/styles.css` | 桌面端保持同一套设计变量 |
| 技术栈版本对齐 | `package.json` | Tailwind v4 + `@base-ui/react` + TanStack Table v9 + Recharts + sonner；**React 锁 18.3**（本仓库引入 Tailwind 时同步降 React，见约定 8） |
| 字体 | `src/fonts/alibaba-puhuiti.css`、`@fontsource-variable/*` | 跟随复制，保持品牌一致 |
| 布局骨架参考 | `src/layout/ConsoleLayout.tsx`、`src/components/layout/`（`AppSidebar`/`ConsoleHeader`） | ShellLayout（TopBar 双模式 + Sidebar）的参照实现 |
| 国际化规则 | `src/i18n/`（5 语言同名 key） | 本仓库 V1 先中文硬编码（桌面单语言），V2 若做多语言再引入同规则 |

## 命令

| 用途 | 命令 |
|------|------|
| Web 开发预览（浏览器调 UI / 调接口） | `npm run dev` → <http://127.0.0.1:5273> |
| Electron 开发（主进程 watch + 桌面窗口） | `npm run dev:electron`（需先起 `npm run dev`） |
| 构建（web + 主进程） | `npm run build` |
| 类型检查 | `npm run typecheck` |
| 打包 Windows 安装包 | `npm run pack:win`（产物在 `out/`） |
| 打包 macOS（预留） | `npm run pack:mac`（缺 icon 时 builder 会警告/失败，属预期） |

依赖安装遇 Electron 下载超时：先设
`$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"` 再 `npm install`。

## Git 与推送规范

- **远程仓库**：`origin = https://github.com/NewbieCheng/no996-desktop.git`，主分支 `main`，推送用 `git push`（上游已跟踪）。
- **提交前检查**：`npm run typecheck` 通过 + `npm run build` 通过；改动涉及功能任务时先更新 [PROGRESS.md](PROGRESS.md) 勾选，与代码同一提交。
- **提交信息**：`类型: 摘要`（`feat` / `fix` / `chore` / `docs`），正文写改了什么、为什么；一次提交只做一件事。
- **不提交内容**：`node_modules/`、`dist/`、`out/`（打包产物）、任何 `.env` 与密钥；`.gitignore` 已覆盖，勿绕过 `-f` 强加。
- **网络注意（本机已实测）**：直连 github.com 443 会超时/被重置。首次推送已验证走本地代理成功：
  `git -c http.proxy=http://127.0.0.1:7897 push`。若直连失败，用该单次参数；需要长期生效再设
  `git config --global http.proxy http://127.0.0.1:7897`（取消：`git config --global --unset http.proxy`），不默认写入全局配置。
- **回滚**：误推后修正用 `git revert`（生成反向提交），禁止对已推送的 `main` 做 `reset + force-push`。

## 约定（必守）

1. **进度记录**：完成任何任务立即更新 [PROGRESS.md](PROGRESS.md)：`未开始 → ✅`，补日期与产物说明。
2. **页面改造只改 `src/renderer/`**：交付包目录只读，不回写。
3. **新 UI 组件**：从后端 `web/admin/src/components/ui/` 复制对齐，不手写第三套。
4. **主进程安全红线**：`contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`；
   渲染层永不接触 apiKey / refresh token（协议细节见后端仓库 `docs/architecture/modelkey-wire-v1.md`、`billing-wire-v1.md`）。
5. **API 联调**：开发预览经 Vite 代理 `/api → http://127.0.0.1:8080`（`NO996_API_ORIGIN` 可改）；
   后端启动见后端仓库 `scripts/dev.ps1`。
6. **hash 路由值不得擅改**：与交付包 `FRONTEND_ROUTE_MAP.md` 一致（跨页跳转依赖这些 query）。
7. **短视频剪辑相关代码/依赖一律不引入**（❌ 待讨论，见 [docs/product/04](docs/product/04-开发规划与进度.md) §8）。
8. **UI 组件/主题/布局以 web/admin 为唯一参照**（对照表见上节）：需要新组件先查 `web/admin/src/components/ui/` 有没有，有则复制对齐；后端 `package.json` 升级依赖版本时本仓库跟随。
9. **后端协议逐字节一致**：对接 lease/usage 上报时以前表列出的 `internal/modelkey/application.go`、`internal/billing/canonicaljson.go` 为准，不自造字段名或签名规则。

## 当前状态与下一步

骨架已就绪并验证：`typecheck` / `build` / Vite dev 启动均通过（2026-08-27）。
下一步任务清单与勾选状态见 [PROGRESS.md](PROGRESS.md)；**是否开工由用户指令决定**。