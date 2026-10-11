import request from '@/lib/request';
import type { ApiQuery, ApiResult } from './openapi';

/** 猜你喜欢响应（wire 类型来自后端 OpenAPI 文档） */
type GuessRes = ApiResult<'/api/client/anime/guess', 'get'>;

/** 猜你喜欢条目（与搜索/热门结果结构一致） */
export type GuessAnimeItem = GuessRes['items'][number];

/**
 * 猜你喜欢：后端按 seed 随机排序，同一 seed 内分页顺序稳定，
 * 换 seed 换一批（前端每会话生成一次存 sessionStorage）
 */
const getGuessList = (params: ApiQuery<'/api/client/anime/guess', 'get'>) => {
  return request.get<GuessRes>('/api/client/anime/guess', {
    params
  });
};

export { getGuessList };
