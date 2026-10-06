/** 番剧类型 → 中文标签（与管理端 columns 的 types 保持一致） */
export const TYPE_LABELS: Record<string, string> = {
  movie: '剧场版',
  japanese: '日番',
  american: '美番',
  chinese: '国番',
  adult: '里番'
};

/** 播出月份 → 中文标签（与管理端 columns 的 months 保持一致） */
export const MONTH_LABELS: Record<string, string> = {
  january: '一月番',
  april: '四月番',
  july: '七月番',
  october: '十月番'
};

/** 取枚举对应的中文标签，未知值原样返回 */
export const typeLabel = (type: string) => TYPE_LABELS[type] ?? type;

/** 取月份对应的中文标签，未知值原样返回 */
export const monthLabel = (month: string) => MONTH_LABELS[month] ?? month;
