import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/custom/sidebar/app-sidebar';
import { HeaderInset, HeaderProvider } from '@/components/ui/header';
import AppHeader from '@/components/custom/header/app-header';
import AppFooter from '@/components/custom/sidebar/app-footer';
import FloatingActions from '@/components/custom/floating-actions';

const Layout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderProvider>
          <AppHeader className='px-4.5 md:px-8 justify-between' />
          {/* min-w 限位：极窄屏下内容不被挤压错乱，宁可整体横向滚动 */}
          <HeaderInset className='min-w-80 md:max-w-441 md:mx-auto md:px-8 px-4 transition-[max-width,padding,margin] duration-200'>
            <Outlet />
          </HeaderInset>
          <AppFooter />
          <FloatingActions />
        </HeaderProvider>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
