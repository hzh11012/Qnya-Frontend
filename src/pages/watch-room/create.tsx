import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleXIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CoverImage from '@/components/custom/cover-image';
import ListEmpty from '@/components/custom/list-empty';
import PageTitle from '@/components/custom/page-title';
import { getClientList } from '@/apis/anime';
import type { ClientAnimeItem } from '@/apis/anime';
import { searchAnime } from '@/apis/search';
import type { SearchAnimeItem } from '@/apis/search';
import { getWatchRoomSocket } from '@/apis/watch-room-socket';
import { usePagedList } from '@/hooks/use-paged-list';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { getStatusText } from '@/lib/anime';
import { cn } from '@/lib/utils';
import { ANIME_GRID } from '@/lib/layout';
import type { WatchRoomCreatingState } from './creating';
import { ROOM_NAME_MAX } from './constants';

const PAGE_SIZE = 20;

/** 列表项与搜索结果字段一致的部分，两种来源都收敛到这个形状 */
type PickableAnime = ClientAnimeItem | SearchAnimeItem;

const SORT_OPTIONS = [
  { value: '5', label: '最近更新' },
  { value: '2', label: '最高评分' },
  { value: '3', label: '最多播放' },
  { value: '4', label: '最多追番' }
] as const;

/** 骨架块：`Skeleton` 用的 bg-accent 在浅色下几乎与白底同色，改用前景透明叠一层 */
const Bone: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-sm bg-foreground/10', className)} />
);

/** 选片卡骨架：竖版海报 + 两行文字，加载时不跳版 */
const PickCardSkeleton: React.FC = () => (
  <div className='w-full min-w-0'>
    <Bone className='aspect-3/4 w-full' />
    <Bone className='mt-2.5 h-4 w-3/4' />
    <Bone className='mt-2 h-3 w-1/2' />
  </div>
);

/** 默认从第 1 话开始；没有第 1 话就退而取第一集 */
const firstVideoOf = (anime: PickableAnime) =>
  anime.videos.find(video => video.episode === 1) ?? anime.videos[0] ?? null;

interface PickCardProps {
  anime: PickableAnime;
  onPick: (anime: PickableAnime) => void;
}

/** 选片卡：与番剧卡完全同构 —— 没剧集的照常渲染、右下角显示「即将开播」，
 *  不置灰也不加角标；悬停动效/光标跟别的卡一样，只是点了没反应 */
const PickCard: React.FC<PickCardProps> = ({ anime, onPick }) => {
  const pickable = !!firstVideoOf(anime);
  const remark = anime.remark || `${anime.year} 年`;
  return (
    <div className='w-full min-w-0'>
      <button
        type='button'
        aria-disabled={!pickable}
        title={pickable ? `用《${anime.name}》开一场` : undefined}
        onClick={pickable ? () => onPick(anime) : undefined}
        className='relative block aspect-3/4 w-full cursor-pointer overflow-hidden rounded-sm bg-card transition-[scale] duration-200 md:hover:scale-105'
      >
        <CoverImage
          src={anime.cover}
          className='absolute inset-0'
        />
        <div className='absolute inset-x-0 -bottom-0.5 h-10 bg-card-cover' />
        {/* 状态文案与番剧库一致：无正片时 getStatusText 给的就是「即将开播」 */}
        <span className='absolute right-2 bottom-1.5 text-xs text-white'>
          {getStatusText(anime)}
        </span>
      </button>
      <p
        className='mt-2.5 line-clamp-1 w-fit max-w-full cursor-pointer text-sm transition-[color] duration-200 hover:text-primary'
        title={anime.name}
        onClick={pickable ? () => onPick(anime) : undefined}
      >
        {anime.name}
      </p>
      <p
        className='mt-1 line-clamp-1 w-fit max-w-full cursor-pointer text-xs text-muted-foreground transition-[color] duration-200 hover:text-primary'
        title={remark}
        onClick={pickable ? () => onPick(anime) : undefined}
      >
        {remark}
      </p>
    </div>
  );
};

/**
 * @title 创建放映室
 * @description 独立选片页（不做弹窗内搜索）：搜索 + 排序 + 无限滚动的番剧墙，
 * 点一张卡直接建房进房（和点番剧卡直接进播放页一致），默认第 1 话、默认公开、
 * 房间名自动用「番名 第 N 话」，隐私与改名都进房后再调。
 */
const WatchRoomCreate: React.FC = () => {
  useDocumentTitle('创建放映室');
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sort, setSort] = useState<string>('5');
  // 搜索是「本页筛选」而不是第二个站内搜索框：默认收成胶囊，点开才展开
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 进页面就把 socket 连上：点卡后过渡页只需一次 ACK 往返，不用再等握手
  useEffect(() => {
    getWatchRoomSocket();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(keyword.trim()), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 展开后自动聚焦，省一次点击
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  /** 收起搜索 = 回到默认番剧墙，关键词一起清掉，避免收起后还挂着筛选态 */
  const closeSearch = () => {
    setSearchOpen(false);
    setKeyword('');
    setDebounced('');
  };

  const searching = !!debounced;

  const {
    list,
    fetchMore,
    isPending,
    isFetchingNextPage,
    isPlaceholderData,
    hasNextPage
  } = usePagedList<PickableAnime>({
    queryKey: [
      'watch-room-create',
      searching ? 'search' : 'list',
      debounced,
      sort
    ],
    // 换排序/关键词时保留上一屏，别让 12 张骨架整片闪一下
    keepPrevious: true,
    fetchPage: async page => {
      const res = searching
        ? await searchAnime({ keyword: debounced, page, pageSize: PAGE_SIZE })
        : await getClientList({
            page,
            pageSize: PAGE_SIZE,
            sort: Number(sort) || undefined
          });
      return { items: res.items, total: res.total };
    }
  });

  // 占位数据还在时不要触发翻页：那一页的页码是按旧条件算的
  const sentinelRef = useInfiniteScroll(
    fetchMore,
    !hasNextPage || isFetchingNextPage || isPlaceholderData
  );

  /** 点卡即建房：立刻转到过渡页，房间在那边后台创建，不让用户盯着卡片转圈 */
  const handlePick = (anime: PickableAnime) => {
    const video = firstVideoOf(anime);
    // 「即将开播」的卡在 PickCard 里就不给点击，这里只是兜底，不做提示
    if (!video) return;

    const state: WatchRoomCreatingState = {
      name: `${anime.name} 第${video.episode}话`.slice(0, ROOM_NAME_MAX),
      videoId: video.id,
      animeName: anime.name,
      episode: video.episode,
      cover: anime.cover
    };
    navigate('/watch-room/creating', { state });
  };

  return (
    <div className='my-4 flex flex-1 flex-col md:my-8'>
      <div className='flex items-center justify-between gap-4'>
        <PageTitle className='shrink-0'>创建放映室</PageTitle>
        {/* 与首页「查看全部」同款：outline 按钮，图标在文字前 */}
        <Button
          variant='outline'
          asChild
          className='shrink-0 gap-1'
        >
          <Link to='/watch-room'>
            <ArrowLeft />
            返回大厅
          </Link>
        </Button>
      </div>
      <p className='mt-1 text-xs text-muted-foreground'>
        点一部番直接开场，默认从第 1
        话开始；房间默认公开，进房后可改名或改成私人。
      </p>

      {/* 排序胶囊 + 搜索胶囊：同一行，搜索点开才变成输入框 */}
      <div className='mt-4 md:mt-5'>
        {searchOpen ? (
          <div className='relative md:max-w-md'>
            <Input
              ref={searchInputRef}
              value={keyword}
              maxLength={100}
              placeholder='搜索番剧名'
              enterKeyHint='search'
              prefixIcon={<Search className='size-4 text-muted-foreground' />}
              className='pr-8'
              onChange={event => setKeyword(event.target.value)}
              onKeyDown={event => {
                // 回车只收键盘（移动端挡半屏），筛选是实时的
                if (event.key === 'Enter') event.currentTarget.blur();
                if (event.key === 'Escape') closeSearch();
              }}
            />
            {/* 清空/收起按钮与 header 搜索框同一套：CircleX + 40% 前景色，悬停转 muted */}
            <CircleXIcon
              aria-label='收起搜索'
              className='absolute inset-e-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-foreground/40 transition-[color] duration-200 hover:text-muted-foreground'
              onClick={closeSearch}
              size={14}
            />
          </div>
        ) : (
          <div className='-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1'>
            <button
              type='button'
              className='flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground'
              onClick={() => setSearchOpen(true)}
            >
              <Search className='size-3.5' />
              搜索
            </button>
            {SORT_OPTIONS.map(option => {
              const active = sort === option.value;
              return (
                <button
                  key={option.value}
                  type='button'
                  className={cn(
                    'shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors',
                    active
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:bg-card'
                  )}
                  onClick={() => setSort(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* flex 列 + flex-1：空态（ListEmpty）靠它撑满胶囊行以下的剩余高度 */}
      <div className='mt-6 flex flex-1 flex-col'>
        {isPending ? (
          <div className={ANIME_GRID}>
            {Array.from({ length: 12 }, (_, index) => (
              <PickCardSkeleton key={index} />
            ))}
          </div>
        ) : !list.length ? (
          searching ? (
            <div className='flex min-h-60 flex-col items-center justify-center gap-2 text-sm text-muted-foreground'>
              <p>没有找到「{debounced}」</p>
              <button
                type='button'
                className='cursor-pointer text-xs text-primary hover:underline'
                onClick={closeSearch}
              >
                收起搜索，看看全部
              </button>
            </div>
          ) : (
            <ListEmpty />
          )
        ) : (
          <>
            {/* 占位期间把上一屏压暗并禁点，既提示「正在换排序」又不闪骨架；
                点卡会立刻离开本页，不需要额外的「建房中」锁定状态 */}
            <div
              aria-busy={isPlaceholderData}
              className={cn(
                ANIME_GRID,
                'transition-opacity duration-150',
                isPlaceholderData && 'pointer-events-none opacity-50'
              )}
            >
              {list.map(anime => (
                <PickCard
                  key={anime.id}
                  anime={anime}
                  onPick={handlePick}
                />
              ))}
              {isFetchingNextPage &&
                Array.from({ length: 6 }, (_, index) => (
                  <PickCardSkeleton key={`skeleton-${index}`} />
                ))}
            </div>
            {/* 无限滚动哨兵：进入视口时加载下一页 */}
            <div
              ref={sentinelRef}
              aria-hidden
            />
          </>
        )}
      </div>
    </div>
  );
};

export default WatchRoomCreate;
