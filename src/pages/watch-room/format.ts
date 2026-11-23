/** 放映室页面共用的时间格式化 */
const formatDate = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  });
};

/**
 * 相对时间（列表里表示「开播多久了」）：
 * 房间都是短生命周期的，超过一天的显示具体日期，避免「3 天前」这种失真感
 */
const formatSince = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return '刚刚开播';
  if (minutes < 60) return `${minutes} 分钟前开播`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前开播`;
  return `${formatDate(date)}开播`;
};

export { formatDate, formatSince };
