import { searchAnime } from '@/apis/search';
import Exception from '@/components/custom/exception';
import { useInfiniteQuery } from '@tanstack/react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  AnimeSearchCard,
  AnimeSearchCardSkeleton,
  ANIME_CARD_GRID_CLASS
} from './anime-search-card';
import { getStatusText, getPlayText } from '@/lib/anime';

// 原实现即为每次请求拉取 1 条，行为保持不变
const PAGE_SIZE = 20;

const Index = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';

  // 关键词变化时 queryKey 变化，自动重置为第一页
  const query = useInfiniteQuery({
    queryKey: ['search-anime', keyword],
    queryFn: ({ pageParam }) =>
      searchAnime({ keyword, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    enabled: !!keyword,
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

  const list = query.data?.pages.flatMap(page => page.items) ?? [];

  // 番剧详情页尚未实现，点击暂不跳转
  const handleAnimeClick = () => {};

  const fetchMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  };

  if (!keyword) {
    return (
      <div className='flex flex-col items-center justify-center h-60 text-muted-foreground gap-2'>
        <p className='text-sm'>请输入关键词搜索</p>
      </div>
    );
  }

  // 首屏加载中：展示骨架屏
  if (query.isPending) {
    return (
      <div className={cn(ANIME_CARD_GRID_CLASS, 'my-4 md:my-8')}>
        {Array.from({ length: 4 }, (_, index) => (
          <AnimeSearchCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // 加载完成但无结果
  if (!list.length) {
    return <Exception type='empty' />;
  }

  return (
    <div className='my-4 md:my-8 overflow-clip'>
      <InfiniteScroll
        // 组件默认给容器加内联 overflow: auto，最后一行按钮按压位移
        // 会把容器撑出滚动条，改为 visible 由外层 overflow-clip 兕底
        style={{ overflow: 'visible' }}
        dataLength={list.length}
        next={fetchMore}
        hasMore={!!query.hasNextPage}
        loader={''}
      >
        <div className={ANIME_CARD_GRID_CLASS}>
          {list.map(item => {
            return (
              <AnimeSearchCard
                key={item.id}
                videoId={item.videoId}
                image={item.cover}
                title={item.name}
                highlightTitle={item.highlightName || item.name}
                type={item.type}
                tags={item.tags}
                year={item.year}
                month={item.month}
                statusText={getStatusText(item)}
                playText={getPlayText(item)}
                director={item.director}
                cv={item.cv}
                description={item.description}
                scoreCount={item.scoreCount}
                avgScore={item.avgScore}
                videos={item.videos}
                onAnimeClick={handleAnimeClick}
              />
            );
          })}
          {/* 加载更多时在网格内追加骨架，与参考实现一致 */}
          {query.isFetchingNextPage && <AnimeSearchCardSkeleton />}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default Index;
