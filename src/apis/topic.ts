import request from '@/lib/request';
import type { ApiQuery, ApiResult } from './openapi';

/** 专题列表响应（wire 类型来自后端 OpenAPI 文档） */
type TopicListRes = ApiResult<'/api/client/topics/', 'get'>;

export type TopicItem = TopicListRes['items'][number];

/** 专题详情响应 */
type TopicDetailRes = ApiResult<'/api/client/topics/{id}', 'get'>;

export type TopicAnimeItem = TopicDetailRes['anime'][number];

const getTopicList = (params: ApiQuery<'/api/client/topics/', 'get'>) => {
  return request.get<TopicListRes>('/api/client/topics', {
    params,
    showErrorToast: true
  });
};

const getTopicDetail = (id: string) => {
  return request.get<TopicDetailRes>(`/api/client/topics/${id}`, {
    showErrorToast: true
  });
};

export { getTopicList, getTopicDetail };
