import { useMatch, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Footer } from '@/components/ui/footer';
import { cn } from '@/lib/utils';
import { links } from '@/links';

const FooterItem: React.FC<{
  title: string;
  icon: LucideIcon;
  url: string;
}> = ({ title, icon: Icon, url }) => {
  const navigate = useNavigate();
  const isActive = !!useMatch(url);

  return (
    <div
      className='flex flex-col text-xs items-center justify-center text-card-foreground cursor-pointer select-none gap-1'
      onClick={() => navigate(url)}
    >
      <Icon
        size={22}
        strokeWidth={isActive ? 2.5 : 1.5}
        className={cn('transition-colors duration-200', {
          'text-primary': isActive
        })}
      />
      <span
        className={cn('transition-colors duration-200 text-muted-foreground', {
          'text-primary/70': isActive
        })}
      >
        {title}
      </span>
    </div>
  );
};

/** 移动端底部 tab 导航（与侧栏共用 links，桌面端隐藏） */
const AppFooter: React.FC = () => {
  return (
    <Footer className='justify-around'>
      {links.map(link => (
        <FooterItem
          key={link.url}
          title={link.title}
          icon={link.icon}
          url={link.url}
        />
      ))}
    </Footer>
  );
};

export default AppFooter;
