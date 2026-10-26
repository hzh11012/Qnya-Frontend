import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Exception from '@/components/custom/exception';
import { AnimeCard, AnimeCardSkeleton } from '@/components/custom/anime-card';
import { getClientList, getClientTags } from '@/apis/anime';
import type { ClientAnimeItem } from '@/apis/anime';
import { usePagedList } from '@/hooks/use-paged-list';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { getStatusText } from '@/lib/anime';
import { useAuthStore } from '@/store/auth';
import FilterRow, { type FilterOption } from './filter-row';

const PAGE_SIZE = 20;

/** 番剧卡片网格：与热门页一致（2→3→4→5→6→7 随宽度平滑过渡） */
const GRID_CLASS =
  'grid grid-cols-3 gap-x-4 gap-y-6 text-sm md:grid-cols-4 md:gap-x-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7';

/** 对外参数统一数字码，与后端映射一致 */
const SORT_LIST = [
  { label: '综合排序', value: '1' },
  { label: '最高评分', value: '2' },
  { label: '最多播放', value: '3' },
  { label: '最多追番', value: '4' },
  { label: '最近更新', value: '5' }
] as const satisfies readonly FilterOption[];

const TYPE_LIST = [
  { label: '全部类型', value: '' },
  { label: '剧场版', value: '1' },
  { label: '日番', value: '2' },
  { label: '美漫', value: '3' },
  { label: '国创', value: '4' },
  { label: '里番', value: '5' }
] as const;

const STATUS_LIST = [
  { label: '全部状态', value: '' },
  { label: '连载中', value: '1' },
  { label: '已完结', value: '2' },
  { label: '即将开播', value: '3' }
] as const;

const MONTH_LIST = [
  { label: '全部季度', value: '' },
  { label: '1月', value: '1' },
  { label: '4月', value: '4' },
  { label: '7月', value: '7' },
  { label: '10月', value: '10' }
] as const;

/**
 * 年份选项：最近 5 年单年展示，再往前 4 个五年分组，剩余归入「更早」，随年份自动递增；
 * value 统一为半开区间 [起,止)，如单年 [2026,2027)、分组 [2017,2022)、更早 [,2001)
 */
const generateYearOptions = (): FilterOption[] => {
  const currentYear = new Date().getFullYear();
  const options: FilterOption[] = [{ label: '全部年份', value: '' }];
  for (let y = currentYear; y > currentYear - 5; y--) {
    options.push({ label: String(y), value: `[${y},${y + 1})` });
  }
  const groupsEnd = currentYear - 25;
  for (let end = currentYear - 5; end > groupsEnd; end -= 5) {
    options.push({
      label: `${end}-${end - 4}`,
      value: `[${end - 4},${end + 1})`
    });
  }
  options.push({ label: '更早', value: `[,${groupsEnd + 1})` });
  return options;
};

const YEAR_LIST = generateYearOptions();

/** 18+ 类型选项仅高级会员/管理员可见（与后端内容过滤保持一致） */
const useTypeOptions = () => {
  const role = useAuthStore(state => state.user?.role);
  const isPrivileged = role === 'admin' || role === 'premium';
  return React.useMemo(
    () => TYPE_LIST.filter(item => item.value !== '5' || isPrivileged),
    [isPrivileged]
  );
};

/** 筛选参数 ⇄ URL search params 的双向映射（对外均为数字码；year 为半开区间如 "[2021,2022)"） */
type BangumiFilter = {
  sort: string;
  type?: string;
  status?: string;
  year?: string;
  month?: string;
  tag?: string;
};

type FilterKey = keyof BangumiFilter;

/** 合法数字码（与后端映射一致）；year 格式为半开区间，tag 为 uuid */
const VALID_CODES: Partial<Record<FilterKey, Set<string>>> = {
  sort: new Set(['1', '2', '3', '4', '5']),
  type: new Set(['1', '2', '3', '4', '5']),
  status: new Set(['1', '2', '3']),
  month: new Set(['1', '4', '7', '10'])
};

/** 年份半开区间：格式、起止顺序、范围（1990 ~ 明年）均需合法 */
const isValidYear = (value: string) => {
  const match = value.match(/^\[(\d{4})?,(\d{4})?\)$/);
  if (!match) return false;
  const from = match[1] === undefined ? undefined : Number(match[1]);
  const to = match[2] === undefined ? undefined : Number(match[2]);
  const max = new Date().getFullYear() + 1;
  const inRange = (v: number | undefined) =>
    v === undefined || (v >= 1990 && v <= max);
  return inRange(from) && inRange(to) && (!from || !to || from < to);
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 清洗 URL 参数：非法值直接移除，避免无效请求打到后端 */
const sanitizeParams = (params: URLSearchParams) => {
  const next = new URLSearchParams(params);
  for (const [key, isValid] of Object.entries(VALID_CODES)) {
    const value = next.get(key);
    if (value && !isValid.has(value)) next.delete(key);
  }
  const year = next.get('year');
  if (year && !isValidYear(year)) next.delete('year');
  const tag = next.get('tag');
  if (tag && !UUID_RE.test(tag)) next.delete('tag');
  return next;
};

const useBangumiFilter = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  /** 清洗后的参数（非法值已移除） */
  const cleanedParams = React.useMemo(
    () => sanitizeParams(searchParams),
    [searchParams]
  );
  const hasInvalid = cleanedParams.toString() !== searchParams.toString();

  // 携带非法参数进入（如手工改 URL/旧链接）时自动清理 URL
  React.useEffect(() => {
    if (hasInvalid) {
      setSearchParams(cleanedParams, { replace: true });
    }
  }, [hasInvalid, cleanedParams, setSearchParams]);

  const filter: BangumiFilter = {
    sort: cleanedParams.get('sort') || '1',
    type: cleanedParams.get('type') || undefined,
    status: cleanedParams.get('status') || undefined,
    year: cleanedParams.get('year') || undefined,
    month: cleanedParams.get('month') || undefined,
    tag: cleanedParams.get('tag') || undefined
  };

  /** 更新单个维度：值为空串/默认值时移除参数，保持 URL 干净 */
  const handleChange = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(cleanedParams);
    if (value === '' || (key === 'sort' && value === '1')) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  return { filter, handleChange };
};

interface BangumiSelectProps {
  filter: BangumiFilter;
  onChange: (key: FilterKey, value: string) => void;
}

/** 筛选面板：排序/类型/状态/年份/季度/标签 六行 */
const BangumiSelect: React.FC<BangumiSelectProps> = ({ filter, onChange }) => {
  const typeOptions = useTypeOptions();
  const { data } = useQuery({
    queryKey: ['bangumi', 'tags'],
    queryFn: getClientTags,
    staleTime: 5 * 60_000
  });
  const tagOptions: FilterOption[] = React.useMemo(
    () => [
      { label: '全部风格', value: '' },
      ...(data?.items.map(tag => ({ label: tag.name, value: tag.id })) ?? [])
    ],
    [data]
  );

  return (
    <div className='mb-6 flex flex-col gap-2.5 md:mb-8'>
      <FilterRow
        options={SORT_LIST}
        value={filter.sort ?? ''}
        onChange={value => onChange('sort', value)}
      />
      <FilterRow
        options={typeOptions}
        value={filter.type ?? ''}
        onChange={value => onChange('type', value)}
      />
      <FilterRow
        options={tagOptions}
        value={filter.tag ?? ''}
        onChange={value => onChange('tag', value)}
      />
      <FilterRow
        options={STATUS_LIST}
        value={filter.status ?? ''}
        onChange={value => onChange('status', value)}
      />
      <FilterRow
        options={YEAR_LIST}
        value={filter.year ?? ''}
        onChange={value => onChange('year', value)}
      />
      <FilterRow
        options={MONTH_LIST}
        value={filter.month ?? ''}
        onChange={value => onChange('month', value)}
      />
    </div>
  );
};

/** 卡片骨架网格 */
const ListSkeleton: React.FC<{ count?: number }> = ({ count = 14 }) => (
  <div className={GRID_CLASS}>
    {Array.from({ length: count }, (_, i) => (
      <AnimeCardSkeleton key={i} />
    ))}
  </div>
);

/** 列表卡片 */
const ListCard: React.FC<{ item: ClientAnimeItem }> = ({ item }) => {
  const navigate = useNavigate();
  return (
    <AnimeCard
      title={item.name}
      image={item.cover ?? ''}
      remark={item.remark ?? ''}
      tip={getStatusText(item)}
      onClick={() => item.videoId && navigate(`/anime/${item.videoId}`)}
    />
  );
};

/**
 * @title 番剧筛选页
 * @description 各维度单选筛选 + 无限滚动列表；筛选状态同步 URL，可直接分享/回退
 */
const Bangumi: React.FC = () => {
  useDocumentTitle('番剧库');
  const { filter, handleChange } = useBangumiFilter();

  const { list, fetchMore, isPending, isFetchingNextPage, hasNextPage } =
    usePagedList<ClientAnimeItem>({
      queryKey: ['bangumi', 'list', filter],
      fetchPage: page =>
        getClientList({
          page,
          pageSize: PAGE_SIZE,
          year: filter.year,
          tag: filter.tag,
          // 数字码参数转数字传给后端（zod transform 回内部枚举）
          sort: Number(filter.sort) || undefined,
          type: filter.type ? Number(filter.type) : undefined,
          status: filter.status ? Number(filter.status) : undefined,
          month: filter.month ? Number(filter.month) : undefined
        })
    });

  const sentinelRef = useInfiniteScroll(
    fetchMore,
    !hasNextPage || isFetchingNextPage
  );

  return (
    <div className='my-4 md:my-8'>
      <BangumiSelect
        filter={filter}
        onChange={handleChange}
      />

      {isPending ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        <div className='h-80'>
          <Exception type='empty' />
        </div>
      ) : (
        <div>
          <div className={GRID_CLASS}>
            {list.map(item => (
              <ListCard
                key={item.id}
                item={item}
              />
            ))}
            {isFetchingNextPage &&
              Array.from({ length: 7 }, (_, i) => (
                <AnimeCardSkeleton key={`skeleton-${i}`} />
              ))}
          </div>
          {/* 无限滚动哨兵：进入视口时加载下一页 */}
          <div
            ref={sentinelRef}
            aria-hidden
          />
        </div>
      )}
    </div>
  );
};

export default Bangumi;
