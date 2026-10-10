import {
  CameraIcon,
  Loader2Icon,
  LogOutIcon,
  PencilLineIcon
} from 'lucide-react';
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLogout } from '@/hooks/use-logout';
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { compressAvatar } from '@/lib/avatar';
import { useAuthStore } from '@/store/auth';

interface MineCardProps {
  onEdit: () => void;
}

/** 用户信息条：头像（点击即改） + 名称（编辑入口） + 邮箱 + 退出 */
const MineCard: React.FC<MineCardProps> = ({ onEdit }) => {
  const user = useAuthStore(state => state.user);
  const logoutMutation = useLogout();
  const updateProfileMutation = useUpdateProfile();
  const [avatarBusy, setAvatarBusy] = useState(false);

  if (!user) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 允许重复选择同一文件
    e.target.value = '';
    if (!file || avatarBusy) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('图片过大，请选择 20MB 以内的图片');
      return;
    }

    setAvatarBusy(true);
    try {
      const dataURL = await compressAvatar(file);
      updateProfileMutation.mutate({ avatar: dataURL });
    } catch {
      toast.error('图片处理失败，请更换图片');
    } finally {
      setAvatarBusy(false);
    }
  };

  const avatarUploading = avatarBusy || updateProfileMutation.isPending;

  return (
    <div
      className={cn(
        'flex h-28 shrink-0 items-center justify-between rounded-sm bg-card px-4 select-none',
        'h-28 md:h-32 md:px-8 transition-[height,padding] duration-200'
      )}
    >
      <div className='mr-4 flex flex-1 items-center gap-4'>
        <label
          className='group relative shrink-0 cursor-pointer select-none'
          title='点击修改头像'
        >
          <Avatar className='size-16 border border-border dark:border-border/60'>
            <AvatarImage
              src={user.avatar ?? ''}
              alt={user.name}
            />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white transition-opacity duration-200',
              avatarUploading
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            )}
          >
            {avatarUploading ? (
              <Loader2Icon
                size={18}
                className='animate-spin'
              />
            ) : (
              <CameraIcon size={18} />
            )}
          </div>
          <input
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleAvatarChange}
          />
        </label>
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
