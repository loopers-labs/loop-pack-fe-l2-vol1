# RFC: Week 06 FSD Migration

> 문서 상태: Architecture Preflight 및 cart/wishlist capability 경계 결정 완료. RADIO 상세 설계 진행 중.

## 0. Architecture Preflight

### Invariants

폴더를 옮기더라도 아래 동작과 소유권은 바꾸지 않는다.

- 홈과 상품 목록의 서버 응답은 TanStack Query cache가 원본이다.
- 검색어, 카테고리, 정렬, 페이지는 URL이 원본이다.
- 장바구니와 위시리스트는 Zustand가 원본이다.
- 제출 전 검색어만 해당 폼의 React local state에 둔다.
- query key와 API 요청은 동일하게 정규화된 상품 목록 조건에서 파생한다.
- 개수, 포함 여부, 로딩, 에러, 빈 결과처럼 계산 가능한 값은 별도 원본으로 저장하지 않는다.
- 페이지 이동 중 cart와 wishlist 상태가 유지된다.
- URL 공유, 새로고침, 뒤로 가기와 앞으로 가기에서 같은 목록 조건을 복원한다.
- 이번 구조 변경에서는 mock API 계약과 사용자 동작을 변경하지 않는다.

### Current Evidence

아래는 목표 구조에 대한 제안이 아니라 현재 코드에서 확인한 사실이다.

- `src/stores/shopping.ts`
  - `cartIds`와 `wishlistIds`가 하나의 Zustand store에 있다.
  - cart와 wishlist의 toggle action, selector hook, 초기 상태, 전체 reset 경계가 같은 파일에 있다.
  - store 구현체는 외부에 공개하지 않고 용도별 selector/action hook만 공개한다.
- `src/stores/shopping.test.ts`
  - cart와 wishlist의 동작을 하나의 테스트 파일에서 검증한다.
- `src/components/commerce/ShoppingToggleButtons.tsx`
  - cart와 wishlist의 포함 여부 및 toggle action을 한 컴포넌트가 함께 소비한다.
- `src/components/commerce/HeaderCounts.tsx`
  - cart와 wishlist의 파생 count를 함께 소비한다.
- `src/components/commerce/ProductCard.tsx`
  - 상품 표현 컴포넌트가 `ShoppingToggleButtons`를 직접 import한다.
  - 현재 폴더에는 FSD 레이어가 없으므로 그 자체가 FSD 위반은 아니지만, 그대로 `entities/product`로 이동하면 product가 cart/wishlist 행위를 아는 역방향 의존이 된다.
- `src/app/page.tsx`, `src/app/products/ProductListView.tsx`
  - 홈과 상품 목록이 같은 `ProductCard`를 소비한다.
  - 상품 표현과 cart/wishlist 행위를 어디서 조합할지는 아직 별도 책임으로 드러나 있지 않다.
- `src/lib/commerce/api.ts`
  - HTTP 실패를 status 정보가 없는 일반 `Error`로 변환한다.
- `src/app`
  - 조회 실패는 현재 각 화면에서 인라인으로 처리한다.
  - route-level `error.tsx`는 아직 없다.
- 자동 기준선
  - 현재 `pnpm check`는 테스트 111건, lint, typecheck, production build까지 통과한다.
  - `package.json`은 Node `>=22.12.0`을 요구하지만 확인 환경은 Node `20.19.0`이었다.
- 수동 기준선
  - URL 공유, 새로고침, 뒤로/앞으로 가기와 실제 `Link` 이동은 문서에 수동 확인 필요 항목으로 남아 있다.

### 검증 시나리오

구조 결정에는 현재 근거가 있는 변화부터 사용한다. 가능하지만 근거가 없는 변화는 현재 결정을
정당화하지 않고, 선택안을 공격하거나 재검토 조건을 찾는 데만 사용한다.

| 시나리오 | 근거 수준 | 설계에서의 사용 |
| --- | --- | --- |
| 위시리스트 제거 | 필수 변경 시나리오 | 응집과 모델 독립 검증 |
| 신상품 배지 추가 | 필수 변경 시나리오 | Product 책임과 변경 반경 검증 |
| 검색 조건 전체 초기화 | 선택 검증 | URL 상태와 action 경계 검증 |
| cart/wishlist 전체 비우기 | 선택 검증 | action과 runtime 경계 검증 |
| wishlist 계정 동기화 | 근거가 확인된 변화 | 소유권 결정의 보조 근거 |
| cart 수량, 옵션 | 가상 스트레스 시나리오 | Revisit 조건 확인에만 사용 |

### Wishlist Removal Success Criteria

기본 완료 조건은 위시리스트 구현이 응집되어 있고, 제거 시 변경 반경을 사전에 예측할 수 있는
구조를 만드는 것이다.

본 RFC에서는 이를 더 엄격하게 검증하기 위해, 위시리스트 제거가 cart capability의 전용 모델,
외부 계약, 테스트에 영향을 주지 않는 **모델 독립**을 설계 성공 기준으로 채택한다. 이는 외부에서
주어진 정답이 아니라 본 설계에서 추가로 선택한 검증 기준이다.

공통 Zustand runtime 조립부와 상위 UI 조합부는 기능의 연결점을 명시하는 composition
root이므로 수정 대상이 될 수 있다.

#### Capability model

각 capability가 소유하는 데이터, selector, action과 그 전용 테스트다.

- cart capability model
- wishlist capability model

#### Runtime composition

여러 capability를 하나의 인메모리 Zustand runtime에 조립하는 경계다. 현재 persist나 세션
복원 정책은 없다.

- store 생성과 존속
- capability state/action 조립
- 공통 초기 상태
- 테스트 격리용 전체 reset
- 조립 결과에 대한 통합 테스트

#### UI composition

상품 표현, 사용자 행위, 전역 count를 화면에 배치하는 상위 경계다.

- 홈 페이지
- 상품 목록 페이지
- Header

### External Contract

cart capability의 외부 계약은 다음 중 외부 슬라이스가 실제로 import하는 항목이다.

- selector hook: `useCartCount`, `useIsInCart`
- action hook: `useToggleCart`
- cart 상태를 표현하기 위해 공개할 필요가 있는 타입
- 외부 테스트가 필요로 한다면 의도를 명시한 cart reset 계약

다음은 외부 계약이 아니라 내부 구현이다.

- Zustand `set`과 `get`
- capability를 runtime에 조립하는 방식
- 외부에서 import하지 않는 selector 함수
- 공통 store 생성 코드

위시리스트를 제거해도 cart 외부 계약의 이름, 입력, 반환 타입과 의미가 바뀌지 않아야 한다.

### Open Decisions

- cart와 wishlist capability를 어떤 물리적 경계로 분리할 것인가
- 분리된 capability를 하나의 Zustand store에 조립할 것인가, 독립 store로 둘 것인가
- 단순 toggle UI를 entity UI로 볼 것인가, 별도 정책을 가진 feature로 볼 것인가
- `ProductCard`와 cart/wishlist 행위를 page에서 직접 조합할 것인가, 반복 정책을 widget으로 승격할 것인가
- 상품 목록 queryOptions를 product entity와 product-list page 중 누가 소유할 것인가
- 어떤 슬라이스에 Public API가 필요한가
- API 실패, 렌더링 실패, 이벤트 행위 실패를 각각 어디까지 전파할 것인가

### Decision Priority

의견이 충돌하면 다음 순서로 판단한다.

1. 현재 코드에서 확인한 사실
2. 보존해야 할 invariant
3. 필수 변경 시나리오
4. 본 전환에서 적용할 의존 규칙
5. 구현 및 마이그레이션 비용
6. 근거가 확인된 변화
7. 일반적인 FSD 관례
8. 가상 스트레스 시나리오

## Decision 1. Cart/Wishlist Capability Boundary

### Context

Preflight에서 정한 모델 독립 기준을 cart와 wishlist 경계에 적용한다. 현재 두 capability는
하나의 Zustand store에서 생성, 초기화, reset, 통합 검증 경계를 공유한다.

이 결정에 필요한 현재 사실은 다음과 같다.

- `ShoppingState` 하나가 `cartIds`와 `wishlistIds`를 함께 선언한다.
- 초기 상태 객체가 두 capability의 필드를 함께 가진다.
- `resetShoppingState`가 두 capability를 한 번에 비운다.
- `shopping.test.ts` 하나가 두 capability의 동작을 함께 검증한다.
- 두 capability가 같은 Zustand runtime 위에서 생성되고 존속한다.

### Question

위시리스트 삭제라는 필수 변경 시나리오에 대응하면서, cart capability와 현재의 공통 Zustand
runtime 및 reset 경계를 동시에 보존하는 가장 작은 구조는 무엇인가?

### Options

| 기준 | A. 통합 모델과 store | B. capability 분리, store 통합 | C. 모델과 store 분리 |
| --- | --- | --- | --- |
| cart capability 독립 | 낮음 | 높음 | 높음 |
| 공통 Zustand runtime | 그대로 유지 | 그대로 유지 | 독립 runtime으로 분리 |
| 위시리스트 삭제 시 공통 runtime 수정 | 필요 | 필요 | 공통 registry나 reset이 있다면 필요 |
| cart 전용 runtime 수정 | 통합되어 있어 구분하기 어려움 | 불필요 | 불필요 |
| cart 전용 테스트 수정 | 발생 가능 | 불필요 | 불필요 |
| 현재 구조와의 거리 | 가까움 | 중간 | 멂 |
| 예상 추가 복잡도 | 낮음 | 중간 | 높음 |

마지막 행은 Experiment 이전의 예상이다. B의 실측 결과는 아래 Experiment에 있다.

#### A. 통합 모델과 통합 store 유지

현재 `shopping` 모델과 store 구조를 유지한다.

구조 비용은 가장 낮고 현재 구현과 가깝지만, 위시리스트 제거 시 통합 상태 타입, 초기 상태,
action, 테스트를 함께 수정해야 할 가능성이 있다. 위시리스트 변경이 cart capability의 모델과
검증 경계에 전파될 수 있으므로 본 RFC의 설계 성공 기준을 설명하기 어렵다.

#### B. Capability 모델 분리, runtime store 통합

cart와 wishlist의 상태, action, selector, 전용 테스트를 독립 capability로 분리하고, 하나의
Zustand runtime 조립부에서 결합한다.

runtime 생성, 전체 초기화, reset과 통합 검증 경계는 공유하지만, cart capability는 wishlist
capability의 존재를 알지 않는다.

#### C. Capability 모델과 runtime store 모두 분리

cart와 wishlist를 각각 별도의 Zustand store로 분리한다.

모델과 runtime의 독립성은 가장 높지만, 현재 코드에는 두 capability의 생성, 초기화, reset
정책을 별도로 운영해야 할 근거가 없다. 공통 reset 조율과 store 소비 방식이 추가되며 현재
구조와의 거리도 가장 크다.

### Experiment

B안을 두 가지 방식으로 실제 작성해 TypeScript strict 설정과 `eslint --max-warnings=0`으로
검증했다. 두 방식 모두 컴파일과 lint를 통과했으므로, 차이는 통과 여부가 아니라 결합 구조에
있었다.

#### Canonical slices pattern 적용

`StateCreator`의 전체 상태 타입으로 `CartSlice & WishlistSlice`가 필요했다.

이 구현에서는 cart slice creator가 wishlist를 포함한 aggregate store 타입을 알아야 한다.
위시리스트 capability를 제거하면 cart creator의 타입 계약도 함께 수정해야 하므로, 다음
Validation을 충족하지 못한다.

- cart 전용 모델을 수정하지 않는다.
- cart의 외부 selector/action 계약을 수정하지 않는다.
- cart 전용 테스트를 수정하지 않는다.

이는 같은 FSD 슬라이스 내부 import 자체의 위반은 아니다. 다만 본 RFC가 추가로 채택한
capability 모델 독립 기준에는 맞지 않는다.

#### Zustand 비인지 capability factory 적용

cart와 wishlist capability는 Zustand 타입이나 서로의 모델을 import하지 않는다. 각 capability가
필요한 최소 setter 계약만 받고 상태와 action을 생성하며, Zustand를 아는 코드는 공통 runtime
조립부에만 둔다.

실측 분량은 다음과 같다.

- cart capability: 20줄
- wishlist capability: 19줄
- runtime 조립부: 23줄
- 합계: 62줄
- 기존 `shopping.ts`: 51줄
- 증가량: 11줄

slice factory, aggregate store 제네릭, capability 간 직접 import 없이 설계 성공 기준을
만족할 수 있었다.

### Decision

B를 채택한다.

cart와 wishlist의 capability 모델, 외부 계약, 전용 테스트를 분리하고, 하나의 Zustand
runtime에서 조립한다.

구현에는 이번 프로젝트에서 실측한 Zustand 비인지 capability factory 방식을 사용한다.
canonical slices pattern을 직접 적용한 안은 capability creator가 aggregate store 타입을
알아야 했고, 위시리스트 제거가 cart 모델의 타입 계약에 전파되어 본 RFC의 모델 독립 기준을
만족하지 못했기 때문에 사용하지 않는다.

B안은 기존 구조보다 11줄 증가하지만 다음을 함께 만족한다.

- cart capability는 wishlist capability를 알지 않는다.
- 현재 하나인 Zustand runtime과 reset 경계를 유지한다.
- 독립 store를 도입하지 않는다.
- 위시리스트 제거 시 cart 전용 모델, 계약, 테스트를 보호한다.
- 추가되는 구조가 capability 모듈과 runtime 조립부에 한정된다.

### Rejected

#### A. 통합 모델과 통합 store

위시리스트 제거가 통합 상태 모델과 통합 테스트에 전파될 수 있다. 기본 완료 조건은 충족할
수 있지만, 본 RFC가 추가로 채택한 cart capability 모델 독립을 보장하기 어렵기 때문에
반려한다.

#### C. 모델과 store 모두 분리

현재 persist, 세션 복원, 독립 만료, 서로 다른 초기화 정책처럼 runtime을 분리해야 할 근거가
없다. 별도 store는 reset 조율과 소비 방식의 복잡도만 증가시키므로 현재 범위에서는 반려한다.

### Consequences

- capability마다 최소 setter 계약이 일부 반복된다.
- 공통 runtime 조립부는 capability 추가와 삭제 시 의도적으로 수정되는 composition root가 된다.
- cart와 wishlist에 동일한 ID 토글 로직이 소량 중복될 수 있다.
- canonical Zustand slices pattern을 사용하지 않는 이유를 코드와 RFC에서 함께 설명해야 한다.

`toggleId`와 같은 작은 로직은 현재 shared로 추출하지 않는다. 다만 이는 capability 독립을
위해 반드시 중복해야 하기 때문은 아니다. 두 capability가 공통의 도메인 무관 helper를 참조하는
것은 서로에 대한 의존이 아니라 하위 안정 코드에 대한 의존이므로 허용된다. 추출을 미루는 이유는
중복의 크기가 작고, 공통 추상화의 이름과 계약을 만드는 비용이 더 크며, 두 행위의 토글 정책이
계속 동일하다는 근거가 아직 없기 때문이다. 두 번째 사용이 생겼다는 사실만으로 바로 shared에
올리지 않는다.

### Validation

위시리스트 capability를 제거한다고 가정했을 때 다음 조건을 만족해야 한다. 실제 기능 삭제는
하지 않고 예상 삭제와 수정 목록을 작성해 대조한다.

수정하지 않는 대상

- cart capability 모델
- cart가 공개하는 selector/action 계약
- cart 전용 테스트
- product 모델
- 상품 조회 API와 Query 계약
- URL 상태 계약
- 위시리스트와 무관한 shared 코드

삭제하거나 수정할 수 있는 대상

- wishlist capability 모델과 전용 테스트
- wishlist 행위 UI
- 공통 Zustand runtime 조립부와 통합 테스트
- 홈과 상품 목록의 UI composition
- Header composition과 관련 통합 테스트

삭제 후에도 장바구니의 동작, 데이터 구조, 외부 계약은 유지되고, cart 전용 테스트는 수정 없이
통과해야 한다. 상위 composition 수정은 응집 실패가 아니라 명시적인 연결 제거로 분류한다.

### Revisit

다음 변화가 확인되면 runtime store 분리를 다시 검토한다.

- cart와 wishlist의 생성, 초기화, reset 정책이 달라진다.
- 한 capability만 persist 또는 세션 복원이 필요해진다.
- 두 capability가 서로 다른 서버 동기화 및 만료 정책을 가진다.
- 공통 runtime 조립부가 capability의 독립 변경을 반복적으로 방해한다.
- 통합 store 때문에 한 capability의 테스트가 다른 capability 설정을 필요로 한다.

## 1. RADIO

Preflight와 Decision 1을 검토한 뒤 현재 코드의 Requirements, Architecture, Data Model,
Interface, Optimization을 작성한다. 목표 트리는 Decision의 결과로 작성하며 미리 정답처럼
고정하지 않는다.
