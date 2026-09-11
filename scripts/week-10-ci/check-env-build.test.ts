import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, expect, it } from 'vitest';

// 실제 Next CLI가 저장소의 config를 읽는 연결을 검사한다. 앱 번들 자체는 기존 build job이 검사한다.
const BUILD_CWD = mkdtempSync(join(tmpdir(), 'env-next-build-'));
const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
cpSync(join(REPO_ROOT, 'next.config.ts'), join(BUILD_CWD, 'next.config.ts'));
mkdirSync(join(BUILD_CWD, 'src/env'), { recursive: true });
cpSync(
  join(REPO_ROOT, 'src/env/validate.ts'),
  join(BUILD_CWD, 'src/env/validate.ts'),
);
symlinkSync(
  join(REPO_ROOT, 'node_modules'),
  join(BUILD_CWD, 'node_modules'),
  'dir',
);
mkdirSync(join(BUILD_CWD, 'app'));
writeFileSync(join(BUILD_CWD, 'package.json'), '{"private":true}');
writeFileSync(
  join(BUILD_CWD, 'app/layout.js'),
  'export default function Layout({children}) { return <html><body>{children}</body></html>; }',
);
writeFileSync(
  join(BUILD_CWD, 'app/page.js'),
  'export default function Page() { return <main>env build test</main>; }',
);
afterAll(() => rmSync(BUILD_CWD, { recursive: true, force: true }));

function runNextBuild(env: Record<string, string>) {
  // 임시 앱 밖 node_modules symlink를 허용하는 Webpack으로 config 실행 경계만 격리한다.
  return spawnSync(
    process.execPath,
    [join(REPO_ROOT, 'node_modules/next/dist/bin/next'), 'build', '--webpack'],
    {
      cwd: BUILD_CWD,
      env: {
        PATH: process.env.PATH,
        HOME: BUILD_CWD,
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1',
        ...env,
      },
      encoding: 'utf8',
      timeout: 60_000,
    },
  );
}

it('실제 next build는 런타임 시크릿 없이 빌드 산출물을 만든다', () => {
  const result = runNextBuild({ APP_ORIGIN: 'http://localhost:3000' });
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(result.stdout).toContain('Compiled successfully');
}, 65_000);

it.each([
  ['origin 오류', { APP_ORIGIN: 'ftp://commerce.example' }, 'APP_ORIGIN'],
  [
    '비밀 공개 변수',
    {
      APP_ORIGIN: 'http://localhost:3000',
      NEXT_PUBLIC_AUTH_SESSION_SECRET: 'must-not-leak',
    },
    'NEXT_PUBLIC_AUTH_SESSION_SECRET',
  ],
] satisfies [string, Record<string, string>, string][])(
  '실제 next build는 %s를 config에서 거부하고 빌드를 중단한다',
  (_, env, field) => {
    const result = runNextBuild(env);
    const output = result.stdout + result.stderr;
    expect(result.status, output).toBe(1);
    expect(output).toContain('env 검증 실패(build/local)');
    expect(output).toContain(field);
    expect(output).not.toContain('Compiled successfully');
    expect(output).not.toContain('must-not-leak');
  },
  65_000,
);
