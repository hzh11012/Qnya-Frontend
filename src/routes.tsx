import {
  createBrowserRouter,
  Outlet,
  type RouteObject
} from 'react-router-dom';
import { createLazyComponent } from '@/lib/utils';
import Exception from '@/components/custom/exception';
import Fallback from '@/components/custom/fallback';
import Layout from '@/layout';
import {
  RequireAuth,
  RedirectIfAuthenticated
} from '@/components/custom/auth/auth-guard';
import { AuthProvider } from '@/components/custom/auth/auth-provider';

const staticRoutes: RouteObject[] = [
  {
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
        hydrateFallbackElement: <Fallback />,
        errorElement: <Exception type='error' />,
        children: [
          {
            index: true,
            lazy: createLazyComponent(() => import('@/pages/login/index'))
          }
        ]
      },
      {
        path: '/',
        Component: () => (
          <RequireAuth>
            <Layout />
          </RequireAuth>
        ),
        hydrateFallbackElement: <Fallback />,
        errorElement: <Exception type='error' />,
        children: [
          {
            index: true,
            lazy: createLazyComponent(() => import('@/pages/home/index'))
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
