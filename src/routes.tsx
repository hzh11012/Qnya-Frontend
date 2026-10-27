import {
  createBrowserRouter,
  Outlet,
  type RouteObject
} from 'react-router-dom';
import { createLazyComponent } from '@/lib/utils';
import Exception from '@/components/custom/exception';
import Loading from '@/components/custom/loading';
import Layout from '@/layout';
import {
  RequireAuth,
  RequireRole,
  RedirectIfAuthenticated
} from '@/components/custom/auth/auth-guard';
import { AuthProvider } from '@/components/custom/auth/auth-provider';

const staticRoutes: RouteObject[] = [
  {
    // 路由模块 lazy 加载期间的全屏兜底（同时消除 HydrateFallback 警告）
    hydrateFallbackElement: <Loading />,
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      {
        path: '/login',
        element: (
          <RedirectIfAuthenticated>
            <Outlet />
          </RedirectIfAuthenticated>
        ),
        errorElement: <Exception type='error' />,
        children: [
          {
            index: true,
            lazy: createLazyComponent(() => import('@/pages/login/index'))
          }
        ]
      },
      {
        path: '/anime/:videoId',
        // 播放页需普通用户及以上；未登录跳登录页，游客角色渲染 403 承载页
        element: (
          <RequireRole minRole='user'>
            <Outlet />
          </RequireRole>
        ),
        errorElement: <Exception type='error' />,
        children: [
          {
            index: true,
            lazy: createLazyComponent(() => import('@/pages/anime/index'))
          }
        ]
      },
      {
        path: '/',
        // 前台整站需登录；未登录渲染 403 承载页（提供登录入口）
        Component: () => (
          <RequireAuth>
            <Layout />
          </RequireAuth>
        ),
        errorElement: <Exception type='error' />,
        children: [
          {
            index: true,
            lazy: createLazyComponent(() => import('@/pages/home/index'))
          },
          {
            path: 'search',
            lazy: createLazyComponent(() => import('@/pages/search/index'))
          },
          {
            path: 'topic',
            lazy: createLazyComponent(() => import('@/pages/topic/index'))
          },
          {
            path: 'topic/:id',
            lazy: createLazyComponent(
              () => import('@/pages/topic/topic-detail')
            )
          },
          {
            path: 'rank',
            lazy: createLazyComponent(() => import('@/pages/hot/index'))
          },
          {
            path: 'bangumi',
            lazy: createLazyComponent(() => import('@/pages/bangumi/index'))
          },
          {
            path: 'mine',
            // 个人中心仅需登录（游客角色可看/改资料，追番/历史区块按角色隐藏）
            lazy: createLazyComponent(() => import('@/pages/mine/index'))
          },
          {
            path: 'settings',
            lazy: createLazyComponent(() => import('@/pages/settings/index'))
          },
          {
            path: '*',
            element: <Exception />
          }
        ]
      }
    ]
  }
];

const router = createBrowserRouter(staticRoutes);

export default router;
