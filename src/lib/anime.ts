// 番剧列表展示文案：与搜索结果、专题详情共用

// 状态文案：无正片时即将开播，已完结显示总集数，连载中显示更新进度
const getStatusText = (item: { status: string; videoCount: number }) => {
  if (!item.videoCount) return '即将开播';
  return item.status === 'completed'
    ? `全${item.videoCount}话`
    : `更新至第${item.videoCount}话`;
};

const getPlayText = (item: { videoCount: number }) =>
  item.videoCount ? '立即观看' : '即将开播';

export { getStatusText, getPlayText };
