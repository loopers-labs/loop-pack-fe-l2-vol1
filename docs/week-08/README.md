# 8주차 — 테스트

계층을 나눠 테스트를 다시 짜고, 그 테스트가 진짜로 회귀를 잡는지 두 가지 방법(직접 망가뜨리기 / Stryker)으로 확인한 주차다.

**판단과 결과는 아래 문서에 있다. 이 파일은 어디를 보면 되는지만 답한다.**

## 문서 지도

| 문서                                                                                    | 무엇이 있나                                                                              |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **[`../rfc/week08-test-plan.md`](../rfc/week08-test-plan.md)**                          | **여기서 시작.** 1단계 설계 — 15개 항목의 계층·이유·빨간불, 애매했던 판단 2개, 모킹 경계 |
| [`step0-status.md`](./step0-status.md)                                                  | 시작 시점 환경 점검과 고쳐야 할 지점, 환경 셋업 시간 비교                                |
| [`step2-plan.md`](./step2-plan.md)                                                      | 2단계 실행 계획(Phase 0~5)과 결정 이력                                                   |
| [`step2-review.md`](./step2-review.md)                                                  | 계획서와 코드가 어긋난 5자리, 원인 4유형                                                 |
| [`step3-plan.md`](./step3-plan.md) · [`step3-result.md`](./step3-result.md)             | 계층마다 구현을 한 곳씩 망가뜨린 실험 3개                                                |
| [`advanced-plan.md`](./advanced-plan.md) · [`advanced-result.md`](./advanced-result.md) | Stryker mutation testing 실행과 살아남은 변형 분류                                       |

다시 돌릴 때 쓸 절차는 [`.agents/skills/mutation-testing/SKILL.md`](../../.agents/skills/mutation-testing/SKILL.md)에 있다.

## 계층을 고르는 순서

세 질문을 순서대로 묻고, 처음 "그렇다"가 나오는 곳에서 멈춘다.

1. 렌더링 없이 값이나 상태만 확인해도 되는가? → **단위** (Vitest, node)
2. 렌더링된 요소와 상호작용하면 충분한가? → **통합** (Testing Library + jsdom + MSW)
3. 실제 브라우저의 탐색·렌더링·API가 있어야 재현되는가? → **E2E** (Playwright)

같은 동작을 두 계층에서 중복 검증하지 않는다. 항목별로 왜 그 계층에 뒀는지는 [1단계 설계](../rfc/week08-test-plan.md)의 표에 있다.

## 테스트가 있는 자리

| 계층 | 파일                                                                                                                                                                                | 보는 것                                    |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 단위 | `shared/lib/get-total-pages.test.ts`, `shared/lib/create-collection-store.test.ts`, `entities/product/api/{api,queries}.test.ts`, `_pages/product-list/model/search-params.test.ts` | 순수 계산, URL parser, 에러 분류, persist  |
| 통합 | `_pages/product-list/ui/ProductListContent.test.tsx`, `_pages/product-list/model/useProductFilters.test.tsx`, `widgets/header/Header.test.tsx`                                      | 로딩·빈 결과·에러·재시도, 필터·정렬·페이지 |
| E2E  | `e2e/state-restoration.spec.ts` (10개)                                                                                                                                              | URL 재진입, 뒤로/앞으로, persist 복원      |

각 테스트 파일 상단에는 1단계 설계의 항목 번호를 주석으로 달아 문서와 코드를 연결했다.

## 실행

```bash
pnpm test        # 단위·통합 (node/jsdom project 분리)
pnpm verify      # test + lint + typecheck
pnpm test:e2e    # production build 후 Chromium·WebKit
pnpm test:mutation
```

E2E는 `pnpm test`에 넣지 않고 별도 명령·별도 workflow로 뒀다. 근거는 [`step0-status.md`](./step0-status.md)에 있다.

---

_이 문서는 Claude Code가 `docs/week-08/`의 문서들과 `docs/rfc/week08-test-plan.md`를 읽어 목차 형태로 정리한 것이다. 판단과 수치는 옮기지 않고 원 문서로 넘긴다._
