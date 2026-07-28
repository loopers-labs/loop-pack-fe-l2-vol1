# Advanced A — 상태 영속화 (Zustand persist)


## 선택한 이유
Zustand를 처음 써보는 관계로 좀 더 다뤄보고 싶어서 채택.

## 작업 내역

- `commerceStore`에 zustand `persist` 미들웨어를 적용해 `cartIds`/`wishlistIds`를 `localStorage`(키 `commerce-store`)에 저장 → 새로고침 후 복원.
- `Set`은 JSON으로 직렬화되지 않으므로 **저장 시 배열**(`partialize`), **복원 시 Set**(`merge`)으로 변환.
- **`skipHydration: true` + `Providers` 마운트 후 `rehydrate()`** 로 SSR hydration 불일치를 피함.
- **`version: 1` + `migrate`**, 그리고 `toIdArray` 정제로 손상·구버전 저장값을 빈 상태로 안전 복구.

---

## 추가된 복잡도

### 1. Zustand persist로 장바구니와 위시리스트를 새로고침 후에도 복원(Set ↔ 배열 직렬화 계층)

- **왜 필요한가:** `localStorage`는 문자열만 담고, `JSON.stringify(new Set(["p1"]))`는 `"{}"`가 된다. Set을 그대로 저장하면 **데이터가 통째로 사라진다.** 그런데 런타임에서는 Set을 유지하고 싶다.
- **왜 (배열이 아니라) Set인가:** 담기·찜은 "같은 상품을 두 번 담아도 한 번"이라 **중복이 없어야** 한다. Set은 `add`가 멱등이라 이걸 공짜로 보장한다. **배열로 런타임 상태를 두면 담을 때마다 `includes`로 중복을 수동으로 걸러야 하고**(`if (!arr.includes(id)) arr.push(id)`), 빼기도 `filter`로 처리해야 한다 — 실수하면 같은 ID가 쌓여 개수·표시가 틀어진다. `has`/`size`의 O(1)도 있지만, **이 데이터는 많아야 수십 개로 예상되는 관계로 성능 이점은 사실상 미미**하다. Set을 쓰는 진짜 이유는 성능이 아니라 **중복 제거,토글을 Set이 편하게 처리**해 주는 것이다.
- **어떻게:** `partialize`가 저장 직전 `Set → 배열([...set])`로, `merge`가 복원 시 `배열 → new Set(...)`으로 되돌린다. 저장 포맷은 `{"cartIds":["p1"],"wishlistIds":[]}`. (복원 시 `new Set(...)`이 저장 배열의 중복까지 다시 흡수해 준다.)
- **대가:** **저장 표현(배열)과 런타임 표현(Set)이 달라져** 영속 경계마다 변환 계층이 생긴다. store 내부·소비부는 여전히 Set만 보지만, persist 옵션을 읽는 사람은 "여기서 형이 바뀐다"를 알아야 한다.
- **검증:** `src/stores/commerceStore.test.ts:53` (describe "영속화·복원") — 저장→`rehydrate` 복원 왕복으로 Set↔배열 직렬화 확인("localStorage 에 저장된 장바구니·위시리스트를 rehydrate 로 복원한다", "토글하면 후 localStorage에 쌓인다").

### 2. Hydration 불일치 회피 (skipHydration + 수동 rehydrate)

- **왜 필요한가:** `localStorage`는 클라이언트 전용이다. persist 기본 동작은 **store 생성 시점에 자동 복원**한다. 그러면 클라이언트 첫 렌더는 이미 "저장값(예: 장바구니 2)"인데, **서버가 만든 HTML은 "0"** 이다 → 서버·클라 첫 렌더가 달라 **React hydration mismatch** 경고가 뜨게 된다.
- **어떻게:**
  1. `skipHydration: true` — 자동 복원을 끈다. 그래서 **서버·클라 첫 렌더가 모두 빈 상태로 일치**한다.
  2. `Providers`(앱 전역 클라이언트 루트)의 `useEffect`에서 **마운트 이후**(=hydration이 끝난 뒤) `useCommerceStore.persist.rehydrate()`로 복원한다.
  3. **`hasHydrated` 플래그로 "복원 전"을 표시에서 가린다.** store의 `onRehydrateStorage`가 복원 완료 시 `setHasHydrated(true)`를 켠다. 소비부(`CommerceHeaderCounts`)는 이 플래그가 `false`인 동안 placeholder인 `–`를 그린다.
- **왜 이 플래그 방식인가 (공식 문서 근거):** zustand 문서는 hydration 완료 확인법으로 두 가지를 제시한다.
  - ✅ 채택: **`hasHydrated` 상태 플래그**를 `onRehydrateStorage`에서 켠다. React state가 아니라 store 상태라, effect 안에서 동기 `setState`를 부르지 않는다.
  - ❌ 배제: `useState` + `useEffect` 안에서 `setHydrated(useStore.persist.hasHydrated())`를 **동기 호출**하는 훅. 이건 React의 [`set-state-in-effect`](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect) 린트에 걸린다. 같은 목적을 플래그 방식으로 달성할 수 있어 이 변형은 쓰지 않는다.
- **대가:**
  - **여전히 짧은 전환은 있다:** `0`이 아니라 `–`(placeholder)에서 실제값으로 바뀐다. 오해 소지 있는 `0` 대신 "아직 로딩 중"을 나타내되, 새로고침 직후 값이 한 번 바뀌는 것 자체는 남는다
- **검증:** `src/stores/commerceStore.test.ts:83` (describe "hydration 안전성") — "skipHydration: rehydrate 전에는 저장값이 있어도 빈 상태다 (서버·클라 첫 렌더 일치)", "rehydrate 완료 후 hasHydrated 가 켜진다".

### 3. 잘못되거나 오래된 저장값의 복구 전략 (merge)

- **왜 필요한가:** `localStorage`는 사용자가 콘솔로 조작할 수 있고, 앱 버전 사이 포맷 불일치·부분 손상도 생긴다. 복원값을 **신뢰하면** `.has`/`.size`에서 런타임 에러가 난다. 이를 위해 zustand persist middleware에 넣어줄 수 있는 merge 콜백에서 손상 지원함. 이는 `rehydrate()` 시 한 번 실행됨.
- **대가: migrate와 merge 둘 다에서 정제필요:**
  - `migrate`는 **version이 다를 때만** 실행된다.
  - version이 같으면 migrate를 건너뛰고 **`merge`가 곧장 복원**한다. 즉 "같은 버전인데 값이 손상된" 경우는 migrate가 못 잡는다.
  - 그래서 **두 경로 모두**에 정제를 둠
- **검증:** `src/stores/commerceStore.test.ts:104` (describe "손상값 복구") — "배열이 아니거나 문자열이 아닌 요소는 거른다", "파싱 불가한 저장값은 빈 상태로 복구하고 크래시하지 않는다".


### 4. 저장 데이터의 version과 migrate를 적용

- **왜 필요한가:** 저장 포맷은 앱이 바뀌면 같이 바뀐다(예: 훗날 `["p1"]` → `[{ id:"p1", addedAt }]`). 사용자 브라우저엔 **옛 포맷 저장값이 남아 있는데**, 새 코드가 그걸 새 포맷이라 믿고 읽으면 런타임 에러가 날 수 있음. 저장된 `version`이 현재와 다르면 `migrate`가 그 변환을 책임진다.
- **대가:** `version`과 `migrate`를 **항상 같이 움직여야 하는 유지보수 결합**이 생긴다 — 저장 포맷을 바꿀 때마다 `version`을 올리고 `migrate`에 그 버전 분기를 추가·동기화해야 하고, 빠뜨리면 옛 값이 정제 없이 흘러 들어온다. 게다가 `migrate`는 **`version`이 다를 때만** 돌아서 "같은 버전인데 값이 손상된" 경우는 못 잡는다 → 그 구멍을 다음 4번 항목의 `merge`가 다시 막느라 **정제 로직이 두 군데로 중복**된다(각자 다른 진입 경로를 막는 필요한 중복).
- **검증:** `src/stores/commerceStore.test.ts:133` (describe "version·migrate") — "version 이 다르면 migrate가 저장값·버전과 함께 호출되고 결과가 복원된다"(비문자열 정제·복원까지 확인).

---
