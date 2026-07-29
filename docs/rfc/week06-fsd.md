# RFC: Week 06 FSD Migration

> 문서 상태: Preflight와 Decision 1~4 완료. Decision 5~6과 목표 트리 확정 진행 중.

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

앞 결정의 결과가 뒤 결정의 입력이 되므로 의존 순서대로 배치한다.

| # | 결정 | 선행 조건 | 판단 방법 |
| --- | --- | --- | --- |
| 1 | cart와 wishlist capability 경계와 runtime 조립 방식 | 없음 | 완료. [Decision 1](#decision-1-cartwishlist-capability-boundary) |
| 2 | 단순 toggle UI를 entity의 공개 UI로 볼 것인가, 별도 정책을 가진 feature로 볼 것인가 | Decision 1 | 완료. [Decision 2](#decision-2-toggle-ui의-레이어) |
| 3 | `ProductCard`와 행위를 page에서 조합할 것인가, widget으로 승격할 것인가 | Decision 2 | 완료. [Decision 3](#decision-3-productcard-조합-위치) |
| 4 | 상품 목록 queryOptions의 소유자 | Decision 3의 트리 형태 | 완료. [Decision 4](#decision-4-상품-조회-계약의-소유자) |
| 5 | 어떤 슬라이스에 Public API를 둘 것인가 | Decision 2~4 | 슬라이스별 외부 소비자를 세어 판단 |
| 6 | API 실패, 렌더링 실패, 이벤트 행위 실패의 전파와 복구 경계 | 구조 결정과 독립 | 실패 종류별로 생존 범위를 정의 |

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
- **Decision 1은 유지한다.** "라이브러리와 충돌하면 내 설계를 의심하라"를 적용해 다시 봤다.
  충돌한 것은 Zustand의 canonical slices 관례이고, 그 관례가 요구한 것은 슬라이스 생성자가
  전체 store 타입을 아는 것이다. 우리가 세운 경계는 "cart가 wishlist를 알지 않는다"이고,
  이는 위시리스트 삭제라는 필수 변경 시나리오에서 나왔다. 라이브러리 관례를 따르면 이
  시나리오에서 cart 타입 계약이 함께 바뀐다. 도메인 경계를 우선한다는 조언과 같은 방향이므로
  결론을 바꾸지 않는다.
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
경계는 최소 세 곳이다.

- 공통 Zustand runtime 조립부
- 상위 조합부 (Decision 3 이후 `widgets/product-grid`)
- Header 조합부 (`HeaderCounts`)

`entities/wishlist/ui`는 폴더째 지우므로 "깨지는 생존 파일"에 넣지 않는다. 세 곳 모두
[Decision 1](#decision-1-cartwishlist-capability-boundary)의 Validation이 이미 삭제하거나
수정할 수 있는 대상으로 열거한 항목이므로, 이 정정은 Decision 1의 결론을 바꾸지 않는다.

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

## 1. RADIO

전체 구조를 빠르게 이해하기 위한 본문이다. 논쟁이 있었던 항목의 선택 근거와 반려 이유는
Decision Card에 두고, 여기서는 결론과 참조만 적는다.

현재는 사실, 불변 조건, 적용 규칙, 미정 항목만 배치한다. 아직 내리지 않은 결정을 목표 구조에
미리 써넣지 않는다. 결론 부분은 Decision 2~6이 끝난 뒤 채운다.

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

#### 목표 트리

Decision 2~5의 결과를 반영해 확정한다. 현재 시점의 상태는 다음과 같다.

고정된 경계

- cart와 wishlist의 capability 모델을 분리한다.
- 두 capability를 하나의 Zustand runtime에서 조립한다.
- `ProductCard` 내부에서 행위 조합을 제거한다.
- 토글 UI는 각 capability의 entity 슬라이스에 두고 features 레이어를 열지 않는다.
- 상품 표현과 행위의 조합은 `widgets/product-grid`가 소유한다. 빈 상태는 page가 소유한다.
- 상품 목록과 홈의 조회 계약은 각 page 슬라이스가 소유한다. `entities/product`에는 `api` 세그먼트를 만들지 않는다.

아직 열려 있는 경계

- Public API 적용 범위

#### 마이그레이션 원칙

- 구조 변경과 기능 변경을 같은 커밋에 섞지 않는다.
- 각 단계마다 `pnpm check`가 통과해야 다음 단계로 간다.
- 되돌릴 수 있는 단위로 나눈다. 한 커밋이 여러 레이어를 동시에 만들지 않는다.
- 커밋마다 하위가 상위를 참조하지 않는지 확인한 뒤 다음으로 넘어간다.

### D — Data Model

폴더 위치가 정해지지 않아도 Source of Truth와 소유 책임은 지금 쓸 수 있다.

| 상태 | Source of Truth | 소유 책임 | 소비하는 곳 | 중복 저장하지 않는 방법 |
| --- | --- | --- | --- | --- |
| 상품 조회 결과와 totalCount | 서버, TanStack Query cache | product 조회 계약을 소유하는 슬라이스 (Decision 4) | 홈, 상품 목록 | 응답을 store나 로컬 상태로 옮기지 않는다 |
| 검색어, 카테고리, 정렬, 페이지 | URL | 목록 조건 parser와 조립 훅 | 상품 목록 | URL에서 읽어 조건 객체 하나로 만들고 query key와 요청이 그 객체를 공유한다 |
| 장바구니에 담긴 상품 ID | Zustand | cart capability model | 헤더, 상품 행위 UI | 개수와 포함 여부를 저장하지 않고 selector에서 파생한다 |
| 위시리스트에 담긴 상품 ID | Zustand | wishlist capability model | 헤더, 상품 행위 UI | 같은 방식 |
| store 생성, 초기화, reset | 인메모리 Zustand runtime | 공통 runtime 조립부 | 두 capability | capability가 runtime 생성 방식을 알지 않는다 |
| 제출 전 검색어 | React local state | 검색 폼 | 검색 폼 하나 | 제출 시점에만 URL로 승격한다 |
| 로딩, 에러, 빈 결과 | 파생 | 없음 | 각 화면 | 쿼리 상태에서 렌더 중 계산한다 |

cart와 wishlist는 capability 모델을 분리하고 하나의 Zustand runtime에서 조립한다. 구현
방식과 대안 비교는 [Decision 1](#decision-1-cartwishlist-capability-boundary)을 따른다.

### I — Interface

#### 확정

- cart capability와 wishlist capability는 서로의 모델을 알지 않는다.
- `ProductCard`는 cart와 wishlist 구현을 직접 import하지 않는다.
- 상위 조합부가 `ProductCard`와 사용자 행위를 연결한다.
- 각 capability는 selector hook과 action hook만 공개하고 store 구현체는 공개하지 않는다.

#### 미정

- 각 슬라이스에 Public API가 필요한가 (Decision 5)
- Decision 5의 확인된 입력: `entities/wishlist`와 `entities/cart`는 조합부 밖에 Header라는
  외부 소비자를 가진다. 소비 형태는 개수 selector 하나다.
- Decision 5의 확인된 입력: `shared`의 목록 조건 계약은 화면과 mock API route 양쪽이
  소비한다. FSD 레이어 밖 서버 코드가 소비자로 들어오는 유일한 경우다.

### O — Optimization

결정 전에도 방향은 고정할 수 있다.

- 기존 Query 캐시 정책은 구조 이동만으로 변경하지 않는다. staleTime과 gcTime의 근거는
  5주차 판단을 유지한다.
- 오류 계약 변경은 구조 이동과 분리한다. 같은 커밋에 섞지 않는다.
- route `error.tsx`는 최후 방어선이다. 인라인으로 복구 가능한 실패를 여기까지 올리지 않는다.
- 인라인 복구 범위와 `throwOnError` 전파 기준은 Decision 6에서 정한다.
- Suspense 전환은 현재 필수 요구가 아니므로 하지 않는다. 필요해지면 근거와 함께 다시 본다.
