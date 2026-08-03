import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // tsconfig의 paths와 같은 별칭을 유지한다. app이 root로 이동하며 @app이 추가됐다.
      '@app': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // Route Handler 테스트는 app/ 아래에 있다. src만 보면 0개가 잡힌다.
    include: ['src/**/*.test.ts', 'app/**/*.test.ts'],
  },
})
