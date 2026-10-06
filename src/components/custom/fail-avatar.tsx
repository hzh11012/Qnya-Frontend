import React from 'react';
import { cn } from '@/lib/utils';
import Empty from '@/assets/empty.svg?react';

interface FailAvatarProps {
  className?: string;
}

/** 封面加载失败兜底：玻璃质感底 + 空状态插画 */
const FailAvatar: React.FC<FailAvatarProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'relative size-full flex items-center justify-center overflow-hidden',
        className
      )}
    >
      {/* 玻璃质感：斜向渐变高光 */}
      <div className='absolute inset-0 bg-linear-to-tr from-foreground/[0.04] via-transparent to-foreground/[0.1]' />
      <Empty className='relative h-full w-full' />
    </div>
  );
};

export default FailAvatar;
