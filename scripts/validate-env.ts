const APP_ORIGIN = process.env.APP_ORIGIN;

function fail(message: string): never {
  console.error(`[validate-env] ${message}`);
  process.exit(1);
}

if (!APP_ORIGIN) {
  fail('APP_ORIGIN이 설정되지 않았습니다.');
}

let url: URL;
try {
  url = new URL(APP_ORIGIN);
} catch {
  fail(`APP_ORIGIN이 올바른 URL이 아닙니다: ${APP_ORIGIN}`);
}

if (url.protocol !== 'http:' && url.protocol !== 'https:') {
  fail(`APP_ORIGIN의 프로토콜은 http 또는 https여야 합니다: ${APP_ORIGIN}`);
}

if (APP_ORIGIN.endsWith('/')) {
  fail(`APP_ORIGIN은 끝에 슬래시를 포함할 수 없습니다: ${APP_ORIGIN}`);
}

console.log(`[validate-env] APP_ORIGIN 검증 통과: ${APP_ORIGIN}`);

// NEXT_PUBLIC_ 값은 빌드 시점에 브라우저 번들에 인라인된다. 노출해도 되는 이름만 여기에 추가한다.
const ALLOWED_PUBLIC_ENV = new Set<string>([]);

// Vercel 빌드 환경이 주입하는 이름은 접두사 전체를 플랫폼 예약으로 본다.
// 공개 소스(build-utils get-prefixed-env-vars.ts)에 없는 NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG도 주입돼 이름 단위 목록은 빌드를 깨뜨렸다.
// ponytail: 이 접두사로 직접 등록한 비밀값은 통과한다. 막아야 하면 Vercel 대시보드 등록 이름을 별도로 검사한다.
const VERCEL_RESERVED_PUBLIC_ENV_PREFIX = 'NEXT_PUBLIC_VERCEL_';

const disallowedPublicEnv = Object.keys(process.env).filter((name) => name.startsWith('NEXT_PUBLIC_') && !ALLOWED_PUBLIC_ENV.has(name) && !name.startsWith(VERCEL_RESERVED_PUBLIC_ENV_PREFIX));

if (disallowedPublicEnv.length > 0) {
  fail(`허용 목록에 없는 NEXT_PUBLIC_ 변수가 있습니다: ${disallowedPublicEnv.join(', ')}. 브라우저에 노출해도 되는 값만 ALLOWED_PUBLIC_ENV에 추가하세요.`);
}

console.log('[validate-env] NEXT_PUBLIC_ 허용 목록 검증 통과');
