# 6주차 설계 판단 기록

> 멘토님께 "이건 이렇게 고민해서 이렇게 개발했다"를 전달하려고, 이번 주 개발하면서 갈렸던 판단들과 그 근거를 정리했습니다. 정답을 정리한 문서라기보다, 제가 어디서 멈춰서 무엇을 기준으로 골랐는지를 남긴 기록입니다.
>
> 구조 설계 자체(RADIO·폴더 트리·파일 매핑)는 [`docs/rfc/week06-fsd.md`](../rfc/week06-fsd.md)에 있고, 이 문서는 그 과정에서 갈렸던 판단과 이유를 다룹니다.

## 1. FSD 의존성 규칙을 루트 ESLint 설정에 모두 둘 것인가

### 고민

`eslint-plugin-boundaries`로 FSD 의존 방향을 검사하려면 레이어와 슬라이스를 element로 정의하고, 허용할 참조 관계를 policy로 작성해야 했다. 여기에 같은 레이어의 다른 슬라이스 참조 금지, `entities`의 `@x` 예외, Next.js `app` 디렉터리 구분까지 표현하니 `eslint.config.mjs`가 길어졌다.

규칙을 엄격하게 검사하려는 목적은 분명했지만, 일반 TypeScript·React 규칙과 FSD 아키텍처 정책이 한 파일에 섞이면서 전체 ESLint 설정을 읽기 어려워지는 문제가 있었다.

### 검토한 선택지

1. **모든 설정을 `eslint.config.mjs`에 유지한다.**
   - 설정을 한 파일에서 확인할 수 있다.
   - FSD 정책의 상수, 생성 함수, 상세 규칙 때문에 루트 설정의 역할이 흐려진다.
2. **검사 범위를 줄여 설정 자체를 단순화한다.**
   - 설정은 짧아지지만 같은 레이어의 슬라이스 참조나 `@x` 경로 같은 규칙을 코드 리뷰에 의존해야 한다.
   - 이미 자동화한 아키텍처 검증 일부를 포기하게 된다.
3. **FSD 설정만 별도 모듈로 분리한다.**
   - 검증 수준을 유지하면서 일반 코드 규칙과 아키텍처 정책의 책임을 나눌 수 있다.
   - 설정 파일이 하나 늘어나지만 변경 목적에 따라 확인할 파일이 명확해진다.

### 결정

FSD 규칙의 범위를 줄이지 않고 `eslint/fsd.config.mjs`로 분리했다. 루트 `eslint.config.mjs`에는 Next.js 설정, 공통 TypeScript·React 규칙, Prettier 적용 순서와 `fsdConfig` 조합만 남겼다.

FSD 설정 파일은 다음 내용을 함께 소유한다.

- FSD 레이어 순서와 슬라이스 레이어 목록
- 파일을 레이어와 슬라이스로 분류하는 element 설정
- 상위 레이어에서 하위 레이어로만 참조하게 하는 policy
- 같은 레이어의 다른 슬라이스 참조 금지
- `entities/@x` 교차 참조 예외
- 미분류 파일과 의존성 검사

### 판단 근거

설정의 줄 수 자체보다 한 파일이 여러 책임을 갖는 것이 문제라고 판단했다. FSD 의존성 정책은 서로 연관된 하나의 규칙 집합이므로 내부 상수와 생성 함수까지 같은 모듈에 두고, 루트 ESLint 설정은 여러 설정을 조합하는 진입점 역할만 담당하게 했다.

이렇게 하면 FSD 검증 강도를 낮추지 않으면서도 일반 린트 규칙을 수정할 때 아키텍처 정책을 함께 읽지 않아도 된다. 반대로 FSD 구조를 변경할 때도 전용 설정 파일만 확인하면 된다.

## 2. 라우팅 파일에 화면 구현을 남길 것인가

### 고민

FSD의 `app` 레이어와 Next.js App Router의 `app` 디렉터리가 이름부터 충돌해서, `_app`·`_pages`를 쓰기로 하는 것까지는 가이드대로였다. 그다음이 애매했다. `page.tsx`·`loading.tsx`·`error.tsx`는 Next.js가 **파일 위치로** 의미를 부여하는 파일이라, 그 자리에 구현이 있어도 "왜 여기 있는지"가 파일 컨벤션으로 이미 설명된다. 그럼 굳이 내려야 하나.

### 검토한 선택지

1. **라우팅 파일에 구현을 그대로 둔다.** 파일 수가 늘지 않고 Next.js 컨벤션과 가장 가깝다. 대신 `_pages`가 "화면 구현을 소유한다"는 규칙에 예외가 생기고, `page.module.css`처럼 라우팅 파일에 딸린 자산의 소유자도 계속 애매하게 남는다.
2. **구현을 `_pages`·`_app`으로 내리고 라우팅 파일은 re-export만 남긴다.** 라우팅 파일이 "이 URL은 이 화면"만 말하게 된다. 파일이 늘고, `error.tsx`처럼 `'use client'`가 필요한 자리에는 지시자를 재export 파일에도 남겨야 한다.

### 결정

내리고 re-export하기로 했다. 라우팅 파일에는 `html`·`metadata`·폰트 설정과 `export const dynamic` 같은 라우트 세그먼트 설정만 남겼다. 이건 Next.js가 그 파일에서만 읽는 값이라 내릴 수가 없다.

같이 딸려온 것으로, `app/page.module.css`는 실제 소비자가 루트 에러 화면 하나뿐이어서 `_app/ui/RootErrorFallback.module.css`로 이름까지 맞춰 옮겼다.

### 판단 근거

1단계의 목적 자체가 라우팅 껍질과 구현을 분리하는 것이라, 여기서 예외를 두면 뒤 단계에서 "이건 왜 여기 있지"를 매번 다시 판단하게 될 것 같았다. 파일이 느는 비용은 한 번이고, 소유자가 애매한 상태는 계속 남는다고 봤다.

### 곁가지 — Public API와 배럴 파일

이 결정을 하니 `app/(home)/page.tsx`가 `_pages/home`의 무엇을 import할지가 바로 따라왔다. 기존 컨벤션에는 "배럴 파일 지양"이 있어서 예외를 둘지 정해야 했다.

둘의 차이를 기준으로 갈랐다. 배럴은 여러 모듈을 한 경로에서 꺼내 쓰려는 **편의**고, Public API는 슬라이스가 밖에 무엇을 보장하는지 정하는 **계약**이다. 후자는 없으면 소비처가 슬라이스 내부 구조에 그대로 묶인다. 그래서 슬라이스 루트에 `index.ts` 한 겹만 두고, 세그먼트별 `index`는 만들지 않기로 했다.

슬라이스가 없는 레이어(`_app`, `shared`)에는 두지 않았다. 감쌀 슬라이스 경계가 없고, `globals.css` 같은 자산은 애초에 배럴을 통과할 수 없다. 여기서는 직접 경로가 계약을 더 정확히 드러낸다고 봤다.

`index.server.ts` 분리는 지금 서버 전용 모듈이 `getServerQueryClient` 하나뿐이라 미뤘다. 서버 전용 면이 늘어나는 6단계에서 다시 본다.

## 3. 파일명 컨벤션을 언제 바꿀 것인가

### 고민

기존 규칙은 "컴포넌트와 파일은 `PascalCase`"였다. 그런데 `queryClient.ts`·`searchParams.ts`·`cartStore.ts`처럼 컴포넌트가 아닌 파일까지 camelCase/PascalCase가 섞여 있어서, 파일 목록만 보고 컴포넌트와 훅·유틸을 구분할 수 없었다. FSD 전환으로 어차피 파일이 대거 움직이는 중이라 지금이 바꾸기 좋은 시점 같았다.

### 결정

컴포넌트 파일은 `PascalCase`, 그 외(훅·유틸·설정·타입)는 `kebab-case`로 통일했다. 기준은 "default로 무엇을 내보내는가"다.

적용 시점은 **파일별로 나눠서** 했다. 이미 FSD 구조로 옮긴 파일에만 즉시 적용하고, 아직 옛 폴더에 있는 파일은 해당 단계에서 옮길 때 새 경로와 새 이름을 한 번에 주기로 했다.

### 판단 근거

지금 전부 이름만 바꾸면 같은 파일이 rename → move로 두 번 찍힌다. `git log --follow`로 따라갈 수는 있지만, 나중에 "이 파일이 어디서 왔나"를 볼 때 이력이 한 겹 더 생긴다. 이동이 예정된 파일이라면 두 변경을 합치는 편이 낫다고 봤다.

부수 효과로 `component-design.md`의 "파일명과 내보내기 이름 일치" 규칙이 kebab-case 훅과 충돌해서, 그 규칙을 컴포넌트에만 적용되도록 좁혔다.

## 4. 소비처가 0인 코드를 어디에 둘 것인가

### 고민

3주차에 만든 select 3종·`dialog`·`useSelect`와 `product-options`·`isSoldOut`·`formatPrice`가 어느 라우트에서도 쓰이지 않았다. 공용 폴더(`components/ui`·`hooks`·`utils`)에 있으니 "공용"처럼 보이는데, 실제 소비처는 0이었다.

`shared`로 옮기는 게 자연스러워 보였다. 그런데 옮기려고 보니 `shared/ui`인지 `entities`인지 판단할 근거가 없었다. 재사용 범위를 정하려면 소비처를 봐야 하는데, 볼 소비처가 없었다.

### 확인한 것

import 관계를 따라가 보니 이 파일들이 **서로만** 참조하는 닫힌 섬이었다. 어느 라우트에서도 진입할 수 없는 상태였다. `product-options.ts`는 `commerce.ts`와 이름이 같은 별개의 `Product` 타입을 선언하고 있기도 했다.

### 결정

섬 전체를 삭제했다. 다만 `formatPrice`는 예외로 두고 `shared/lib`으로 옮긴 뒤, `ProductCard`가 쓰던 인라인 `toLocaleString('ko-KR')`을 이 함수로 교체했다.

### 판단 근거

배치를 정할 근거가 없다는 게 곧 "지금 이 코드의 자리가 없다"는 뜻이라고 봤다. `shared`로 옮기면 "언젠가 쓸지도 모른다"가 판단을 대신하고, 그 판단을 다음 사람이 다시 하게 된다. 필요해지면 git 이력에서 꺼내면 된다.

`formatPrice`만 살린 건 소비처를 만들 수 있었기 때문이다. `ProductCard`가 같은 포맷을 인라인으로 하고 있었고, 교체하면 RFC에서 지적한 "기존 유틸이 있는데 재사용되지 않는다" 문제도 같이 닫힌다. 출력 문자열이 동일해서 동작은 바뀌지 않지만, 이동이 아니라 호출부 변경이라 커밋은 나눴다.

`isSoldOut`은 살리지 않았다. `stock === 0` 한 줄인데다 `Product.sizes[].stock`과 짝이 안 맞아서, 소비처를 억지로 만들기보다 함께 정리했다.

### 이후 갱신 (2026-07-31)

삭제했던 select 3종·`SelectToggleIcon`·`Dialog`·`useSelect`를 `shared/ui/select`, `shared/ui/Dialog`로 재추가했다. `isSoldOut`도 `shared/lib/is-sold-out.ts`로 함께 복원했다.

이번엔 단순 복원이 아니라 **삭제 결정 자체를 다시 봤다.** select 쪽은 근거가 있다 — `_pages/product-list/ui/ProductFilters.tsx`가 지금 카테고리·정렬을 네이티브 `<select>`로 렌더링하고 있는데, 여기 있던 `TextOptionSelect`(또는 유사 변형)로 이 두 select를 대체할 수 있다고 판단했다. 즉 "재사용 범위를 판단할 근거가 없다"던 삭제 당시 전제가, 구체적인 대체 대상이 눈에 들어오면서 깨졌다. 아직 `ProductFilters.tsx`를 실제로 바꾸지는 않았으므로 소비처는 여전히 0건이지만, "그럴 계획이 없다"에서 "구체적으로 어디에 쓸지 안다"로 근거가 바뀐 상태다.

Dialog는 사정이 다르다. 지금도 딱히 쓸 자리를 짚어두진 않았다. select와 같은 커밋에서 삭제됐던 세트라 함께 되살렸을 뿐, 이 문서가 처음 삭제를 결정했던 근거(소비처 0, 재사용 범위 불명확)를 뒤집을 새로운 판단은 아직 없다. 다음에 이 코드를 다시 정리할 일이 생기면 select와 Dialog를 같은 기준으로 묶어 판단하지 않는다.

이동하면서 두 가지만 바꿨다.

- `product-options.ts`의 `Product` 타입은 가져오지 않았다. `entities/product/model/product.ts`와 이름만 같은 별개 타입이라는 문제가 삭제 시점과 동일하게 남아 있어서, 실제로 쓰이던 `SizeSelectOption`·`TextSelectOption`·`ThumbnailSelectOption` 세 타입만 `shared/ui/select/select.model.ts`로 옮겼다.
- `dialog/index.tsx`는 `Dialog.tsx`로 파일명만 바꿨다. 배럴 파일 금지 컨벤션이 삭제 이후 굳어져서, 로직은 그대로 두고 이름만 맞췄다.

### 후속 분리 — controlled Select 기반과 상품 옵션 UI

복원 뒤 다시 보니 `TextOptionSelect`·`SizeOptionSelect`·`ThumbnailOptionSelect`는 범용 Select가 아니었다. 옵션 타입과 JSX가 재고·가격·최대 할인·무료 배송·묶음 배지를 직접 알고 있어 `shared`의 도메인 비종속 기준을 어겼다. 특히 `TextOptionSelect`를 상품 목록의 카테고리·정렬 필터에 재사용하려면 필요하지 않은 가격·재고 필드를 억지로 채워야 하므로, 그 대체 근거도 성립하지 않았다.

다음처럼 책임을 다시 나눴다.

- `shared/ui/select/useControlledSelect.ts`: 외부가 소유한 `value`와 `onValueChange`, 옵션 식별자, 비활성 판정만 입력받는다. 내부에는 열림·하이라이트·키보드 탐색·바깥 클릭 상태만 둔다.
- `shared/ui/select/SelectToggleIcon.tsx`: 상품 지식이 없는 공통 열림 상태 표현으로 남긴다.
- `entities/product/model/product-option.ts`: 상품 옵션 타입과 품절 판정을 소유한다.
- `entities/product/ui/product-option-select/*`: 가격·재고·할인·배송을 표현하는 세 상품 옵션 UI를 소유한다.

상품 옵션 UI는 현재 소비처가 없으므로 `entities/product/index.ts`에서 공개하지 않는다. 실제 상품 상세나 옵션 선택 조합 위치가 생기면 그 요구사항에 맞춰 필요한 계약만 Public API로 연다. `ProductFilters`는 별개의 URL 필터 계약이므로 이번 분리에서 이 UI로 교체하지 않는다.

### 최종 결정 — `ProductFilters`에는 select를 쓰지 않는다

"이후 갱신" 절에서 "`TextOptionSelect`(또는 유사 변형)로 `ProductFilters`의 네이티브 select를 대체할 수 있다"고 재추가 근거를 세웠는데, 위 후속 분리에서 확인했듯 그 근거가 틀렸다. `TextOptionSelect`는 가격·재고·할인·배송을 아는 상품 옵션 UI라 카테고리·정렬처럼 `{id, label}`만 있으면 되는 필터에는 애초에 안 맞는 컴포넌트였다. `useControlledSelect` + `SelectToggleIcon`을 직접 조합해 새 컴포넌트를 만드는 방법은 남아 있지만, 그건 "기존 select를 재사용"이 아니라 "새 컴포넌트를 새로 만드는" 별개의 작업이다.

그래서 `ProductFilters`는 지금의 네이티브 `<select>`를 유지하고, `shared/ui/select`·`entities/product/ui/product-option-select` 어느 쪽도 이 화면에 연결하지 않는다. select 3종과 Dialog 모두 **소비처도 계획도 없는 상태**라는 결론까지 도달했지만, 이 시점에는 원래 삭제 근거가 다시 유효해졌다는 기록만 남기고 코드는 정리하지 못했다.

### 피드백 반영 — 최종 삭제 (2026-08-03)

과제 피드백에서 self-review가 이미 삭제 대상으로 판정한 코드를 그대로 남긴 모순을 확인했다. 상품 옵션 select 3종과 옵션 모델, 이 UI만 사용하던 `useControlledSelect`·`SelectToggleIcon`, 소비처와 재사용 계획이 없는 Dialog를 다시 삭제했다.

최종 기준은 처음과 같다. 배치를 정할 실제 소비처가 없고 구체적인 사용 계획도 없다면 지금 코드의 자리가 없는 것이다. 필요해질 가능성만으로 유지하지 않고, 실제 요구사항이 생길 때 git 이력에서 필요한 계약만 다시 검토한다.

## 5. `shared`에 무엇을 내릴 것인가

### 고민

`shared`는 "도메인 지식이 없는 코드"라는 기준이 있지만, 실제로 갈릴 때는 그 기준만으로 안 잡히는 것들이 있었다. `getServerQueryClient`는 앱 배선처럼 보였고, `createCollectionStore`는 두 도메인이 나눠 쓰는 구현이었다.

### 결정과 근거

둘 다 결국 **의존 방향이 답을 정해줬다.**

`getServerQueryClient`는 `_app`에 두고 싶었다. 클라이언트 쪽 짝(`Providers`의 `useState` QueryClient)이 거기 있어서 "QueryClient는 여기서 만든다"가 한 곳에 모이기 때문이다. 그런데 유일 소비처가 `_pages/home`이고, `_app`은 `_pages`보다 상위 레이어다. `_pages`가 `_app`을 참조하는 순간 역방향이 되어 `boundaries/dependencies`가 막는다. 그래서 `shared/api`로 내리고, 두 QueryClient 생성 지점이 갈라지는 건 감수했다.

`createCollectionStore`도 마찬가지였다. `entities/cart`에 두면 `entities/wishlist`가 같은 레이어의 다른 슬라이스를 참조해야 한다. `@x` 예외가 있긴 하지만 그건 타입 전용이고, `create` 함수 같은 런타임 구현은 공개 대상이 아니라고 이미 정해둔 상태였다. 내용도 "id 집합 + 토글 + persist 복구"라 도메인 지식이 없어서 `shared/lib`이 맞았다.

`types/commerce.ts`는 반대로 `shared`에 두지 **않기로** 했다. 한 파일에 여러 도메인 타입이 모여 있는 게 RFC에서 꼽은 문제였는데, `shared/api`로 통째로 옮기면 창고가 이름만 바꿔 그대로 남는다. 도메인 타입은 `entities/product/model`로, 응답 봉투는 그 응답을 조회하는 쪽으로 나누기로 하고, 실제 분해는 entities를 만드는 3단계로 미뤘다.

mock 전용 타입(`MockApiScenario`)은 `app/api` 안에 남긴다. Route Handler와 fixture만 소비하고, 프론트엔드 레이어의 자산이 아니라 mock 백엔드의 내부 계약이라고 봤다.

### 옮기지 않고 남긴 것

`ProductGrid`·`ProductGridSkeleton`·`CategorySection`·`HeroBanner`·`Header`·`ProductCard`·`ProductCardActions`는 2단계에서 건드리지 않았다. 최종 레이어가 3~6단계 결정에 걸려 있어서다. 특히 `ProductGrid`는 `ProductCard`를 참조하는데, 카드가 `shared`보다 위 레이어로 가면 그리드도 `shared`에 둘 수 없다 — 상향 참조라 막힌다. 카드는 4단계에서 `features/product-card`로 중간 배치했다가, 7단계 재검토에서 `widgets/product-card`로 최종 이동했다.

한 파일을 두 번 옮기지 않는다는 원칙(0.5단계)에 따라 각자의 단계에서 한 번만 움직인다.

## 6. 상품 카드를 entity, feature, widget 중 어디에 둘 것인가

### 고민

`ProductCard`가 그리는 건 이미지·브랜드·이름·가격이다. 상품이라는 entity의 표현 그 자체로 보였다. 그런데 지금 코드에서는 그 카드가 `ProductCardActions`(찜·담기 버튼)를 직접 import하고 있다. RFC에서 문제로 꼽았던 지점이기도 하다 — "상품 표현이 장바구니·위시리스트 도메인에 묶여 있어, 행위 없는 곳에서 카드만 재사용할 수 없다".

### 첫 번째 판단 — `entities/product/ui`

`entities/product/ui`로 옮기고, 행위 버튼은 4단계에서 `features`로 분리한 뒤 카드가 `actions` 슬롯으로 받게 한다. 그러면 표시와 행위가 갈라지고 카드만 재사용할 수 있게 된다.

3단계 작업 트리에서는 실제로 그렇게 옮기는 시도를 했다. 당시 작업 스냅샷에는 `entities/product/ui/ProductCard.tsx`가 남아 있지만, 재사용 근거를 검토한 뒤 커밋 전에 철회했다. 실제 커밋 `30f0dc3`에서는 `ProductCard`가 `components`에서 `features/product-card`로 바로 이동했다.

하지만 "카드만 재사용할 수 있게 된다"는 근거를 검증해 보니, **재사용할 자리가 없었다.**

- `ProductCard`의 소비처는 `ProductGrid` 하나뿐이었다.
- `ProductGrid`의 소비처는 홈과 상품 목록 둘인데, 양쪽 다 찜·담기를 함께 그렸다.

행위 없는 카드가 필요한 곳이 지금 하나도 없었다. 그러니까 슬롯을 만들어 얻는 건 "언젠가 필요할지 모르는 유연성"이고, 대신 카드 → 그리드 → 페이지로 `actions` props를 전달하는 배선이 실제로 생긴다. 있지도 않은 요구를 위해 지금 있는 코드를 복잡하게 만드는 쪽이었다.

### 두 번째 판단 — `features/product-card`

현재 모든 소비처에서 상품 표시와 찜·담기를 함께 사용하므로, `features/product-card` 한 슬라이스가 표시와 행위를 모두 소유하도록 바꿨다.

```text
features/product-card/
├── model/
│   ├── types.ts                    # ProductCardItem (카드가 그리는 5개 필드)
│   └── useProductCardActions.ts    # 찜·담기 상태와 토글
├── ui/
│   ├── ProductCard.tsx             # 정보 표시
│   ├── ProductCardActions.tsx      # 행위 UI
│   └── ProductCard.module.css
└── index.ts                        # ProductCard와 ProductCardItem만 공개
```

`entities/product`에는 도메인 타입만 남았다. entity에 UI가 없어도 되는지 한 번 걸렸는데, 슬라이스가 무엇을 소유해야 하는지는 레이어 이름이 아니라 그 도메인이 실제로 갖고 있는 것이 정한다고 봤다.

이 결정은 당장 필요하지 않은 슬롯과 props 전달을 없앴지만, 다른 문제가 남았다.

- `product-card`는 사용자 행위가 아니라 UI 블록의 이름인데 `features`에 있었다.
- `useProductCardActions` 하나가 장바구니와 위시리스트 store를 함께 구독했다.
- `ProductCardActions`도 서로 독립적인 찜과 담기 행위를 한 컴포넌트로 묶었다.
- 위시리스트 기능을 삭제하는 변경 반경이 `entities/wishlist`에 그치지 않고 결합 훅과 결합 UI까지 퍼졌다.

처음에는 이 비용을 "훅만 둘로 나누면 개선할 수 있다"고 봤다. 그런데 FSD의 feature 정의로 다시 보면, 중요한 건 훅의 개수가 아니라 **각 사용자 행위가 독립된 슬라이스로 식별되는가**였다.

### 다시 검토한 선택지

1. **`entities/product/ui`로 되돌리고 action 슬롯을 둔다.**
   - 순수한 상품 표현과 행위를 분리할 수 있다.
   - 현재 존재하지 않는 "행위 없는 카드"를 위해 슬롯과 props 전달을 만들어야 한다.
2. **`features/product-card`를 유지하고 내부 컴포넌트만 나눈다.**
   - 변경량은 가장 작다.
   - 찜과 담기라는 두 사용자 행위가 여전히 `product-card`라는 UI 이름 아래 묶인다.
   - 두 행위를 별도 feature 슬라이스로 만들면 feature가 같은 레이어의 다른 feature를 직접 조합할 수 없어 의존성 규칙과 충돌한다.
3. **찜과 담기를 각각 feature로 분리하고 `widgets/product-card`에서 조합한다.**
   - `add-to-wishlist`는 wishlist entity만, `add-to-cart`는 cart entity만 참조한다.
   - `ProductCard`는 두 feature를 조합하는 독립 UI 블록이라는 책임을 갖는다.
   - 상위 `widgets`에서 하위 `features`를 참조하므로 의존 방향도 자연스럽다.

### 최종 결정 — `widgets/product-card`

세 번째 안을 선택했다.

```text
widgets/product-card/
├── model/types.ts
├── ui/
│   ├── ProductCard.tsx
│   ├── ProductGrid.tsx
│   └── ProductGridSkeleton.tsx
└── index.ts

features/
├── add-to-wishlist/
│   └── ui/WishlistButton.tsx
└── add-to-cart/
    └── ui/AddCartButton.tsx
```

`ProductCardActions`와 `useProductCardActions`는 제거했다. `WishlistButton`과 `AddCartButton`은 각 feature가 소유하고 자기 entity store만 구독한다. `ProductCard`는 두 feature의 Public API를 가져와 조합한다.

`ProductGrid`와 `ProductGridSkeleton`도 같은 widget 슬라이스로 옮겼다. `ProductGrid`를 별도 `widgets/product-grid`로 만들면 같은 레이어의 `widgets/product-card`를 직접 참조하게 된다. 현재 의존성 규칙은 widget 간 직접 참조를 금지하므로, 카드 목록과 카드의 결합도가 높은 지금은 한 슬라이스가 소유하는 편이 맞았다.

### 구조만 바꾸고 toggle 동작은 남긴 이유

버튼 이름과 장기적인 책임은 "추가"지만 현재 store API는 `toggle`이다. 향후 장바구니·위시리스트 페이지가 생기면 삭제·수량 수정은 그 화면에서 제공하고, 상품 카드에서는 추가만 담당하게 할 생각이다.

그렇다고 이번 단계에서 `toggle`을 `add`·`remove`로 나누면 FSD 구조 변경과 사용자 동작 변경이 한 diff에 섞인다. 6주차의 기준은 기존 동작 보존이므로, 지금은 두 feature가 기존 `toggle`을 임시로 호출하도록 했다. persist 키(`cart`·`wishlist`)와 `aria-pressed` 동작도 그대로 유지했다.

이 임시 상태는 코드 주석과 RFC에 함께 남겼다. 장바구니·위시리스트 페이지를 만들 때 store API를 분리하면, `AddCartButton`과 `WishlistButton`은 추가 API만 사용하고 삭제·수정 행위는 각 페이지의 feature로 옮긴다.

### 돌아보면

처음 `features/product-card`를 선택할 때는 "현재 카드가 모든 소비처에서 행위와 함께 쓰이는가"를 기준으로 봤다. 그 사실은 맞았지만, **같이 쓰인다는 것과 하나의 feature라는 것은 달랐다.** 카드가 찜과 담기를 함께 보여주는 이유는 두 행위가 하나라서가 아니라, 카드가 여러 행위를 조합하는 UI 블록이기 때문이다.

소비처 개수만 보면 entity의 불필요한 추상화는 피할 수 있었지만, 레이어 책임을 판단하려면 "이 코드는 어떤 사용자 행위를 대표하는가"와 "몇 개의 하위 슬라이스를 조합하는가"까지 함께 봐야 했다. 이번 이동은 파일을 위 레이어로 올린 것이 아니라, 섞여 있던 두 feature를 먼저 식별하고 그 조합 위치를 widget으로 정한 결과다.

## 7. 파일명 규칙을 한 번 더 고친 이유

3번에서 "컴포넌트는 PascalCase, 그 외는 전부 kebab-case"로 정했는데, 적용해 보니 훅이 걸렸다. `useProductFilters`라는 훅이 `use-product-filters.ts`에 있으면 파일명과 내보내는 이름이 어긋난다. 훅은 이름으로 찾는 일이 잦아서 이 어긋남이 계속 거슬렸다.

세 갈래로 다시 나눴다.

| 종류              | 규칙         | 예                 |
| ----------------- | ------------ | ------------------ |
| 컴포넌트          | `PascalCase` | `RootProvider.tsx` |
| 훅                | `camelCase`  | `usePostLike.ts`   |
| 유틸 / API / 설정 | `kebab-case` | `post-like.api.ts` |

이미 바꿨던 훅 파일 3개(`useDebouncedCallback`·`usePagination`·`useProductFilters`)를 되돌렸다. 한 주에 같은 규칙을 두 번 고친 셈이라 개운하지는 않지만, 실제로 파일을 만들어 보기 전에는 "그 외 전부"에 훅이 섞이는 게 어떤 느낌인지 몰랐다.

## 8. widget을 몇 개 만들 것인가

### 고민

`widgets`는 레이어 목록에 있으니 뭔가는 넣어야 할 것 같았다. 처음 후보는 셋이었다 — `Header`, `ProductGrid`, `CategorySection`. 셋 다 "여러 곳에서 쓰이는 덩어리 UI"로 보였다. 이후 `ProductCard`의 행위를 분리하면서 카드 자체도 후보에 다시 들어왔다.

### 기준

프로세스 문서에 적어 둔 확인 포인트를 그대로 썼다. **여러 하위 슬라이스를 조합하는 독립 UI 블록일 때만 widget으로 만들고, UI 하나를 감싸는 중간 폴더로는 만들지 않는다.** "여러 곳에서 쓰인다"가 아니라 "여러 슬라이스를 조합한다"가 기준이다.

이 기준으로 처음에는 `Header`만 남겼지만, `ProductCardActions`를 두 feature로 분리한 뒤 결과가 달라졌다.

| 후보              | 조합하는 슬라이스                    | 판정                                            |
| ----------------- | ------------------------------------ | ----------------------------------------------- |
| `Header`          | `entities/cart`, `entities/wishlist` | widget                                          |
| `ProductCard`     | `add-to-cart`, `add-to-wishlist`     | widget                                          |
| `ProductGrid`     | 같은 `product-card`의 카드           | 독립 widget이 아닌 `product-card` 슬라이스 내부 |
| `CategorySection` | `entities/product`의 타입 하나       | 미달 → 소비처인 `_pages/home/ui`                |

### 결정

최종적으로 `widgets/header`와 `widgets/product-card` 두 슬라이스를 만들었다.

`ProductGrid`가 하는 일은 `ProductCard`를 `map`으로 뿌리는 게 전부라 별도 widget 슬라이스로 만들지 않았다. 같은 `widgets` 레이어의 `product-card`를 참조할 수도 없으므로 `ProductGridSkeleton`과 함께 `widgets/product-card` 내부에 뒀다.

`CategorySection`은 도메인 표현으로 보면 `entities/product/ui`도 맞았다. 다만 소비처가 홈 하나뿐이라, "재사용 근거가 생기기 전에는 소비하는 화면이 갖는다"는 이번 주의 다른 판단들(4번 미사용 자산, 6번 카드)과 같은 기준을 적용했다.

### 돌아보면

레이어가 정의돼 있으면 그 칸을 채우고 싶어진다. 처음 `ProductGrid`를 widget으로 만들 뻔한 것도, 반대로 나중에 `ProductCard`를 feature에 계속 두려 한 것도 파일 이름과 현재 위치에 끌린 경우였다. 판단이 갈릴 때 "여러 하위 슬라이스를 조합하는가"라는 정의로 돌아가니 `ProductCard`는 widget이고, `ProductGrid`는 그 widget 슬라이스의 내부 UI라는 차이를 설명할 수 있었다.

## 9. 조회 계층(query factory)을 어디에 둘 것인가

### 고민

`homeQueries`·`productQueries` 같은 queryOptions 묶음을 어디에 둘지가 6단계 내내 애매했다. 후보는 셋이었다 — `entities/*/api`, 조회하는 페이지의 `api`, 그리고 `shared/api`.

처음에는 `shared/api`를 골랐다. 근거는 "전체에서 공유하는 queryKey는 shared에 두는 게 일반적"이라는 것이었다. 컨트롤러(도메인)별로 `shared/api/home`·`shared/api/product`를 나누면 API 계층이 한자리에 모여 보기도 좋았다.

### 다시 본 이유

옮기고 나니 `eslint-disable`이 세 개 붙었다.

| 파일                          | 끈 규칙                   | 방향                |
| ----------------------------- | ------------------------- | ------------------- |
| `shared/api/product/model.ts` | `boundaries/dependencies` | `shared → entities` |
| `shared/api/home/model.ts`    | 〃                        | `shared → entities` |
| `shared/api/product/api.ts`   | 〃                        | `shared → _pages`   |

세 번째가 특히 걸렸다. `getProductList`가 `_pages/product-list/model/search-params`의 serializer를 쓰느라 **최하위 레이어가 최상위 레이어를 참조**하고 있었다. 모듈 그래프로 보면 `_pages/product-list → shared/api/product → _pages/product-list`로 순환이었다.

근거로 삼았던 "전체에서 공유"도 실제로는 성립하지 않았다. 소비처를 세어 보니 `homeQueries`는 `_pages/home`에서만, `productQueries`는 `_pages/product-list`에서만 쓰이고 있었다. 두 페이지가 함께 쓰는 쿼리는 0개였다.

무엇보다 `.claude/rules/fsd-verification.md`에 이번 주에 직접 적어 둔 문장과 어긋났다 — _"'여러 곳에서 쓰니까 shared'는 안 됨"_. `shared`의 기준은 재사용 빈도가 아니라 도메인 무지인데, `Product[]`를 돌려주고 `/api/products`를 아는 코드는 그 기준에 맞지 않았다. `entities`도 이미 모든 페이지가 참조할 수 있는 층이라, 재사용성만으로는 `shared`로 내려갈 이유가 되지 않았다.

### 결정

두 쿼리를 서로 다른 곳으로 나눴다.

| 대상                              | 이동 위치              | 이유                                                 |
| --------------------------------- | ---------------------- | ---------------------------------------------------- |
| `productQueries`                  | `entities/product/api` | `Product[]`를 읽어오는 상품 도메인의 read API        |
| `homeQueries`                     | `_pages/home/api`      | 배너·카테고리·인기·신상품을 조립한 홈 화면 전용 응답 |
| `query-client`·`get-api-base-url` | `shared/api` 유지      | 도메인 지식이 없는 배선·유틸                         |

`homeQueries`를 페이지로 내린 근거는 이미 코드 주석에 써 둔 원칙이었다 — _"응답 봉투는 도메인이 아니라 이 화면의 조회 계약이라 조회하는 쪽이 소유한다."_ 원칙은 적어 두고 배치는 반대로 하고 있었던 셈이다.

반대로 상품 목록 응답은 `entities`에 뒀다. 페이지네이션 메타(`totalCount`·`page`·`pageSize`)는 특정 화면의 조립이 아니라 목록 엔드포인트 자체의 계약이라고 봤다.

이 이동으로 `eslint-disable` 세 개가 모두 사라졌다.

### 곁가지 — nuqs serializer를 버릴 뻔한 것

순환을 끊으려고 처음에는 `getProductList`가 `URLSearchParams`로 직접 질의 문자열을 만들게 했다. `_pages`의 serializer를 참조하지 않으니 방향 문제는 풀렸다.

그런데 이렇게 하면 RFC의 보존 대상에 적어 둔 것이 깨진다 — _"nuqs parser의 단일 정의. 파서와 화면 옵션 목록이 갈라지면 조건이 어긋난다."_ 기존 `serializeProductListQuery`는 `createSerializer(parsers)`로 parser에서 직접 만들어졌기 때문에 URL 인코딩과 API 요청 형식이 같은 정의에서 나온다는 보장이 있었다. 직접 만든 `String(value)` 루프에는 그 보장이 없다. 지금은 값이 전부 문자열·숫자라 결과가 같지만, 배열이나 커스텀 인코딩 parser가 하나 추가되면 조용히 어긋난다.

방향을 반대로 잡으니 둘 다 됐다. **조회 파라미터 스키마 자체를 `entities`가 소유하고, 화면이 그 위에 자기 URL 동작만 얹는다.**

```text
entities/product/api/query-schema.ts
  → 어떤 파라미터가 있는지, 허용값(카테고리·정렬), 인코딩(parser), 요청 직렬화

_pages/product-list/model/search-params.ts
  → history: 'push' 동작, 한글 라벨

PRODUCT_PAGE_SIZE=12
  → entities/product/api/model.ts
  → 호출 타입에서는 제외하고 API 직렬화 직전에 고정값으로 추가
```

```ts
// 화면은 entities의 parser에 자기 히스토리 동작만 얹는다
q: productListQueryParsers.q.withOptions(PUSH_HISTORY),
```

parser 본체가 한 벌이라 URL과 요청이 갈라질 수 없고, 참조는 `_pages → entities` 하향 한 방향이다.

부수 효과로 `SORT_OPTIONS`를 `Record<ProductSort, string>` 라벨맵에서 생성하도록 바꿨다. 이전 `satisfies` 배열은 정렬 옵션을 하나 빠뜨려도 타입 검사를 통과했는데, 이제 라벨 누락이 컴파일 에러가 된다.

### 판단 근거

`eslint-disable`을 몇 개까지 감수할 수 있는가로 판단하지 않으려고 했다. 규칙을 끄면 검사는 통과하지만, 그 disable이 "의도한 예외"인지 "배치가 틀렸다는 신호"인지는 구분되지 않는다. 이번 경우 세 개가 전부 한 디렉터리(`shared/api/`)에 몰려 있었던 게 후자라는 쪽에 무게를 실었다.

"어디에 두면 재사용하기 좋은가"가 아니라 "이 코드가 무엇을 아는가"로 기준을 바꾸니 갈림길이 정리됐다. 상품 목록 조회는 상품 도메인을 알고, 홈 응답은 홈 화면의 구성을 안다.

### 돌아보면

`shared`를 고른 최초 근거가 TanStack Query 일반 관례("공유 쿼리는 공용 폴더에")였는데, 그 관례는 종류별 폴더 구조에서 나온 것이라 `shared`가 "화면 전용이 아닌 것"을 뜻했다. FSD의 `shared`는 정의가 더 좁아서 같은 단어에 다른 뜻이 들어가 있었다.

규칙 문서를 직접 써 놓고도 배치할 때 그 기준을 적용하지 않은 게 걸린다. 검증 규칙을 따로 만든 이유가 이런 걸 잡으려던 것이었는데, 만들어 두는 것과 판단 시점에 꺼내 보는 것은 다른 일이었다.

## 10. 구조를 옮기고 나서야 드러난 것

두 가지가 이번 이동 중에 발견됐다. 둘 다 구조 변경 자체의 결함은 아니고, **파일이 움직이는데 그걸 가리키던 설정과 참조가 따라오지 않은** 경우다.

### `pnpm test`가 0개를 세고 있었다

`vitest.config.ts`의 `include`가 `src/**/*.test.ts`인데, app 디렉터리를 루트로 옮기면서 Route Handler 테스트 3개가 `app/` 아래로 갔다. 0단계 기준선이 36/36이었는데 실제로는 아무것도 실행되지 않는 상태였고, RFC에서 `pnpm test`를 아직 재실행하지 않아 드러나지 않았다.

`include`에 `app/**/*.test.ts`를 더하고 `@app` 별칭을 `tsconfig`와 맞춰 36/36으로 돌아왔다.

기준선을 "숫자가 같은가"로만 보면 이런 건 안 잡힌다. 0개를 실행해도 실패는 아니기 때문이다. 다음부터는 통과 개수뿐 아니라 **수집된 파일 수**도 함께 봐야겠다.

### "미사용"이라고 판단한 자산이 사용 중이었다

`src/examples/week-05-layout/` 네 파일을 미사용으로 보고 삭제했는데, 그중 `week-05-layout.css`는 두 페이지가 import하고 있었다. 나머지 셋(예시 컴포넌트 2개·README)만 참조가 0이었다. 디렉터리 단위로 묶어서 판단하고 파일별로 확인하지 않은 게 원인이다.

4번에서 "소비처가 0인 코드는 삭제한다"고 정했는데, 그 규칙을 적용하려면 **삭제 단위마다 소비처를 세야** 한다는 걸 빠뜨렸다.

삭제 커밋에서 CSS만 복구했고, 이 참에 자리도 옮겼다. 처음에는 `_app/styles`로 보냈는데 `_pages → _app`은 상향이라 `boundaries`가 막았다. 두 페이지가 참조하는 레이아웃 스타일이므로 `shared/styles/layout.css`로 내렸다. 클래스명도 `week05-section`에서 `layout-section`으로 바꿨다 — 주차 번호가 남아 있을 이유가 없었다.

## 11. 구조 변경 후 남은 오류·테스트 책임을 어떻게 닫을 것인가

### mock Route Handler가 화면 응답 타입을 가져와도 되는가

홈 Route Handler가 `_pages/home/api/model`의 응답 타입을 가져오고 있었다. 화면 API의 adapter로 보면 허용할 수도 있지만, 이 프로젝트의 `app/api`는 fixture와 오류 시나리오를 제공하는 독립된 mock 백엔드에 가깝다. 백엔드 역할의 코드가 화면 내부 계약에 의존하면 라우트 검사 범위 밖에서 `app/api → _pages` 결합이 생긴다.

그래서 `HomeApiResponse`는 `app/api/_types.ts`가 소유하도록 분리했다. 상품과 카테고리의 기본 도메인 타입은 `entities/product`에서 재사용하되, 홈 화면이 이를 어떻게 묶어 응답하는지는 mock API와 화면이 각자 자기 경계에서 명시한다. 구조가 우연히 같은 것과 소유권이 같은 것은 구분하기로 했다.

### 홈 Error Boundary의 재시도는 무엇을 reset해야 하는가

App Router의 `reset()`만 호출하면 라우트 세그먼트는 다시 렌더되지만 TanStack Query의 오류 상태는 초기화되지 않는다. `useSuspenseQuery`는 초기화되지 않은 오류를 다시 던지므로 새 요청 자체가 발생하지 않았다.

`RootErrorFallback`에서 `useQueryErrorResetBoundary()`의 reset을 먼저 호출하고 App Router reset을 이어서 호출하도록 결정했다.

런타임 확인은 `?scenario=error`를 홈 API에 붙이는 방식으로는 되지 않았다. 홈 조회는 서버 컴포넌트의 prefetch라 실패가 서버 프로세스 안에서 일어나고, TanStack Query의 기본 `retry: 3`이 단발성 500 하나는 내부에서 조용히 재시도해 버려 에러 화면 자체가 뜨지 않았다. 재시도 횟수를 맞춰 4회 실패시켜도 dev 서버의 라우트 워밍업 트래픽이 같은 카운터를 먼저 소모해 값이 흔들렸다.

결국 파일 존재 여부로 실패를 강제하는 임시 플래그(`/tmp/r2-force-fail`)로 바꿨다. 요청 횟수를 세지 않고 "플래그가 있으면 무조건 실패"로 만들어 워밍업 트래픽과 무관하게 결정적으로 재현했다. E2E가 플래그를 만들고 → 에러 화면을 확인하고 → 플래그를 지운 뒤 재시도 버튼을 클릭해 → 새 요청이 실제로 나가 정상 화면으로 복구되는지 확인했다. 캐시된 오류를 재사용했다면 플래그를 지워도 에러 화면에 머물렀을 것이다. Chromium·WebKit에서 각 통과했고 Chromium은 `--repeat-each=3`으로 재확인했다. 검증에 쓴 코드는 모두 되돌렸다.

### 상품 목록 오류를 HTTP status로 나눌 것인가

4xx는 인라인, 5xx는 전체 Error Boundary로 보내는 방식도 검토했다. 하지만 상품 목록은 실패하더라도 검색·필터를 남겨야 사용자가 조건을 바꾸거나 같은 자리에서 재시도할 수 있다. status보다 **현재 화면에서 복구할 수 있는가**가 경계를 더 잘 설명한다고 판단했다.

공통 `ApiError`가 HTTP status와 네트워크 오류 종류를 보존하고, 상품 query의 `throwOnError`는 다음처럼 동작한다.

- HTTP·네트워크처럼 예상 가능한 조회 실패: 인라인 오류와 `refetch()`로 복구
- 응답 파싱 실패처럼 API 계약 밖의 예외: 루트 Error Boundary로 전파

status는 관측과 향후 정책 변경을 위해 잃지 않되, 지금은 4xx·5xx를 서로 다른 화면으로 나누지 않는다. 변환과 분기 자체는 Vitest로 확인하고, 필터 유지·전체 새로고침 없는 복구는 E2E에 남긴다.

### Zustand 검증을 어디까지 E2E로 둘 것인가

기존 E2E는 화면 흐름뿐 아니라 store의 손상값 복구와 migration까지 브라우저에서 확인했다. 이 동작은 DOM이나 History API가 필요하지 않아 실행 비용이 큰 계층에 둘 이유가 없었다.

`createCollectionStore`의 추가·제거, 중복·빈 상태, `ids.includes`·`ids.length`·action selector, persist 손상값과 이전 버전 migration을 Vitest로 옮겼다. E2E에서는 내부 복구 테스트 2개를 제거하고 홈·목록 사이 동기화와 새로고침 후 복원처럼 실제 브라우저 경계만 남겼다.

store 공개 방식은 기존 결정대로 유지한다. `useCartStore`·`useWishlistStore`를 공개하되 소비처가 selector로 필요한 상태와 action만 선택한다. 단순 전달만 하는 목적별 wrapper hook은 추가하지 않는다.

- WebKit debounce 이탈 플레이키(`debounce 대기 중 페이지를 떠나면…`)를 격리 재현했더니 이전 관찰(단독 3/3)보다 실패가 잦았다(`--repeat-each=3` 2/3, `--repeat-each=5` 2/5). 기본 병렬 스위트는 4회 모두 36/36으로 깨끗해 V2 판정에는 반영하지 않았지만, 격리 시 실패율이 오른 이유는 아직 설명하지 못한다. 홈의 서버 prefetch 지연(mock 약 500ms)이 검색 debounce(300ms)보다 길어 두 네비게이션이 경합할 수 있다는 가설만 세워뒀다. 이번 주 범위 밖이라 원인 조사는 다음으로 미룬다.

## 12. 잘못된 URL 파라미터를 clamp만 할 것인가, URL도 다시 쓸 것인가

### 고민

M9(`/products?page=0` 직접 진입) 수동 검증 중, "1페이지 데이터가 정상 노출된다"는 기대 동작은 만족했지만 주소창은 `?page=0`으로 그대로 남는 걸 발견했다. `entities/product/api/query-schema.ts`의 `parseAsPositiveInteger`가 `0`·음수를 파싱 시점에 `1`로 clamp하지만, 이건 "읽을 때 안전한 값으로 해석"하는 것이지 "URL을 고쳐 쓰는" 로직이 아니다. `setCurrentPage` 같은 URL 쓰기 함수는 사용자가 실제로 페이지네이션을 조작할 때만 호출되고, 마운트 시 자동으로 URL을 정정하는 effect는 없다.

같은 패턴이 `category`·`sort`에도 있다 — 허용 밖 값이 와도 파싱 시점에 기본값으로 clamp될 뿐, `setCategory`·`setSort`를 자동 호출해 URL을 되쓰는 코드는 어디에도 없다. 즉 `page`만의 문제가 아니라 조회 파라미터 3종 전체가 "화면에 보이는 값은 정정하되 주소창 문자열은 그대로 둔다"는 동일한 설계다.

### 검토한 선택지

1. **지금처럼 clamp만 하고 URL은 그대로 둔다.**
   - M9의 기대 동작("1페이지 데이터 노출, 에러 UI 미노출")은 이미 충족한다.
   - 잘못된 값이 담긴 URL을 사용자가 북마크·공유하면 그 문자열이 계속 남는다.
2. **마운트 시 한 번, clamp된 값으로 `history: 'replace'` URL을 정정한다.**
   - 주소창이 항상 실제로 반영되는 값과 일치해 북마크·공유 URL이 깔끔해진다.
   - `page` 하나만 넣으면 `category`·`sort`와 동작이 갈려 더 헷갈리므로 세 파라미터 모두에 동시에 적용해야 일관적이다.
   - 이건 버그 수정이 아니라 **새 동작 추가**라, RFC가 이번 주 범위 밖으로 명시한 "기능 추가·UI 변경"과 겹친다.

### 결정

이번 주에는 적용하지 않는다. M9은 clamp된 값으로 화면이 정상 렌더되는 현재 상태를 그대로 통과시키고, URL 재작성은 "개선 과제"로 남긴다. 실제로 넣을지는 멘토님께 필요성을 먼저 여쭤보고 결정한다.

### 판단 근거

RFC 156~165행(이번 주에 하지 않을 것)이 "기능 추가·UI 변경"을 이번 주 범위 밖으로 이미 못 박아 뒀다 — "기능이 섞이면 '동작 보존'을 검증할 기준선이 무의미해진다"는 이유가 이 경우에도 그대로 적용된다. URL 정정은 기존 동작을 보존하는 게 아니라 새로 정의하는 동작이라, 지금 끼워 넣으면 이번 주 리팩토링의 검증 기준 자체가 흔들린다.

또한 `page`만 먼저 고치면 "왜 `page`는 URL이 정정되는데 `category`·`sort`는 안 되지?"라는 새로운 불일치가 생긴다. 셋을 함께 고치는 게 맞는 범위인데, 그러면 변경 폭이 이번 M9 하나의 수동 검증 항목보다 커진다 — 그 판단은 이번 리팩토링 완료 후, 별도 요구사항으로 다루는 게 맞다고 봤다.

## 아직 확실하지 않은 것 / 다음에 볼 것

- 현재 `@x` 설정은 교차 참조가 전용 경로를 통하는 것까지 검사한다. `@x/<consumer>`의 파일명과 실제 소비 entity가 일치하는지까지 자동 검증할 필요가 생기면 커스텀 규칙이나 별도 아키텍처 검사 도구를 검토한다.
- **전환 중에는 lint가 옛 폴더 의존을 잡지 못한다.** `boundaries/include`가 `src/{_app,_pages,widgets,features,entities,shared,app}/**/*`라, `src/components`·`src/service`·`src/store`는 element가 없어 "unknown"이 아니라 "ignored"로 처리된다. 1·2단계에서 `_pages → @/service` 같은 import가 실제로 통과하는 걸 확인했다. 전환이 끝나 옛 폴더가 사라지면 자연히 해소되지만, 그전까지 "lint 통과 = 잔여 참조 없음"으로 읽으면 안 된다. 각 단계에서 grep으로 따로 확인하고 있다.
- Next.js 라우터는 전환 후 루트 `app/`에 있다. 피드백 반영 전 FSD 설정은 여전히 `src/app`을 가리켜 실제 라우트가 검사 범위 밖이었으나, `files`·`boundaries/include`·`next-app` pattern을 현재 트리에 맞게 수정했다.
- `app/api`는 일반 라우트 조합과 별도 element로 분리했다. mock 백엔드는 같은 `app/api` 내부와 `entities`·`shared`만 참조할 수 있고, 과거에 수동으로 발견한 `app/api → _pages` 결합은 이제 `boundaries/dependencies`가 차단한다.
- 9번에서 `entities/product`가 `nuqs/server`에 의존하게 됐다. `createSerializer`는 React 없이 도는 순수 직렬화라 지금은 문제가 없다고 봤지만, entity가 URL 라이브러리를 아는 게 맞는지는 계속 걸린다. 조회 파라미터를 나르는 다른 수단(직접 정의한 인코더 등)이 필요해지면 다시 본다.
- 9번의 배치로 RFC 애매한 파일 결정표의 "상품 목록 queryOptions"와 "`searchParams.ts`" 두 행이 함께 정해졌다. 후자는 후보 A·B 중 하나가 아니라 **조회 계약은 `entities`, URL 동작은 화면**으로 쪼갠 결과라, 표에 그대로 옮기려면 선택지를 다시 써야 한다.

---

_이 문서는 제가 이번 주 개발하며 내린 판단과 그 이유를 정리한 것입니다. 각 갈림길에서 후보를 정리하고 현재 코드의 import 관계를 대조해 제약(예: `_pages`가 `_app`을 참조할 수 없다는 점, `ProductCard`의 실제 소비처가 하나뿐이라는 점)을 확인한 것은 AI(Claude·Codex)가 했고, 어떤 방식을 택할지의 최종 결정과 문서 서술은 제가 했습니다. 6번은 작업 트리에서 시도했다가 커밋 전에 철회한 `entities/product/ui`, 실제 커밋의 `features/product-card`, 최종 `widgets/product-card`로 판단이 바뀐 과정을 구분해 남겼습니다. 소비처 실측만으로는 feature의 행위 경계를 설명할 수 없다는 반론을 검토한 뒤, 찜·담기를 별도 feature로 분리하고 widget에서 조합하는 구조로 최종 결정했습니다._

_9번도 `shared/api` → `entities/product/api`·`_pages/home/api`로 판단이 바뀐 과정을 남겼습니다. `shared`가 적절하지 않다는 반론(도메인 무지라는 기준, 소비처 실측, `shared → _pages` 순환)을 제기하고 이동 후 질의 문자열이 이전과 바이트 단위로 같은지 대조한 것은 AI(Claude)가 했고, 옮길지 이번 주에는 근거만 고쳐 둘지를 고르고 nuqs serializer를 유지해야 한다고 판단한 것은 제가 했습니다. 10번의 두 건도 AI가 검사 중 발견해 보고한 것입니다._
