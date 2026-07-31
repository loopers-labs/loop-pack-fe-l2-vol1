# RFC: Week 06 — 커머스 FSD 마이그레이션

브랜치 `feat/week-06` · 상태: 완료(Phase 0~8 + 후속 정리) · 작성 2026-07-29 / 갱신 2026-07-31

5주차 커머스의 동작을 그대로 둔 채, 파일 종류별 폴더(`components`·`hooks`·`queries`·`services`·`stores`·`types`)를 FSD 레이어로 재배치하고 의존 방향을 ESLint로 강제했다.

**이 문서의 구성** — §1~§8 본문은 **현재 설계와 그 근거**만 다룬다(반복해서 참고하는 부분). 기준선 실측·Phase 실행 기록·실패 재현·리뷰 이력처럼 **한 번 읽으면 되는 프로젝트 기록**은 부록 A~D로 분리했다.

**결과**

- `src/` 최상위 = FSD 레이어 5개 + Next 라우팅 `app/` → **6개**로 수렴(파일 종류별 7개 디렉터리 소멸)
- 라우팅 파일은 1줄 재수출로 축소, 비즈니스 슬라이스 Public API **index 9개**
- 위시리스트 제거 반경 = **폴더 2개 삭제 + 파일 2개 수정**, 예측과 실측 일치(§7)
- 매 Phase `pnpm check`(test·lint·typecheck·build) 통과

**빨리 훑을 때** — 설계 결정은 §2.6(애매한 파일)·§4.3(Public API)·§7(삭제 시나리오), 경계 설계는 §2.4(의존 강제)·§2.7(mock)·§5.3(에러).

---

## 1. R — Requirements

**보존할 동작** — 홈(배너·카테고리·인기/신상품, 4상태) / 상품 목록(검색 디바운스·카테고리·정렬·페이지네이션, URL 공유·새로고침·뒤로가기) / 장바구니·위시리스트(토글·헤더 카운트·이동 간 유지). 상태 SoT 4종(서버·URL·전역·로컬)은 폴더 이동과 무관하게 유지한다.

**비기능** — 매 Phase 종료 시 `pnpm check` 통과 후 커밋(lint-staged 통과, `--no-verify` 금지). 구조 변경 커밋과 동작 추가 커밋(에러 경계)을 섞지 않는다.

**기준선** — 폴더를 옮기기 전에 위 동작 12항목을 직접 확인해 고정했다(실측표는 [부록 A](#부록-a-동작-기준선-실측)). 여기서 **이번 설계의 출발점 2가지**가 나왔다.

1. `error.tsx`·Error Boundary가 0개 — 렌더링 오류를 잡을 경계가 없다.
2. 서비스 레이어가 mock의 `scenario`를 전달하지 않아 **UI에서 에러 상태를 재현할 방법이 없다** — 에러 UI가 검증된 적 없는 상태.

**이번 주에 하지 않을 것**

| 항목                         | 이유                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| `src/app/api`(mock) FSD 전환 | 프론트가 아닌 "서버" 역할. 경계만 §2.7에 정의                     |
| select/dialog 데모 전환      | 3~4주차 데모로 커머스 도메인이 아님. import 경로만 갱신           |
| `week05-*` CSS 클래스 모듈화 | 문자열 결합이라 import 경계로 안 잡히는 별개 주제(§2.4 적용 범위) |
| Zustand persist              | 새로고침 초기화는 의도된 설계. 기능 변경이므로 범위 밖            |

> 데모 전용 코드 흡수와 `src/examples` 삭제는 이동이 끝난 뒤 범위에 넣었다 — 판단이 바뀐 경위는 [부록 D](#부록-d-후속-정리).

## 2. A — Architecture

### 2.1 현재 구조에서 실제로 겪는 문제

1. **기능 파편화** — 위시리스트 하나가 `stores/wishlist.ts` + `product-actions.tsx` + `header-actions.tsx` 3곳에 흩어져 있고, `product-actions.tsx` 한 파일에 장바구니와 위시리스트가 동거한다. "위시리스트를 제거하라"에 grep 없이 답할 수 없다.
2. **역방향 의존** — `ProductCard`(표현)가 `CartButton`/`WishlistButton`(행위)을 직접 import한다. 행위 없는 카드를 재사용할 수 없고, 새 행위마다 카드를 수정해야 한다.
3. **통짜 타입 창고** — `types/commerce.ts`에 도메인 타입·API 계약·mock 전용 제어값(`MockApiScenario`)이 동거한다. 소유자가 없고 프론트가 mock 전용 값을 import할 수 있다.
4. **에러 경계 부재** — 모든 API 에러가 인라인 `isError` 분기라 5xx와 4xx의 구분이 없고, 렌더링 오류는 잡을 곳이 없다.
5. **강제 장치 부재** — `@/*` 단일 alias로 어디서든 import 가능하다. 규칙을 정해도 도구가 위반을 잡지 못한다.

### 2.2 Before / After

```
Before                                  After
src/                                     src/
  app/_components/   # 홈·상품·헤더 UI     app/            # 라우팅 전용(얇은 진입점)
  app/products/      # _components+_lib      layout.tsx providers.tsx   # App 레이어 역할
  app/api/           # mock 백엔드           page.tsx      # 1줄 재수출
  app/dialog/ select/                        error.tsx products/{page,error}.tsx
  components/ui/     # 헤드리스 UI kit       api/          # mock (레이어 밖, _contract.ts)
  examples/          # 미연결 예시           dialog/ select/  # 데모(전용 코드 동거)
  hooks/                                  _pages/
  queries/                                  home/      ui·api·index
  services/                                 products/  ui·api·lib·index
  stores/                                 widgets/     header · product-card-actions
  types/                                  features/    toggle-cart · toggle-wishlist
                                          entities/    product(ui·model) · cart · wishlist
                                          shared/      ui · lib · api
```

파일 단위 After는 §2.5 매핑표가 곧 목차다. Before의 최상위 7개(`components`·`examples`·`hooks`·`queries`·`services`·`stores`·`types`)는 전부 소멸했다.

### 2.3 레이어 선택 근거

작은 프로젝트라 **필요한 레이어만 만들고 안 만든 이유를 남기는 것**이 목표다.

| 레이어      | 사용 | 근거                                                                         |
| ----------- | ---- | ---------------------------------------------------------------------------- |
| `shared`    | O    | 도메인을 모르는 코드(UI kit, 디바운스 훅, HTTP 클라이언트)가 이미 존재       |
| `entities`  | O    | product(표현+타입), cart/wishlist(도메인 상태)의 소유자가 필요               |
| `features`  | O    | 찜/담기는 홈·목록에서 재사용되는 행위. 폴더째 삭제 가능해야 함               |
| `widgets`   | O    | 헤더(두 엔티티 조합), 카드 액션(두 feature 조합) — 페이지 소유가 아닌 조합체 |
| `_pages`    | O    | Next 라우팅과 FSD 페이지 분리. `src/pages`는 Pages Router로 오인됨           |
| `_app`      | X    | `layout.tsx`+`providers.tsx`가 이미 그 역할. 옮겨서 감출 내부가 없다         |
| `processes` | X    | FSD v2.1에서 deprecated                                                      |

세그먼트는 목적 기준 — `ui`(표현) / `model`(상태·타입) / `api`(서버 통신: fetch·queryOptions·DTO) / `lib`(슬라이스 내부 유틸). queryOptions는 쿼리키 팩토리라 로직처럼 보이지만 본질이 서버 통신 계약이므로 `api`에 둔다.

> FSD 신판(fsd.how)의 Next.js 가이드는 라우팅 `app/`을 루트로 빼고 `src/app`·`src/pages` 표준 이름을 유지하지만, 과제 공통 규칙("`src/pages`는 만들지 않는다")에 따라 구판의 `src/_pages` 리네임 방식을 택했다. 신판의 이식 가능한 권장사항(라우팅은 재수출만, 캐시 정책은 쿼리 정의와 동거, Route Handler는 FSD 외부)은 현 구조가 이미 충족한다.

### 2.4 의존 방향 규칙과 강제 장치 (Advanced A)

```
app(라우팅) → _pages → widgets → features → entities → shared
```

- 자기보다 **아래** 레이어만 import한다. 같은 레이어의 다른 슬라이스는 직접 import하지 않는다.
- 같은 슬라이스 안은 상대경로, 다른 슬라이스는 `@/` 절대경로(자기 index를 절대경로로 부르면 순환 위험).

```ts
// 허용
import { ProductCard } from "@/entities/product"; // _pages → entities
import { CartButton } from "@/features/toggle-cart"; // widgets → features
import { ToggleButton } from "@/shared/ui/toggle-button"; // features → shared

// 금지
import { WishlistButton } from "@/features/toggle-wishlist"; // in entities → 역방향
import { useWishlistStore } from "@/entities/wishlist"; // in entities/cart → 같은 레이어
import type { Product } from "@/entities/product"; // in shared → 하위가 도메인을 앎
```

**하네스** — 규칙을 정해도 도구가 못 잡으면(§2.1-5) 규칙이 아니다. `@typescript-eslint/no-restricted-imports` + flat config glob으로 구현했고(새 의존성 없음), 첫 Phase 커밋에 넣었다 — 문제 선언과 해결 사이 6개 커밋을 사람 눈으로만 검사하는 자기모순을 피하기 위함이며, import 문자열 패턴 기반이라 아직 없는 폴더에도 무해하게 대기하다 즉시 작동한다. 규칙 본문의 SoT는 [eslint.config.mjs](../../eslint.config.mjs)이고 여기서는 **무엇을 막는지와 어디가 비었는지**만 기록한다.

| #   | 막는 것                                              | 구현                                                                            |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | 상위 레이어 import(역방향) + 모든 레이어 → `@/app/*` | 레이어별 랭크 이상 alias 금지                                                   |
| 2   | 같은 레이어 슬라이스 간 직접 import                  | 자기 레이어 alias 전체 금지(내부는 상대경로 규칙이라 성립)                      |
| 3   | mock 존이 프론트 레이어에 결합                       | `app/api/**` → `_pages`·`widgets`·`features`·`shared` 금지, `entities`는 타입만 |
| 4   | Public API 우회 딥 임포트 + `../../` 탈출            | `@/{entities,features,widgets,_pages}/*/*` 금지                                 |

**적용 범위와 구멍**

- 이 규칙은 **JS/TS import에 한정**된다. `week05-*` 전역 CSS 클래스 의존(entities의 카드가 app 소유 스타일시트 클래스를 문자열로 참조)은 도구가 볼 수 없어 §1에서 CSS 정리를 범위 제외한 결정과 함께 인지만 한다. CSS Module을 슬라이스에 동봉하면 스타일 의존도 import 경계 위로 올라온다.
- `src/app/**`(라우팅)에는 규칙 객체를 두지 않는다 — 최상위라 모든 하위 import가 합법이기 때문. 부작용으로 **`app/api/**`를 뺀 `src/app/**` 전체가 딥 임포트 무방비**다. 무방비 표면은 재수출 페이지 2개가 아니라, 실제로 레이어를 넘어 import하는 **11개 import 지점**(`layout`→widgets, `error` 2개→shared, 페이지 재수출 2개, 데모 4개)이다. 지금 전부 슬라이스 루트로만 진입하는 건 규칙이 아니라 관례다.
- **mock 테스트 존만 `@/_pages/*/*` 딥 임포트가 열려 있다** — 계약 브리지가 index에 공개하지 않은 내부 계약(§2.7)을 봐야 하는 필요한 예외이며 `allowTypeImports`로 type-only 한정.
- flat config에서 같은 rule의 options는 병합이 아니라 **교체**다. `src/app/**` 규칙을 추가한다면 mock 존 객체가 반드시 뒤에 와야 한다.
- 규칙 2에 정말 막히는 날(예: `entities/cart`가 `Product`를 필요로 할 때) 탈출구는 FSD 공식 cross-import `@x`(`entities/product/@x/cart`)이지 규칙을 끄는 것이 아니다.

### 2.5 파일 매핑표

**이동**

| 현재                                                                                         | 목표                                                                                 | 이유                                                                  |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `components/ui/{dialog,select,internal}/**` (19파일)                                         | `shared/ui/**`                                                                       | 도메인 지식 없는 compound 컴포넌트와 내부 프리미티브                  |
| `app/_components/placeholder.tsx`                                                            | `shared/ui/placeholder.tsx`                                                          | title/description/action만 아는 범용 표시                             |
| `product-actions.tsx`의 내부 `ActionButton`                                                  | `shared/ui/toggle-button.tsx`                                                        | 두 feature가 같은 레이어 import 없이 공유하는 방법                    |
| `hooks/use-debounced-callback.ts`, `stores/create-selection-store.ts`                        | `shared/lib/`                                                                        | 도메인 용어를 모르는 범용 훅·팩토리                                   |
| `services/commerce.ts`의 `fetchCommerceApi`·`CommerceApiError`, `types`의 `ApiErrorResponse` | `shared/api/commerce-client.ts`                                                      | 도메인 무관 HTTP 클라이언트. status 보유 에러가 throwOnError의 기반   |
| `types/commerce.ts`의 `Product`·`Category`·`CategoryId`·`ProductSort`                        | `entities/product/model/types.ts`                                                    | 소유자가 명확한 손작성 도메인 타입(§2.6-5)                            |
| `app/_components/product-card.tsx`                                                           | `entities/product/ui/product-card.tsx`                                               | 순수 표현으로 변경 — 버튼 import 제거, `actions` 슬롯 추가(§4.2)      |
| `app/_components/product-grid-skeleton.tsx`                                                  | `entities/product/ui/`                                                               | 스켈레톤 구조가 카드 필드에 종속(§2.6-7)                              |
| `stores/{cart,wishlist}.ts`                                                                  | `entities/{cart,wishlist}/model/store.ts`                                            | 여러 상위 슬라이스가 공유하는 도메인 상태(§2.6-4)                     |
| `product-actions.tsx`의 `WishlistButton`·`CartButton`                                        | `features/toggle-{wishlist,cart}/ui/`                                                | 행위 단위 격리 — 폴더째 삭제 가능해야 함                              |
| `app/_components/header-actions.tsx`                                                         | `widgets/header/ui/`                                                                 | 전 페이지 레이아웃 소속, 두 엔티티 조합                               |
| (신규)                                                                                       | `widgets/product-card-actions/ui/`                                                   | 두 feature 버튼을 카드용으로 조합, 홈·목록이 재사용                   |
| `app/page.tsx` 본문 + `home-*.tsx` 3개                                                       | `_pages/home/ui/`                                                                    | 홈 전용, 재사용처 없음. 라우팅 파일은 1줄 재수출로 축소               |
| `app/products/page.tsx` 본문(내부 `ProductListContent` 포함)                                 | `_pages/products/ui/product-list-page.tsx`(Suspense 셸) + `product-list-content.tsx` | 한 파일에 동거하던 내부 컴포넌트도 이때 분리(파일 1개 = 컴포넌트 1개) |
| `app/products/_components/**` (3파일), `_lib/search-params.ts`                               | `_pages/products/{ui,lib}/`                                                          | 이 라우트 전용 UI와 URL 상태 계약                                     |
| `queries/commerce.ts`의 `home()`·`products()`, `services`의 `getHome`·`getProducts`          | `_pages/{home,products}/api/`                                                        | 소비처가 각 페이지 1곳. queryKey·staleTime 그대로 이동                |
| `types/commerce.ts`의 `HomeResponse`·`ProductListResponse`                                   | `_pages/*/api/get-*.ts` — **내부 전용**(index 비공개)                                | 쿼리 소유자 옆에 계약 배치. mock은 자체 사본(§2.7)                    |
| `types/commerce.ts`의 `ProductListQuery`                                                     | **독립 정의 삭제** — nuqs 파서에서 파생                                              | 같은 모양의 계약 이중 정의 제거(§2.6-8)                               |
| `types/commerce.ts`의 `MockApiScenario`                                                      | `app/api/_contract.ts`                                                               | 검증 전용 제어값. 프론트가 물리적으로 import 불가하게                 |
| (신규)                                                                                       | `app/api/_contract.ts` 봉투 3종                                                      | mock이 소유하는 응답·에러 봉투 사본(§2.7)                             |

**그 자리에 유지**

| 위치                                                              | 이유                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------ |
| `app/{layout,providers}.tsx`, `globals.css`, `week-05-layout.css` | Next가 강제하는 전역 진입점 = App 레이어 역할. 경로만 갱신   |
| `app/api/**`(라우트 2 + `_contract` + fixture + 테스트 3)         | mock 백엔드 — 범위 제외(§2.7)                                |
| `app/{select,dialog}/**`, `app/select/_{types,lib,data}/**`       | 데모와 그 전용 타입·데이터. 커머스와 무관해 소유자 아래 동거 |

### 2.6 애매한 파일 결정표

| 대상                       | 후보 A                         | 후보 B                       | 결정                       | 기준                                                                                                                                                    |
| -------------------------- | ------------------------------ | ---------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. `ProductCard`           | `entities/product/ui`          | `widgets/product-card`       | **entities/product/ui**    | 재사용 2곳 + 포함한 행위 없음(순수 표현). 행위는 `actions` 슬롯으로 주입                                                                                |
| 2. 목록 queryOptions       | `entities/product/api`         | `_pages/products/api`        | **\_pages/products/api**   | 소비처 1곳. **승격 조건**: 두 번째 소비처(상세·카테고리)가 생기면 entities로 — 이동 비용 실측 3파일                                                     |
| 3. 홈 queryOptions         | `entities/product/api`         | `_pages/home/api`            | **\_pages/home/api**       | `HomeResponse`가 banner 등 상품 외 데이터를 포함한 페이지 전용 집계                                                                                     |
| 4. 장바구니 store          | `entities/cart/model`          | `features/toggle-cart/model` | **entities/cart/model**    | 헤더(읽기)·버튼(쓰기)이 공유하는 도메인 상태. 특정 행위 생명주기에 비종속                                                                               |
| 5. `Product` 타입          | `entities/product/model`       | `shared/types` 유지          | **entities/product/model** | 손작성 도메인 타입은 소유자가 명확. 통짜 창고는 무관한 변경이 전 소비처 diff를 오염(openapi-generator 같은 **생성** 계약이라면 shared/api가 자연스러움) |
| 6. `createSelectionStore`  | `shared/lib`                   | cart·wishlist 옆             | **shared/lib**             | shared 기준은 "어디서나 쓰이는가"가 아니라 "도메인 용어를 아는가" — `Set<string>` toggle뿐                                                              |
| 7. `ProductGridSkeleton`   | `shared/ui`                    | `entities/product/ui`        | **entities/product/ui**    | props는 범용이지만 라인 구조가 카드 필드에 종속 — 함께 바뀌는 응집 관계                                                                                 |
| 8. `ProductListQuery` 타입 | 독립 정의 유지                 | nuqs 파서에서 파생           | **파서 파생**              | URL이 검색 조건의 SoT(§3)인데 lib·api에 이중 정의하면 소유자가 둘. 같은 슬라이스 내 세그먼트 협력이라 방향 위반 없음                                    |
| 9. 카드 행위 조합 지점     | `widgets/product-card-actions` | 홈·목록에서 각각 조합        | **widgets**                | 같은 조합을 두 페이지가 쓰므로 B는 중복 코드. 소비처 2곳 = 승격 근거(§4.3)                                                                              |

### 2.7 mock 백엔드와의 경계 — 2단

`src/app/api/**`는 FSD 레이어 **밖**의 "서버"로 보고, 프론트와의 결합을 두 단계로 나눈다.

1. **응답 봉투는 공유하지 않는다** — `HomeResponse`(4필드)·`ProductListResponse`(5필드)는 mock이 `_contract.ts`에, 프론트가 `_pages/*/api`에 각각 정의한다(**의도적 중복**). "실제 백엔드가 생기면 외부 계약으로 대체될 자리"라는 전제는 양쪽이 독립 타입일 때 성립하고, mock 사정으로 `_pages`의 Public API가 넓어지는 문제도 함께 사라진다. 에러 봉투 `ApiErrorResponse`도 양쪽에 각자 존재한다(프론트 쪽은 `CommerceApiError`로 즉시 변환되므로 **미공개 로컬 타입**). 단 봉투 3종 중 이것만 드리프트 브리지가 없다 — 필드가 `message` 하나뿐이라 감시 실익이 낮다는 판단이고, 필드가 늘면 나머지와 같이 브리지에 넣는다.
2. **도메인 모델은 entities에서 type-only로** — `Product`(12필드)·`Category`·`CategoryId`·`ProductSort`는 fixture 30개가 쓰는 타입이라 중복 시 드리프트 위험이 독립성의 실익보다 크다. `import type`만 허용하고 값 import는 하네스가 차단한다 — 라우트 핸들러 모듈 그래프에 클라이언트 모듈이 끌려오는 사고 방지.

의도적 중복이 조용히 어긋나는 건 별개 문제라, mock 라우트 테스트에 `expectTypeOf<HomeResponse>().toEqualTypeOf<PageHomeResponse>()` 동치 브리지를 두어 `pnpm typecheck`가 드리프트를 잡게 했다(type-only라 런타임 독립성 유지).

> **`_contract.ts`가 `_pages`가 아닌 이유**: 이건 사용처용 타입이 아니라 **mock 서버 자신의 계약**이다. `_pages`로 옮기면 ① mock이 상위 레이어를 아는 역방향 결합이 생기고 ② 실제 백엔드 도입 시 `app/api` 폴더째 삭제하는 시나리오가 깨진다.

### 2.8 마이그레이션 계획 (Phase = 커밋 1개)

이동과 옛 파일 삭제는 같은 커밋에 묶는다 — 두 경로가 동시에 살아있으면 typecheck가 불일치를 못 잡는다. 아직 이동하지 않은 상위 코드는 그 커밋에서 새 경로를 import하도록 함께 갱신한다.

| Phase | 내용                                                               | 검증                                                            |
| ----- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| 0     | 이 RFC (코드 변경 없음)                                            | —                                                               |
| 1     | `shared` 구성 **+ 의존성 하네스 도입**(§2.4)                       | `pnpm check` + 의도적 위반 4종으로 하네스 실패 재현 → 원복      |
| 2     | `entities` 구성(product·cart·wishlist), `types/commerce.ts` 분해   | `pnpm check`                                                    |
| 3     | `features` 구성, `product-actions.tsx` 삭제                        | `pnpm check`                                                    |
| 4     | `widgets` 구성, 카드 소비처를 슬롯 주입으로 전환                   | `pnpm check` + 기준선 핵심 3행 수동 재실행(최대 동작 변경 지점) |
| 5     | `_pages` 이관, 라우팅 파일을 1줄 재수출로 축소                     | `pnpm check` + 기준선 전체 재실행                               |
| 6     | 에러 경계(유일한 동작 추가 커밋): throwOnError + `error.tsx` 2개   | `pnpm check` + `scenario=error` 임시 주입으로 재현(§5.3)        |
| 7     | 삭제 시나리오 실측 → §7 갱신                                       | 사고 실험 결과 기록                                             |
| 8     | Public API를 4레이어로 확장, 데모 전용 코드 흡수, 계약 브리지 추가 | `pnpm check` + 딥 임포트·계약 드리프트 각 1종 재현 → 원복       |

Phase별 실제 커밋 제목과 검증 실측은 [부록 B](#부록-b-phase-실행-기록과-검증-실측).

## 3. D — 상태 분류표

| 상태                | SoT               | 소유                                                                     | 소비                                              | 중복 저장하지 않는 방법                                                                      |
| ------------------- | ----------------- | ------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 상품 조회 결과      | 서버 / Query 캐시 | queryOptions는 `_pages/*/api`, 캐시는 `providers.tsx`의 단일 QueryClient | 홈, 상품 목록                                     | `useQuery` 구독만. 응답을 Zustand/useState로 복사하지 않고 파생값(totalPages)은 렌더 시 계산 |
| 검색·정렬·페이지    | URL / nuqs        | `_pages/products/lib/search-params.ts`                                   | 상품 목록                                         | `useQueryStates`가 URL을 직접 읽고 쓴다. 검색 입력 초안(useState)은 debounce 커밋 전 임시값  |
| 장바구니·위시리스트 | Zustand           | `entities/{cart,wishlist}/model`                                         | `widgets/header`(읽기), `features/toggle-*`(쓰기) | store엔 `productId`만. 개수는 `state.ids.size` selector로 파생                               |
| Dialog 열림 여부    | React 로컬 상태   | `shared/ui/dialog`(useControllableState)                                 | 데모 페이지                                       | controlled/uncontrolled 단일 소유. 다른 저장소에 미러링하지 않음                             |

## 4. I — Interface

### 4.1 슬라이스별 공개 / 은닉

| 슬라이스                       | 공개 (index.ts)                                                                          | 숨기는 것                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `entities/product`             | `ProductCard`, `ProductGridSkeleton`, `Product`, `Category`, `CategoryId`, `ProductSort` | ui 파일 구조, 카드 마크업                                  |
| `entities/cart` · `wishlist`   | `useCartStore` / `useWishlistStore`                                                      | store 생성 방식(createSelectionStore 사용 여부)            |
| `features/toggle-*`            | `CartButton` / `WishlistButton`                                                          | ui 파일 구조                                               |
| `widgets/header`               | `HeaderActions`                                                                          | ui 파일 구조                                               |
| `widgets/product-card-actions` | `ProductCardActions`                                                                     | 어떤 feature를 조합했는지                                  |
| `_pages/home` · `products`     | `HomePage` / `ProductListPage`                                                           | 섹션·필터 컴포넌트, 쿼리·fetch, 응답 봉투 계약             |
| `shared/*`                     | 세그먼트 루트 index 없음 — `@/shared/ui/placeholder`처럼 모듈별 import                   | (`dialog`·`select` 폴더의 index만 유지 — 성격은 아래 각주) |

**비즈니스 슬라이스 index 9개는 전부 서버 모듈로 유지**한다 — index에 `"use client"`를 붙이면 경계가 슬라이스 Public API 전체로 올라가 이후 서버 전용 코드를 넣을 수 없다. 지시어는 필요한 leaf(예: `product-list-content.tsx`)에만 두고, `product-list-page.tsx`는 Suspense 셸이라 서버 모듈로 남는다. 서버 모듈이 클라이언트 모듈을 재수출하는 것은 정상 동작이다.

> **`shared/ui`의 index 2개는 성격이 다르다.** `dialog/index.tsx`는 `Object.assign`으로 compound를 조립하는 **실행 코드**라 클라이언트 모듈일 수밖에 없고(유일하게 `"use client"`를 가진 index), 조립 결과가 곧 사용 계약이므로 유지한다. 반면 `select/index.tsx`는 `use-select.ts` 하나를 재수출하는 **barrel**이다 — §4.3의 정의대로라면 계약이 아니라 경로 축약이고, 숨기는 내부도 없다. 소비처 3곳이 `@/shared/ui/select`로 진입하고 있어 이번 주엔 두되, 폴더에 두 번째 모듈이 생기지 않으면 다음 정리 때 `@/shared/ui/select/use-select` 직접 import로 없앤다.

### 4.2 `ProductCard`와 행위의 조합

```tsx
// entities/product/ui/product-card.tsx — 행위를 모르는 순수 표현
type ProductCardProps = { product: Product; titleAs?: "h2" | "h3"; actions: ReactNode };

// widgets/product-card-actions — 두 feature 조합
<WishlistButton productId={productId} label={label} />
<CartButton productId={productId} label={label} />

// _pages/home, _pages/products — 조합 지점
<ProductCard product={p} actions={<ProductCardActions productId={p.id} label={p.name} />} />
```

`entities/product`는 features를 전혀 모른다(역방향 해소). 두 feature도 서로를 모르고, 공통 버튼 UI(`ToggleButton`)는 아래 레이어로 내려 공유한다. 조합 책임은 widget 한 곳뿐이다.

`actions`를 **required**로 둔 이유 — optional이면 주입을 빼먹어도 typecheck·build가 통과하면서 찜/담기 버튼이 조용히 사라진다(이번 마이그레이션의 최대 침묵 버그 경로). 현재 소비처 2곳 모두 버튼을 렌더하므로 required가 현실과 일치하고, 행위 없는 카드가 실제로 필요해지는 시점에 완화한다.

### 4.3 Public API 결정 — barrel이 아니라 계약

**barrel**은 경로를 줄이려는 습관적 재수출(숨길 의도 없음), **Public API**는 "외부가 알아도 되는 것은 이것뿐"이라는 계약이다. 리트머스 3문항 중 하나라도 Yes면 index를 만든다 — ① 소비처 2곳 이상 ② 숨길 내부 파일 2개 이상 ③ 내부 파일명 변경을 소비자가 몰라야 하는가.

**결정: 비즈니스 슬라이스 4레이어 전부 생성** — 현재 **index 9개**(entities 3 · features 2 · widgets 2 · `_pages` 2), 전부 `export *` 없는 명시적 named 재수출(이름 충돌·tree-shaking·순환 의존 예방). 딥 임포트 차단(§2.4 규칙 4)이 같은 범위를 지킨다. 레이어별로 "루트 진입 / 딥 임포트"가 갈리면 하네스 보호 범위가 비대칭이 되고, **규칙의 예외는 위반이 아니라 규범처럼 학습되기 때문**이다. index 4개(각 1줄)의 비용보다 "비즈니스 슬라이스는 항상 루트로 진입"이라는 단일 규칙의 가치가 크다.

`shared`에는 세그먼트 루트 index를 만들지 않았다 — 도메인을 모르는 모듈 모음이라 숨길 내부 경계가 없다. 리트머스는 shared 판단 기준으로 그대로 유지한다.

> 초판은 features·widgets를 "파일 1개·소비처 1곳"으로 보고 제외했다. 실측으로 뒤집힌 경위는 [부록 C](#부록-c-리뷰-반영과-ai-활용) 3차 리뷰 ①.

## 5. O — Optimization

### 5.1 캐시 정책 — 유지

폴더 이동은 캐시 정책 변경의 근거가 아니다. queryKey와 옵션을 그대로 옮겼다.

| 쿼리      | 정책                                        | 근거                            |
| --------- | ------------------------------------------- | ------------------------------- |
| 전역 기본 | staleTime 20s                               | 기존 동작 보존                  |
| home      | staleTime 5m                                | 배너·큐레이션은 저변동          |
| products  | staleTime 1m, gcTime 5m, `keepPreviousData` | 페이지·필터 변경 시 깜빡임 방지 |

### 5.2 로딩 경계

route `loading.tsx`는 만들지 않는다. 인라인 스켈레톤이 `pageSize`에 맞춘 개수 등 route 전역 fallback보다 정밀하고, 로딩의 주체가 클라이언트 `useQuery`이기 때문이다. `_pages/products`의 `Suspense`는 nuqs `useQueryStates`의 요구사항이지 데이터 로딩용이 아니다.

### 5.3 에러 처리 경계

| 실패 유형                 | 처리 위치                                 | 경계 전파 | 사용자 UI                    | 재시도                                    | 이유                                                                                                    |
| ------------------------- | ----------------------------------------- | --------- | ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 조회 실패 5xx             | queryOptions `throwOnError` → `error.tsx` | **예**    | 세그먼트 fallback(헤더 유지) | reset 버튼 → Query reset + Next `reset()` | 사용자가 조건을 바꿔 복구 불가 — 격리하고 재시도 진입점 단일화                                          |
| 잘못된 검색 조건 4xx      | 페이지 인라인 `isError`                   | 아니오    | Placeholder(alert) + 재시도  | `refetch()`                               | 복구 가능. 지금은 리터럴 파서가 유효값만 만들어 UI 도달 불가하지만 입력 경로가 늘 때를 대비해 정책 고정 |
| 예상 밖 렌더링 오류       | route segment `error.tsx`                 | **예**    | fallback + reset             | `reset()`                                 | 동기 렌더 예외는 로컬 복구 불가 — 상위 경계가 유일한 안전망                                             |
| 토글 행위의 비즈니스 오류 | **해당 없음**                             | 아니오    | —                            | —                                         | 현재 실패 경로 없는 순수 로컬 토글. 서버 동기화가 생기면 핸들러 내 try/catch + 인라인 알림              |

- **전파 기준**: `error instanceof CommerceApiError && error.status >= 500` → 경계. 4xx·빈 결과(200+빈 배열)는 인라인 — 표의 "전파" 열과 일치.
- 배치: `app/error.tsx`(루트·홈 커버) + `app/products/error.tsx`(목록 독립 복구). 둘 다 `useQueryErrorResetBoundary`와 연동. layout(헤더)은 경계 밖이라 에러 중에도 카운트가 유지된다.
- **경계가 못 잡는 것**: 이벤트 핸들러·비동기 콜백 오류는 렌더 밖이라 도달하지 않는다 — 발생 지점 핸들러에서 처리한다(현재 토글은 실패 경로 없음).
- 검증용 `scenario`는 mock 전용 제어값이므로 사용자 URL 상태나 파라미터 타입에 포함하지 않는다(타입도 mock 폴더로 이동해 구조적으로 차단). 재현 결과는 [부록 B](#부록-b-phase-실행-기록과-검증-실측).

### 5.4 하지 않을 최적화

리스트 가상화·`React.memo` 일괄 적용(30개 규모에서 근거 없는 복잡도), 번들 분석·코드 스플리팅(구조 변경과 별개), 이미지 최적화 설정 변경(next/image 기본값으로 충분).

## 6. 트레이드오프

**장점** — 기능 추가·삭제가 폴더 단위가 된다(§7) / 의존이 단방향으로 고정되어 순환을 구조적으로 방지 / "이 파일은 어디에?"의 답이 레이어 기준으로 수렴한다.

**비용** — 거의 모든 import 경로가 바뀐다(Phase 분할 + 매 Phase `pnpm check`로 완화) / 레이어 배치 판단 비용(이 RFC의 결정표가 판례) / 파일 수 증가: `product-actions.tsx` 1개 → 4개(feature 2 + shared 1 + widget 1). 단 이 구조가 개선하는 지표는 "터치 파일 수"가 아니라 **"기능과 무관한 파일을 건드리는 횟수 = 0"**이다(§7 표).

## 7. 삭제 시나리오 자가 검증

### "위시리스트를 통째로 제거한다면"

**예측** — 삭제: `entities/wishlist/`·`features/toggle-wishlist/` 2폴더. 수정: `widgets/header`(카운트 1줄)·`widgets/product-card-actions`(버튼 1줄) 2파일. `entities/product`·`_pages/*`·`shared/*`는 무변경(`ProductCard`는 불투명한 `actions` 노드만 받으므로).

**실측** (`wishlist` 대소문자 무시 grep — src 전체) — 6개 파일이 잡히고 **전부 예측 범위 안**이다: `entities/wishlist/{index,model/store}` · `features/toggle-wishlist/{index,ui/wishlist-button}` · `widgets/header/ui/header-actions` · `widgets/product-card-actions/ui/product-card-actions`. `app/`·`shared/`·`entities/product`·`_pages/*`에는 흔적 0건. 폴더 이름만으로 삭제 범위를 예측할 수 있는 구조 = 응집 성공(이전에는 4곳에 파편화).

### "신상품 뱃지를 카드에 추가한다면"

**예측** — 수정: `entities/product/ui/product-card.tsx`. 필요시 신규: `entities/product/lib/is-new-product.ts`(이때 처음 lib 세그먼트 생성) + CSS. 상위 레이어는 무변경.

**실측** — 판정 재료 `Product.createdAt`이 이미 model에 있어 데이터·API 변경 불필요. 카드 마크업의 소유자가 한 파일뿐(홈·목록은 Public API로만 소비)이라 뱃지 렌더가 이 파일 밖으로 번질 경로가 없다. 터치 파일 = 1개(+판정 함수 분리 시 1, 스타일 필요 시 `week-05-layout.css`) — 예측 그대로.

### 기능 추가 방향의 대칭 검증

| 시나리오                    | 신규                                                              | 수정                                                      | 합계 | 하위 레이어 영향                   |
| --------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- | ---- | ---------------------------------- |
| A. 카드 행위 1종(비교하기)  | `entities/compare`(store+index), `features/toggle-compare/ui` = 3 | `product-card-actions` 1줄, `header` 카운트 = 2           | 5    | shared·product·`_pages`·app 모두 0 |
| B. 페이지 전용(가격대 필터) | 0                                                                 | `search-params.ts`, `product-filters.tsx`, mock route = 3 | 3    | 다른 레이어 전부 0                 |
| C. 새 페이지 + 서버 데이터  | app 라우팅 2 + `_pages/product-detail` 4 = 6                      | mock route 1 (+결정표 2번 승격 발동 시 3)                 | 7~10 | `entities/product` 0(승격 시 +2)   |

A는 현재 구조와 비교하면 파일 수가 3→5로 오히려 늘어난다(§6에서 인정한 비용). 차이는 개수가 아니라 성격이다 — 현재 구조의 3파일 중 2개는 **다른 기능과 공유하는 파일**이지만, 새 구조의 5개는 신규 3 + 조합 지점 1줄 편집 2로 **무관한 파일 터치가 0**이다.

## 8. FSD 이해 확인 질문

1. **`ProductCard`가 찜 버튼을 직접 import하면?** — entities(하위)가 features(상위)를 아는 역방향 위반. 카드는 `actions` 슬롯만 열고 widget 또는 page에서 조합한다.
2. **한 페이지에서만 쓰는 검색 로직도 feature여야 하는가?** — 아니다. feature의 기준은 "재사용되는 사용자 가치 행위"다. 검색·필터는 목록 페이지 전용이라 `_pages/products`가 소유하고, 홈·목록 두 곳에서 쓰이는 찜/담기만 feature로 분리했다.
3. **`formatPrice`는 항상 `shared/lib`인가?** — 현재는 `toLocaleString()` 인라인이라 해당 없음. 순수 숫자 포맷팅이면 shared/lib이지만 통화 정책·회원 등급 할인·상품별 표시 규칙이 들어가는 순간 도메인 지식이 생기므로 `entities/product/lib`으로 소유자를 옮긴다. 기준은 사용 빈도가 아니라 도메인 지식 유무다.
4. **두 feature의 협력은 어디서?** — 서로 import하지 않는다. 상위 `widgets/product-card-actions`가 조합하고, 공통 UI(`ToggleButton`)는 아래 `shared/ui`로 내려 공유한다.
5. **Query와 Zustand를 서로 복사하지 않은 이유?** — SoT가 다르다. 서버 데이터의 진실은 서버, 선택 상태의 진실은 클라이언트다. 복사하면 무효화·refetch 시점마다 동기화 버그가 생기므로 store엔 `productId`만 두고 상품 정보는 항상 캐시에서 읽는다.
6. **barrel과 Public API의 차이, 나의 선택은?** — barrel은 경로 축약용 습관적 재수출, Public API는 은닉 의도를 가진 계약이다. 비즈니스 슬라이스 4레이어 전부에 index를 두고(9개) 딥 임포트를 lint로 막아 계약으로 만들었다. 반대로 `shared`에는 만들지 않았다 — 어디에 만들지 않았는지도 결정의 일부다(§4.3).

---

# 부록 — 프로젝트 기록

여기부터는 설계가 아니라 **이 설계에 도달한 과정과 실측치**다. 설계만 참고할 사람은 읽지 않아도 된다.

## 부록 A. 동작 기준선 실측

폴더를 옮기기 전에 직접 확인한 결과다. 마이그레이션 이후 모든 Phase에서 이 기준선이 유지되어야 한다(§1).

| 확인 항목           | 방법                                              | 결과                                  |
| ------------------- | ------------------------------------------------- | ------------------------------------- |
| `pnpm check`        | 로컬 실행                                         | 통과                                  |
| 홈 정상             | `/`                                               | 배너·카테고리·인기·신상품 렌더        |
| 홈/목록 로딩        | mock 500ms 지연                                   | 스켈레톤 표시                         |
| 목록 URL 직접 진입  | `?q=후디&category=all&sort=price-asc&pageSize=6`  | 검색·정렬·페이지 크기 반영(총 1개)    |
| 빈 상태             | `?q=zzzzzz`                                       | "검색 결과가 없어요" Placeholder      |
| 장바구니·위시리스트 | 찜/담기 클릭                                      | 라벨 전환("찜"→"찜됨") + 헤더 카운트  |
| 페이지 이동 간 유지 | 목록→홈 클라이언트 사이드 이동                    | Zustand·헤더 개수 유지                |
| 뒤로/앞으로         | 브라우저 뒤로가기                                 | URL 쿼리 전부 복원 + 찜 상태 유지     |
| 새로고침            | 전체 로드                                         | Zustand 초기화(persist 미사용은 의도) |
| mock 에러/검증/빈   | `scenario=error` / `sort=nope` / `scenario=empty` | 500 / 400 / 200+빈 배열               |

## 부록 B. Phase 실행 기록과 검증 실측

커밋 해시는 적지 않는다 — rebase·amend로 재작성되면 문서만 조용히 틀리기 때문이다(초판에 적어둔 8개가 실제로 그렇게 됐다). Phase와 커밋의 대응은 제목으로 추적한다.

| Phase | 커밋 제목                                                                                                                   | 결과                                                                                                                                                                                                                    |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | `docs: 6주차 FSD 전환 RFC 작성`                                                                                             | 문서 1파일                                                                                                                                                                                                              |
| 1     | `refactor: shared 레이어 구성`                                                                                              | `pnpm check` 통과. 하네스 위반 4종 재현 → 원복(아래 표)                                                                                                                                                                 |
| 2     | `refactor: entities 레이어 구성 및 types/commerce 분해`                                                                     | `pnpm check`. `actions` **required**가 미주입 소비처 2곳을 typecheck로 즉시 차단 — §4.2의 침묵 버그 방지가 작동한 첫 사례                                                                                               |
| 3     | `refactor: features 레이어 구성`                                                                                            | `pnpm check`. 분해 중 소실된 `"use client"` 3건을 리뷰에서 발견·복원                                                                                                                                                    |
| 4     | `refactor: widgets 레이어 구성`                                                                                             | `pnpm check` + 기준선 핵심 3행(URL 직접 진입·토글→카운트·이동 간 유지) 브라우저 재실행 통과. 목록에서 찜한 카드가 홈에서 "찜됨"으로 표시됨을 확인                                                                       |
| 5     | `refactor: _pages/home 구성` + `refactor: _pages/products 구성 및 queries·services 소멸`                                    | `pnpm check` + 기준선 전체 재실행 통과(디바운스→URL, 정렬, 페이지네이션, 뒤로가기, 빈 상태). **두 번째 제목의 "services 소멸"은 과장** — 지워진 건 `services/commerce.ts`뿐이고 데모용 `products.ts`는 Phase 8까지 생존 |
| 6     | `feat: API 에러 경계 구현`                                                                                                  | `pnpm check` + `scenario=error` 임시 주입 재현 통과(아래), 임시 코드 제거 확인                                                                                                                                          |
| 7     | `docs: 삭제 시나리오 실측 및 Phase별 검증 결과 기록` 외 1커밋                                                               | 문서만 변경 — §7 실측 기입                                                                                                                                                                                              |
| 8     | `refactor: widgets·features 공개 API 도입` / `refactor: select 전용 코드 흡수` / `test: 계약 드리프트 타입 브리지` + 문서 1 | `pnpm check` 통과. 딥 임포트·계약 드리프트 각 1종 재현 → 원복(아래)                                                                                                                                                     |
| —     | 후속 정리 2커밋(select 정적 fixture 전환 / `examples` 삭제)                                                                 | 레이어 이동이 아닌 최상위 구조 정리 — [부록 D](#부록-d-후속-정리)                                                                                                                                                       |

**하네스 위반 재현 (Phase 1)** — 임시 파일로 작성해 `pnpm lint`(`--max-warnings=0`) 실패를 확인하고 원복했다. 4건 모두 의도한 메시지로 차단, 원복 후 통과.

| #   | 위반                       | 차단 메시지                                            |
| --- | -------------------------- | ------------------------------------------------------ |
| 1   | entities → features 역방향 | "entities에서 같은/상위 레이어를 import할 수 없습니다" |
| 2   | features 슬라이스 간 직접  | "features에서 같은/상위 레이어를 import할 수 없습니다" |
| 3   | Public API 우회 딥 임포트  | "Public API(슬라이스 루트)로만 import하세요"           |
| 4   | `../../`로 슬라이스 탈출   | "상대경로로 슬라이스 경계를 넘을 수 없습니다"          |

아직 없는 폴더(entities·features·widgets)에 대한 규칙도 즉시 작동함을 확인했다 — 모듈 해석이 아니라 import 문자열 패턴 기반이기 때문(§2.4의 "첫 Phase 도입" 전제 실증).

**Phase 8 재현** — ① `widgets/header`에서 features 딥 임포트 → lint 차단, 원복 후 통과 ② mock `_contract`의 `ProductListResponse`에 임시 필드 추가 → 브리지 테스트에서 `pnpm typecheck`가 TS2344로 실패, 원복 후 통과.

**에러 경계 재현 (Phase 6)** — `scenario=error` 임시 주입(2곳, 검증 후 제거 확인).

1. **5xx → 경계 전파** ✅ `/products`에서 콘텐츠가 언마운트되고 `products/error.tsx` fallback이 렌더(제목 + `CommerceApiError.message`). 홈은 루트 경계로. 인라인 분기가 아니라 경계로 갔음을 언마운트로 확인.
2. **나머지 화면 생존** ✅ 에러 중에도 layout(헤더·카운트) 유지 — "조회 실패가 화면 전체를 가리지 않는다" 충족.
3. **전체 새로고침 없는 재시도** ✅ "다시 시도" 클릭 시 새 `/api/products` 요청 발생(`resetQueryErrors()` → Next `reset()` → 리마운트 refetch). mock이 계속 500이면 다시 경계로 — 루프 완결.
4. **빈 결과·4xx 인라인 유지** ✅ `q=zzzzzz`는 200+빈 배열로 `Placeholder(role="status")` 인라인. 4xx는 UI 도달 불가라 mock 직접 호출(400)로만 확인.

환경 특이사항: 탭이 숨겨지면 Chrome이 타이머를 동결해 재시도 백오프(기본 3회, 1s→2s→4s)가 진행되지 않는다. 검증 시에만 임시 `retry: false`를 함께 써서 에러 상태에 도달시켰고 역시 제거했다(운영 재시도 정책 무변경).

## 부록 C. 리뷰 반영과 AI 활용

조사(구조 파악·import 추적·기준선 검증)와 문서 초안 정리는 Claude와 함께 했다. §2.6 결정표의 최종 결정과 기준, §4.3 Public API 전략, 쿼리 소유자 결정(페이지 소유 + 승격 조건)은 후보 비교 후 직접 내렸다. 초기 제안 중 **수용**: 세그먼트 `model`→`api` 정정, `MockApiScenario` 격리, `createSelectionStore`의 shared 배치 근거. **반려**: 전 슬라이스 index 통일안(barrel/계약 구분에 따라 선별 생성으로) — 이후 3차 리뷰에서 실측 근거가 생겨 부분 철회.

architecture-review 스킬 리뷰 3회의 반영 내역:

| 회차                      | 수용                                                                                                                                                                                                                                                                                                                                                                                                       | 반려 / 유보                                                                                                                                                                                                                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1차 (RFC 초판)            | ① mock↔`_pages` 결합 모순 → §2.7 2단 경계로 재설계 ② "하네스가 마지막 Phase"라는 자기모순 → 첫 Phase로 이동 ③ `ProductListQuery`↔파서 계약 중복 → 파서 파생으로 단일화 ④ `product-card-actions` 생성 근거 → 결정표 9행                                                                                                                                                                                     | ① 목록 DTO·쿼리를 entities로 선승격 — 소비처 1곳을 미래 예측으로 올리는 건 결정표 2번에서 기각한 논리 ② 승격 조건 문구 삭제 — YAGNI 기록으로 유지 ③ alias 분리 — 하네스로 충분 ④ `fetchCommerceApi` 리네이밍 — 이름의 "commerce"는 대상 서버 서술이지 로직 결합이 아님 ⑤ 기능 추가 시나리오 추가 — 범위 밖 _(2차에서 철회)_ |
| 2차 (RFC 갱신본)          | ① 하네스가 Public API를 강제하지 않는 역전 → 딥 임포트·`../../` 차단 추가, 검증 2종→4종 ② `actions` optional의 침묵 버그 → **required** ③ 의존 규칙이 JS import 한정(전역 CSS는 사각지대)임을 명시 ④ flat config options 교체 주의 ⑤ 같은 레이어 차단의 탈출구는 `@x`라는 판례 ⑥ 결정표 8행 문구 정정 ⑦ 승격 이동 비용 실측(3파일) ⑧ 기능 추가 시나리오 3종(1차 반려 철회) ⑨ index에 `"use client"` 금지   | ① Playwright smoke — CI에 조건부 훅만 있는 상태로 실제로는 새 인프라 구축. 대신 `actions` required로 최대 리스크를 컴파일 타임 제거 + 기준선 3행을 Phase 4 직후 재실행으로 대체                                                                                                                                             |
| 3차 (마이그레이션 완료본) | ① Public API 이중 기준 → 4레이어 전부 index + 딥 임포트 차단 확장(§4.3). 근거는 `product-card-actions`가 소비처 2곳이 되어 리트머스 1번을 이미 충족한 실측 변화 ② `services`·`types` 잔재가 새 코드를 유인 → 소유자 아래로 흡수, 두 디렉터리 삭제 ③ 의도적 중복의 드리프트 감지 부재 → `expectTypeOf` 브리지 + mock 테스트 존 예외 ④ entities 간 참조 규칙 미비 지적은 **기각착오 정정**(`@x` 판례 선결정) | ① `commerce-client.ts`의 이름·한국어 기본 메시지 — 1차 반려 ④와 같은 논거로 **유보**                                                                                                                                                                                                                                        |

**마이그레이션 중 발견한 것 4가지**

1. **하네스 갭 (Phase 5)** — `_pages/home/api`가 `HomeResponse`를 정의하는 대신 `@/app/api/_contract`에서 역수입했는데 lint가 침묵했다. 원인은 금지 패턴에 `@/app/*`이 없던 것(레이어 목록에 app이 빠짐). 보강 후 같은 실수는 차단된다 — **규칙의 구멍은 설계 시점이 아니라 실전 위반이 알려준다.**
2. **`actions` required의 실증 (Phase 2)** — 소비처 2곳이 주입 없이 호출된 상태가 실제로 나왔고 typecheck가 즉시 실패했다. optional이었다면 버튼이 조용히 사라진 채 build까지 통과했을 것.
3. **`"use client"` 소실 (Phase 3)** — 3파일 분해 중 원본 1행의 지시어가 새 파일 전부에서 누락됐다. 소비처가 전부 클라이언트 트리라 **우연히 동작**하고 있었고 리뷰에서 복원 — 도구가 못 잡는 항목이라 분해 이동의 체크리스트로 남긴다.
4. **숨김 탭의 타이머 동결 (Phase 6)** — 재시도 백오프가 진행되지 않아 에러 상태 관찰이 막혔다(부록 B).

## 부록 D. 후속 정리

§1에서 "하지 않을 것"으로 분류했던 두 항목을 이동 완료 후 철회했다. 둘 다 레이어 이동이 아니라 **최상위 구조에서 오해를 남기지 않기 위한 정리**다.

1. **select 데모의 mock 라우트 의존 제거** — 흡수된 `get-catalog.ts`가 `${BASE_URL}/api/products`를 fetch한 뒤 응답을 `ProductCatalog`로 캐스팅하고 있었다. mock이 돌려주는 건 `ProductListResponse`, 데모가 기대하는 건 `ProductCatalog`라 **타입 단정이 계약 불일치를 덮고 있던 상태**다. 정적 fixture(`_data/catalog.ts`)로 대체해 커머스 mock 의존을 끊었다 — §2.7의 "mock은 폴더째 삭제 가능"이 커머스 밖 소비처에도 성립하게 됐다.
2. **`src/examples/week-05-layout` 삭제** — 어떤 라우트에도 연결되지 않은 5주차 참고용이다. 이동이 끝난 뒤에는 `src/` 최상위에 FSD 레이어가 아닌 디렉터리가 남아 있는 것 자체가 "여기도 코드를 둘 수 있다"는 신호가 된다. 결과적으로 최상위는 6개로 수렴했다(§2.2).
