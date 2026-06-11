import { useRef, useSyncExternalStore, useEffect } from 'react';

/**
 * 延迟显示 loading 状态的 Hook
 * @param isLoading 实际的 loading 状态
 * @param delay 延迟时间（毫秒），默认 250ms
 * @returns 是否应该显示 loading
 */
const useDeferredLoading = (isLoading: boolean, delay = 250): boolean => {
  const showLoadingRef = useRef(false);
  const subscribersRef = useRef(new Set<() => void>());

  useEffect(() => {
    if (!isLoading) {
      showLoadingRef.current = false;
      subscribersRef.current.forEach(cb => cb());
      return;
    }

    const timer = setTimeout(() => {
      showLoadingRef.current = true;
      subscribersRef.current.forEach(cb => cb());
    }, delay);

    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return useSyncExternalStore(
    cb => {
      subscribersRef.current.add(cb);
      return () => subscribersRef.current.delete(cb);
    },
    () => showLoadingRef.current
  );
};

export default useDeferredLoading;
