import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { me } from '@/apis/auth';
import { useAuthStore } from '@/store/auth';

/**
 * 启动时校验登录态，并把结果同步到 auth store
 *
 * - 已登录 → 写入用户信息（前台对所有角色开放，角色差异由后端接口与页面守卫处理）
 * - 未登录 / 401 → 仅清除；request 层会派发 auth:unauthorized 跳转登录页
 *
 * staleTime 无穷：每个会话只请求一次，避免路由切换时重复校验
 */
export const useAuthInit = () => {
  const setUser = useAuthStore(state => state.setUser);
  const setInitialized = useAuthStore(state => state.setInitialized);
  const isInitialized = useAuthStore(state => state.isInitialized);

  const { data, isPending } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: me,
    retry: false,
    staleTime: Infinity
  });

  useEffect(() => {
    if (isPending) return;
    setUser(data ?? null);
    setInitialized(true);
  }, [data, isPending, setUser, setInitialized]);

  return { isInitialized, setUser };
};
