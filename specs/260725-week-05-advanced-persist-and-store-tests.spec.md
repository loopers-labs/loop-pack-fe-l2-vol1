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
- 여러 탭 사이의 상태 동기화. 탭마다 독립적으로 쓰므로 나중에 쓴 탭이 앞 탭의 저장값을 덮는다

## 확정 목표

- 장바구니와 위시리스트를 `persist` 미들웨어로 브라우저에 저장하고 새로고침 후 복원한다.
- 서버 렌더 결과와 브라우저 첫 렌더 결과를 같게 만들어 hydration 불일치를 만들지 않는다.
- 저장 데이터에 `version`을 두고, 버전이 맞지 않는 값은 폐기한다.
- 저장값을 상태로 쓰기 전에 형태를 검증한다. 파싱조차 되지 않는 값도 복원을 끝내고 화면을 계속 쓸 수 있어야 한다.
- Zustand action, 헤더 개수 파생, 구독 경계, 홈↔목록 상태 동기화, 저장값 복구를 자동화 테스트로 보호한다.
- 테스트끼리 store와 저장소를 공유하지 않는다.

## 조사 결과

### 프로젝트

- `useBoundStore`는 미들웨어 없는 `create()`로 두 slice를 합친다 (`src/shared/store.ts`)
- 두 slice 모두 `string[]` 하나와 `toggle*` 하나뿐이고 서로를 참조하지 않는다 (`src/features/cart/cart-slice.ts`, `src/features/wishlist/wishlist-slice.ts`)
- 헤더 개수는 저장하지 않고 `state.cartProductIds.length`로 파생한다 (`src/features/cart/CartCount.tsx`, `src/features/wishlist/WishlistCount.tsx`)
- 토글 버튼은 해당 상품의 포함 여부와 action만 각각 selector로 구독한다 (`src/features/cart/CartToggleButton.tsx`)
- `ProductCard`는 홈과 목록이 함께 쓰는 단일 컴포넌트라 두 화면의 토글 버튼이 같은 store를 본다 (`src/features/products/ProductCard.tsx`)
- `Providers`는 클라이언트 컴포넌트지만 store를 주입하지 않고 각 컴포넌트가 모듈 store를 직접 구독한다 (`src/app/providers.tsx`)
- 테스트는 vitest + jsdom + RTL이며 `restoreMocks: true`와 `afterEach(cleanup)`만 공통 설정이다 (`vitest.config.ts`, `vitest.setup.ts`)
- 스키마 검증 라이브러리는 설치되어 있지 않다 (`package.json`)

### zustand 5.0.14 동작

- `createJSONStorage`의 `getItem`은 `JSON.parse`를 보호하지 않는다 (`node_modules/zustand/esm/middleware.mjs`)
- 파싱이 던지면 `toThenable`이 이후 `.then`을 모두 건너뛰고 `.catch`로 보낸다. 건너뛰는 구간에 `merge`, `set`, `hasHydrated = true`, 복원 완료 알림이 모두 들어 있어 **복원이 끝나지 않은 상태로 남는다**
- `migrate`는 저장된 `version`이 숫자이고 설정값과 다를 때만 호출된다
- 복원 마지막은 `set(merge(...), true)`로 상태를 통째로 교체한다. 기본 `merge`가 현재 상태를 펼치므로 action은 보존된다
- 공식 문서는 `createJSONStorage`가 런타임 검증을 하지 않으므로 검증하는 `PersistStorage`를 직접 구현하라고 권한다

## 결정 사항

- **D1: 복원 전에는 헤더의 숫자 자리를 비운다** — 서버 HTML은 React가 hydration을 시작하기 전에 이미 화면에 그려진다. 서버가 저장값을 알 수 없는 이상 첫 그림과 복원 후 그림은 반드시 달라지고, 고를 수 있는 건 첫 프레임에 무엇을 보여줄지뿐이다. 담아둔 게 있는 사용자에게 잠깐이라도 `0`을 보여주는 건 사실이 아닌 값이므로, 숫자 자리를 비워두고 복원 후 채운다.
- **D2: 복원 전에는 담기·찜 버튼을 비활성화한다** — 복원 직전에 누른 클릭은 뒤이은 복원값에 덮여 사라진다. hydration이 끝나기 전에는 클릭 핸들러가 붙지 않아 실제로 못 누르므로 막히는 구간은 한 프레임뿐이다. `merge`에서 병합하는 방식은 뺐던 상품이 되살아나는 반대 방향의 버그를 만든다.
- **D3: 저장 형태를 바꿀 때마다 `version`을 올리고 `migrate`에 변환 코드를 넣는다** — 저장값은 코드보다 오래 살아, 형태를 바꾸면 사용자 브라우저에는 새 코드와 옛 데이터가 함께 남는다. 이번에 `migrate`가 폐기만 하는 것은 `persist`를 처음 붙여 변환할 이전 형태가 존재하지 않기 때문이고, 버전을 알 수 없는 값(사용자가 손댄 값 등)에 대한 기본 동작으로만 남는다.
- **D4: 검증은 `merge`가 아니라 `storage`에서 한다** — `merge`는 파싱이 성공한 뒤에만 호출된다. 저장값이 JSON이 아니면 복원 자체가 중단되어 복원 완료 신호가 오지 않고, D1·D2의 표현이 영구히 유지되어 화면이 잠긴다. `storage`에서 파싱과 형태 검사를 함께 처리하면 어떤 저장값이 와도 복원이 정상적으로 끝난다.
- **D5: 손상된 필드는 통째로 비우고 다른 필드는 살린다** — 원소 일부만 남기면 사용자는 담은 것보다 적은 목록을 보고도 이유를 알 수 없다. 비어 있으면 초기화됐다고 이해할 수 있다. 장바구니와 위시리스트는 서로 무관하므로 한쪽이 깨져도 다른 쪽은 유지한다.
- **D6: 스키마 검증 라이브러리를 도입하지 않는다** — 검증 대상이 문자열 배열 두 개뿐이라 직접 쓰는 검사가 몇 줄이면 끝난다. 저장 형태가 중첩 객체로 커지면 그때 도입한다.
- **D7: 구독 경계는 리렌더가 일어났는지로 검증한다** — 지켜야 할 계약은 "필요한 값만 구독한다"이고, 위시리스트가 바뀌어도 장바구니 개수가 다시 그려지지 않는 것은 화면에 보이는 값으로는 드러나지 않는다. selector를 파일로 올려 단위 테스트하는 것은 `length` 계산을 다시 확인하는 일에 가깝다.
- **D8: 화면 간 동기화는 같은 상품의 카드를 나란히 두 개 렌더해 검증한다** — 확인하려는 계약은 어느 화면에서 담아도 같은 store에 반영된다는 것 하나다. 홈과 목록 화면을 그대로 렌더하면 QueryClient·nuqs 어댑터·조회 mock까지 갖춰야 하고, 테스트가 실패했을 때 store 문제인지 조회 문제인지 가려내야 한다. `ProductCard`는 두 화면이 실제로 공유하는 컴포넌트이므로 두 번 렌더한 것이 곧 두 화면이다.

## 설계

### persist 설정

저장 키는 `commerce-client-state`, 버전은 1로 시작한다.

- `migrate`는 버전이 어긋날 때만 호출되므로 본문은 폐기 한 줄이면 된다. 버전을 검사하는 조건문은 필요 없다.
- `partialize`로 저장 대상을 두 배열로 고정한다. 타입상 필수는 아니지만, 나중에 store에 UI 상태가 늘어도 저장 대상이 자동으로 넓어지지 않게 한다.
- `merge`는 두지 않는다. 검증이 `storage`로 올라가면 기본 얕은 병합으로 충분하고, 기본 병합이 현재 상태를 먼저 펼쳐 action을 보존한다.

### 저장값 검증

`createJSONStorage` 대신 `PersistStorage`를 직접 구현해 파싱과 형태 검사를 한곳에서 처리한다. `store.ts` 안에 두고 별도 모듈로 빼지 않는다.

- 읽기·파싱에 실패하면 해당 키를 지우고 `null`을 반환한다. 저장값이 깨졌든 저장소 접근 자체가 막혔든(사파리 시크릿 모드, 용량 초과) 복원은 정상적으로 끝나야 한다. 끝나지 않으면 화면이 복원 전 표현에 갇힌다.
- 파싱에 성공하면 두 필드를 각각 검사한다. 문자열 배열이 아닌 필드는 빈 배열로 두고 다른 필드는 그대로 쓴다.
- 중복 ID는 토글로는 만들 수 없는 값이므로 하나로 줄여 헤더 개수가 실제 상품 수와 어긋나지 않게 한다.
- `version`이 숫자가 아니면 persist가 버전 비교를 건너뛰므로, 절대 일치하지 않는 값으로 바꿔 폐기 경로로 보낸다.
- 쓰기에 실패해도 화면 동작은 막지 않는다. 저장은 다음 변경에서 다시 시도된다.
- `localStorage` 접근은 함수 안에서만 하므로 서버 렌더에서 평가되지 않는다.

### 복원 시점

`skipHydration: true`로 자동 복원을 끄고, 브라우저에서 `Providers`가 마운트된 뒤 복원을 시작한다. 자동 복원은 store 모듈이 평가되는 시점에 동기로 일어나 브라우저 첫 렌더가 서버 HTML과 달라진다.

복원 트리거는 store 모듈이 훅으로 내보내고 `Providers`는 그것을 호출하기만 한다. persist를 언제 어떻게 부르는지는 store의 사정이라 앱 셸이 알 필요가 없다.

복원 여부는 store 상태가 아니라 `persist.hasHydrated()`와 `persist.onFinishHydration`을 `useSyncExternalStore`로 구독해 읽는다. 서버 스냅샷은 항상 `false`다. 파생 가능한 값을 상태로 중복 저장하지 않기 위함이다. 재복원을 도입하면 시작 신호인 `onHydrate`도 함께 구독해야 한다.

### 저장 대상 값 읽기

복원 여부를 따로 내보내지 않고, 저장 대상 값을 읽는 훅이 복원 전에는 `undefined`를 돌려준다. 복원 전 값은 담아둔 게 있어도 비어 보이므로 그대로 그리면 안 되는데, 반환 타입이 그 처리를 강제하면 소비자가 빠뜨릴 수 없다. 저장 대상이 아닌 action은 store를 직접 읽는다.

### 화면

- `CartCount`·`WishlistCount`: 복원 전에는 숫자 자리를 비우고, 복원 후 개수를 렌더한다. 숫자는 별도 요소에 담아 폭을 예약한다. 상품이 30개라 개수가 두 자리까지 가므로 `min-width: 2ch`로 잡고, 이 폰트는 숫자 폭이 제각각(`0`=11.09px, `1`=7.19px)이라 `tabular-nums`도 함께 준다. 없으면 복원할 때 헤더가 3.5~7.4px 밀린다.
- `CartToggleButton`·`WishlistToggleButton`: 복원 전에는 `disabled`이며 `aria-pressed`를 단정하지 않는다. 값이 `undefined`이면 속성이 붙지 않아 저절로 그렇게 된다.

폭은 고정되지만 숫자가 나타나는 것 자체는 남는다. `useEffect`로 복원하는 이상 첫 페인트 이후에 값이 채워지기 때문이고, 없애려면 HTML 파싱 중에 도는 인라인 스크립트로 페인트 전에 DOM을 고쳐야 한다([Next.js 가이드](https://nextjs.org/docs/app/guides/preventing-flash-before-hydration)). 그러려면 자동 복원으로 되돌리고 저장값 파싱을 스크립트 문자열에 한 벌 더 두어야 하는데, 그 사본은 여기 검증을 거치지 않고 CSP가 인라인 스크립트를 막으면 hydration 오류로 바뀐다. 헤더 숫자 하나가 늦게 나타나는 것과 바꾸기에는 비용이 커서 택하지 않는다. 서버가 값을 알아야 할 만큼 중요해지면 저장 위치를 쿠키로 옮기는 쪽이 먼저다.

### 테스트

| 파일                                | 검증 대상                                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/shared/store.test.tsx`         | 담기·빼기와 slice 독립성, 헤더 개수 파생, 구독 경계, 같은 상품 카드 두 개의 동기화, 저장소 기록, 저장값 복원과 복원 후 action, 버전 불일치 폐기, 손상 필드 폐기와 다른 필드 보존, 중복 정리, 파싱 실패, 저장소 접근 실패 |
| `src/shared/store-restore.test.tsx` | 복원 전 빈 숫자 자리·비활성 버튼 → 복원 후 숫자·활성 버튼                                                                                                                                                                |

- 저장값 관련 검증은 `localStorage`에 값을 직접 넣고 `persist.rehydrate()`를 부르는 방식으로 한다. 검증 함수를 테스트 때문에 `export`하지 않아도 되고, `JSON.parse`와 배선까지 함께 지나간다.
- 리렌더 여부는 React가 공개한 `<Profiler>`의 `onRender`로 확인한다. React 내부를 몽키패치하는 도구는 쓰지 않는다.
- `persist.hasHydrated()`는 한 번 참이 되면 되돌릴 방법이 없어, 복원 전 상태가 필요한 검증은 별도 파일에서 한 테스트로 복원 전후를 순서대로 확인한다. 파일을 나눈 이유를 파일 상단 주석으로 남긴다.
- 테스트 격리는 `vitest.setup.ts`의 `afterEach`에서 `localStorage.clear()`와 두 배열의 초기화로 처리한다. action까지 지우지 않도록 상태 교체가 아닌 부분 갱신을 쓴다.

## 완료 조건

- [ ] 담거나 빼면 저장소에 현재 목록과 버전이 기록된다
- [ ] 저장값이 있는 상태에서 복원하면 담긴 상품과 헤더 개수가 그대로 살아난다
- [ ] 복원 전 헤더에는 숫자가 없고, 복원 후 숫자가 나타난다
- [ ] 복원 전 담기·찜 버튼이 `disabled`이고, 복원 후 활성화된다
- [ ] 저장값이 JSON이 아니어도 복원 완료 신호가 오고, 해당 키는 지워진다
- [ ] `localStorage` 접근이 막힌 브라우저에서도 복원 완료 신호가 온다
- [ ] `version`이 1이 아니거나 숫자가 아니거나 없는 저장값으로 진입하면 초기 상태로 시작한다
- [ ] `cartProductIds`가 배열이 아니거나 문자열 아닌 원소를 포함하면 장바구니만 비고 위시리스트는 유지된다
- [ ] 복원 후에도 `toggleCart`·`toggleWishlist`가 동작한다
- [ ] 위 항목과 헤더 개수 파생·구독 경계·홈↔목록 동기화가 자동화 테스트로 검증된다
- [ ] `pnpm check`(test · lint · typecheck · build)가 통과한다

브라우저 새로고침 자체(서버 렌더 → HTML 전송 → hydration → effect)는 jsdom이 재현하지 못하므로 완료 조건에서 제외한다. 이 경로는 E2E를 도입할 때 함께 다룬다.

## 태스크

- T1: 영속화 전의 store 계약(담기·빼기, 헤더 개수 파생, 구독 경계, 화면 간 동기화)을 테스트로 고정한다 — fulfills: 완료 조건 10
- T2: `vitest.setup.ts`에 store·저장소 초기화를 추가한다 — fulfills: 완료 조건 10
- T3: 검증하는 `PersistStorage`와 함께 `useBoundStore`에 `persist`를 적용한다 — fulfills: 완료 조건 1, 2, 5, 6, 7, 8
- T4: `Providers`의 복원 트리거와 복원 여부 구독 훅을 추가한다 — fulfills: 완료 조건 2
- T5: 헤더 개수와 토글 버튼에 복원 전 표현을 적용한다 — fulfills: 완료 조건 3, 4
- T6: 저장·복원과 복원 전후 표현을 테스트로 검증한다 — fulfills: 완료 조건 10
- T7: `pnpm check`로 전체 검증한다 — fulfills: 완료 조건 11

T3(검증하는 `storage`)과 T5(복원 전 표현)는 함께 완성되어야 한다. `storage`가 막으려는 것이 복원이 끝나지 않는 상태이고, 그때 잠기는 것이 T5의 표현이다.

## 참고

- [zustand `persist` reference](https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md) — 검증하는 `PersistStorage` 권장, `version`·`migrate`·`skipHydration` 의미
- [zustand testing guide](https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/testing.md) — store 직접 조작보다 RTL 렌더 권장
- [pmndrs/zustand `tests/basic.test.tsx`](https://github.com/pmndrs/zustand/blob/main/tests/basic.test.tsx) — 렌더 횟수 카운터로 구독 경계 검증
- [pmndrs/zustand `tests/persistSync.test.tsx`](https://github.com/pmndrs/zustand/blob/main/tests/persistSync.test.tsx) — 가짜 storage 주입 방식
- [TanStack Query `persistQueryClient`](https://tanstack.com/query/latest/docs/react/plugins/persistQueryClient) — `buster`·`maxAge` 폐기 전략
- [redux-persist migrations](https://github.com/rt2zz/redux-persist/blob/master/docs/migrations.md) — 버전마다 변환 함수를 두는 마이그레이션 방식
- [redux-persist `getStorage.ts`](https://github.com/rt2zz/redux-persist/blob/master/src/storage/getStorage.ts) — 저장소 접근 실패 시 noop 대체
- [Next.js: 페인트 전 flash 방지](https://nextjs.org/docs/app/guides/preventing-flash-before-hydration) — `useEffect` 복원이 flash를 남기는 이유와 인라인 스크립트 대안
