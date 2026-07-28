# 0단계 — 상태의 자리를 먼저 정한다

## 분류표 (〃 표기는 위와 같다는 의미)

| 상태 | 소유자(원본) | 수명 | 공유 범위 | 선택 이유 |
| --- | --- | --- | --- | --- |
| **홈 데이터**(배너·카테고리·인기/신상품) | 서버 `/api/home` | 요청 단위 렌더(캐시는 Next Router Cache) | 홈 화면 | 서버가 원본. 홈엔 인터랙션이 없어 굳이 여기선 Tanstack Query를 쓸 이유가 없다고 느껴 **RSC**가 서버에서 직접 `getHome()` 을 await 한다(`app/page.tsx`).|
| **상품 목록 데이터**(products·categories·totalCount) | 서버 `/api/products` | 캐시(`staleTime`/`gcTime`), queryKey가 바뀔 때 마다 | 목록 화면 | 서버가 원본. 조건이 곧 queryKey라 **조건→queryKey→요청**이 한 경로로 흐른다. 목록은 조건 변경·페이지네이션 인터랙션이 있어 TanStack Query로 캐시·재요청·로딩/에러를 위임(`queries/products.ts`). |
| **검색어 `q`** | URL | 페이지 히스토리 | URL 공유·새로고침·앞뒤 이동 | URL 공유 시에도 동일한 내용이 나와야 하는 부분이므로 URL로 선택 |
| **카테고리 `category`** | URL | 〃 | 〃 | 〃  |
| **정렬 `sort`**(기본 `latest`) | URL | 〃 | 〃 | 〃 |
| **페이지 `page`** | URL | 〃 | 〃 | 〃 |
| **장바구니**(담긴 상품 id 집합) | 클라이언트 | 브라우저 인메모리, advanced A 진행시에는 localStorage | 여러 페이지(헤더·홈·목록) | 서버 원본이 없는 로컬 상태 + 여러 페이지 공유 → 전역 클라이언트 상태(Zustand). 상품 **id만** `Set<string>` 으로 담는다(상세는 서버가 원본). |
| **위시리스트**(찜한 상품 id 집합) | 클라이언트 | 〃 | 〃 | 〃 |
| **헤더 개수**(장바구니/위시 count) | — (파생) | — | — | 저장하면 원본 중복 → store 집합의 `.size` 로 파생(`CommerceHeaderCounts`). 별도 카운트 상태를 두지 않는다. |
| **제출 전 검색어와 일시적인 UI 상태** | 컴포넌트 | 컴포넌트 수명 | 한 화면 | 제출 전 URL에 임시로 가지고 있으면 되는 값과 같이 잠깐 동안 가지면 되는 값이므로 컴포넌트와 수명을 같이함. |
| **로딩·에러·빈 결과** | — (파생) | — | 화면 | 별도 저장 상태가 아니라 원본에서 도출한다. 로딩·에러는 쿼리 상태(`isPending` / 에러 경계 throw)에서, 빈 결과는 응답 `totalCount === 0` 에서 분기한다. |

### 1단계중 staleTime과 gcTime을 정하고, 선택한 값의 근거를 기록한다. 해당 내용은 4단계의 staleTime과 gcTime 정책과 겹치는 부분이기 때문에 아래에 기재.

# 4단계 — 설계 근거와 동작을 검증한다

## 1. TanStack Query·nuqs·Zustand의 책임을 나눈 기준

도구가 아니라 **원본(Source of Truth)이 어디 있느냐**로 나눈다.

| 상태 | 원본 | 도구 | 이유 |
| --- | --- | --- | --- |
| 서버에서 오는 상품 목록 | 서버 | TanStack Query | 원본이 서버에 있으며, 사용자와의 인터랙션으로 다시 불러와야 하기 때문 |
| 서버에서 오는 홈 데이터 | 서버 | (Query 아님) RSC에서 fetch | `app/page.tsx` 가 `getHome()` 을 직접 await → `HomeContent` 에 전달. 인터랙션이 없어 클라이언트 구독(Tanstack Query)가 불필요 |
| 공유·복원되는 목록 조건(q·category·sort·page) | URL | nuqs | URL 공유 시에도 동일한 내용이 나와야 하는 부분이므로 URL로 선택. URL이라는 저장소를 용이하게 다루기 위해 nuqs를 사용(문자열 파싱, 숫자 변환, 기본값, 직렬화등...)  |
| 로그인 전 익명 장바구니·위시리스트 ID | 클라이언트 | Zustand | 서버 원본이 없는 로컬 상태 + 자주 바뀌고 선택적 구독이 필요한 값 → 이를 다루기 위해 Zustand 선택 |

## 2. staleTime과 gcTime 정책

- staleTime **60초**를 **목록 쿼리 팩토리**(`productQueries.list`의 `queryOptions`)에 설정. gcTime은 전 쿼리 기본 값인 5분으로 설정.
- **목록 쿼리 팩토리**에만 60초를 설정한 이유는 **Advanced B 서버 프리패치의 성립 조건** 이기 때문에 적용. 서버에서 `prefetchQuery` 해 `dehydrate`로 넘긴 데이터가, 클라 mount 순간 `staleTime:0`이면 **즉시 stale로 간주돼 곧바로 재요청**된다 → prefetch가 무의미해지고 초기 중복 요청이 생긴다. 목록 쿼리에 60초를 두면 prefetch 데이터가 클라에서 **fresh**로 인정돼 "초기 중복 요청 없음"이 성립한다. (자세히는 [advanced_B](advanced_B.md).)
- gcTime의 경우 이번 과제의 케이스에서 default 값인 5분을 변경해야 할 만한 유용한 시나리오를 찾지 못하여 default 유지

## 3. store에 저장한 데이터 형태와 선택 이유

```ts
// stores/commerceStore.ts
cartIds: Set<string>;
wishlistIds: Set<string>;
```

- **상품 id만** `Set<string>` 으로 저장한다. 서버에서 받은 `Product` 전체를 복사하지 않는다.
- 이유:
  - 상태 판별에 필요한 건 "이 상품이 담겼나/찜됐나"뿐 → id의 배열로 충분하다.
  - `Set`이라 중복이 없고(같은 상품 두 번 담아도 한 번), 개수는 `.size` 로 파생한다(별도 카운트 상태 없음).
- 저장 시엔 `Set`이 JSON 직렬화가 안 되므로(`{}`가 됨) `partialize`로 배열로 바꿔 localStorage에 넣고, 복원 시 `merge`에서 `Set`으로 되돌린다(Advanced A).

## 4. selector 구독 경계

store 전체를 통째로 구독하지 않고, 각 소비처가 **필요한 최소 값만** selector로 구독한다.

| 소비처 | 구독하는 것 |
| --- | --- |
| `CommerceHeaderCounts` | 개수(`cartIds.size`, `wishlistIds.size`) + 하이드레이션 전이면 헤더에 placeholder를 보여주기 위해 하이드레이션 여부
| `ProductCardActions` | 해당 상품 포함 여부(`cartIds.has(id)`, `wishlistIds.has(id)`) + 토글 action 

## 5. 전역으로 올리지 않은 상태와 이유

| 상태 | 어디에 뒀나 | 왜 전역(Zustand)에 안 올렸나 |
| --- | --- | --- |
| 검색어 입력 초안(draft) | `ProductListFilters` 로컬 `useState`(`inputValue`) | 제출 전 잠깐 머무는 값이라 컴포넌트가 살아있는 동안이면 충분 |
| 목록 조건(q·category·sort·page) | URL(nuqs) | 원본이 URL에 항상 담겨 있기 때문에 전역으로 올릴 필요가 없음 |
| 헤더 개수 | 파생(`.size`) | Zustand에 id Set을 저장했기 때문에 계산으로 도출하면 충분하기 때문에 따로 저장하지 않음 |
| 서버에서 오는 상품 목록/홈 데이터 | Query 캐시 / RSC | 서버가 원본. 전역에 복사하면 중복·불일치 |

- 결국 **Zustand(전역)에는 장바구니·위시리스트한 상품 id들만** 올림

## 6. 로그인·서버 동기화가 생기면 위시리스트의 소유권이 어떻게 달라지는지

- **현재:** 위시리스트는 로그인 전 **익명 로컬 상태**. 원본이 클라이언트(Zustand)에 있고, Advanced A로 localStorage 복원까지만.
- **로그인 + 서버 동기화가 추가되면:** 계정 위시리스트의 **원본이 서버로 이동**한다. Zustand는 더 이상 원본이 아니라 서버 상태의 캐시/미러가 되거나(또는 서버 상태를 Query로 다루고 Zustand에서 제거) 소유권이 서버로 넘어간다.
- **정해야 할 것:** 로그인 시점의 익명 위시리스트를 계정 데이터에 ①병합할지 ②버릴지 ③충돌(양쪽에 다른 항목)을 어떻게 처리할지. — Basic 범위 밖이라 이번엔 구현하지 않는다.

## 7. 홈과 목록의 같은 상품 상태가 일치하는지 확인한 결과

- 홈·목록 모두 **같은 zustand store**(`useCommerceStore`)를 읽고, 담김/찜 판별을 `productId` 기준으로 한다.
- **테스트 검증:** `commerceState.contract.test.tsx` › "홈과 목록이 같은 store 상태를 표시하는지" — 같은 `productId` 를 다른 위치에 렌더 후 한쪽에서 담으면 다른 쪽 버튼도 `pressed`됨을 확인 함

## 8. URL 공유·새로고침·뒤로 가기·앞으로 가기 검증 결과

- 조건의 원본이 URL(nuqs `useQueryStates`)이라 새로고침·직접 진입 시 URL에서 그대로 복원된다. 조건 변경은 `history:"push"`(뒤/앞 복원 가치), 검색어 커밋과 page 교정(1 > 현재 페이지, totalPages < 현재 페이지 일 때 교정)만 `history:"replace"`(중간값·무효값이 히스토리에 안 쌓이게).

## 9. 클라이언트 페이지 이동 중 store 유지되는지 확인한 결과

- Zustand store로 유지된다. store를 React 컴포넌트 트리 밖(`stores/commerceStore.ts`)에 두어 상태를 컴포넌트가 아니라 store가 들고 있다. 그래서 클라이언트 라우팅(SPA 전환)으로 페이지가 바뀌며 컴포넌트가 언마운트돼도 store는 그대로 살아 있어 담김·찜 상태와 헤더 개수가 보존됨을 확인