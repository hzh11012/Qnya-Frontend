import request from '@/lib/request';
import type { ApiQuery, ApiResult } from './openapi';

/** 热门列表响应（wire 类型来自后端 OpenAPI 文档） */
type HotRes = ApiResult<'/api/client/anime/hot', 'get'>;

/** 热门条目（与搜索结果结构一致，仅无高亮字段） */
export type HotAnimeItem = HotRes['items'][number];

const getHotList = (params: ApiQuery<'/api/client/anime/hot', 'get'>) => {
  return request.get<HotRes>('/api/client/anime/hot', {
    params,
    showErrorToast: true
  });
};

export { getHotList };
