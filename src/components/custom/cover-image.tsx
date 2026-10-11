import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import FailAvatar from '@/components/custom/fail-avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface CoverImageProps {
  src?: string | null;
  className?: string;
  /** 仅在图片成功渲染时应用（如 hover 缩放类），失败兜底的 SVG 不响应 hover 效果 */
  imageClassName?: string;
}

/** 封面图：加载失败或无图时兜底 base64 占位图；加载完成前隐藏避免裂图闪现 */
const CoverImage: React.FC<CoverImageProps> = ({
  src,
  className,
  imageClassName
}) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!src || failed) {
    return <FailAvatar className={className} />;
  }

  return (
    <>
      {/* 加载中占位：骨架屏脉冲，图片在上层淡入盖住 */}
      {!loaded && <Skeleton className={cn('size-full', className)} />}
      <img
        src={src}
        alt=''
        loading='lazy'
        draggable={false}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={cn(
          'size-full object-cover transition-opacity duration-200',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
          imageClassName
        )}
      />
    </>
  );
};

export default CoverImage;
