import { test as base } from '@playwright/test';
import path from 'node:path';
import { accounts } from './accounts';

type WorkerFixtures = {
  // 이 워커가 쓸 계정. auth.setup.ts가 파일을 만든 규칙과 똑같이
  // "워커 인덱스 % 8"로 골라야 계정과 storageState 파일이 서로 맞는다.
  account: (typeof accounts)[number];
};

export const test = base.extend<object, WorkerFixtures>({
  account: [
    async ({}, use, workerInfo) => {
      await use(accounts[workerInfo.parallelIndex % accounts.length]);
    },
    { scope: 'worker' },
  ],

  // 내장 storageState를 오버라이드하지만 로그인 자체는 하지 않는다.
  // 로그인은 auth.setup.ts(별도 setup 프로젝트)가 이미 다 해뒀고, 여기서는
  // 이 워커가 그중 어느 파일을 읽을지만 워커 인덱스로 고른다 — 오버라이드
  // 범위를 "파일 경로 선택"으로만 좁혀서, 로그인 로직은 한 곳(setup)에만
  // 남긴다.
  //
  // scope는 worker가 아니라 test다 — Playwright의 내장 storageState 자체가
  // test 스코프로 고정돼 있어 worker로 오버라이드하면 타입 에러가 난다.
  // 다만 매번 하는 일이 워커 인덱스로 문자열 하나 계산하는 것뿐이라(실제
  // 로그인은 이미 setup에서 끝났으므로) test 스코프여도 비용은 무시할 만하다.
  storageState: [
    async ({}, use, workerInfo) => {
      const index = workerInfo.parallelIndex % accounts.length;
      await use(path.resolve(`.auth/worker-${index}.json`));
    },
    { scope: 'test' },
  ],
});

export { expect } from '@playwright/test';
