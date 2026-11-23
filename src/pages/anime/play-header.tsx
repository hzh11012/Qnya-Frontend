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
import { copyShareText, type ShareInfo } from '@/lib/share';
import { toast } from 'sonner';

/** 拿不到具体内容时的兜底文案（如番剧详情还在加载） */
const DEFAULT_SHARE: ShareInfo = {
  title: '我在 Qnya 看番，一起来吧！',
  successText: '分享文案已复制，粘贴给好友即可'
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
 * @param share 分享文案上下文：番剧页带「番名 + 集数」，放映室带房间信息。
 *   不传则用通用推荐语（守门页、加载态这类拿不到内容的场景）
 */
const PlayHeader: React.FC<{
  showShare?: boolean;
  share?: ShareInfo;
}> = ({ showShare = true, share }) => {
  const navigate = useNavigate();
  const { canBack, canForward } = useNavPosition();

  const handleShare = async () => {
    const info = share ?? DEFAULT_SHARE;
    if (await copyShareText(info)) {
      toast.success(info.successText ?? '分享文案已复制，粘贴给好友即可');
    } else {
      toast.error('复制失败，请手动复制地址栏链接');
    }
  };

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
