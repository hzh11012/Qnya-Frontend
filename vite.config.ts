import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()]
    }),
    tailwindcss(),
    svgr({ include: './src/assets/*.svg?react' }),
    // 仅在 pnpm analyze（ANALYZE=true）时生成并打开依赖分析报告
    ...(process.env.ANALYZE
      ? [visualizer({ open: true, gzipSize: true, filename: 'stats.html' })]
      : [])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    // 这里配置了代理，需要配合后端的set-cookie的domain
    host: 'localhost',
    port: 5000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        ws: true
      }
    }
  }
}));
