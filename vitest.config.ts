import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

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
          exclude: [
            ...configDefaults.exclude,
            'src/**/*.integration.test.{ts,tsx}',
          ],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'jsdom',
          environmentOptions: {
            jsdom: {
              url: 'http://localhost:3000',
            },
          },
          include: ['src/**/*.integration.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup/integration.ts'],
        },
      },
    ],
  },
})
