import request from '@/lib/request';
import type { ApiBody, ApiResult } from './openapi';

/** 播放详情（wire 类型来自后端 OpenAPI 文档，改后端 schema 后跑 pnpm gen:api 同步） */
export type PlayDetail = ApiResult<'/api/client/play/{videoId}', 'get'>;

/** 系列其他季 / 推荐条目 */
export type PlayAnimeItem = PlayDetail['series'][number];

/** 弹幕条目（与 artplayer 插件一致，mode 为数值） */
export interface DanmakuItem {
  text: string;
  time?: number;
  mode?: 0 | 1 | 2;
  color?: string;
}

/** 弹幕存储结构（后端枚举字符串 mode） */
export type DanmakuData = ApiBody<
  '/api/client/play/{videoId}/danmakus',
  'post'
>;

const getPlayDetail = (videoId: string) => {
  return request.get<PlayDetail>(`/api/client/play/${videoId}`, {
    showErrorToast: true
  });
};

const getDanmakuList = (videoId: string) => {
  return request.get<ApiResult<'/api/client/play/{videoId}/danmakus', 'get'>>(
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

const saveHistory = (
  videoId: string,
  time: ApiBody<'/api/client/play/{videoId}/history', 'post'>['time']
) => {
  return request.post(`/api/client/play/${videoId}/history`, { time });
};

const toggleCollection = (videoId: string) => {
  return request.post<
    ApiResult<'/api/client/play/{videoId}/collection', 'post'>
  >(`/api/client/play/${videoId}/collection`, null, { showErrorToast: true });
};

const createRating = (
  videoId: string,
  data: ApiBody<'/api/client/play/{videoId}/rating', 'post'>
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
