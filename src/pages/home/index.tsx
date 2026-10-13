import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { AnimeCard, AnimeCardSkeleton } from '@/components/custom/anime-card';
import { Button } from '@/components/ui/button';
import { getHome } from '@/apis/home';
import type { HomeTypeRow } from '@/apis/home';
import { getGuessList } from '@/apis/anime';
import { usePagedList } from '@/hooks/use-paged-list';
import { getStatusText } from '@/lib/anime';
import { formatProgress } from '@/lib/format';
import { cn } from '@/lib/utils';

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

/**
 * 首页单行卡片的降级显示：桌面 flex 一行排开（均分宽度），按 index
 * 在窄断点隐藏尾部卡片；移动端 grid 固定列数只显示前 N 个。
 * 断点与「我的追番」列表网格一致（855/1100/1300/1500）。
 * 注意：完整类名必须字面量出现在源码中，否则 Tailwind 不会生成对应 CSS。
 */
const getResponsiveClasses = (
  index: number,
  type: 'horizontal' | 'vertical'
) => {
  // 桌面 flex 行的隐藏阈值（全部限定在 md 以上区间，移动端 grid 不受影响）
  const breakpoints =
    type === 'vertical'
      ? ([
          ['min-[768px]:max-[855px]:hidden', 3],
          ['min-[768px]:max-[1100px]:hidden', 4],
          ['min-[768px]:max-[1300px]:hidden', 5],
          ['min-[768px]:max-[1500px]:hidden', 6]
        ] as const)
      : ([
          ['min-[768px]:max-[855px]:hidden', 2],
          ['min-[768px]:max-[1140px]:hidden', 3],
          ['min-[768px]:max-[1500px]:hidden', 4]
        ] as const);

  const conditionalClasses = breakpoints
    .filter(([, threshold]) => index >= threshold)
    .map(([className]) => className);

  // 移动端 grid 展示两行：类型行 3×2 取 6 张、追番行 2×2 取 4 张，多余的一张隐藏
  const mobileHidden =
    (type === 'vertical' && index === 6) ||
    (type === 'horizontal' && index === 4)
      ? 'max-md:hidden'
      : '';

  // 768-855px：grid 刚切到 flex、可见卡片少，均分伸展撑满整行（与相邻 grid 行为衔接）
  return cn(
    ...conditionalClasses,
    mobileHidden,
    'min-[768px]:max-[855px]:flex-1 min-[768px]:max-[855px]:max-w-none'
  );
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
      <InfiniteScroll
        // 组件默认给容器加内联 overflow: auto，避免撑出多余滚动条
        style={{ overflow: 'visible' }}
        dataLength={list.length}
        next={fetchMore}
        hasMore={!!hasNextPage}
        loader={''}
      >
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
      </InfiniteScroll>
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
    <HomeRow
      title='我的追番'
      showAll
    >
      <div className='grid grid-cols-2 gap-4 text-sm md:flex md:items-center md:gap-6'>
        {Array.from({ length: 5 }, (_, i) => (
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
        <div className='grid grid-cols-3 gap-4 text-sm md:flex md:items-center md:gap-6'>
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
  const { data, isLoading } = useQuery({
    queryKey: ['home'],
    queryFn: getHome,
    staleTime: 30_000
  });

  const handleAnimeClick = (videoId: string | null) => {
    if (videoId) navigate(`/anime/${videoId}`);
  };

  if (isLoading || !data) return <HomeSkeleton />;

  return (
    <div className='my-4 flex flex-col gap-6 transition-[margin] duration-200 md:my-8 md:gap-8'>
      {/* 我的追番：仅登录且有追番数据时展示（后端未登录返回空数组） */}
      {data.collections.length > 0 && (
        <HomeRow
          title='我的追番'
          showAll
          onAllClick={() => navigate('/mine')}
        >
          <div className='grid grid-cols-2 gap-4 text-sm md:flex md:items-center md:gap-6'>
            {data.collections.map((item, index) => (
              <AnimeCard
                key={item.animeId}
                type='horizontal'
                className={getResponsiveClasses(index, 'horizontal')}
                title={item.name}
                image={item.cover ?? ''}
                tip={getStatusText(item)}
                remark={
                  item.episode
                    ? `看到第${item.episode}话 ${formatProgress(item.time ?? 0)}`
                    : '尚未观看'
                }
                onClick={() => handleAnimeClick(item.videoId)}
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
          <div className='grid grid-cols-3 gap-4 text-sm md:flex md:items-center md:gap-6'>
            {row.items.map((item, index) => (
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
