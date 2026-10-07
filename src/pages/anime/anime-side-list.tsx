import React from 'react';
import { cn } from '@/lib/utils';
import { getStatusText, formatScore } from '@/lib/anime';
import CoverImage from '@/components/custom/cover-image';
import type { PlayAnimeItem } from '@/apis/play';
import { Heart, PlayCircle } from 'lucide-react';

interface AnimeSideCardProps {
  item: PlayAnimeItem;
  showRating?: boolean;
  onAnimeClick: (videoId: string) => void;
}

/** 播放页侧栏卡片（系列 / 推荐）：横向布局 */
const AnimeSideCard: React.FC<AnimeSideCardProps> = ({
  item,
  showRating,
  onAnimeClick
}) => {
  return (
    <div
      className='flex w-full gap-3 px-5 py-2 cursor-pointer transition-colors duration-200 hover:bg-border'
      onClick={() => item.videoId && onAnimeClick(item.videoId)}
    >
      <CoverImage
        className='aspect-video w-35 flex-none rounded-sm object-cover'
        src={item.banner}
      />
      <div className='flex min-w-0 flex-1 flex-col justify-between'>
        <div
          className={cn(
            'text-sm text-foreground',
            showRating ? 'line-clamp-2' : 'line-clamp-1'
          )}
          title={item.name}
        >
          {item.name}
        </div>
        <div className='flex flex-col text-xs text-muted-foreground'>
          <div className='line-clamp-1'>{getStatusText(item)}</div>
          <div className='flex items-center gap-3'>
            <span className='flex items-center gap-1'>
              <PlayCircle size={12} />
              {item.playCount}
            </span>
            <span className='flex items-center gap-1'>
              <Heart size={12} />
              {item.collectionCount}
            </span>
          </div>
        </div>
      </div>
      {showRating && (
        <div className='flex items-start text-sm text-orange-400 ml-2.5'>
          {formatScore(item.avgScore, true)}
        </div>
      )}
    </div>
  );
};

interface AnimeSideListProps {
  title?: string;
  list: PlayAnimeItem[];
  showRating?: boolean;
  onAnimeClick: (videoId: string) => void;
  className?: string;
}

const AnimeSideList: React.FC<AnimeSideListProps> = ({
  title,
  list,
  showRating,
  onAnimeClick,
  className
}) => {
  if (!list?.length) return null;

  return (
    <div className={cn('select-none', className)}>
      {title && <div className='px-5 text-foreground my-1.5'>{title}</div>}
      <div className='flex flex-col flex-wrap'>
        {list.map(item => (
          <AnimeSideCard
            key={item.id}
            item={item}
            showRating={showRating}
            onAnimeClick={onAnimeClick}
          />
        ))}
      </div>
    </div>
  );
};

export default AnimeSideList;
