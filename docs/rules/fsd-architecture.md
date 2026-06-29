# FSD 아키텍처 규칙

이 저장소는 기능이 커질수록 Feature-Sliced Design(FSD)을 따른다. 현재 `src/App.tsx` 중심의 작은 Vite 구조이지만, 새 기능과 도메인 로직은 아래 구조로 확장한다.

## 목표 구조

```txt
src/
  app/
  pages/
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
- Next.js의 `app` router 디렉터리와 FSD의 `app` 레이어가 겹칠 때도 원칙은 같다. 라우트 파일은 entry point이고, 실제 화면/기능/도메인 구현은 `pages`, `widgets`, `features`, `entities`, `shared`로 분리한다.

### pages

- route/page 단위 화면 조립을 담당한다.
- widgets, features, entities, shared를 조합한다.
- 복잡한 도메인 로직이나 재사용 UI를 pages 내부에 숨기지 않는다.

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
- 상위 레이어(app/pages/widgets/features/entities)를 import하지 않는다.
- 도메인에 종속되지 않는 공용 HTTP client, Zod helper, env parser 같은 런타임 검증 기반은 `shared`에 둘 수 있다. 특정 도메인 DTO schema는 `shared`가 아니라 해당 `entities/*` 또는 가까운 slice에 둔다.

## import 방향

상위 레이어는 하위 레이어를 import할 수 있지만, 하위 레이어는 상위 레이어를 import할 수 없다.

```txt
app -> pages -> widgets -> features -> entities -> shared
```

허용 예:

- `pages`가 `widgets`, `features`, `entities`, `shared`를 import
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
- `api`: 해당 slice에 가까운 API 호출
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

## Public API

slice 외부에서 접근할 수 있는 것은 `index.ts`로 명시적으로 노출한다.

```ts
// src/features/add-to-cart/index.ts
export { AddToCartButton } from './ui/add-to-cart-button'
```

`index.ts`는 slice의 공개 계약을 보여주는 파일이다. 어떤 API가 외부로 나가는지 리뷰에서 바로 보이도록 `export * from './...'`를 사용하지 않고, 외부 공개 이름을 직접 나열한다.

다른 slice나 레이어에서는 public API만 import한다.

```ts
// 권장
import { AddToCartButton } from '@/features/add-to-cart'

// 금지
import { AddToCartButton } from '@/features/add-to-cart/ui/add-to-cart-button'
```

현재 저장소에는 `@` alias가 설정되어 있지 않다. alias를 도입하려면 `tsconfig`, Vite/Next 설정, ESLint import 규칙을 함께 갱신한다. alias가 없을 때도 원칙은 동일하다: 외부 slice에서는 public API를 통해 접근한다.

## App.tsx와 라우트 파일

현재 `src/App.tsx`는 bootstrap/demo 역할이다. 새 기능이 커지면 `App.tsx`는 provider와 page 조립만 담당하도록 줄인다.

- 상태 전이, API 호출, 도메인 로직을 `App.tsx`에 누적하지 않는다.
- 페이지 규모 UI는 `pages` 또는 Next.js 라우트에서 조립한다.
- 재사용 화면 블록은 `widgets`, 사용자 행동은 `features`, 도메인 표현은 `entities`, 공용 코드는 `shared`로 이동한다.

## 검토 기준

FSD 위반 여부를 볼 때는 다음 질문을 사용한다.

- 이 파일의 책임이 레이어 이름과 일치하는가?
- 상위 레이어를 하위 레이어에서 import하지 않았는가?
- 다른 slice의 내부 구현을 deep import하지 않았는가?
- `index.ts`가 `export *` 없이 공개 API를 명시적으로 나열하는가?
- public API가 너무 많은 내부 구현을 노출하지 않는가?
- 컴포넌트가 화면 조립, 도메인 로직, 공용 유틸 책임을 동시에 갖고 있지 않은가?
- 상태와 상태를 사용하는 로직이 컴포넌트 본문에 남아 있지 않고 커스텀 훅으로 분리되어 있는가?
