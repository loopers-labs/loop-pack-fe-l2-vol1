# Week 05 State Architecture Notes

## 과제 기준

5주차 과제의 핵심은 상태관리 도구를 먼저 고르는 것이 아니라, 상태의 원본을 먼저 정하는 것이다.

- 서버에서 온 데이터는 서버가 원본이다.
- 공유, 새로고침, 뒤로 가기 복원이 필요한 조회 조건은 URL이 원본이다.
- 비로그인 사용자의 장바구니와 위시리스트는 브라우저 안에 머무는 클라이언트 상태다.
- 한 컴포넌트 안에서만 필요한 입력 중 초안이나 일시적 표시 상태는 React 로컬 상태다.

## 상태 설계 표

| 상태                                 | 소유자                       | 수명                                         | 공유 범위                             | 선택 이유                                                                                      |
| ------------------------------------ | ---------------------------- | -------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 홈 배너, 카테고리, 인기 상품, 신상품 | 서버                         | `staleTime` 동안 fresh, 이후 재검증 가능     | 홈 화면                               | API 응답 스냅샷이므로 TanStack Query가 조회 상태와 캐시를 맡는다.                              |
| 상품 목록, 전체 개수, 목록 카테고리  | 서버                         | `staleTime` 동안 fresh, 이후 재검증 가능     | 상품 목록 화면                        | 검색 조건에 따라 달라지는 서버 데이터이므로 Zustand에 복사하지 않는다.                         |
| 검색어 `q`, 카테고리, 정렬, 페이지   | URL                          | 사용자가 URL을 바꾸거나 조건을 변경할 때까지 | 공유 링크, 새로고침, 뒤로/앞으로 이동 | 같은 조건을 복원해야 하므로 `nuqs`로 URL 상태로 관리한다.                                      |
| 검색 input draft                     | React 로컬 상태              | `ProductFilters` 수명 동안                   | 검색 input                            | 타이핑 즉시는 input에 반영하고 URL/API 요청은 debounce 이후 반영해야 하므로 URL 값과 분리한다. |
| 장바구니 상품 ID 목록                | Zustand                      | 브라우저 저장소에 persist된 익명 세션        | 헤더, 홈 상품 카드, 목록 상품 카드    | 비로그인 사용자의 로컬 장바구니 상태이며 여러 화면에서 공유한다.                               |
| 위시리스트 상품 ID 목록              | Zustand                      | 브라우저 저장소에 persist된 익명 세션        | 헤더, 홈 상품 카드, 목록 상품 카드    | 비로그인 사용자의 로컬 위시리스트 상태이며 여러 화면에서 공유한다.                             |
| 헤더 장바구니/위시리스트 개수        | 파생값                       | 렌더링 시 계산                               | 헤더                                  | ID 배열 길이로 계산 가능하므로 별도 state로 저장하지 않는다.                                   |
| 상품 카드의 포함 여부                | 파생값                       | 렌더링 시 계산                               | 개별 상품 카드                        | 상품 ID가 store 배열에 포함되는지 계산 가능하므로 중복 저장하지 않는다.                        |
| 로딩, 에러, empty 상태               | TanStack Query와 렌더링 분기 | 요청 상태에 따라 변경                        | 홈, 상품 목록                         | 서버 조회 흐름에서 생기는 상태이므로 query result와 화면 분기로 표현한다.                      |

## 도구별 책임

| 도구              | 맡긴 책임                                              | 맡기지 않은 책임                                    |
| ----------------- | ------------------------------------------------------ | --------------------------------------------------- |
| TanStack Query    | 홈/상품 목록 서버 데이터, 로딩, 에러, retry, 캐시 수명 | 장바구니, 위시리스트 같은 사용자 로컬 상태          |
| nuqs              | 검색, 카테고리, 정렬, 페이지 URL 상태                  | mock API 검증용 `scenario`, 서버 응답 데이터        |
| Zustand           | 비로그인 사용자의 장바구니/위시리스트 ID 목록          | 서버에서 내려온 상품 목록 응답                      |
| React local state | 검색 input draft처럼 컴포넌트 수명에 머무는 UI 상태    | 공유해야 하는 검색 조건, 여러 화면이 함께 쓰는 상태 |

서버 응답을 Zustand에 복사하지 않은 이유는 원본이 두 곳으로 갈라지기 때문이다. 상품 목록은 서버 응답 스냅샷이고, 장바구니/위시리스트는 사용자가 브라우저에서 만든 로컬 상태다. 두 상태의 변경 이유와 수명이 다르므로 분리했다.

## TanStack Query 정책

### Query factory

홈과 상품 목록은 각각 `homeQueries.main()`과 `productQueries.list()`로 query option을 만든다.

| query     | query key                      | queryFn               | staleTime |
| --------- | ------------------------------ | --------------------- | --------- |
| 홈        | `["home", "main", params]`     | `getHome(params)`     | 5분       |
| 상품 목록 | `["products", "list", params]` | `getProducts(params)` | 1분       |

query key, queryFn, staleTime을 한곳에 둔 이유는 같은 조회를 `useQuery`, 서버 prefetch, 테스트에서 같은 계약으로 재사용하기 위해서다. 특히 상품 목록은 URL 조건이 query key와 API 요청에 모두 들어가야 캐시가 조건별로 분리된다.

### staleTime / gcTime

홈 데이터는 배너, 카테고리, 상품 섹션처럼 사용자가 같은 방문 안에서 자주 다시 볼 수 있는 데이터라 `staleTime`을 5분으로 뒀다. 상품 목록은 검색, 카테고리, 정렬, 페이지 조건이 자주 바뀌고 최신성이 홈보다 중요하므로 1분으로 뒀다.

`gcTime`은 명시하지 않고 TanStack Query 기본값을 사용한다. 이번 과제에서는 캐시 보관 시간을 세밀하게 조정하기보다, 어떤 데이터가 fresh로 취급되는지를 설명하는 `staleTime`이 더 핵심이라고 판단했다. 목록의 오래된 캐시를 별도 정책으로 오래 붙잡아야 할 요구가 생기면 `gcTime`을 query factory에 명시한다.

### Server prefetch

App Router page에서 요청마다 새로운 `QueryClient`를 만들고, 클라이언트에서 쓰는 같은 query option으로 `prefetchQuery`를 실행한다. 이후 `dehydrate`와 `HydrationBoundary`로 캐시를 클라이언트에 전달한다.

prefetch 대상은 모든 데이터가 아니라 다음으로 제한했다.

- 홈 첫 화면 데이터
- 상품 목록의 현재 URL 조건 1개

상품 목록에서 모든 페이지를 prefetch하지 않은 이유는 사용자가 실제로 볼지 모르는 데이터를 미리 가져오면 네트워크 비용이 커지기 때문이다. 현재 URL 조건은 첫 화면 렌더링에 바로 필요하므로 prefetch하고, 다음 페이지는 클라이언트에서 현재 페이지 응답 이후 1페이지만 추가 prefetch한다.

## nuqs / URL 상태 정책

상품 목록의 URL 상태는 `useQueryStates`와 parser로 관리한다.

| URL key    | 의미          | 기본값     |
| ---------- | ------------- | ---------- |
| `q`        | 검색어        | `""`       |
| `category` | 카테고리 필터 | `"all"`    |
| `sort`     | 정렬          | `"latest"` |
| `page`     | 페이지        | `1`        |

검색, 카테고리, 정렬을 바꾸면 `page`를 1로 되돌린다. 기존 페이지 번호가 새 조건의 결과 범위에서 유효하지 않을 수 있기 때문이다.

`history: "push"`를 사용한 이유는 사용자가 필터 변경, 정렬 변경, 페이지 이동을 브라우저 뒤로/앞으로 가기로 복원할 수 있어야 하기 때문이다. 단, 응답 이후 `page > totalPages`인 경우에는 사용자가 의도적으로 이동한 조건이라기보다 범위를 벗어난 URL 보정이므로 `history: "replace"`로 마지막 페이지로 바꾼다.

잘못된 query param은 URL을 강제로 정리하지 않고 내부 기본값으로 조회한다. 예를 들어 `?category=wrong`은 URL에는 남지만, 화면 조회 조건은 `category: "all"`로 해석한다. 사용자가 입력한 URL을 즉시 바꿔버리기보다, 앱 내부에서는 안전한 기본값으로 동작하게 하는 정책이다.

`scenario`는 mock API 검증용 값이므로 사용자 URL 상태와 `ProductListQuery`의 일반 흐름에는 넣지 않았다. API 호출 함수에는 테스트와 mock scenario 검증을 위해 선택적으로 받을 수 있게 했지만, 화면의 `useQueryStates` parser에는 포함하지 않는다.

## Zustand store 정책

store에는 상품 객체 전체가 아니라 ID 목록만 저장한다.

| 상태       | 저장 형태                      | 이유                                                                 |
| ---------- | ------------------------------ | -------------------------------------------------------------------- |
| 장바구니   | `cartProductIds: string[]`     | 이번 범위에서는 수량, 옵션, 합계가 없고 포함 여부와 개수만 필요하다. |
| 위시리스트 | `wishlistProductIds: string[]` | 상품 데이터는 서버가 원본이므로 로컬 store에는 식별자만 둔다.        |

헤더 개수는 `cartProductIds.length`, `wishlistProductIds.length`로 파생한다. 별도 count state를 두면 ID 배열과 count가 어긋날 수 있다.

Header는 개수만 구독하고, 상품 버튼은 해당 상품의 포함 여부와 toggle action만 구독한다. 컴포넌트가 필요한 값만 구독해야 불필요한 렌더링과 결합을 줄일 수 있기 때문이다.

로그인 기능이 생기면 위시리스트와 장바구니의 원본은 서버로 이동할 수 있다. 그때는 로컬 익명 상태를 서버 계정 데이터에 합칠지, 버릴지, 충돌을 어떻게 처리할지 서버 정책이 필요하다. 합친 이후에는 TanStack Query의 서버 상태나 mutation 흐름이 원본이 되고, Zustand는 낙관적 UI나 임시 입력 상태 정도로 역할을 줄이는 편이 적절하다.

## Advanced A: 상태 영속화

Zustand `persist`로 비로그인 장바구니와 위시리스트를 복원한다.

| 옵션                 | 역할                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `partialize`         | action이나 hydration 상태는 저장하지 않고 `cartProductIds`, `wishlistProductIds`만 저장한다. |
| `version`            | 저장 데이터 구조가 바뀌었는지 판단할 기준을 둔다.                                            |
| `migrate`            | 오래되었거나 잘못된 저장값을 현재 구조로 복구한다.                                           |
| `merge`              | 같은 version이어도 저장값이 잘못된 경우를 대비해 병합 전에 정규화한다.                       |
| `onRehydrateStorage` | localStorage 복원이 끝났음을 `hasHydrated`로 표시한다.                                       |

Next.js hydration mismatch를 피하기 위해 store 복원 전에는 헤더 count와 상품 버튼 포함 상태를 기본값으로 렌더링한다. 클라이언트에서 localStorage 복원이 끝난 뒤에 저장값 기준 UI로 전환한다.

잘못된 localStorage 값은 빈 배열 또는 유효한 string 배열로 정규화한다. 예를 들어 `wishlistProductIds: "24"`처럼 배열이 아닌 값이 들어와도 문자열을 쪼개지 않고 안전한 배열 상태로 복구한다.

## Advanced B: App Router 서버 prefetch

서버 prefetch는 초기 화면에 바로 필요한 데이터만 대상으로 했다.

| 대상                    | prefetch 여부                 | 이유                                                                       |
| ----------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| 홈 데이터               | 적용                          | 홈 첫 화면에서 바로 필요한 데이터다.                                       |
| 상품 목록 현재 URL 조건 | 적용                          | 공유 URL이나 새로고침 진입 시 첫 화면의 핵심 데이터다.                     |
| 상품 목록 모든 페이지   | 제외                          | 사용자가 볼지 모르는 페이지까지 미리 요청하면 비용이 커진다.               |
| 다음 페이지             | 클라이언트에서 1페이지만 적용 | 현재 페이지를 본 뒤 가장 가능성 높은 이동 대상만 제한적으로 미리 가져온다. |

요청마다 분리된 `QueryClient`를 만드는 이유는 서버 요청 간 캐시가 섞이면 안 되기 때문이다. 브라우저에서는 같은 `QueryClient`를 재사용해 클라이언트 이동 중 캐시를 유지한다.

초기 요청 중복 여부는 React Query Devtools와 Network 패널로 확인했다. 서버에서 prefetch된 현재 조건은 hydration된 캐시를 사용하고, 클라이언트에서는 같은 query key를 재사용한다.

## Advanced C: 사용자 경험 개선

| 개선                          | 적용 방식                                        | 이유                                                                |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| 검색어 debounce               | input draft state와 `useDebouncedValue` 사용     | 타이핑마다 URL과 API 요청을 바꾸지 않기 위해서다.                   |
| 다음 페이지 prefetch          | 현재 페이지 응답 후 `page + 1`만 `prefetchQuery` | 페이지네이션에서 가장 가능성 높은 다음 이동을 빠르게 하기 위해서다. |
| 페이지 변경 중 기존 목록 유지 | `placeholderData: keepPreviousData`              | 페이지 이동 중 목록이 사라지는 깜빡임을 줄이기 위해서다.            |
| 새로고침 없는 오류 재시도     | query `refetch`와 ErrorBoundary reset            | 일시적 API 오류 후 전체 페이지 새로고침 없이 복구하기 위해서다.     |

검색 input draft는 URL의 복사본이 아니라 입력 중 임시 상태다. 외부 URL 값이 바뀌면 guarded render-time adjustment로 draft를 맞추고, debounce가 끝난 값만 URL에 반영한다.

`상품 목록으로 이동하기 전 prefetch`는 이번 구현에서 제외했다. 상품 목록 페이지는 App Router page에서 현재 URL 조건을 서버 prefetch하고 `HydrationBoundary`로 전달한다. 따라서 홈에서 `/products`로 이동하기 전에 클라이언트에서 같은 목록을 다시 prefetch하면 초기 진입 최적화 역할이 겹친다. 이번 과제에서는 상품 목록 진입 전 prefetch보다, 사용자가 목록 화면에 들어온 뒤 실제로 가능성이 높은 다음 행동인 `page + 1`만 prefetch하는 편이 비용과 효과의 균형이 좋다고 판단했다.

## Advanced D: 테스트로 보호한 계약

| 테스트 대상            | 대표 테스트                                                    |
| ---------------------- | -------------------------------------------------------------- |
| Zustand action         | 위시리스트/장바구니 toggle, 잘못된 배열 상태 방어              |
| persist 복구           | version, partialize, 잘못된 저장값 정규화, hydration 완료      |
| Header 개수 파생       | store 복원 전/후 헤더 count 렌더링                             |
| 상품 버튼 selector     | store 복원 전/후 `aria-pressed` 상태                           |
| nuqs URL 조건          | 잘못된 page/category/sort 기본값 조회, URL 유지                |
| query key              | 상품 목록 query key가 조회 조건 전체를 포함                    |
| 페이지 보정            | 응답 이후 `page > totalPages`이면 마지막 페이지로 replace      |
| 홈과 목록 store 동기화 | 홈에서 찜한 같은 상품이 목록에서도 찜 상태로 표시              |
| 사용자 경험            | debounce, 다음 페이지 prefetch, 기존 목록 유지, 오류 재시도    |
| API 계약               | `/api/home`, `/api/products` 정상/empty/error/invalid scenario |

## 검증 기록

개발 중 다음 검증을 실행했다.

```bash
pnpm test
pnpm lint
pnpm format:check
pnpm typecheck
```

`pnpm lint`는 통과했지만 기존 `src/productList/components/ProductCard.tsx`의 `<img>` 사용 warning이 남아 있다. 이번 5주차 변경과 직접 관련된 warning은 아니다.

제출 전에는 `pnpm check`로 테스트, lint, 타입 검사, 프로덕션 빌드를 한 번에 확인한다.

## AI 사용 및 직접 검토

상태 경계, TanStack Query prefetch 전략, Zustand persist 복구 전략, 테스트 케이스 후보를 정리하는 과정에서 AI를 사용했다.

AI가 제안한 내용을 그대로 반영하지 않고 다음 기준으로 직접 검토했다.

- 과제 문서의 Source of Truth 기준에 맞는가
- 서버 데이터와 클라이언트 로컬 상태를 섞지 않는가
- URL 공유, 새로고침, 뒤로/앞으로 이동에서 조건이 복원되는가
- hydration mismatch를 만들지 않는가
- 테스트로 핵심 상태 계약이 보호되는가
