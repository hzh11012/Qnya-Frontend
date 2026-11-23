import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  House,
  Monitor,
  Moon,
  Share2,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import IconButton from '@/components/custom/icon-button';
import IconMenu from '@/components/custom/icon-menu';
import { useSettings, updateSettings } from '@/lib/settings';
import { useNavPosition } from '@/lib/nav-position';
import { toast } from 'sonner';

/** 分享当前播放页：复制链接到剪贴板 */
const handleShare = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast.success('链接已复制，快去分享吧');
  } catch {
    toast.error('复制失败，请手动复制地址栏链接');
  }
};

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
    <IconMenu
      title='播放页主题'
      icon={ActiveIcon}
      items={PLAY_THEME_OPTIONS.map(({ value, label, icon }) => ({
        icon,
        label,
        active: playTheme === value,
        onClick: () => updateSettings({ playTheme: value })
      }))}
    />
  );
};

/**
 * 播放页顶部 header：回到主界面 + 后退/前进（不可用时禁用） | 播放页主题
 *
 * @param showShare 是否启用「分享当前页」：过渡页（正在开场）的地址是一次性的，
 *   复制出去对方打开只会被退回选片页，所以那里把分享置灰不可点
 */
const PlayHeader: React.FC<{ showShare?: boolean }> = ({
  showShare = true
}) => {
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
        <IconButton
          title='后退'
          disabled={!canBack}
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={18} />
        </IconButton>
        <IconButton
          title='前进'
          disabled={!canForward}
          onClick={() => navigate(1)}
        >
          <ChevronRight size={18} />
        </IconButton>
      </div>
      <div className='flex items-center gap-1'>
        <PlayThemeMenu />
        <IconButton
          title='分享'
          disabled={!showShare}
          onClick={() => void handleShare()}
        >
          <Share2 size={18} />
        </IconButton>
      </div>
    </header>
  );
};

export default PlayHeader;
