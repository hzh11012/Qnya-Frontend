import request from '@/lib/request';
import type { ApiResult } from './openapi';

/** 当前登录用户（wire 类型来自后端 OpenAPI 文档） */
export type User = ApiResult<'/api/auth/me', 'get'>;

const me = async () => {
  return request.get<User>('/api/auth/me');
};

const login = async (email: string, code: string) => {
  return request.post<User>(
    '/api/auth/login',
    { email, code },
    { showErrorToast: true }
  );
};

const sendCode = async (email: string) => {
  return request.post(
    '/api/auth/send-code',
    { email },
    { showErrorToast: true, showSuccessToast: true }
  );
};

const logout = () => {
  return request.post('/api/auth/logout');
};

export { me, login, sendCode, logout };
