import {
  registerProviders,
  setCommonProperties,
  initAnalytics,
} from '@/analytics/logger';
import { consoleProvider } from '@/analytics/consoleProvider';
import { getCommonProperties } from '@/shared/analytics/common-properties';

// 모듈 스코프에서 한 번만 실행된다(logger.ts와 같은 전제 — 탭 하나가
// 곧 하나의 인스턴스). 이 파일을 가장 먼저, 한 번만 import하는 곳
// (providers.tsx)에서 최대한 이른 시점에 초기화되도록 한다 — 초기화가
// 늦어질수록 그 사이 track() 호출이 큐에 쌓이는 시간이 길어진다.
registerProviders([consoleProvider]);
setCommonProperties(getCommonProperties);
void initAnalytics();
