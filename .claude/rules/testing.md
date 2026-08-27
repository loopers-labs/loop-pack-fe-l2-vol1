---
paths:
  - "src/**/*.test.{ts,tsx}"
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

## 이 레포 하네스

- 환경은 파일 이름이 정한다: `*.dom.test.*` = jsdom · 그 외 `*.test.*` = node · `e2e/**/*.spec.{ts,tsx}` = Playwright(실제 브라우저).
- 비동기 전이마다 대표 조건 하나만 기다린다 — 등장은 `findBy`, 제거는 `waitForElementToBeRemoved`, 비-DOM 조건은 `waitFor`. 같은 전이의 나머지는 `getBy`로 동기 검증한다.
- 네트워크 차단은 모든 Vitest 테스트에 `vitest.msw.setup.ts`가, 스토어 · localStorage 리셋은 jsdom에만 `vitest.setup.ts`가 이미 한다.
