import type { AnalyticsProvider, EventProperties } from './provider'

/**
 * 이벤트 로거.
 *
 * 화면 코드는 `track()`만 부른다. 어디로 보낼지, 초기화가 끝났는지,
 * 공통 프로퍼티가 무엇인지는 이 파일이 처리한다.
 *
 * 이벤트 이름과 프로퍼티는 이 파일이 정하지 않는다. 직접 설계한다.
 */

type QueuedEvent =
  | { type: 'track'; event: string; properties: EventProperties }
  | { type: 'identify'; userId: string; properties?: EventProperties }
  | { type: 'reset' }

// ponytail: 모듈 스코프에 담는다. 브라우저에서는 탭 하나가 곧 하나의 인스턴스다
let providers: AnalyticsProvider[] = []
let commonProperties: () => EventProperties = () => ({})
let initialized = false
let queue: QueuedEvent[] = []

const MAX_QUEUE_SIZE = 100

export function registerProviders(list: AnalyticsProvider[]): void {
  providers = list
}

/** 모든 이벤트에 붙일 값. 이벤트 발생 시점에 평가된다. */
export function setCommonProperties(get: () => EventProperties): void {
  commonProperties = get
}

/** 프로바이더를 초기화하고, 그 전에 쌓인 이벤트를 순서대로 보낸다. */
export async function initAnalytics(): Promise<void> {
  if (initialized) {
    return
  }

  await Promise.all(
    providers.map(async (provider) => {
      try {
        await provider.initialize()
      } catch (error) {
        console.error(`[analytics] ${provider.name} 초기화 실패`, error)
      }
    }),
  )

  initialized = true

  await flush()
}

/**
 * 큐에 남은 이벤트를 지금 내보낸다.
 *
 * 문서를 새로 받기 직전처럼 화면이 사라지는 자리에서 부른다. 지금 프로바이더는
 * 콘솔이라 동기라서 하는 일이 없지만, 호출 지점을 정해 두면 실제 SDK 를 붙일 때
 * 고칠 곳이 이 함수 안 한 군데로 줄어든다.
 */
export async function flush(): Promise<void> {
  const pending = queue
  queue = []
  pending.forEach(send)
}

export function track(event: string, properties: EventProperties = {}): void {
  // 공통 프로퍼티는 여기서 합치지 않는다. setCommonProperties 가 아직 등록되지 않은
  // 시점에 track 이 불리면 sessionId·device·ts 가 빈 값으로 확정되기 때문이다.
  // 등록은 화면의 effect 에서 일어나고 track 도 effect 에서 불려서, 둘의 순서는
  // 컴포넌트 배치와 Suspense 경계에 따라 달라진다. 전송 시점에 합치면 그 순서에
  // 기대지 않는다.
  enqueueOrSend({ type: 'track', event, properties })
}

export function identify(userId: string, properties?: EventProperties): void {
  enqueueOrSend({ type: 'identify', userId, properties })
}

export function reset(): void {
  enqueueOrSend({ type: 'reset' })
}

function enqueueOrSend(queued: QueuedEvent): void {
  if (initialized) {
    send(queued)
    return
  }

  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift()
  }
  queue.push(queued)
}

function send(queued: QueuedEvent): void {
  providers.forEach((provider) => {
    try {
      if (queued.type === 'track') {
        provider.track(queued.event, {
          ...commonProperties(),
          ...queued.properties,
        })
      } else if (queued.type === 'identify') {
        provider.identify(queued.userId, queued.properties)
      } else {
        provider.reset()
      }
    } catch (error) {
      console.error(`[analytics] ${provider.name} 전송 실패`, error)
    }
  })
}

/** 테스트에서 모듈 상태를 되돌린다 */
export function resetAnalyticsForTest(): void {
  providers = []
  commonProperties = () => ({})
  initialized = false
  queue = []
}
