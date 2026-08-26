import type { AnalyticsProvider, EventProperties } from './provider';

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
  | { type: 'reset' };

// ponytail: 모듈 스코프에 담는다. 브라우저에서는 탭 하나가 곧 하나의 인스턴스다
let providers: AnalyticsProvider[] = [];
let commonProperties: () => EventProperties = () => ({});
let initialized = false;
let queue: QueuedEvent[] = [];

const MAX_QUEUE_SIZE = 100;

export const registerProviders = (list: AnalyticsProvider[]): void => {
  providers = list;
};

/** 모든 이벤트에 붙일 값. 이벤트 발생 시점에 평가된다. */
export const setCommonProperties = (get: () => EventProperties): void => {
  commonProperties = get;
};

/** 프로바이더를 초기화하고, 그 전에 쌓인 이벤트를 순서대로 보낸다. */
export const initAnalytics = async (): Promise<void> => {
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
    })
  );

  initialized = true;

  const pending = queue;
  queue = [];
  pending.forEach(send);
};

export const track = (event: string, properties: EventProperties = {}): void => {
  enqueueOrSend({
    type: 'track',
    event,
    properties: { ...commonProperties(), ...properties },
  });
};

export const identify = (userId: string, properties?: EventProperties): void => {
  enqueueOrSend({ type: 'identify', userId, properties });
};

export const reset = (): void => {
  enqueueOrSend({ type: 'reset' });
};

const enqueueOrSend = (queued: QueuedEvent): void => {
  if (initialized) {
    send(queued);
    return;
  }

  if (queue.length >= MAX_QUEUE_SIZE) {
    queue.shift();
  }
  queue.push(queued);
};

const send = (queued: QueuedEvent): void => {
  providers.forEach((provider) => {
    try {
      if (queued.type === 'track') {
        provider.track(queued.event, queued.properties);
      } else if (queued.type === 'identify') {
        provider.identify(queued.userId, queued.properties);
      } else {
        provider.reset();
      }
    } catch (error) {
      console.error(`[analytics] ${provider.name} 전송 실패`, error);
    }
  });
};

/** 테스트에서 모듈 상태를 되돌린다 */
export const resetAnalyticsForTest = (): void => {
  providers = [];
  commonProperties = () => ({});
  initialized = false;
  queue = [];
};
