import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import Exception from '@/components/custom/exception';
import PageTitle from '@/components/custom/page-title';
import { Skeleton } from '@/components/ui/skeleton';
import { getHotList } from '@/apis/hot';
import type { HotAnimeItem } from '@/apis/hot';
import { getStatusText } from '@/lib/anime';
import CoverImage from '@/components/custom/cover-image';

const PAGE_SIZE = 20;

/** 热门卡片网格：2→3→4→5→6→7 随宽度平滑过渡 */
const HOT_GRID_CLASS =
  'grid grid-cols-2 gap-x-4 gap-y-6 text-sm sm:grid-cols-3 md:grid-cols-4 md:gap-x-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7';

const HotCardSkeleton: React.FC = () => {
  return (
    <div className='w-full flex flex-col gap-2'>
      <Skeleton className='rounded-sm aspect-[3/4] w-full' />
      <Skeleton className='w-3/4 h-4 rounded-sm' />
      <Skeleton className='w-full h-3 rounded-sm' />
    </div>
  );
};

HotCardSkeleton.displayName = 'HotCardSkeleton';

const HotCard: React.FC<{ item: HotAnimeItem }> = ({ item }) => {
  const { name, cover, description } = item;

  return (
    <div className='w-full flex flex-col gap-2 cursor-pointer'>
      <div className='group relative rounded-sm aspect-[3/4] overflow-hidden'>
        {/* 动画 inset 而非 transform scale：GPU 合成的 scale 会拉伸旧纹理导致过渡期模糊 */}
        <div className='absolute inset-0 transition-[inset] duration-200 group-hover:-inset-[2.5%]'>
          <CoverImage src={cover} />
        </div>
        <div className='absolute inset-x-0 -bottom-0.5 h-10 bg-card-cover' />
        <div className='absolute bottom-1.5 right-2 text-white text-xs'>
          {getStatusText(item)}
        </div>
      </div>
      <div
        className='text-sm text-foreground line-clamp-1 cursor-pointer hover:text-primary transition-[color] duration-200'
        title={name}
      >
        {name}
      </div>
      <div
        className='text-xs text-muted-foreground line-clamp-1'
        title={description}
      >
        {description}
      </div>
    </div>
  );
};

const Index = () => {
  const query = useInfiniteQuery({
    queryKey: ['hot-list'],
    queryFn: ({ pageParam }) =>
      getHotList({ page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce(
        (sum, page) => sum + page.items.length,
        0
      );
      return fetched < lastPage.total && lastPage.items.length > 0
        ? allPages.length + 1
        : undefined;
    }
  });

  const list = useMemo(
    () => query.data?.pages.flatMap(page => page.items) ?? [],
    [query.data]
  );

  const fetchMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  };

  if (query.isPending) {
    return (
      <div className='my-4 md:my-8'>
        <PageTitle className='mb-3 md:mb-4'>热门动漫排行</PageTitle>
        <div className={HOT_GRID_CLASS}>
          {Array.from({ length: 14 }, (_, index) => (
            <HotCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!list.length) {
    return <Exception type='empty' />;
  }

  return (
    <div className='my-4 md:my-8 overflow-clip'>
      <PageTitle className='mb-3 md:mb-4'>热门动漫排行</PageTitle>
      <InfiniteScroll
        // 组件默认给容器加内联 overflow: auto，避免撑出多余滚动条
        style={{ overflow: 'visible' }}
        dataLength={list.length}
        next={fetchMore}
        hasMore={!!query.hasNextPage}
        loader={''}
      >
        <div className={HOT_GRID_CLASS}>
          {list.map(item => (
            <HotCard
              key={item.id}
              item={item}
            />
          ))}
          {query.isFetchingNextPage && (
            <>
              <HotCardSkeleton />
              <HotCardSkeleton />
              <HotCardSkeleton />
              <HotCardSkeleton />
            </>
          )}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default Index;
