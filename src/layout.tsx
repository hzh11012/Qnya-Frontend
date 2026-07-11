import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/custom/sidebar/app-sidebar';
import { HeaderInset, HeaderProvider } from '@/components/ui/header';
import AppHeader from '@/components/custom/header/app-header';

const Layout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderProvider>
          <AppHeader className='px-4.5 md:px-8 justify-between' />
          <HeaderInset className='md:max-w-441 md:mx-auto md:px-8 px-4 transition-[max-width,padding,margin] duration-200'>
            <Outlet />
          </HeaderInset>
        </HeaderProvider>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
