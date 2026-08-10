import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.dom.test.tsx'],
          setupFiles: ['./tests/setup/msw.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          environmentOptions: {
            jsdom: {
              url: 'http://localhost:3000',
            },
          },
          include: ['src/**/*.dom.test.tsx'],
          setupFiles: ['./tests/setup/dom.ts'],
        },
      },
    ],
  },
})
