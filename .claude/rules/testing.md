---
paths:
  - "src/**/*.test.{ts,tsx}"
  - "scripts/**/*.test.ts"
  - "tests/**"
  - "e2e/**"
  - "vitest*.ts"
  - "playwright*.ts"
---

# 테스트 작성 규칙

- 기대값은 지킬 동작에서 나온다. 기대값이 틀렸다고 판단되면 고치기 전에 근거를 설명하고 묻는다. 현재 출력에 맞춰 기대값을 바꾸는 것은 금지.
- 실패하는 테스트는 살려 둔다. `it.skip` · `it.only` · 주석 처리로 끄지 않는다.
- 단언은 의도에 맞는 구체 matcher로 못 박는다 (`toBe` · `toHaveLength` · `toHaveTextContent` · `toBeDisabled`). `toBeTruthy` · `not.toBeNull` · `toBeDefined`는 쓰지 않는다.
- 모킹은 네트워크(MSW) · 시간 · 랜덤 · 브라우저 API에만 한다. 검증 대상은 실제 코드가 돈다.
- 테스트 이름은 "~하면 ~한다"로 조건과 결과를 담는다.
- 새 테스트는 한 번 빨간불을 본 뒤 초록으로 만들고, 그 사실을 보고한다.
- 쿼리는 역할 → 라벨 → 텍스트 순으로 시도한다 (RTL `getByRole` → `getByLabelText` → `getByText`, Playwright `getByRole` → `getByLabel` → `getByText`).

## 픽스처와 핸들러

- 픽스처는 앱 타입에서 가져와 계약이 바뀌면 먼저 깨지게 한다. 공용 응답 · 엔티티는 `tests/msw/fixtures.ts` 한 곳에서 만들고, 시나리오별 override만 테스트에 둔다.
- 실제 서버가 보낼 수 없는 조합은 만들지 않는다 (`discountRate: 150`, 음수 재고, 있을 수 없는 상태 쌍). 그런 값으로 통과한 테스트는 아무것도 보장하지 않는다.
- 픽스처의 개수 · 정렬 순서 · 경계값은 그 자체가 계약이다. 무엇을 지키려고 그렇게 뒀는지 주석으로 남긴다.
- 기본 핸들러는 성공 경로 하나씩만 둔다. 실패 · 지연 · 빈 결과는 그것을 확인하는 테스트가 덮는다.

## 검사기 테스트 (`scripts/**`)

CLI 검사 스크립트의 공개 동작은 **종료 코드와 진단 출력**이다. 함수를 import해 반환값만 보면 CI가 실제로 부르는 경로를 지키지 못한다.

- CI · 빌드가 부르는 명령을 그대로 실행하고 `status`와 출력을 단언한다.
- 통과 · 위반 · 입력 없음(미측정)을 각각 실행해 종료 코드와 진단을 못 박는다. 셋 중 둘이 같은 종료 코드를 쓰면 무엇으로 구별되는지까지 단언한다.
- 진단에 원인을 특정하는 값(초과량 · 누락된 대상 이름)이 실리는지 확인한다.

## E2E (`e2e/**`)

- 시작 경계를 명시한다. 테스트마다 `page.goto`로 시작하고 앞 테스트가 남긴 화면 상태에 기대지 않는다.
- 최종 사용자 결과를 단언한다. 토스트 문구나 로딩 표시가 아니라 주문 번호 · 목록에 남은 항목처럼 결과 자체로 확인한다.
- 로그인은 워커별 계정과 `storageState`로 재사용한다. **로그인 자체를 검증하는 테스트는 `storageState`를 쓰지 않는다** — 이미 로그인된 채 시작하면 로그인 흐름이 깨져도 통과한다.
- 워커마다 계정과 데이터를 갈라 두고, 단언은 그 테스트가 만든 데이터에만 건다. 전체 개수처럼 남의 데이터가 섞이는 값은 피한다.
- 대기는 조건으로 한다 — `expect`의 자동 재시도 · `waitForResponse`. 만료 같은 시각 의존 상황은 시나리오 쿠키처럼 결정적인 수단으로 재현한다. 고정 시간 대기(`waitForTimeout` · `setTimeout`)는 금지.
- flaky는 격리 설계로 없애고 원인을 trace에서 찾아 적는다. 재시도 · 대기 시간 늘리기 · 단언 약화로 만든 초록불은 flaky를 숨긴 것이다.
- 시각 회귀 · 탐색형 에이전트 · healer를 도입한다면 마스킹으로 줄어든 검증 범위와 바뀐 단언의 의미를 기록한다. 결과가 매번 다른 도구는 병합 게이트로 쓰지 않는다.

## 이 레포 하네스

- 환경은 파일 이름이 정한다: `*.dom.test.*` = jsdom · 그 외 `*.test.*` = node · `e2e/**/*.spec.{ts,tsx}` = Playwright(실제 브라우저).
- 비동기 전이마다 대표 조건 하나만 기다린다 — 등장은 `findBy`, 제거는 `waitForElementToBeRemoved`, 비-DOM 조건은 `waitFor`. 같은 전이의 나머지는 `getBy`로 동기 검증한다.
- 네트워크 차단은 `vitest.msw.setup.ts`가, 스토어 · localStorage 리셋은 jsdom에만 `vitest.setup.ts`가 이미 한다. 프로세스를 직접 띄우는 `integration-cli`(검사기) 프로젝트에는 setup이 없다 — 그 테스트는 spawn한 명령의 환경을 스스로 준다.
- 린트가 실제로 거는 범위는 `eslint.config.mjs`가 정본이다. 오늘 기준으로 비활성화 · 단언 없음 · truthiness 단언은 `{src,tests}/**/*.test.{ts,tsx}`에서 에러가 되고, `src/app/api/**`는 truthiness 조항만 꺼져 있다. 그 셋은 **`scripts/**`와 `e2e/**`에 걸리지 않는다** — 문장 규칙이라 사람과 리뷰가 확인한다.
- **날짜를 로케일 문자열로 직접 만들지 않는다.** `toLocaleDateString` · `toLocaleTimeString` · `new Date(...).toLocaleString`은 `{src,tests,e2e,scripts}`의 `.ts` · `.tsx`에서 린트 에러다 — `scripts/**`의 `.mjs` 검사기는 린트 대상 자체가 아니라 걸리지 않는다. 표시 타임존을 안 주면 결과가 실행 환경을 따라가, 테스트가 구현과 같은 식으로 기대값을 만들면 로컬(KST)과 CI(UTC)가 서로 다른 값을 단언하며 양쪽 다 통과한다. 표시 타임존을 고정한 `shared/format-datetime`을 쓰고, 테스트 기대값은 리터럴로 적는다. 금액 표시(`Number.toLocaleString`)는 대상이 아니다.
