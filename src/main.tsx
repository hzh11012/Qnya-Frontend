import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/components/custom/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import router from '@/routes';
import '@/style/global.css';
import '@/style/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 短缓存换取返回页面时秒开，不重复请求
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        storageKey='qnya-theme'
        disableTransitionOnChange
      >
        <RouterProvider router={router} />
        <Toaster position='top-right' />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
