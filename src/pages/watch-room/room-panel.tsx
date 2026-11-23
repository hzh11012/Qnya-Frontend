import React from 'react';
import { Clapperboard, Heart, PlayCircle, Star } from 'lucide-react';
import CoverImage from '@/components/custom/cover-image';
import { formatScore, getPlayStatusText } from '@/lib/anime';
import { typeLabel } from '@/lib/labels';

/** 侧栏展示所需的剧集信息（优先取播放详情，其次取房间快照） */
export interface NowPlayingInfo {
  cover: string;
  animeName: string;
  episode: number;
  /** 以下字段只有播放详情就绪时才有；房间快照回退时拿不到，按「第 N 话」兜底 */
  status?: string;
  type?: string;
  tags?: string[];
  description?: string;
  videoCount?: number;
  /** 评分（10 分制）、播放量与追番量，同样只有详情就绪时才有 */
  avgScore?: number;
  playCount?: number;
  collectionCount?: number;
}

interface NowPlayingProps {
  info: NowPlayingInfo | null;
}

/** 侧栏最多展示的标签数：再多会把这列撑高，完整标签去播放页看 */
const MAX_TAGS = 4;

/** 播放量压成「12.4万」，窄侧栏放不下六位数 */
const formatCount = (n: number) =>
  n >= 10000 ? `${(n / 10000).toFixed(1).replace(/\.0$/, '')}万` : `${n}`;

/**
 * 当前在放什么：大海报 + 番名 / 状态 / 类型与标签，简介压在海报下面。
 * 「正在放映」不再单独占一行标题，海报本身就是标题。
 */
const NowPlaying: React.FC<NowPlayingProps> = ({ info }) => {
  const hasScore = !!info?.avgScore;
  const hasPlay = !!info?.playCount;
  const hasCollect = !!info?.collectionCount;

  return (
    <div>
      <div className='flex items-stretch gap-3.5'>
        {info ? (
          <CoverImage
            src={info.cover}
            // 比例与站内其他封面一致（3:4），高度受侧栏这一行限制
            className='h-36 aspect-3/4 flex-none rounded-sm'
          />
        ) : (
          <div className='flex h-36 aspect-3/4 flex-none items-center justify-center rounded-sm border border-dashed text-muted-foreground'>
            <Clapperboard className='size-5' />
          </div>
        )}

        <div className='flex min-w-0 flex-1 flex-col'>
          {info ? (
            <>
              <p
                className='line-clamp-2 text-sm leading-snug font-medium'
                title={info.animeName}
              >
                {info.animeName}
              </p>
              {/* 类型与状态同一行：两段都短，各占一行会把这一列撑高 */}
              <div className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
                {info.type && (
                  <span className='rounded-sm border border-border px-1.5 py-0.5 text-[11px] leading-none'>
                    {typeLabel(info.type)}
                  </span>
                )}
                <span className='min-w-0 truncate'>
                  {info.status
                    ? getPlayStatusText({
                        status: info.status,
                        videoCount: info.videoCount ?? 0
                      })
                    : `第${info.episode}话`}
                </span>
              </div>

              {!!info.tags?.length && (
                <div className='mt-1.5 flex flex-wrap items-center gap-1'>
                  {info.tags.slice(0, MAX_TAGS).map(tag => (
                    <span
                      key={tag}
                      className='max-w-full truncate rounded-sm bg-card px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground'
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 数据行贴底：标题/状态/标签靠上，剩下的一格给播放量/追番量/评分 */}
              {(hasPlay || hasCollect || hasScore) && (
                <div className='mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1.5 text-[11px] text-muted-foreground'>
                  {hasPlay && (
                    <span
                      className='flex items-center gap-0.5'
                      title='播放量'
                    >
                      <PlayCircle className='size-3' />
                      {formatCount(info.playCount as number)}
                    </span>
                  )}
                  {hasCollect && (
                    <span
                      className='flex items-center gap-0.5'
                      title='追番量'
                    >
                      <Heart className='size-3' />
                      {formatCount(info.collectionCount as number)}
                    </span>
                  )}
                  {hasScore && (
                    <span
                      className='flex items-center gap-0.5 text-orange-400'
                      title='评分'
                    >
                      <Star className='size-3 fill-current' />
                      {formatScore(info.avgScore as number, true)}
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className='text-sm text-muted-foreground'>还没有选片</p>
          )}
        </div>
      </div>

      {info?.description && (
        <p
          className='mt-3 line-clamp-3 text-xs leading-relaxed whitespace-pre-line text-muted-foreground'
          title={info.description}
        >
          {info.description}
        </p>
      )}
    </div>
  );
};

export { NowPlaying };
