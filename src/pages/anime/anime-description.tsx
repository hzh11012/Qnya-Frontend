import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatScore } from '@/lib/anime';
import type { PlayDetail } from '@/apis/play';
import { ChevronDown, Heart, PlayCircle } from 'lucide-react';
import AnimeRating, { type RatingFormValues } from '@/pages/anime/anime-rating';

/** 播放页状态文案：连载中/已完结带前缀，与列表页的简洁版区分 */
const getRemark = (item: { status: string; videoCount: number }) => {
  if (!item.videoCount) return '即将开播';
  return item.status === 'completed'
    ? `已完结，全${item.videoCount}话`
    : `连载中，更新至第${item.videoCount}话`;
};

interface AnimeDescriptionProps {
  detail: PlayDetail;
  isCollected: boolean;
  isRating: boolean;
  onCollected: () => void;
  ratingLoading: boolean;
  onRating: (values: RatingFormValues, cb: () => void) => void;
  className?: string;
}

const AnimeDescription: React.FC<AnimeDescriptionProps> = ({
  detail,
  className,
  isCollected,
  isRating,
  onCollected,
  ratingLoading,
  onRating
}) => {
  const [open, setOpen] = useState(false);

  const { name, description, avgScore, playCount, collectionCount } = detail;

  const score = (
    <span
      className='text-orange-400 md:cursor-pointer'
      title='动漫评分'
    >
      {formatScore(avgScore)}
    </span>
  );

  return (
    <div className={cn('relative', className)}>
      <div className='flex items-center justify-between leading-none'>
        <div
          className='line-clamp-1 text-foreground text-base'
          title={name}
        >
          {name}
        </div>
        <Button
          variant={isCollected ? 'outline' : 'default'}
          className={cn('w-22 h-8', {
            'bg-card border-none': isCollected
          })}
          onClick={onCollected}
        >
          <Heart />
          {isCollected ? '已追番' : '追番'}
        </Button>
      </div>
      <div className='text-xs leading-none mt-1.5 text-card-foreground'>
        {getRemark(detail)}
      </div>
      <div className='flex items-center text-xs mt-2 gap-3 text-card-foreground'>
        <div className='flex items-center gap-1'>
          <PlayCircle size={12} />
          <span>{playCount}</span>
        </div>
        <div className='flex items-center gap-1'>
          <Heart size={12} />
          <span>{collectionCount}</span>
        </div>
        {!isRating ? (
          <AnimeRating
            onSubmit={onRating}
            loading={ratingLoading}
          >
            {score}
          </AnimeRating>
        ) : (
          score
        )}
        <div
          className='absolute right-0 flex items-center gap-1 select-none cursor-pointer hover:text-primary'
          onClick={() => setOpen(!open)}
        >
          {open ? '收起' : '展开'}
          <ChevronDown
            size={14}
            data-open={open}
            className={cn(
              'transition-[rotate] data-[open=true]:rotate-180 duration-200'
            )}
          />
        </div>
      </div>
      <div
        className={cn(
          'line-clamp-2 text-xs mt-2 text-muted-foreground',
          'data-[open=true]:line-clamp-none'
        )}
        data-open={open}
      >
        {description}
      </div>
    </div>
  );
};

export default AnimeDescription;
