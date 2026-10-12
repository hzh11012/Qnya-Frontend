import request from '@/lib/request';
import type { ApiResult } from './openapi';

export type HomeResponse = ApiResult<'/api/client/home/', 'get'>;

/** 我的追番条目（videoId 为观看过的一集或第一集，用于续播跳转） */
export type HomeCollectionItem = HomeResponse['collections'][number];

/** 类型推荐行 */
export type HomeTypeRow = HomeResponse['animeTypes'][number];

/** 首页聚合：我的追番 + 各类型推荐（adult 仅高级会员/管理员可见） */
const getHome = () => {
  return request.get<HomeResponse>('/api/client/home/');
};

export { getHome };
