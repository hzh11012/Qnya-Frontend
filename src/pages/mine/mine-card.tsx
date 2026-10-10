import { LogOutIcon, PencilLineIcon } from 'lucide-react';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/use-logout';
import { useAuthStore } from '@/store/auth';

interface MineCardProps {
  onEdit: () => void;
}

/** 用户信息条：头像 + 名称（编辑入口） + 邮箱 + 退出 */
const MineCard: React.FC<MineCardProps> = ({ onEdit }) => {
  const user = useAuthStore(state => state.user);
  const logoutMutation = useLogout();

  if (!user) return null;

  return (
    <div
      className={cn(
        'flex h-28 shrink-0 items-center justify-between rounded-sm bg-card px-4 select-none',
        'h-28 md:h-32 md:px-8 transition-[height,padding] duration-200'
      )}
    >
      <div className='mr-4 flex flex-1 items-center gap-4'>
        <Avatar className='size-16 border border-border dark:border-border/60'>
          <AvatarImage
            src={user.avatar ?? ''}
            alt={user.name}
          />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        <div className='flex h-14 flex-col justify-between'>
          <div className='flex items-center gap-2'>
            <div className='line-clamp-1 break-all text-lg font-bold'>
              {user.name}
            </div>
            <PencilLineIcon
              className='size-5 shrink-0 cursor-pointer text-primary transition-opacity hover:opacity-80'
              onClick={onEdit}
            />
          </div>
          <div className='line-clamp-1 break-all text-sm text-muted-foreground'>
            {user.email}
          </div>
        </div>
      </div>
      <div className='flex items-center gap-4'>
        <Button
          variant='link'
          size='icon'
          title='退出'
          className={cn(
            'text-muted-foreground hover:text-destructive',
            logoutMutation.isPending && 'pointer-events-none opacity-60'
          )}
          onClick={() => logoutMutation.mutate()}
        >
          <LogOutIcon className='size-5' />
        </Button>
      </div>
    </div>
  );
};

export default MineCard;
