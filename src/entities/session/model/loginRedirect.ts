// 로그인 후 원래 경로로 돌아가기 위한 계약이다. 파라미터 이름과 검증 규칙을 한곳에 둔다.
// 가드가 싣고 로그인 화면이 꺼내 쓰는데, 두 곳이 각자 정하면 이름이 어긋나 복원이 끊긴다.

export const NEXT_PARAM = 'next'

export const LOGIN_PATH = '/login'

export const DEFAULT_NEXT_PATH = '/'

// 검증에만 쓰는 기준 origin이다. 실제 요청 주소와 무관해야 판정이 환경에 따라 달라지지 않는다.
const PROBE_ORIGIN = 'http://next.invalid'

/**
 * 복원 경로로 쓸 수 있는 값만 통과시킨다.
 *
 * open redirect를 막는 것이 목적이다. `next=https://evil.example`을 그대로 쓰면
 * 로그인 화면이 외부로 내보내는 통로가 된다. 스킴을 문자열로 검사하지 않고 URL 파서에
 * 태워 origin을 비교한다. `//evil.example`이나 `/\evil.example`처럼 파서가 다르게
 * 읽는 형태를 문자열 규칙으로 모두 세기는 어렵다.
 */
export const safeNextPath = (
  raw: string | null | undefined,
  fallback: string = DEFAULT_NEXT_PATH,
): string => {
  if (typeof raw !== 'string' || raw === '') return fallback

  // 절대 경로만 받는다. 상대 경로는 어느 화면에서 눌렀는지에 따라 목적지가 달라진다.
  if (!raw.startsWith('/')) return fallback

  let url: URL
  try {
    url = new URL(raw, PROBE_ORIGIN)
  } catch {
    return fallback
  }

  // 파싱 후에도 우리 origin이어야 한다. `//evil.example`이 여기서 걸린다.
  if (url.origin !== PROBE_ORIGIN) return fallback

  // 로그인 화면으로 되돌아가면 로그인 성공 후 같은 화면이 다시 나온다.
  if (
    url.pathname === LOGIN_PATH ||
    url.pathname.startsWith(`${LOGIN_PATH}/`)
  ) {
    return fallback
  }

  return `${url.pathname}${url.search}`
}

// 가드가 만드는 로그인 주소다. 밖에서 들어온 값을 그대로 실으면 우리가 만든 링크가
// 공격 경로가 되므로 여기서도 한 번 거른다.
export const loginPathFor = (nextPath?: string | null): string => {
  const safe = safeNextPath(nextPath)
  if (safe === DEFAULT_NEXT_PATH) return LOGIN_PATH

  const params = new URLSearchParams({ [NEXT_PARAM]: safe })
  return `${LOGIN_PATH}?${params.toString()}`
}
