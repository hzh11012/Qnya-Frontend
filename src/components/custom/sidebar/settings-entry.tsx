import { SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** 侧栏底部设置入口（跳转 /settings 设置页） */
const SettingsEntry: React.FC<{ className?: string }> = ({ className }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/settings')}
      title='设置'
      className={cn(
        'cursor-pointer transition-colors text-button-foreground hover:text-primary select-none duration-200',
        className
      )}
    >
      <SettingsIcon size={22} />
    </div>
  );
};

export default SettingsEntry;
