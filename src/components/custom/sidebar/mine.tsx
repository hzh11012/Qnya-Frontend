import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import FailAvatar from '@/components/custom/fail-avatar';
import { useShallow } from 'zustand/react/shallow';

const Mine = () => {
  const navigate = useNavigate();

  const { name, avatar } = useAuthStore(
    useShallow(state => ({
      name: state.user?.name ?? '',
      avatar: state.user?.avatar ?? ''
    }))
  );

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
        <FailAvatar />
      </AvatarFallback>
    </Avatar>
  );
};

export default Mine;
