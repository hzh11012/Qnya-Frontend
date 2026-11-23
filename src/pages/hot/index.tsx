import PageTitle from '@/components/custom/page-title';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { AnimeCardSkeleton } from '@/components/custom/anime-card';
import AnimeListCard from '@/components/custom/anime-list-card';
import ListEmpty from '@/components/custom/list-empty';
import { getClientList, type ClientAnimeItem } from '@/apis/anime';
import { usePagedList } from '@/hooks/use-paged-list';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { ANIME_GRID } from '@/lib/layout';

const PAGE_SIZE = 20;

const Index = () => {
  useDocumentTitle('热门动漫排行');
  const { list, fetchMore, isPending, isFetchingNextPage, hasNextPage } =
    usePagedList<ClientAnimeItem>({
      queryKey: ['hot-list'],
      // 热门 = 客户端列表的综合排序（贝叶斯加权 WR：均分为主、评分人数为权重）
      fetchPage: page => getClientList({ page, pageSize: PAGE_SIZE, sort: 1 })
    });

  const sentinelRef = useInfiniteScroll(
    fetchMore,
    !hasNextPage || isFetchingNextPage
  );

  return (
    <div className='my-4 flex flex-1 flex-col md:my-8'>
      <PageTitle className='mb-3 md:mb-4'>热门动漫排行</PageTitle>

      {isPending ? (
        <div className={ANIME_GRID}>
          {Array.from({ length: 14 }, (_, index) => (
            <AnimeCardSkeleton key={index} />
          ))}
        </div>
      ) : !list.length ? (
        <ListEmpty />
      ) : (
        <>
          <div className={ANIME_GRID}>
            {list.map(item => (
              <AnimeListCard
                key={item.id}
                item={item}
              />
            ))}
            {isFetchingNextPage &&
              Array.from({ length: 4 }, (_, index) => (
                <AnimeCardSkeleton key={`skeleton-${index}`} />
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
  );
};

export default Index;
