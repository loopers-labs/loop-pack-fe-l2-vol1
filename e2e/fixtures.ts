import path from 'path';
import { mkdirSync } from 'fs';
import { test as base, expect } from '@playwright/test';

// [AI] week-09 4-1: 워커별 storageState 격리.
// 계정 8개(looper1~8) × 저장 파일 8개(worker-0~7.json)를 auth.setup.ts가 미리 만들고,
// 각 워커는 workerIndex로 자기 파일 하나만 쓴다 — 워커 × 저장 파일 1:1.
// 8을 넘는 워커는 파일을 순환 재사용하지만, storageState는 읽어온 복사본이라
// 컨텍스트(쿠키 자리)가 워커마다 분리되어 있어 세션 간 오염은 없다.

const AUTH_DIR = path.join(__dirname, '.auth');
export const WORKER_ACCOUNT_COUNT = 8;

export const workerStorageState = (workerIndex: number): string =>
  path.join(AUTH_DIR, `worker-${workerIndex % WORKER_ACCOUNT_COUNT}.json`);

mkdirSync(AUTH_DIR, { recursive: true });

// [AI] 로그인 상태가 필요한 스펙은 @playwright/test 대신 이 test를 import한다.
// storageState 픽스처를 워커 인덱스 기반 파일로 덮어쓴다.

export const test = base.extend({
  storageState: async (_args, use, workerInfo) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- 동일 사유
    await use(workerStorageState(workerInfo.workerIndex));
  },
});

export { expect };
