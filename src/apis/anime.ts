import request from '@/lib/request';
import type { ApiQuery, ApiResult } from './openapi';

/** 猜你喜欢响应（wire 类型来自后端 OpenAPI 文档） */
type GuessRes = ApiResult<'/api/client/anime/guess', 'get'>;

/** 猜你喜欢条目（与搜索/热门结果结构一致） */
export type GuessAnimeItem = GuessRes['items'][number];

/** 番剧筛选列表响应与条目（与热门结构一致） */
type BangumiListRes = ApiResult<'/api/client/anime/list', 'get'>;

export type BangumiListQuery = ApiQuery<'/api/client/anime/list', 'get'>;
export type BangumiAnimeItem = BangumiListRes['items'][number];

/** 标签列表响应 */
type TagsRes = ApiResult<'/api/client/anime/tags', 'get'>;

export type BangumiTag = TagsRes['items'][number];

/**
 * 猜你喜欢：后端按 seed 随机排序，同一 seed 内分页顺序稳定，
 * 换 seed 换一批（前端每会话生成一次存 sessionStorage）
 */
const getGuessList = (params: ApiQuery<'/api/client/anime/guess', 'get'>) => {
  return request.get<GuessRes>('/api/client/anime/guess', {
    params
  });
};

/**
 * 番剧筛选列表：各维度单选 + 排序，供 /bangumi 筛选页使用
 */
const getClientList = (params: BangumiListQuery) => {
  return request.get<BangumiListRes>('/api/client/anime/list', {
    params
  });
};

/**
 * 标签列表：筛选页风格选项（登录即可）
 */
const getClientTags = () => {
  return request.get<TagsRes>('/api/client/anime/tags');
};

export { getGuessList, getClientList, getClientTags };
