import { useInfiniteQuery } from '@tanstack/react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useNavigate } from 'react-router-dom';
import Exception from '@/components/custom/exception';
import { AnimeCard, AnimeCardSkeleton } from '@/components/custom/anime-card';
import {
  getMyCollections,
  getMyHistories,
  type MineCollectionItem,
  type MineHistoryItem
} from '@/apis/mine';
import { formatProgress, formatDate } from '@/lib/format';
import { getStatusText } from '@/lib/anime';

/** 追番网格（竖版卡）：列数梯度与首页推荐/猜你喜欢一致（标准断点） */
const COLLECTION_GRID_CLASS =
  'grid gap-4 grid-cols-3 text-sm md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7';

/** 历史网格（横向卡）：列数梯度与首页我的追番一致（标准断点） */
const HISTORY_GRID_CLASS =
  'grid gap-4 grid-cols-2 text-sm md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';

/** 网格 + 无限滚动容器（骨架卡随网格占位） */
const GridScroll: React.FC<{
  gridClass: string;
  skeletonType: 'vertical' | 'horizontal';
  length: number;
  hasMore: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  children: React.ReactNode;
}> = ({
  gridClass,
  skeletonType,
  length,
  hasMore,
  fetchNextPage,
  isFetchingNextPage,
  children
}) => (
  <div>
    <InfiniteScroll
      // 组件默认给容器加内联 overflow: auto，会撑出滚动条并裁剪 hover 放大的卡片，
      // 覆盖为 visible（style 会 merge 且在默认值之后，必定生效）
      style={{ overflow: 'visible' }}
      dataLength={length}
      next={fetchNextPage}
      hasMore={hasMore}
      loader={''}
    >
      <div className={gridClass}>
        {children}
        {isFetchingNextPage && <AnimeCardSkeleton type={skeletonType} />}
      </div>
    </InfiniteScroll>
  </div>
);

/** 我的追番：垂直封面卡网格 */
export const MineCollection: React.FC = () => {
  const query = useInfiniteQuery({
    queryKey: ['mine-collections'],
    // 覆盖全局 staleTime：播放页保存历史/追番后进入需拉取最新数据
    staleTime: 0,
    queryFn: ({ pageParam }) =>
      getMyCollections({ page: pageParam, pageSize: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      allPages.reduce((sum, p) => sum + p.items.length, 0) < lastPage.total
        ? allPages.length + 1
        : undefined
  });

  if (query.isPending) {
    return (
      <div className={COLLECTION_GRID_CLASS}>
        {Array.from({ length: 7 }, (_, i) => (
          <AnimeCardSkeleton
            key={i}
            type='vertical'
          />
        ))}
      </div>
    );
  }

  const list = query.data?.pages.flatMap(page => page.items) ?? [];
  if (!list.length) return <Exception type='empty' />;

  return (
    <GridScroll
      gridClass={COLLECTION_GRID_CLASS}
      skeletonType='vertical'
      length={list.length}
      hasMore={!!query.hasNextPage}
      fetchNextPage={() => query.fetchNextPage()}
      isFetchingNextPage={query.isFetchingNextPage}
    >
      {list.map(item => (
        <CollectionCard
          key={item.animeId}
          item={item}
        />
      ))}
    </GridScroll>
  );
};

const CollectionCard: React.FC<{ item: MineCollectionItem }> = ({ item }) => {
  const navigate = useNavigate();
  return (
    <AnimeCard
      type='vertical'
      title={item.name}
      image={item.cover}
      remark={item.remark || undefined}
      tip={getStatusText(item)}
      onClick={() => item.videoId && navigate(`/anime/${item.videoId}`)}
    />
  );
};

/** 历史记录：横向 banner 卡网格 */
export const MineHistory: React.FC = () => {
  const query = useInfiniteQuery({
    queryKey: ['mine-histories'],
    // 覆盖全局 staleTime：播放页保存历史/追番后进入需拉取最新数据
    staleTime: 0,
    queryFn: ({ pageParam }) =>
      getMyHistories({ page: pageParam, pageSize: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      allPages.reduce((sum, p) => sum + p.items.length, 0) < lastPage.total
        ? allPages.length + 1
        : undefined
  });

  if (query.isPending) {
    return (
      <div className={HISTORY_GRID_CLASS}>
        {Array.from({ length: 5 }, (_, i) => (
          <AnimeCardSkeleton
            key={i}
            type='horizontal'
          />
        ))}
      </div>
    );
  }

  const list = query.data?.pages.flatMap(page => page.items) ?? [];
  if (!list.length) return <Exception type='empty' />;

  return (
    <GridScroll
      gridClass={HISTORY_GRID_CLASS}
      skeletonType='horizontal'
      length={list.length}
      hasMore={!!query.hasNextPage}
      fetchNextPage={() => query.fetchNextPage()}
      isFetchingNextPage={query.isFetchingNextPage}
    >
      {list.map(item => (
        <HistoryCard
          key={`${item.animeId}-${item.videoId}`}
          item={item}
        />
      ))}
    </GridScroll>
  );
};

const HistoryCard: React.FC<{ item: MineHistoryItem }> = ({ item }) => {
  const navigate = useNavigate();
  return (
    <AnimeCard
      type='horizontal'
      title={item.name}
      image={item.banner}
      remark={
        item.episode
          ? `第${item.episode}话 ${item.videoTitle ?? ''}`.trim()
          : undefined
      }
      time={formatDate(item.watchedAt)}
      tip={item.time > 0 ? formatProgress(item.time) : undefined}
      // 携带本卡记录的进度：跳过 detail 缓存（30s staleTime），保证续播到最新位置
      onClick={() =>
        item.videoId &&
        navigate(`/anime/${item.videoId}`, { state: { time: item.time } })
      }
    />
  );
};
