import React from 'react';
import { Clapperboard, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CoverImage from '@/components/custom/cover-image';
import type { WatchRoomListItem } from '@/apis/watch-room';
import { cn } from '@/lib/utils';
import { formatSince } from './format';

interface RoomCardProps {
  room: WatchRoomListItem;
  onJoin: (room: WatchRoomListItem) => void;
}

/**
 * 大厅房间卡片：竖版海报（与番剧卡同构），海报上叠「放映中/已暂停」、人数、
 * 在播集数；海报下是房间名与「头像 + 开播多久」。满员置灰并盖「已满」，点了也进不去。
 */
const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  const full = room.memberCount >= room.maxMembers;
  const video = room.currentVideo;

  return (
    <li className='min-w-0'>
      <button
        type='button'
        disabled={full}
        onClick={() => onJoin(room)}
        title={full ? '房间人数已满' : '进入房间'}
        className={cn(
          // 光标和番剧卡一样只给「有反应」的区域：海报 + 两行文字，
          // 卡片空白处保持默认箭头，别让人以为整块留白都可点
          'block w-full text-left',
          full && 'cursor-not-allowed opacity-70'
        )}
      >
        <div
          className={cn(
            // 缩放与番剧卡一致：整块海报放大（不是图内缩放），桌面端才响应
            'relative aspect-3/4 overflow-hidden rounded-sm bg-card transition-[scale] duration-200',
            !full && 'md:cursor-pointer md:hover:scale-105'
          )}
        >
          {/* 没选片：空海报占位，避免整块留白 */}
          {video ? (
            <CoverImage
              src={video.animeCover}
              className='absolute inset-0'
            />
          ) : (
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/20 text-muted-foreground/60'>
              <Clapperboard className='size-7' />
              <span className='text-xs'>还没选片</span>
            </div>
          )}

          <div className='absolute inset-x-0 top-0 flex items-start justify-between gap-1 bg-linear-to-b from-black/60 to-transparent p-1.5 sm:gap-2 sm:p-2'>
            {full ? (
              <span className='shrink-0 rounded-sm bg-destructive px-1 py-0.5 text-[10px] leading-none font-medium whitespace-nowrap text-white sm:px-1.5'>
                已满
              </span>
            ) : (
              <span
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-sm bg-black/55 px-1 py-0.5 text-[10px] leading-none font-medium whitespace-nowrap ring-1 ring-white/10 backdrop-blur-sm sm:px-1.5',
                  room.isPlaying ? 'text-white' : 'text-white/85'
                )}
              >
                {room.isPlaying && (
                  <span className='size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)] motion-safe:animate-pulse' />
                )}
                {room.isPlaying ? 'LIVE' : '已暂停'}
              </span>
            )}
            <span className='flex shrink-0 items-center gap-1 rounded-sm bg-black/55 px-1 py-0.5 text-[10px] leading-none whitespace-nowrap text-white/90 tabular-nums ring-1 ring-white/10 backdrop-blur-sm sm:px-1.5'>
              <Users className='size-2.5' />
              {room.memberCount}/{room.maxMembers}
            </span>
          </div>

          {video && (
            <div className='absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/45 to-transparent px-2 pt-8 pb-1.5'>
              <p className='line-clamp-1 text-[11px] text-white/90'>
                {video.animeName} 第{video.episode}话
              </p>
            </div>
          )}
        </div>

        {/* 宽度全程按内容收缩：外层 `w-fit`、内层是行内盒（inline-block / inline-flex），
            DOM 里不留整列宽的盒子，hover 变色区自然只在文字上；`leading-none` 让行盒
            贴合内容高度，行距与改版前一致 */}
        <div className='mt-2.5 w-fit max-w-full leading-none'>
          <p
            className={cn(
              'inline-block max-w-full truncate align-top text-sm leading-5 transition-[color] duration-200',
              !full && 'cursor-pointer hover:text-primary'
            )}
            title={room.name}
          >
            {room.name}
          </p>
        </div>

        {/* 只留头像 + 开播多久；这一行自己 hover 变色，与标题分开（同番剧卡的标题/备注） */}
        <div className='mt-1 w-fit max-w-full leading-none'>
          <div
            className={cn(
              'inline-flex max-w-full items-center gap-1.5 align-top text-xs leading-4 text-muted-foreground transition-[color] duration-200',
              !full && 'cursor-pointer hover:text-primary'
            )}
          >
            <Avatar className='size-4 shrink-0'>
              {room.owner.avatar && (
                <AvatarImage
                  src={room.owner.avatar}
                  alt={room.owner.nickname}
                />
              )}
              <AvatarFallback className='text-[9px]'>
                {room.owner.nickname.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <span className='min-w-0 truncate tabular-nums'>
              {formatSince(room.createdAt)}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
};

export default RoomCard;
