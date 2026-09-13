import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { me } from '@/apis/auth';
import { useAuthStore } from '@/store/auth';

/**
 * 启动时校验登录态，并把结果同步到 auth store
 *
 * - admin → 写入用户信息
 * - 已登录但非 admin → 提示权限不足并清除
 * - 网络错误 / 401 → 仅清除（跳转由 auth:unauthorized 事件统一处理）
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
    if (data && data.role === 'admin') {
      setUser(data);
    } else {
      if (data) toast.error('权限不足');
      setUser(null);
    }
    setInitialized(true);
  }, [data, isPending, setUser, setInitialized]);

  return { isInitialized, setUser };
};
