import React from 'react';
import { Crown, Globe, Lock, UserMinus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import type { WatchRoomMember } from '@/apis/watch-room';
import { copyShareText, type ShareInfo } from '@/lib/share';
import { cn } from '@/lib/utils';

interface RoomChatHeaderProps {
  visibility: 'public' | 'private';
  members: WatchRoomMember[];
  /** 当前登录用户：只用来高亮「自己」，房主标识单独看 member.role */
  currentUserId?: string;
  isOwner: boolean;
  /** 公开状态提交中：等 ACK 落地再放开开关，避免连点产生竞态 */
  pending?: boolean;
  /** 房主切换公开状态（关掉时由外层补密码） */
  onToggleVisibility: (next: boolean) => void;
  /** 房主从头像菜单移出成员（确认框由外层弹） */
  onKick: (member: WatchRoomMember) => void;
  /** 邀请文案：与 header 分享按钮共用同一份，由房间页统一组装 */
  share: ShareInfo;
}

/** 成员头像：高亮「自己」；房主另加一个右下角标识，房主可点头像开菜单，其余人是静态展示 */
const MemberAvatar: React.FC<{
  member: WatchRoomMember;
  isSelf: boolean;
  canKick: boolean;
  onKick: (member: WatchRoomMember) => void;
}> = ({ member, isSelf, canKick, onKick }) => {
  const avatar = (
    <div className='relative'>
      <Avatar
        className={cn(
          'size-10 ring-1',
          isSelf ? 'ring-primary' : 'ring-border'
        )}
        title={
          member.role === 'owner'
            ? `${member.nickname}（房主）`
            : member.nickname
        }
      >
        {member.avatar && (
          <AvatarImage
            src={member.avatar}
            alt={member.nickname}
          />
        )}
        <AvatarFallback className='text-xs'>
          {member.nickname.slice(0, 1)}
        </AvatarFallback>
      </Avatar>

      {member.role === 'owner' && (
        <span
          aria-label='房主'
          className='pointer-events-none absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card'
        >
          <Crown className='size-2.5' />
        </span>
      )}
    </div>
  );

  // 房主自己不能被移出，也没有可操作项
  if (!canKick) return avatar;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          className='flex cursor-pointer items-center rounded-full outline-none transition-opacity hover:opacity-80'
          title={`${member.nickname} · 点击管理`}
        >
          {avatar}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-fit'
        align='start'
      >
        <DropdownMenuItem
          className='cursor-pointer text-foreground'
          onClick={() => onKick(member)}
        >
          <UserMinus />
          移出房间
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * 聊天页顶部的房间信息区：公开状态 + 邀请入口 + 在房成员。
 *
 * 成员列表原来只在播放列表 tab 里可见，聊天时看不到都有谁在场；
 * 放在这里一眼能看清人数，房主也能顺手把房间设成公开或私人。
 */
const RoomChatHeader: React.FC<RoomChatHeaderProps> = ({
  visibility,
  members,
  currentUserId,
  isOwner,
  pending,
  onToggleVisibility,
  onKick,
  share
}) => {
  const isPublic = visibility === 'public';
  const Icon = isPublic ? Globe : Lock;

  const handleInvite = async () => {
    if (await copyShareText(share)) {
      toast.success(share.successText ?? '邀请文案已复制，发给好友吧');
    } else {
      toast.error('复制失败，请手动复制地址栏链接');
    }
  };

  return (
    <div className='flex-none border-b px-3 py-3'>
      {/* 卡片内距与头像间距统一成同一个值（p-4 / gap-4 / mt-4），四边看起来才是等距的 */}
      <div className='rounded-sm bg-card p-4'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-2'>
            <Icon className='size-3.5 shrink-0 text-muted-foreground' />
            <span className='truncate text-xs'>
              {isPublic ? '公开放映室' : '私人放映室'}
            </span>
            <Switch
              checked={isPublic}
              disabled={!isOwner || pending}
              aria-label='公开状态'
              title={
                isOwner
                  ? isPublic
                    ? '公开：出现在放映室大厅，任何人可进'
                    : '私人：不出现在大厅，凭链接 + 密码进入'
                  : '仅房主可以修改'
              }
              onCheckedChange={onToggleVisibility}
            />
          </div>

          <button
            type='button'
            className='flex shrink-0 cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary'
            onClick={() => void handleInvite()}
          >
            邀好友
            <UserPlus className='size-3.5' />
          </button>
        </div>

        <div className='mt-4 flex flex-wrap items-center gap-4'>
          {members.map(member => (
            <MemberAvatar
              key={member.userId}
              member={member}
              // 高亮的是「自己」，不是房主：房主身份用右下角皇冠标
              isSelf={member.userId === currentUserId}
              // 房主可以移出其它人，自己的头像不给菜单
              canKick={isOwner && member.role !== 'owner'}
              onKick={onKick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoomChatHeader;
