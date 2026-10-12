# Qnya Frontend

Qnya 番剧平台客户端，面向访客与会员的番剧浏览、搜索与播放站点，支持移动端自适应与明暗主题。

## 页面模块

| 路径              | 说明                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `/`               | 首页聚合：各类型推荐（按评分排序）、我的追番、猜你喜欢（稳定随机分页）                         |
| `/bangumi`        | 番剧筛选：类型/状态/年份/季度/标签单选 + 综合排序等四种排序，无限滚动分页                      |
| `/hot` `/rank`    | 热门排行（综合排序，评分人数优先）                                                             |
| `/search`         | 搜索（Meilisearch，繁简互通）                                                                  |
| `/topic` `/:id`   | 首页专题推荐                                                                                   |
| `/anime/:videoId` | 播放页：Artplayer + 弹幕（发送/颜色/模式）、选集、观看进度续播、追番、评分、同系列与同类型推荐 |
| `/mine`           | 个人中心：我的追番 / 观看历史 / 资料修改（游客角色隐藏追番/历史区块）                          |
| `/login`          | 登录 / 邮箱验证码注册                                                                          |

权限行为：

- 整站需登录，未登录访问由 `RequireAuth` 渲染 403 承载页（提供登录入口），不直接跳转。
- 成人内容仅 `premium` / `admin` 可见，普通用户不可见（接口层过滤，前端不渲染）。
- 权限不足的整页展示 403 页面，局部无权限区块（如游客角色的追番/历史）直接隐藏。

## 技术栈

| 类别     | 技术                                                          |
| -------- | ------------------------------------------------------------- |
| 框架     | React 19 + TypeScript（React Compiler）                       |
| 构建     | Vite 8（rolldown）                                            |
| 路由     | React Router DOM v7（路由级懒加载）                           |
| 数据层   | TanStack Query v5 + `usePagedList` 分页无限滚动 hook          |
| 播放器   | Artplayer 5 + artplayer-plugin-danmuku + hls.js（清晰度切换） |
| 状态管理 | Zustand v5 + Immer（auth store）                              |
| UI       | Radix UI + Tailwind CSS v4 + shadcn/ui、sonner（toast）       |
| 表单     | React Hook Form v7 + Zod v4                                   |
| 请求     | Axios（统一响应解包与错误 toast）                             |
| 字体     | Space Grotesk Variable + Noto Sans SC Variable（自托管）      |
| 规范     | ESLint + Prettier + husky + Conventional Commits              |

## API 类型生成

接口类型来自后端 OpenAPI 文档，**不手写**：

```bash
# 在 Qnya（后端）仓库先导出 openapi.json
pnpm openapi:export

# 在本仓库生成 wire 类型
pnpm gen:api   # ../Qnya/openapi.json → src/apis/api-types.gen.ts
```

`src/apis/openapi.ts` 提供 `ApiResult` / `ApiQuery` 等工具类型，各接口模块（`anime.ts`、`play.ts` 等）基于 wire 类型封装请求。

## 项目结构

```
src/
├── apis/            # 接口定义（类型源自 openapi.json 生成文件）
├── components/
│   ├── custom/      # 业务组件（auth 守卫、anime-card、player、sidebar、header）
│   └── ui/          # shadcn/ui 基础组件
├── hooks/           # usePagedList（分页无限滚动）、use-auth-init 等
├── lib/             # 请求封装、图片加载、工具函数
├── pages/           # 页面（home/bangumi/hot/search/topic/anime/mine/login）
├── style/           # Tailwind v4 主题变量与全局样式
└── routes.tsx       # 路由配置（懒加载 + 嵌套布局）
```

## 开发

```bash
# 1. 配置 hosts（配合后端 Cookie domain）
echo "127.0.0.1 localhost.qnya.cn" | sudo tee -a /etc/hosts

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器（http://localhost.qnya.cn:5000，/api 代理到 :3000）
pnpm dev

# 构建
pnpm build

# 打包体积分析
pnpm analyze

# 代码检查
pnpm lint
```

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范，提交时自动执行 lint-staged。

## 相关仓库

- [Qnya](https://github.com/hzh11012/Qnya) — 核心 API 服务
- [Qnya-Backend](https://github.com/hzh11012/Qnya-Backend) — 管理后台
