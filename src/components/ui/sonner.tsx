import { Toaster as Sonner, type ToasterProps } from 'sonner';
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon
} from 'lucide-react';
import { useTheme } from '@/components/custom/theme-provider';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      icons={{
        success: <CircleCheckIcon className='size-4 text-primary' />,
        info: <InfoIcon className='size-4 text-muted' />,
        warning: <TriangleAlertIcon className='size-4 text-yellow-500' />,
        error: <OctagonXIcon className='size-4 text-destructive' />,
        loading: <Loader2Icon className='size-4 animate-spin text-primary' />
      }}
      style={
        {
          // Radix 弹窗打开时会给 body 加 pointer-events: none（防点击穿透），
          // toast 会继承到 none 导致弹窗打开时无法交互，这里显式恢复
          pointerEvents: 'auto',
          // 毛玻璃：半透明 card 底色 + toast 上的 backdrop-blur（对齐管理后台设计语言）
          '--normal-bg': 'color-mix(in oklab, var(--card) 75%, transparent)',
          '--normal-text': 'var(--foreground)',
          '--normal-border':
            'color-mix(in oklab, var(--border) 60%, transparent)',
          // 与 rounded-xl（--radius + 4px）一致
          '--border-radius': 'calc(var(--radius) + 4px)'
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast backdrop-blur-md',
          title: 'text-sm font-medium tracking-tight',
          description: 'text-muted text-xs',
          actionButton: 'bg-primary text-white',
          cancelButton: 'bg-muted/20 text-muted'
        }
      }}
      {...props}
    />
  );
};

export { Toaster };
