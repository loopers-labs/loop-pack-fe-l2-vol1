# 5주차 Advanced A + D — 클라이언트 상태 영속화와 상태 계약 테스트 스펙

## 목표

새로고침해도 담아둔 장바구니·위시리스트가 남아 있게 한다. 저장값은 사용자가 직접 고칠 수 있고 앱이 바뀌면 형태도 달라지므로, 낡거나 깨진 값이 들어와도 화면이 멈추지 않고 정의된 상태로 이어져야 한다.

그리고 화면 없이도 깨지면 바로 아는 상태 계약을 자동화 테스트로 고정한다. 담기·빼기 동작, 헤더 개수 파생, 구독 경계, 화면을 옮겨도 같은 상품 상태가 보이는지, 저장값 복구가 그 대상이다.

기본 과제는 [260719-week-05-state-management.spec.md](260719-week-05-state-management.spec.md), Advanced B와 C 일부는 [260722-week-05-advanced-server-prefetch.spec.md](260722-week-05-advanced-server-prefetch.spec.md), 오류 복구는 [260723-week-05-error-recovery.spec.md](260723-week-05-error-recovery.spec.md)에 있다. 이 문서는 Advanced A 전체와 Advanced D를 다룬다.

## 비범위

- 로그인·서버 동기화와 익명 상태 병합, 소유권 이전
- 상품 수량, 합계 금액, 장바구니 상세 페이지
- `localStorage` 외의 저장소(`sessionStorage`, IndexedDB, 쿠키, 서버)
- 서버 데이터(TanStack Query 캐시)의 영속화
- store 데이터 형태 변경과 그에 따른 slice·컴포넌트 수정
- 스키마 검증 라이브러리 도입
- 저장값의 보관 기간(TTL) 관리
- 이미 통과 중인 nuqs URL 조건 ↔ query key 일치 테스트의 재작성
- Advanced C의 남은 항목(검색 debounce, 다음 페이지 prefetch, 목록 이동 전 prefetch)
- E2E(Playwright)로 새로고침 복원을 검증하는 것

## 확정 목표

- 장바구니와 위시리스트를 `persist` 미들웨어로 브라우저에 저장하고 새로고침 후 복원한다.
- 서버 렌더 결과와 브라우저 첫 렌더 결과를 같게 만들어 hydration 불일치를 만들지 않는다.
- 저장 데이터에 `version`을 두고, 버전이 맞지 않는 값은 폐기한다.
- 저장값을 상태로 쓰기 전에 형태를 검증한다. 파싱조차 되지 않는 값도 복원을 끝내고 화면을 계속 쓸 수 있어야 한다.
- Zustand action, 헤더 개수 파생, 구독 경계, 홈↔목록 상태 동기화, 저장값 복구를 자동화 테스트로 보호한다.
- 테스트끼리 store와 저장소를 공유하지 않는다.

## 조사 결과

### 프로젝트

- `useBoundStore`는 미들웨어 없는 `create()`로 두 slice를 합친다 (`src/shared/store.ts:13`)
- 두 slice 모두 `string[]` 하나와 `toggle*` 하나뿐이고 서로를 참조하지 않는다 (`src/features/cart/cart-slice.ts:9`, `src/features/wishlist/wishlist-slice.ts:12`)
- 헤더 개수는 저장하지 않고 `state.cartProductIds.length`로 파생한다 (`src/features/cart/CartCount.tsx:6`, `src/features/wishlist/WishlistCount.tsx:6`)
- 토글 버튼은 해당 상품의 포함 여부와 action만 각각 selector로 구독한다 (`src/features/cart/CartToggleButton.tsx:11`)
- `ProductCard`는 홈과 목록이 함께 쓰는 단일 컴포넌트라 두 화면의 토글 버튼이 같은 store를 본다 (`src/features/products/ProductCard.tsx:38`)
- `Providers`는 클라이언트 컴포넌트지만 store를 주입하지 않고 각 컴포넌트가 모듈 store를 직접 구독한다 (`src/app/providers.tsx:11`)
- 테스트는 vitest + jsdom + RTL이며 `restoreMocks: true`와 `afterEach(cleanup)`만 공통 설정이다 (`vitest.config.ts:16`, `vitest.setup.ts:7`)
- 스키마 검증 라이브러리는 설치되어 있지 않다 (`package.json`)

### zustand 5.0.14 동작

- `createJSONStorage`의 `getItem`은 `JSON.parse`를 보호하지 않는다 (`node_modules/zustand/esm/middleware.mjs:288`)
- 파싱이 던지면 `toThenable`이 이후 `.then`을 모두 건너뛰고 `.catch`로 보낸다 (같은 파일 `:305`). 건너뛰는 구간에 `merge`, `set`, `hasHydrated = true`, 복원 완료 알림이 모두 들어 있어 **복원이 끝나지 않은 상태로 남는다**
- `migrate`는 저장된 `version`이 숫자이고 설정값과 다를 때만 호출된다 (같은 파일 `:392`)
- 복원 마지막은 `set(merge(...), true)`로 상태를 통째로 교체한다. 기본 `merge`가 현재 상태를 펼치므로 action은 보존된다
- 공식 문서는 `createJSONStorage`가 런타임 검증을 하지 않으므로 검증하는 `PersistStorage`를 직접 구현하라고 권한다

## 결정 사항

- **D1: 복원 전에는 헤더의 숫자 자리를 비운다** — 서버 HTML은 React가 hydration을 시작하기 전에 이미 화면에 그려진다. 서버가 저장값을 알 수 없는 이상 첫 그림과 복원 후 그림은 반드시 달라지고, 고를 수 있는 건 첫 프레임에 무엇을 보여줄지뿐이다. 담아둔 게 있는 사용자에게 잠깐이라도 `0`을 보여주는 건 사실이 아닌 값이므로, 아직 모른다는 뜻의 자리표시자를 두고 복원 후 숫자로 채운다.
- **D2: 복원 전에는 담기·찜 버튼을 비활성화한다** — 복원 직전에 누른 클릭은 뒤이은 복원값에 덮여 사라진다. hydration이 끝나기 전에는 클릭 핸들러가 붙지 않아 실제로 못 누르므로 막히는 구간은 한 프레임뿐이다. `merge`에서 병합하는 방식은 뺐던 상품이 되살아나는 반대 방향의 버그를 만든다.
- **D3: 버전이 맞지 않는 저장값은 변환하지 않고 폐기한다** — 비로그인 익명 데이터라 잃어도 사용자 손해가 작고, 버전마다 변환 코드를 유지하는 비용이 복구 가치보다 크다. 계정에 묶인 데이터라면 변환한다.
- **D4: 검증은 `merge`가 아니라 `storage`에서 한다** — `merge`는 파싱이 성공한 뒤에만 호출된다. 저장값이 JSON이 아니면 복원 자체가 중단되어 복원 완료 신호가 오지 않고, D1·D2의 표현이 영구히 유지되어 화면이 잠긴다. `storage`에서 파싱과 형태 검사를 함께 처리하면 어떤 저장값이 와도 복원이 정상적으로 끝난다.
- **D5: 손상된 필드는 통째로 비우고 다른 필드는 살린다** — 원소 일부만 남기면 사용자는 담은 것보다 적은 목록을 보고도 이유를 알 수 없다. 비어 있으면 초기화됐다고 이해할 수 있다. 장바구니와 위시리스트는 서로 무관하므로 한쪽이 깨져도 다른 쪽은 유지한다.
- **D6: 스키마 검증 라이브러리를 도입하지 않는다** — 검증 대상이 문자열 배열 두 개뿐이라 직접 쓰는 검사가 몇 줄이면 끝난다. 저장 형태가 중첩 객체로 커지면 그때 도입한다.
- **D7: 구독 경계는 리렌더 횟수로 검증한다** — 지켜야 할 계약은 "필요한 값만 구독한다"이고, 위시리스트가 바뀌어도 장바구니 개수가 리렌더되지 않는 것은 렌더 횟수로만 드러난다. selector를 파일로 올려 단위 테스트하는 것은 `length` 계산을 다시 확인하는 일에 가깝다.
- **D8: 화면 간 동기화는 같은 상품의 카드를 나란히 두 개 렌더해 검증한다** — 확인하려는 계약은 어느 화면에서 담아도 같은 store에 반영된다는 것 하나다. 홈과 목록 화면을 그대로 렌더하면 QueryClient·nuqs 어댑터·조회 mock까지 갖춰야 하고, 테스트가 실패했을 때 store 문제인지 조회 문제인지 가려내야 한다. `ProductCard`는 두 화면이 실제로 공유하는 컴포넌트이므로 두 번 렌더한 것이 곧 두 화면이다.

## 설계

### persist 설정

```ts
persist(slices, {
  name: 'commerce-client-state',
  version: 1,
  storage: validatedStorage,
  skipHydration: true,
  partialize: ({ cartProductIds, wishlistProductIds }) => ({
    cartProductIds,
    wishlistProductIds,
  }),
  migrate: () => INITIAL_PERSISTED_STATE,
});
```

`migrate`는 버전이 어긋날 때만 호출되므로 본문이 폐기 한 줄이면 충분하다. `partialize`는 저장 대상을 좁히는 동시에 `storage`가 다룰 타입을 상태 전체가 아닌 저장 형태로 좁힌다.

`merge`는 두지 않는다. 검증이 `storage`로 올라가면 기본 얕은 병합으로 충분하고, 기본 병합이 현재 상태를 먼저 펼쳐 action을 보존한다.

### 저장값 검증

`createJSONStorage` 대신 `PersistStorage`를 직접 구현해 파싱과 형태 검사를 한곳에서 처리한다. `store.ts` 안에 두고 별도 모듈로 빼지 않는다.

```ts
const toValidProductIds = (value: unknown) =>
  Array.isArray(value) && value.every((id) => typeof id === 'string' && id !== '')
    ? [...new Set(value)]
    : [];
```

- 파싱에 실패하면 해당 키를 지우고 `null`을 반환한다. 다음 방문에서 같은 값으로 다시 실패하지 않게 한다.
- 파싱에 성공하면 두 필드를 각각 검사한다. 문자열 배열이 아닌 필드는 빈 배열로 두고 다른 필드는 그대로 쓴다.
- 중복 ID는 토글로는 만들 수 없는 값이므로 하나로 줄여 헤더 개수가 실제 상품 수와 어긋나지 않게 한다.
- `localStorage` 접근은 함수 안에서만 하므로 서버 렌더에서 평가되지 않는다.

### 복원 시점

`skipHydration: true`로 자동 복원을 끄고, 브라우저에서 `Providers`가 마운트된 뒤 `useBoundStore.persist.rehydrate()`를 호출한다. 자동 복원은 store 모듈이 평가되는 시점에 동기로 일어나 브라우저 첫 렌더가 서버 HTML과 달라진다.

복원 여부는 store 상태가 아니라 `persist.hasHydrated()`와 `persist.onFinishHydration`을 `useSyncExternalStore`로 구독해 읽는다. 서버 스냅샷은 항상 `false`다. 파생 가능한 값을 상태로 중복 저장하지 않기 위함이다.

### 화면

- `CartCount`·`WishlistCount`: 복원 전에는 숫자 자리에 `aria-hidden`인 자리표시자를 두고, 복원 후 개수를 렌더한다.
- `CartToggleButton`·`WishlistToggleButton`: 복원 전에는 `disabled`이며 `aria-pressed`를 단정하지 않는다.

### 테스트

| 파일 | 검증 대상 |
| --- | --- |
| `src/shared/store.test.tsx` | 담기·빼기와 slice 독립성, 헤더 개수 파생, 구독 경계, 같은 상품 카드 두 개의 동기화, 버전 불일치 폐기, 손상 필드 폐기와 다른 필드 보존, 파싱 실패 |
| `src/shared/store-hydration.test.tsx` | 복원 전 자리표시자·비활성 버튼 → 복원 후 숫자·활성 버튼 |

- 저장값 관련 검증은 `localStorage`에 값을 직접 넣고 `persist.rehydrate()`를 부르는 방식으로 한다. 검증 함수를 테스트 때문에 `export`하지 않아도 되고, `JSON.parse`와 배선까지 함께 지나간다.
- 리렌더 횟수는 테스트용 컴포넌트 안의 카운터로 센다. React 내부에 접근하는 도구는 쓰지 않는다.
- `persist.hasHydrated()`는 한 번 참이 되면 되돌릴 방법이 없어, 복원 전 상태가 필요한 검증은 별도 파일에서 한 테스트로 복원 전후를 순서대로 확인한다. 파일을 나눈 이유를 파일 상단 주석으로 남긴다.
- 테스트 격리는 `vitest.setup.ts`의 `afterEach`에서 `localStorage.clear()`와 두 배열의 초기화로 처리한다. action까지 지우지 않도록 상태 교체가 아닌 부분 갱신을 쓴다.

## 완료 조건

- [ ] 상품을 담고 새로고침하면 담긴 상품과 헤더 개수가 그대로 복원된다
- [ ] 저장값이 있는 상태로 첫 진입해도 hydration 관련 콘솔 에러·경고가 0건이다
- [ ] 복원 전 헤더에는 숫자가 없고, 복원 후 숫자가 나타난다
- [ ] 복원 전 담기·찜 버튼이 `disabled`이고, 복원 후 활성화된다
- [ ] 저장값이 JSON이 아니어도 복원이 끝나 버튼이 활성화되고, 해당 키는 지워진다
- [ ] `version`이 1이 아닌 저장값으로 진입하면 초기 상태로 시작한다
- [ ] `cartProductIds`가 배열이 아니거나 문자열 아닌 원소를 포함하면 장바구니만 비고 위시리스트는 유지된다
- [ ] 복원 후에도 `toggleCart`·`toggleWishlist`가 동작한다
- [ ] 위 항목과 헤더 개수 파생·구독 경계·홈↔목록 동기화가 자동화 테스트로 검증된다
- [ ] 테스트 실행 순서를 바꿔도 결과가 같다
- [ ] `pnpm check`(test · lint · typecheck · build)가 통과한다

## 태스크

- T1: 검증하는 `PersistStorage`와 함께 `useBoundStore`에 `persist`를 적용한다 — fulfills: 완료 조건 1, 5, 6, 7, 8
- T2: `Providers`의 복원 트리거와 복원 여부 구독 훅을 추가한다 — fulfills: 완료 조건 2
- T3: 헤더 개수와 토글 버튼에 복원 전 표현을 적용한다 — fulfills: 완료 조건 3, 4
- T4: `vitest.setup.ts`에 store·저장소 초기화를 추가한다 — fulfills: 완료 조건 10
- T5: 설계의 테스트 표 2개 파일을 작성한다 — fulfills: 완료 조건 9
- T6: `pnpm check`로 전체 검증한다 — fulfills: 완료 조건 11

## 참고

- [zustand `persist` reference](https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md) — 검증하는 `PersistStorage` 권장, `version`·`migrate`·`skipHydration` 의미
- [zustand testing guide](https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/testing.md) — store 직접 조작보다 RTL 렌더 권장
- [pmndrs/zustand `tests/basic.test.tsx`](https://github.com/pmndrs/zustand/blob/main/tests/basic.test.tsx) — 렌더 횟수 카운터로 구독 경계 검증
- [pmndrs/zustand `tests/persistSync.test.tsx`](https://github.com/pmndrs/zustand/blob/main/tests/persistSync.test.tsx) — 가짜 storage 주입 방식
- [TanStack Query `persistQueryClient`](https://tanstack.com/query/latest/docs/react/plugins/persistQueryClient) — `buster`·`maxAge` 폐기 전략
- [redux-persist migrations](https://github.com/rt2zz/redux-persist/blob/master/docs/migrations.md) — 조각 단위 저장과 부분 복구
