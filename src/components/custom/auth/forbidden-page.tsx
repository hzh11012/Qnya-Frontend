import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Exception from '@/components/custom/exception';

/**
 * @title 403 无权限承载页
 * @description 已登录但角色权限不足时整页渲染，提供返回首页入口
 */
const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className='size-full flex flex-col items-center justify-center gap-6 pb-20'>
      <div className='h-60 md:h-75 w-full max-w-125 flex items-center justify-center'>
        <Exception type='ban' />
      </div>
      <p className='text-muted-foreground text-sm'>
        当前账号权限不足，无法访问该页面
      </p>
      <Button onClick={() => navigate('/', { replace: true })}>返回首页</Button>
    </div>
  );
};

export default ForbiddenPage;
