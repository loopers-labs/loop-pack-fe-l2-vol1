# FSD 아키텍처 규칙

이 저장소는 기능이 커질수록 Feature-Sliced Design(FSD)을 따른다. 현재 Next App Router 구조이며, 새 기능과 도메인 로직은 아래 구조로 확장한다.

## 목표 구조

```txt
src/
  app/
  views/
  widgets/
  features/
  entities/
  shared/
```

모든 디렉터리를 미리 만들 필요는 없다. 실제 기능이 생길 때 필요한 레이어와 slice만 만든다.

## 레이어 책임

### app

- 앱 bootstrap, provider, router, 전역 설정을 둔다.
- Next.js 전환 후 `src/app` 라우트 파일은 프레임워크 entry point로 취급한다.
- 라우트 파일에는 비즈니스 로직을 두지 않고 하위 FSD 모듈을 조립한다.
- Next.js의 `app` router 디렉터리와 FSD의 `app` 레이어가 겹칠 때도 원칙은 같다. 라우트 파일은 entry point이고, 실제 화면/기능/도메인 구현은 `views`, `widgets`, `features`, `entities`, `shared`로 분리한다.

### views

- route/view 단위 화면 조립을 담당한다. Next 예약어인 `src/pages` 대신 `src/views`를 사용한다.
- widgets, features, entities, shared를 조합한다.
- 복잡한 도메인 로직이나 재사용 UI를 views 내부에 숨기지 않는다.

### widgets

- 여러 feature/entity를 묶는 독립적인 화면 블록이다.
- 예: header, product-list-section, checkout-summary.
- widget 내부에서 도메인 mutation의 세부 구현을 직접 만들지 말고 feature를 조합한다.

### features

- 사용자 행동 단위의 기능을 둔다.
- 예: add-to-cart, search-product, apply-coupon.
- entity를 사용해 행동을 구성할 수 있지만, 다른 feature 내부 구현에 의존하지 않는다.

### entities

- 도메인 모델과 그 모델에 가까운 UI/API/model 코드를 둔다.
- 예: product, user, order.
- 특정 사용자 행동보다 도메인 자체의 표현과 상태를 담당한다.
- API DTO schema, DTO 타입, DTO를 domain model/value object로 변환하는 adapter는 해당 entity에 가깝게 둔다. 예: `entities/product/api`, `entities/product/model`.
- 도메인 규칙이 있는 값은 plain object를 그대로 넘기기보다 value object나 domain model로 감싸 invariant를 한곳에서 보장한다.

### shared

- 도메인에 종속되지 않는 공용 코드다.
- 예: 공용 UI primitive, lib, config, API client, constants.
- 상위 레이어(app/views/widgets/features/entities)를 import하지 않는다.
- 도메인에 종속되지 않는 공용 HTTP client, Zod helper, env parser 같은 런타임 검증 기반은 `shared`에 둘 수 있다. 특정 도메인 DTO schema는 `shared`가 아니라 해당 `entities/*` 또는 가까운 slice에 둔다.

## import 방향

상위 레이어는 하위 레이어를 import할 수 있지만, 하위 레이어는 상위 레이어를 import할 수 없다.

```txt
app -> views -> widgets -> features -> entities -> shared
```

허용 예:

- `views`가 `widgets`, `features`, `entities`, `shared`를 import
- `features`가 `entities`, `shared`를 import
- `entities`가 `shared`를 import

금지 예:

- `shared`가 `features`를 import
- `entities/product`가 `features/add-to-cart`를 import
- `features/search`가 `widgets/header`를 import
- 서로 다른 slice의 내부 파일을 deep import

## slice와 segment

레이어 아래에는 기능/도메인 단위 slice를 둔다.

```txt
src/features/add-to-cart/
  index.ts
  ui/
  model/
  api/
  lib/
```

자주 쓰는 segment:

- `ui`: 컴포넌트와 화면 표현
- `model`: 상태, selector, reducer, hook 등 기능 모델. 상태 전이와 그 상태를 사용하는 로직은 컴포넌트에 누적하지 않고 커스텀 훅으로 분리한다.
- `api`: 해당 slice에 가까운 API 호출. 외부 응답은 이 경계에서 Zod로 검증하고, 검증된 DTO를 model 계층으로 넘긴다.
- `lib`: slice 내부 유틸리티
- `config`: slice 설정

segment는 필요할 때만 만든다. 비어 있는 관성적 폴더를 만들지 않는다.

## Co-location과 폴더 승격

하나의 기능/화면/도메인 조각을 위해 함께 움직이는 코드는 처음에는 한 파일에 둔다. 해당 컴포넌트나 동작에만 쓰이는 타입, 상수, 작은 유틸리티 함수, 하위 표현 컴포넌트는 같은 파일 안에서 가까이 배치해 변경 맥락을 유지한다.

상태와 상태를 사용하는 로직이 생기면 같은 파일 안의 private custom hook으로 먼저 분리한다. 훅이 길어지거나 같은 slice 안에서 재사용되면 폴더로 승격해 `model` segment나 해당 컴포넌트 폴더의 hook 파일로 옮긴다.

파일이 커지거나 책임이 분리되기 시작하면 그때 폴더로 승격한다.

```txt
src/features/add-to-cart/ui/add-to-cart-button/
  index.ts
  add-to-cart-button.tsx
  add-to-cart-button.types.ts
  add-to-cart-button.constants.ts
  add-to-cart-button.utils.ts
```

폴더로 승격한 뒤에도 외부 공개 계약은 폴더의 `index.ts`에서 필요한 것만 명시적으로 export한다. 내부 타입, 상수, 유틸리티, 보조 컴포넌트는 외부에서 직접 import하지 않는다.

폴더 승격 기준:

- 파일이 길어져 리뷰에서 한 번에 맥락을 파악하기 어려운가?
- 타입, 상수, 유틸리티, 하위 컴포넌트가 서로 다른 속도로 변경되는가?
- 상태 전이, effect, 파생값 계산, 이벤트 핸들러가 컴포넌트 본문을 가리고 있는가?
- 일부 코드가 같은 slice 안의 다른 파일에서도 재사용되는가?
- 테스트나 Storybook 등 보조 파일을 같은 단위로 묶어야 하는가?

반대로 재사용되지 않는 작은 타입/상수/유틸리티를 습관적으로 별도 파일로 빼지 않는다. 파일 수를 늘리는 것보다 변경 맥락을 보존하는 것을 우선한다.

## 유틸리티 그룹화

`lib` segment의 유틸리티는 비슷한 동작끼리 namespace class의 static method로 묶는다. 흩어진 top-level 함수 모음보다 `MoneyUtils.format`, `DateRangeUtils.contains`처럼 호출 이름에서 맥락이 드러나는 형태를 우선한다.

```ts
export class MoneyUtils {
  private constructor() {}

  static format(value: number) {
    return new Intl.NumberFormat('ko-KR').format(value)
  }
}
```

단일 컴포넌트/함수에만 쓰이는 private helper는 해당 파일 안에 둘 수 있다. slice 밖으로 공개되는 공용 유틸리티는 top-level standalone 함수로 export하지 않고 namespace class의 static method로 공개한다. 단, React custom hook은 hook 규약을 따르기 위해 `use[A-Z0-9]...` 이름의 standalone function으로 공개할 수 있다.

## API boundary와 domain model

외부 API 응답은 `unknown`으로 들어온다고 가정하고, API boundary에서 Zod schema로 검증한다. schema를 통과한 값은 DTO/plain object로 다루며, 도메인 규칙이 필요한 경우 entity model에서 domain model/value object로 변환한다.

### Repository와 Service 분리

entity의 api segment는 두 계층으로 나눈다.

- **Repository** (`ProductRepository.ts`): HTTP 데이터 접근만 담당한다. 공용 ky 인스턴스를 constructor로 주입받아 엔드포인트별 조회 메서드를 인스턴스 메서드로 노출한다. 정적 메서드 대신 인스턴스 메서드를 사용해 테스트에서 mock을 주입할 수 있다.
- **Service** (`ProductService.ts`): Repository를 constructor로 주입받아 TanStack Query 설정(queryOptions)을 만든다. `queryKeyFactory` static 중첩 객체로 query key 계층을 관리한다. 비즈니스 로직이나 데이터 변환이 필요하면 Service에 둔다.

```txt
src/entities/product/api/
  ProductRepository.ts    # HTTP 접근 계층 (ky 호출, searchParams 조립)
  ProductService.ts       # Query 설정 계층 (queryOptions, queryKeyFactory)
```

entity의 `index.ts`에서 Service 인스턴스를 export한다. 사용처는 인스턴스를 직접 import해 사용하고, 테스트나 커스텀 구성이 필요할 때는 클래스를 import해 별도 인스턴스를 만든다.

```ts
// src/entities/product/index.ts
import { ProductService } from './api/service'

export const productEntity = new ProductService()
```

왜 정적 메서드 대신 인스턴스를 쓰는가:

- 테스트 시 mock repository/api를 constructor로 주입할 수 있다.
- 여러 인스턴스가 다른 api client(예: 인증 토큰이 다른 클라이언트)를 사용할 수 있다.
- 사용처가 클래스 내부 구조를 알 필요 없이 `productEntity.getHome()`만 호출한다.

```txt
src/entities/product/
  api/
    product.dto.ts
    product.schema.ts
    product.api.ts
  model/
    product.ts
    money.ts
```

권장 흐름:

1. `api`에서 raw response를 Zod schema로 `parse` 또는 `safeParse`한다.
2. schema 기반 DTO 타입은 `z.infer<typeof ProductDtoSchema>`로 만든다.
3. DTO를 그대로 UI에 흘리지 말고, 도메인 규칙이 있으면 `model`의 value object/domain model로 변환한다.
4. React 컴포넌트는 DTO 검증이나 domain object 생성 책임을 갖지 않는다.
5. TanStack Query cache에는 기본적으로 검증된 DTO/plain object를 저장하고, class instance는 필요한 경계에서만 만든다.

## 직접 import (배럴 익스포트 비사용)

이 저장소는 `index.ts` 배럴 익스포트를 사용하지 않는다. slice 외부에서는 모듈의 실제 파일 경로를 직접 import한다.

```ts
// 권장
import { AddToCartButton } from '@/features/cart/ui/AddToCartButton'
import { useCartStore, cartSelectors } from '@/features/cart/model/CartStore'
import { productEntity } from '@/entities/product/api/ProductService'

// 금지
import { AddToCartButton } from '@/features/cart'
import { useCartStore } from '@/features/cart'
```

이유:

- `index.ts`가 없으면 IDE에서 "Go to Definition"이 실제 파일로 바로 이동한다.
- 트리쉐이킹이 불확실해지는 문제를 피한다.
- 사용하지 않는 export가 번들에 포함되는 것을 막는다.
- slice의 공개 계약이 파일 시스템 구조로 드러나며, 변경 시 import 경로가 명시적으로 바뀌어 영향 범위가 보인다.

## Next 라우트 파일

`src/app` 라우트 파일은 프레임워크 entry point다. provider와 라우팅 연결만 담당하고, 화면 조립은 `src/views`, 재사용 UI와 기능은 하위 FSD 레이어에 둔다.

- 상태 전이, API 호출, 도메인 로직을 `App.tsx`에 누적하지 않는다.
- 페이지 규모 UI는 `views` 또는 Next.js 라우트에서 조립한다.
- 재사용 화면 블록은 `widgets`, 사용자 행동은 `features`, 도메인 표현은 `entities`, 공용 코드는 `shared`로 이동한다.

## 검토 기준

FSD 위반 여부를 볼 때는 다음 질문을 사용한다.

- 이 파일의 책임이 레이어 이름과 일치하는가?
- 상위 레이어를 하위 레이어에서 import하지 않았는가?
- 다른 slice의 내부 구현을 deep import하지 않았는가?
- `index.ts` 배럴 익스포트를 만들지 않았는가?
- 직접 파일 경로로 import하는가?
- 컴포넌트가 화면 조립, 도메인 로직, 공용 유틸 책임을 동시에 갖고 있지 않은가?
- 상태와 상태를 사용하는 로직이 컴포넌트 본문에 남아 있지 않고 커스텀 훅으로 분리되어 있는가?
