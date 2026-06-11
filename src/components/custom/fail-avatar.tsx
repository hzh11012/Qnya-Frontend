import React from 'react';
import { cn } from '@/lib/utils';

interface FailAvatarProps {
  className?: string;
}

const FailAvatar: React.FC<FailAvatarProps> = ({ className }) => {
  return (
    <div className={cn('size-full bg-fail-avatar bg-cover', className)}></div>
  );
};

export default FailAvatar;
