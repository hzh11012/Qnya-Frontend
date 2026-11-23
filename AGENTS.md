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

- 路由集中在 `routes.tsx`（createBrowserRouter + RouterProvider）；播放页 `pages/anime`、放映室房间页与过渡页 `/watch-room/creating` 都不在主 Layout 内，建房页 `/watch-room/new` 走主 Layout（静态段优先于 `/watch-room/:roomId`）。这些独立页面各有 header（放映室复用 `play-header.tsx`），主题一律调 `usePlayTheme()`（按 `settings.playTheme` 覆写根类、卸载恢复），不要各页面重写 `applyTheme`
- 布局：桌面左侧窄侧栏（`components/custom/sidebar`），移动端底部 tab（`app-footer.tsx`，`md:hidden`）+ 右下 FAB；断点 `md` 起切换，整体最小宽度 320px

## 硬性约定

1. **分页/无限列表一律用 `usePagedList`**（`src/hooks/use-paged-list.ts`，InfiniteQuery + flatten + fetchMore 防抖），不要手写 query + IntersectionObserver 组合；需要局部缓存策略传 `staleTime`
   - 换筛选/关键词勾 `keepPrevious: true`，别闪骨架；中间态改用 `isPlaceholderData`，并一并塞进 `useInfiniteScroll` 的 `disabled`（占位数据的页码是按旧条件算的）
2. **react-compiler purity**（lint 强制，无豁免）：
   - 渲染期禁止 `Date.now()`/`Math.random()`——放 `useState` 初始化器里取快照；
   - effect 里禁止直接 setState——派生数据渲染期算，外部系统用 `useSyncExternalStore` + notify；
   - 组件内不要定义组件、不要在 useMemo/useCallback 里搞副作用
3. **优先复用现有抽象**：动手写新 hook/组件前先搜 `src/hooks`、`src/components/custom`（Dialog 确认框 = 普通 `ui/dialog.tsx` 组合，样式对齐 `profile-edit-dialog.tsx`/`code-dialog.tsx`：默认 `bg-background/80` 毛玻璃底、`DialogFooter` 横排小按钮）
4. **API 层**：请求函数写在 `src/apis/*.ts`；`api-types.gen.ts` 只由 `pnpm gen:api` 生成；改后端接口后先在 `../Qnya` 跑 `pnpm openapi:export`
5. **样式**：Tailwind 语义 token（`bg-card`/`text-muted-foreground`/`border-border`…），不写死颜色；卡片圆角家族统一 `rounded-sm`，弹窗容器 `rounded-2xl`；图标统一 lucide。**图标按钮不要再手写 className**：带底色的用 `components/custom/icon-button` 的 `IconButton`（`size-8 rounded-sm hover:bg-border`，含 disabled 态），嵌在内容里、hover 只变主色的用同文件的 `IconAction`，图标 → 下拉菜单用 `icon-menu` 的 `IconMenu`
6. **设置**：本地设置走 `src/lib/settings.ts`（localStorage `qnya-settings` + useSyncExternalStore），播放页主题 `playTheme` 独立于平台主题，播放页与放映室共用同一份设置（`usePlayTheme`）
7. **进度保存**：播放页心跳 10s + pagehide/visibilitychange keepalive 补存（不走 axios），历史记录是续播的事实来源——动 `pages/anime` 续播逻辑前先读 `index.tsx` 内的长注释
8. **React Query key 约定**：`['play-detail', videoId]`、`['mine-stats']`、`['mine-histories']` 等，写操作 onSuccess 后记得失效关联 key
9. **提交按钮要带 loading**：进行中 `disabled` + 按钮内 `<Loader2 className='size-4 animate-spin' />`，不要用「提交中…」替换文案；弹窗直接传 `FormDialog` 的 `loading`。登录页发验证码走整页遮罩属既有例外
10. **播放器 + 右侧栏只有一个外壳**：播放页与放映室都用 `components/custom/play-shell.tsx` 的 `PlayShell`（`player` / `sidebar` 两个 slot，收起键与 `collapsed` 内置）。侧栏宽度、header 行、内容区、分隔线取同文件的 `PLAY_SIDEBAR_CLASS` / `PLAY_SIDEBAR_HEADER_CLASS` / `PLAY_SIDEBAR_BODY_CLASS`（内容自带 px 时）/ `PLAY_SIDEBAR_BODY_PADDED_CLASS`（内容不带 px 时）/ `PLAY_SIDEBAR_DIVIDER_CLASS`；页面不要再各写一份 `lg:h-[calc(100vh-3.125rem)]` 骨架、`lg:w-95` 侧栏和右缘收起键
    - **移动端侧栏要撑满**：外壳是 `min-h-[calc(100dvh-3.125rem)]`，侧栏带 `grow`，内容不足时吃掉播放器以下的剩余高度（否则底下空一条）；内容超过一屏时外壳按内容长高、页面整体滚动，不会被压成内部滚动条。别把侧栏改成 `flex-1`（basis 0 会让它的内容高度不参与外壳计算）
    - **两层 flex 里不要用 `h-full`/`size-full` 撑高度**：百分比高度在「flex-1 撑出来的父级」上会退化成 auto，底部留白（聊天输入框就浮在上面）。要撑满就用 `min-h-0 flex-1`，父级还得是 flex
    - **侧栏里的 tab 取 `PLAY_SIDEBAR_TAB_LIST_CLASS` + `PLAY_SIDEBAR_TAB_CLASS`**：未激活 = 播放页「简介」同款中性前景色，激活 = 主题色 + 同色下划线（与站内其他 tab 一致）。项目 `@custom-variant dark (&:is(.dark *))` 生成的 `dark:text-muted-foreground` 权重高于 `data-[state=active]:`，深色态必须重复写 `dark:data-[state=active]:text-primary`（未激活也要补 `dark:text-foreground`），否则激活态被压回灰色
    - **侧栏分隔线只在前后都有内容时渲染**：简介 / 选集 / 系列 / 推荐四块之间用 `PLAY_SIDEBAR_DIVIDER_CLASS`，条件要写全（`series.length && recommendations.length` 才插线），否则列表为空时会留下一条孤零零的横线；`AnimeSideList` 本身空列表直接 `return null`，别指望它兜住
11. **列表页共用件**：网格梯度用 `src/lib/layout.ts` 的 `ANIME_GRID`（竖版 3→7 列）/ `ANIME_GRID_HORIZONTAL`（横版 2→6 列，需要居中再 `cn(..., 'justify-items-center')`）；空态用 `components/custom/list-empty` 的 `ListEmpty`（保留页标题、插画在剩余区域居中）；「点卡进播放页」的番剧列表卡用 `components/custom/anime-list-card` 的 `AnimeListCard`，别拿 `AnimeCard` 手拼字段
    - **`ListEmpty` 的 `flex-1` 要求父级是 flex 列**：块级容器里它完全失效，插画会贴在标题/筛选行下面（最小高度才撑住）。页面根和空态的直属容器都要 `flex flex-1 flex-col`（番剧库、建房页的列表容器都补过），新页面照抄；只加 `min-h-*` 不算「居中在剩余区域」

## 与后端的契约

- 后端仓库：`C:/Users/91794/Desktop/qnya/Qnya`（见其 AGENTS.md）
- 类型流：后端 `pnpm openapi:export` → 前端 `pnpm gen:api` → `src/apis/api-types.gen.ts`
- 统一响应包装 `{ code, message, data }`；写操作带 CSRF 头（axios 拦截器自动处理 XSRF-TOKEN cookie）

## 放映室

放映室约定偏多，单独成节；通用的写法和样式仍看上面「硬性约定」。

- **写操作全走 Socket.IO**（`src/apis/watch-room-socket.ts`），HTTP 只有列表/详情/消息/current 四个查询接口；事件名与载荷以后端 `watch-room-socket.ts` 为准。**每个事件处理器都要先按 `roomId` 过滤**（`room:message` / `member-joined` / `member-left` / `updated` / `closed` 的载荷都带 roomId）：切房间时服务端还会给旧房间广播一条 `member-left`，本人也会收到，不过滤会被误判成「你已离开房间」。
- **播放同步靠锚点外推**：`playback:pull` 只读拉取，用 ACK 的 RTT/2 建立「服务端时刻 → 本地 `performance.now`」锚点再按流逝时间外推（`clockAnchorRef`）。不要用 `Date.now() - serverTime`，时钟偏差会直接变成进度偏差；也不要只等房主操作触发的 `playback:sync`，成员缓冲或切后台会一直失步。
- **换集一次写到位**：`room:change-video { autoplay }` 由服务端把「播放中 + 位置 0」一并落库广播，自动连播与手动选集都传 `true`。不要退回「先切集暂停、客户端再补 play」的两段式——`canplay` 时机不准时会让全场停在 0:00。新源被浏览器拒绝起播时由 `resumeLocalPlayback` 补本地 `play()`（两集同地址没有换源事件，全靠它兜底）。
- **断线 30s 宽限期**：服务端保留席位，前端重连而不是退出，重连后服务端重推 `room:state`；两端超时值要一致（`DISCONNECT_GRACE_MS` / `RECONNECT_GRACE_MS`）。socket 是模块级单例，**不随房间页卸载断开**——所以房间页卸载时要延时补发 `room:leave`（`room.tsx` 的 `mountedRoomId` 兜住严格模式双挂载），否则席位会一直挂着、大厅永远显示「继续待在」。
- **私人房间**：`ROOM_PRIVATE` 与 `ROOM_PASSWORD_INVALID` 都要进密码表单（只判后者会把「需要密码」渲染成失败页）；免密靠服务端 24h 通行证，前端不存密码。被移出者再进会拿到 `ROOM_BANNED`，属终态失败（只给「返回大厅」，不给重试）。
- **房间页整屏布局**：外层满 `dvh`（`PlayShell` 的 `min-h` + 侧栏 `grow`），播放器占上半屏、侧栏吃掉剩余高度，移动端聊天输入框贴屏幕底部。聊天面板要 `min-h-0 flex-1` 撑满 tab 内容区（用 `h-full` 撑不住，输入框会浮在半空），消息列表 `flex-1` 内部滚动。
- **选集卡片两种高度模式**：`AnimeEpisode` 默认 `max-h-55`（播放页侧栏下方还有系列/推荐，不能无限长）；放映室播放列表传 `fill`——卡片变 flex 列、标题行 `flex-none`、列表 `min-h-0 flex-1` 内部滚动，父容器必须是 `flex flex-col` 的剩余高度块（房间页给 `mt-4 flex min-h-40 flex-1 flex-col`）。移动端侧栏没有固定高度、整页滚动，靠 `max-h-[60dvh] lg:max-h-none` 兜上限，否则 50 集会一路铺到页尾。别用 `flex-1` 顶替 `min-h-40`：高度不够时卡片会被压到只剩标题行。
- **聊天消息不许进房间页 state**：`room:message` 只写 `room-message-store.ts` 的外部存储（房间页持有一份），`RoomChatPanel` 用 `useSyncExternalStore` 订阅，`room-chat.tsx` 的消息行再 `memo`。原因有两条：消息状态放房间页会让**每条聊天**把播放器、选集、侧栏整页重渲；放面板自己 state 又会在切到「播放列表」tab 时（Radix 卸载非激活内容）丢掉这段时间的消息。同理 `Player` 已 `memo`，传给它的回调一律 `useCallback`（`controlPlayback`/`resumeLocalPlayback`/`handleEnded`/`handleDanmuEmit` 等），别改回内联箭头函数，否则 memo 直接失效。
- **成员端只读（`viewerMode`）**：播/停图标保留但不可点，倍速、连播与热键去掉（**画质不在此列**，见「清晰度各端本地」），**进度条 `pointer-events: none`（不能拖/点跳转），且 hover 控制栏也不浮出进度指示点**（artplayer 自带 `.art-bottom:hover .art-progress-indicator { scale(1) }`，靠根节点 `data-viewer-mode` + `global.css` 压成 `scale(0)`，否则看着像能拖）；本地 play/pause/seek 一律 `resyncLocal()` 回拉权威快照（服务端本就拒绝成员控制，不回拉会有一段时间各走各的；控制台直接改 video 也会被拉回）。**放映室房主同样不给倍速（`showSpeed={false}`）**，且房主与成员都锁 1x：房间按墙钟推进度，本地倍速必然漂移；播放页不传，倍速控件照旧。`art.toggle` 是只读属性，**赋值会抛错并白屏**；屏蔽点画面切播放只能在捕获阶段拦 `click`/`dblclick`（放行控制栏）。**只 stopPropagation 会把控制栏一起拦死**（artplayer 是在 `$video` 的 click 里才 emit(`click`) 让它显隐），单点必须在拦截后手动 `art.controls.show = true`——`show` 同时重置它内部的隐藏计时器，之后照旧按播放时长自动收起。移动端还有一条独立链路：`gesture: false`，否则画面左右滑直接 seek（那是绑在 `$video` 上的 touch 事件，进度条 `pointer-events: none` 管不到）。禁用图标用内联样式，artplayer 规则优先级高于 Tailwind。
- **清晰度各端本地，不进房间状态**：`hls-control` 插件只要 m3u8 就注册（**不要**再加 `!viewerMode`，成员弱网时得有降档入口），选档只改本地 `art.hls.currentLevel`，`WatchRoomPlayback` 里也没有 quality 字段——不要为了"统一"加同步：同一间房里手机 4G 与大屏宽带绑一个码率只会让弱端卡死。换源（切集/换片）会 `destroy` 旧 hls 重建，`playVideo` 在销毁前把 `manualLevel` 对应的高度记进 `qualityMemory`（**按 height 记而不是 level 索引**，各集码率阶梯顺序不一定一样），新清单 `MANIFEST_PARSED` 时按高度找档位恢复；记到 `-1`（自动）就别在下一集替用户锁档。插件只在 `ready`/`restart` 刷新文案，而 restart 时清单还没解析，所以恢复后要手动调一次插件的 `update()`，否则按钮停在上一集的档位。
- **卡片交互一律照 `anime-card`**（大厅房间卡、建房页番剧墙）：整卡 hover 放大海报；标题与元信息各自 hover 变色、光标只给有反应的区域，不要整卡 `group` 一把梭，也不要在整卡按钮上挂 `cursor-pointer`。hover 区写成「外层 `w-fit max-w-full` + 内层行内盒（`inline-block`/`inline-flex`）」，**`max-w-full` 不能省**，否则内层按 max-content 撑得比卡片还宽、长标题直接溢出。
- **页面骨架别加戏**：大厅只有「标题 + 创建房间」；建房是独立页 + 一次性过渡页（`useRef` 拦 StrictMode 二次 effect，过渡页「分享」置灰、其余出口保留），点卡直接走、没有「选中 → 确认」中间层，也别把选片塞回弹窗；页内搜索收成胶囊行里的一个按钮，不要再摆第二个常驻输入框；无剧集的番照常渲染、只是点了没反应（`getStatusText` 自会显示「即将开播」，不降透明、不弹 toast）。
- **列表态**：有常驻标题的页面（含大厅）空态不能直接 `return <Exception />`，要让插画在标题以下的剩余区域居中，且只用插画不加文案；骨架块别用 `Skeleton`（`bg-accent` 浅色下看不出），用 `bg-foreground/10`；网格列数梯度与番剧库/热门页共用同一条。
- **侧栏**：header 与播放页同款（两个 tab + 三点菜单，房间名走 `useDocumentTitle`）；「播放列表」tab = 在放海报卡（海报 `h-36 aspect-3/4`，**与站内其他封面同为 3:4，别再写 `w-24` 的 2:3**；番名通栏 / 一行「类型 + 状态」/ 标签，播放量 / 追番量 / 评分三项用 `mt-auto` 贴底（顺序固定，图标取 `PlayCircle`/`Heart`/`Star`，数字走 `formatCount` 压成「12.4万」））+ 简介 + 选集——**直接复用播放页 `AnimeEpisode` 整块**（`选集 (n/N)` + 排序按钮，`currentVideoId` 传房间当前集、`readOnly` 给成员端、`pendingVideoId` 转圈），房主的「换一部」作为 `actions` 塞在排序按钮右边、中间用细竖线隔开，**别另写一套列表、别放回番名旁边**（点它会打开「换一部」抽屉，不再有节目单弹窗），列表固定 `max-h-55` 限高滚动，不撑满侧栏，**别再补「放映中 · 人数 · 房主」那行**；聊天 tab 顶部是房间信息卡（公开开关 + 邀好友 + 成员头像，房主点头像可移出成员），**公告紧跟信息卡、挂在聊天列表上方**（`bg-card` + `Megaphone` 图标，`line-clamp-3` 防长公告挤掉聊天区），播放列表 tab 不再放公告；头像 `size-10`，**间距与卡片内距取同一个值**（`p-4`/`gap-4`/`mt-4`，别再各写各的）；**高亮描边挂「自己」（`currentUserId`）而不是房主**，房主用右下角皇冠标，头像行不显示 `x/max`。
- **换一部 = 顶掉侧栏内容**：点侧栏的 `Shuffle` 图标后，`<aside>` 里的 `<Tabs>` 整块被 `anime-picker.tsx` 替换（`pickerOpen ? <AnimePicker/> : <Tabs/>`），**不是浮层/抽屉，也不做滑入动画**（`components/ui/sheet.tsx` 与 `anime-picker-sheet.tsx` 已删除，别再翻出来）。面板内部：顶部「‹ 返回 + 想看点什么？」（header 取 `PLAY_SIDEBAR_HEADER_CLASS`，与 tab 行同高同内距；标题 `text-base` 与侧栏「播放列表」同号；返回键就是 `IconButton` 默认前景色，与播放页「后退」一致，别再压 `text-muted-foreground`；返回键 `onClose` 恢复原来的 tab）、搜索框 + 主色「搜索」按钮（搜索行、分组标题、列表容器的横向内距统一 `px-5`，与侧栏内容区一致，别写 `px-3`）（**只在回车或点按钮时提交关键词，不再边打边搜**——输入中间态各发一次请求，且下一页游标会跟旧关键词错位；中文输入法 `isComposing` 时不当作提交）、「大家都在看」（按播放量 `sort=3`）或「共找到 N 个相关作品」、行内 `立即换片`（当前番显示「正在放映」、无剧集「暂无剧集」都禁点）。番名用后端 `highlightName`（`<em class="keyword">`，样式在 `global.css`），热门列表没这字段走纯文本。组件挂载即 `inputRef.focus()`，卸载后关键词自然清空；`usePagedList` 不再传 `enabled`。
- **入口**：播放页右上角三点菜单第一项就是「创建放映室」，用**当前这一集**开场（房间名 `番名 第N话`，直接跳 `/watch-room/creating` 带 `WatchRoomCreatingState`，并先 `getWatchRoomSocket()` 省一次握手）；游客角色不显示该入口。房间名上限用 `pages/watch-room/constants.ts` 的 `ROOM_NAME_MAX`（别从 `creating.tsx` 引页面模块），别各处写死 100。
- **弹窗统一 `@/components/custom/form-dialog`**（标题 + 说明 + 内容 + 取消/确认两列，`sm:max-w-md` 统一 448px），页面里不要再手写 `Dialog` / `DialogContent` / footer 按钮排布。表单类传 `onSubmit`（内容自动包进 `<form>`、确认键变 submit，回车可提交，RHF 校验走原生 submit 链路，别再自己写 `<form>` + 整宽提交按钮）；需要触发元素传 `trigger`（内部挂 `DialogTrigger asChild`）；说明只给读屏时 `descriptionClassName='sr-only'`；**确认键在必填项填齐前一律 `confirmDisabled`**（别再等提交后弹校验错误）；宽度差异不要用 `max-w-*` 覆盖，保持全站一致。
- **缓存**：`['watch-room-current']` 与 `['watch-room-rooms']` 在离开/解散/`ROOM_NOT_FOUND` 时都要 `removeQueries`；大厅 `staleTime: 0` + 15s 轮询自愈。

## Git

- 远端 `github.com/hzh11012/Qnya-Frontend.git`（master 直推，tag 仅前端仓库打）
- 发版：功能批次合入后打 `v1.0.x`（当前最新见 `git tag -l | tail -1`）
