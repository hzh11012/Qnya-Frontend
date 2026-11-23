import { useLayoutEffect } from 'react';
import { applyTheme, useTheme } from '@/components/custom/theme-context';
import { useSettings } from '@/lib/settings';

/**
 * 播放页 / 放映室的独立主题（settings.playTheme，与平台主题分开）。
 *
 * 这类页面不在主布局内（没有侧栏与平台主题入口），挂载期间直接覆写根主题类，
 * 离开时恢复平台主题；useLayoutEffect 保证首帧不闪错主题，且平台主题变化
 * （跟随系统时 OS 切换深浅色）会让 effect 重跑，覆写不被全局逻辑冲掉。
 */
export const usePlayTheme = () => {
  const { playTheme } = useSettings();
  const { resolvedTheme } = useTheme();

  useLayoutEffect(() => {
    applyTheme(playTheme === 'system' ? resolvedTheme : playTheme, false);
    return () => applyTheme(resolvedTheme, false);
  }, [playTheme, resolvedTheme]);
};
