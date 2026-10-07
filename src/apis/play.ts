import request from '@/lib/request';

/** 系列其他季 / 推荐条目 */
export interface PlayAnimeItem {
  id: string;
  name: string;
  cover: string;
  banner: string;
  status: 'upcoming' | 'airing' | 'completed';
  videoCount: number;
  videoId: string | null;
  playCount: number;
  collectionCount: number;
  avgScore: number;
}

/** 播放详情 */
export interface PlayDetail {
  animeId: string;
  videoId: string;
  name: string;
  description: string;
  cover: string;
  status: 'upcoming' | 'airing' | 'completed';
  avgScore: number;
  scoreCount: number;
  playCount: number;
  collectionCount: number;
  videoCount: number;
  video: {
    id: string;
    url: string;
    episode: number;
  };
  videos: {
    id: string;
    episode: number;
    title: string;
  }[];
  /** 动漫维度唯一历史：最近观看的一集及进度（videoId 可能不是当前集） */
  history: { videoId: string; time: number } | null;
  /** 当前集恢复进度：仅当历史属于当前集时非 0 */
  time: number;
  isCollected: boolean;
  isRating: boolean;
  series: PlayAnimeItem[];
  recommendations: PlayAnimeItem[];
}

/** 弹幕条目（与 artplayer 插件一致，mode 为数值） */
export interface DanmakuItem {
  text: string;
  time?: number;
  mode?: 0 | 1 | 2;
  color?: string;
}

/** 弹幕存储结构（后端枚举字符串 mode） */
export interface DanmakuData {
  text: string;
  color: string;
  mode: 'scroll' | 'top' | 'bottom';
  time: number;
}

const getPlayDetail = (videoId: string) => {
  return request.get<PlayDetail>(`/api/client/play/${videoId}`, {
    showErrorToast: true
  });
};

const getDanmakuList = (videoId: string) => {
  return request.get<{ items: DanmakuData[] }>(
    `/api/client/play/${videoId}/danmakus`
  );
};

const danmakuCreate = (videoId: string, data: DanmakuData) => {
  return request.post(`/api/client/play/${videoId}/danmakus`, data, {
    showErrorToast: true
  });
};

const incrementPlayCount = (videoId: string) => {
  return request.post(`/api/client/play/${videoId}/views`);
};

const saveHistory = (videoId: string, time: number) => {
  return request.post(`/api/client/play/${videoId}/history`, { time });
};

const toggleCollection = (videoId: string) => {
  return request.post<{ collected: boolean }>(
    `/api/client/play/${videoId}/collection`,
    null,
    { showErrorToast: true }
  );
};

const createRating = (
  videoId: string,
  data: { score: number; content: string }
) => {
  return request.post(`/api/client/play/${videoId}/rating`, data, {
    showErrorToast: true
  });
};

export {
  getPlayDetail,
  getDanmakuList,
  danmakuCreate,
  incrementPlayCount,
  saveHistory,
  toggleCollection,
  createRating
};
