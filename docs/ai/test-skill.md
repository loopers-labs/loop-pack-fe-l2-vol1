---
name: test-skill
description: 프론트엔드 테스트를 설계하거나 리뷰할 때, 단위·통합·E2E 경계와 테스트 하네스, 모킹 전략, 테스트 이름을 점검한다.
---

# Test Skill

프론트엔드 테스트를 작성하거나 리뷰할 때 사용한다. 목적은 테스트 개수를 늘리는 것이 아니라, 깨지면 안 되는 동작을 정하고 그 동작을 가장 적절한 테스트 레벨에서 지키는 것이다.

## 테스트 설계 기준

테스트를 쓰기 전에 먼저 검증할 동작을 문장으로 적는다.

- 사용자가 어떤 행동을 하는가?
- 어떤 상태나 화면 결과가 유지되어야 하는가?
- 이 테스트가 빨간불이 되면 무엇을 알 수 있는가?
- 이 테스트를 지웠을 때 아무도 보지 못하는 사실이 남는가?

`works`, `renders`, `should be true`처럼 실패해도 원인을 알기 어려운 이름과 단언은 피한다.

## 테스트 레벨 선택

### 단위 테스트

입력과 출력이 명확하고 DOM, 네트워크, React Query 없이 검증할 수 있으면 단위 테스트로 둔다.

적합한 대상:

- URL query 정규화
- query key 생성
- id set 정규화
- persist 저장값 정규화
- selector, formatter, 계산 함수

단위 테스트가 실패하면 어떤 입력이 어떤 출력으로 잘못 바뀌었는지 바로 보여야 한다.

### 통합 테스트

사용자 조작이 여러 레이어를 지나 화면 결과로 이어지면 통합 테스트로 둔다.

적합한 대상:

- 검색어 입력 후 URL query와 API 요청 조건이 함께 바뀌는 흐름
- 카테고리·정렬·페이지 조작 후 목록이 갱신되는 흐름
- React Query의 pending, empty, error, retry 화면
- 장바구니·위시리스트 action이 Header 개수로 이어지는 흐름

통합 테스트의 네트워크는 MSW로 가로챈다. HTTP 클라이언트나 `fetch`를 직접 바꿔치기하지 않는다.

### E2E 테스트

jsdom이나 컴포넌트 테스트로 흉내 내기 어려운 브라우저와 서버 경계만 E2E로 올린다.

적합한 대상:

- production build에서 서버 Suspense fallback이 먼저 보이는지
- slow 데이터가 document 진입을 막지 않는지
- URL 직접 진입, 새로고침, 뒤로 가기, 앞으로 가기
- hydration 이후 store와 Header가 실제 라우트에서 이어지는지

E2E는 느리고 실패 원인도 넓다. 통합 테스트가 이미 같은 사실을 보고 있다면 E2E로 반복하지 않는다. 판단 기준은 “이 E2E를 지웠을 때 아무 테스트도 검증하지 않는 사실이 남는가”이다.

## 정상 케이스와 경계 케이스

각 항목은 정상 케이스와 경계 케이스를 함께 둔다.

예시:

- 정상: `page=2`면 2페이지 상품을 요청한다.
- 경계: `page=-1`이면 기본 page로 조회하되 URL은 임의로 고치지 않는다.
- 정상: 카테고리를 바꾸면 새 목록을 보여준다.
- 경계: 카테고리를 바꿀 때 기존 page가 무효할 수 있으므로 page를 1로 초기화한다.
- 정상: 장바구니 버튼을 누르면 Header 개수가 1이 된다.
- 경계: 같은 버튼을 다시 누르면 Header 개수가 0으로 돌아온다.

경계 케이스는 “희귀한 입력”만 뜻하지 않는다. 이전 상태가 남아 있거나, 기본값이 생략되거나, 요청이 실패하거나, page가 범위를 벗어나는 상황도 경계 케이스다.

## 테스트 이름 규칙

새로 작성하는 테스트 이름은 국문으로 통일한다. 조건과 결과가 함께 드러나야 한다.

좋은 예:

- `상품 카드 action을 토글하면 커머스 헤더 개수가 함께 증가하고 감소한다`
- `products scenario를 error로 바꾼 뒤 reset하면 success 응답으로 복구된다`
- `mock API가 지연 응답해도 document 진입을 막지 않고 상품 목록으로 전환된다`

피할 예:

- `works`
- `renders`
- `should be true`
- `handles error`

기존 스타터 테스트의 영문 이름은 일괄 변경하지 않는다. 단, 새 파일과 새 케이스는 같은 규칙을 따른다.

## 통합 테스트 하네스

반복되는 render setup은 공통 helper로 모은다.

공통화할 대상:

- `QueryClientProvider`
- app QueryClient factory
- `NuqsTestingAdapter`
- 기본 route와 searchParams
- URL update observer

QueryClient는 테스트 전용 정책을 기본값으로 만들지 않는다. production 코드와 같은 factory를 사용하고, 특별히 다른 정책이 필요한 테스트만 명시적으로 override한다.

예를 들어 앱 QueryClient가 `retry: 1`이면 에러 테스트도 첫 실패 즉시 실패 화면을 기대하지 않는다. 자동 retry까지 실패한 뒤 에러 UI가 나타나는지 확인한다.

## MSW 통합 테스트 규칙

MSW 기본 handler에는 성공 경로만 둔다. 실패, 지연, 빈 결과는 각 테스트 안에서 `server.use(...)`로 덮어쓴다.

규칙:

- `onUnhandledRequest: "error"`로 모킹되지 않은 요청을 막는다.
- 테스트 후 `server.resetHandlers()`로 handler를 되돌린다.
- `vi.mock("../api/...")`, `vi.spyOn(globalThis, "fetch")`로 HTTP 경계를 우회하지 않는다.
- 요청 조건은 handler의 `request.url`에서 확인한다.
- 모든 검증을 `waitFor`로 감싸지 않는다. 첫 비동기 전환만 기다리고, 이후 화면 단언은 가능한 동기로 확인한다.

## E2E 모킹 전략

App Router에서는 서버 컴포넌트 prefetch와 브라우저 fetch가 서로 다른 위치에서 실행된다. Playwright `page.route()`는 브라우저 요청만 가로챌 수 있으므로 서버 prefetch까지 제어해야 한다면 충분하지 않다.

선택 기준:

- 브라우저 요청만 확인하면 되면 `page.route()`를 고려한다.
- 서버 fetch까지 같은 시나리오로 제어해야 하면 별도 mock API 서버를 고려한다.
- `msw/node`를 Next 런타임에 붙일 수도 있지만, 테스트 인프라가 앱 런타임 안으로 들어오는 비용을 함께 판단한다.

별도 mock API 서버를 둘 때는 사용자 URL에 테스트용 query를 섞지 않는다. 테스트는 mock API의 제어 endpoint로 scenario를 바꾸고, 사용자는 평범한 URL로 진입한다.

```text
Playwright test
-> POST /__test__/scenario
-> page.goto("/products")
-> Next server fetch /api/products
-> Browser fetch /api/products
-> Mock API server
```

서버 런타임 fetch와 브라우저 fetch가 같은 mock origin을 보게 하려면 환경변수를 분리한다.

- `INTERNAL_API_BASE_URL`: 서버 런타임 fetch 목적지
- `NEXT_PUBLIC_API_BASE_URL`: 브라우저 번들 fetch 목적지

`NEXT_PUBLIC_*` 값은 build 시점에 번들에 들어가므로, E2E production build를 만들 때도 같은 값을 넣어야 한다.

## Selector 규칙

사용자가 인식하는 방식으로 요소를 찾는다.

우선순위:

1. role + name
2. label text
3. visible text
4. placeholder
5. test id

`getByTestId`는 마지막 수단이다. 사용자가 인식할 수 있는 이름이 없어서 test id를 썼다면, 왜 role/label/text로 찾을 수 없었는지 기록한다.

## 자가 검증

테스트를 만든 뒤에는 구현을 잠시 망가뜨려 실제로 회귀를 잡는지 확인한다.

좋은 실험:

- 테스트가 직접 겨냥한 줄만 바꾸지 않고 주변 경계도 바꿔본다.
- 테스트를 지웠을 때 놓치는 사실이 무엇인지 적는다.
- 실패 메시지만 보고 원인을 좁힐 수 있는지 확인한다.
- 살아남은 변경이 있으면 테스트 사각인지, equivalent mutant인지 구분한다.

손으로 고른 회귀 실험은 자기 확인이 되기 쉽다. 가능하면 mutation testing처럼 사람이 고르지 않은 변형도 함께 참고한다.

## 하지 않을 것

- 테스트를 통과시키려고 기능을 지우지 않는다.
- `it.skip`이나 주석 처리로 실패 테스트를 숨기지 않는다.
- 스냅샷으로 사용자 관찰 결과 검증을 대체하지 않는다.
- `toBeTruthy()`처럼 아무것도 보장하지 않는 단언으로 때우지 않는다.
- E2E에 sleep을 넣지 않는다. 조건 기반 대기를 사용한다.
- 모든 케이스를 E2E로 올리지 않는다.
