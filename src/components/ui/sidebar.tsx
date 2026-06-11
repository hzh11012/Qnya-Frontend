import * as React from 'react';
import { cn } from '@/lib/utils';

const SIDEBAR_WIDTH = '4.25rem';

function SidebarProvider({
  className,
  style,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sidebar-wrapper'
      style={
        {
          '--sidebar-width': SIDEBAR_WIDTH,
          ...style
        } as React.CSSProperties
      }
      className={cn('flex min-h-svh w-full', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function Sidebar({
  wrapperClassName,
  className,
  innerClassName,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  wrapperClassName?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={cn(
        'group peer text-foreground hidden md:block',
        wrapperClassName
      )}
      data-slot='sidebar'
    >
      <div
        data-slot='sidebar-gap'
        className={cn('relative w-(--sidebar-width) bg-transparent')}
      />
      <div
        data-slot='sidebar-container'
        className={cn(
          'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) md:flex',
          className
        )}
        {...props}
      >
        <div
          data-sidebar='sidebar'
          data-slot='sidebar-inner'
          className={cn('bg-card flex size-full flex-col', innerClassName)}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
  return (
    <main
      data-slot='sidebar-inset'
      className={cn(
        'bg-background relative flex w-full flex-1 flex-col overflow-hidden',
        className
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sidebar-header'
      data-sidebar='header'
      className={cn(
        'flex flex-col items-center justify-center gap-2 p-2',
        className
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sidebar-footer'
      data-sidebar='footer'
      className={cn(
        'flex flex-col items-center justify-center gap-2 p-2',
        className
      )}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sidebar-content'
      data-sidebar='content'
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-auto scrollbar-hide',
        className
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider
};
