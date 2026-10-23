import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  House,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettings, updateSettings } from '@/lib/settings';
import { useNavPosition } from '@/lib/nav-position';

/** 播放页主题可选值（提升到模块级，避免每次渲染重建） */
const PLAY_THEME_OPTIONS = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '跟随平台', icon: Monitor }
] as const;

/** 播放页主题切换菜单：与平台主题独立（浅色/深色/跟随平台） */
const PlayThemeMenu: React.FC = () => {
  const { playTheme } = useSettings();
  const ActiveIcon =
    playTheme === 'light' ? Sun : playTheme === 'dark' ? Moon : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          className={cn(
            'flex cursor-pointer items-center justify-center rounded-sm size-8 text-foreground',
            'transition-colors duration-200 hover:bg-border'
          )}
          title='播放页主题'
        >
          <ActiveIcon size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-fit'
        align='end'
      >
        {PLAY_THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            className={cn(
              'cursor-pointer',
              playTheme === value ? 'text-primary' : 'text-foreground'
            )}
            onClick={() => updateSettings({ playTheme: value })}
          >
            <Icon />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** header 上的图标按钮（后退/前进共用），不可用时禁用 */
const HeaderIcon: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  ...props
}) => (
  <button
    type='button'
    className={cn(
      'flex cursor-pointer items-center justify-center rounded-sm size-8 text-foreground',
      'transition-colors duration-200 hover:bg-border disabled:pointer-events-none disabled:opacity-40',
      className
    )}
    {...props}
  />
);

/** 播放页顶部 header：回到主界面 + 后退/前进（不可用时禁用） | 播放页主题 */
const PlayHeader: React.FC = () => {
  const navigate = useNavigate();
  const { canBack, canForward } = useNavPosition();

  return (
    <header className='flex h-12.5 flex-none items-center justify-between border-b border-border px-4 select-none md:px-5'>
      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          className='size-8 gap-1.5 rounded-sm bg-card border-none p-0 select-none md:w-auto md:px-3'
          title='回到主界面'
          onClick={() => navigate('/')}
        >
          <House size={16} />
          <span className='hidden md:block'>回到主界面</span>
        </Button>
        <HeaderIcon
          title='后退'
          disabled={!canBack}
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={18} />
        </HeaderIcon>
        <HeaderIcon
          title='前进'
          disabled={!canForward}
          onClick={() => navigate(1)}
        >
          <ChevronRight size={18} />
        </HeaderIcon>
      </div>
      <div className='flex items-center gap-1'>
        <PlayThemeMenu />
      </div>
    </header>
  );
};

export default PlayHeader;
