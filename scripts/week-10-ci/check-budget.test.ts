import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync } from 'node:zlib';

import { afterAll, expect, it } from 'vitest';

// CI·Vercel 빌드가 실제로 호출하는 명령의 종료 코드와 공개 출력을 검증한다.
const SCRIPT_PATH = fileURLToPath(
  new URL('./check-budget.mjs', import.meta.url),
);

// size-limit CLI 기동을 포함하는 spawn이라 기본 5초로는 부족하다.
const TIMEOUT = { timeout: 30_000 };

const CHUNKS = {
  root: 'console.log("root chunk");'.repeat(40),
  home: 'console.log("home page chunk");'.repeat(30),
  products: 'console.log("products page chunk");'.repeat(35),
};

// .size-limit.mjs와 같은 집계(파일별 Brotli q11 합산)로 기대값을 계산한다.
const brotli = (content: string) => brotliCompressSync(content).length;
const SIZE = {
  home: brotli(CHUNKS.root) + brotli(CHUNKS.home),
  products: brotli(CHUNKS.root) + brotli(CHUNKS.products),
  shared: brotli(CHUNKS.root),
};

const manifestScript = (routeKey: string, segmentKey: string, chunk: string) =>
  `globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};
globalThis.__RSC_MANIFEST[${JSON.stringify(routeKey)}] = {
  entryJSFiles: { ${JSON.stringify(segmentKey)}: [${JSON.stringify(chunk)}] },
};`;

const fixtures: string[] = [];

const makeFixture = () => {
  const root = mkdtempSync(join(tmpdir(), 'check-budget-'));
  fixtures.push(root);

  const chunksDir = join(root, '.next/static/chunks');
  mkdirSync(chunksDir, { recursive: true });
  writeFileSync(join(chunksDir, 'root.js'), CHUNKS.root);
  writeFileSync(join(chunksDir, 'home.js'), CHUNKS.home);
  writeFileSync(join(chunksDir, 'products.js'), CHUNKS.products);

  writeFileSync(
    join(root, '.next/build-manifest.json'),
    JSON.stringify({
      rootMainFiles: ['static/chunks/root.js'],
      polyfillFiles: [],
    }),
  );

  const appDir = join(root, '.next/server/app/(commerce)');
  mkdirSync(join(appDir, 'products'), { recursive: true });
  writeFileSync(
    join(appDir, 'page_client-reference-manifest.js'),
    manifestScript(
      '/(commerce)/page',
      '[project]/src/app/(commerce)/page',
      'static/chunks/home.js',
    ),
  );
  writeFileSync(
    join(appDir, 'products/page_client-reference-manifest.js'),
    manifestScript(
      '/(commerce)/products/page',
      '[project]/src/app/(commerce)/products/page',
      'static/chunks/products.js',
    ),
  );

  return root;
};

const writeLimits = (root: string, limits: Record<string, number>): string => {
  const path = join(root, 'limits.json');
  writeFileSync(path, JSON.stringify(limits));

  return path;
};

const FULL_LIMITS = {
  'home-initial-js': SIZE.home,
  'products-initial-js': SIZE.products,
  'shared-js': SIZE.shared,
};

// baselinePath에 null을 주면 BUDGET_BASELINE_FILE 없이 — CI와 같은 기본 경로로 — 돌린다.
const runCheckBudget = (
  root: string,
  limitsPath: string,
  baselinePath: string | null = join(root, 'no-baseline.json'),
  extraEnv: Record<string, string> = {},
) => {
  const result = spawnSync(process.execPath, [SCRIPT_PATH], {
    encoding: 'utf8',
    env: {
      ...process.env,
      BUDGET_ROOT: root,
      BUDGET_LIMITS_FILE: limitsPath,
      ...(baselinePath === null ? {} : { BUDGET_BASELINE_FILE: baselinePath }),
      GITHUB_STEP_SUMMARY: '',
      ...extraEnv,
    },
  });

  return { status: result.status, output: result.stdout + result.stderr };
};

const writeBaseline = (
  root: string,
  sizes: Record<string, number>,
  sha = 'c0ffee1234567890',
): string => {
  const path = join(root, 'baseline.json');
  writeFileSync(
    path,
    JSON.stringify({
      sha,
      rows: Object.entries(sizes).map(([id, size]) => ({ id, size })),
    }),
  );

  return path;
};

// summary와 PR 코멘트가 함께 쓰는 결과 파일.
const budgetReport = (root: string) =>
  readFileSync(join(root, 'reports/budget.md'), 'utf8');

afterAll(() => {
  for (const root of fixtures) rmSync(root, { recursive: true, force: true });
});

it('모든 대상이 임계값 이하면 통과한다', TIMEOUT, () => {
  const root = makeFixture();
  const limits = writeLimits(
    root,
    Object.fromEntries(
      Object.entries(FULL_LIMITS).map(([id, size]) => [id, size + 10]),
    ),
  );

  const { status, output } = runCheckBudget(root, limits);

  expect(status).toBe(0);
  expect(output).toContain('번들 예산: PASS');
});

it('측정값과 임계값이 같으면 통과한다', TIMEOUT, () => {
  const root = makeFixture();
  const limits = writeLimits(root, FULL_LIMITS);

  const { status, output } = runCheckBudget(root, limits);

  expect(status).toBe(0);
  expect(output).toContain('번들 예산: PASS');
});

it('임계값을 초과하면 실패하고 초과량과 초과율을 표시한다', TIMEOUT, () => {
  const root = makeFixture();
  const limits = writeLimits(root, {
    ...FULL_LIMITS,
    'home-initial-js': SIZE.home - 1,
  });

  const { status, output } = runCheckBudget(root, limits);

  expect(status).toBe(1);
  expect(output).toContain('번들 예산: FAIL');
  expect(output).toContain('초과 1 B');
  expect(output).toContain('%');
  // PR 코멘트는 이 파일을 그대로 싣는다 — 표시하려고 다시 측정하지 않기 위한 계약이다.
  expect(output).toContain(budgetReport(root).trim());
});

it('매니페스트가 가리키는 파일이 없으면 실패한다', TIMEOUT, () => {
  const root = makeFixture();
  const limits = writeLimits(root, FULL_LIMITS);
  rmSync(join(root, '.next/static/chunks/home.js'));

  const { status, output } = runCheckBudget(root, limits);

  expect(status).toBe(1);
  expect(output).toContain('번들 예산: 미측정');
  expect(output).toContain('home.js');
  // 미측정 사유도 코멘트가 그대로 싣는다 — 선행 실패가 원인 없는 침묵이 되지 않게.
  expect(budgetReport(root)).toContain('home.js');
});

it('빌드 산출물이 없으면 실패한다', TIMEOUT, () => {
  const root = mkdtempSync(join(tmpdir(), 'check-budget-empty-'));
  fixtures.push(root);
  const limits = writeLimits(root, FULL_LIMITS);

  const { status, output } = runCheckBudget(root, limits);

  expect(status).toBe(1);
  expect(output).toContain('번들 예산: 미측정');
});

it(
  'main 기준선이 있으면 base 대비 증가량과 기준 SHA를 표시한다',
  TIMEOUT,
  () => {
    const root = makeFixture();
    const limits = writeLimits(root, FULL_LIMITS);
    const baseline = writeBaseline(root, {
      'home-initial-js': SIZE.home - 1000,
      'products-initial-js': SIZE.products,
    });

    const { status, output } = runCheckBudget(root, limits, baseline);

    expect(status).toBe(0);
    expect(output).toContain('+1,000 B');
    expect(output).toContain('변화 없음');
    // 기준선에 없는 대상은 증가량을 지어내지 않는다.
    expect(output).toContain('기준선 없음');
    expect(output).toContain('main `c0ffee1`');
  },
);

it('main 기준선이 없으면 증가량 열 없이 판정만 한다', TIMEOUT, () => {
  const root = makeFixture();
  const limits = writeLimits(root, FULL_LIMITS);

  const { status, output } = runCheckBudget(root, limits);

  expect(status).toBe(0);
  expect(output).toContain('base 기준선이 없어 증가량은 비교하지 않았다');
  expect(output).not.toContain('base 대비');
});

// 소비 측 테스트는 손으로 적은 기준선을 읽으므로, 생산 측에서 sha까지 단언해야
// "생산자가 sha를 안 써도 양쪽 다 초록"인 구멍이 막힌다.
it('다음 PR의 기준선으로 쓸 측정값과 기준 SHA를 남긴다', TIMEOUT, () => {
  const root = makeFixture();
  const limits = writeLimits(root, FULL_LIMITS);

  const { status } = runCheckBudget(root, limits, undefined, {
    GITHUB_SHA: 'c0ffee1234567890',
  });
  const saved = JSON.parse(
    readFileSync(join(root, 'reports/budget.json'), 'utf8'),
  ) as { sha: string; rows: { id: string; size: number }[] };

  expect(status).toBe(0);
  expect(saved.sha).toBe('c0ffee1234567890');
  expect(saved.rows).toEqual([
    { id: 'home-initial-js', size: SIZE.home },
    { id: 'products-initial-js', size: SIZE.products },
    { id: 'shared-js', size: SIZE.shared },
  ]);
});

// CI는 캐시를 `baseline/`에 풀고 BUDGET_BASELINE_FILE을 넘기지 않는다 —
// 기본 경로가 quality.yml의 cache path와 어긋나면 증가량이 조용히 사라진다.
it('기본 경로의 기준선도 읽는다', TIMEOUT, () => {
  const root = makeFixture();
  const limits = writeLimits(root, FULL_LIMITS);
  mkdirSync(join(root, 'baseline'), { recursive: true });
  writeFileSync(
    join(root, 'baseline/budget.json'),
    JSON.stringify({
      sha: 'deadbeef0000',
      rows: [{ id: 'home-initial-js', size: SIZE.home - 500 }],
    }),
  );

  const { status, output } = runCheckBudget(root, limits, null);

  expect(status).toBe(0);
  expect(output).toContain('+500 B');
  expect(output).toContain('main `deadbee`');
});

it('임계값이 누락된 대상이 있으면 실패한다', TIMEOUT, () => {
  const root = makeFixture();
  const limits = writeLimits(root, {
    'home-initial-js': SIZE.home,
    'products-initial-js': SIZE.products,
  });

  const { status, output } = runCheckBudget(root, limits);

  expect(status).toBe(1);
  expect(output).toContain('임계값 누락');
  expect(output).toContain('shared-js');
});
