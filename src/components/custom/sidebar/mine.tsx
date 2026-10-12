import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useShallow } from 'zustand/react/shallow';

const Mine = () => {
  const navigate = useNavigate();

  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { name, avatar } = useAuthStore(
    useShallow(state => ({
      name: state.user?.name ?? '',
      avatar: state.user?.avatar ?? ''
    }))
  );

  // 未登录：显示登录入口，点击跳转登录页
  if (!isAuthenticated) {
    return (
      <div
        className={cn(
          'flex size-8 cursor-pointer items-center justify-center rounded-full border text-muted transition-colors hover:text-primary'
        )}
        title='登录'
        onClick={() => navigate('/login')}
      >
        <LogIn size={16} />
      </div>
    );
  }

  return (
    <Avatar
      className={cn('size-8 cursor-pointer')}
      title='我的'
      onClick={() => navigate('/mine')}
    >
      <AvatarImage
        src={avatar}
        alt={name}
      />
      <AvatarFallback>
        <div className='size-full bg-fail-avatar bg-cover' />
      </AvatarFallback>
    </Avatar>
  );
};

export default Mine;
