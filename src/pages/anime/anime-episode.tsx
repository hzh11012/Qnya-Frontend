import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { PlayDetail } from '@/apis/play';
import { AudioLines, ListEnd, ListStart } from 'lucide-react';

interface AnimeEpisodeProps {
  detail: PlayDetail;
  className?: string;
  onSelectVideo: (id: string) => void;
}

const AnimeEpisode: React.FC<AnimeEpisodeProps> = ({
  detail,
  className,
  onSelectVideo
}) => {
  const { videoCount, video, videos } = detail;

  const containerRef = useRef<HTMLDivElement>(null);
  // 当前选中集数
  const currentEpisodeRef = useRef<HTMLDivElement>(null);

  const [sort, setSort] = useState<'asc' | 'desc'>('asc');

  const list = [...videos].sort((a, b) =>
    sort === 'asc' ? a.episode - b.episode : b.episode - a.episode
  );

  // 滚动到当前集数
  useEffect(() => {
    const item = currentEpisodeRef.current;
    const container = containerRef.current;
    if (item && container) {
      const offset =
        item.getBoundingClientRect().top -
        container.getBoundingClientRect().top;
      container.scrollTop +=
        offset - container.clientHeight / 2 + item.clientHeight / 2;
    }
  }, [video.url, sort]);

  return (
    <div className={cn('bg-card rounded-sm overflow-hidden', className)}>
      <div className='relative flex items-center text-sm text-foreground gap-1 py-3 px-4'>
        选集
        <span className='text-xs text-muted-foreground'>
          ({video.episode}/{videoCount})
        </span>
        <div
          className='absolute right-4 cursor-pointer transition-colors duration-200 hover:text-primary'
          onClick={() => setSort(pre => (pre === 'asc' ? 'desc' : 'asc'))}
        >
          {sort === 'asc' ? <ListEnd size={22} /> : <ListStart size={22} />}
        </div>
      </div>
      <div
        ref={containerRef}
        className='max-h-[13.75rem] overflow-auto outline-none'
      >
        {list.map(item => {
          const isCurrent = item.episode === video.episode;
          return (
            <div
              key={item.id}
              ref={isCurrent ? currentEpisodeRef : undefined}
              className={cn(
                'flex items-center px-4 h-10 text-foreground text-sm cursor-pointer',
                'transition-colors duration-200 hover:bg-primary/20 hover:text-primary',
                {
                  'text-primary bg-primary/20': isCurrent
                }
              )}
              title={item.title}
              onClick={() => onSelectVideo(item.id)}
            >
              {isCurrent && (
                <AudioLines
                  className='mr-2'
                  size={14}
                />
              )}
              <span className='line-clamp-1'>
                第{item.episode}话 {item.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnimeEpisode;
