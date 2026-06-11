import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { useLocation, useNavigate } from 'react-router-dom';
import Exception from '@/components/custom/exception';
import { useRequest } from 'ahooks';
import { me } from '@/apis';
import { toast } from 'sonner';
import useDeferredLoading from '@/hooks/use-deferred-loading';

interface AuthProviderProps {
  children: React.ReactNode;
}

const useAuthProvider = () => {
  const setUser = useAuthStore(state => state.setUser);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const setInitialized = useAuthStore(state => state.setInitialized);

  const { run } = useRequest(me, {
    onSuccess: user => {
      if (user.role !== 'admin') {
        toast.error('权限不足');
        setUser(null);
      } else {
        setUser(user);
      }
    },
    onError: () => {
      setUser(null);
    },
    onFinally: () => {
      setInitialized(true);
    },
    refreshDeps: [isInitialized],
    refreshDepsAction: () => {
      if (!isInitialized) {
        run();
      }
    }
  });

  return { isInitialized, setUser };
};

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isInitialized, setUser } = useAuthProvider();
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
