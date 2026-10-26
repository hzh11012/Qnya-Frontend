import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { logout } from '@/apis/auth';

/**
 * 退出登录：无论成败都清除本地用户态与全局查询缓存。
 * 缓存不清的话，换账号登录后 staleTime 窗口内会短暂看到上一账号的
 * mine-stats / 收藏 / 历史等数据。
 */
const useLogout = () => {
  const setUser = useAuthStore(state => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      setUser(null);
      queryClient.clear();
    }
  });
};

export { useLogout };
