import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader
} from '@/components/ui/sidebar';
import Logo from '@/components/custom/logo';
import Navbar from '@/components/custom/sidebar/navbar';
import Mine from '@/components/custom/sidebar/mine';
import ThemeSwitch from '@/components/custom/theme-switch';
import LogOut from '@/components/custom/sidebar/logout';

const AppSideBar: React.FC<React.ComponentProps<typeof Sidebar>> = ({
  ...props
}) => {
  return (
    <Sidebar {...props}>
      <SidebarHeader className='h-17'>
        <Logo type='favicon' />
      </SidebarHeader>
      <SidebarContent>
        <Navbar />
      </SidebarContent>
      <SidebarFooter className='gap-6 pb-8'>
        <Mine />
        <ThemeSwitch />
        <LogOut />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSideBar;
