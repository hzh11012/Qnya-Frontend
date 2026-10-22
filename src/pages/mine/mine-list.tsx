import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useNavigate } from 'react-router-dom';
import { CircleXIcon, EllipsisVertical, Trash2 } from 'lucide-react';
import Exception from '@/components/custom/exception';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AnimeCard, AnimeCardSkeleton } from '@/components/custom/anime-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  clearMyHistories,
  deleteMyHistory,
  getMyCollections,
  getMyHistories,
  type MineCollectionItem,
  type MineHistoryItem
} from '@/apis/mine';
import { formatProgress, formatDate } from '@/lib/format';
import { getStatusText } from '@/lib/anime';
import { usePagedList } from '@/hooks/use-paged-list';

/** 追番/历史分页大小（与其他列表页一致） */
const PAGE_SIZE = 20;

/** 追番网格（竖版卡）：列数梯度与首页推荐/猜你喜欢一致（标准断点） */
const COLLECTION_GRID_CLASS =
  'grid gap-4 grid-cols-3 text-sm md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7';

/** 历史网格（横向卡）：列数梯度与首页我的追番一致（标准断点） */
const HISTORY_GRID_CLASS =
  'grid gap-4 grid-cols-2 text-sm md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 按观看时间归入时间区块：今天 / 昨天 / 近一周 / 一周前 */
const historySectionOf = (watchedAt: Date | string) => {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const t = new Date(watchedAt).getTime();
  if (t >= startOfToday) return '今天';
  if (t >= startOfToday - DAY_MS) return '昨天';
  if (t >= startOfToday - 6 * DAY_MS) return '近一周';
  return '一周前';
};

const HISTORY_SECTION_ORDER = ['今天', '昨天', '近一周', '一周前'] as const;

/** 把已加载的列表按时间区块分组（保持原排序；同区块内连续，不会出现重复标题） */
const groupHistories = (list: MineHistoryItem[]) => {
  const groups = new Map<string, MineHistoryItem[]>();
  for (const item of list) {
    const label = historySectionOf(item.watchedAt);
    const bucket = groups.get(label);
    if (bucket) bucket.push(item);
    else groups.set(label, [item]);
  }
  return HISTORY_SECTION_ORDER.filter(label => groups.has(label)).map(
    label => ({ label, items: groups.get(label)! })
  );
};

/** 我的追番：垂直封面卡网格 */
export const MineCollection: React.FC = () => {
  const { list, fetchMore, isPending, isFetchingNextPage, hasNextPage } =
    usePagedList({
      queryKey: ['mine-collections'],
      // 覆盖全局 staleTime：播放页保存历史/追番后进入需拉取最新数据
      staleTime: 0,
      fetchPage: page => getMyCollections({ page, pageSize: PAGE_SIZE })
    });

  if (isPending) {
    return (
      <div className={COLLECTION_GRID_CLASS}>
        {Array.from({ length: 7 }, (_, i) => (
          <AnimeCardSkeleton
            key={i}
            type='vertical'
          />
        ))}
      </div>
    );
  }

  if (!list.length) return <Exception type='empty' />;

  return (
    <InfiniteScroll
      // 组件默认给容器加内联 overflow: auto，会撑出滚动条并裁剪 hover 放大的卡片，
      // 覆盖为 visible（style 会 merge 且在默认值之后，必定生效）
      style={{ overflow: 'visible' }}
      dataLength={list.length}
      next={fetchMore}
      hasMore={!!hasNextPage}
      loader={''}
    >
      <div className={COLLECTION_GRID_CLASS}>
        {list.map(item => (
          <CollectionCard
            key={item.animeId}
            item={item}
          />
        ))}
        {isFetchingNextPage && <AnimeCardSkeleton type='vertical' />}
      </div>
    </InfiniteScroll>
  );
};

const CollectionCard: React.FC<{ item: MineCollectionItem }> = ({ item }) => {
  const navigate = useNavigate();
  return (
    <AnimeCard
      type='vertical'
      title={item.name}
      image={item.cover}
      remark={item.remark || undefined}
      tip={getStatusText(item)}
      onClick={() => item.videoId && navigate(`/anime/${item.videoId}`)}
    />
  );
};

/** 历史搜索框：样式与顶部搜索框一致，无联想面板、不记搜索历史；回车才搜索。宽度由父级控制 */
export const MineHistorySearch: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSearch: (keyword: string) => void;
}> = ({ value, onChange, onSearch }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className='relative w-full'>
      <Input
        ref={inputRef}
        className={
          'h-9 bg-input border-transparent pr-7 pl-2.5 md:px-4 ' +
          'hover:bg-border focus-visible:bg-transparent!'
        }
        placeholder='搜索你的历史记录'
        value={value}
        maxLength={50}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSearch(value);
          }
        }}
      />
      {/* 清空按钮（与顶部搜索框一致） */}
      {value && (
        <CircleXIcon
          className='absolute inset-e-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-foreground/40 transition-[color] duration-200 hover:text-muted-foreground'
          size={14}
          aria-label='清空输入'
          onClick={() => {
            onSearch('');
            inputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
};

/** 历史记录：按时间区块分组的横向 banner 卡网格（仍无限滚动），keyword 由外部传入 */
export const MineHistory: React.FC<{ keyword: string }> = ({ keyword }) => {
  const { list, fetchMore, isPending, isFetchingNextPage, hasNextPage, data } =
    usePagedList({
      queryKey: ['mine-histories', keyword],
      // 覆盖全局 staleTime：播放页保存历史/追番后进入需拉取最新数据
      staleTime: 0,
      fetchPage: page =>
        getMyHistories({
          page,
          pageSize: PAGE_SIZE,
          keyword: keyword || undefined
        })
    });

  if (isPending) {
    return (
      <div className={HISTORY_GRID_CLASS}>
        {Array.from({ length: 5 }, (_, i) => (
          <AnimeCardSkeleton
            key={i}
            type='horizontal'
          />
        ))}
      </div>
    );
  }

  if (!list.length) return <Exception type='empty' />;

  const sections = groupHistories(list);
  const fetchingMore = isFetchingNextPage;
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div>
      {/* 搜索结果计数：仅搜索时展示，数字主题色高亮 */}
      {keyword && (
        <p className='mb-5 text-sm text-muted-foreground'>
          找到 <span className='font-medium text-primary'>{total}</span>{' '}
          个相关结果
        </p>
      )}
      <InfiniteScroll
        // 同上：覆盖内联 overflow，避免裁剪 hover 放大的卡片
        style={{ overflow: 'visible' }}
        dataLength={list.length}
        next={fetchMore}
        hasMore={!!hasNextPage}
        loader={''}
      >
        {sections.map((section, i) => (
          <section key={section.label}>
            {i === 0 ? (
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-sm font-bold text-foreground'>
                  {section.label}
                </h3>
                <ClearHistoriesButton />
              </div>
            ) : (
              <h3 className='mb-4 mt-8 text-sm font-bold text-foreground'>
                {section.label}
              </h3>
            )}
            <div className={HISTORY_GRID_CLASS}>
              {section.items.map(item => (
                <HistoryCard
                  key={`${item.animeId}-${item.videoId}`}
                  item={item}
                />
              ))}
              {fetchingMore && i === sections.length - 1 && (
                <AnimeCardSkeleton type='horizontal' />
              )}
            </div>
          </section>
        ))}
      </InfiniteScroll>
    </div>
  );
};

/** 清空历史记录：点击弹出二次确认框（与站内其他弹窗同款 Dialog），确认后才清空 */
const ClearHistoriesButton: React.FC = () => {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const clear = useMutation({
    mutationFn: clearMyHistories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mine-histories'] });
      setConfirmOpen(false);
    }
  });

  return (
    <Dialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
    >
      <DialogTrigger asChild>
        <button
          className='cursor-pointer text-xs text-muted-foreground transition-colors duration-200 select-none hover:text-primary disabled:opacity-50'
          disabled={clear.isPending}
        >
          清空历史记录
        </button>
      </DialogTrigger>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle className='sm:text-left'>清空历史记录？</DialogTitle>
          <DialogDescription>
            全部观看历史将被删除，此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex-row gap-2 sm:gap-2'>
          <Button
            variant='outline'
            className='h-9 flex-1'
            onClick={() => setConfirmOpen(false)}
          >
            取消
          </Button>
          <Button
            className='h-9 flex-1'
            disabled={clear.isPending}
            onClick={() => clear.mutate()}
          >
            清空
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const HistoryCard: React.FC<{ item: MineHistoryItem }> = ({ item }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: () => deleteMyHistory(item.animeId),
    // 删除后刷新所有关键字变体的历史列表
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['mine-histories'] })
  });

  return (
    <AnimeCard
      type='horizontal'
      title={item.name}
      image={item.banner}
      remark={
        item.episode
          ? `第${item.episode}话 ${item.videoTitle ?? ''}`.trim()
          : undefined
      }
      time={formatDate(item.watchedAt)}
      tip={item.time > 0 ? formatProgress(item.time) : undefined}
      action={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className='flex-none cursor-pointer rounded-sm p-1 text-muted-foreground transition-[color,background-color] duration-200 hover:bg-border hover:text-foreground'
              aria-label={`更多操作：《${item.name}》`}
              disabled={remove.isPending}
              onClick={e => e.stopPropagation()}
            >
              <EllipsisVertical size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-fit'
            align='end'
          >
            <DropdownMenuItem
              className='cursor-pointer text-foreground'
              onClick={() => remove.mutate()}
            >
              <Trash2 />
              删除记录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
      // 携带本卡记录的进度：跳过 detail 缓存（30s staleTime），保证续播到最新位置
      onClick={() =>
        item.videoId &&
        navigate(`/anime/${item.videoId}`, { state: { time: item.time } })
      }
    />
  );
};
