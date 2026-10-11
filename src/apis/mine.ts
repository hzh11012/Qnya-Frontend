import request from '@/lib/request';
import type { User } from '@/apis/auth';

/** 我的追番条目（videoId 为该番第一集，用于跳转播放） */
export interface MineCollectionItem {
  animeId: string;
  name: string;
  cover: string;
  remark: string;
  status: 'upcoming' | 'airing' | 'completed';
  videoCount: number;
  avgScore: number;
  videoId: string | null;
  collectedAt: string;
}

/** 我的历史条目（videoId 为最后观看的一集，time 为该集进度秒数） */
export interface MineHistoryItem {
  animeId: string;
  name: string;
  banner: string;
  videoId: string | null;
  episode: number | null;
  videoTitle: string | null;
  time: number;
  watchedAt: string;
}

interface MineListRes<T> {
  items: T[];
  total: number;
}

const getMyCollections = (params: { page: number; pageSize: number }) => {
  return request.get<MineListRes<MineCollectionItem>>(
    '/api/client/mine/collections',
    { params }
  );
};

const getMyHistories = (params: { page: number; pageSize: number }) => {
  return request.get<MineListRes<MineHistoryItem>>(
    '/api/client/mine/histories',
    {
      params
    }
  );
};

/** 更新个人资料：avatar 为压缩后的 base64 dataURL 或 null（清除头像） */
const updateProfile = (data: { name?: string; avatar?: string | null }) => {
  return request.patch<User>('/api/auth/me', data, {
    showSuccessToast: true
  });
};

export { getMyCollections, getMyHistories, updateProfile };
