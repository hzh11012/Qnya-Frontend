import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import FailAvatar from '@/components/custom/fail-avatar';

interface CoverImageProps {
  src?: string | null;
  className?: string;
}

/** 封面图：加载失败或无图时兜底 base64 占位图 */
const CoverImage: React.FC<CoverImageProps> = ({ src, className }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <FailAvatar className={className} />;
  }

  return (
    <img
      src={src}
      alt=''
      loading='lazy'
      draggable={false}
      onError={() => setFailed(true)}
      className={cn('size-full object-cover', className)}
    />
  );
};

export default CoverImage;
