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

/** 首页轮播条目（banner 大图 + 简介） */
export type HomeBannerItem = HomeResponse['banners'][number];

/** 新番发现条目（最新入库番剧） */
export type HomePickItem = HomeResponse['picks'][number];
