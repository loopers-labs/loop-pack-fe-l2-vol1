import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';

import { z } from 'zod';

const requiredValue = z.string('누락').trim().min(1, '공백');
const httpOrigin = requiredValue.pipe(
  z.url({ protocol: /^https?$/, error: 'http·https URL이 아니다' }),
);
const deploySecret = requiredValue
  // mock 인증의 기본값은 로컬에서만 허용한다.
  .refine(
    (value) => value !== 'loopers-week09-secret',
    '배포 환경에서 데모 기본값을 사용했다',
  )
  .refine(
    (value) => value !== '[SENSITIVE]',
    'Sensitive 자리표시자 — 실제 값을 검증할 수 없다',
  );
const publicVariantRules = Object.fromEntries(
  ['AUTH_SESSION_SECRET', 'VERCEL_TOKEN'].map((name) => [
    `NEXT_PUBLIC_${name}`,
    z.never('서버 비밀 변수의 공개 접두 변형 — 빈 값이어도 금지').optional(),
  ]),
);

function deployOrigin(allowedHostVars: string[]) {
  return httpOrigin.superRefine((value, ctx) => {
    let host;

    try {
      host = new URL(value).host;
    } catch {
      return;
    }

    const allowedHosts = allowedHostVars
      .map((name) => process.env[name])
      .filter(Boolean);

    if (allowedHosts.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: `허용 주소(${allowedHostVars.join('·')})가 없어 대조할 수 없다`,
      });
    } else if (!allowedHosts.includes(host)) {
      ctx.addIssue({ code: 'custom', message: '이 환경의 배포 주소와 다르다' });
    }
  });
}

export function validateBuildEnv() {
  validateEnv('build');
}

export function validateServerEnv() {
  validateEnv('server');
}

function validateEnv(stage: 'build' | 'server') {
  const target =
    process.env.VERCEL_ENV === 'preview' ||
    process.env.VERCEL_ENV === 'production'
      ? process.env.VERCEL_ENV
      : 'local';
  const originRules = {
    local: httpOrigin,
    // Preview의 origin 생략은 기존 정책이다. 설정했다면 자기 배포 주소여야 한다.
    preview: deployOrigin(['VERCEL_URL', 'VERCEL_BRANCH_URL']).optional(),
    production: deployOrigin(['VERCEL_PROJECT_PRODUCTION_URL']),
  };
  const schema = z.looseObject({
    APP_ORIGIN: originRules[target],
    ...publicVariantRules,
    ...(stage === 'server'
      ? {
          AUTH_SESSION_SECRET:
            target === 'local' ? requiredValue : deploySecret,
        }
      : {}),
  });
  const result = schema.safeParse(process.env);
  const problems = result.success
    ? []
    : result.error.issues.map(
        (issue) => `${String(issue.path[0] ?? 'env')}: ${issue.message}`,
      );
  const summary = `## env 검증: ${result.success ? 'PASS' : 'FAIL'} (${stage}/${target})\n${problems.map((problem) => `- ${problem}\n`).join('')}`;

  // 리포트는 덮어쓰기라 next build가 설정을 여러 번 로딩해도 하나만 남는다.
  // PR 코멘트가 이 파일을 그대로 실어 변수명·이유가 원시 로그 밖에서도 읽힌다.
  if (process.env.GITHUB_STEP_SUMMARY) {
    mkdirSync('reports', { recursive: true });
    writeFileSync('reports/env.md', `${summary}\n`);
  }

  if (!result.success) {
    // summary는 append라 PASS까지 쓰면 설정 로딩 횟수만큼 중복된다(실측 3회).
    // 성공한 build의 PASS 한 줄은 Build step이 한 번만 기록한다.
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
    }
    throw new Error(
      `env 검증 실패(${stage}/${target}) — ${problems.join('; ')}`,
    );
  }
}
