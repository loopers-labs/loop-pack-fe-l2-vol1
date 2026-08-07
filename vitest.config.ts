import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // e2e/는 Playwright가 실행한다. vitest 기본 include가 `**/*.spec.ts`라
    // 빼두지 않으면 여기서도 물어가 `pnpm check`가 깨진다.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
