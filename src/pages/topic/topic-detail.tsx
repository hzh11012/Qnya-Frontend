import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import Exception from '@/components/custom/exception';
import PageTitle from '@/components/custom/page-title';
import {
  AnimeSearchCard,
  AnimeSearchCardSkeleton,
  ANIME_CARD_GRID_CLASS
} from '@/pages/search/anime-search-card';
import { getStatusText, getPlayText } from '@/lib/anime';
import { getTopicDetail } from '@/apis/topic';

// 超过该长度的描述在移动端默认收起
const COLLAPSE_THRESHOLD = 60;

/**
 * 专题描述：移动端默认两行截断，展开/收起按钮单独一行；桌面端始终展示全文
 */
const TopicDescription: React.FC<{ description: string }> = ({
  description
}) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > COLLAPSE_THRESHOLD;

  return (
    <div className='flex flex-col gap-1'>
      <p
        className={cn(
          'text-xs text-muted-foreground leading-5',
          !expanded && 'line-clamp-2 md:line-clamp-none'
        )}
        title={description}
      >
        {description}
      </p>
      {isLong && (
        <button
          type='button'
          className='self-end flex items-center gap-0.5 text-xs text-primary hover:text-primary/80 transition-[color] duration-200 md:hidden'
          onClick={() => setExpanded(value => !value)}
        >
          {expanded ? '收起' : '展开'}
          {expanded ? (
            <ChevronUp className='size-3' />
          ) : (
            <ChevronDown className='size-3' />
          )}
        </button>
      )}
    </div>
  );
};

const Index = () => {
  const { id } = useParams<{ id: string }>();

  const query = useQuery({
    queryKey: ['topic-detail', id],
    queryFn: () => getTopicDetail(id!),
    enabled: !!id
  });

  const detail = query.data;

  // 番剧详情页尚未实现，点击暂不跳转
  const navigate = useNavigate();
  const handleAnimeClick = (videoId: string) => {
    if (videoId) navigate(`/anime/${videoId}`);
  };

  if (query.isPending) {
    return (
      <div className={cn(ANIME_CARD_GRID_CLASS, 'my-4 md:my-8')}>
        {Array.from({ length: 4 }, (_, index) => (
          <AnimeSearchCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!detail) {
    return <Exception type='empty' />;
  }

  return (
    <div className='my-4 md:my-8 overflow-clip'>
      <div className='flex flex-col gap-1 mb-4 md:mb-6'>
        <PageTitle>{detail.name}</PageTitle>
        <TopicDescription description={detail.description} />
      </div>
      <div className={ANIME_CARD_GRID_CLASS}>
        {detail.anime.map(item => {
          return (
            <AnimeSearchCard
              key={item.id}
              videoId={item.videoId}
              image={item.cover}
              title={item.name}
              highlightTitle={item.name}
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
      </div>
    </div>
  );
};

export default Index;
