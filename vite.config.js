import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        host: resolve(__dirname, 'host/index.html'),
        projector: resolve(__dirname, 'projector/index.html'),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3005',
      '/media': 'http://localhost:3005',
      '/ws': {
        target: 'ws://localhost:3005',
        ws: true,
      },
    },
  },
});
