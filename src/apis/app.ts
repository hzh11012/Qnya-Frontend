import request from '@/lib/request';
import type { ApiQuery, ApiResult } from './openapi';

/** 应用发布平台（与后端 app_platform 枚举一致） */
export type AppPlatform = 'android' | 'windows' | 'ios' | 'macos';

/** 指定平台的最新版本信息（该平台无发布记录时为 null） */
export type LatestRelease = ApiResult<'/api/app/latest', 'get'>;

/** 各平台最新版本查询：客户端下载页、版本展示共用 */
const getLatestRelease = (params?: ApiQuery<'/api/app/latest', 'get'>) => {
  return request.get<LatestRelease>('/api/app/latest', { params });
};

export { getLatestRelease };
