import { useEffect, useState } from 'react';
import { ArrowUp, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/custom/theme-context';
import { cn } from '@/lib/utils';

/** FAB 公共样式：圆角毛玻璃卡片，hover 主题色 */
const FAB_CLASS =
  'flex size-10 cursor-pointer select-none items-center justify-center rounded-full border border-border bg-card/90 text-button-foreground shadow-sm backdrop-blur transition-colors duration-200 hover:text-primary';

/**
 * 右下悬浮操作（移动端与桌面端均显示）：
 * - 回到顶部：滚动超过半屏后淡入，全端可用
 * - 主题切换：仅移动端（移动端侧栏隐藏后唯一的主题入口，
 *   桌面端侧栏已有切换，避免冗余）
 */
const FloatingActions: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight / 2);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className='fixed right-4 bottom-[calc(4.25rem+1rem)] z-10 flex flex-col items-center gap-2.5 md:bottom-6'>
      <div
        title='回到顶部'
        className={cn(
          FAB_CLASS,
          'transition-all duration-200',
          showTop
            ? 'opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0'
        )}
        onClick={() => window.scrollTo({ top: 0 })}
      >
        <ArrowUp size={20} />
      </div>
      <div
        title='主题'
        className={cn(FAB_CLASS, 'md:hidden')}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </div>
    </div>
  );
};

export default FloatingActions;
