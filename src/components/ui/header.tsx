import * as React from 'react';
import { cn } from '@/lib/utils';

const HEADER_HEIGHT = '4.25rem';

function HeaderProvider({
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='header-wrapper'
      style={
        {
          '--header-height': HEADER_HEIGHT,
          ...style
        } as React.CSSProperties
      }
      className={cn('flex flex-col min-h-svh w-full', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function Header({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className='group peer'
      data-slot='header'
    >
      <div
        data-slot='header-gap'
        className={cn('relative h-(--header-height) bg-transparent')}
      />
      <div
        data-slot='header-container'
        className={cn(
          'fixed z-10 left-0 md:left-(--sidebar-width) right-0 h-(--header-height) flex top-0 border-b'
        )}
      >
        <div
          data-header='header'
          data-slot='header-inner'
          className={cn('relative bg-background flex size-full', className)}
          {...props}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function HeaderInset({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot='header-inset'
      className={cn(
        'bg-background relative flex w-full flex-1 flex-col overflow-hidden',
        className
      )}
      {...props}
    />
  );
}

function HeaderLeft({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='header-left'
      data-sidebar='left'
      className={cn('flex gap-2 p-2', className)}
      {...props}
    />
  );
}

function HeaderRight({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='header-right'
      data-sidebar='right'
      className={cn('flex gap-2 p-2', className)}
      {...props}
    />
  );
}

export { HeaderProvider, Header, HeaderInset, HeaderLeft, HeaderRight };
