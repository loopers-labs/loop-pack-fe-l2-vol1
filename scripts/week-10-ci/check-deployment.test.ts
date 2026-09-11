import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, expect, it } from 'vitest';

const cwd = mkdtempSync(join(tmpdir(), 'check-deployment-'));
const script = fileURLToPath(
  new URL('./check-deployment.mjs', import.meta.url),
);
const deployment = 'https://env-test.vercel.app';
const token = 'test-token-must-not-be-logged';

// 외부 Vercel 요청만 대체한다. 검사기의 CLI 진입·응답 판정·실패 처리는 실제로 실행한다.
writeFileSync(
  join(cwd, 'pnpm'),
  `#!/usr/bin/env node
const fs = require('node:fs');
fs.writeFileSync(process.env.ARGS_FILE, JSON.stringify(process.argv.slice(2)));
process.stdout.write(process.env.RESPONSE);
process.stderr.write(process.env.CLI_STDERR || '');
process.exit(Number(process.env.CLI_STATUS || 0));
`,
  { mode: 0o755 },
);
afterAll(() => rmSync(cwd, { recursive: true, force: true }));

function runDeployment(
  response: string,
  url: string | undefined = deployment,
  cliStatus = '0',
  cliStderr = '',
) {
  const summary = join(cwd, 'summary.md');
  writeFileSync(summary, '');
  const result = spawnSync(
    process.execPath,
    [script, ...(url === undefined ? [] : [url])],
    {
      cwd,
      env: {
        NODE_ENV: 'test',
        PATH: `${cwd}:${dirname(process.execPath)}`,
        VERCEL_TOKEN: token,
        GITHUB_STEP_SUMMARY: summary,
        ARGS_FILE: join(cwd, 'args.json'),
        RESPONSE: response,
        CLI_STATUS: cliStatus,
        CLI_STDERR: cliStderr,
      },
      encoding: 'utf8',
      timeout: 10_000,
    },
  );

  return {
    status: result.status,
    output: result.stdout + result.stderr,
    summary: readFileSync(summary, 'utf8'),
  };
}

it('실제 명령이 앱의 비로그인 응답을 받으면 성공 종료하고 PASS를 게시한다', () => {
  const result = runDeployment('{"message":"로그인이 필요합니다."}\n401');
  expect(result.status).toBe(0);
  expect(result.output).toContain('배포 후보 검증: PASS');
  expect(result.summary).toContain('HTTP 401·본문 확인');
  // 실제로 실패했던 --token 전달을 막고 보호 우회가 가능한 요청 계약을 지킨다.
  expect(JSON.parse(readFileSync(join(cwd, 'args.json'), 'utf8'))).toEqual([
    'dlx',
    'vercel@59.14.0',
    'curl',
    '/api/auth/me',
    '--deployment',
    deployment,
    '--yes',
    '--',
    '--silent',
    '--show-error',
    '--max-time',
    '30',
    '--write-out',
    '\n%{http_code}',
  ]);
});

it.each([
  [
    '서버 기동 오류',
    '{"error":"FUNCTION_INVOCATION_FAILED"}\n500',
    'HTTP 401이 아니다',
  ],
  [
    '배포 보호 페이지',
    '<html>Authentication Required</html>\n401',
    'JSON이 아니다',
  ],
  [
    '다른 JSON 오류',
    '{"error":"unauthorized"}\n401',
    '앱의 비로그인 응답이 아니다',
  ],
  [
    '잘못된 성공 상태',
    '{"message":"로그인이 필요합니다."}\n200',
    'HTTP 401이 아니다',
  ],
  ['응답 없음', '', 'HTTP 401이 아니다'],
])(
  '%s이면 실제 명령이 실패 종료하고 원인을 게시한다',
  (_, response, reason) => {
    const result = runDeployment(response);
    expect(result.status).toBe(1);
    expect(result.output).toContain(reason);
    expect(result.summary).toContain('배포 후보 검증: FAIL');
    expect(result.summary).toContain(reason);
    expect(result.output).not.toContain('검증: PASS');
  },
);

it.each([
  '',
  'http://env-test.vercel.app',
  'https://example.com',
  `${deployment}/other`,
])('배포 URL이 %s이면 실제 명령이 입력 오류로 실패한다', (url) => {
  const result = runDeployment('', url);
  expect(result.status).toBe(1);
  expect(result.output).toContain('배포 URL');
  expect(result.summary).toContain('검증: FAIL');
});

it.each([
  ['인증 실패', 'Error: unauthorized token=', '인증'],
  ['네트워크 실패', 'curl: (6) Could not resolve host ', '네트워크'],
  ['인수 오류', 'curl: option --token: is unknown ', 'CLI 인수'],
  ['기타 CLI 실패', 'unexpected error ', 'CLI 실행'],
])(
  '%s이면 종료 코드와 안전한 원인을 게시하고 비밀값은 숨긴다',
  (_, stderr, reason) => {
    const result = runDeployment('', deployment, '7', stderr + token);
    expect(result.status).toBe(1);
    expect(result.output).toContain('exit 7');
    expect(result.output).toContain(reason);
    expect(result.summary).toContain(reason);
    expect(result.output + result.summary).not.toContain(token);
  },
);
