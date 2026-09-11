import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, expect, it } from 'vitest';

// CI가 실제로 부르는 명령을 그대로 실행하고 GITHUB_OUTPUT을 읽는다.
// 기대값은 손으로 적은 진리표다 — 같은 조건문으로 다시 계산하면 중복이 테스트로 자리만 옮긴다.
const SCRIPT = fileURLToPath(
  new URL('./decide-e2e-scope.mjs', import.meta.url),
);
const cwd = mkdtempSync(join(tmpdir(), 'decide-e2e-scope-'));

afterAll(() => rmSync(cwd, { recursive: true, force: true }));

const decide = (overrides: Record<string, string> = {}) => {
  const outputPath = join(cwd, `output-${Math.random()}`);
  const result = spawnSync(process.execPath, [SCRIPT], {
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      NODE_ENV: 'test',
      EVENT_NAME: 'pull_request',
      CHANGES_RESULT: 'success',
      BASE_REF: 'main',
      IS_DRAFT: 'false',
      RUNTIME: 'true',
      GITHUB_OUTPUT: outputPath,
      ...overrides,
    },
  });
  const outputs = Object.fromEntries(
    readFileSync(outputPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf('=');

        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );

  return { status: result.status, outputs, output: result.stdout };
};

// base × draft × runtime 8조합. core는 main·non-draft·런타임일 때만 true다.
it.each([
  ['main', 'false', 'true', 'true'],
  ['main', 'false', 'false', 'false'],
  ['main', 'true', 'true', 'false'],
  ['main', 'true', 'false', 'false'],
  ['develop', 'false', 'true', 'false'],
  ['develop', 'false', 'false', 'false'],
  ['develop', 'true', 'true', 'false'],
  ['develop', 'true', 'false', 'false'],
])(
  'base %s · draft %s · runtime %s인 PR이면 핵심 E2E는 %s다',
  (baseRef, isDraft, runtime, core) => {
    const { status, outputs } = decide({
      BASE_REF: baseRef,
      IS_DRAFT: isDraft,
      RUNTIME: runtime,
    });

    expect(status).toBe(0);
    expect(outputs.core).toBe(core);
    expect(outputs.full).toBe('false');
    expect(outputs.browsers).toBe(core);
  },
);

it('핵심 E2E를 생략하면 생략한 조건을 모두 이유로 남긴다', () => {
  const { outputs, output } = decide({
    BASE_REF: 'develop',
    IS_DRAFT: 'true',
    RUNTIME: 'false',
  });

  expect(outputs.reason).toBe(
    'main 외 브랜치 대상(base: develop); draft PR; 문서 전용 변경',
  );
  expect(output).toContain('E2E: 의도적 생략');
});

it('변경 판별이 실패하면 핵심 E2E를 판정 불가로 두고 실행하지 않는다', () => {
  const { outputs, output } = decide({ CHANGES_RESULT: 'failure' });

  expect(outputs.core).toBe('false');
  expect(outputs.full).toBe('false');
  expect(outputs.reason).toContain('변경 판별 실패(failure)');
  expect(output).toContain('E2E: 실행 불가');
});

// PR 외 이벤트에서 workflow가 실제로 넘기는 값 — changes job이 skip되고
// base_ref·draft·runtime은 빈 문자열이다. 이 조합으로 돌려야 분기 순서 변경을 잡는다.
const NON_PR_INPUTS = {
  BASE_REF: '',
  IS_DRAFT: '',
  RUNTIME: '',
  CHANGES_RESULT: 'skipped',
};

it('main push면 전체 E2E를 실행하고 정기 측정은 하지 않는다', () => {
  const { outputs } = decide({ EVENT_NAME: 'push', ...NON_PR_INPUTS });

  expect(outputs.full).toBe('true');
  expect(outputs.core).toBe('false');
  expect(outputs.browsers).toBe('true');
  expect(outputs.periodic).toBe('false');
});

it.each(['schedule', 'workflow_dispatch'])(
  '%s면 전체 E2E와 정기 측정을 함께 실행한다',
  (eventName) => {
    const { outputs } = decide({ EVENT_NAME: eventName, ...NON_PR_INPUTS });

    expect(outputs.full).toBe('true');
    expect(outputs.periodic).toBe('true');
  },
);

it('GITHUB_OUTPUT이 없으면 판정을 남기지 못한 채 실패한다', () => {
  const result = spawnSync(process.execPath, [SCRIPT], {
    encoding: 'utf8',
    timeout: 10_000,
    env: { NODE_ENV: 'test', EVENT_NAME: 'pull_request' },
  });

  expect(result.status).toBe(1);
  expect(result.stderr).toContain('GITHUB_OUTPUT이 없다');
});
