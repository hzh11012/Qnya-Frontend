import React from 'react';
import { cn } from '@/lib/utils';

/**
 * header / 侧栏统一的图标按钮：32px 方块、hover 底色、禁用降透明。
 * 播放页 header（后退/前进/分享/主题）、两页的三点菜单、换一部返回键都用它，
 * 别再各写一份 className。
 */
const IconButton: React.FC<React.ComponentProps<'button'>> = ({
  className,
  type = 'button',
  ref,
  ...props
}) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      'flex size-8 cursor-pointer items-center justify-center rounded-sm text-foreground',
      'transition-colors duration-200 hover:bg-border',
      'disabled:pointer-events-none disabled:opacity-40',
      className
    )}
    {...props}
  />
);

export default IconButton;

/**
 * 无底色的图标操作：hover 只把图标染成主色，不铺底色。
 * 用于嵌在内容里的轻量操作（选集排序、放映室「换一部」）。
 */
export const IconAction: React.FC<React.ComponentProps<'button'>> = ({
  className,
  type = 'button',
  ref,
  ...props
}) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      'flex cursor-pointer items-center transition-colors duration-200 hover:text-primary',
      'disabled:cursor-not-allowed disabled:opacity-40',
      className
    )}
    {...props}
  />
);
