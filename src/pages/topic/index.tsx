import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import Exception from '@/components/custom/exception';
import PageTitle from '@/components/custom/page-title';
import { Skeleton } from '@/components/ui/skeleton';
import { getTopicList } from '@/apis/topic';
import type { TopicItem } from '@/apis/topic';

const PAGE_SIZE = 20;

/** 专题卡片网格：2→3→4→5 随宽度平滑过渡 */
const TOPIC_GRID_CLASS =
  'grid grid-cols-2 gap-x-4 gap-y-6 text-sm md:gap-x-6 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';

const TopicCardSkeleton: React.FC = () => {
  return (
    <div className='w-full flex flex-col gap-2'>
      <Skeleton className='rounded-sm aspect-[16/9] w-full' />
      <Skeleton className='w-2/3 h-4 rounded-sm' />
      <Skeleton className='w-full h-3 rounded-sm' />
    </div>
  );
};

TopicCardSkeleton.displayName = 'TopicCardSkeleton';

interface TopicCardProps {
  topic: TopicItem;
  onClick: (id: string) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, onClick }) => {
  const { id, name, description, cover, animeCount } = topic;

  return (
    <div
      className='w-full flex flex-col gap-2 cursor-pointer'
      onClick={() => onClick(id)}
    >
      <div className='relative rounded-sm aspect-[16/9] overflow-hidden transition-transform duration-200 hover:scale-105'>
        <div
          className='absolute inset-0 bg-muted bg-cover bg-center'
          style={cover ? { backgroundImage: `url("${cover}")` } : undefined}
        />
        <div className='absolute inset-x-0 -bottom-0.5 h-10 bg-card-cover' />
        <div className='absolute bottom-1.5 right-2 text-white text-xs'>
          {animeCount} 个动漫
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

TopicCard.displayName = 'TopicCard';

const Index = () => {
  const navigate = useNavigate();

  const query = useInfiniteQuery({
    queryKey: ['topic-list'],
    queryFn: ({ pageParam }) =>
      getTopicList({ page: pageParam, pageSize: PAGE_SIZE }),
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

  const handleTopicClick = (id: string) => {
    if (id) navigate(`/topic/${id}`);
  };

  const fetchMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  };

  if (query.isPending) {
    return (
      <div className='my-4 md:my-8'>
        <PageTitle className='mb-3 md:mb-4'>专题推荐</PageTitle>
        <div className={TOPIC_GRID_CLASS}>
          {Array.from({ length: 10 }, (_, index) => (
            <TopicCardSkeleton key={index} />
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
      <PageTitle className='mb-3 md:mb-4'>专题推荐</PageTitle>
      <InfiniteScroll
        // 组件默认给容器加内联 overflow: auto，避免撑出多余滚动条
        style={{ overflow: 'visible' }}
        dataLength={list.length}
        next={fetchMore}
        hasMore={!!query.hasNextPage}
        loader={''}
      >
        <div className={TOPIC_GRID_CLASS}>
          {list.map(item => (
            <TopicCard
              key={item.id}
              topic={item}
              onClick={handleTopicClick}
            />
          ))}
          {query.isFetchingNextPage && <TopicCardSkeleton />}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default Index;
