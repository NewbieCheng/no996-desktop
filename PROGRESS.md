# PROGRESS.md — no996-desktop 开发进度

> 进度唯一权威。完成一项：`⬜ → ✅`，补日期；阻塞写原因。任务定义与验收标准见
> `deepseek-harness-不加班智能体/docs/no996-product/04-开发规划与进度.md`。

最后更新：2026-08-27（骨架就绪，等待开工指令）

## 总览

| 里程碑 | 进度 |
|--------|------|
| S0 项目骨架（本仓库） | 9/12 ✅ |
| M0 基础设施 | 0/5 |
| M1 启动链与登录 | 0/6 |
| M2 12 页迁移 | 0/12 |
| M3 双模式与 Agent | 0/6 |
| M4 分发与扩展 | 0/5 |

---

## S0 · 项目骨架（2026-08-27）

- ✅ S0-1 仓库目录 + package.json + tsconfig + Vite 配置（2026-08-27）
- ✅ S0-2 交付包 `src/web` 12 页 + 组件 + Mock 数据整体迁入 `src/renderer`（2026-08-27）
- ✅ S0-3 Electron 主进程入口（加载 #/boot、安全基线配置）（2026-08-27）
- ✅ S0-4 preload 脚本（contextBridge 白名单）（2026-08-27）
- ✅ S0-5 esbuild 主进程构建脚本 `scripts/build-main.mjs`（2026-08-27）
- ✅ S0-6 Electron 开发脚本 `scripts/dev-electron.mjs`（2026-08-27）
- ✅ S0-7 Web 开发预览 + `/api` 代理到本地 Go 后端（2026-08-27）
- ✅ S0-8 electron-builder 双端配置（win 优先 / mac 预留）（2026-08-27）
- ✅ S0-9 产品架构文档同步副本 `docs/product/`（5 份，权威源在 deepseek-harness 仓库）（2026-08-27）
- ⬜ S0-10 打包资源 `resources/icon.ico` / `icon.icns`（当前用 builder 默认图标，pack:win 前必须补）
- ⬜ S0-11 `npm run pack:win` 产出安装包并实机安装验证
- ⬜ S0-12 Electron 窗口实机跑通（`dev:electron` 打开桌面窗口加载页面）

**验证记录（2026-08-27）**：`npm run typecheck` 通过；`npm run build` 通过（入口 JS 504KB，分包见 M2）；Vite dev 378ms 就绪 @127.0.0.1:5273。

---

## M0 · 基础设施

- ⬜ M0-1 module.manifest schema v1 + ModuleRegistry（扫描/验签位/buildNavTree）
- ⬜ M0-2 `@no996/module-sdk` Bridge 接口定义
- ⬜ M0-3 ShellLayout：TopBar + Sidebar 读 Registry + dynamic import（替代 main.tsx 静态 import）
- ⬜ M0-4 引入 web/admin shadcn/ui 组件体系（components/ui + Tailwind v4 token）
- ⬜ M0-5 settings 页作为 Registry 试点挂载

## M1 · 启动链与登录

- ⬜ M1-1 加载窗口（Logo + 进度动画，Registry/DSH/预取三阶段）
- ⬜ M1-2 「点击进入」门槛 + 后端不可达降级
- ⬜ M1-3 登录页（手机号+验证码 → /auth/*）
- ⬜ M1-4 Main 侧 token 管理（refresh 安全存储）
- ⬜ M1-5 已登录静默跳过登录
- ⬜ M1-6 后端联调 E2E（种子账号）

## M2 · 12 页迁移（shadcn/ui 重组 + 入口分包）

- ⬜ M2-1 home（首页改造：AI 对话框 + 简报卡片区）
- ⬜ M2-2 hotspot-radar
- ⬜ M2-3 viral-analysis
- ⬜ M2-4 topic-pool（池 + 排期）
- ⬜ M2-5 content-creation（含爆款复刻）
- ⬜ M2-6 content-assets
- ⬜ M2-7 content-review
- ⬜ M2-8 friend-circle
- ⬜ M2-9 product-library
- ⬜ M2-10 ai-experts
- ⬜ M2-11 enterprise-brain
- ⬜ M2-12 settings（占位 → 账号/偏好/Skill 面板）

## M3 · 双模式与 Agent

- ⬜ M3-1 顶栏 ModeSwitch（面板/智能工作台）
- ⬜ M3-2 agent 模式主视图（manifest `workbenchMode` 驱动）
- ⬜ M3-3 Agent 独立窗口 + `agent.open/run/onProgress` 全链
- ⬜ M3-4 设置页 Skill 管理面板
- ⬜ M3-5 首页 AI 对话框接真（引导跳转）
- ⬜ M3-6 扣费链路贯通（余额→lease→usage 上报）

## M4 · 分发与扩展

- ⬜ M4-1 electron-builder 正式打包流程固化（NSIS + 快捷方式）
- ⬜ M4-2 模块 zip 本地安装
- ⬜ M4-3 后端 Module OTA catalog（后端仓库任务）
- ⬜ M4-4 Ed25519 验签
- ⬜ M4-5 Registry 热更新

---

## ❌ 明确不做（待讨论，不排期）

- ❌ 短视频剪辑 Module / ffmpeg 工具链 —— **待讨论**
- ❌ 第三方 Module 开发者生态 —— **待讨论**
- ❌ 服务端模型中转 / SSE / 支付 —— **待讨论**