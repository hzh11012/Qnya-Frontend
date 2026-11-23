import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { IconAction } from '@/components/custom/icon-button';
import type { PlayDetail } from '@/apis/play';
import { AudioLines, ListEnd, ListStart, Loader2 } from 'lucide-react';

interface AnimeEpisodeProps {
  detail: PlayDetail;
  className?: string;
  onSelectVideo: (id: string) => void;
  /** 高亮的集，默认取 `detail.video.id`；放映室切集瞬间 detail 还是上一集，需显式传当前集 */
  currentVideoId?: string;
  /** 只读：放映室成员端不能选集 */
  readOnly?: boolean;
  /** 正在切换到的集（行首转圈），放映室用房主的切集请求 */
  pendingVideoId?: string;
  /** 标题行右侧、排序按钮之后的额外操作（放映室放「换一部」图标） */
  actions?: React.ReactNode;
  /**
   * 撑满父容器剩余高度（放映室播放列表）：父容器必须是 flex 列，
   * 卡片自己也是 flex 列，标题行固定、只有列表内部滚动
   */
  fill?: boolean;
}

const AnimeEpisode: React.FC<AnimeEpisodeProps> = ({
  detail,
  className,
  onSelectVideo,
  currentVideoId,
  readOnly = false,
  pendingVideoId,
  actions,
  fill = false
}) => {
  const { videoCount, video, videos } = detail;
  const currentId = currentVideoId ?? video.id;

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
  }, [currentId, sort]);

  return (
    <div
      className={cn(
        'bg-card overflow-hidden rounded-sm',
        fill && 'flex min-h-0 flex-col',
        className
      )}
    >
      <div className='relative flex flex-none items-center gap-1 px-4 py-3 text-sm text-foreground'>
        选集
        <span className='text-xs text-muted-foreground'>
          ({video.episode}/{videoCount})
        </span>
        <div className='absolute right-4 flex items-center gap-2'>
          <IconAction
            title={sort === 'asc' ? '倒序排列' : '正序排列'}
            onClick={() => setSort(pre => (pre === 'asc' ? 'desc' : 'asc'))}
          >
            {sort === 'asc' ? <ListEnd size={22} /> : <ListStart size={22} />}
          </IconAction>
          {actions}
        </div>
      </div>
      <div
        ref={containerRef}
        className={cn(
          'overflow-auto outline-none',
          // 撑满模式下由父级 flex 决定高度；默认给固定上限，
          // 播放页侧栏下方还有系列/推荐，不能让它无限长
          fill ? 'min-h-0 flex-1' : 'max-h-55'
        )}
      >
        {list.map(item => {
          const isCurrent = item.id === currentId;
          const pending = item.id === pendingVideoId;
          return (
            <div
              key={item.id}
              ref={isCurrent ? currentEpisodeRef : undefined}
              className={cn(
                'flex items-center px-4 h-10 text-foreground text-sm',
                'transition-colors duration-200',
                !readOnly &&
                  'cursor-pointer hover:bg-primary/20 hover:text-primary',
                {
                  'text-primary bg-primary/20': isCurrent
                }
              )}
              title={item.title}
              onClick={readOnly ? undefined : () => onSelectVideo(item.id)}
            >
              {pending ? (
                <Loader2
                  className='mr-2 animate-spin'
                  size={14}
                />
              ) : (
                isCurrent && (
                  <AudioLines
                    className='mr-2'
                    size={14}
                  />
                )
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
