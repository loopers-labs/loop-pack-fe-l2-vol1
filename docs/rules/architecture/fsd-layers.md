# FSD 레이어와 배치

## When to read

기능의 레이어와 slice를 정하거나, segment를 만들거나, Next route의 책임을 검토할 때 읽는다.

## Source of truth

실제 Next entry와 route는 `src/app`, 경로 및 컴파일 설정은 `tsconfig*.json`과 `next.config.ts`가 우선한다. 저장소 고유의 FSD 레이어 이름과 책임은 이 문서가 판단 기준이다.

## Rules

이 저장소는 기능이 커질수록 Feature-Sliced Design(FSD)을 따른다. 현재 Next App Router 구조이며, 새 기능과 도메인 로직은 아래 구조로 확장한다.

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

### 레이어 책임

#### app

- 앱 bootstrap, provider, router, 전역 설정을 둔다.
- Next.js 전환 후 `src/app` 라우트 파일은 프레임워크 entry point로 취급한다.
- 라우트 파일에는 비즈니스 로직을 두지 않고 하위 FSD 모듈을 조립한다.
- Next.js의 `app` router 디렉터리와 FSD의 `app` 레이어가 겹칠 때도 원칙은 같다. 라우트 파일은 entry point이고, 실제 화면/기능/도메인 구현은 `views`, `widgets`, `features`, `entities`, `shared`로 분리한다.

#### views

- route/view 단위 화면 조립을 담당한다. Next 예약어인 `src/pages` 대신 `src/views`를 사용한다.
- widgets, features, entities, shared를 조합한다.
- 복잡한 도메인 로직이나 재사용 UI를 views 내부에 숨기지 않는다.

#### widgets

- 여러 feature/entity를 묶는 독립적인 화면 블록이다.
- 예: header, product-list-section, checkout-summary.
- widget 내부에서 도메인 mutation의 세부 구현을 직접 만들지 말고 feature를 조합한다.

#### features

- 사용자 행동 단위의 기능을 둔다.
- 예: add-to-cart, search-product, apply-coupon.
- entity를 사용해 행동을 구성할 수 있지만, 다른 feature 내부 구현에 의존하지 않는다.

#### entities

- 도메인 모델과 그 모델에 가까운 UI/API/model 코드를 둔다.
- 예: product, user, order.
- 특정 사용자 행동보다 도메인 자체의 표현과 상태를 담당한다.
- API DTO schema, DTO 타입, DTO를 domain model/value object로 변환하는 adapter는 해당 entity에 가깝게 둔다. 예: `entities/product/api`, `entities/product/model`.
- 도메인 규칙이 있는 값은 plain object를 그대로 넘기기보다 value object나 domain model로 감싸 invariant를 한곳에서 보장한다.

#### shared

- 도메인에 종속되지 않는 공용 코드다.
- 예: 공용 UI primitive, lib, config, API client, constants.
- 상위 레이어(app/views/widgets/features/entities)를 import하지 않는다.
- 도메인에 종속되지 않는 공용 HTTP client, Zod helper, env parser 같은 런타임 검증 기반은 `shared`에 둘 수 있다. 특정 도메인 DTO schema는 `shared`가 아니라 해당 `entities/*` 또는 가까운 slice에 둔다.

### Import 방향

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
- 서로 다른 slice의 공개되지 않은 내부 파일을 임의로 import

### Slice와 segment

레이어 아래에는 기능/도메인 단위 slice를 둔다.

```txt
src/features/add-to-cart/
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

### Next 라우트 파일

`src/app` 라우트 파일은 프레임워크 entry point다. provider와 라우팅 연결만 담당하고, 화면 조립은 `src/views`, 재사용 UI와 기능은 하위 FSD 레이어에 둔다.

- 상태 전이, API 호출, 도메인 로직을 `App.tsx`에 누적하지 않는다.
- 페이지 규모 UI는 `views` 또는 Next.js 라우트에서 조립한다.
- 재사용 화면 블록은 `widgets`, 사용자 행동은 `features`, 도메인 표현은 `entities`, 공용 코드는 `shared`로 이동한다.

## Verification

- 파일의 책임이 레이어 이름과 일치하는가?
- 상위 레이어를 하위 레이어에서 import하지 않았는가?
- 컴포넌트가 화면 조립, 도메인 로직, 공용 유틸 책임을 동시에 갖고 있지 않은가?
- 상태와 상태를 사용하는 로직이 컴포넌트 본문에 남아 있지 않고 커스텀 훅으로 분리되어 있는가?

```bash
pnpm lint
pnpm typecheck
pnpm build
```
