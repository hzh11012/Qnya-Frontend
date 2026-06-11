import { cn } from '@/lib/utils';
import NotFound from '@/assets/not-found.svg?react';
import Ban from '@/assets/ban.svg?react';
import Error from '@/assets/error.svg?react';
import Offline from '@/assets/offline.svg?react';
import Empty from '@/assets/empty.svg?react';
import Loading from '@/assets/loading.svg?react';

interface ExceptionProps {
  type?: 'not-found' | 'ban' | 'error' | 'offline' | 'empty' | 'loading';
  className?: string;
}

const Exception: React.FC<ExceptionProps> = ({
  type = 'not-found',
  className
}) => {
  return (
    <div className={cn('size-full flex items-center justify-center')}>
      {type === 'not-found' && (
        <NotFound className={cn('w-full h-60 md:h-75', className)} />
      )}
      {type === 'ban' && (
        <Ban className={cn('w-full h-60 md:h-75', className)} />
      )}
      {type === 'error' && (
        <Error className={cn('w-full h-60 md:h-75', className)} />
      )}
      {type === 'offline' && (
        <Offline className={cn('w-full h-60 md:h-75', className)} />
      )}
      {type === 'empty' && (
        <Empty className={cn('w-full h-60 md:h-75', className)} />
      )}
      {type === 'loading' && (
        <Loading className={cn('w-full h-60 md:h-75', className)} />
      )}
    </div>
  );
};

Exception.displayName = 'Exception';

export default Exception;
