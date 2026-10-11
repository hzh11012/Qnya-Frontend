import { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

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
}

/**
 * 无限滚动分页列表 Hook：
 * 封装 useInfiniteQuery 的「已取条数 < total 则还有下一页」判断、
 * 多页数据扁平化与 fetchMore 防重入，供无限滚动组件（react-infinite-scroll-component）使用
 */
const usePagedList = <T>({
  queryKey,
  fetchPage,
  enabled = true
}: UsePagedListOptions<T>) => {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
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
