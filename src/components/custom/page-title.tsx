import { cn } from '@/lib/utils';

/** 页面级标题（h1），列表页/详情页通用 */
const PageTitle: React.FC<React.ComponentProps<'h1'>> = ({
  className,
  ...props
}) => {
  return (
    <h1
      className={cn('text-base font-bold leading-9 text-foreground', className)}
      {...props}
    />
  );
};

export default PageTitle;
