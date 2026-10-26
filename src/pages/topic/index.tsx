import { useNavigate } from 'react-router-dom';
import Exception from '@/components/custom/exception';
import PageTitle from '@/components/custom/page-title';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { usePagedList } from '@/hooks/use-paged-list';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { Skeleton } from '@/components/ui/skeleton';
import { getTopicList } from '@/apis/topic';
import type { TopicItem } from '@/apis/topic';
import CoverImage from '@/components/custom/cover-image';

const PAGE_SIZE = 20;

/** 专题卡片网格：2→3→4→5 随宽度平滑过渡 */
const TOPIC_GRID_CLASS =
  'grid grid-cols-2 gap-x-4 gap-y-6 text-sm md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';

const TopicCardSkeleton: React.FC = () => {
  return (
    <div className='w-full flex flex-col gap-2'>
      <Skeleton className='rounded-sm aspect-video w-full' />
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
      <div className='relative rounded-sm aspect-video overflow-hidden transition-[scale] duration-200 md:hover:scale-105'>
        <CoverImage
          src={cover}
          className='absolute inset-0'
          imageClassName='md:transition-[opacity]'
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
  useDocumentTitle('专题推荐');

  const { list, fetchMore, isPending, hasNextPage, isFetchingNextPage } =
    usePagedList({
      queryKey: ['topic-list'],
      fetchPage: page => getTopicList({ page, pageSize: PAGE_SIZE })
    });

  const sentinelRef = useInfiniteScroll(
    fetchMore,
    !hasNextPage || isFetchingNextPage
  );

  const handleTopicClick = (id: string) => {
    if (id) navigate(`/topic/${id}`);
  };

  if (isPending) {
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
      <div className={TOPIC_GRID_CLASS}>
        {list.map(item => (
          <TopicCard
            key={item.id}
            topic={item}
            onClick={handleTopicClick}
          />
        ))}
        {isFetchingNextPage && <TopicCardSkeleton />}
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
