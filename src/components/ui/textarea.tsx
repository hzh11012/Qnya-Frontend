import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'min-h-24 w-full resize-none rounded-sm border border-border bg-transparent px-3 py-2 text-sm',
        'dark:border-border/60 placeholder:text-muted-foreground',
        'focus-visible:border-primary focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
