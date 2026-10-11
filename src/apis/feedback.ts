import request from '@/lib/request';
import type { ApiBody } from './openapi';

/** 反馈类型（wire 类型来自后端 OpenAPI 文档） */
export type FeedbackType = ApiBody<
  '/api/client/feedback/{animeId}',
  'post'
>['type'];

const createFeedback = (
  animeId: string,
  data: ApiBody<'/api/client/feedback/{animeId}', 'post'>
) => {
  return request.post(`/api/client/feedback/${animeId}`, data, {
    showSuccessToast: true
  });
};

export { createFeedback };
