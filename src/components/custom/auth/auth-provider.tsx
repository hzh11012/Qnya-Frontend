import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Exception from '@/components/custom/exception';
import useDeferredLoading from '@/hooks/use-deferred-loading';
import { useAuthInit } from '@/hooks/use-auth-init';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 启动时校验登录态并同步 store
  const { isInitialized, setUser } = useAuthInit();
  const showLoading = useDeferredLoading(!isInitialized);

  useEffect(() => {
    const handleUnauthorized = () => {
      // 清除用户状态
      setUser(null);

      // 如果不在登录页，则重定向到登录页
      if (location.pathname !== '/login') {
        const redirectPath = location.pathname + location.search;
        navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, {
          replace: true
        });
      }
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate, location, setUser]);

  if (!isInitialized) {
    return showLoading ? <Exception type='loading' /> : null;
  }

  return <>{children}</>;
};

export { AuthProvider };
