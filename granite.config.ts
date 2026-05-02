import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'daily-listen-up',
  brand: {
    displayName: '데일리 리슨업',
    primaryColor: '#3182f6',
    icon: '',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite dev',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});
