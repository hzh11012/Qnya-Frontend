import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Loader2, Search } from 'lucide-react';
import CoverImage from '@/components/custom/cover-image';
import IconButton from '@/components/custom/icon-button';
import { PLAY_SIDEBAR_HEADER_CLASS } from '@/components/custom/play-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getClientList, type ClientAnimeItem } from '@/apis/anime';
import { searchAnime, type SearchAnimeItem } from '@/apis/search';
import { usePagedList } from '@/hooks/use-paged-list';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { formatScore } from '@/lib/anime';
import { typeLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';

interface AnimePickerProps {
  /** 返回键：交还给侧栏原来的 tab 内容 */
  onClose: () => void;
  /** 选中某部番（默认第 1 话，没有第 1 话就取第一集） */
  onPick: (videoId: string) => void;
  /** 正在放映的番：列表里标成「正在放映」并禁点 */
  currentAnimeId?: string;
}

/** 搜索结果与热门列表字段一致，只差搜索多带一个高亮串 */
type PickableAnime = ClientAnimeItem | SearchAnimeItem;

const PAGE_SIZE = 20;

/** 「大家都在看」按播放量排，与建房页的「最多播放」同一个口径 */
const HOT_SORT = 3;

/** 默认从第 1 话开始；没有第 1 话就退而取第一集 */
const firstVideoOf = (anime: PickableAnime) =>
  anime.videos.find(video => video.episode === 1) ?? anime.videos[0] ?? null;

/** 番名：搜索结果的 highlightName 是后端拼好的 HTML（只含 <em class="keyword">），其余走纯文本 */
const AnimeName: React.FC<{ anime: PickableAnime }> = ({ anime }) =>
  'highlightName' in anime && anime.highlightName ? (
    <span dangerouslySetInnerHTML={{ __html: anime.highlightName }} />
  ) : (
    <span>{anime.name}</span>
  );

/** 骨架行：海报 + 三行文字，加载时不跳版 */
const RowSkeleton: React.FC = () => (
  <div className='flex gap-3 border-b border-border/60 py-3'>
    <div className='aspect-3/4 w-24 flex-none animate-pulse rounded-sm bg-foreground/10' />
    <div className='flex min-w-0 flex-1 flex-col gap-2 py-0.5'>
      <div className='h-3.5 w-3/4 animate-pulse rounded-sm bg-foreground/10' />
      <div className='h-3 w-1/2 animate-pulse rounded-sm bg-foreground/10' />
      <div className='h-3 w-1/3 animate-pulse rounded-sm bg-foreground/10' />
    </div>
  </div>
);

/**
 * 「换一部」面板：直接顶掉侧栏原来的内容（不是浮层），
 * 顶部「‹ + 想看点什么？」/ 搜索框 + 搜索按钮 / 大家都在看 + 列表 + 行内换片按钮。
 */
const AnimePicker: React.FC<AnimePickerProps> = ({
  onClose,
  onPick,
  currentAnimeId
}) => {
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 挂载即聚焦，打开就能直接打字
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 只有回车或点「搜索」才提交关键词：边打边搜会为每个中间态各发一次请求，
  // 且翻页游标与旧关键词错位
  const submit = () => setApplied(keyword.trim());

  const {
    list,
    fetchMore,
    isPending,
    isFetchingNextPage,
    isPlaceholderData,
    hasNextPage,
    data
  } = usePagedList<PickableAnime>({
    queryKey: ['watch-room-picker', applied],
    keepPrevious: true,
    fetchPage: async page =>
      applied
        ? await searchAnime({ keyword: applied, page, pageSize: PAGE_SIZE })
        : await getClientList({ page, pageSize: PAGE_SIZE, sort: HOT_SORT })
  });

  const total = data?.pages[0]?.total ?? 0;

  // 占位数据还在时不要触发翻页：那一页的页码是按旧关键词算的
  const sentinelRef = useInfiniteScroll(
    fetchMore,
    !hasNextPage || isFetchingNextPage || isPlaceholderData
  );

  const pick = (anime: PickableAnime) => {
    const video = firstVideoOf(anime);
    if (!video) return;
    onPick(video.id);
  };

  return (
    <div className='flex min-h-0 flex-1 flex-col bg-background'>
      {/* 顶部：返回 + 标题（右侧留同宽占位，标题才真的居中）。
          header 行沿用侧栏 header 的高度与内距，切过来标题不会跳；
          返回键就是播放页「后退」那颗，不自配色 */}
      <div className={PLAY_SIDEBAR_HEADER_CLASS}>
        <IconButton
          title='返回'
          aria-label='返回'
          onClick={onClose}
        >
          <ChevronLeft size={18} />
        </IconButton>
        <p className='flex-1 text-center text-base'>想看点什么？</p>
        <span className='size-8' />
      </div>

      {/* 搜索行：输入框 + 主色搜索按钮。横向内距与侧栏内容区同为 px-5 */}
      <div className='flex flex-none items-center gap-2 px-5 py-3'>
        <Input
          ref={inputRef}
          value={keyword}
          maxLength={100}
          placeholder='有什么想看的？'
          className='h-9'
          onChange={event => setKeyword(event.target.value)}
          onKeyDown={event => {
            // 中文输入法选词时也会发 Enter，不能当成提交
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'Enter') {
              submit();
              // 收起移动端键盘，列表才露得出来
              event.currentTarget.blur();
            }
          }}
        />
        <Button
          className='h-9 gap-1 px-3'
          onClick={submit}
        >
          <Search className='size-4' />
          搜索
        </Button>
      </div>

      <p className='flex flex-none items-center gap-1.5 px-5 pb-2 text-xs text-muted-foreground'>
        {applied ? `共找到 ${total} 个相关作品` : '大家都在看'}
        {(isPending || isPlaceholderData) && (
          <Loader2 className='size-3 animate-spin' />
        )}
      </p>

      {/* 列表横向内距与侧栏其它内容一致（px-5）：切过来行宽不跳 */}
      <div className='min-h-0 flex-1 overflow-y-auto px-5 pb-4'>
        {isPending ? (
          Array.from({ length: 6 }, (_, index) => <RowSkeleton key={index} />)
        ) : !list.length ? (
          <div className='flex min-h-40 flex-col items-center justify-center gap-2 text-xs text-muted-foreground'>
            <p>没有找到「{applied}」</p>
            <button
              type='button'
              className='cursor-pointer text-primary hover:underline'
              onClick={() => {
                setKeyword('');
                setApplied('');
              }}
            >
              看看大家都在看什么
            </button>
          </div>
        ) : (
          <div
            aria-busy={isPlaceholderData}
            className={cn(
              'transition-opacity duration-150',
              isPlaceholderData && 'pointer-events-none opacity-50'
            )}
          >
            {list.map(anime => {
              const video = firstVideoOf(anime);
              const playing = anime.id === currentAnimeId;
              return (
                <div
                  key={anime.id}
                  className='flex gap-3 border-b border-border/60 py-3 last:border-b-0'
                >
                  <CoverImage
                    src={anime.cover}
                    className='aspect-3/4 w-24 flex-none rounded-sm'
                  />
                  <div className='flex min-w-0 flex-1 flex-col'>
                    <p
                      className='line-clamp-2 text-sm leading-snug text-foreground'
                      title={anime.name}
                    >
                      <AnimeName anime={anime} />
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground'>
                      全{anime.videoCount}话 · {typeLabel(anime.type)}
                    </p>
                    <p className='mt-0.5 text-xs text-muted-foreground'>
                      {anime.avgScore
                        ? `${formatScore(anime.avgScore, true)} · ${anime.year}`
                        : `${anime.year} 年`}
                    </p>
                    <Button
                      variant='outline'
                      // 主色描边（参考图就是蓝色描边按钮），别用默认灰边
                      className='mt-auto h-7 w-fit rounded-sm border-primary/60 px-3 text-xs text-primary hover:bg-primary/10'
                      disabled={!video || playing}
                      onClick={() => pick(anime)}
                    >
                      {!video ? '暂无剧集' : playing ? '正在放映' : '立即换片'}
                    </Button>
                  </div>
                </div>
              );
            })}
            {isFetchingNextPage &&
              Array.from({ length: 2 }, (_, index) => (
                <RowSkeleton key={`skeleton-${index}`} />
              ))}
          </div>
        )}
        <div
          ref={sentinelRef}
          aria-hidden
        />
      </div>
    </div>
  );
};

export default AnimePicker;
