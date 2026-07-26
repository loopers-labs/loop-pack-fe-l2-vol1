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

앞 결정의 결과가 뒤 결정의 입력이 되므로 의존 순서대로 배치한다.

| # | 결정 | 선행 조건 | 판단 방법 |
| --- | --- | --- | --- |
| 1 | cart와 wishlist capability 경계와 runtime 조립 방식 | 없음 | 완료. [Decision 1](#decision-1-cartwishlist-capability-boundary) |
| 2 | 단순 toggle UI를 entity의 공개 UI로 볼 것인가, 별도 정책을 가진 feature로 볼 것인가 | Decision 1 | 두 안을 폐기용 spike로 실측 |
| 3 | `ProductCard`와 행위를 page에서 조합할 것인가, widget으로 승격할 것인가 | Decision 2 | 두 안을 폐기용 spike로 실측 |
| 4 | 상품 목록 queryOptions의 소유자 | Decision 3의 트리 형태 | 소비 관계와 key가 표현하는 대상으로 판단 |
| 5 | 어떤 슬라이스에 Public API를 둘 것인가 | Decision 2~4 | 슬라이스별 외부 소비자를 세어 판단 |
| 6 | API 실패, 렌더링 실패, 이벤트 행위 실패의 전파와 복구 경계 | 구조 결정과 독립 | 실패 종류별로 생존 범위를 정의 |

레이어 개수는 독립 결정으로 다루지 않는다. 개수를 먼저 정하면 그 수를 맞추려고 파일을 끼워
넣게 된다. 앞선 경계 결정 결과 실제 책임이 생긴 레이어만 사용하고, 최종 목표 트리에서 사용한
레이어와 사용하지 않은 레이어를 근거와 함께 기록한다.

Public API도 독립 결정이 아니라 슬라이스 경계가 정해진 뒤 적용하는 경계 통제 정책이다. 먼저
정하면 빈 `index.ts`를 양산하거나 슬라이스가 바뀔 때 다시 쓰게 된다. 순서는 슬라이스 경계
결정, 외부 소비자 확인, 숨길 구현 확인, 필요한 곳에만 생성이다.

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
5. **실패의 종류를 구분할 수 없다.** `api.ts`가 HTTP 실패를 status 정보 없는 일반 `Error`로
   바꾼다. 어떤 실패를 어디까지 전파할지 정하려면 이 정보가 필요하다.

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

아직 열려 있는 경계

- toggle UI가 속할 레이어
- `ProductCard` 조합 위치
- 상품 목록 query의 소유자
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

- toggle UI가 entity의 공개 UI인가 별도 feature인가 (Decision 2)
- page 조합인가 widget 조합인가 (Decision 3)
- 각 슬라이스에 Public API가 필요한가 (Decision 5)

### O — Optimization

결정 전에도 방향은 고정할 수 있다.

- 기존 Query 캐시 정책은 구조 이동만으로 변경하지 않는다. staleTime과 gcTime의 근거는
  5주차 판단을 유지한다.
- 오류 계약 변경은 구조 이동과 분리한다. 같은 커밋에 섞지 않는다.
- route `error.tsx`는 최후 방어선이다. 인라인으로 복구 가능한 실패를 여기까지 올리지 않는다.
- 인라인 복구 범위와 `throwOnError` 전파 기준은 Decision 6에서 정한다.
- Suspense 전환은 현재 필수 요구가 아니므로 하지 않는다. 필요해지면 근거와 함께 다시 본다.
