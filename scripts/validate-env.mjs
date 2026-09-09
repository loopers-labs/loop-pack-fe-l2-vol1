// build 앞에 도는 환경 변수 게이트. Node 내장만 쓴다(의존성 추가 금지).
// 값은 어떤 경우에도 출력하지 않는다 — 로그에 비밀값이 남으면 게이트가 사고 원인이 된다.

const REQUIRED_KEYS = ["APP_ORIGIN", "AUTH_SESSION_SECRET"];
const URL_KEYS = ["APP_ORIGIN"];

const PUBLIC_PREFIX = "NEXT_PUBLIC_";
// 브라우저 번들에 그대로 실리는 접두사라, 이 단어가 이름에 있으면 비밀값 유출로 본다.
const SECRET_NAME_WORDS = ["SECRET", "TOKEN", "KEY", "PASSWORD"];

// `??` 는 빈 문자열을 통과시켜 fallback 이 안 걸린다. 빈 값도 누락으로 본다.
const isBlank = (value) => value === undefined || value.trim() === "";

function findMissingKeys(env) {
  return REQUIRED_KEYS.filter((key) => isBlank(env[key])).map(
    (key) => `${key}: 값이 없습니다(미설정이거나 빈 문자열).`,
  );
}

function findUnparsableUrls(env) {
  return URL_KEYS.filter((key) => !isBlank(env[key]))
    .filter((key) => !URL.canParse(env[key]))
    .map(
      (key) =>
        `${key}: 절대 URL 로 파싱되지 않습니다. 예) http://localhost:3000`,
    );
}

function findExposedSecrets(env) {
  return Object.keys(env)
    .filter((key) => key.startsWith(PUBLIC_PREFIX))
    .filter((key) => SECRET_NAME_WORDS.some((word) => key.includes(word)))
    .map(
      (key) =>
        `${key}: 비밀값으로 보이는 이름에 ${PUBLIC_PREFIX} 가 붙어 브라우저 번들에 노출됩니다.`,
    );
}

const failures = [
  ...findMissingKeys(process.env),
  ...findUnparsableUrls(process.env),
  ...findExposedSecrets(process.env),
];

if (failures.length > 0) {
  console.error(`\n환경 변수 검증 실패 (${failures.length}건)\n`);
  failures.forEach((failure) => console.error(`  ${failure}`));
  console.error("\n로컬은 .env.local, CI 는 workflow 의 env 를 확인하세요.\n");
  process.exit(1);
}
