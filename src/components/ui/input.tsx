import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({
  className,
  type,
  prefixIcon,
  ...props
}: React.ComponentProps<'input'> & {
  prefixIcon?: React.ReactNode;
}) {
  return (
    <div className={cn('relative w-full')}>
      <input
        type={type}
        data-slot='input'
        className={cn(
          'h-9 w-full border min-w-0 rounded-md bg-transparent px-2.5 py-1 text-sm outline-none transition-colors',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'placeholder:select-none placeholder:text-muted selection:bg-primary selection:text-white',
          {
            'peer ps-8': !!prefixIcon
          },
          className
        )}
        {...props}
      />
      {prefixIcon && (
        <div
          className={cn(
            'text-button-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-2.5 peer-disabled:opacity-50'
          )}
        >
          {prefixIcon}
        </div>
      )}
    </div>
  );
}

export { Input };
