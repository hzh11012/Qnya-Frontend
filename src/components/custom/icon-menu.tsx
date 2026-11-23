import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import IconButton from './icon-button';

export interface IconMenuItem {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  /** 当前选中项（如播放页主题），文字与图标一起染主色 */
  active?: boolean;
}

interface IconMenuProps {
  /** 触发按钮的 tooltip 与 aria-label */
  title: string;
  /** 触发按钮图标（播放页主题会随当前值变化） */
  icon: LucideIcon;
  items: IconMenuItem[];
}

/**
 * header 上的「图标 → 下拉菜单」：播放页主题、播放页更多、房间操作共用一套
 * 触发按钮与菜单项样式，页面只提供图标和动作。
 */
const IconMenu: React.FC<IconMenuProps> = ({
  title,
  icon: TriggerIcon,
  items
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <IconButton
        title={title}
        aria-label={title}
      >
        <TriggerIcon size={18} />
      </IconButton>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      className='w-fit'
      align='end'
    >
      {items.map(({ icon: Icon, label, onClick, active }) => (
        <DropdownMenuItem
          key={label}
          className={cn(
            'cursor-pointer',
            active ? 'text-primary' : 'text-foreground'
          )}
          onClick={onClick}
        >
          <Icon />
          {label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default IconMenu;
