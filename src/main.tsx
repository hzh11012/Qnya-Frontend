import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/components/custom/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import router from '@/routes';
import '@/style/global.css';
import '@/style/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      storageKey='qnya-theme'
      disableTransitionOnChange
    >
      <RouterProvider router={router} />
      <Toaster position='top-right' />
    </ThemeProvider>
  </StrictMode>
);
