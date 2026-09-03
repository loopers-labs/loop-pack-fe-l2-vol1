'use client';

import { useEffect, useRef } from 'react';

/**
 * 화면 진입 이벤트를 한 번만 보낸다.
 *
 * 발생 단위는 "해당 경로에 들어와 화면이 처음 표시될 때 한 번"이다. 같은 화면에서 조건만 바뀌면
 * 다시 보내지 않는다. 그 판단을 이 훅이 갖고 있어서 화면 코드는 무엇을 보낼지만 넘기면 된다.
 *
 * | 상황                          | 보내나 |
 * | ----------------------------- | ------ |
 * | 화면에 처음 들어옴            | 보낸다 |
 * | 조건만 바뀜                   | 안 보낸다 — 컴포넌트가 그대로 남아 있다 |
 * | 새로고침 · 뒤로 가기 · 재진입 | 보낸다 — 컴포넌트가 다시 마운트된다 |
 * | 리렌더링                      | 안 보낸다 |
 * | 개발 환경의 effect 중복 실행  | 안 보낸다 |
 *
 * @param send 보낼 이벤트. 보내는 시점의 값을 담아 넘긴다
 * @param isReady 아직 준비되지 않았으면 미룬다. 준비가 된 뒤 처음 한 번만 보낸다
 */
export function useScreenViewOnce(send: () => void, isReady = true): void {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current || !isReady) {
      return;
    }
    sent.current = true;
    send();
  }, [send, isReady]);
}
