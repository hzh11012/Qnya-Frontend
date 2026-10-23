import { useLocation } from 'react-router-dom';

/**
 * 当前会话内的导航位置，用于禁用「后退/前进」按钮：
 * react-router 数据路由（createBrowserRouter）会在 history.state.idx 里
 * 维护当前 entry 的序号（PUSH/REPLACE/POP 全自动），栈底序号为 0，
 * 所以可后退 ⇔ idx > 0，可前进 ⇔ idx < history.length - 1。
 *
 * idx 只随导航变化，而导航必然触发 useLocation 重渲染，
 * 故渲染期直接读取即可，无需 effect 或订阅。
 */
export const useNavPosition = () => {
  // 订阅路由变化（idx 的新鲜度由重渲染保证）
  useLocation();
  const index: number = window.history.state?.idx ?? 0;

  return {
    index,
    canBack: index > 0,
    canForward: index < window.history.length - 1
  };
};
