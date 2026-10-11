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

type MineCollectionsRes = ApiResult<'/api/client/mine/collections', 'get'>;
type MineHistoriesRes = ApiResult<'/api/client/mine/histories', 'get'>;

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

/** 更新个人资料：avatar 为压缩后的 base64 dataURL 或 null（清除头像） */
const updateProfile = (data: { name?: string; avatar?: string | null }) => {
  return request.patch<User>('/api/auth/me', data, {
    showSuccessToast: true
  });
};

export { getMyCollections, getMyHistories, updateProfile };
