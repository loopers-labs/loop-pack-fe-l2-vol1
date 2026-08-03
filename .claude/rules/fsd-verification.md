# FSD 구조 검증

레이어·슬라이스 배치, 의존 방향, Public API, `entities/@x` 사용을 정성적으로 점검한다.

ESLint `boundaries/dependencies`는 명시적인 import 위반을 검사한다. 이 규칙은 자동 검사만으로 판단할 수 없는 소유권과 공개 범위를 확인한다.

## 1. 실제 구조부터 확인

표준 FSD 이름을 기계적으로 적용하지 않고 현재 저장소의 구조와 설정을 먼저 읽는다.

- Next.js 라우터: root `app/`
- FSD App 레이어: `src/_app`
- FSD Pages 레이어: `src/_pages`
- 경로 별칭: `tsconfig.json`
- 자동 경계 정책: `eslint/fsd.config.mjs`

```bash
rg --files src app | sort
```

## 2. 파일 배치

| 레이어     | 책임                                                    | 현재 예시                                                |
| ---------- | ------------------------------------------------------- | -------------------------------------------------------- |
| `_app`     | 앱 초기화, 전역 Provider·스타일·루트 fallback           | `_app/providers`, `_app/styles`, `_app/ui`               |
| `_pages`   | 라우트 단위 조합과 페이지 고유 URL·화면 상태            | `_pages/product-list/model/search-params.ts`             |
| `widgets`  | 여러 하위 슬라이스를 조합하는 독립 UI 블록              | `widgets/header`, `widgets/product-card`                 |
| `features` | 사용자가 수행하는 비즈니스 행위                         | `features/add-to-cart`, `features/add-to-wishlist`       |
| `entities` | 도메인 타입·상태와 도메인 자체의 표현                   | `entities/product`, `entities/cart`, `entities/wishlist` |
| `shared`   | 도메인에 종속되지 않은 UI·API 기반·유틸리티와 범용 계약 | `shared/ui`, `shared/lib`, `shared/api`                  |

### 판단 질문

1. 앱 전체 초기화나 전역 설정인가? → `_app`
2. 라우트 조합이나 특정 페이지의 URL·화면 상태인가? → `_pages`
3. 여러 feature/entity를 조합하는 독립 UI 블록인가? → `widgets`
4. 사용자의 비즈니스 행위인가? → `features`
5. 도메인 데이터·상태·도메인 자체의 표현인가? → `entities`
6. 도메인 지식 없이 여러 상위 레이어가 사용할 수 있는 계약인가? → `shared`

현재 소비처 수만으로 `shared` 여부를 결정하지 않는다. 소비처가 하나여도 도메인과 상태 저장 방식에 종속되지 않은 controlled 계약이라면 `shared`가 될 수 있다. 반대로 여러 곳에서 사용해도 상품·회원·장바구니 정책을 포함하면 해당 entity나 feature의 소유권을 검토한다.

## 3. 의존 방향과 조합 위치

레이어 순서는 다음과 같다.

```text
_app → _pages → widgets → features → entities → shared
```

- 상위 레이어에서 하위 레이어만 참조한다.
- 같은 레이어의 다른 슬라이스를 직접 참조하지 않는다.
- 여러 슬라이스의 협력은 공통 상위 레이어에서 조합한다.
- `src/app` 라우팅 파일은 필요한 FSD 레이어의 Public API를 참조할 수 있다.

예를 들어 상품 목록의 URL 상태와 범용 페이지네이션은 다음 방향이 정상이다.

```text
_pages/product-list/model/useProductPagination
  → shared/lib/usePagination
```

`shared`가 `_pages`의 parser를 import하지 않는다. 상위 adapter가 하위 범용 로직에 `currentPage`와 `onPageChange`를 주입한다.

### 상향 의존을 발견했을 때

`eslint-disable`부터 추가하지 않는다.

1. 파일의 도메인 소유권을 다시 확인한다.
2. 여러 슬라이스의 조합을 공통 상위 레이어로 이동한다.
3. 하위 로직을 controlled 입력 또는 콜백 기반 계약으로 바꿀 수 있는지 검토한다.
4. 실제 프레임워크 제약으로 제거할 수 없는 경우에만 최소 범위의 예외를 사용한다.
5. 예외의 이유·영향·대안을 주석과 RFC 또는 결정 문서에 기록한다.

## 4. Public API

각 슬라이스는 루트 `index.ts`에서 외부에 보장할 계약만 named export한다.

- 외부 소비자가 사용하는 타입·상태·UI·행위는 공개할 수 있다.
- 내부 훅·헬퍼·세부 UI는 공개하지 않는다.
- `export *`로 모든 구현을 다시 내보내지 않는다.
- 슬라이스 외부에서는 `ui/`, `model/`, `api/` 내부 경로를 우회하지 않고 Public API를 사용한다.

```typescript
// ✅ 필요한 타입만 공개
export type { Product, ProductSort } from '@/entities/product/model/product'

// ✅ feature가 제공하는 사용자 행위 UI 공개
export { AddCartButton } from '@/features/add-to-cart/ui/AddCartButton'

// ✅ widget이 외부에 제공하는 UI 공개
export { ProductGrid } from '@/widgets/product-card/ui/ProductGrid'

// ❌ 의도하지 않은 구현까지 전부 공개
export * from '@/widgets/product-card/ui/ProductGrid'
```

Public API는 편의를 위한 배럴 파일이 아니라 슬라이스의 외부 계약이다. UI라는 이유만으로 비공개 처리하지 않고 실제 외부 소비 여부를 기준으로 결정한다.

## 5. Entity 교차 참조

다른 entity의 타입이 꼭 필요할 때만 제공 entity의 `@x/<consumer>` 경로를 사용한다.

- 소비 entity별 파일로 공개 범위를 제한한다.
- 타입만 named export한다.
- UI, store, API 함수 같은 런타임 구현을 `@x`로 공개하지 않는다.
- `@x`가 늘어나면 타입 소유권 또는 조합 위치가 잘못된 것은 아닌지 먼저 검토한다.
- `@x/<consumer>` 이름과 실제 소비 entity가 일치하는지 확인한다.

## 6. 중복 소유와 도메인 누수

다음을 검색하고 같은 책임이 여러 슬라이스에 중복되지 않았는지 확인한다.

```bash
rg -n "^(export )?(type|interface) [A-Z]" src
rg -n "create\\(|createStore|queryOptions|mutationOptions" src
rg -n "eslint-disable.*boundaries" src
rg -n "export \\*" src
```

검색 결과는 이름이 같다는 이유만으로 위반으로 판정하지 않는다. 각 선언의 도메인 소유자와 책임이 실제로 중복되는지 코드와 소비처를 함께 확인한다.

`shared`에서는 상품·회원·장바구니 같은 특정 도메인 정책, 화면 전용 문구, 페이지 URL parser가 새어 들어오지 않았는지 확인한다.

## 7. 검증 체크리스트

PR 또는 self-review 시 확인한다.

- [ ] 실제 폴더 구조·경로 별칭·라우팅 디렉터리를 먼저 확인했는가?
- [ ] 새 파일의 레이어·슬라이스·세그먼트 배치에 근거가 있는가?
- [ ] 상위→하위 의존 방향을 지키는가?
- [ ] 같은 레이어의 다른 슬라이스를 직접 참조하지 않는가?
- [ ] 여러 슬라이스의 조합이 공통 상위 레이어에 있는가?
- [ ] 슬라이스 외부 import가 Public API를 통하는가?
- [ ] Public API가 필요한 계약만 명시적으로 공개하는가?
- [ ] `entities/@x`가 소비자별 타입 공개로 제한되는가?
- [ ] `shared`에 도메인 정책이나 페이지 전용 상태가 포함되지 않았는가?
- [ ] RFC·결정 문서의 구조와 실제 코드가 일치하는가?
- [ ] Client Component 경계가 구조 변경으로 불필요하게 상위로 올라가지 않았는가?
- [ ] `pnpm lint`가 통과하는가?
- [ ] `pnpm exec tsc --noEmit`이 통과하는가?

자동 검사 통과만으로 배치가 적절하다고 판단하지 않는다. 위반과 설계상 선택을 구분하고, 판단 근거와 남은 위험을 함께 기록한다.
