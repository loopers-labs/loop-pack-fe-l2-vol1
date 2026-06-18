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

### shared

- 도메인에 종속되지 않는 공용 코드다.
- 예: 공용 UI primitive, lib, config, API client, constants.
- 상위 레이어(app/pages/widgets/features/entities)를 import하지 않는다.

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
- `model`: 상태, selector, reducer, hook 등 기능 모델
- `api`: 해당 slice에 가까운 API 호출
- `lib`: slice 내부 유틸리티
- `config`: slice 설정

segment는 필요할 때만 만든다. 비어 있는 관성적 폴더를 만들지 않는다.

## Public API

slice 외부에서 접근할 수 있는 것은 `index.ts`로 명시적으로 노출한다.

```ts
// src/features/add-to-cart/index.ts
export { AddToCartButton } from './ui/add-to-cart-button'
```

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
- public API가 너무 많은 내부 구현을 노출하지 않는가?
- 컴포넌트가 화면 조립, 도메인 로직, 공용 유틸 책임을 동시에 갖고 있지 않은가?
