import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AnimeCardSkeletonProps {
  type?: 'horizontal' | 'vertical';
  className?: string;
}

const AnimeCardSkeleton: React.FC<AnimeCardSkeletonProps> = ({
  type = 'vertical',
  className
}) => {
  return (
    <div
      className={cn(
        'w-full',
        {
          'max-w-[225px]': type === 'vertical',
          'max-w-[320px]': type === 'horizontal'
        },
        className
      )}
    >
      <Skeleton
        className={cn('relative rounded-sm', {
          'aspect-[3/4]': type === 'vertical',
          'aspect-[16/9]': type === 'horizontal'
        })}
      />
      <Skeleton className='relative mt-2.5 h-5 w-full rounded-sm md:w-3/4' />
      <Skeleton className='relative mt-1.5 h-4 w-3/4 rounded-sm md:w-1/2' />
    </div>
  );
};

AnimeCardSkeleton.displayName = 'AnimeCardSkeleton';

interface AnimeCardProps extends AnimeCardSkeletonProps {
  image: string;
  title: string;
  /** 标题下的补充说明（如第N话 集标题） */
  remark?: string;
  /** 封面左下角角标（如观看日期） */
  time?: string;
  /** 封面右下角角标（如状态/进度） */
  tip?: string;
  onClick?: () => void;
}

const AnimeCard: React.FC<AnimeCardProps> = ({
  type = 'vertical',
  title,
  image,
  remark,
  time,
  tip,
  className,
  onClick
}) => {
  return (
    <div
      className={cn(
        'w-full',
        {
          'max-w-[225px]': type === 'vertical',
          'max-w-[320px]': type === 'horizontal'
        },
        className
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-sm bg-cover bg-center duration-200',
          'md:cursor-pointer md:transition-[scale] md:hover:scale-105',
          {
            'aspect-[3/4]': type === 'vertical',
            'aspect-[16/9]': type === 'horizontal'
          }
        )}
        style={{ backgroundImage: `url("${image}")` }}
        onClick={onClick}
      >
        {time && (
          <div className='absolute bottom-1 left-2 z-2 text-xs text-white'>
            {time}
          </div>
        )}
        {tip && (
          <div className='absolute right-2 bottom-1 z-2 text-xs text-white'>
            {tip}
          </div>
        )}
        <div className='bg-card-cover absolute -bottom-0.5 z-1 h-10 w-full' />
      </div>
      <div
        className='mt-2.5 line-clamp-1 w-fit cursor-pointer text-sm transition-[color] duration-200 hover:text-primary'
        title={title}
        onClick={onClick}
      >
        {title}
      </div>
      {remark && (
        <div
          className='mt-1.5 line-clamp-1 w-fit cursor-pointer text-xs text-muted-foreground transition-[color] duration-200 hover:text-primary'
          title={remark}
          onClick={onClick}
        >
          {remark}
        </div>
      )}
    </div>
  );
};

AnimeCard.displayName = 'AnimeCard';

export { AnimeCard, AnimeCardSkeleton };
