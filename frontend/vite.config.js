import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.js'],
      include: ['tests/**/*.test.{js,jsx}'],
      // Fixed locale/currency so formatted values are the same on every machine
      env: { VITE_CURRENCY: 'USD', TZ: 'UTC' },
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/main.jsx'],
        reporter: ['text', 'html', 'lcov'],
        thresholds: { statements: 70, branches: 70, functions: 70, lines: 70 },
      },
    },
  };
});
