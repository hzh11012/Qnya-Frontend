/** 秒数 → 播放进度文案：75s → 01:15，3700s → 1:01:40 */
const formatProgress = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
};

/** ISO 时间 → 观看日期文案：今天 HH:mm / 昨天 HH:mm / 同年 MM-DD / MM-DD YYYY */
const formatDate = (datetime: string) => {
  const date = new Date(datetime);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const padZero = (num: number) => num.toString().padStart(2, '0');
  const timeStr = `${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
  const dayDiff = (todayStart.getTime() - target.getTime()) / 86_400_000;

  if (dayDiff < 1) {
    return `今天 ${timeStr}`;
  } else if (dayDiff < 2) {
    return `昨天 ${timeStr}`;
  } else if (date.getFullYear() === now.getFullYear()) {
    return `${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`;
  } else {
    return `${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${date.getFullYear()}`;
  }
};

export { formatProgress, formatDate };
