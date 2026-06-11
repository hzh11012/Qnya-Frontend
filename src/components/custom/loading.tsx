import { cn } from '@/lib/utils';
import { RingLoader } from 'react-spinners';

interface loadingProps {
  className?: string;
  size?: number;
}

const Loading: React.FC<loadingProps> = ({ className, size = 50 }) => {
  return (
    <div
      className={cn(
        'fixed top-0 left-0 size-full flex items-center justify-center z-50',
        className
      )}
    >
      <RingLoader
        color='var(--primary)'
        size={size}
        data-testid='loader'
      />
    </div>
  );
};

Loading.displayName = 'Loading';

export default Loading;
