import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { typeLabel, monthLabel } from '@/lib/labels';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import CoverImage from '@/components/custom/cover-image';
import type { SearchAnimeItem } from '@/apis/search';

// 按钮宽度（size-8 = 32px）+ 间距（gap-2 = 8px），用于估算一行可容纳的剧集数
const EPISODE_ITEM_WIDTH = 40;

/**
 * 番剧卡片网格（搜索页/专题详情页共用）
 * 移动端两列，桌面端随宽度增加，≥1100px 切换单列大卡
 */
export const ANIME_CARD_GRID_CLASS =
  'grid grid-cols-2 gap-4 text-sm md:gap-6 max-[1100px]:grid-cols-1';

interface VideoEpisodeProps {
  list: SearchAnimeItem['videos'];
  onAnimeClick: (id: string) => void;
}

const VideoEpisode: React.FC<VideoEpisodeProps> = ({ list, onAnimeClick }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // 测量剧集按钮行可用宽度，超出时折叠为 [前几集, ..., 最后一集]
  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const episodes = useMemo(() => {
    if (!containerWidth || list.length === 0) return list;

    const count = Math.floor((containerWidth + 8) / EPISODE_ITEM_WIDTH);

    if (list.length <= count) return list;

    if (count < 3) return [];

    return [
      ...list.slice(0, count - 2),
      // 折叠中间的剧集，用省略号占位（id 为空串，点击被禁用）
      { id: '', episode: '...' as const },
      ...list.slice(-1)
    ];
  }, [list, containerWidth]);

  return (
    <div
      ref={listRef}
      className={cn('flex items-center flex-1 w-0 overflow-hidden gap-2')}
    >
      {episodes.map(item => {
        const { id, episode } = item;
        return (
          <Button
            key={id}
            variant='outline'
            className='size-8 shrink-0 p-0'
            disabled={id === ''}
            onClick={() => onAnimeClick(id)}
          >
            {episode}
          </Button>
        );
      })}
    </div>
  );
};

VideoEpisode.displayName = 'VideoEpisode';

interface AnimeSearchCardSkeletonProps {
  className?: string;
}

const AnimeSearchCardSkeleton: React.FC<AnimeSearchCardSkeletonProps> = memo(
  ({ className }) => {
    return (
      <div className={cn('w-full flex gap-2 md:gap-4', className)}>
        <Skeleton
          className={cn(
            'relative rounded-sm aspect-[3/4] shrink-0 w-37 2xl:w-48',
            'transition-[width] duration-200'
          )}
        />
        <div className={cn('flex-1 flex flex-col justify-between')}>
          <div className={cn('flex flex-col gap-2')}>
            <Skeleton className={cn('w-full md:w-3/4 h-5 rounded-sm')} />
            <Skeleton className={cn('w-3/4 md:w-1/2 h-3.5 rounded-sm')} />
            <Skeleton className={cn('w-full md:w-4/7 h-3.5 rounded-sm')} />
          </div>
          <div className={cn('flex flex-col gap-2')}>
            <Skeleton className={cn('w-1/6 h-4 rounded-sm')} />
            <Skeleton className={cn('w-3/4 md:w-1/2 h-8 rounded-sm')} />
          </div>
        </div>
      </div>
    );
  }
);

AnimeSearchCardSkeleton.displayName = 'AnimeSearchCardSkeleton';

interface AnimeSearchCardProps extends AnimeSearchCardSkeletonProps {
  videoId: SearchAnimeItem['videoId'];
  image: string;
  title: string;
  highlightTitle: string;
  type: string;
  tags: string[];
  year: number;
  month: string;
  statusText: string;
  playText: string;
  director: string;
  cv: string;
  description: string;
  scoreCount: number;
  avgScore: number;
  videos: SearchAnimeItem['videos'];
  onAnimeClick: (id: string) => void;
}

const AnimeSearchCard: React.FC<AnimeSearchCardProps> = memo(
  ({
    videoId = null,
    image,
    title,
    highlightTitle,
    type,
    tags,
    year,
    month,
    statusText,
    playText,
    director,
    cv,
    description,
    scoreCount,
    avgScore,
    videos,
    className,
    onAnimeClick
  }) => {
    return (
      <div className={cn('w-full flex gap-2 md:gap-4', className)}>
        <div
          className={cn(
            'relative shrink-0 aspect-[3/4] overflow-hidden',
            'md:cursor-pointer w-37 2xl:w-48',
            'transition-[width] duration-200'
          )}
          onClick={() => videoId && onAnimeClick(videoId)}
        >
          <CoverImage
            src={image}
            className='absolute inset-0'
          />
          <div
            className={cn(
              'absolute top-3 right-0 text-white text-xs bg-primary pl-2 pr-1.5 py-0.5 rounded-l-lg'
            )}
          >
            {typeLabel(type)}
          </div>
        </div>
        <div className={cn('flex-1 flex flex-col justify-between')}>
          <div className={cn('flex flex-col text-xs tracking-wide gap-1')}>
            <div
              className={cn(
                'text-base text-foreground line-clamp-1 md:cursor-pointer',
                'hover:text-primary',
                'transition-[color] duration-200'
              )}
              title={title}
              onClick={() => videoId && onAnimeClick(videoId)}
              dangerouslySetInnerHTML={{
                __html: highlightTitle
              }}
            ></div>
            <div
              className={cn('text-card-foreground line-clamp-1')}
              title={`${tags.join('/')} · ${year} · ${monthLabel(month)} · ${statusText}`}
            >
              {tags.join('/')} · {year} · {monthLabel(month)} · {statusText}
            </div>
            <div
              className={cn('text-card-foreground line-clamp-1')}
              title={`导演：${director}；声优：${cv}`}
            >
              导演：{director}；声优：{cv}
            </div>
            <div
              className={cn('text-muted-foreground line-clamp-3')}
              title={description}
            >
              简介：{description}
            </div>
          </div>
          <div className={cn('flex flex-col text-xs tracking-wide gap-2')}>
            {!!scoreCount && (
              <div className={cn('flex items-end')}>
                <span className={cn('mr-2 text-card-foreground')}>
                  {scoreCount}人评分
                </span>
                <span
                  className={cn(
                    'text-orange-400 text-xl leading-none font-bold'
                  )}
                >
                  {avgScore.toFixed(1)}
                </span>
                <span className={cn('text-orange-400 font-bold')}>分</span>
              </div>
            )}
            <div className={cn('flex gap-2')}>
              <Button
                variant='default'
                className={cn('w-22 h-8')}
                disabled={!videoId}
                onClick={() => videoId && onAnimeClick(videoId)}
              >
                {playText}
              </Button>
              <VideoEpisode
                list={videos}
                onAnimeClick={onAnimeClick}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AnimeSearchCard.displayName = 'AnimeSearchCard';

export { AnimeSearchCard, AnimeSearchCardSkeleton };
