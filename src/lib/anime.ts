// 番剧列表展示文案：与搜索结果、专题详情共用

// 状态文案：即将开播优先于剧集数（提前录入资源也不展示更新进度），
// 无正片时即将开播，已完结显示总集数，连载中显示更新进度
const getStatusText = (item: { status: string; videoCount: number }) => {
  if (item.status === 'upcoming' || !item.videoCount) return '即将开播';
  return item.status === 'completed'
    ? `全${item.videoCount}话`
    : `更新至第${item.videoCount}话`;
};

const getPlayText = (item: { status: string; videoCount: number }) =>
  item.status !== 'upcoming' && item.videoCount ? '立即观看' : '即将开播';

/**
 * 详情页状态文案：即将开播优先于剧集数；连载/完结带前缀，比列表版更完整。
 * 播放页简介与放映室侧栏共用，保证同一部番两处说法一致。
 */
const getPlayStatusText = (item: { status: string; videoCount: number }) => {
  if (item.status === 'upcoming' || !item.videoCount) return '即将开播';
  return item.status === 'completed'
    ? `已完结，全${item.videoCount}话`
    : `连载中，更新至第${item.videoCount}话`;
};

/** 评分展示：5 分制折算 10 分制，fixed 保留一位小数，无评分返回兜底文案 */
const formatScore = (avgScore: number, fixed?: boolean) =>
  avgScore > 0
    ? `${fixed ? (avgScore * 2).toFixed(1) : avgScore * 2}分`
    : '暂无评分';

export { getStatusText, getPlayText, getPlayStatusText, formatScore };
