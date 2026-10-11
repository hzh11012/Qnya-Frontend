import request from '@/lib/request';
import type { ApiQuery, ApiResult } from './openapi';

/** 搜索联想条目（wire 类型来自后端 OpenAPI 文档） */
export type SearchSuggestItem = ApiResult<
  '/api/client/search/suggestions',
  'get'
>[number];

/** 搜索结果响应 */
type SearchAnimeRes = ApiResult<'/api/client/search/', 'get'>;

export type SearchAnimeItem = SearchAnimeRes['items'][number];

const searchSuggest = (
  params: ApiQuery<'/api/client/search/suggestions', 'get'>
) => {
  return request.get<SearchSuggestItem[]>('/api/client/search/suggestions', {
    params,
    showErrorToast: true
  });
};

const searchAnime = (params: ApiQuery<'/api/client/search/', 'get'>) => {
  return request.get<SearchAnimeRes>('/api/client/search', {
    params,
    showErrorToast: true
  });
};

export { searchSuggest, searchAnime };
