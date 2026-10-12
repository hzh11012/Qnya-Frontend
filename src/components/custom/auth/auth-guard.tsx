import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ForbiddenPage from '@/components/custom/auth/forbidden-page';
import { useAuthStore } from '@/store/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

/** 角色等级（与后端 rbac 保持一致） */
const ROLE_LEVEL = {
  guest: 0,
  user: 1,
  premium: 2,
  admin: 3
} as const;

type RoleCode = keyof typeof ROLE_LEVEL;

/**
 * @title 需要认证的路由守卫组件
 * @description 未登录时跳转登录页（携带回跳地址）
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

interface RequireRoleProps extends AuthGuardProps {
  /** 最低角色要求 */
  minRole: RoleCode;
}

/**
 * @title 需要指定角色的路由守卫组件
 * @description 登录校验复用 RequireAuth；已登录但角色等级不足时渲染 403 承载页
 */
const RequireRole: React.FC<RequireRoleProps> = ({ children, minRole }) => {
  const role = useAuthStore(state => state.user?.role);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (
    isAuthenticated &&
    (ROLE_LEVEL[role ?? 'guest'] ?? 0) < ROLE_LEVEL[minRole]
  ) {
    return <ForbiddenPage />;
  }

  return <RequireAuth>{children}</RequireAuth>;
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

export { RequireAuth, RequireRole, RedirectIfAuthenticated };
