import { cn } from '@/lib/utils';
import Favicon from '@/assets/favicon.png';
import LogoSvg from '@/assets/logo.png';

interface LogoProps {
  type: 'favicon' | 'logo';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ type, className }) => {
  return (
    <>
      {type === 'favicon' && (
        <img
          draggable='false'
          src={Favicon}
          className={cn('size-10 select-none pointer-events-none', className)}
          alt='favicon'
        />
      )}
      {type === 'logo' && (
        <img
          draggable='false'
          src={LogoSvg}
          className={cn('select-none pointer-events-none', className)}
          alt='logo'
        />
      )}
    </>
  );
};

export default Logo;
