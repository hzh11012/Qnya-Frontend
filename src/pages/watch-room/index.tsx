import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getMyCurrentRoom,
  getPublicRooms,
  type WatchRoomListItem
} from '@/apis/watch-room';
import { usePagedList } from '@/hooks/use-paged-list';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useDocumentTitle } from '@/hooks/use-document-title';
import ListEmpty from '@/components/custom/list-empty';
import PageTitle from '@/components/custom/page-title';
import { Button } from '@/components/ui/button';
import RoomCard from './room-card';
import { ArrowRight, Clapperboard, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ANIME_GRID } from '@/lib/layout';
import { useAuthStore } from '@/store/auth';

const PAGE_SIZE = 12;

/** 骨架块：`Skeleton` 用的 bg-accent 在浅色下几乎与白底同色，这里改用前景透明叠一层 */
const Bone: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-sm bg-foreground/10', className)} />
);

/** 卡片骨架：竖版海报 + 两行文字，与 RoomCard 同构，加载时不跳版 */
const RoomCardSkeleton: React.FC = () => (
  <li className='min-w-0'>
    <Bone className='aspect-3/4 w-full' />
    <Bone className='mt-2.5 h-4 w-3/4' />
    <Bone className='mt-2 h-3 w-1/2' />
  </li>
);

/**
 * @title 放映室大厅
 * @description 公开房间列表（新开播在前）：15s 轮询自愈，房间随时会被解散，
 * 所以不读旧缓存，并用「继续待在…」入口兜住断线归队
 */
const WatchRoomLobby: React.FC = () => {
  useDocumentTitle('放映室');
  const navigate = useNavigate();
  // 建房走 Socket，服务端要求 user 角色：游客不摆这个点不动的入口
  const canCreate = useAuthStore(s => !!s.user && s.user.role !== 'guest');

  // 回到房间：服务端记录了账号维度的当前房间归属（断网/换设备恢复入口）。
  // 每次进大厅都重新问一次，避免房间解散/离开后还挂着上一次的入口
  const { data: currentRoom } = useQuery({
    queryKey: ['watch-room-current'],
    queryFn: getMyCurrentRoom,
    staleTime: 0
  });

  const { list, fetchMore, hasNextPage, isFetchingNextPage, isPending } =
    usePagedList<WatchRoomListItem>({
      queryKey: ['watch-room-rooms'],
      fetchPage: page => getPublicRooms({ page, pageSize: PAGE_SIZE }),
      // 房间随时会被解散：不读旧缓存，并定时重拉，避免列表里挂着已经不存在的房间
      staleTime: 0,
      refetchInterval: 15_000
    });

  const sentinelRef = useInfiniteScroll(() => {
    if (hasNextPage && !isFetchingNextPage) fetchMore();
  }, isFetchingNextPage);

  return (
    <div className='my-4 flex flex-1 flex-col md:my-8'>
      <div className='mb-3 flex items-center justify-between gap-4 md:mb-4'>
        <PageTitle className='shrink-0'>放映室</PageTitle>
        {canCreate && (
          <Button
            asChild
            className='shrink-0'
          >
            <Link to='/watch-room/new'>
              <Plus className='size-4' />
              创建房间
            </Link>
          </Button>
        )}
      </div>

      {/* 回到房间：断网 / 杀 App / 换设备后从这里归队 */}
      {currentRoom && (
        <button
          type='button'
          onClick={() => navigate(`/watch-room/${currentRoom.id}`)}
          className='mb-3 flex w-full cursor-pointer items-center gap-3 rounded-sm border border-primary/30 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10 md:mb-4'
        >
          <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <Clapperboard className='size-4' />
          </span>
          <span className='min-w-0 flex-1'>
            <span className='block truncate text-sm font-medium'>
              继续待在「{currentRoom.name}」
            </span>
            <span className='mt-0.5 block truncate text-xs text-muted-foreground'>
              {currentRoom.currentVideo
                ? `正在看 ${currentRoom.currentVideo.animeName} 第${currentRoom.currentVideo.episode}话`
                : '房间内还没有选片'}
            </span>
          </span>
          <span className='flex shrink-0 items-center gap-1 text-xs text-primary'>
            回到房间
            <ArrowRight className='size-3.5' />
          </span>
        </button>
      )}

      {isPending ? (
        <ul className={ANIME_GRID}>
          {Array.from({ length: 12 }).map((_, index) => (
            <RoomCardSkeleton key={index} />
          ))}
        </ul>
      ) : list.length === 0 ? (
        // 空态吃掉标题以下的剩余高度，插画在视口内垂直居中（与整页空态的其他列表页观感一致）
        <ListEmpty />
      ) : (
        <>
          <ul className={ANIME_GRID}>
            {list.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={item => navigate(`/watch-room/${item.id}`)}
              />
            ))}
            {isFetchingNextPage && (
              <>
                <RoomCardSkeleton />
                <RoomCardSkeleton />
                <RoomCardSkeleton />
              </>
            )}
          </ul>
          {/* 无限滚动哨兵：进入视口时加载下一页 */}
          <div
            ref={sentinelRef}
            aria-hidden
          />
        </>
      )}
    </div>
  );
};

export default WatchRoomLobby;
