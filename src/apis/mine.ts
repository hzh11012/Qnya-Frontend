import request from '@/lib/request';
import type { User } from '@/apis/auth';
import type { ApiQuery, ApiResult } from './openapi';

/** 我的追番条目（videoId 为该番第一集，用于跳转播放） */
export type MineCollectionItem = ApiResult<
  '/api/client/mine/collections',
  'get'
>['items'][number];

/** 我的历史条目（videoId 为最后观看的一集，time 为该集进度秒数） */
export type MineHistoryItem = ApiResult<
  '/api/client/mine/histories',
  'get'
>['items'][number];

/** 删除一条自己的历史记录（按动漫） */
const deleteMyHistory = (animeId: string) => {
  return request.delete<{ deleted: boolean }>(
    `/api/client/mine/histories/${animeId}`,
    { showSuccessToast: true }
  );
};

type MineCollectionsRes = ApiResult<'/api/client/mine/collections', 'get'>;
type MineHistoriesRes = ApiResult<'/api/client/mine/histories', 'get'>;

/** 我的页面统计（信息条展示用） */
export type MineStats = ApiResult<'/api/client/mine/stats', 'get'>;

/** 我的页面统计：追番数与历史部数 */
const getMyStats = () => {
  return request.get<MineStats>('/api/client/mine/stats');
};

const getMyCollections = (
  params: ApiQuery<'/api/client/mine/collections', 'get'>
) => {
  return request.get<MineCollectionsRes>('/api/client/mine/collections', {
    params
  });
};

const getMyHistories = (
  params: ApiQuery<'/api/client/mine/histories', 'get'>
) => {
  return request.get<MineHistoriesRes>('/api/client/mine/histories', {
    params
  });
};

/** 清空自己的全部历史记录 */
const clearMyHistories = () => {
  return request.delete<{ cleared: number }>('/api/client/mine/histories', {
    showSuccessToast: true
  });
};

/** 更新个人资料：avatar 为压缩后的 base64 dataURL 或 null（清除头像） */
const updateProfile = (data: { name?: string; avatar?: string | null }) => {
  return request.patch<User>('/api/auth/me', data, {
    showSuccessToast: true
  });
};

export {
  clearMyHistories,
  deleteMyHistory,
  getMyCollections,
  getMyHistories,
  getMyStats,
  updateProfile
};
