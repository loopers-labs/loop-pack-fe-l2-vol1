import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
};

/**
 * 환경을 두 프로젝트로 나눈다. 명령은 여전히 `vitest run` 하나다.
 *
 * 전부 jsdom 으로 돌려도 통과는 하지만, DOM 이 필요 없는 테스트까지 매번 브라우저 흉내
 * 환경과 MSW 서버를 세우게 된다. 테스트가 늘수록 이 비용이 쌓인다.
 *
 * vitest 4 에는 environmentMatchGlobs 가 없다(3.x 에서 deprecated 후 제거). 그래서
 * 파일 단위 환경 지정은 projects 아니면 파일 상단 docblock 뿐인데, docblock 은
 * setupFiles 를 프로젝트별로 나눌 수 없어 위 비용을 그대로 낸다.
 *
 * 나누는 기준은 확장자가 아니라 `*.dom.test.*` 접미사다. examples/week-07 의
 * HeroSection.test.tsx 는 .tsx 지만 renderToStaticMarkup 으로 문자열만 비교해
 * DOM 이 필요 없다 — 확장자로 나누면 이 파일이 잘못 분류된다.
 */
export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.dom.test.{ts,tsx}'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/**/*.dom.test.{ts,tsx}'],
          setupFiles: ['./src/test/setup.dom.ts'],
          // apiClient 는 브라우저 분기에서 상대경로 '/api' 를 쓴다. jsdom 기본 URL 인
          // about:blank 에서는 상대경로가 해석되지 않아 MSW 가 요청을 받지 못한다.
          environmentOptions: { jsdom: { url: 'http://localhost:3000' } },
        },
      },
    ],
  },
});
