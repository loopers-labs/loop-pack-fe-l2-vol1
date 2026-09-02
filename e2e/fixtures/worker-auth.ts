import { test as base } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * worker 당 계정 하나 · storageState 파일 하나.
 *
 * `test.info().parallelIndex` 로 계정(`looper{n+1}@loopers.dev`, 비밀번호는 전부
 * `looper1234`)과 저장 파일(`.auth/worker-{n}.json`)을 파생시킨다. 같은 워커에서 도는
 * 모든 테스트가 이 fixture 를 공유해 로그인 API 를 한 번만 호출한다.
 *
 * `.auth/` 를 비우는 일은 여기서 하지 않는다. 워커 여러 개가 동시에 이 fixture 를
 * 처음 돌리면 서로의 파일을 지우는 경쟁이 생기기 때문이다 — 1회성 정리는
 * `playwright.config.ts` 에 등록한 `globalSetup` 이 맡는다(모든 워커가 뜨기 전에 한 번만).
 *
 * 로그인은 API 로 한다(`context.request.post`). 화면을 통해 로그인하는 흐름 자체는
 * `e2e/auth-flow.spec.ts` 가 검증하므로, 여기서는 "로그인된 상태"만 값싸게 만들면 된다.
 */
const AUTH_DIR = path.join(__dirname, '..', '..', '.auth');
const PASSWORD = 'looper1234';

type WorkerFixtures = {
  workerStorageState: string;
};

export const test = base.extend<object, WorkerFixtures>({
  // 내장 storageState 옵션 fixture 를 worker fixture 가 만든 파일로 덮는다.
  // (Playwright 공식 문서의 "worker 당 로그인" 패턴과 같은 형태다.)
  //
  // 두 번째 인자 이름을 Playwright 관례인 `use` 대신 `provide` 로 둔다. 이름만 다를 뿐
  // 동작은 같다 — `eslint-plugin-react-hooks` 가 `use(...)` 호출을 React 의 `use` 훅으로
  // 오인해 rules-of-hooks 를 걸기 때문에, React 와 무관한 이 콜백에서는 이름을 피한다.
  storageState: ({ workerStorageState }, provide) => provide(workerStorageState),

  workerStorageState: [
    async ({ browser }, provide, workerInfo) => {
      const email = `looper${workerInfo.parallelIndex + 1}@loopers.dev`;
      const authFile = path.join(AUTH_DIR, `worker-${workerInfo.parallelIndex}.json`);

      fs.mkdirSync(AUTH_DIR, { recursive: true });

      // baseURL 은 test 스코프 옵션이라 worker fixture 에서 인자로 못 받는다.
      // workerInfo.project.use 에 같은 값이 있어 여기서는 이걸로 가져온다.
      const context = await browser.newContext({ baseURL: workerInfo.project.use.baseURL });
      const response = await context.request.post('/api/auth/login', {
        data: { email, password: PASSWORD },
      });

      if (!response.ok()) {
        throw new Error(`worker 인증용 로그인 실패: ${email} → ${response.status()}`);
      }

      await context.storageState({ path: authFile });
      await context.close();

      await provide(authFile);
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';
