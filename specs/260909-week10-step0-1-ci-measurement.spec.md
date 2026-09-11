# 10주차 Step 0–1 — 실험 환경 준비와 CI 측정·최적화 스펙

> 상위 계획: `docs/rfc/week10-decisions.md`(ADR-1~13)에서 Step 0(준비)·Step 1(측정·최적화)에 해당하는 구현 계약.
> living 문서 — 구현 중 계약이 바뀌면 기록을 덧붙이지 않고 본문을 직접 고친다.

## 문제 정의

- 4주차에 만든 ci.yml과 5주차 스타터 quality.yml이 5주 동안 모든 PR에서 동시 실행돼 왔다. ci.yml의 검증은 quality.yml의 완전 부분집합이라 PR마다 E2E·lint·unit이 두 번씩 돌았고, ci.yml의 Node 22 하드코딩은 .nvmrc(24)와 어긋난다.
- CI가 얼마나 걸리는지, 어디가 병목인지 측정된 적이 없다. 개선하려 해도 Before가 없다.
- 본인 fork에는 Actions 실행 이력이 0건이다. 측정 re-run·캐시 삭제·branch protection이 필요한 실험은 upstream에서 권한이 없어 불가능하므로, fork를 실험 무대로 만들어야 한다.

## 해결안

fork를 실험 무대로 준비한 뒤(Actions 활성화, main 통합, Vercel 연동), 손대기 전 상태를 같은 조건(cold/warm 각 3회)에서 측정해 병목을 타임스탬프로 지목하고, 병목에 맞는 전략만 적용해 같은 조건으로 After를 비교한다. 캐시는 hit 로그와 의도적 miss 재현으로 실제 작동을 증명한다. 결과는 docs/rfc/week10-ci.md에 기록한다.

## 사용자 스토리

1. 작성자로서, 손대기 전 CI의 cold/warm wall-clock(raw 3회·중앙값·범위)을 갖고 싶다. 개선 주장을 측정 흔들림과 구분하기 위해서다.
2. 작성자로서, 가장 긴 구간을 로그 타임스탬프로 지목하고 싶다. 느낌이 아니라 숫자로 전략을 고르기 위해서다.
3. 작성자로서, 병목과 무관한 최적화는 넣지 않거나 "안 넣은 근거"를 남기고 싶다. 7주차 방식의 회수이기 때문이다.
4. 작성자로서, ci.yml 삭제 효과(러너 사용 분 ×2→×1)를 wall-clock 개선과 분리해 기록하고 싶다. 두 workflow는 병렬이라 삭제가 wall-clock을 줄이지 않기 때문이다.
5. 작성자로서, warm 실행에서 캐시 복원 로그를, lockfile 변조에서 miss와 install 시간 차이를 확인하고 싶다. "캐시를 걸었다"가 아니라 "작동한다"를 증명하기 위해서다.
6. 작성자로서, 같은 PR에 연속 push하면 낡은 run이 취소되길 원한다. 리뷰 중 반복 push로 러너가 낭비돼 왔기 때문이다.
7. 작성자로서, main push의 run은 취소되지 않길 원한다. 취소하면 머지 직후 전체 E2E(사후 검출)가 사라지는 사고이기 때문이다.
8. 리뷰어(채점자)로서, Before/After가 같은 검증 항목·같은 조건에서 측정됐는지 문서에서 확인하고 싶다. 검증을 빼서 만든 빠름은 개선이 아니기 때문이다.
9. 리뷰어로서, 각 주장(병목·개선·캐시)에 Actions run URL이 붙어 있길 원한다. 재현·검증 가능해야 하기 때문이다.
10. 작성자로서, 이후 단계(조건부 실행·예산 게이트·main 머지 블로커) 실험을 위한 무대(fork main 통합, Actions 활성화, Vercel Production URL)가 준비되길 원한다.
11. 작성자로서, 측정·최적화 과정에서 AI가 초안·분석을 도운 부분을 표기하고 직접 검증한 기록을 남기고 싶다. 1~9주차 내내 유지해온 관행이기 때문이다.

## 구현 결정

- **workflow 통합 (ADR-1)**: quality.yml을 유지·보강하고 ci.yml은 삭제한다. 근거: 검증 집합이 부분집합, Node 버전 불일치, 하드닝(SHA 핀·permissions)이 quality.yml에 이미 있음. 삭제는 Before 측정 완료 후에 수행한다.
- **quality.yml 보강 항목**: `timeout-minutes` 추가(값은 warm 중앙값의 3~4배 수준으로, Before 측정 후 산정 근거와 함께 확정), `concurrency` 추가 — group에 workflow명+ref 포함, `cancel-in-progress`는 PR 이벤트에서만 참. 기존의 `.nvmrc` 기준 Node·`--frozen-lockfile`·`permissions: contents: read`·SHA 핀은 유지한다.
- **측정 프로토콜 (ADR-2·4)**: 비교 축은 quality.yml의 run wall-clock. cold = `gh cache delete --all` 후 같은 커밋 "Re-run all jobs" ×3, warm = 캐시 보존 re-run ×3. 3회인 이유: GitHub 러너의 시간대별 변동을 범위로 드러내기 위한 과제 요구 최소치. step별 시간은 run의 job/step 타임스탬프에서 수집한다.
- **`pnpm check` 내부 병목 분해**: check가 한 step이라 step 단위로는 내부(unit→lint→type→build→E2E)를 가를 수 없다. Actions raw 로그는 줄마다 타임스탬프가 있으므로, 각 하위 명령의 시작·종료 로그 라인 타임스탬프로 구간을 분해해 가장 긴 구간을 지목한다.
- **최적화 전략은 이 스펙에서 확정하지 않는다.** Before 측정이 병목을 지목한 직후, After 측정 전에 결정하고 그 근거를 docs/rfc/week10-ci.md에 기록한다(결정 시점 지정 — 막연한 미룸 아님). 예상 후보(job 병렬화, Playwright 브라우저 캐시)는 후보일 뿐 계약이 아니다.
- **job 병렬화를 채택하는 경우의 함정 확인(과제 명시)**: 각 job의 install 중복 시간이 병렬화 이득을 까먹지 않는지 job별 install 시간을 After 판정에 포함한다.
- **실험 무대 (ADR-3 개정)**: fork Actions 활성화 → feat/round-10을 origin에 push → feat/round-10 → fork main 통합 PR 머지(이후 main이 작업 최신 상태) → 측정용 실험 PR은 실험 브랜치 → main으로 생성. branch protection 설정은 Step 3 범위이므로 여기서는 걸지 않는다.
- **Vercel 연동 (ADR-9 개정)**: heeji289@gmail.com 계정, fork 연결, Production 브랜치는 main 기본값. 이 단계에서는 연동과 Production URL 확보까지만 하고 smoke test·env 분리는 이후 단계 범위다.
- **금지 조항**:
  - 검증 항목 제거로 시간 단축 금지 — 과제가 "test를 빼서 줄이는 건 개선이 아니다"로 명시.
  - ci.yml 삭제를 wall-clock 개선으로 서술 금지 — 병렬 실행이라 무영향(측정 정직성).
  - 측정용 cold 재현에 lockfile 변조 사용 금지 — lockfile 변조는 캐시 miss 재현 실험 전용으로 분리하고, 실험 후 원복한다(같은 커밋 측정 원칙과 실험 구분 유지).

## 테스트 결정

- **심(seam)은 하나**: fork 실험 PR의 Actions check run. 측정값 수집, 캐시 hit/miss 증명, 통합 후 정상 동작 확인이 전부 이 지점의 관찰로 이뤄진다. 새 테스트 코드·새 심은 만들지 않는다.
- **판정 방법 (완료 조건별)**:
  - Before/After 측정: docs/rfc/week10-ci.md에 cold·warm 각 3회 raw·중앙값·범위 표 + 각 run URL이 있으면 통과.
  - 병목 지목: step 타임스탬프 인용 1문단이 있으면 통과.
  - 개선 판정: (Before 중앙값 − After 중앙값) > 측정 범위이면 "개선", 아니면 "유의미하지 않음"으로 정직하게 기록 — 어느 쪽이든 판정이 기록되면 통과.
  - 캐시 hit: warm run 로그의 캐시 복원 메시지 캡처가 있으면 통과. miss: lockfile 변조 커밋의 run에서 miss 메시지 + install 시간 차이 기록 + lockfile 원복 커밋 확인이면 통과.
  - concurrency: 같은 PR에 연속 push 시 이전 run이 cancelled로 표시되고, main push run은 취소되지 않음을 run 목록으로 확인하면 통과.
  - 통합: ci.yml 삭제 후 PR에서 quality.yml 단독으로 전체 검증(unit·lint·type·build·E2E)이 돌면 통과.
- **선행 사례**: 7주차 measure-protocol.md(측정 조건 고정·중앙값·범위 기록 방식)를 그대로 따른다.

## 비범위

- 조건부 실행 설계 일체 — paths filter, guard job, @critical 태그, retries/trace, main push 전체 E2E, 주 1회 schedule (Step 2 스펙)
- 예산 게이트 — size-limit, validate-env(zod), branch protection·required 설정, 빨간불 PR 실험, 릴리즈 추적성 (Step 3 스펙)
- AI 리뷰 CI 통합·룰 승격 (Step 4·5 스펙)
- Docker 실습, rollback 답변, 회고 (Step 6 이후)
- 접근성: 이 스펙은 UI 변경이 없어 해당 없음 (기본 점검 항목이나 명시적으로 제외)

## 기타 노트

- 측정 기록의 본문은 docs/rfc/week10-ci.md, PR 본문에는 요약과 링크만 둔다.
- upstream 제출 PR(heeji289 base)에서도 변경된 quality.yml이 그대로 돌므로, 그 run URL을 "실전 동작" 보조 증거로 인용할 수 있다.
- AI 활용 표기: workflow YAML 수정 초안·측정 수집 명령을 AI가 도운 경우 PR에 표기하고, 병목 지목·전략 선택·판정은 본인이 한다(위임 경계).
