import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 懒加载组件
 */
export const createLazyComponent = (
  importFn: () => Promise<{ default: React.ComponentType }>
) => {
  return async () => ({
    Component: (await importFn()).default
  });
};
