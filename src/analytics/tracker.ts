import type { AnalyticsProvider, EventProperties } from "./provider";

/**
 * 계측 전송 계층.
 *
 * 화면 코드는 `track()` 하나만 부른다. 어디로 보낼지, 초기화가 끝났는지,
 * 공통 프로퍼티가 무엇인지는 이 파일이 처리한다.
 *
 * 이 파일이 정하지 않는 것이 있다. **이벤트 이름과 프로퍼티는 직접 설계한다.**
 * `sessionId`, `device`, `ts` 같은 공통 값도 스타터가 정하지 않는다.
 * 무엇을 모든 이벤트에 붙일지는 `setCommonProperties()`로 직접 정한다.
 * 그 설계가 이번 주 과제의 채점 대상이다.
 */

type QueuedEvent =
  | { type: "track"; event: string; properties: EventProperties }
  | { type: "identify"; userId: string; properties?: EventProperties }
  | { type: "reset" };

// ponytail: 모듈 스코프에 담는다. 브라우저에서는 탭 하나가 곧 하나의 인스턴스다.
// 서버 렌더링에서 요청 간 공유가 문제가 되면 요청 스코프로 올려야 한다
let providers: AnalyticsProvider[] = [];
let commonProperties: () => EventProperties = () => ({});
let initialized = false;
let queue: QueuedEvent[] = [];

const MAX_QUEUE_SIZE = 100;

export function registerProviders(list: AnalyticsProvider[]): void {
  providers = list;
}

/**
 * 모든 이벤트에 붙일 값을 정한다. 호출 시점이 아니라 이벤트 발생 시점에 평가된다.
 * 로그인 여부처럼 도중에 바뀌는 값을 넣을 수 있다.
 */
export function setCommonProperties(get: () => EventProperties): void {
  commonProperties = get;
}

/**
 * 프로바이더를 초기화하고 큐에 쌓인 이벤트를 흘려보낸다.
 *
 * 초기화 전에 발생한 이벤트를 버리지 않는 이유가 있다. 첫 화면 진입은
 * SDK 로드보다 먼저 일어나는데, 그 이벤트가 퍼널의 시작점이다. 버리면
 * 모든 경로의 분모가 틀어진다.
 */
export async function initAnalytics(): Promise<void> {
  if (initialized) {
    return;
  }

  await Promise.all(
    providers.map(async (provider) => {
      try {
        await provider.initialize();
      } catch (error) {
        console.error(`[analytics] ${provider.name} 초기화 실패`, error);
      }
    }),
  );

  initialized = true;

  const pending = queue;
  queue = [];
  pending.forEach(send);
}

export function track(event: string, properties: EventProperties = {}): void {
  enqueueOrSend({
    type: "track",
    event,
    properties: { ...commonProperties(), ...properties },
  });
}

export function identify(userId: string, properties?: EventProperties): void {
  enqueueOrSend({ type: "identify", userId, properties });
}

export function reset(): void {
  enqueueOrSend({ type: "reset" });
}

function enqueueOrSend(queued: QueuedEvent): void {
  if (initialized) {
    send(queued);
    return;
  }

  if (queue.length >= MAX_QUEUE_SIZE) {
    // ponytail: 가장 오래된 것을 버린다. 큐가 이만큼 차면 초기화가 실패한 상황이다
    queue.shift();
  }
  queue.push(queued);
}

function send(queued: QueuedEvent): void {
  providers.forEach((provider) => {
    try {
      if (queued.type === "track") {
        provider.track(queued.event, queued.properties);
      } else if (queued.type === "identify") {
        provider.identify(queued.userId, queued.properties);
      } else {
        provider.reset();
      }
    } catch (error) {
      console.error(`[analytics] ${provider.name} 전송 실패`, error);
    }
  });
}

/** 테스트에서 모듈 상태를 되돌린다 */
export function resetAnalyticsForTest(): void {
  providers = [];
  commonProperties = () => ({});
  initialized = false;
  queue = [];
}
