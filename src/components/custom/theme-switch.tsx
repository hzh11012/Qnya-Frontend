import { useTheme } from '@/components/custom/theme-provider';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeSwitchProps {
  className?: string;
}

const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ className }) => {
  const { resolvedTheme, setTheme } = useTheme();
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
