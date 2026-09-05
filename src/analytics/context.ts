// 모든 이벤트에 붙는 공통 값이다. 로거는 이 값을 정하지 않는다(스타터 계약).
// 무엇을 붙일지는 시드 로그(fixtures/events-30d.jsonl)의 최상위 필드를 기준으로 골랐다.
// 해당 로그에 sessionId · ts · device · userId가 있으므로, 새로운 집계 기준을 만들지 않고
// 이미 있는 축에 맞춘다.

const SESSION_STORAGE_KEY = 'analytics.sessionId'

// 로그인한 사용자다. identify() 는 프로바이더에 알릴 뿐이라, 이벤트 본문에 userId 를
// 기록하려면 여기서 별도로 관리해야 한다. 시드 로그도 최상위에 userId가 있다.
let currentUserId: string | null = null

export const setAnalyticsUser = (userId: string | null) => {
  currentUserId = userId
}

// 탭 하나가 곧 한 세션이다. sessionStorage 를 쓰면 탭을 닫을 때 함께 사라지고,
// 새로 열면 새 세션이 된다. localStorage 를 쓰면 몇 주 전 방문과 오늘이 한 세션이 된다.
const readSessionId = () => {
  if (typeof window === 'undefined') return 'server'

  try {
    const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (stored !== null) return stored

    const created = crypto.randomUUID()
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created)
    return created
  } catch {
    // 저장소를 막아둔 브라우저다. 이벤트를 버리는 대신 세션 없는 값으로 보낸다.
    return 'unavailable'
  }
}

// 시드 로그의 device 값(mobile · tablet · desktop · null)에 맞춘다.
// User-Agent 로 나누는 것이 정확하지는 않지만, 시드 로그와 같은 축으로 세려면
// 같은 세 값을 써야 한다. 판단이 애매하면 null 을 보낸다. 시드 로그에도 null 이 있다.
const readDevice = () => {
  if (typeof navigator === 'undefined') return null

  const ua = navigator.userAgent
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile'
  return 'desktop'
}

/**
 * 이벤트 발생 시점에 평가된다(logger 계약). ts 를 여기서 만드는 이유가 그것이다.
 * 초기화 시점에 한 번 생성하면 초기화 전에 저장된 이벤트의 시각이 모두 같아진다.
 */
export const commonProperties = () => ({
  sessionId: readSessionId(),
  ts: new Date().toISOString(),
  device: readDevice(),
  ...(currentUserId === null ? {} : { userId: currentUserId }),
})
