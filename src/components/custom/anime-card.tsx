import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import FailAvatar from '@/components/custom/fail-avatar';
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
          // 移动端 grid 列宽可能超过上限，放开以保证撑满
          'max-w-56.25 max-md:max-w-none': type === 'vertical',
          'max-w-80 max-md:max-w-none': type === 'horizontal'
        },
        className
      )}
    >
      <Skeleton
        className={cn('relative rounded-sm', {
          'aspect-3/4': type === 'vertical',
          'aspect-video': type === 'horizontal'
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
  /** 标题右侧操作区（如删除按钮） */
  action?: React.ReactNode;
  onClick?: () => void;
}

const AnimeCard: React.FC<AnimeCardProps> = ({
  type = 'vertical',
  title,
  image,
  remark,
  time,
  tip,
  action,
  className,
  onClick
}) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn(
        'w-full',
        {
          // 移动端 grid 列宽可能超过上限，放开以保证撑满
          'max-w-56.25 max-md:max-w-none': type === 'vertical',
          'max-w-80 max-md:max-w-none': type === 'horizontal'
        },
        className
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-sm bg-card transition-[scale] duration-200 md:cursor-pointer md:hover:scale-105',
          {
            'aspect-3/4': type === 'vertical',
            'aspect-video': type === 'horizontal'
          }
        )}
        onClick={onClick}
      >
        {!image || failed ? (
          <FailAvatar className='absolute inset-0' />
        ) : (
          <>
            {/* 加载中占位：骨架屏脉冲，图片在上层淡入盖住 */}
            {!loaded && <Skeleton className='absolute inset-0 size-full' />}
            <img
              src={image}
              alt=''
              loading='lazy'
              draggable={false}
              onError={() => setFailed(true)}
              onLoad={() => setLoaded(true)}
              className={cn(
                'absolute inset-0 size-full object-cover transition-[opacity] duration-200',
                loaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          </>
        )}
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
      <div className='mt-2.5 flex w-full items-center gap-1'>
        <div
          className='line-clamp-1 min-w-0 flex-1 cursor-pointer text-sm transition-[color] duration-200 hover:text-primary'
          title={title}
          onClick={onClick}
        >
          {title}
        </div>
        {action}
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
