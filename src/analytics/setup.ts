// 05-step2-design.md 5절 수정안 — 모듈 로드 시점에 등록한다(effect가 아니다).
// React는 자식 effect를 부모보다 먼저 실행하므로, 트리 어딘가의 effect에 등록을 두면
// 더 깊은 자식의 effect가 먼저 돌아 초반 이벤트가 sessionId·ts·device 없이 기록될 수 있다.
// 이 모듈을 import하는 순간(모듈 평가 시점) 등록이 끝나므로 그 문제가 생기지 않는다.
import { registerProviders, setCommonProperties } from './logger';
import { recordProvider } from './recordProvider';
import { getOrCreateSessionId } from './session';
import { getDevice } from './device';

registerProviders([recordProvider]);

setCommonProperties(() => ({
  sessionId: getOrCreateSessionId(),
  ts: new Date().toISOString(),
  device: getDevice()
}));
