# AGENTS.md

给 AI 编码代理（Claude Code、pi、Cursor 等）的项目上下文。改动前请先读完本文件。

## 项目概览

Qnya 前端：动漫流媒体平台用户端（React 19 + Vite + TS + Tailwind v4 + shadcn/ui 风格组件 + TanStack Query + React Router 7）。

- **技术栈**：React 19、react-router-dom 7（createBrowserRouter 数据路由）、@tanstack/react-query v5、zustand、zod + react-hook-form、sonner（toast）、artplayer（播放器）、lucide-react（图标）
- **后端**：配套仓库 `../Qnya`（Fastify），API 类型从其 `openapi.json` 生成
- **部署**：Vite 构建，生产走 nginx（与后端同机）

## 常用命令

```bash
pnpm dev        # vite 开发服务器
pnpm gen:api    # 从 ../Qnya/openapi.json 重新生成 API 类型（后端改接口后必须跑）
pnpm lint       # eslint（含 react-compiler / react-hooks 规则，0 警告容忍）
pnpm build      # tsc -b && vite build
```

- **改完代码的完成标准**：`npx tsc -b && npx eslint src --max-warnings 0` 全绿。react-compiler 的 purity 规则是强制的，常见踩坑见下文
- **提交**：Conventional Commits（husky + lint-staged 强制 prettier/eslint）；发版在 master 打 `v1.0.x` tag

## 架构

```
src/
├── apis/            # 按领域的手写请求函数 + api-types.gen.ts（自动生成，勿手改）
├── components/
│   ├── ui/          # shadcn/ui 风格基础组件（dialog/dropdown/tabs/…）
│   └── custom/      # 业务组件（player/anime-card/boss-key/theme-*…）
├── hooks/           # use-paged-list（全站分页标准）、use-logout、use-mobile…
├── lib/             # settings（localStorage 设置中心）、anime、keyboard、utils
├── pages/           # 按路由域组织（anime/home/mine/search/settings/topic…）
├── store/           # zustand（auth 等）
└── style/           # Tailwind 主题 token（--radius、色彩语义变量）
```

- 路由集中在 `routes.tsx`（createBrowserRouter + RouterProvider）；播放页（`pages/anime`）不在主 Layout 内，有自己的 header 和独立主题（`playTheme` 覆写根类，卸载时恢复）
- 布局：桌面左侧窄侧栏（`components/custom/sidebar`），移动端底部 tab（`app-footer.tsx`，`md:hidden`）+ 右下 FAB；断点 `md` 起切换，整体最小宽度 320px

## 硬性约定

1. **分页/无限列表一律用 `usePagedList`**（`src/hooks/use-paged-list.ts`，InfiniteQuery + flatten + fetchMore 防抖），不要手写 query + IntersectionObserver 组合；需要局部缓存策略传 `staleTime`
2. **react-compiler purity**（lint 强制，无豁免）：
   - 渲染期禁止 `Date.now()`/`Math.random()`——放 `useState` 初始化器里取快照；
   - effect 里禁止直接 setState——派生数据渲染期算，外部系统用 `useSyncExternalStore` + notify；
   - 组件内不要定义组件、不要在 useMemo/useCallback 里搞副作用
3. **优先复用现有抽象**：动手写新 hook/组件前先搜 `src/hooks`、`src/components/custom`（Dialog 确认框 = 普通 `ui/dialog.tsx` 组合，样式对齐 `profile-edit-dialog.tsx`/`code-dialog.tsx`：默认 `bg-background/80` 毛玻璃底、`DialogFooter` 横排小按钮）
4. **API 层**：请求函数写在 `src/apis/*.ts`；`api-types.gen.ts` 只由 `pnpm gen:api` 生成；改后端接口后先在 `../Qnya` 跑 `pnpm openapi:export`
5. **样式**：Tailwind 语义 token（`bg-card`/`text-muted-foreground`/`border-border`…），不写死颜色；卡片圆角家族统一 `rounded-sm`，弹窗容器 `rounded-2xl`；图标统一 lucide，播放页 header 图标按钮规格 `size-8 rounded-sm hover:bg-border`
6. **设置**：本地设置走 `src/lib/settings.ts`（localStorage `qnya-settings` + useSyncExternalStore），播放页主题 `playTheme` 独立于平台主题
7. **进度保存**：播放页心跳 10s + pagehide/visibilitychange keepalive 补存（不走 axios），历史记录是续播的事实来源——动 `pages/anime` 续播逻辑前先读 `index.tsx` 内的长注释
8. **React Query key 约定**：`['play-detail', videoId]`、`['mine-stats']`、`['mine-histories']` 等，写操作 onSuccess 后记得失效关联 key

## 与后端的契约

- 后端仓库：`C:/Users/91794/Desktop/qnya/Qnya`（见其 AGENTS.md）
- 类型流：后端 `pnpm openapi:export` → 前端 `pnpm gen:api` → `src/apis/api-types.gen.ts`
- 统一响应包装 `{ code, message, data }`；写操作带 CSRF 头（axios 拦截器自动处理 XSRF-TOKEN cookie）

## Git

- 远端 `github.com/hzh11012/Qnya-Frontend.git`（master 直推，tag 仅前端仓库打）
- 发版：功能批次合入后打 `v1.0.x`（当前最新见 `git tag -l | tail -1`）
