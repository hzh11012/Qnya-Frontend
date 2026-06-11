import { LogOutIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { useRequest } from 'ahooks';
import { logout } from '@/apis';

interface LogOutProps {
  className?: string;
}

const LogOut: React.FC<LogOutProps> = ({ className }) => {
  const setUser = useAuthStore(state => state.setUser);

  const { run: onLogout } = useRequest(logout, {
    manual: true,
    debounceWait: 250,
    onFinally: () => {
      setUser(null);
    }
  });

  return (
    <div
      onClick={onLogout}
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
