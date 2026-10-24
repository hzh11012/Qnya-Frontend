import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from '@/components/custom/sidebar/app-sidebar';
import { HeaderInset, HeaderProvider } from '@/components/ui/header';
import AppHeader from '@/components/custom/header/app-header';
import AppFooter from '@/components/custom/sidebar/app-footer';
import FloatingActions from '@/components/custom/floating-actions';

const Layout = () => {
  const location = useLocation();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderProvider>
          <AppHeader className='px-4.5 md:px-8 justify-between' />
          {/* min-w 限位：极窄屏下内容不被挤压错乱，宁可整体横向滚动 */}
          <HeaderInset className='min-w-80 md:max-w-441 md:mx-auto md:px-8 px-4 transition-[max-width,padding,margin] duration-200'>
            {/* 路由切换淡入：key 变化触发重挂载 + 一次性 fade-in。
                flex-1 让包装层撑满 HeaderInset，页面根部的 size-full 空态才能垂直居中；
                不加 min-h-0，长内容仍能撑开页面正常滚动 */}
            <div
              key={location.pathname}
              className='flex animate-fade-in flex-1 flex-col'
            >
              <Outlet />
            </div>
          </HeaderInset>
          <AppFooter />
          <FloatingActions />
        </HeaderProvider>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
