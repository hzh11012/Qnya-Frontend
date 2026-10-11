import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  disableTransitionOnChange?: boolean;
}

const MEDIA = '(prefers-color-scheme: dark)';

const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia(MEDIA).matches ? 'dark' : 'light';

const resolveTheme = (theme: Theme): 'light' | 'dark' =>
  theme === 'system' ? getSystemTheme() : theme;

const applyTheme = (theme: Theme, disableTransitionOnChange: boolean) => {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  // 切换瞬间禁用所有过渡，避免颜色大面积渐变闪烁
  if (disableTransitionOnChange) {
    const style = document.createElement('style');
    style.appendChild(
      document.createTextNode('*,*::before,*::after{transition:none!important}')
    );
    document.head.appendChild(style);
    void window.getComputedStyle(document.body);
    setTimeout(() => document.head.removeChild(style), 1);
  }
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
};

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {}
});

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'qnya-theme',
  disableTransitionOnChange = false
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // localStorage 不可用时忽略，走默认主题
    }
    return defaultTheme;
  });

  // 单独跟踪系统主题：OS 切换深浅色时触发重渲染，
  // 否则 theme='system' 时 theme-switch 等消费方的 resolvedTheme 不会更新
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    getSystemTheme
  );

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // localStorage 不可用时忽略，走默认主题
      }
    },
    [storageKey]
  );

  // 主题变化（含系统切换影响 system 模式）时应用到 html（含首次挂载）
  useEffect(() => {
    applyTheme(theme, disableTransitionOnChange);
  }, [theme, systemTheme, disableTransitionOnChange]);

  // 跟随系统主题切换
  useEffect(() => {
    const media = window.matchMedia(MEDIA);
    const onChange = () => setSystemTheme(getSystemTheme());
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: theme === 'system' ? systemTheme : theme,
      setTheme
    }),
    [theme, systemTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
