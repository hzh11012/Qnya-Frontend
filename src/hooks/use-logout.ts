import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { logout } from '@/apis/auth';

/** 退出登录：无论成败都清除本地用户态（401 由请求层统一跳登录页） */
const useLogout = () => {
  const setUser = useAuthStore(state => state.setUser);

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      setUser(null);
    }
  });
};

export { useLogout };
