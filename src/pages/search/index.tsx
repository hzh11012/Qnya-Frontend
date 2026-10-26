import { searchAnime } from '@/apis/search';
import Exception from '@/components/custom/exception';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { usePagedList } from '@/hooks/use-paged-list';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import {
  AnimeSearchCard,
  AnimeSearchCardSkeleton,
  ANIME_CARD_GRID_CLASS
} from './anime-search-card';
import { getStatusText, getPlayText } from '@/lib/anime';

const PAGE_SIZE = 20;

const Index = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  useDocumentTitle(keyword ? `搜索：${keyword}` : '搜索');

  // 关键词变化时 queryKey 变化，自动重置为第一页
  const { list, fetchMore, isPending, hasNextPage, isFetchingNextPage } =
    usePagedList({
      queryKey: ['search-anime', keyword],
      enabled: !!keyword,
      fetchPage: page => searchAnime({ keyword, page, pageSize: PAGE_SIZE })
    });

  const sentinelRef = useInfiniteScroll(
    fetchMore,
    !hasNextPage || isFetchingNextPage
  );

  // 番剧详情页尚未实现，点击暂不跳转
  const navigate = useNavigate();
  const handleAnimeClick = (videoId: string, opts?: { fixed?: boolean }) => {
    if (videoId)
      navigate(`/anime/${videoId}`, {
        // 集数列表点的是具体集：明确想看该集，播放页跳过历史续播跳转
        state: opts?.fixed ? { fixed: true } : undefined
      });
  };

  if (!keyword) {
    return (
      <div className='flex flex-col items-center justify-center h-60 text-muted-foreground gap-2'>
        <p className='text-sm'>请输入关键词搜索</p>
      </div>
    );
  }

  // 首屏加载中：展示骨架屏
  if (isPending) {
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
    <div className='my-4 md:my-8'>
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
        {isFetchingNextPage && <AnimeSearchCardSkeleton />}
      </div>
      {/* 无限滚动哨兵：进入视口时加载下一页 */}
      <div
        ref={sentinelRef}
        aria-hidden
      />
    </div>
  );
};

export default Index;
