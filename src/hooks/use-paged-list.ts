import { useCallback, useMemo } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

/** 分页响应统一形态 */
interface Paged<T> {
  items: T[];
  total: number;
}

interface UsePagedListOptions<T> {
  /** react-query 缓存键 */
  queryKey: unknown[];
  /** 请求某一页数据 */
  fetchPage: (page: number) => Promise<Paged<T>>;
  /** 是否启用请求 */
  enabled?: boolean;
  /** 覆盖全局 staleTime（如播放页会写入历史/追番，进入列表页需拉最新数据时传 0） */
  staleTime?: number;
  /** 轮询间隔：大厅这类「别人随时会创建/解散」的列表需要定期自愈 */
  refetchInterval?: number;
  /**
   * 切筛选/关键词时保留上一份数据占位，避免整片骨架闪一下。
   * 开启后换 key 期间 `isPending` 不会变 true（只会在首次无数据时变），
   * 由 `isPlaceholderData` 表示「现在展示的是上一组条件的结果」，页面据此做半透明提示。
   */
  keepPrevious?: boolean;
}

/**
 * 无限滚动分页列表 Hook：
 * 封装 useInfiniteQuery 的「已取条数 < total 则还有下一页」判断、
 * 多页数据扁平化与 fetchMore 防重入，配合 use-infinite-scroll 哨兵触发翻页
 */
const usePagedList = <T>({
  queryKey,
  fetchPage,
  enabled = true,
  staleTime,
  refetchInterval,
  keepPrevious = false
}: UsePagedListOptions<T>) => {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    staleTime,
    refetchInterval,
    placeholderData: keepPrevious ? keepPreviousData : undefined,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce(
        (sum, page) => sum + page.items.length,
        0
      );
      return fetched < lastPage.total && lastPage.items.length > 0
        ? allPages.length + 1
        : undefined;
    },
    enabled
  });

  /** 已加载的全部条目（跨页扁平化，保持顺序） */
  const list = useMemo(
    () => query.data?.pages.flatMap(page => page.items) ?? [],
    [query.data]
  );

  /** 加载下一页（进行中时防重入） */
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return { list, fetchMore, ...query };
};

export { usePagedList };
export type { Paged };
