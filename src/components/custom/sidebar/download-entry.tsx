import { DownloadIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** 侧栏底部客户端下载入口（跳转 /download 下载页） */
const DownloadEntry: React.FC<{ className?: string }> = ({ className }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/download')}
      title='下载'
      className={cn(
        'cursor-pointer transition-colors text-button-foreground hover:text-primary select-none duration-200',
        className
      )}
    >
      <DownloadIcon size={22} />
    </div>
  );
};

export default DownloadEntry;
