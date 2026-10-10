import { useMutation } from '@tanstack/react-query';
import { updateProfile } from '@/apis/mine';
import type { User } from '@/apis/auth';
import { useAuthStore } from '@/store/auth';

/** 更新个人资料：成功后同步本地用户态（侧栏头像/名称即时生效） */
const useUpdateProfile = (onSuccess?: (user: User) => void) => {
  const setUser = useAuthStore(state => state.setUser);

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: user => {
      setUser(user);
      onSuccess?.(user);
    }
  });
};

export { useUpdateProfile };
