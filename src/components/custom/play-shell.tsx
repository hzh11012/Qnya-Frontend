import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 播放器右侧栏外壳：播放页与放映室共用，宽度/边框/底色只在这里改。
 * 移动端上面播放器、下面侧栏，lg 起并排（侧栏固定 95 = 380px）。
 *
 * 移动端的 `grow`：外壳有 min-h，内容不足时侧栏吃掉播放器以下的剩余高度，
 * 不然底下会空出一条页面底色（聊天输入框也不贴底）。内容超过一屏时这里
 * 按内容自然生长，页面整体滚动，不会把内容压进内部滚动条。
 */
export const PLAY_SIDEBAR_CLASS =
  'relative flex w-full grow flex-col border-border bg-background lg:h-full lg:w-95 lg:flex-none lg:border-l';

/** 侧栏 header 行：与页面 header 同高（12.5 = 50px），放标题或 tab 列表 */
export const PLAY_SIDEBAR_HEADER_CLASS =
  'flex min-h-12.5 flex-none items-center justify-between border-b px-5 text-base';

/**
 * 侧栏内容区：统一纵向内距与滚动。横向内距不在这里给——
 * 播放页的系列/推荐列表是通栏行（卡片自带 px-5），给了会双重缩进。
 */
export const PLAY_SIDEBAR_BODY_CLASS = 'min-h-0 flex-1 overflow-y-auto py-5';

/** 侧栏内容区（含横向内距）：内容本身不带 px 时用，如放映室的播放列表 */
export const PLAY_SIDEBAR_BODY_PADDED_CLASS =
  'min-h-0 flex-1 overflow-y-auto px-5 py-5';

/** 侧栏分区之间的分隔线 */
export const PLAY_SIDEBAR_DIVIDER_CLASS = 'my-5 border-border';

/**
 * 侧栏 header 里的 tab（放映室的「聊天 / 播放列表」）：
 * 未激活 = 播放页「简介」同款中性前景色，激活 = 主题色 + 同色下划线。
 * 末尾两条 `dark:*` 是必要的：项目里 `@custom-variant dark (&:is(.dark *))`
 * 生成的 `dark:text-muted-foreground` 权重高于 `data-[state=active]:text-primary`，
 * 不在深色态再写一遍，激活态会被压回次要色。
 */
export const PLAY_SIDEBAR_TAB_LIST_CLASS = 'h-12.5 gap-6 bg-transparent p-0';
export const PLAY_SIDEBAR_TAB_CLASS =
  'h-full flex-none px-0 text-base text-foreground after:h-0.5 dark:text-foreground data-[state=active]:text-primary data-[state=active]:after:bg-primary dark:data-[state=active]:text-primary';

interface PlayShellProps {
  /** 播放器区域（黑底屏幕由外壳提供，含占位/重连提示等） */
  player: React.ReactNode;
  /** 右侧栏内容 */
  sidebar: React.ReactNode;
  /** 侧栏额外样式：放映室移动端要吃掉播放器以下的高度，聊天输入框才始终可见 */
  sidebarClassName?: string;
}

/**
 * 播放器 + 右侧栏：播放页与放映室的骨架完全相同——黑底播放区、右缘收起键、
 * 等宽侧栏，差异只在两个 slot 里。收起状态内置，页面不用再自己管 collapsed。
 */
const PlayShell: React.FC<PlayShellProps> = ({
  player,
  sidebar,
  sidebarClassName
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className='group flex min-h-[calc(100dvh-3.125rem)] flex-col lg:h-[calc(100vh-3.125rem)] lg:min-h-0 lg:flex-row'>
      <section className='relative isolate flex-none bg-black lg:flex-1'>
        {player}
        {/* 收起/展开侧栏：hover 播放器时出现在右缘（仅桌面） */}
        <button
          type='button'
          title={collapsed ? '展开侧栏' : '收起侧栏'}
          aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
          onClick={() => setCollapsed(value => !value)}
          className={cn(
            'absolute top-1/2 right-0 z-20 -translate-y-1/2 cursor-pointer',
            'hidden h-14 w-7 items-center justify-center rounded-l-sm bg-black/50 text-white',
            'lg:group-hover:flex'
          )}
        >
          {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </section>

      <aside
        className={cn(
          PLAY_SIDEBAR_CLASS,
          sidebarClassName,
          collapsed && 'lg:hidden'
        )}
      >
        {sidebar}
      </aside>
    </div>
  );
};

export default PlayShell;
