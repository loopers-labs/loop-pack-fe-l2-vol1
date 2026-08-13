import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// 환경은 파일 확장자가 선언한다. `.test.ts`는 node, `.test.tsx`는 jsdom이다.
// DOM이 필요한 테스트는 React를 그리므로 거의 다 JSX를 쓴다. 규약과 실제가 이미 일치해서
// 파일마다 주석이나 별도 접미사를 붙이지 않아도 된다.
// DOM이 필요한데 JSX가 없는 파일(renderHook만 쓰는 경우)은 확장자를 .tsx로 둔다.
// 규약이 조용히 깨지지 않게 `.test.ts`에서 @testing-library import를 ESLint가 막는다.
export default defineConfig({
  plugins: [react()],
  test: {
    // mock API의 고정 지연은 NODE_ENV가 test일 때만 꺼진다. node 환경에서는 이 값이
    // 실행 환경의 값(development)으로 남아, 지연이 그대로 걸려 route 테스트가 30배 느려졌다.
    // jsdom 환경에서는 Vite가 이 표현식을 'test'로 치환해서 증상이 보이지 않았다.
    env: { NODE_ENV: 'test' },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          setupFiles: ['src/test/setup.node.ts'],
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          // 상대 경로 요청이 절대 URL로 해석되는 기준이다. 기본값(localhost:3000이 아닌 값)이면
          // 요청 URL이 실행 환경에 따라 달라져 핸들러 매칭과 로그가 흔들린다.
          environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
          setupFiles: ['src/test/setup.dom.ts'],
          include: ['src/**/*.test.tsx'],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            storybookScript: 'pnpm storybook --no-open',
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
})
