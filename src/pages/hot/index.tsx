import InfiniteScroll from 'react-infinite-scroll-component';
import { useNavigate } from 'react-router-dom';
import Exception from '@/components/custom/exception';
import PageTitle from '@/components/custom/page-title';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Skeleton } from '@/components/ui/skeleton';
import { getClientList } from '@/apis/anime';
import type { ClientAnimeItem } from '@/apis/anime';
import { usePagedList } from '@/hooks/use-paged-list';
import { getStatusText } from '@/lib/anime';
import CoverImage from '@/components/custom/cover-image';

const PAGE_SIZE = 20;

/** 热门卡片网格：2→3→4→5→6→7 随宽度平滑过渡 */
const HOT_GRID_CLASS =
  'grid grid-cols-3 gap-x-4 gap-y-6 text-sm md:grid-cols-4 md:gap-x-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7';

const HotCardSkeleton: React.FC = () => {
  return (
    <div className='w-full flex flex-col gap-2'>
      <Skeleton className='rounded-sm aspect-3/4 w-full' />
      <Skeleton className='w-3/4 h-4 rounded-sm' />
      <Skeleton className='w-full h-3 rounded-sm' />
    </div>
  );
};

HotCardSkeleton.displayName = 'HotCardSkeleton';

const HotCard: React.FC<{ item: ClientAnimeItem }> = ({ item }) => {
  const { name, cover, remark } = item;
  const navigate = useNavigate();

  return (
    <div className='w-full flex flex-col gap-2'>
      <div
        className='relative aspect-3/4 cursor-pointer overflow-hidden rounded-sm transition-[scale] duration-200 md:hover:scale-105'
        onClick={() => item.videoId && navigate(`/anime/${item.videoId}`)}
      >
        <CoverImage
          src={cover}
          className='absolute inset-0'
          imageClassName='md:transition-[opacity]'
        />
        <div className='absolute inset-x-0 -bottom-0.5 h-10 bg-card-cover' />
        <div className='absolute bottom-1.5 right-2 text-white text-xs'>
          {getStatusText(item)}
        </div>
      </div>
      <div
        className='line-clamp-1 w-fit cursor-pointer text-sm text-foreground transition-[color] duration-200 hover:text-primary'
        title={name}
        onClick={() => item.videoId && navigate(`/anime/${item.videoId}`)}
      >
        {name}
      </div>
      {remark && (
        <div
          className='line-clamp-1 w-fit cursor-pointer text-xs text-muted-foreground transition-[color] duration-200 hover:text-primary'
          title={remark}
          onClick={() => item.videoId && navigate(`/anime/${item.videoId}`)}
        >
          {remark}
        </div>
      )}
    </div>
  );
};

const Index = () => {
  useDocumentTitle('热门动漫排行');
  const { list, fetchMore, isPending, isFetchingNextPage, hasNextPage } =
    usePagedList({
      queryKey: ['hot-list'],
      // 热门 = 客户端列表的综合排序（贝叶斯加权 WR：均分为主、评分人数为权重）
      fetchPage: page => getClientList({ page, pageSize: PAGE_SIZE, sort: 1 })
    });

  if (isPending) {
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
    <div className='my-4 md:my-8'>
      <PageTitle className='mb-3 md:mb-4'>热门动漫排行</PageTitle>
      <InfiniteScroll
        // 组件默认给容器加内联 overflow: auto，会撑出滚动条并裁剪 hover 放大的卡片，
        // 覆盖为 visible（style 会 merge 且在默认值之后，必定生效）
        style={{ overflow: 'visible' }}
        dataLength={list.length}
        next={fetchMore}
        hasMore={!!hasNextPage}
        loader={''}
      >
        <div className={HOT_GRID_CLASS}>
          {list.map(item => (
            <HotCard
              key={item.id}
              item={item}
            />
          ))}
          {isFetchingNextPage && (
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
