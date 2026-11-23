/**
 * 站内列表页共用的网格梯度（标准断点 md/lg/xl/2xl）。
 * 竖版番剧卡（3:4）3→4→5→6→7 列，横版卡（16:9）少一列 2→3→4→5→6 列。
 * 热门 / 番剧库 / 我的追番 / 首页推荐共用，别再各页复制一份。
 *
 * 需要居中（卡片有 max-w 上限时）另行 cn(..., 'justify-items-center')。
 * 注意：完整类名必须字面量出现在源码里，Tailwind 才会生成对应 CSS。
 */
export const ANIME_GRID =
  'grid grid-cols-3 gap-x-4 gap-y-6 text-sm md:grid-cols-4 md:gap-x-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7';

/** 横版番剧卡（16:9 封面）的网格：比竖版少一列，行距同竖版 */
export const ANIME_GRID_HORIZONTAL =
  'grid grid-cols-2 gap-x-4 gap-y-6 text-sm md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
