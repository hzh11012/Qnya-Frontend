import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * @title 需要认证的路由守卫组件
 */
const RequireAuth: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      const redirectPath = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, {
        replace: true
      });
    }
  }, [isAuthenticated, navigate, location]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

const RedirectIfAuthenticated: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      // 获取重定向地址，默认首页
      const params = new URLSearchParams(location.search);
      const raw = params.get('redirect') || '/';
      // 仅允许站内相对路径，防止开放重定向攻击
      const redirectTo =
        raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export { RequireAuth, RedirectIfAuthenticated };
