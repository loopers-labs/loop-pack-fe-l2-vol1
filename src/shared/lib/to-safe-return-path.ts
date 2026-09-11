// 로그인 후 돌려보낼 경로를 안전한 값으로 좁힌다. 가드가 실어 보내고 로그인 화면이 받는 값이라
// 두 곳이 같은 판정을 써야 한다.
//
// 이름으로는 아무것도 막지 못한다 — 막아야 하는 값(`//evil.com`, `https://evil.com`)도 전부
// 유효한 URL이라, 안전성은 전적으로 이 함수가 진다.
//
// 통과하지 못하면 홈으로 대체한다. 거부가 아니라 대체인 것은, 잘못된 returnUrl 때문에
// 로그인 자체가 막히면 안 되기 때문이다.
const FALLBACK_PATH = '/'

export const toSafeReturnPath = (value: string | null | undefined): string => {
  if (typeof value !== 'string' || value === '') {
    return FALLBACK_PATH
  }

  // 브라우저는 URL의 백슬래시를 슬래시로 다룬다. `/\evil.com`은 정규화하면 `//evil.com`이 된다.
  const normalized = value.replaceAll('\\', '/')

  // `/`로 시작하지 않으면 절대 URL이거나 상대 경로다. `https://evil.com`이 여기서 걸린다.
  if (!normalized.startsWith('/')) {
    return FALLBACK_PATH
  }

  // `//evil.com`은 프로토콜 상대 URL이다. `/`로 시작해 경로처럼 보이는데 실제로는 외부로 나간다.
  if (normalized.startsWith('//')) {
    return FALLBACK_PATH
  }

  return normalized
}
