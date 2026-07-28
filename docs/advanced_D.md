# Advanced D — 상태 아키텍처 테스트

## 선택한 이유
AI로던, 직접이던 테스트를 작성해 본 적이 거의 없기도 했고, 테스트에서 "계약" 이라는 부분의 개념이 아직 모호하기도 하여 피드백을 받고 싶어 선택

## 네 가지 테스트

### 1. Zustand action 과 selector

- **계약**: 상품의 "담기"를 누르면 그 버튼이 "담김"(`aria-pressed=true`)이 되고, 다시 누르면 원상복귀한다. 위시리스트(♡→♥)도 동형. — action 으로 상태를 바꾸면, 그 상태를 selector 로 구독한 버튼이 즉시 바뀐다.
- **관찰 방법**: `ProductCardActions`를 렌더하고 버튼을 클릭해 `getByRole("button", { name, pressed })`로 버튼 상태 전이만 본다. store 내부는 보지 않는다.
- **검증:** `src/components/commerce/commerceState.contract.test.tsx:66` (describe "Zustand action 과 selector" — "담기·위시 토글 action 이 selector 로 구독한 버튼 상태를 바꾼다").

### 2. 헤더 개수 파생

- **계약**: 저장값 복원 전엔 헤더가 실제 숫자 대신 placeholder(`–`)를 보여주고(서버/첫 렌더와 어긋나 깜빡이지 않도록), 복원 후엔 store 의 개수를 파생해 보여주며, "담기" 하면 그 개수가 즉시 오른다.
- **관찰 방법**: 복원 플래그를 `false`로 두고 렌더 → `장바구니 –`. 플래그를 `true`로 올리면 → `장바구니 0`. 이어서 "담기"를 누르면 → `장바구니 1`. placeholder→실제 개수→action 반영의 전이만 화면으로 확인한다.
- **검증:** `src/components/commerce/commerceState.contract.test.tsx:96` (describe "헤더 개수 파생" — "복원 전엔 실제 개수를 감추고, 복원 후엔 store 개수를 파생해 보이며 담기에 즉시 반응한다").

### 3. nuqs URL 조건과 TanStack Query query key 의 일치

- **계약**: URL 쿼리를 바꾸면 정확히 그 조건의 목록을 본다. URL 이 곧 보이는 목록의 단일 출처다.
- **관찰 방법**: `ProductList`를 `NuqsTestingAdapter`(테스트용 nuqs 어댑터)에 `searchParams`를 주입해 렌더하고(실제 URL 없이 그 값이 컴포넌트의 URL 상태가 됨, `getProducts`는 mock) 두 지점을 본다. ① `getProducts`가 `normalizeProductListQuery`함수로 정규화된 조건 **그대로** 호출됐는지(`toHaveBeenCalledWith`). ② nuqs URL 조건과 TanStack Query query key. URL→요청 인자→queryKey가 같은 조건을 가리켜야 "URL=보이는 목록"이 성립한다.
- **검증:** `src/components/commerce/commerceState.contract.test.tsx:124` (describe "nuqs URL 조건과 TanStack Query query key 의 일치" — "URL 조건이 그대로 목록 요청·queryKey 조건과 일치한다").

### 4. 홈과 목록이 같은 store 상태를 표시하는지

- **계약**: 홈에서 어떤 상품을 담으면, 목록 화면의 같은 상품도 담김으로 보이고 헤더 개수도 같이 오른다. 두 화면이 별도 상태를 갖지 않는다.
- **관찰 방법**: 같은 `productId`의 상품 액션을 "홈 surface"와 "목록 surface" 두 곳에 렌더하고 헤더도 함께 둔다. 한쪽에서 "담기"를 누르면 **다른 쪽 버튼**이 담김으로 바뀌고 헤더가 `장바구니 1`이 되는지 본다.
- **검증:** `src/components/commerce/commerceState.contract.test.tsx:160` (describe "홈과 목록이 같은 store 상태를 표시하는지" — "한 곳에서 담으면 다른 곳 같은 상품 버튼·헤더가 같이 바뀐다").

## 테스트 환경 결정 — jsdom + @testing-library (E2E 미도입)

store 공유·파생 값·URL→조건 매핑은 jsdom에 실제 컴포넌트를 렌더하는 것만으로 사용자 관찰 지점을 재현할 수 있어, 기존 `vitest` + `@testing-library/react`(jsdom) 스택으로 충분하다고 판단.