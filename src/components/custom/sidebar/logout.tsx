import { LogOutIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { logout } from '@/apis/auth';

interface LogOutProps {
  className?: string;
}

const LogOut: React.FC<LogOutProps> = ({ className }) => {
  const setUser = useAuthStore(state => state.setUser);

  // 登出后无论成败都清除本地用户态（401 会由请求层统一跳登录页）
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      setUser(null);
    }
  });

  return (
    <div
      onClick={() => logoutMutation.mutate()}
      title='退出'
      className={cn(
        'cursor-pointer transition-colors text-button-foreground hover:text-primary select-none duration-200',
        className
      )}
    >
      <LogOutIcon size={22} />
    </div>
  );
};

export default LogOut;
