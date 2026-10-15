import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        // 聚焦样式与搜索框一致（标准 ring），常态保留可见边框
        'min-h-24 w-full resize-none rounded-md border border-border bg-transparent px-3 py-2 text-sm',
        'dark:border-border/60 placeholder:text-muted-foreground',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
