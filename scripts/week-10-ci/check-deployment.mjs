import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function assertDeploymentResponse(body, status) {
  assert.equal(status, 401, '후보 인증 API가 기대한 HTTP 401이 아니다');
  let response;
  try {
    response = JSON.parse(body);
  } catch {
    throw new Error(
      '후보 응답이 JSON이 아니다 — 배포 보호 페이지도 성공으로 인정하지 않는다',
    );
  }
  assert.deepEqual(
    response,
    { message: '로그인이 필요합니다.' },
    '후보 응답이 앱의 비로그인 응답이 아니다',
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    let deployment;
    try {
      deployment = new URL(process.argv[2]);
    } catch {
      throw new Error('배포 URL 누락 또는 형식 오류');
    }
    assert.equal(
      deployment.protocol === 'https:' &&
        deployment.hostname.endsWith('.vercel.app') &&
        deployment.href === `${deployment.origin}/`,
      true,
      '배포 URL은 경로·인증정보 없는 HTTPS Vercel 주소여야 한다',
    );
    // VERCEL_TOKEN은 CLI가 env에서 읽는다. --token은 curl 옵션으로 전달되므로 넣지 않는다.
    const result = spawnSync(
      'pnpm',
      [
        'dlx',
        process.env.VERCEL_CLI ?? 'vercel@59.14.0',
        'curl',
        '/api/auth/me',
        '--deployment',
        deployment.origin,
        '--yes',
        '--',
        '--silent',
        '--show-error',
        '--max-time',
        '30',
        '--write-out',
        '\n%{http_code}',
      ],
      { encoding: 'utf8', timeout: 60_000 },
    );
    if (result.error || result.status !== 0) {
      // 외부 CLI 원문에는 인증값이 섞일 수 있어 원인 분류와 종료 정보만 남긴다.
      let reason = 'CLI 실행';
      if (
        /unauthorized|forbidden|authentication|invalid token/i.test(
          result.stderr ?? '',
        )
      )
        reason = '인증';
      else if (
        /resolve host|connect|timed? out|timeout|network/i.test(
          result.stderr ?? '',
        )
      )
        reason = '네트워크';
      else if (/unknown|unrecognized|invalid option/i.test(result.stderr ?? ''))
        reason = 'CLI 인수';
      throw new Error(
        `후보 API 요청 실패 — ${reason} (exit ${result.status ?? '없음'}, signal ${result.signal ?? '없음'}, code ${result.error?.code ?? '없음'})`,
      );
    }
    const separator = result.stdout.lastIndexOf('\n');
    assertDeploymentResponse(
      result.stdout.slice(0, separator),
      Number(result.stdout.slice(separator + 1)),
    );
    const summary = `## 배포 후보 검증: PASS\n\n${deployment.origin}의 동적 인증 API HTTP 401·본문 확인.\n`;
    console.log(summary);
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : '배포 후보 검증 실패';
    console.error(reason);
    if (process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `## 배포 후보 검증: FAIL\n\n${reason}\n\n승격하지 않는다.\n`,
      );
    process.exitCode = 1;
  }
}
