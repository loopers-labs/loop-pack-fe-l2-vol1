# RFC: Week 06 FSD Migration

> 문서 상태: Preflight, Decision 1~6, 목표 트리와 파일 매핑 완료. 마이그레이션 진행 중.

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

아래는 목표 구조에 대한 제안이 아니라 **전환 전 코드에서 확인한 사실**이다. 모든 결정이 이
사실 위에 서 있으므로 마이그레이션이 끝난 뒤에도 갱신하지 않고 그대로 둔다. 지금 트리와
대조하려면 [목표 트리](#목표-트리)를, 각 파일이 어디로 갔는지는
[파일 매핑표](#파일-매핑표)를 본다.

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
  - HTTP 실패를 status와 서버 메시지를 가진 `ApiError`로 변환한다. 재시도 가능 여부와
    표시 문구 판단도 여기서 공개한다. 요청에 취소 신호와 타임아웃을 함께 건다.
- `src/lib/commerce/productListContract.ts`
  - 목록 조건의 허용값과 유효성 판정. 클라이언트 parser와 서버 route가 함께 소비하는
    유일한 모듈이다. `app/api`의 route handler가 `lib`을 참조하는 유일한 지점이기도 하다.
- `src/app`
  - 조회 실패는 현재 각 화면에서 인라인으로 처리한다.
  - route-level `error.tsx`는 아직 없다.
- 자동 기준선
  - 현재 `pnpm check`는 테스트 134건, lint, typecheck, production build까지 통과한다.
    5주차 피드백 반영 전에는 111건이었다. 구조 이동 후에도 이 기준선을 유지한다.
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

상위 UI 조합부는 기능의 연결점을 명시하는 composition root이므로 수정 대상이 될 수 있다.

#### Capability model

각 capability가 소유하는 데이터, selector, action, store 생성과 그 전용 테스트다.
[Decision 1의 개정](#개정--b에서-c로)으로 store 생성이 여기에 포함됐다. 개정 전에는 아래에
별도의 Runtime composition 경계를 두고 두 capability를 한 store에 조립했는데, 그 조립부가
레이어 방향과 충돌해 없앴다.

- cart capability model
- wishlist capability model

현재 persist나 세션 복원 정책은 없다. 테스트 격리용 reset은 capability마다 하나씩 두고,
테스트 헬퍼가 둘을 함께 부른다.

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
- store 생성 코드

위시리스트를 제거해도 cart 외부 계약의 이름, 입력, 반환 타입과 의미가 바뀌지 않아야 한다.

### Open Decisions

앞 결정의 결과가 뒤 결정의 입력이 되므로 의존 순서대로 배치한다.

| # | 결정 | 선행 조건 | 판단 방법 |
| --- | --- | --- | --- |
| 1 | cart와 wishlist capability 경계와 runtime 조립 방식 | 없음 | 완료. [Decision 1](#decision-1-cartwishlist-capability-boundary) |
| 2 | 단순 toggle UI를 entity의 공개 UI로 볼 것인가, 별도 정책을 가진 feature로 볼 것인가 | Decision 1 | 완료. [Decision 2](#decision-2-toggle-ui의-레이어) |
| 3 | `ProductCard`와 행위를 page에서 조합할 것인가, widget으로 승격할 것인가 | Decision 2 | 완료. [Decision 3](#decision-3-productcard-조합-위치) |
| 4 | 상품 목록 queryOptions의 소유자 | Decision 3의 트리 형태 | 완료. [Decision 4](#decision-4-상품-조회-계약의-소유자) |
| 5 | 어떤 슬라이스에 Public API를 둘 것인가 | Decision 2~4와 목표 트리 | 완료. [Decision 5](#decision-5-public-api-경계) |
| 6 | API 실패, 렌더링 실패, 이벤트 행위 실패의 전파와 복구 경계 | 구조 결정과 독립 | 완료. [Decision 6](#decision-6-실패의-전파와-복구-경계) |

레이어 개수는 독립 결정으로 다루지 않는다. 개수를 먼저 정하면 그 수를 맞추려고 파일을 끼워
넣게 된다. 앞선 경계 결정 결과 실제 책임이 생긴 레이어만 사용하고, 최종 목표 트리에서 사용한
레이어와 사용하지 않은 레이어를 근거와 함께 기록한다.

Public API도 독립 결정이 아니라 슬라이스 경계가 정해진 뒤 적용하는 경계 통제 정책이다. 먼저
정하면 빈 `index.ts`를 양산하거나 슬라이스가 바뀔 때 다시 쓰게 된다. 순서는 슬라이스 경계
결정, 외부 소비자 확인, 숨길 구현 확인, 필요한 곳에만 생성이다.

### 멘토링 세션 입력

2026년 7월 29일 멘토링에서 나온 판단 기준이다. 우리 코드를 보고 한 말이 아니라 실무 경험에서
나온 조언이므로, 사실과 섞지 않고 따로 적는다. Decision Priority에서의 순위도 아래에 정한다.

| 주제 | 조언 | 영향받는 결정 |
| --- | --- | --- |
| FSD 도입 시점 | 신규 프로젝트가 가장 좋은 타이밍이다. `shared`를 먼저 강화하고 경계부터 지킨다 | 목표 트리, Phase 순서 |
| 도메인 경계와 라이브러리 관례 충돌 | 도메인 경계를 우선한다. 라이브러리 경계와 충돌하면 내 설계를 먼저 의심한다 | Decision 1 재검토 |
| 조합 지점의 레이어 | 여러 경로가 만나는 조합 지점은 widget이다 | Decision 3 검증 |
| 여러 도메인을 합친 응답 | 조합은 widget이나 page가 하고, entity는 공통 응답에서 `select`로 필요한 모델만 꺼낸다 | Decision 4의 경쟁안 |
| Error Boundary 범위 | 페이지 단위가 아니라 컴포넌트 단위가 기준이다. 4xx나 5xx 때문에 화면 전체가 사라지면 인과관계가 이상하다는 신호다 | Decision 6 |
| Suspense 경계 | 고객 경험을 기준으로 나눈다 | Decision 6 |
| 죽은 코드 | 정적 분석으로 찾는다 | Advanced 범위 |

#### 이미 내린 결정에 대한 영향 판정

- **Decision 3은 지지받는다.** "여러 경로가 만나는 조합 지점은 widget"은 `ProductCard`와 두
  토글을 `widgets/product-grid`에서 조합하기로 한 결론과 같다. 다만 이 조언은 결론을 만든
  근거가 아니라 사후 확인이다. Decision 3의 근거는 여전히 20줄짜리 공통 조합 블록이다.
- **Decision 1은 이 시점에는 유지로 판정했고, 이후 개정했다.** "라이브러리와 충돌하면 내
  설계를 의심하라"를 처음 적용했을 때는 충돌 지점을 Zustand의 canonical slices 관례 하나로
  봤고, 우리 factory가 그 관례를 우회해 도메인 경계를 지키므로 조언과 같은 방향이라고
  판단했다. 목표 트리를 그리면서 두 번째 충돌을 발견했다. 관례를 우회한 그 factory가 이번에는
  레이어 방향과 부딪힌다. 조언이 가리키던 것이 하나가 아니었다.
  [Decision 1의 개정](#개정--b에서-c로)에 경위와 판단을 적었다.
- **Decision 4에는 검토하지 않은 경쟁안이 생겼다.** 홈은 배너, 카테고리, 인기 상품, 신상품을
  한 응답으로 받는 다중 도메인 응답이다. 조언은 entity가 공통 응답을 받고 `select`로 자기
  모델만 꺼내는 방식을 제시한다. Decision 4는 이 선택지를 놓고 비교하지 않았다.
  [Decision 4의 Revisit](#revisit-3)에 추가하고, 이번 전환에서는 결론을 바꾸지 않는다.
  이유는 두 가지다. `select`는 캐시 원본을 그대로 두고 파생만 바꾸므로 소유자 결정과 직교하고,
  구조 이동과 조회 방식 변경을 같은 커밋에 섞지 않는다는 이번 범위 규칙에 걸린다.

### Decision Priority

의견이 충돌하면 다음 순서로 판단한다.

1. 현재 코드에서 확인한 사실
2. 보존해야 할 invariant
3. 필수 변경 시나리오
4. 본 전환에서 적용할 의존 규칙
5. 구현 및 마이그레이션 비용
6. 근거가 확인된 변화
7. 멘토링에서 받은 실무 조언
8. 일반적인 FSD 관례
9. 가상 스트레스 시나리오

실무 조언을 관례보다 위, 우리 코드에서 확인한 사실보다 아래에 둔다. 관례보다 위인 이유는
구체적인 실패 경험에서 나왔기 때문이고, 사실보다 아래인 이유는 우리 코드를 보고 한 말이
아니기 때문이다. 조언과 우리 코드의 사실이 어긋나면 사실을 따르고 그 차이를 기록한다.

## Decision 1. Cart/Wishlist Capability Boundary

> 이 결정은 [개정](#개정--b에서-c로)되어 최종 선택이 B에서 C로 바뀌었다. 아래 Context부터
> Validation까지는 개정 전 기록이며, 판단이 어떻게 바뀌었는지 보이도록 지우지 않고 남긴다.

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

### 개정 — B에서 C로

목표 트리를 그리다 이 결정이 레이어 방향과 충돌하는 것을 발견했다. Decision 1을 내릴 때는
각 조각이 어느 레이어에 앉을지 아직 정하지 않았기 때문에 보이지 않던 문제다.

#### 발견한 충돌

B의 "공통 runtime 조립부"는 두 capability를 함께 import한다. 두 capability가 `entities`에
있으므로 조립부는 그보다 위 레이어에 있어야 한다. 그런데 Decision 2가 토글 UI를
`entities/cart/ui`에 두기로 했고, 그 UI는 `useIsInCart` 같은 selector를 소비한다. selector는
store 인스턴스를 읽으므로 조립부에 있다. 결과는 `entities` → 상위 레이어 import, 즉 역방향
의존이다.

빠져나갈 길을 셋 검토했다.

| 방법 | 결과 |
| --- | --- |
| store 인스턴스를 `shared`에 둔다 | 합쳐진 store 타입이 두 capability 상태를 알아야 해서 `shared` → `entities` 의존이 생긴다 |
| 조립부가 store를 props로 내려준다 | 조합부부터 leaf까지 store를 들고 내려가야 한다. Decision 3의 조합 코드가 커진다 |
| 토글 UI를 조립부와 같은 레이어로 올린다 | Decision 2를 뒤집는다. 정책이 없는 UI를 위해 레이어를 여는 것과 같아진다 |

셋 다 원래 결정 하나를 깨거나 더 큰 결합을 만든다.

#### 판단

C(모델과 store 모두 분리)로 바꾼다. 근거는 두 가지다.

첫째, 원래 C를 반려한 근거가 약해졌다. 반려 사유는 "runtime을 분리해야 할 근거가 없고 reset
조율과 소비 방식의 복잡도만 증가한다"였다. 그런데 B를 유지하려면 위 표의 비용 중 하나를 내야
하고, 그 비용이 reset 조율보다 크다. 비교 대상이 "복잡도 증가 대 0"에서 "복잡도 증가 대
역방향 의존"으로 바뀌었다.

둘째, [멘토링 입력](#멘토링-세션-입력)의 "도메인 경계를 우선하고 라이브러리 경계와 충돌하면 내
설계를 의심한다"가 여기에 정확히 걸린다. 하나의 store에 슬라이스를 모으는 것은 Zustand의
관례이지 도메인의 요구가 아니다. cart와 wishlist는 서로를 모르는 독립 capability로 정했고,
그 경계를 지키려고 라이브러리 관례를 우회하는 factory를 만들었는데, 그 우회가 이제 레이어
규칙까지 건드리고 있다. 관례를 지키려고 설계를 비트는 중이라는 신호로 읽는다.

#### 바뀌는 것

- capability마다 자기 Zustand store를 만든다. Zustand 비인지 factory와 setter 계약이 필요
  없어져 Decision 1의 Consequences 첫 항목과 넷째 항목이 사라진다.
- `resetShoppingState` 하나가 capability별 reset 둘로 나뉜다. 테스트 격리는 둘을 함께 부르는
  헬퍼로 처리한다. 이것이 C를 반려했던 "reset 조율" 비용이며, 실제 크기는 헬퍼 한 줄이다.
- 위시리스트 삭제 반경이 세 곳에서 두 곳으로 줄어든다. 공통 runtime 조립부가 없어지므로
  `widgets/product-grid` 조합부와 Header만 남는다. [Decision 2의 삭제 반경 기록](#선택과-무관하게-나온-결과)이
  이 개정으로 갱신된다.
- Decision 2와 Decision 3은 그대로 성립한다. 오히려 `entities/*/ui`가 같은 슬라이스의
  `model`만 참조하면 되므로 Decision 2의 근거가 단순해진다.

#### 바뀌지 않는 것

모델 독립이라는 설계 성공 기준과, 위시리스트 삭제가 cart 모델과 계약과 테스트에 전파되지
않아야 한다는 Validation은 그대로다. C는 이 기준을 B보다 강하게 만족한다.

### Revisit

개정으로 store가 이미 분리됐으므로, 반대 방향인 통합을 다시 검토할 조건을 적는다.

- 두 capability가 항상 함께 초기화되고 함께 비워져야 하는 정책이 생긴다.
- 한쪽을 바꿀 때 다른 쪽도 같은 이유로 바뀌는 일이 반복된다.
- 두 store를 함께 다뤄야 하는 조합 코드가 늘어 조합부가 store 조립처럼 보이기 시작한다.
- persist가 생기고 두 capability가 같은 저장 키와 만료 정책을 공유해야 한다.

## Decision 2. Toggle UI의 레이어

### Context

[Decision 1](#decision-1-cartwishlist-capability-boundary)에서 cart와 wishlist의 capability
모델을 분리했다. 그 모델을 소비해 담기와 찜 버튼을 그리는 UI를 어느 레이어에 둘지 정한다.

이 결정에 필요한 현재 사실은 다음과 같다.

- `ShoppingToggleButtons.tsx` 하나가 담기와 찜 두 행위를 함께 그린다. Decision 1이 두
  capability를 분리했으므로 이 컴포넌트도 갈라진다.
- 현재 토글에는 정책이 없다. 조건 판단, 부수효과, 실패 경로가 모두 없고 `set` 한 번으로 끝난다.
- 토글 UI는 홈과 상품 목록 양쪽에서 쓰인다. 한 페이지에 갇힌 UI가 아니다.

### Question

정책이 없는 토글 UI를 entity의 공개 UI로 둘 것인가, 사용자 행위를 나타내는 별도 feature
슬라이스로 올릴 것인가.

### Options

| 기준 | A. entity의 공개 UI | B. 별도 feature 슬라이스 |
| --- | --- | --- |
| 배치 | `entities/cart/ui`, `entities/wishlist/ui` | `features/toggle-cart-item`, `features/toggle-wishlist-item` |
| model 접근 | 같은 슬라이스 안 세그먼트 협력 | 하위 entity의 Public API 소비 |
| FSD 정의와의 거리 | 행위를 도메인 개념 레이어에 둔다 | 행위를 행위 레이어에 둔다 |
| 정책이 생겼을 때 | feature로 승격하며 소비처 import가 바뀐다 | 자리 이동 없이 model과 api 세그먼트를 채운다 |

### Experiment

두 안을 폐기용 spike로 작성해 TypeScript strict 설정과 `eslint --max-warnings=0`으로
검증했다. 두 안 모두 통과했고, 어느 쪽도 의존 규칙을 어기지 않는다. A의 `ui`가 `model`을
참조하는 것은 같은 슬라이스 안 세그먼트 협력이므로 허용된다.

#### 선택과 무관하게 나온 결과

위시리스트 capability를 삭제한 뒤 깨지는 파일은 두 안이 같았다. spike 기록에는 두 개로
적었으나 Header를 실험 범위에서 빠뜨린 결과다. 목표 구조에서 살아남아 수정해야 하는 생산 코드
경계는 두 곳이다.

- 상위 조합부 (Decision 3 이후 `widgets/product-grid`)
- Header 조합부 (`HeaderCounts`)

기록이 두 번 바뀌었다. 처음 spike는 "공통 Zustand runtime 조립부와 상위 조합부" 두 개로
적었고, Header를 빠뜨린 것을 찾아 세 개로 고쳤다. 이후 [Decision 1의 개정](#개정--b에서-c로)으로
공통 runtime 조립부 자체가 없어져 다시 두 개가 됐다. 숫자는 처음과 같지만 내용은 다르다.

`entities/wishlist/ui`와 `entities/wishlist/model`은 폴더째 지우므로 "깨지는 생존 파일"에
넣지 않는다. 두 곳 모두 [Decision 1](#decision-1-cartwishlist-capability-boundary)의 Validation이
이미 삭제하거나 수정할 수 있는 대상으로 열거한 항목이다.

Header가 위시리스트 개수를 소비하는 것은 경계 누수가 아니다. 개수 표시는 정당한 외부 소비이고
현재도 `useWishlistCount`라는 의도 기반 selector만 쓴다. 다만 wishlist 슬라이스에 조합부 밖의
외부 소비자가 있다는 뜻이므로 Decision 5의 입력이 된다.

cart 모델과 cart가 공개하는 계약은 어느 쪽에서도 수정 대상에 나타나지 않았다. Header는 두
capability를 함께 소비하지만 위시리스트 줄만 제거하면 되고 cart 계약은 그대로다. Decision 1의
capability 분리가 이 결정의 선택과 독립적으로 Validation 조건을 만족한다는 뜻이다. 따라서 이
결정은 삭제 반경이 아니라 구조 비용으로 판단해야 한다.

#### 측정값

| 기준 | A | B |
| --- | --- | --- |
| 파일 수 | 9 | 13 |
| 줄 수 | 176 | 187 |
| 조합부가 import하는 슬라이스 | entity 3개 | entity 1개와 feature 2개 |
| 위시리스트 삭제 시 지울 폴더 | `entities/wishlist` 한 곳 | `entities/wishlist`와 `features/toggle-wishlist-item` 두 곳, 두 레이어 |
| 조합 코드 | 32줄 | 31줄 |
| feature 슬라이스의 세그먼트 | 해당 없음 | `ui` 하나. `model`과 `api`는 비어 있다 |

조합 코드가 32줄과 31줄로 사실상 같다. 이 결정은 상위 조합의 모양을 바꾸지 않는다.

B의 두 feature 슬라이스는 각각 `ui` 세그먼트에 파일 하나만 가진다. 담을 정책이 없기 때문이다.

### Decision

A를 채택한다.

토글 UI를 각 capability의 entity 슬라이스 안 `ui` 세그먼트에 두고, 같은 슬라이스의 `model`을
소비한다. feature 레이어는 이 결정으로 열지 않는다.

정책이 없는 상태에서 feature 슬라이스를 여는 비용이 얻는 것보다 크다. 슬라이스 2개와 파일
4개가 늘고 위시리스트 삭제 대상이 두 레이어로 흩어지는데, 그 대가로 얻는 것은
`ui` 세그먼트 하나뿐인 빈 슬라이스다. FSD v2.1이 "처음부터 잘게 나누지 않고 실제로 여러 곳에서
쓸 때 분리한다"고 정한 방향과도 맞다.

### Rejected

#### B. 별도 feature 슬라이스

FSD 정의상 토글은 사용자 행위이므로 feature가 개념적으로 더 정확하다. 그러나 현재 토글에는
정책이 없어 슬라이스가 `ui` 파일 하나로 비어 있고, 이는 "파일 하나를 위한 레이어"에 해당한다.

정책이 생길 가능성을 근거로 지금 B를 선택할 수는 있다. 다만 그 가능성은 가상 스트레스
시나리오이며, Decision Priority에서 가장 낮은 순위다. 현재 근거로 정당화되지 않으므로 반려한다.

### Consequences

- entity 슬라이스가 상호작용 UI를 포함한다. 도메인 개념 레이어에 행위 UI가 들어간 상태다.
- cart 상태를 바꿀 수 있는 진입점이 entity 안에 생긴다. 정책을 가진 다른 진입점이 추가되면
  변경 경로가 둘이 된다.
- 정책이 생겨 feature로 승격할 때 소비처의 import 경로가 함께 바뀐다. 이 비용을 지금 내지
  않고 미룬 것이다.
- 이 결정으로 features 레이어를 열지 않으므로, 목표 트리에서 features는 사용하지 않는 레이어로
  기록한다.

### Validation

- 조합부가 `ProductCard`와 토글 버튼을 연결하고, `ProductCard`는 토글의 존재를 알지 않는다.
- `entities/product`가 `entities/cart`나 `entities/wishlist`를 import하지 않는다.
- cart와 wishlist의 `ui`는 자기 슬라이스의 `model`만 참조하고 서로를 참조하지 않는다.
- 위시리스트 삭제 시 지울 대상이 `entities/wishlist` 한 곳에 모여 있다.

### Revisit

토글에 다음 중 하나가 붙으면 feature로 승격한다.

- 로그인 확인이나 권한 판단이 필요해진다.
- 재고나 수량처럼 서버 검증이 필요해진다.
- 서버 동기화와 낙관적 업데이트가 필요해진다.
- 실패 시 되돌리기나 사용자 안내가 필요한 부수효과가 생긴다.
- cart 상태를 바꾸는 다른 진입점이 생겨 변경 경로가 둘 이상이 된다.

## Decision 3. ProductCard 조합 위치

### Context

[Decision 2](#decision-2-toggle-ui의-레이어)에서 토글 UI를 각 capability의 entity에 두기로
했다. 상품 표현과 두 토글을 실제로 붙이는 자리를 정한다.

이 결정에 필요한 현재 사실은 다음과 같다.

- `ProductCard` 소비 지점은 두 곳이다. `src/app/page.tsx`와
  `src/app/products/ProductListView.tsx`. 홈은 `productSections.map` 안에서 그리드 코드
  하나를 인기 상품과 신상품 두 섹션에 재사용한다.
- 두 소비 지점이 카드에 넘기는 값은 `Product` 하나로 같다. 그리드 클래스와 카드 레이아웃도 같다.
- 빈 상태 처리는 두 곳이 다르다. 홈은 섹션별 안내 문구 하나, 목록은 조건 불일치와 범위 밖
  페이지 두 종류에 총 개수 표시와 페이지네이션이 붙는다.

### Question

`ProductCard`와 토글 행위를 각 page에서 직접 조합할 것인가, 공통 조합을 widget으로 승격할
것인가.

### Options

| 기준 | A. page에서 직접 조합 | B. widget으로 승격 |
| --- | --- | --- |
| 새로 여는 레이어 | 없음 | widgets 1개 |
| 조합 규칙의 소유자 | 각 page | `widgets/product-grid` |
| 화면별 차이 수용 | 자유롭다 | widget이 고정하는 만큼 제약된다 |
| 조합 규칙 변경 시 | 두 곳을 함께 고친다 | 한 곳만 고친다 |

### Experiment

두 안을 폐기용 spike로 작성해 TypeScript strict 설정과 `eslint --max-warnings=0`으로
검증했다. 두 안 모두 통과했다.

#### 측정값

| 기준 | A | B |
| --- | --- | --- |
| 파일 수 | 2 | 4 |
| 전체 줄 수 | 88 | 83 |
| page 두 개의 합계 | 88줄 | 46줄 |
| widget 파일 | 없음 | 37줄 |

#### 중복의 성격

들여쓰기를 무시하고 A의 두 page를 비교하면 비어 있지 않은 82줄 중 30줄이 공통이고, 그중
20줄이 연속된 한 블록이다. 그리드 컨테이너, 카드 매핑, 두 토글 주입이 통째로 반복된다.

이 20줄은 단순 반복이 아니라 같은 변경 이유를 가진 블록이다. 액션이 하나 늘거나, 그리드
레이아웃이 바뀌거나, 액션 배치 순서 정책이 바뀌면 두 곳을 함께 고쳐야 한다.

#### 화면 정책의 경계

widget이 고정하는 것은 그리드 레이아웃, 액션 순서, 두 액션이 항상 함께 붙는다는 정책이다.

빈 상태 처리는 widget이 가져가지 않는다. 홈과 목록의 빈 상태가 다르기 때문에 page가 소유하고,
widget은 비어 있지 않은 목록만 그린다. spike에서 이 경계로 나누자 홈의 빈 배열 분기가 page에
그대로 남았다. widget이 화면 정책을 침범하지 않는 선이 실제로 존재한다.

### Decision

B를 채택한다.

`widgets/product-grid`가 상품 표현과 담기, 찜 행위의 조합을 소유한다. 빈 상태와 총 개수,
페이지네이션은 각 page가 소유한다.

이 결정으로 widgets 레이어를 연다. Decision 2에서 features를 열지 않은 것과 반대 방향이지만
기준은 같다. **레이어를 여는 근거는 슬라이스 개수가 아니라 담을 책임이 있는가다.** Decision 2의
feature 슬라이스는 `ui` 파일 하나뿐이고 담을 정책이 없었다. 이 widget은 20줄짜리 조합 규칙을
가지며, 두 소비 지점이 그 규칙을 같은 이유로 함께 바꾼다.

### Rejected

#### A. page에서 직접 조합

소비 지점이 두 곳뿐이므로 추상화를 미룰 근거가 있다. 그러나 반복되는 블록이 20줄이고 두
소비처가 같은 이유로 함께 변한다. page 두 개가 88줄에서 46줄로 줄고, 조합 규칙 변경이 한
곳으로 모인다. 반려한다.

#### 두 번째 사용이라는 사실만으로 추상화하지 않는다는 원칙과의 관계

Decision 1에서 `toggleId`를 shared로 올리지 않기로 하면서, 두 번째 사용이 생겼다는 사실만으로
추상화하지 않는다고 적었다. 여기서 반대 결론이 나오는 이유는 기준이 사용 횟수가 아니기 때문이다.

| | `toggleId` | 그리드 조합 |
| --- | --- | --- |
| 크기 | 3줄 | 20줄 |
| 변경 이유 | 두 capability의 토글 정책이 갈릴 수 있다 | 두 화면이 같은 이유로 함께 변한다 |
| 이름 비용 | 이름과 계약을 새로 만들어야 한다 | `ProductGrid`라는 자명한 단위가 이미 있다 |

기준은 사용 횟수가 아니라 **두 사용처가 같은 이유로 변하는가**다.

### Consequences

- widgets 레이어가 열린다. 현재 슬라이스는 `product-grid` 하나다.
- widget이 그리드 레이아웃과 액션 배치 순서를 고정한다. 화면별로 다르게 하려면 widget을
  수정하거나 props를 열어야 한다.
- page는 데이터 상태와 빈 상태만 다루게 되어 얇아진다.
- 위시리스트를 제거하면 이 widget도 수정 대상이 된다. Decision 1의 Validation이 정의한
  UI composition 수정에 해당하며 응집 실패가 아니다.

### Validation

- `entities/product`가 `entities/cart`, `entities/wishlist`, `widgets` 중 어느 것도
  import하지 않는다.
- widget이 세 entity를 import하고, page는 widget과 자기 데이터만 import한다.
- 홈과 목록의 빈 상태 문구가 각 page에 남아 있다.
- 조합 규칙을 바꿀 때 수정하는 파일이 widget 하나다.

### Revisit

- 홈과 목록의 카드 레이아웃이나 액션 구성이 서로 달라진다.
- 한 화면만 액션을 숨기거나 다른 액션을 추가해야 한다.
- widget이 화면별 분기를 props로 받기 시작해 조건이 두 개를 넘는다.

## Decision 4. 상품 조회 계약의 소유자

### Context

상품 목록 조회는 현재 `lib/commerce`의 네 파일에 나뉘어 있다. `api.ts`가 전송, `queries.ts`가
key와 캐시 정책, `useProductListCondition.ts`가 URL 조건 조립, `productListContract.ts`가
허용값과 유효성 판정을 맡는다. 이 넷의 소유자를 정한다.

이 결정에 필요한 현재 사실은 다음과 같다.

- `commerceQueries.products.list()`의 소비 지점은 상품 목록 화면 하나다.
- `commerceQueries.home()`의 소비 지점은 홈 화면 하나다.
- `fetchProducts`와 `fetchHome`의 소비 지점은 각각 `queries.ts` 하나다.
- query key는 `['products', 'list', condition]`이고 `condition`은 검색어, 카테고리, 정렬,
  페이지, pageSize다. 상품 자체가 아니라 목록 탐색 조건을 나타낸다.
- `condition` 타입은 API 요청 타입 `ProductListQuery`(`types/commerce.ts`)를 `Required`로
  감싼 것이다. 의존 방향은 반대여서, `searchParams.ts`가 `CategoryId`와 `ProductSort`를 도메인
  타입에서 가져와 파서 값을 제약한다. `queries.ts`는 nuqs도 `searchParams`도 import하지 않는다.
- **저장소 전체에 `invalidateQueries`, `setQueryData`, `useMutation`이 하나도 없다.**
  key 계층이 제공하는 fuzzy 무효화 범위를 현재 사용하는 코드가 없다.
- `Product` 타입은 카드, 목록 화면, mock API, 테스트 등 여러 곳에서 쓰인다. 전송 함수와 달리
  타입은 실제로 공유된다.

### Question

상품 목록의 전송, query key, 캐시 정책을 product entity가 소유할 것인가, 상품 목록 page가
소유할 것인가, 전송과 조회 정책을 나눌 것인가.

### Options

| 기준 | A. entity가 전부 소유 | B. page가 전부 소유 | C. 전송과 조회 정책 분리 |
| --- | --- | --- | --- |
| `fetchProducts` 위치 | `entities/product/api` | `_pages/product-list/api` | `entities/product/api` |
| queryOptions 위치 | `entities/product/api` | `_pages/product-list/api` | `_pages/product-list/api` |
| key 계층 | entity가 전부 | page가 전부 | 루트는 entity, `list` 이하는 page |
| 목록 전용 캐시 정책 소유 | entity | page | page |
| 한 조회 계약이 갈리는가 | 아니다 | 아니다 | 갈린다 |

### Evidence

현재 근거는 두 가지를 가리킨다.

첫째, **재사용이 없다.** 목록 queryOptions도 홈 queryOptions도 소비 지점이 하나씩이다. FSD
v2.1의 pages first는 재사용되지 않는 로직을 페이지 슬라이스에 두고 실제 공유가 생길 때 분리하라고
한다.

둘째, **key 계층의 사용처가 아직 없다.** 계층을 둔 이유는 무효화 범위를 조준하기 위해서인데,
저장소에 무효화 코드가 하나도 없다. entity가 루트를 소유해야 한다는 논거는 상품 상세나
mutation이 생긴 뒤에 성립하며, 그것은 가상 스트레스 시나리오다.

### Decision

B를 채택한다.

상품 목록의 전송, query key, 캐시 정책, URL 조건 parser와 조립 훅을 모두
`_pages/product-list`가 소유한다. 홈 조회도 같은 이유로 `_pages/home`이 소유한다.

`entities/product`는 `model`에 도메인 타입, `ui`에 `ProductCard`만 둔다. `api` 세그먼트를
만들지 않는다. 두 fetch 함수가 공유하는 `fetchJson`은 도메인을 모르는 HTTP 헬퍼이므로
`shared/api`에 둔다.

이 결정으로 상품 목록 화면은 URL 조건, 조건 조립, 조회 계약, 캐시 정책을 한 슬라이스 안에서
소유한다. 조회 조건이 바뀔 때 고칠 파일이 한 슬라이스에 모인다.

### Rejected

#### A. entity가 전부 소유

entity가 소유해도 URL 지식이 따라 들어가지는 않는다. `queries.ts`는 `api.ts`만 참조하고
`condition` 타입은 API 요청 타입에서 나온다. 이 근거로는 A를 반려할 수 없다.

반려 근거는 소비처 수다. 목록 전용 staleTime 30초와 `list` 이하 key 정책은 한 화면의 조회
정책이고 그 화면이 지금 하나뿐이다. 여러 화면이 공유하지 않는 정책을 도메인 개념 레이어에
올릴 근거가 없다.

#### C. 전송과 조회 정책 분리

전송을 entity에 남기면 다른 화면이 상품을 조회할 때 재사용할 수 있다. 그러나 지금 그 화면이
없다.

더 큰 비용은 **하나의 조회 계약이 두 레이어로 갈리는 것**이다. key 루트가 entity에, `list`
이하가 page에 있으면 무효화 범위를 읽으려고 두 곳을 봐야 한다. Decision 1에서 확인한 것과 같은
종류의 결합이다. 재사용 근거가 실제로 생기기 전까지는 계약을 한 곳에 둔다.

### Consequences

- `entities/product`에 `api` 세그먼트가 없다. 필요한 세그먼트만 만든다는 규칙에 따른 결과다.
- 두 페이지가 각각 query key 문자열을 소유한다. 현재 서로 겹치지 않으므로 충돌하지 않지만,
  나중에 무효화가 생기면 범위를 조준할 자리를 다시 정해야 한다.
- 상품 목록 화면의 슬라이스가 커진다. URL parser, 조건 조립, 전송, queryOptions가 한 슬라이스에
  들어간다. 세그먼트로 나누어 목적을 드러낸다.
- `fetchJson`과 `ApiError`가 `shared/api`로 내려간다. 실패를 어디까지 전파할지는 Decision 6에서
  다룬다.
- `productListContract.ts`는 `_pages/product-list`가 소유할 수 없다. mock API route가 이
  모듈을 함께 소비하는데, 서버 route가 페이지 슬라이스를 참조하면 의존 방향이 뒤집힌다.
  그래서 이 모듈만 `shared`로 내리고, 목록 화면 소유에서 뺀다. mock API route 자체의 자리는
  아래 열린 항목으로 남긴다.

### Validation

- `entities/product`가 nuqs와 `productListSearchParams`를 import하지 않는다.
- `_pages/product-list`가 `entities/product`와 `shared`만 import한다.
- `_pages/home`과 `_pages/product-list`가 서로를 import하지 않는다.
- 조회 조건을 바꿀 때 수정 파일이 `_pages/product-list` 안에 모인다.
- query key와 요청이 같은 조건 객체에서 파생된다는 5주차 불변 조건이 유지된다.
- `app/api`의 route handler가 `shared`만 참조하고 `_pages`나 `entities`를 참조하지 않는다.

### 열린 항목

mock API route(`src/app/api`)의 레이어 소속을 이 결정에서 정하지 못했다. Next의 route
handler라 FSD 레이어 밖 서버 코드인데, `productListContract.ts`를 화면과 공유하면서 의존
방향을 따지게 되는 첫 지점이 됐다. Decision 5에서 Public API 경계를 정할 때 함께 다룬다.

### Revisit

- 상품 목록 조회를 쓰는 화면이 둘 이상이 된다.
- 상품 상세처럼 같은 도메인의 다른 조회가 생겨 key 루트를 공유해야 한다.
- mutation이 생겨 `['products']` 범위의 무효화가 필요해진다.
- 홈과 목록이 같은 상품 데이터를 서로 다른 캐시로 들고 있어 화면 간 불일치가 드러난다.
- 홈의 다중 도메인 응답을 entity가 `select`로 나눠 가지는 방식을 검토한다. 멘토링에서 받은
  경쟁안이며, 이번 전환에서 비교하지 않았다. 캐시 원본은 그대로 두고 파생만 바꾸는 방식이라
  소유자 결정과 직교하지만, 홈에 소비 화면이 하나 더 생기면 실익이 달라진다.

## Decision 5. Public API 경계

### Context

목표 트리로 슬라이스와 그 안의 파일이 확정됐다. 이제 슬라이스마다 외부 소비자를 셀 수 있다.

먼저 두 가지를 구분한다.

- **barrel file**은 경로를 줄이려고 내부를 습관적으로 재수출하는 파일이다. 숨기려는 의도가
  없고, `export *`가 쌓이면 이름 충돌과 순환 의존과 번들 비용만 남는다.
- **Public API**는 "외부가 알아도 되는 것은 이것뿐"이라는 계약이다. 같은 `index.ts`라도
  **무엇을 숨기려고 만들었는지**가 다르다.

따라서 판단 기준은 "슬라이스마다 하나씩 두는가"가 아니라 **숨길 내부가 실제로 있는가**다.

### 현재 사실

목표 트리 기준 슬라이스별 외부 소비자와 숨길 대상은 다음과 같다.

| 슬라이스 | 외부 소비자 | 외부가 쓰는 것 | 숨길 내부 |
| --- | --- | --- | --- |
| `shared/api` | `_pages/home/api`, `_pages/product-list/api`, `app/providers.tsx`, mock 백엔드 | `fetchJson`, `ApiError`, `isRetryable`, `errorMessageOf`, `ApiErrorResponse` | 없음. `readServerMessage`는 이미 모듈 비공개다 |
| `shared/lib` | `entities/product/ui` | `formatWon` | 없음 |
| `shared/ui` | playground | `useSelect`, dialog | 이미 `select/index.ts`가 컴포넌트를 감추고 훅만 공개한다 |
| `entities/product` | `_pages` 둘, `widgets/product-grid`, mock 백엔드 | 타입, 허용값, 판정, `ProductCard` | 없음. `parsePositiveIntegerValue`는 이미 모듈 비공개다 |
| `entities/cart` | `widgets/header`, `widgets/product-grid` | selector 훅, `CartToggleButton` | 없음. store 인스턴스는 이미 export하지 않는다 |
| `entities/wishlist` | 같음 | 같음 | 없음 |
| `widgets/product-grid` | `_pages` 둘 | `ProductGrid` | 없음. 파일이 하나다 |
| `widgets/header` | `app/layout.tsx` | `Header` | `HeaderCounts` 하나 |
| `_pages/home` | `app/page.tsx` | `HomePage` | `api` 세그먼트 전체 |
| `_pages/product-list` | `app/products/page.tsx`, mock 백엔드 | `ProductListView`, `ProductListResponse` | `model`과 `api` 세그먼트 전체 |

### Question

어느 슬라이스에 Public API를 두는가. 두지 않는 슬라이스는 무엇으로 경계를 지키는가.

### Decision

**`_pages/home`과 `_pages/product-list` 두 곳에만 `index.ts`를 둔다.** 나머지 슬라이스에는
만들지 않는다.

기준은 숨길 대상의 개수다.

숨길 것이 **여럿이고 여러 세그먼트에 걸쳐 있으면** Public API를 만든다. `_pages/product-list`는
`model`에 URL parser와 조건 조립 훅이, `api`에 fetch와 queryOptions와 응답 타입이 있다.
Decision 4는 "조회 조건을 바꿀 때 고칠 파일이 한 슬라이스에 모인다"를 이 결정의 이득으로
적었는데, 외부가 `_pages/product-list/model/searchParams`를 직접 참조하기 시작하면 그 이득이
사라진다. 막을 대상이 여섯 개가 넘어 규칙으로 열거하기 어렵다.

숨길 것이 **하나면** 검증 항목으로 처리한다. `widgets/header`가 그렇다. 감추고 싶은 것은
`HeaderCounts` 하나이고 소비자도 `app/layout.tsx` 하나다. 파일을 만들어 막는 대신 Validation에
한 줄로 적는다.

숨길 것이 **없으면** 아무것도 만들지 않는다. `entities` 셋과 `shared`가 여기 해당한다.
이 슬라이스들은 이미 파일 단위 export로 경계를 지키고 있다. `entities/cart/model`이 Zustand
store 인스턴스를 export하지 않고 selector 훅만 내보내는 것이 그 예다. 이것이 `index.ts`
없이도 성립하는 Public API이며, 5주차에 이미 그렇게 쓰고 있었다.

### Rejected

#### A. 모든 슬라이스에 `index.ts`를 둔다

FSD 문서에서 가장 흔히 보는 형태다. 반려하는 이유는 우리 슬라이스 여덟 개 중 여섯 개에 숨길
내부가 없기 때문이다. 그 여섯 개의 `index.ts`는 내부를 그대로 재수출하는 파일이 되고, 그것이
정확히 barrel이다. 경계 의도가 없는 재수출은 이름 충돌과 순환 의존의 입구가 된다.

Decision 2에서 이미 같은 판단을 했다. `index.ts` 개수는 슬라이스 개수의 함수라서 그 자체로는
아무 정보도 아니고, 레이어를 여는 근거가 개수가 아니라 담을 책임이듯 Public API를 만드는
근거도 개수가 아니라 숨길 내부다.

#### B. 아무 데도 두지 않는다

파일 단위 export만으로 충분하다는 입장이다. 다른 슬라이스에서는 실제로 충분하지만
`_pages` 둘에서는 부족하다. 페이지 슬라이스는 목적상 여러 세그먼트를 가지고, 그중 외부가
알아도 되는 것은 화면 컴포넌트 하나뿐이다. 이 비대칭을 파일 없이 지키려면 규칙을 여섯 줄
넘게 적어야 하고, 규칙이 길어질수록 지켜지지 않는다.

### Consequences

- `index.ts`가 둘 생긴다. 각각 한 줄이 아니라 "무엇을 공개하는가"를 적은 계약이 된다.
- mock 백엔드가 `_pages/product-list`의 `ProductListResponse`를 참조한다. 이 타입은
  Public API에 포함해야 한다. 프론트엔드 소비자가 아닌 쪽 때문에 공개 표면이 하나 늘어난다.
  예외 규칙 표에 이미 적힌 항목이므로 새 예외는 아니다.
- 나머지 슬라이스는 deep import가 가능한 상태로 남는다. 파일을 옮기면 소비자가 깨진다.
  대신 슬라이스가 작아서 옮길 일이 적다는 것에 기대고 있다. 이 기대가 틀리면 Revisit한다.
- 경계를 기계가 아니라 사람이 지킨다. Advanced A(의존성 하네스)를 하면 이 부담이 도구로
  옮겨간다.

### Validation

- `app/page.tsx`와 `app/products/page.tsx`가 각 페이지 슬라이스의 `index.ts`만 import한다.
- 어느 슬라이스도 `_pages/*/model`이나 `_pages/*/api`를 직접 import하지 않는다.
- `app/layout.tsx`가 `HeaderCounts`를 직접 import하지 않는다.
- 새로 만든 `index.ts`에 `export *`가 없다. 무엇을 공개하는지 이름으로 적혀 있다.
- 소비자가 없는 `index.ts`가 없다.

### Revisit

- 한 슬라이스의 내부 파일을 옮겼는데 다른 슬라이스가 깨진다. deep import가 실제 비용이 된
  시점이다.
- `entities` 슬라이스에 외부가 알면 안 되는 내부가 생긴다. cart에 서버 동기화가 붙어
  낙관적 업데이트용 내부 상태가 생기는 경우가 그렇다.
- 슬라이스가 늘어 "무엇이 공개인가"를 파일을 열어야 알 수 있게 된다.

## Decision 6. 실패의 전파와 복구 경계

### Context

5주차 피드백 반영으로 실패를 구분할 정보는 갖췄다. `ApiError`가 status와 서버 메시지를 들고
오고, `isRetryable`이 재시도 가능 여부를, `isTimeout`이 지연 중단을 구분한다. 남은 문제는
정보가 아니라 **자리**다. 어떤 실패를 화면이 삼키고 어떤 실패를 위로 올릴지가 아직 각 화면의
인라인 분기에 흩어져 있고, `error.tsx`는 저장소에 없다.

이 결정에 필요한 현재 사실은 다음과 같다.

- 상품 목록 화면은 필터(검색 폼, 카테고리, 정렬)와 결과 영역과 페이지네이션으로 나뉜다.
  필터는 URL 상태만 읽고 쿼리에 의존하지 않는다.
- 홈은 배너, 카테고리, 인기 상품, 신상품을 **한 응답**으로 받는다. 응답이 실패하면 그릴 것이
  없다.
- `Header`는 `layout.tsx`에 있어 두 화면의 실패와 무관하게 살아 있다.
- cart와 wishlist 토글은 순수 인메모리 상태 변경이라 실패 경로가 없다.
- `app/products/page.tsx`에 Suspense가 하나 있는데, 데이터 로딩용이 아니라 `useQueryStates`가
  `useSearchParams` 기반이라 프리렌더에 필요해서 있다.
- `loading.tsx`는 없다.

[멘토링 입력](#멘토링-세션-입력)에서 받은 기준은 두 가지다. Error Boundary의 범위는 페이지가
아니라 컴포넌트 단위로 잡고, 4xx나 5xx 때문에 화면 전체가 사라지면 인과관계가 이상하다는
신호로 본다. Suspense 경계는 고객 경험을 기준으로 나눈다.

### Question

조회 실패를 Error Boundary로 전파할 것인가, 화면 안에서 처리할 것인가.
`error.tsx`는 어느 세그먼트에 두고 무엇을 잡을 것인가.

### 판단 기준

**실패한 데이터에 화면이 강결합인가**를 먼저 묻는다. 화면이 그 응답 없이 아무것도 할 수
없으면 화면 단위 실패가 인과에 맞다. 응답 없이도 사용자가 할 수 있는 일이 남아 있으면,
그 일을 없애는 실패 처리는 인과가 맞지 않는다.

두 화면의 답이 다르다.

| 화면 | 응답 없이 남는 것 | 강결합인가 | 실패 단위 |
| --- | --- | --- | --- |
| 상품 목록 | 필터와 검색 폼. 조건을 바꿔 다른 결과로 갈 수 있다 | 아니다 | 결과 영역 |
| 홈 | 없다. 배너, 카테고리, 두 상품 섹션이 모두 같은 응답에서 온다 | 그렇다 | `main` 전체 |

### Decision

**조회 실패는 Error Boundary로 전파하지 않는다.** `throwOnError`를 쓰지 않고 각 화면이
인라인으로 처리한다. `error.tsx`는 루트 세그먼트 하나만 두고 예상 밖 렌더링 오류만 받는다.

전파하지 않는 근거는 셋이다.

첫째, **복구 수단이 다르다.** `error.tsx`가 주는 것은 `reset()` 하나이고 이는 세그먼트 전체
리렌더다. 조회 실패의 정확한 복구는 `refetch()`이며 쿼리 하나만 다시 부른다. 전파하면 더 넓은
범위를 되돌리면서 더 적은 정보로 되돌리게 된다.

둘째, **실패 종류마다 출구가 다르다.** 5주차에 재시도 가능 여부에 따라 다시 시도, 검색 조건
초기화, 화면 밖 링크 셋으로 나눴다. `error.tsx`의 `reset()`은 재시도 하나뿐이라 4xx에
무의미한 버튼을 주게 된다. 그것이 5주차에 없앤 문제다.

셋째, **목록에서는 필터가 함께 사라진다.** 조회가 실패해도 사용자는 조건을 바꿔 다른 결과로
갈 수 있는데, 전파하면 그 경로가 닫힌다. 위 표의 강결합 판정이 "아니다"인 이유가 이것이다.

과제 예시는 "5xx는 경계로, 4xx는 화면 안에서"를 든다. 우리 코드에서는 이 선이 맞지 않는다.
5xx와 4xx의 차이는 **재시도가 의미 있는가**이지 **화면을 지워야 하는가**가 아니다. 목록에서는
5xx도 결과 영역만 죽어야 하고, 홈에서는 4xx도 `main` 전체가 죽는 것이 인과에 맞다. 경계를
가르는 축은 status가 아니라 강결합 여부다.

`error.tsx`를 루트에만 두는 이유는 세그먼트를 나눌 근거가 없기 때문이다. 세그먼트를 나누는
이유는 라우트마다 다른 복구 행동이 필요할 때인데, 예상 밖 렌더링 오류의 복구는 어느 라우트에서든
"다시 시도"와 "홈으로" 둘뿐이다. 루트 `error.tsx`는 루트 `layout` 안에서 렌더되므로 `Header`가
살아남고, 사용자는 다른 화면으로 나갈 수 있다.

### 에러 처리 표

| 실패 유형 | 처리 위치 | Error Boundary 전파 | 사용자 UI | 재시도 방법 | 이 경계를 선택한 이유 |
| --- | --- | --- | --- | --- | --- |
| 상품 목록 조회 5xx, 네트워크 단절, 타임아웃 | `_pages/product-list/ui`의 결과 영역 | 안 함 | 서버 메시지 또는 화면 문구와 "다시 시도" | `refetch()` | 필터가 살아 있어야 조건을 바꿔 벗어날 수 있다. 결과 영역만 실패한다 |
| 상품 목록 조회 4xx | 같은 자리 | 안 함 | 서버 메시지와 "검색 조건 초기화". 조건이 이미 기본값이면 "홈으로" | 조건 변경 | 재시도가 의미 없다. `reset()`은 재시도뿐이라 전파하면 죽은 버튼이 된다 |
| 홈 조회 실패 | `_pages/home/ui`의 `main` | 안 함 | 문구와 "다시 시도". 재시도 불가면 "상품 목록으로" | `refetch()` | 한 응답에 화면 전체가 강결합이다. `Header`는 `layout`에 있어 산다 |
| 예상 밖 렌더링 오류 | `src/app/error.tsx` | 전파됨 | 전용 화면과 "다시 시도", "홈으로" | `reset()` | 계약 위반이나 버그라 화면이 복구 방법을 모른다. 최후 방어선이 필요하다 |
| cart, wishlist 토글 실패 | 해당 없음 | 해당 없음 | 해당 없음 | 해당 없음 | 순수 인메모리 토글이라 실패 경로가 없다. 아래 조건이 생기면 필요해진다 |
| 잘못된 URL 조건 | `_pages/product-list/model`의 parser | 안 함 | 없음. 기본값으로 조용히 수렴한다 | 해당 없음 | 실패가 아니라 정규화다. 요청 전에 처리해 400 왕복을 만들지 않는다 |

토글에 실패 처리가 필요해지는 조건은 Decision 2의 feature 승격 조건과 같다. 서버 동기화,
재고 검증, 로그인 확인 중 하나가 붙으면 실패가 생기고, 그때 이 표에 행이 추가된다.

### Error Boundary가 잡지 못하는 것

React Error Boundary는 **렌더링 중 발생한 오류만** 잡는다. 다음은 잡지 못한다.

- 이벤트 핸들러 안의 오류
- `setTimeout`, `Promise` 콜백 등 렌더링 밖의 비동기 오류
- 서버 컴포넌트에서 이미 스트리밍이 시작된 뒤의 오류

우리 코드에서 해당하는 자리는 토글 `onClick`과 `refetch()` 호출이다.

토글은 현재 실패하지 않는다. 서버 동기화가 붙으면 그 실패는 Error Boundary가 아니라
capability의 action 안에서 잡아 상태로 바꿔야 한다. 버튼 옆에 결과를 보여주는 것이 맥락에
맞고, 화면을 지우는 것은 과하다.

`refetch()`의 실패는 TanStack Query가 잡아 쿼리 상태로 바꾼다. 이미 `isError`로 다시 들어오므로
따로 처리하지 않는다. 이것이 조회 실패에 대해 `try-catch`를 쓰지 않는 이유다.

### 로딩 경계

`loading.tsx`를 두지 않는다. `Suspense`도 데이터 로딩용으로는 나누지 않는다. 로딩은
`isPending`으로 인라인 처리한다.

`loading.tsx`를 쓰지 않는 이유는 에러와 같다. `loading.tsx`는 세그먼트 전체를 fallback으로
바꾸므로 목록에서 필터까지 사라진다. 조건을 바꿀 때마다 조건을 바꾸는 UI가 사라지는 것은
고객 경험에 어긋난다. 필터가 그대로 있고 결과 영역만 바뀌는 지금 동작이 맞다.

`Suspense`를 데이터 단위로 더 쪼개지 않는 이유는 쪼갤 데이터 단위가 없기 때문이다. 목록은 한
요청으로 한 덩어리가 오고, 카드마다 별도 요청이 있는 것이 아니다. 카드마다 경계를 두면 경계
수만 늘고 화면이 순차적으로 바뀌어 산만해진다. 홈도 한 응답이라 같다.

`app/products/page.tsx`의 기존 `Suspense`는 남긴다. 이것은 데이터 로딩 경계가 아니라
`useSearchParams` 기반 훅의 프리렌더 요구를 만족시키는 경계다. 목적이 다르므로 위 판단과
충돌하지 않으며, 코드 주석에 그 이유가 이미 적혀 있다.

### Consequences

- `throwOnError`를 쓰지 않는다. 조회 실패가 Error Boundary에 도달하지 않는다.
- `src/app/error.tsx` 하나가 생긴다. `useSuspenseQuery`를 쓰지 않으므로 이 경계는 평소에
  비어 있고, 실제로 동작하는지 확인하려면 의도적으로 오류를 던져봐야 한다.
- 실패 UI 문구와 출구 판단이 두 페이지 슬라이스에 각각 있다. 공통 컴포넌트로 묶지 않았다.
  홈과 목록의 출구가 다르기 때문이며, 세 번째 화면이 생겨 같은 모양이 반복되면 그때 묶는다.
- `shared/api`는 실패를 분류만 하고 문구와 행위를 갖지 않는다. 화면 문구는 각 페이지가 준다.

### Validation

- 목록 조회를 실패시켜도 검색 폼, 카테고리, 정렬이 화면에 남고 조작할 수 있다.
- 목록 4xx에서 "다시 시도"가 없고, 조건이 있으면 "검색 조건 초기화"가, 없으면 "홈으로"가 있다.
- 홈 조회를 실패시켜도 `Header`가 남는다.
- 렌더링 중 오류를 의도적으로 던지면 `src/app/error.tsx`가 보이고 `reset()`이 동작한다.
  검증 후 임시 `throw`는 제거한다.
- 어느 쿼리에도 `throwOnError`가 없다.
- 표의 "전파" 열과 실제 코드가 일치한다.

### Revisit

- `useSuspenseQuery`를 도입한다. 그 순간 조회 실패가 Error Boundary로 강제 전파되므로 이
  결정 전체를 다시 본다.
- 한 화면이 서로 다른 여러 요청을 조합하기 시작한다. 그때는 요청마다 다른 실패 범위가 생겨
  경계를 쪼갤 근거가 생긴다.
- 토글에 서버 동기화가 붙어 이벤트 핸들러 실패가 생긴다.
- 실패 UI가 세 화면 이상에서 같은 모양으로 반복된다.

## 삭제 시나리오 자가 검증

마이그레이션이 끝난 트리에서 코드를 고치지 않고 확인했다. Preflight에서 예측한 목록과
실제를 대조한다.

### 위시리스트를 통째로 제거한다면

**폴더째 지울 것** — `src/entities/wishlist/` 하나다. 안에 model, ui, 전용 테스트가 함께 있다.

**살아남아 수정할 생산 코드** — 두 곳이다.

| 파일 | 고칠 것 |
| --- | --- |
| `widgets/product-grid/ui/ProductGrid.tsx` | `WishlistToggleButton` import와 `actions`에서 제거 |
| `widgets/header/ui/HeaderCounts.tsx` | `useWishlistCount` 구독과 배지 하나 제거 |

**살아남아 수정할 테스트와 도구** — 세 곳이다.

| 파일 | 고칠 것 |
| --- | --- |
| `test/resetStores.ts` | `resetWishlist` 호출 한 줄 |
| `test/resetStores.test.ts` | 위시리스트 관련 단언 |
| `app/state-contract.test.tsx` | 위시리스트 토글 통합 검증 |

**수정하지 않는 것** — `entities/cart` 전체, `entities/product` 전체, `shared` 전체,
`_pages` 둘 전체다. cart의 모델과 외부 계약과 전용 테스트가 그대로이므로 Preflight에서 채택한
모델 독립 기준을 만족한다.

#### 예측과 실제의 차이

Preflight는 생산 코드 경계를 두 곳으로 예측했고 실제도 두 곳이다.
[Decision 2의 삭제 반경 기록](#선택과-무관하게-나온-결과)이 예측한 `widgets/product-grid`와
Header 조합부가 정확히 그 둘이다.

예측하지 않았던 것이 하나 있다. `entities/cart`의 파일 셋이 위시리스트를 **주석으로** 언급한다.

```
cart/model/cart.ts:4    // wishlist를 알지 않으므로 위시리스트를 지울 때 이 파일은 열리지 않는다.
cart/model/cart.ts:15   // wishlist에도 같은 모양의 함수가 있다.
cart/model/cart.test.ts:6  // 이 파일은 wishlist를 import하지 않는다.
```

import가 아니라 주석이므로 컴파일도 테스트도 깨지지 않는다. 다만 위시리스트를 지운 뒤 이
주석들은 존재하지 않는 것을 가리키게 된다. grep으로 `wishlist`를 찾으면 이 파일들이 나오므로,
"수정 대상이 두 곳"이라는 판정과 "검색하면 다섯 곳이 나온다"는 사실이 어긋난다.

이것을 파편화로 보지 않는다. 삭제 반경은 **고치지 않으면 깨지는 것**의 범위이고 주석은 거기
들지 않는다. 다만 삭제를 실행할 때 grep 결과를 그대로 수정 목록으로 쓰면 안 된다는 점은
기록해둔다.

`examples/week-05-layout` 두 파일도 위시리스트를 언급한다. 어디서도 import하지 않는 참조
자료이고 Next 번들에 들어가지 않는다. 삭제 후보로 따로 기록했다.

#### 판정

응집 성공으로 본다. 삭제 대상이 한 폴더에 모여 있고, 살아남아 고칠 생산 코드가 둘이며 둘 다
조합부다. Preflight가 "상위 UI 조합부는 기능의 연결점을 명시하는 composition root이므로 수정
대상이 될 수 있다"고 미리 인정한 자리와 같다.

### 신상품 뱃지를 상품 카드에 추가한다면

**터치할 파일** — 둘이다.

| 파일 | 할 일 |
| --- | --- |
| `entities/product/model/product.ts` | 신상품 판정을 추가한다. `Product`에 이미 `createdAt`이 있어 타입은 바뀌지 않는다 |
| `entities/product/ui/ProductCard.tsx` | 판정 결과로 뱃지를 그린다 |

**터치하지 않는 것** — `widgets`, `_pages`, `shared`, mock 백엔드다. 카드가 받는 props가
`Product` 하나 그대로이고, 판정에 필요한 값이 이미 그 안에 있기 때문이다.

#### 예측의 근거

이 예측이 자신 있는 이유는 신상품 여부가 **상품 자체의 성질**이기 때문이다. 화면이 정하는
것이 아니라 상품 데이터에서 나온다. 그래서 `entities/product` 밖으로 나갈 이유가 없다.

반대 경우도 생각해봤다. 뱃지를 붙일지 말지를 화면이 정한다면(홈에서만 보인다면) `ProductCard`가
`showNewBadge` 같은 props를 받아야 하고, 그것을 넘기는 `ProductGrid`도 바뀌고, 그것을 부르는
두 page도 바뀐다. 둘에서 다섯으로 늘어난다. 이 차이가 "상품의 성질인가, 화면의 정책인가"를
먼저 물어야 하는 이유다.

#### 판정

경계 설계가 이 변경을 감당한다. 다만 위 반대 경우처럼 화면마다 다른 뱃지 정책이 생기면
`ProductGrid`가 props를 받기 시작하고, 그것이 Decision 3의 Revisit 조건 세 번째
("widget이 화면별 분기를 props로 받기 시작해 조건이 두 개를 넘는다")에 걸린다.

## FSD 이해 확인

### 1. `ProductCard`가 찜 버튼을 직접 import하면 어떤 의존 규칙을 어기며, 어디에서 조합해야 하는가

`ProductCard`는 `entities/product`에 있고 찜 버튼은 `entities/wishlist`에 있다. 같은 레이어의
다른 슬라이스를 직접 import하는 것이므로 **동일 레이어 간 직접 import 금지**를 어긴다. 만약
찜을 feature로 올렸다면 하위가 상위를 아는 역방향 의존까지 겹친다. 우리는
`widgets/product-grid`에서 조합했다. `ProductCard`가 `actions` 슬롯을 받고, widget이 그 자리에
두 토글을 넣는다. 카드는 무엇이 들어오는지 알지 않으므로 행위가 늘어도 카드 파일은 바뀌지
않는다.

### 2. 한 페이지에서만 쓰는 검색 로직도 반드시 feature여야 하는가

아니다. 우리는 `features` 레이어를 아예 열지 않았다. 검색은 `_pages/product-list`가 소유한다.
URL parser와 조건 조립 훅이 `model`에, 검색 폼이 `ui`에 있다. 근거는 소비 화면이 하나이고
FSD v2.1의 pages first가 재사용되지 않는 로직을 페이지에 두라고 정하기 때문이다. 토글도 같은
기준으로 판단했는데 결과가 달랐다. 토글은 두 화면이 쓰지만 담을 정책이 없어 `ui` 파일 하나짜리
슬라이스가 되므로 entity에 뒀다. 레이어를 여는 기준은 사용 횟수가 아니라 담을 책임이다.

### 3. `formatPrice`는 항상 `shared/lib`인가

아니다. 지금 `formatWon`이 `shared/lib`에 있는 이유는 그 함수가 `toLocaleString('ko-KR')`에
"원"을 붙이는 것 외에 아무 판단도 하지 않기 때문이다. 통화가 여럿이 되면 어느 통화를 쓸지
정하는 규칙이 생기고, 회원 등급별 할인가나 세일 정책이 붙으면 그것은 상품 도메인의 판단이므로
`entities/product/model`로 가야 한다. 판단 기준은 이름이 아니라 **그 함수가 도메인 규칙을
아는가**다. 아는 순간 `shared`가 도메인을 아는 레이어가 된다.

### 4. 두 feature가 협력해야 할 때 직접 import하지 않고 어떤 상위 레이어에서 조합했는가

우리 프로젝트에는 feature가 없어 이 상황이 그대로 생기지는 않았다. 대신 같은 문제가 entity
사이에서 나왔다. 담기와 찜은 서로를 알지 않아야 하는데 한 카드 안에 함께 보여야 했다.
`widgets/product-grid`가 세 entity(product, cart, wishlist)를 조합한다. 헤더도 같은 모양이다.
`widgets/header`가 cart와 wishlist의 개수를 함께 읽는다. 두 경우 모두 협력이 필요한 지점을
**상위 레이어의 조합**으로 해결했고, 어느 entity도 다른 entity를 import하지 않는다.

### 5. 폴더 이동 후에도 TanStack Query 데이터와 Zustand 데이터를 서로 복사하지 않은 이유

원본이 둘이 되면 어느 쪽이 맞는지 판정할 수 없기 때문이다. 상품 목록의 원본은 서버이고 캐시가
그 스냅샷을 들고 있다. 장바구니의 원본은 클라이언트 store다. store가 `Product` 전체를 복사하면
서버가 가격을 바꿔도 담긴 상품은 옛 가격을 들고 있게 된다. 그래서 store에는 판별에 필요한
상품 ID만 두고, 화면에 필요한 상품 정보는 캐시에서 온 것을 쓴다. 폴더가 바뀌어도 이 판단은
바뀌지 않는다. 소유권은 위치가 아니라 원본이 어디인가로 정해진다.

### 6. barrel file과 Public API는 무엇이 다른가

같은 `index.ts`라도 **숨기려는 의도가 있는가**가 다르다. barrel은 경로를 줄이려고 내부를
재수출하는 파일이고, Public API는 "외부가 알아도 되는 것은 이것뿐"이라는 계약이다.
우리는 슬라이스 여덟 개 중 `_pages` 둘에만 뒀다. 그 둘은 `api`와 `model`과 `ui` 세 세그먼트에
걸쳐 숨길 내부가 여섯 개가 넘어 규칙으로 열거하기 어렵기 때문이다. 나머지 여섯은 숨길 내부가
없어 만들지 않았다. 만들었다면 그것이 정확히 barrel이다. 두 `index.ts` 모두 `export *`를 쓰지
않고 공개 대상을 이름으로 적었다. 파일을 열어야 무엇이 공개인지 아는 순간 계약이 아니게 된다.

## 1. RADIO

전체 구조를 빠르게 이해하기 위한 본문이다. 논쟁이 있었던 항목의 선택 근거와 반려 이유는
Decision Card에 두고, 여기서는 결론과 참조만 적는다.

Decision 1~6이 모두 끝나 목표 구조가 확정됐다. 작성 중에는 사실과 불변 조건과 적용 규칙만
두고 아직 내리지 않은 결정을 목표 구조에 미리 써넣지 않았다. 단계별 트레이드오프와 작업
순서는 [마이그레이션 작업 로그](./week06-migration-log.md)에 따로 있다.

### R — Requirements

#### 반드시 보존할 동작

- 홈과 상품 목록의 정상, 로딩, 에러, 빈 상태 구분
- 검색, 카테고리, 정렬, 페이지네이션
- URL 공유, 새로고침, 뒤로 가기와 앞으로 가기에서 같은 목록 조건 복원
- 홈과 목록에서 cart와 wishlist 상태 동기화, 페이지 이동 중 상태와 헤더 개수 유지
- 각 값의 Source of Truth는 5주차에 정한 그대로 유지
- `pnpm check` 통과

#### 이번 전환 범위에서 하지 않을 것

| 하지 않을 것 | 이유 |
| --- | --- |
| API endpoint와 응답 계약 변경 | 구조 이동과 기능 변경을 같은 커밋에 섞지 않는다 |
| 서버 응답을 Zustand로 복사 | 원본이 둘이 되어 5주차 불변 조건을 깬다 |
| URL 검색 조건을 로컬 상태로 복제 | 같은 이유 |
| 근거 없는 성능 최적화 | 측정 전 최적화는 판단 근거가 없다 |
| 가상 요구에 대비한 선행 추상화 | 가상 스트레스 시나리오는 Revisit 조건 확인에만 쓴다 |

### A — Architecture

#### 현재 구조에서 겪는 문제

1. **표현이 행위를 안다.** `ProductCard.tsx`가 `ShoppingToggleButtons`를 직접 import한다.
   지금은 레이어가 없어 위반이 아니지만, 그대로 옮기면 하위가 상위를 아는 역방향 의존이 된다.
2. **삭제 반경을 예측할 수 없다.** `shopping.ts` 하나가 cart와 wishlist의 상태, action,
   초기값, reset을 함께 가지고 테스트도 한 파일이다. 한쪽을 지울 때 무엇이 따라 바뀌는지
   파일을 열어봐야 안다.
3. **한 기능의 코드가 기술 이름 아래 흩어져 있다.** 상품 목록 조회 하나가 `lib/commerce`,
   `stores`, `types`, `app/products`에 나뉘어 있고, 폴더 이름이 도메인을 말해주지 않는다.
4. **도메인 타입의 소유자가 없다.** `types/commerce.ts` 한 파일에 상품 도메인 타입, API 응답
   형태, mock 제어값이 함께 있다.
5. **실패를 구분할 수는 있으나 경계가 없다.** 5주차 피드백 반영으로 `ApiError`가 status와
   서버 메시지를 들고 오고 재시도 여부까지 판단한다. 남은 문제는 정보가 아니라 자리다.
   어떤 실패를 화면이 삼키고 어떤 실패를 위로 올릴지는 아직 각 화면의 인라인 분기에 흩어져
   있다.

#### 적용할 의존 규칙

```
_app  ->  _pages  ->  widgets  ->  features  ->  entities  ->  shared
(상위: 조합과 책임이 크다)                        (하위: 기반과 재사용)
```

- 슬라이스는 자기보다 아래 레이어만 import한다.
- 같은 레이어의 다른 슬라이스를 직접 import하지 않는다. 같은 슬라이스 안 세그먼트끼리는 협력한다.
- 두 기능이 협력해야 하면 상위 레이어에서 조합한다. 조합은 상위의 책임이다.
- `src/app`은 Next 라우팅 디렉터리로 두고 얇은 진입점만 남긴다. FSD 레이어가 필요하면
  `src/_app`과 `src/_pages`를 쓰고 `src/pages`는 만들지 않는다.
- 세그먼트는 목적(`ui`, `model`, `api`, `lib`, `config`)을 드러낸다. 파일 종류를 반복하지 않는다.
- 빈 폴더와 소비자가 없는 `index.ts`는 만들지 않는다.

#### 현재 트리

```
src/
├── app/                 layout, page, products/, playground/, api/, css
├── components/
│   ├── commerce/        Header, HeaderCounts, ProductCard, ShoppingToggleButtons
│   └── ui/              dialog, select
├── examples/            week-05-layout (어디서도 import하지 않는다)
├── lib/
│   ├── commerce/        api, queries, searchParams, productListContract, useProductListCondition
│   └── formatWon.ts
├── stores/              shopping.ts
├── test/                setup.ts
└── types/               commerce.ts
```

폴더 이름 여섯 개 중 도메인을 말하는 것은 `commerce` 하나뿐이고, 그마저 상품과 장바구니와
위시리스트를 함께 담는다.

#### 목표 트리

```
src/
├── app/                                  Next 라우팅 디렉터리. FSD 레이어가 아니다
│   ├── layout.tsx                        Header와 Providers를 붙이는 진입점
│   ├── providers.tsx                     QueryClient와 nuqs 어댑터 조립
│   ├── page.tsx                          _pages/home을 렌더
│   ├── products/page.tsx                 _pages/product-list를 렌더
│   ├── playground/                       4주차 쇼케이스. 전환 범위 밖
│   ├── api/                              mock 백엔드. FSD 의존 그래프 밖
│   └── *.css
│
├── _pages/
│   ├── home/
│   │   ├── api/                          fetchHome, HomeResponse, queryOptions
│   │   └── ui/                           HomePage
│   └── product-list/
│       ├── api/                          fetchProducts, ProductListResponse, queryOptions
│       ├── model/                        URL parser, 조건 조립 훅, 화면 기본 pageSize
│       └── ui/                           ProductListView, SearchForm
│
├── widgets/
│   ├── header/ui/                        Header, HeaderCounts
│   └── product-grid/ui/                  ProductGrid
│
├── entities/
│   ├── product/
│   │   ├── model/                        Product 계열 타입, 목록 조건 허용값과 판정
│   │   └── ui/                           ProductCard
│   ├── cart/
│   │   ├── model/                        store, selector, action, reset
│   │   └── ui/                           CartToggleButton
│   └── wishlist/
│       ├── model/                        store, selector, action, reset
│       └── ui/                           WishlistToggleButton
│
├── shared/
│   ├── api/                              fetchJson, ApiError, 실패 분류, 실패 본문 타입
│   ├── lib/                              formatWon
│   └── ui/                               dialog, select
│
├── examples/                             참조 자료. 트리 밖
└── test/                                 vitest setup
```

#### 사용하는 레이어와 사용하지 않는 레이어

| 레이어 | 사용 | 근거 |
| --- | --- | --- |
| `shared` | 사용 | 도메인을 모르는 전송, 실패 표현, 포맷, headless UI가 실제로 있다 |
| `entities` | 사용 | product, cart, wishlist 세 도메인 개념이 각각 모델과 UI를 가진다 |
| `features` | **사용하지 않음** | [Decision 2](#decision-2-toggle-ui의-레이어). 토글에 담을 정책이 없어 `ui` 파일 하나짜리 슬라이스가 된다 |
| `widgets` | 사용 | [Decision 3](#decision-3-productcard-조합-위치). 조합 규칙 20줄을 두 화면이 같은 이유로 함께 바꾼다. Header도 두 entity를 조합한다 |
| `_pages` | 사용 | [Decision 4](#decision-4-상품-조회-계약의-소유자). 조회 계약과 URL 조건의 소유자가 필요하다 |
| `_app` | **사용하지 않음** | 아래 참조 |
| `processes` | 사용하지 않음 | FSD v2.1에서 제외된 레이어다 |

`_app`을 열지 않는 이유는 담을 것이 `providers.tsx` 하나이기 때문이다. Providers는 QueryClient와
nuqs 어댑터를 붙이는 라이브러리 조립일 뿐 비즈니스 판단이 없고, Next의 `layout.tsx`가 이미
그 조립의 진입점이다. 파일 하나를 위해 레이어를 여는 것은 Decision 2에서 feature를 반려한
기준과 같다. `src/app/providers.tsx`에 그대로 둔다.

#### 파일 매핑표

| 현재 위치 | 목표 위치 | 레이어 / 슬라이스 / 세그먼트 | 이유 |
| --- | --- | --- | --- |
| `lib/commerce/api.ts`의 `fetchJson`, `ApiError`, `isRetryable`, `errorMessageOf`, `isTimeout` | `shared/api/http.ts` | shared / - / api | 도메인을 모르는 전송과 실패 표현이다. 두 page가 함께 쓴다 |
| `types/commerce.ts`의 `ApiErrorResponse` | `shared/api/http.ts` | shared / - / api | 실패 본문 계약이라 `fetchJson`이 읽는 대상이다 |
| `lib/formatWon.ts` | `shared/lib/formatWon.ts` | shared / - / lib | 통화 표기 한 벌. 상품 정책이 붙지 않았다 |
| `components/ui/dialog`, `components/ui/select` | `shared/ui/dialog`, `shared/ui/select` | shared / - / ui | 도메인을 모르는 headless UI |
| `types/commerce.ts`의 `Product`, `Category`, `CategoryId`, `ProductSort` | `entities/product/model/product.ts` | entities / product / model | 상품 도메인 개념. 카드, 목록, 홈, mock이 함께 쓴다 |
| `lib/commerce/productListContract.ts` | `entities/product/model/productListContract.ts` | entities / product / model | 카테고리와 정렬 허용값은 상품 도메인 어휘다 |
| `components/commerce/ProductCard.tsx` | `entities/product/ui/ProductCard.tsx` | entities / product / ui | 상품 표현. 토글 import를 제거해 행위를 알지 않게 한다 |
| `stores/shopping.ts`의 cart 절반 | `entities/cart/model/cart.ts` | entities / cart / model | [Decision 1 개정](#개정--b에서-c로). capability가 자기 store를 소유한다 |
| `stores/shopping.ts`의 wishlist 절반 | `entities/wishlist/model/wishlist.ts` | entities / wishlist / model | 같음 |
| `components/commerce/ShoppingToggleButtons.tsx` | `entities/cart/ui/CartToggleButton.tsx` + `entities/wishlist/ui/WishlistToggleButton.tsx` | entities / cart, wishlist / ui | [Decision 2](#decision-2-toggle-ui의-레이어). 두 행위를 그리던 한 컴포넌트가 capability를 따라 갈라진다 |
| `components/commerce/Header.tsx`, `HeaderCounts.tsx` | `widgets/header/ui/` | widgets / header / ui | 두 entity의 개수를 함께 조합한다 |
| (신규) | `widgets/product-grid/ui/ProductGrid.tsx` | widgets / product-grid / ui | [Decision 3](#decision-3-productcard-조합-위치). 홈과 목록이 반복하던 조합 20줄 |
| `lib/commerce/api.ts`의 `fetchHome`, `types/commerce.ts`의 `HomeResponse`, `lib/commerce/queries.ts`의 `home()` | `_pages/home/api/` | _pages / home / api | [Decision 4](#decision-4-상품-조회-계약의-소유자). 소비 지점이 홈 하나다 |
| `app/page.tsx`의 본문 | `_pages/home/ui/HomePage.tsx` | _pages / home / ui | 라우팅 진입점과 화면 조합을 나눈다 |
| `lib/commerce/api.ts`의 `fetchProducts`, `ProductListCondition`, `types/commerce.ts`의 `ProductListQuery`, `ProductListResponse`, `lib/commerce/queries.ts`의 `products` | `_pages/product-list/api/` | _pages / product-list / api | 같음. 소비 지점이 목록 하나다 |
| `lib/commerce/searchParams.ts`, `useProductListCondition.ts` | `_pages/product-list/model/` | _pages / product-list / model | URL 조건은 이 화면의 정책이다 |
| `app/products/ProductListView.tsx`, `SearchForm.tsx` | `_pages/product-list/ui/` | _pages / product-list / ui | 같음 |
| `types/commerce.ts`의 `MockApiScenario` | `app/api/_data/commerce.ts` | (FSD 밖) | mock 전용 제어값이라 프론트엔드 타입이 아니다 |
| `app/providers.tsx` | 그대로 | (FSD 밖) | 위의 `_app` 판단 |
| `app/playground/**` | 그대로 | (FSD 밖) | 전환 범위 밖. `components/ui` import 경로만 바뀐다 |
| `app/api/**` | 그대로 | (FSD 밖) | mock 백엔드 |
| `examples/week-05-layout/**` | 그대로 | (트리 밖) | 아래 결정표 참조 |
| `test/setup.ts` | 그대로 | (트리 밖) | vitest 설정이 경로로 참조한다 |

테스트 파일은 대상 파일을 따라간다. `stores/shopping.test.ts`는 capability를 따라 둘로 갈리고,
`state-contract.test.tsx`는 여러 레이어를 가로지르는 통합 테스트라 `src/app` 쪽에 남긴다.

#### 애매한 파일 결정표

| 대상 | 후보 A | 후보 B | 최종 결정 | 기준 |
| --- | --- | --- | --- | --- |
| `ProductCard` | `entities/product/ui` | `widgets/product-card` | A | 카드가 담는 것은 상품 표현뿐이다. 행위는 Decision 2로 분리했고 조합은 Decision 3의 widget이 가져갔다. 남은 책임이 도메인 표현 하나라 entity가 맞다 |
| 상품 목록 queryOptions | `entities/product/api` | `_pages/product-list/api` | B | 소비 지점이 하나다. 목록 전용 staleTime과 key 정책을 도메인 레이어에 올릴 근거가 없다. [Decision 4](#decision-4-상품-조회-계약의-소유자) |
| 장바구니 store | `entities/cart/model` | 장바구니 행위 feature의 `model` | A | features를 열지 않기로 했다. 상태가 나타내는 것은 행위가 아니라 "담긴 상품 ID"라는 도메인 사실이다 |
| `types/commerce.ts` | 통째로 `shared/types` 유지 | 소유자별로 분해 | 분해 | 한 파일에 도메인 개념, 화면별 응답 형태, mock 제어값이 섞여 있다. 그대로 두면 mock 제어값을 바꿀 때 상품 도메인 파일이 열린다. 분해 후 각 타입의 소유자가 생긴다 |
| `productListContract.ts` | `shared/api` | `entities/product/model` | B | 카테고리와 정렬 허용값은 상품 도메인 어휘다. `shared`에 두면 도메인을 모르는 레이어가 카테고리를 알게 된다. mock 백엔드가 이 모듈을 참조하지만, 아래 예외 규칙으로 다룬다 |
| `Header`, `HeaderCounts` | `widgets/header` | `app/layout.tsx`에 인라인 | A | 두 entity의 개수를 함께 조합한다. 조합 지점은 widget이다. layout에 인라인하면 라우팅 진입점이 도메인을 알게 된다 |
| `providers.tsx` | `_app/providers.tsx` | `app/providers.tsx` 유지 | B | 담을 것이 파일 하나다. 레이어를 여는 근거는 개수가 아니라 담을 책임인데, 라이브러리 어댑터 조립에는 비즈니스 판단이 없다 |
| `examples/week-05-layout` | 삭제 | 제자리 유지 | 유지 (삭제 후보로 기록) | 322줄이고 `src` 어디서도 import하지 않는다. Next 번들에는 들어가지 않고 typecheck 대상으로만 남는다. 참조 자료로 의도된 것인지 확인이 필요해 이번 범위에서 지우지 않는다 |

#### mock 백엔드의 예외 규칙

`src/app/api/**`는 FSD 의존 그래프의 대상이 아니다. 실제 서버로 대체되면 사라질 코드이므로
프론트엔드 슬라이스를 참조하는 것을 허용하되, 참조를 다음 넷으로 제한하고 여기에 열거한다.

| mock이 참조하는 것 | 이유 | 실제 서버가 되면 |
| --- | --- | --- |
| `entities/product/model` | 상품 타입과 목록 조건 허용값 | 서버가 자기 스키마를 소유하고 클라이언트는 생성된 타입을 받는다 |
| `_pages/product-list`의 `ProductListResponse` | 목록 응답 형태 | 같음 |
| `_pages/home`의 `HomeResponse` | 홈 응답 형태 | 같음 |
| `shared/api`의 `ApiErrorResponse` | 실패 본문 형태 | 같음 |

전환 후 실제 import를 확인했더니 넷 그대로였고, 응답 타입 둘은 page 슬라이스 내부가 아니라
`index.ts`를 통해 들어왔다. 예외를 열거해둔 덕분에 새로 생긴 것이 없는지 셀 수 있었다.

이 넷을 공유하는 대신 계약 테스트로 양쪽을 맞추는 방법도 있다. 실제 서버라면 그래야 한다.
지금 공유를 택한 이유는 5주차 피드백 반영에서 두 벌로 갈린 검증 규칙이 실제로 어긋나 있던 것을
고쳤기 때문이고, 그 결정을 구조 이동 커밋에서 되돌리지 않기 위해서다. Revisit 조건은
"mock을 실제 서버나 별도 프로세스로 옮긴다"이다.

#### 마이그레이션 원칙

- 구조 변경과 기능 변경을 같은 커밋에 섞지 않는다.
- 각 단계마다 `pnpm check`가 통과해야 다음 단계로 간다.
- 되돌릴 수 있는 단위로 나눈다. 한 커밋이 여러 레이어를 동시에 만들지 않는다.
- 커밋마다 하위가 상위를 참조하지 않는지 확인한 뒤 다음으로 넘어간다.

#### Phase 계획

아래에서 위로 올라간다. 하위 레이어가 먼저 자리를 잡아야 상위가 그것을 참조하며 이동할 수
있고, 반대로 하면 상위가 아직 옮기지 않은 하위를 임시 경로로 참조하는 구간이 생긴다.
멘토링에서 받은 "`shared`를 먼저 강화하고 경계부터 지킨다"와도 같은 방향이다.

| Phase | 범위 | 검증 |
| --- | --- | --- |
| 1 | `shared` 구성. 전송, 실패 표현, 포맷, headless UI | `pnpm check`. `shared`가 어떤 상위 레이어도 import하지 않는다 |
| 2 | `entities` 구성. product 모델과 카드, cart와 wishlist의 store 분리와 토글 UI | `pnpm check`. `entities`가 `shared`만 참조한다. cart와 wishlist가 서로를 참조하지 않는다 |
| 3 | `widgets` 구성. product-grid와 header | `pnpm check`. widget이 `entities`와 `shared`만 참조한다 |
| 4 | `_pages` 구성. 조회 계약, URL 조건, 화면. `src/app`을 진입점으로 축소 | `pnpm check`. page가 자기 아래만 참조하고 두 page가 서로를 참조하지 않는다 |
| 5 | Decision 6 구현. `error.tsx`와 전파 기준 | 실패 재현. 에러 처리 표와 구현이 일치한다 |

각 Phase가 끝나면 삭제 시나리오를 다시 묻지 않는다. 마지막에 한 번 전체로 확인한다. 중간
상태는 트리가 반쯤 옮겨진 상태라 응집도를 판정할 수 없다.

### D — Data Model

폴더 위치가 정해지지 않아도 Source of Truth와 소유 책임은 지금 쓸 수 있다.

| 상태 | Source of Truth | 소유 책임 | 소비하는 곳 | 중복 저장하지 않는 방법 |
| --- | --- | --- | --- | --- |
| 상품 조회 결과와 totalCount | 서버, TanStack Query cache | product 조회 계약을 소유하는 슬라이스 (Decision 4) | 홈, 상품 목록 | 응답을 store나 로컬 상태로 옮기지 않는다 |
| 검색어, 카테고리, 정렬, 페이지 | URL | 목록 조건 parser와 조립 훅 | 상품 목록 | URL에서 읽어 조건 객체 하나로 만들고 query key와 요청이 그 객체를 공유한다 |
| 장바구니에 담긴 상품 ID | Zustand | cart capability model | 헤더, 상품 행위 UI | 개수와 포함 여부를 저장하지 않고 selector에서 파생한다 |
| 위시리스트에 담긴 상품 ID | Zustand | wishlist capability model | 헤더, 상품 행위 UI | 같은 방식 |
| store 생성, 초기화, reset | 인메모리 Zustand store | 각 capability model | 자기 capability만 | capability마다 자기 store를 만들고 서로의 생성 방식을 알지 않는다 |
| 제출 전 검색어 | React local state | 검색 폼 | 검색 폼 하나 | 제출 시점에만 URL로 승격한다 |
| 로딩, 에러, 빈 결과 | 파생 | 없음 | 각 화면 | 쿼리 상태에서 렌더 중 계산한다 |

cart와 wishlist는 capability 모델과 store를 모두 분리한다. 대안 비교와 이 결론에 이른 경위는
[Decision 1](#decision-1-cartwishlist-capability-boundary)과 그 [개정](#개정--b에서-c로)을 따른다.

### I — Interface

#### 확정

- cart capability와 wishlist capability는 서로의 모델을 알지 않는다.
- `ProductCard`는 cart와 wishlist 구현을 직접 import하지 않는다.
- 상위 조합부가 `ProductCard`와 사용자 행위를 연결한다.
- 각 capability는 selector hook과 action hook만 공개하고 store 구현체는 공개하지 않는다.
- Public API는 `_pages` 두 슬라이스에만 둔다. 나머지는 파일 단위 export로 경계를 지킨다.
  근거와 반려한 대안은 [Decision 5](#decision-5-public-api-경계)를 따른다.

- 조회 실패는 각 화면이 인라인으로 처리하고 Error Boundary로 전파하지 않는다. 근거와
  에러 처리 표는 [Decision 6](#decision-6-실패의-전파와-복구-경계)을 따른다.

### O — Optimization

결정 전에도 방향은 고정할 수 있다.

- 기존 Query 캐시 정책은 구조 이동만으로 변경하지 않는다. staleTime과 gcTime의 근거는
  5주차 판단을 유지한다.
- 오류 계약 변경은 구조 이동과 분리한다. 같은 커밋에 섞지 않는다.
- route `error.tsx`는 최후 방어선이다. 인라인으로 복구 가능한 실패를 여기까지 올리지 않는다.
  전파 기준과 에러 처리 표는 [Decision 6](#decision-6-실패의-전파와-복구-경계)에 있다.
- `loading.tsx`를 두지 않고 로딩은 `isPending`으로 인라인 처리한다. 세그먼트 전체를 fallback으로
  바꾸면 조건을 바꾸는 UI가 조건을 바꿀 때마다 사라진다.
- 데이터 로딩용 Suspense 분할은 하지 않는다. 쪼갤 데이터 단위가 없다. `useSuspenseQuery`를
  도입하면 Decision 6 전체를 다시 본다.
