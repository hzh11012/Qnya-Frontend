/** 状态 → 中文标签 */
export const STATUS_LABELS: Record<string, string> = {
  upcoming: '未开播',
  airing: '连载中',
  completed: '已完结'
};

/** 取状态对应的中文标签，未知值原样返回 */
export const statusLabel = (status: string) => STATUS_LABELS[status] ?? status;
