import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// tsconfig의 paths와 같은 별칭. app이 root로 이동하며 @app이 추가됐다.
// inline project는 자체 Vite 설정이라 resolve를 상속하지 않으므로 각 project에 넘긴다.
const alias = {
  '@app': fileURLToPath(new URL('./app', import.meta.url)),
  '@': fileURLToPath(new URL('./src', import.meta.url)),
}

// 환경은 파일 확장자로 가르는 것이 기본이고, 어긋나는 파일은 여기가 아니라
// 파일 상단의 @vitest-environment docblock으로 예외를 선언한다.
// 경로로 예외를 걸면 파일이 이동했을 때 예외가 조용히 풀린다(실제로 한 번 겪었다).

// MSW 서버의 listen/reset/close를 담당한다. 두 project 모두 필요하다.
const setupFiles = ['./vitest.setup.ts']

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          setupFiles,
          include: [
            'src/**/*.test.ts',
            // Route Handler 테스트는 app/ 아래에 있다. src만 보면 0개가 잡힌다.
            'app/**/*.test.ts',
          ],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          setupFiles,
          // MSW는 상대 경로 요청을 document.location 기준으로 절대화한다.
          // node 환경에는 location이 없으므로 여기서 base URL을 명시한다.
          environmentOptions: {
            jsdom: { url: 'http://localhost:3000' },
          },
          include: ['src/**/*.test.tsx'],
        },
      },
    ],
  },
})
