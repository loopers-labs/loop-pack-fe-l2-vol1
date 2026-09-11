// 10주차 3단계 — build 전 환경 변수 검증 게이트.
// 실제 값이 아니라 "정상적으로 배포 가능한 상태인가"만 판단하며, 통과하지
// 못하면 build 자체를 막는다(결정적 게이트). package.json의 prebuild에서
// 자동으로 실행된다.

const REQUIRED_VARS = ['AUTH_SESSION_SECRET'];

// 이름이 이 접두어/키워드를 포함하면 "민감한 값"으로 간주한다.
// 이런 이름이 NEXT_PUBLIC_ 접두어를 달고 있으면, 빌드 시 브라우저 번들에
// 그대로 노출되므로 실패시킨다.
// 2차 코드 리뷰에서 발견: API_KEY/PRIVATE_KEY만 잡고 그냥 KEY는 못 잡아서
// NEXT_PUBLIC_STRIPE_KEY 같은 이름은 그냥 통과했다. KEY 자체를 추가.
const SENSITIVE_NAME_PATTERN = /(SECRET|TOKEN|PASSWORD|KEY)/i;

const errors = [];

for (const name of REQUIRED_VARS) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    errors.push(`필수 환경 변수 \`${name}\`가 비어있거나 설정되지 않았습니다.`);
  }
}

for (const [name, value] of Object.entries(process.env)) {
  if (!name.startsWith('NEXT_PUBLIC_')) continue;
  if (SENSITIVE_NAME_PATTERN.test(name)) {
    errors.push(
      `\`${name}\`는 NEXT_PUBLIC_ 접두어가 붙어 브라우저에 그대로 노출됩니다. ` +
        `민감한 값으로 보이는 이름이라 build를 막습니다 (${name} -> 브라우저 노출 위험).`,
    );
  }
  if (name.endsWith('_URL')) {
    // value &&만 보면 빈 문자열(falsy)일 때 검증 자체를 건너뛰어, 빈 URL이
    // 그대로 통과했다(2차 코드 리뷰에서 발견). 빈 값도 명시적으로 걸러낸다.
    if (!value) {
      errors.push(`\`${name}\` 값이 비어있습니다.`);
    } else {
      try {
        new URL(value);
      } catch {
        errors.push(`\`${name}\` 값이 올바른 URL 형식이 아닙니다: "${value}"`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('❌ 환경 변수 검증 실패:\n');
  for (const err of errors) console.error(`  - ${err}`);
  console.error('\nbuild를 중단합니다.');
  process.exit(1);
}

console.log('✅ 환경 변수 검증 통과');
