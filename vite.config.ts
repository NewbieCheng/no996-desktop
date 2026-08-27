import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// dev:web 开发预览（浏览器打开，可调 API）；build:web 产出 dist/renderer 供 Electron 加载
export default defineConfig({
  plugins: [react()],
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5273,
    strictPort: true,
    proxy: {
      // 开发预览时把 API 请求代理到本地 Go 后端（scripts/dev.ps1 启动，默认 8080）
      '/api': {
        target: process.env.NO996_API_ORIGIN ?? 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
});