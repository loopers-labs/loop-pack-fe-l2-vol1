# Chromium 리다이렉트 실패 조사 메모

제출용 Week 10 문서와 분리한 개인 조사 기록이다. 최종 병목·개선 결론에는 반영하지 않는다.

## 관찰

- 브라우저 matrix 시험에서 WebKit은 통과했지만 Chromium의 세션 만료 시나리오가 실패했다.
- 실패 지점은 `e2e/auth.spec.ts:54`의 `page.goto('/orders')`였다.
- 오류는 `net::ERR_ABORTED; maybe frame was detached?`였고 30초 timeout으로 종료됐다.
- Chromium job만 단독으로 재실행해도 같은 오류가 재현됐다.

## 판단

브라우저 간 job이 같은 테스트 계정을 사용한 것이 단독 재실행에서도 재현된 오류의 충분한
원인은 아니었다. 서버의 `/orders` 리다이렉트와 클라이언트 세션 만료 처리가 동시에 개입하는
탐색 타이밍 경계가 원인 후보였다.

## 조치와 결과

해당 테스트의 목적은 `/orders` 로드 완료가 아니라 로그인 화면으로의 리다이렉트 확인이므로,
이동 대기를 `waitUntil: 'commit'`으로 바꾸고 `waitForURL('**/login?**')`로 결과를 기다렸다.

수정 후 로컬 Chromium·WebKit 테스트와 CI matrix 1회가 통과했다.

- workflow: https://github.com/im-wen3y/loop-pack-fe-l2-vol1/actions/runs/34451586743
- 커밋: `dd2d7290f5ecb95c54049161f812dc3c9320246f`
- Chromium job: 2분 18초
- WebKit job: 2분 00초
