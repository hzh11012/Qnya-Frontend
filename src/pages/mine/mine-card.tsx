import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CameraIcon,
  Loader2Icon,
  LogOutIcon,
  PencilLineIcon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLogout } from '@/hooks/use-logout';
import { useUpdateProfile } from '@/hooks/use-update-profile';
import { compressAvatar } from '@/lib/avatar';
import { getMyStats } from '@/apis/mine';
import { useAuthStore } from '@/store/auth';
import SettingsEntry from '@/components/custom/sidebar/settings-entry';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 可用追番/历史的角色（与列表页一致，游客不展示统计） */
const canViewRecords = (role?: string) =>
  role === 'user' || role === 'premium' || role === 'admin';

/** 信息条统计：追番数/看过部数来自统计接口，加入天数由 createdAt 计算；className 控制两端布局 */
const MineStats: React.FC<{ className?: string }> = ({ className }) => {
  const role = useAuthStore(state => state.user?.role);
  const createdAt = useAuthStore(state => state.user?.createdAt);
  const enabled = canViewRecords(role);
  const { data } = useQuery({
    queryKey: ['mine-stats'],
    queryFn: getMyStats,
    enabled
  });

  // 加入天数含“当天”；快照一次即可（渲染期非纯调用只允许出现在 useState 初始化器中）
  const [joinedDays] = useState(() =>
    createdAt
      ? Math.max(
          1,
          Math.floor((Date.now() - new Date(createdAt).getTime()) / DAY_MS) + 1
        )
      : undefined
  );

  if (!enabled) return null;

  const items = [
    { label: '追番', value: data?.collections },
    { label: '看过', value: data?.histories },
    { label: '加入天数', value: joinedDays }
  ];

  return (
    <div className={cn('items-center gap-3 select-none md:gap-6', className)}>
      {items.map(({ label, value }) => (
        <div
          key={label}
          className='text-center'
        >
          <div className='text-base leading-6 text-muted-foreground md:text-lg'>
            {value ?? '–'}
          </div>
          <div className='text-xs text-muted-foreground'>{label}</div>
        </div>
      ))}
    </div>
  );
};

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
        'flex shrink-0 flex-col rounded-sm bg-card px-4 py-3 select-none',
        'md:h-32 md:flex-row md:items-center md:px-8 md:py-0'
      )}
    >
      <div className='flex w-full items-center justify-between'>
        <div className='mr-4 flex min-w-0 flex-1 items-center gap-4'>
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
          <div className='flex h-14 min-w-0 flex-col justify-between'>
            <div className='flex items-center gap-2'>
              <div className='line-clamp-1 break-all text-lg font-bold'>
                {user.name}
              </div>
              {user.role === 'admin' && (
                <span
                  className='shrink-0 rounded-sm bg-primary px-1.5 py-0.5 text-xs leading-none font-medium text-primary-foreground select-none'
                  title='管理员'
                >
                  管理员
                </span>
              )}
              {user.role === 'premium' && (
                <span
                  className='shrink-0 rounded-sm bg-amber-500/10 px-1.5 py-0.5 text-xs leading-none font-medium text-amber-500 select-none'
                  title='高级会员'
                >
                  会员
                </span>
              )}
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
          <MineStats className='hidden md:flex' />
          <div className='hidden h-8 w-px bg-border md:block' />
          {/* 设置入口：仅移动端（桌面端侧栏 footer 已有） */}
          <SettingsEntry className='md:hidden' />
          <Button
            variant='link'
            size='icon'
            title='退出'
            className={cn(
              'text-muted-foreground hover:text-primary',
              logoutMutation.isPending && 'pointer-events-none opacity-60'
            )}
            onClick={() => logoutMutation.mutate()}
          >
            <LogOutIcon className='size-5' />
          </Button>
        </div>
      </div>
      {/* 移动端：统计独占一行，均分宽度 */}
      <MineStats className='mt-3 flex justify-around border-t border-border pt-3 md:hidden' />
    </div>
  );
};

export default MineCard;
