import * as React from 'react';
import { cn } from '@/lib/utils';

const FOOTER_HEIGHT = '4.25rem';

function Footer({
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className='flex md:hidden'
      data-slot='footer'
      style={
        {
          '--footer-height': FOOTER_HEIGHT,
          ...style
        } as React.CSSProperties
      }
    >
      {/* 移动端底部 tab 固定定位的文档流占位，避免内容被遮挡 */}
      <div
        data-slot='footer-gap'
        className={cn('relative h-(--footer-height) bg-transparent')}
      />
      <div
        data-slot='footer-container'
        className={cn(
          // 极窄屏（<320px）：内部横向滚动，tab 项不被压缩；正常宽度无感
          'fixed z-10 left-0 right-0 h-(--footer-height) flex bottom-0 border-t-1 overflow-x-auto'
        )}
      >
        <div
          data-footer='footer'
          data-slot='footer-inner'
          className={cn(
            'relative bg-background flex size-full min-w-80',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export { Footer };
