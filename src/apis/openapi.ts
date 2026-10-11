import type { paths } from './api-types.gen';

/**
 * OpenAPI wire 类型提取工具
 *
 * 接口的请求/响应类型一律从 api-types.gen.ts（由后端 openapi.json 生成）提取，
 * 不再手写重复 interface。同步流程：
 *   后端改 schema → 后端 `pnpm openapi:export` → 前端 `pnpm gen:api` →
 *   tsc 编译报错暴露前后端类型漂移
 */

/** 提取某个 operation 的 200 响应 JSON body（SuccessResponse 包装：{ code, message, data }） */
type JsonBody<Op> = Op extends {
  responses: { 200: { content: { 'application/json': infer R } } };
}
  ? R
  : never;

/** 某路径某方法的成功响应 data（无 data 的端点为 undefined） */
export type ApiResult<
  P extends keyof paths,
  M extends keyof paths[P] & string
> = JsonBody<paths[P][M]> extends { data: infer D } ? D : undefined;

/** 某路径某方法的请求 body */
export type ApiBody<
  P extends keyof paths,
  M extends keyof paths[P] & string
> = paths[P][M] extends {
  requestBody: { content: { 'application/json': infer B } };
}
  ? B
  : never;

/** 某路径某方法的 query 参数 */
export type ApiQuery<
  P extends keyof paths,
  M extends keyof paths[P] & string
> = paths[P][M] extends {
  parameters: { query: infer Q };
}
  ? Q
  : paths[P][M] extends {
        parameters: { query?: infer Q2 };
      }
    ? Q2
    : never;
