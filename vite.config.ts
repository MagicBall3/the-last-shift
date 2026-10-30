import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // host: true — чтобы открыть dev-сервер с телефона по адресу в локальной сети
  server: { host: true, port: 5173 },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      // Three.js — отдельный чанк: меню и загрузочный экран не ждут движок
      output: { manualChunks: { three: ['three'] } },
    },
  },
});
