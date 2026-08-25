# Week 08 테스트 구현 기록

## 계획을 구현에 연결한 방식

| 방법론 | 구현한 범위                                                        | 실행 환경                   |
| ------ | ------------------------------------------------------------------ | --------------------------- |
| 단위   | `toggleSetItem`, `setReplacer`, `setReviver`                       | Node                        |
| 통합   | URL 조건과 query key, Header와 store, 목록의 요청 상태와 조건 변경 | jsdom + MSW                 |
| E2E    | 최초 route loading, URL 재진입, history, reload, 대표 담기 흐름    | production build + Chromium |

## Step 2 요구사항 대조

| 분류 | 요구사항                                                       | 테스트 코드 및 설정 위치                                                                                                                                                                                                                                                                    |
| ---- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 단위 | DOM 없이 실행                                                  | [`set.test.ts`](../../src/shared/lib/set.test.ts), [`vitest.config.ts`](../../vitest.config.ts)                                                                                                                                                                                             |
| 통합 | 네트워크를 MSW로 가로채고 HTTP 클라이언트를 직접 대체하지 않음 | [`ProductView.test.tsx`](../../src/app/products/_ui/ProductView.test.tsx), [`response.test.ts`](../../src/shared/api/response.test.ts), [`setup.ts`](../../test/msw/setup.ts)                                                                                                               |
| 통합 | 기본 handler에는 성공만 유지                                   | [`handlers.ts`](../../test/msw/handlers.ts), [`ProductView.test.tsx`](../../src/app/products/_ui/ProductView.test.tsx), [`setup.ts`](../../test/msw/setup.ts)                                                                                                                               |
| 통합 | 사용자가 인식하는 방식으로 요소 조회                           | [`ProductListSection.test.tsx`](../../src/widgets/product-list-section/ui/ProductListSection.test.tsx), [`ProductView.test.tsx`](../../src/app/products/_ui/ProductView.test.tsx), [`useProductListParams.test.tsx`](../../src/features/product-filter/model/useProductListParams.test.tsx) |
| 통합 | 필요한 비동기 상태만 대기                                      | [`ProductView.test.tsx`](../../src/app/products/_ui/ProductView.test.tsx), [`HomeView.test.tsx`](<../../src/app/(home)/_ui/HomeView.test.tsx>)                                                                                                                                              |
| 통합 | 전역 상태와 저장소 격리                                        | [`ProductView.test.tsx`](../../src/app/products/_ui/ProductView.test.tsx), [`ProductListSection.test.tsx`](../../src/widgets/product-list-section/ui/ProductListSection.test.tsx), [`vitest.setup.ts`](../../vitest.setup.ts), [`setup.ts`](../../test/msw/setup.ts)                        |
| E2E  | production build에서 실행                                      | [`playwright.config.ts`](../../playwright.config.ts), [`products.spec.ts`](../../e2e/products.spec.ts)                                                                                                                                                                                      |
| E2E  | 고정 시간 대기 금지                                            | [`products.spec.ts`](../../e2e/products.spec.ts)                                                                                                                                                                                                                                            |
| E2E  | 역할과 이름 기반 선택자 사용                                   | [`products.spec.ts`](../../e2e/products.spec.ts)                                                                                                                                                                                                                                            |

## `getByTestId`를 제거한 이유

기존 `useProductListParams.test.tsx`는 URL 조건과 query key의 일치를 확인하기 위해 `ParamsProbe`라는 테스트용 컴포넌트를 렌더링했다. 이 컴포넌트는 훅 반환값과 query key를 JSON 문자열로 DOM에 출력했고, 테스트는 `getByTestId('probe')`로 해당 값을 찾아 읽었다.

이 테스트용 컴포넌트는 실제 사용자 화면이 아니어서 의미 있는 역할이나 접근 가능한 이름, 연결된 레이블이 없었다. 컴포넌트를 유지한다면 `data-testid`로 찾을 이유는 있었지만, 확인하려는 대상은 화면이 아니라 훅의 반환값이었다. 따라서 `getByTestId`가 불가피한 것이 아니라 테스트용 DOM을 만든 구조부터 불필요하다고 판단했다.

훅 반환값은 `renderHook`의 `result.current`로 직접 확인하도록 바꾸고 테스트용 컴포넌트와 JSON 변환, `getByTestId`를 함께 제거했다. 실제 화면 요소를 검증하는 테스트에서는 역할, 접근 가능한 이름, 연결된 레이블과 사용자에게 표시되는 문구로 요소를 찾았다.

최종 구현에서는 다음 기준으로 요소를 찾았다.

- 버튼과 영역은 역할과 접근 가능한 이름으로 찾는다.
- 입력과 선택 상자는 연결된 레이블로 찾는다.
- 상태 안내는 사용자에게 실제로 표시되는 문구로 찾는다.
- 훅 반환값은 테스트용 DOM을 만들지 않고 `renderHook`으로 읽는다.

## 통합 테스트 격리

| 공유될 수 있는 상태               | 격리 방법                              |
| --------------------------------- | -------------------------------------- |
| React Query 캐시                  | 렌더마다 새 `QueryClient` 생성         |
| 장바구니·위시리스트 Zustand store | `beforeEach`에서 빈 Set으로 초기화     |
| `localStorage`·`sessionStorage`   | 공통 jsdom setup에서 각 테스트 뒤 정리 |
| MSW runtime handler               | 각 테스트 뒤 `resetHandlers()` 실행    |

기본 MSW handler에는 성공 응답만 두고 빈 결과, 서버 오류, 네트워크 오류와 지연은 해당 테스트 안의 `server.use()`에서 선언했다. 앱의 `fetch`나 API 함수를 직접 모킹하지 않아 URL 생성, HTTP 요청과 응답 파싱은 실제 코드로 통과시켰다.

## 통합 테스트와 E2E가 맡은 범위

| 방법론 | 맡은 경계                                                                               | 테스트 코드 위치                                                                                                                                                                                                                                    |
| ------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 통합   | API 요청과 응답, React Query 상태, 상품 카드와 Zustand store, Header와 화면 사이의 연결 | [`ProductView.test.tsx`](../../src/app/products/_ui/ProductView.test.tsx), [`ProductListSection.test.tsx`](../../src/widgets/product-list-section/ui/ProductListSection.test.tsx), [`Header.test.tsx`](../../src/widgets/header/ui/Header.test.tsx) |
| E2E    | production route의 로딩, 실제 주소창, URL 재진입, history, reload와 대표 상품 담기 흐름 | [`products.spec.ts`](../../e2e/products.spec.ts), [`playwright.config.ts`](../../playwright.config.ts)                                                                                                                                              |

통합 테스트는 MSW로 요청 조건과 응답 시점을 통제해 API 요청, 상태와 화면의 연결을 확인한다. E2E는 `next build`와 `next start`로 실행한 production 환경에서 브라우저가 맡은 동작을 확인한다.

## 계획 밖 후보를 실제 테스트로 추가했다

Step 1에서 “다음에는 하면 좋겠다”고 정했던 검색·필터 조건 초기화를 Step 2에서 통합 테스트로 추가했다. 카테고리 하나를 적용한 정상 케이스와 검색어, 카테고리, 정렬, 2페이지를 함께 적용한 경계 케이스에서 UI, URL, API 요청과 표시 목록이 모두 기본 조건으로 돌아가는지 확인한다. 테스트 코드는 [`ProductView.test.tsx`](../../src/app/products/_ui/ProductView.test.tsx)에 있다.

## 구현 완료 시점의 확인

- Step 1의 15개 항목을 단위·통합·E2E로 구현했다.
- `getByTestId`, `toBeTruthy`, skip, snapshot과 고정 sleep을 사용하지 않았다.
- 단위·통합 테스트와 lint, typecheck, production build를 `pnpm check`로 확인했다.
- production Chromium E2E 5개를 `pnpm test:e2e`로 확인했다.
- Step 3에서 사용할 단위·통합·E2E 변형 후보를 정한 뒤 구현 코드의 정상 상태를 기준점으로 남겼다.
