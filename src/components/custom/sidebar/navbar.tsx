import { useMatch, useNavigate } from 'react-router-dom';
import { links } from '@/links';
import { cn } from '@/lib/utils';

const NavItem = ({ link }: { link: (typeof links)[number] }) => {
  const { title, icon: Icon, url } = link;
  const isActive = useMatch(url);
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center cursor-pointer text-button-foreground gap-1 shrink-0',
        'transition-colors duration-200 text-muted-foreground hover:text-primary',
        {
          'text-primary': isActive
        }
      )}
      onClick={() => navigate(url)}
    >
      <Icon
        size={22}
        strokeWidth={isActive ? 2.5 : 1.5}
      />
      <span className={cn({ 'text-primary': isActive })}>{title}</span>
    </div>
  );
};

const Navbar = () => {
  return (
    <nav className='flex min-h-0 flex-1 flex-col items-center text-xs gap-6 py-8 overflow-y-auto scrollbar-hide'>
      {links.map((link, index) => (
        <NavItem
          key={index}
          link={link}
        />
      ))}
    </nav>
  );
};

export default Navbar;
