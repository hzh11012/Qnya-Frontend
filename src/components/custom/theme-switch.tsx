import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface ThemeSwitchProps {
  className?: string;
}

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ className }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <div
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title='主题'
      className={cn(
        'cursor-pointer transition-colors text-button-foreground hover:text-primary select-none duration-200',
        className
      )}
    >
      {isDark ? <Sun size={22} /> : <Moon size={22} />}
    </div>
  );
};

export default ThemeSwitch;
