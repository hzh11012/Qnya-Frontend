import { useEffect, useRef, useState } from 'react';

/**
 * 无限滚动哨兵：把返回的 ref 挂到列表末尾的哨兵元素上，元素进入视口（含 160px 预取余量）
 * 时触发 loadMore，替代 react-infinite-scroll-component。
 *
 * - disabled 为 true（无更多数据 / 上一页仍在加载）时暂停观察，配合 usePagedList 的
 *   fetchMore 防重入实现自动填充：请求结束重新观察后，若哨兵仍在视口内会继续加载直到撑满一屏；
 * - 回调经 ref 转发，观察器闭包不会过期；
 * - 哨兵元素随条件渲染卸载/重挂时（如关键词切换重置列表），ref 回调更新 state 触发重新观察。
 */
const useInfiniteScroll = (loadMore: () => void, disabled: boolean) => {
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  const loadMoreRef = useRef(loadMore);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    if (!sentinel || disabled) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          loadMoreRef.current();
        }
      },
      { rootMargin: '160px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, disabled]);

  return setSentinel;
};

export { useInfiniteScroll };
