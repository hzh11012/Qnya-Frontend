import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const MEDIA = '(prefers-color-scheme: dark)';

export const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia(MEDIA).matches ? 'dark' : 'light';

export const resolveTheme = (theme: Theme): 'light' | 'dark' =>
  theme === 'system' ? getSystemTheme() : theme;

export const applyTheme = (
  theme: Theme,
  disableTransitionOnChange: boolean
) => {
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

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {}
});

export function useTheme() {
  return useContext(ThemeContext);
}
