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
      '@': path.resolve(import.meta.dirname, './src')
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
      },
      // 放映室 Socket.IO：握手（HTTP polling）与 WebSocket 升级都走 /socket.io
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        ws: true
      },
      // HLS 媒体库同源反代：外部存储不带 CORS 头时，hls.js 用 XHR 取
      // m3u8/ts 会被浏览器拦死，转发一层就变同源，无需对方改配置
      // 生产由 nginx.conf 的 /hls/ 承担同样职责，剧集地址统一存 /hls/ 开头
      '/hls': {
        target: 'https://s3.qnets.cn',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/hls/, '')
      }
    }
  }
}));
