import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { AnimeCard, AnimeCardSkeleton } from '@/components/custom/anime-card';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getHome } from '@/apis/home';
import type { HomeTypeRow } from '@/apis/home';
import { getGuessList } from '@/apis/anime';
import { usePagedList } from '@/hooks/use-paged-list';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { getStatusText } from '@/lib/anime';
import { formatProgress } from '@/lib/format';
import { cn } from '@/lib/utils';
import HomeHero from '@/pages/home/home-hero';

/** 类型行标题映射（后端只返回有数据的类型，adult 仅高级会员/管理员可见） */
const TYPE_TITLE: Record<HomeTypeRow['type'], string> = {
  movie: '剧场版推荐',
  japanese: '日番推荐',
  american: '美漫推荐',
  chinese: '国创推荐',
  adult: '里番推荐'
};

/** 类型内部枚举 → 筛选页数字码（与后端 TYPE_CODE 映射一致） */
const TYPE_CODE: Record<HomeTypeRow['type'], string> = {
  movie: '1',
  japanese: '2',
  american: '3',
  chinese: '4',
  adult: '5'
};

/** 追番行网格：横版卡片宽一档，列数比类型推荐少一（3/4/5/6），断点与猜你喜欢一致 */
const FOLLOW_GRID_CLASS =
  'grid grid-cols-2 justify-items-center gap-4 text-sm md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';

/** 类型推荐行网格：列数梯度与猜你喜欢（GUESS_GRID_CLASS）完全一致 */
const TYPE_GRID_CLASS =
  'grid grid-cols-3 justify-items-center gap-4 text-sm md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7';

/**
 * 首页单行卡片的降级显示：全程网格布局，列数随标准断点（md/lg/xl/2xl）增加、
 * 卡片随列宽拉伸；数据不足时保持固定列数（与「猜你喜欢」行为一致）。
 * 按 index 在各断点隐藏超出列数的尾部卡片，保证单行展示；
 * 移动端 grid 展示两行：类型行 3×2 取 6 张、追番行 2×2 取 4 张，多余的一张隐藏。
 * 隐藏阈值与 FOLLOW_GRID_CLASS/TYPE_GRID_CLASS 的列数断点一一对应。
 * 注意：完整类名必须字面量出现在源码中，否则 Tailwind 不会生成对应 CSS。
 */
const getResponsiveClasses = (
  index: number,
  type: 'horizontal' | 'vertical'
) => {
  const breakpoints =
    type === 'vertical'
      ? ([
          ['md:max-lg:hidden', 4],
          ['lg:max-xl:hidden', 5],
          ['xl:max-2xl:hidden', 6]
        ] as const)
      : ([
          ['md:max-lg:hidden', 3],
          ['lg:max-xl:hidden', 4],
          ['xl:max-2xl:hidden', 5]
        ] as const);

  const conditionalClasses = breakpoints
    .filter(([, threshold]) => index >= threshold)
    .map(([className]) => className);

  const mobileHidden =
    (type === 'vertical' && index === 6) ||
    (type === 'horizontal' && index === 4)
      ? 'max-md:hidden'
      : '';

  return cn(...conditionalClasses, mobileHidden);
};

/** 猜你喜欢：每页条数与网格列数（断点与热门页一致） */
const GUESS_PAGE_SIZE = 20;
const GUESS_GRID_CLASS =
  'grid grid-cols-3 justify-items-center gap-x-4 gap-y-6 text-sm md:grid-cols-4 md:gap-x-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7';

/** 猜你喜欢随机种子：每会话生成一次，同一会话内分页顺序稳定，刷新会话换一批 */
const getGuessSeed = () => {
  const key = 'guess-seed';
  let seed = sessionStorage.getItem(key);
  if (!seed) {
    seed = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(key, seed);
  }
  return seed;
};

/** 猜你喜欢：随机推荐列表，无限滚动加载，放在首页最底部 */
const GuessSection: React.FC = () => {
  const navigate = useNavigate();

  const { list, fetchMore, isPending, isFetchingNextPage, hasNextPage } =
    usePagedList({
      queryKey: ['guess-list'],
      fetchPage: page =>
        getGuessList({
          page,
          pageSize: GUESS_PAGE_SIZE,
          seed: getGuessSeed()
        })
    });

  const sentinelRef = useInfiniteScroll(
    fetchMore,
    !hasNextPage || isFetchingNextPage
  );

  // 首次加载：骨架屏
  if (isPending) {
    return (
      <HomeRow title='猜你喜欢'>
        <div className={GUESS_GRID_CLASS}>
          {Array.from({ length: 10 }, (_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      </HomeRow>
    );
  }

  // 无数据：整块隐藏
  if (!list.length) return null;

  return (
    <HomeRow title='猜你喜欢'>
      <div className={GUESS_GRID_CLASS}>
        {list.map(item => (
          <AnimeCard
            key={item.id}
            title={item.name}
            image={item.cover ?? ''}
            remark={item.remark}
            tip={getStatusText(item)}
            onClick={() => item.videoId && navigate(`/anime/${item.videoId}`)}
          />
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 5 }, (_, i) => (
            <AnimeCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>
      {/* 无限滚动哨兵：进入视口时加载下一页 */}
      <div
        ref={sentinelRef}
        aria-hidden
      />
    </HomeRow>
  );
};

/** 行容器：标题 + 可选的查看全部按钮 + 卡片列表 */
const HomeRow: React.FC<{
  title: string;
  showAll?: boolean;
  onAllClick?: () => void;
  children: ReactNode;
}> = ({ title, showAll, onAllClick, children }) => (
  <div className='select-none transition-[margin] duration-200'>
    <div className='mb-4 flex items-center justify-between'>
      <div className='text-base font-bold leading-9'>{title}</div>
      {showAll && (
        <Button
          variant='outline'
          className='gap-1'
          onClick={onAllClick}
        >
          查看全部
          <ChevronRight />
        </Button>
      )}
    </div>
    {children}
  </div>
);

/** 加载骨架：追番行（横版 5 卡）+ 三行类型推荐（竖版 7 卡） */
const HomeSkeleton: React.FC = () => (
  <div className='my-4 flex flex-col gap-6 md:my-8 md:gap-8'>
    {/* Hero 轮播占位（左文右图比例） */}
    <div className='flex flex-col gap-4 lg:flex-row lg:gap-6'>
      <Skeleton className='h-80 w-full rounded-sm sm:h-72 lg:h-96 lg:flex-1' />
      <Skeleton className='hidden h-80 rounded-sm lg:block lg:h-96 lg:w-[320px] xl:w-[360px]' />
    </div>
    <HomeRow
      title='我的追番'
      showAll
    >
      <div className={FOLLOW_GRID_CLASS}>
        {Array.from({ length: 6 }, (_, i) => (
          <AnimeCardSkeleton
            key={i}
            type='horizontal'
            className={getResponsiveClasses(i, 'horizontal')}
          />
        ))}
      </div>
    </HomeRow>
    {Array.from({ length: 3 }, (_, row) => (
      <HomeRow
        key={row}
        title='加载中'
      >
        <div className={TYPE_GRID_CLASS}>
          {Array.from({ length: 7 }, (_, i) => (
            <AnimeCardSkeleton
              key={i}
              type='vertical'
              className={getResponsiveClasses(i, 'vertical')}
            />
          ))}
        </div>
      </HomeRow>
    ))}
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  useDocumentTitle(null);
  const { data, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: getHome,
    // 覆盖全局 staleTime：播放页保存进度/追番后返回需拉取最新数据
    staleTime: 0
  });

  const handleAnimeClick = (videoId: string | null, time?: number | null) => {
    if (videoId)
      navigate(`/anime/${videoId}`, {
        // 携带追番进度：跳过播放详情 30s 缓存，保证续播到最新位置
        state: time && time > 1 ? { time } : undefined
      });
  };

  if (isLoading || !data) return <HomeSkeleton />;

  return (
    <div className='my-4 flex animate-fade-in flex-col gap-6 transition-[margin] duration-200 md:my-8 md:gap-8'>
      {/* 轮播 + 新番发现（后端未返回时组件内返回 null） */}
      <HomeHero
        banners={data.banners}
        picks={data.picks}
      />

      {/* 我的追番：仅登录且有追番数据时展示（后端未登录返回空数组） */}
      {data.collections.length > 0 && (
        <HomeRow
          title='我的追番'
          showAll
          onAllClick={() => navigate('/mine')}
        >
          <div className={FOLLOW_GRID_CLASS}>
            {data.collections.slice(0, 6).map((item, index) => (
              <AnimeCard
                key={item.animeId}
                type='horizontal'
                className={getResponsiveClasses(index, 'horizontal')}
                title={item.name}
                image={item.banner ?? ''}
                tip={getStatusText(item)}
                remark={
                  item.episode != null
                    ? `看到第${item.episode}话 ${formatProgress(item.time ?? 0)}`
                    : '尚未观看'
                }
                onClick={() => handleAnimeClick(item.videoId, item.time)}
              />
            ))}
          </div>
        </HomeRow>
      )}

      {/* 各类型推荐：后端已过滤无数据类型与无权限的 adult 类型 */}
      {data.animeTypes.map(row => (
        <HomeRow
          key={row.type}
          title={TYPE_TITLE[row.type]}
          showAll
          onAllClick={() => navigate(`/bangumi?type=${TYPE_CODE[row.type]}`)}
        >
          <div className={TYPE_GRID_CLASS}>
            {row.items.slice(0, 7).map((item, index) => (
              <AnimeCard
                key={item.animeId}
                className={getResponsiveClasses(index, 'vertical')}
                title={item.name}
                image={item.cover ?? ''}
                remark={item.remark ?? ''}
                tip={getStatusText(item)}
                onClick={() => handleAnimeClick(item.videoId)}
              />
            ))}
          </div>
        </HomeRow>
      ))}
      {/* 猜你喜欢：随机推荐 + 无限滚动，固定在页面最底部 */}
      <GuessSection />
    </div>
  );
};

export default Index;
