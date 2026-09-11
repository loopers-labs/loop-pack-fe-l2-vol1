// CI가 만든 production 산출물로 검사한다. dev/build를 다시 실행하지 않는다.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';

const cli = createRequire(import.meta.url).resolve('next/dist/bin/next');
const origin = 'http://127.0.0.1:41413';
const env = {
  ...process.env,
  NODE_ENV: 'production',
  VERCEL_ENV: 'development',
  APP_ORIGIN: origin,
  GITHUB_STEP_SUMMARY: '',
};

// PR 코멘트가 실을 최종 판정. 서버 기동 출력은 싣지 않고 실패한 검사 이름만 남긴다.
const writeVerdict = (markdown) => {
  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  }
  mkdirSync('reports', { recursive: true });
  writeFileSync('reports/env.md', markdown);
};

let running = '';

async function check(name, overrides, expectedError) {
  running = name;
  const child = spawn(
    process.execPath,
    [cli, 'start', '--hostname', '127.0.0.1', '--port', '41413'],
    {
      env: { ...env, ...overrides },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const exited = once(child, 'exit');
  const timeout = setTimeout(() => child.kill('SIGKILL'), 30_000);
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });

  try {
    if (expectedError) {
      const [code, signal] = await exited;
      assert.equal(signal, null, output);
      assert.equal(code, 1, output);
      assert.match(output, expectedError);
    } else {
      // Ready 로그가 register 완료보다 먼저 나올 수 있어 실제 API 응답으로 판정한다.
      let response;
      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline) {
        assert.equal(child.exitCode, null, output);
        try {
          response = await fetch(`${origin}/api/auth/me`, {
            signal: AbortSignal.timeout(2_000),
          });
          break;
        } catch {
          await delay(100);
        }
      }
      assert.equal(response?.status, 401, output);
      assert.deepEqual(await response.json(), {
        message: '로그인이 필요합니다.',
      });
    }
    console.log(`PASS ${name}`);
  } finally {
    clearTimeout(timeout);
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await exited;
    }
  }
}

try {
  await check(
    '빈 시크릿이면 시작 실패',
    { AUTH_SESSION_SECRET: '' },
    /env 검증 실패\(server\/local\).*AUTH_SESSION_SECRET/,
  );
  await check(
    '잘못된 origin이면 시작 실패',
    { APP_ORIGIN: 'ftp://invalid.example' },
    /env 검증 실패\(server\/local\).*APP_ORIGIN/,
  );
  await check(
    '비밀 공개 변수면 시작 실패',
    { NEXT_PUBLIC_AUTH_SESSION_SECRET: '' },
    /NEXT_PUBLIC_AUTH_SESSION_SECRET/,
  );
  await check('실제 CI env로 시작하고 동적 API 응답', {});
  writeVerdict(
    '## env 검증: PASS\n\n빌드용 통과. 실제 next start의 오류 3종 종료 코드 1·정상 인증 API 상태/본문 확인.\n',
  );
} catch (error) {
  writeVerdict(`## env 검증: FAIL (서버 실행)\n\n실패한 검사: ${running}\n`);
  throw error;
}
