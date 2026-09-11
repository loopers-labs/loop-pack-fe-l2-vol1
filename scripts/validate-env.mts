// 환경 변수 게이트 — 배포 사고는 코드보다 설정에서 난다.
//
//   node scripts/validate-env.mts             # 형식 검사 (CI·로컬 빌드 전)
//   node scripts/validate-env.mts --strict    # 배포용. 필수 존재와 기본값 금지까지 본다
//
// 이 앱이 읽는 환경 변수는 둘뿐이고 **둘 다 기본값으로 조용히 넘어간다**:
//   APP_ORIGIN          없으면 http://localhost:3000 (src/app/shared-metadata.ts, src/shared/api/base-url.ts)
//   AUTH_SESSION_SECRET 없으면 loopers-week09-secret (src/app/api/_data/auth.ts)
// 그래서 "설정을 안 했다"가 실패가 아니라 조용한 잘못된 동작이 된다. 그 침묵을 깨는 게 이 게이트다.
//
// --strict를 CI 기본으로 두지 않는 이유: 이 저장소에는 배포가 없어서 CI 빌드는 기본값으로 돈다.
// 없는 배포를 있는 척하는 대신, CI는 형식만 보고 --strict는 배포 파이프라인의 몫으로 남긴다.

const DEFAULT_ORIGIN = 'http://localhost:3000';
const DEFAULT_SESSION_SECRET = 'loopers-week09-secret';
const SENSITIVE_NAME = /(SECRET|TOKEN|PASSWORD|PRIVATE|CREDENTIAL)/;

const problems: string[] = [];

function fail(message: string): void {
  problems.push(message);
}

// 1. 브라우저에 노출되면 안 되는 값에 NEXT_PUBLIC_이 붙은 경우.
//    NEXT_PUBLIC_ 접두사는 값을 클라이언트 번들에 그대로 박아 넣는다 — 되돌릴 수 없다.
for (const name of Object.keys(process.env)) {
  if (name.startsWith('NEXT_PUBLIC_') && SENSITIVE_NAME.test(name)) {
    fail(
      `${name}: NEXT_PUBLIC_ 접두사가 붙으면 값이 클라이언트 번들에 박힌다. 이름으로 보아 노출되면 안 되는 값이다.`,
    );
  }
}

// 2. APP_ORIGIN이 있다면 형식이 맞아야 한다. 서버가 이 값으로 자기 API를 절대 URL로 부른다.
const origin = process.env.APP_ORIGIN;
if (origin !== undefined && origin !== '') {
  let parsed: URL | null = null;
  try {
    parsed = new URL(origin);
  } catch {
    parsed = null;
  }
  if (parsed === null) {
    fail(`APP_ORIGIN: URL로 해석되지 않는다 (${origin}).`);
  } else if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    fail(`APP_ORIGIN: http/https가 아니다 (${parsed.protocol}).`);
  } else if (parsed.pathname !== '/') {
    fail(`APP_ORIGIN: 경로 없이 origin만 와야 한다 (${origin}).`);
  }
}

// 3. --strict는 배포 상황을 가정한다. 기본값으로 뜨는 것 자체를 사고로 본다.
if (process.argv.includes('--strict')) {
  if (origin === undefined || origin === '') {
    fail(
      `APP_ORIGIN: 배포에는 반드시 있어야 한다. 없으면 ${DEFAULT_ORIGIN}로 뜬다.`,
    );
  } else if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(origin)) {
    fail(`APP_ORIGIN: 배포에서 localhost를 가리키고 있다 (${origin}).`);
  }

  const secret = process.env.AUTH_SESSION_SECRET;
  if (secret === undefined || secret === '') {
    fail(
      `AUTH_SESSION_SECRET: 배포에는 반드시 있어야 한다. 없으면 공개 저장소에 적힌 기본값으로 세션을 서명한다.`,
    );
  } else if (secret === DEFAULT_SESSION_SECRET) {
    fail(
      `AUTH_SESSION_SECRET: 기본값 그대로다. 이 문자열은 저장소에 적혀 있어 누구나 세션을 위조할 수 있다.`,
    );
  } else if (secret.length < 32) {
    fail(`AUTH_SESSION_SECRET: 32자 미만이다 (${secret.length}자).`);
  }
}

const mode = process.argv.includes('--strict') ? 'strict' : 'format';
if (problems.length > 0) {
  process.stdout.write(
    `환경 변수 검증 실패 (${mode}) — ${problems.length}건\n`,
  );
  for (const problem of problems) {
    process.stdout.write(`  - ${problem}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`환경 변수 검증 통과 (${mode})\n`);
}
