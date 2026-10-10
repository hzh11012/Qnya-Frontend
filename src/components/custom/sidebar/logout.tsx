import { LogOutIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/use-logout';

interface LogOutProps {
  className?: string;
}

const LogOut: React.FC<LogOutProps> = ({ className }) => {
  const logoutMutation = useLogout();

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
