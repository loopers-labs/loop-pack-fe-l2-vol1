# Week 10 개인 조사 기록

멘토 제출용 문서에서 제외할 시행착오와 내부 검증 메모다. 최종 전략·수치의 근거는
`docs/rfc/week10-ci.md`에만 남긴다.

## 브라우저 설치 실패

- `pnpm exec playwright install --with-deps chromium webkit`에서 Google Chrome apt 저장소의
  `Hash Sum mismatch`가 두 번 발생했다.
- `--with-deps`를 제거하면 WebKit 실행에 필요한 GTK·GStreamer 계열 라이브러리가 없어 실패했다.
- Google Chrome apt source를 삭제하는 임시 우회도 확인했지만 runner 이미지에 의존하므로 최종 workflow에는
  넣지 않았다.

## Chromium navigation 재현과 수정

- 세션 만료 E2E에서 Chromium만 `page.goto('/orders')` 중 `net::ERR_ABORTED`가 발생한 적이 있다.
- 계정 충돌만으로 설명되지 않았고, 리다이렉트 결과를 기다리는 탐색 타이밍 경계가 원인 후보였다.
- `waitUntil: 'commit'` 후 로그인 URL을 기다리도록 수정했고, 이후 로컬과 CI matrix에서 통과했다.
- 이 실패는 최종 병목·성능 결론에 포함하지 않는다.

## Matrix 계정 격리

- Chromium과 WebKit matrix job에서 `parallelIndex`가 각각 0부터 시작해 같은 테스트 계정을 선택할 수
  있었다.
- 프로젝트 이름을 계정 슬롯 계산에 포함하고 worker storage state 파일명에도 browser 이름을 넣어 격리했다.
- 이 변경은 테스트 간 계정 충돌 가능성을 줄이기 위한 정확성 조치이며 성능 측정 결과로 해석하지 않는다.

## Cache 실험의 경합

- lockfile 변경으로 새 cache key를 만든 실험에서 Quality·WebKit은 miss, Chromium은 hit였다.
- matrix job이 동일 key를 공유하고 먼저 끝난 job이 캐시를 저장하면 늦게 시작한 job이 복원할 수 있다.
- 따라서 해당 실험은 전체 cold가 아니라 부분 cold이며, 모든 matrix job의 cold를 강제하는 설정은 별도로
  존재하지 않는다.
