# Week 07 Step 2 Products After

## 범위

Home Hero LCP 최적화와 Lighthouse 반복 측정은 다음 문서에 따로 기록했다.

- 1차 Hero after: [../../step-1-home-lcp/after/summary.md](../../step-1-home-lcp/after/summary.md)
- 최종 Hero after: [../../step-1-home-lcp/after-final/summary.md](../../step-1-home-lcp/after-final/summary.md)

이 문서는 2단계 요구사항인 Products 목록의 최초 pending, 기존 목록 갱신, 빈 결과, 실패, 취소 요청, CLS 관찰만 다룬다.

## 코드 기준

- 기준 브랜치: `feat/week-07`
- 관련 커밋:
  - `62c1df9` `fix: retain product list after refresh failure`
  - `1a3d15c` `fix: 상품 목록 요청에 abort signal 전달`

## 실행 조건

- 관찰 URL: `http://localhost:3000/products`
- slow API 실행:

  ```bash
  NEXT_PUBLIC_PRODUCT_API_SCENARIO=slow pnpm build
  NEXT_PUBLIC_PRODUCT_API_SCENARIO=slow pnpm start
  ```

- 개발 확인:

  ```bash
  NEXT_PUBLIC_PRODUCT_API_SCENARIO=slow pnpm dev
  ```

- 관찰 도구:
  - Chrome DevTools Network
  - Chrome DevTools Performance / Layout Shifts track
  - Chrome DevTools MCP Network request 목록

`scenario=slow`는 사용자 URL 상태에는 넣지 않고, 관찰 환경에서 API 요청에만 붙인다.

## 녹화 증거

- 상태 전환 녹화: [products-step2-states-network.mp4](./products-step2-states-network.mp4)

이 녹화에서는 Chrome DevTools Network를 함께 열어 상태표의 여섯 화면과 active request 취소 여부를 한 흐름에서 확인했다.

| 구간                    | 녹화에서 확인한 내용                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| 데이터 없는 최초 진입   | `/products?scenario=slow` 진입 후 실제 카드 크기를 예상할 수 있는 skeleton 표시       |
| 이전 데이터가 있는 갱신 | 검색어와 카테고리 변경 중 기존 목록을 비우지 않고 opacity가 낮아진 갱신 상태 표시     |
| 성공 + 0건              | `q=스탠리`, `category=goods` 조건에서 `총 0개`와 빈 결과 문구 표시                    |
| 최초 실패               | 목록 데이터가 없는 error 응답에서 실패 문구와 `다시 시도` 버튼 표시                   |
| 갱신 실패               | 기존 목록을 유지한 채 갱신 실패 배너와 `다시 시도` 버튼 표시                          |
| 취소                    | Network 패널에서 이전 active products 요청이 `(취소됨)`으로 표시되고 마지막 요청 완료 |

참고: 녹화에서 error/empty 상태를 한 번에 만들기 위해 `scenario`를 URL에서 API 요청으로 전달하는 임시 장치를 사용했다. 녹화 후 해당 임시 코드는 제거했고, 최종 코드 기준으로는 `scenario`가 사용자 URL 상태가 아니라 관찰 환경의 mock API 조건이다. CLS는 이 녹화가 아니라 Lighthouse report와 Performance trace를 별도 근거로 확인했다.

## 적용한 변경

- `productQueries.list`의 query key에 서버 응답을 바꾸는 조건 `q`, `category`, `sort`, `page`, `pageSize`를 포함했다.
- 실제 GET 요청에도 같은 조건을 전달한다.
- 기존 목록이 있는 갱신 중에는 `placeholderData: keepPreviousData`로 이전 목록을 유지한다.
- 갱신 중인 목록 영역에는 `aria-busy=true`와 opacity로 갱신 상태를 표시한다.
- 최초 실패와 갱신 실패를 분리했다.
  - 최초 실패: 목록 대신 실패 문구와 `다시 시도` 버튼을 표시한다.
  - 갱신 실패: 기존 목록을 유지하고 갱신 실패 배너와 `다시 시도` 버튼을 표시한다.
- 갱신 실패 후에는 서버 응답을 Zustand나 별도 로컬 상태에 복사하지 않고, 마지막으로 실제 표시된 query key로 React Query 캐시를 읽는다.
- TanStack Query의 `AbortSignal`을 `getProducts`와 `fetch`까지 전달해 active list request가 취소될 수 있게 했다.

## 상태별 관찰 기준

| 상태                    | 관찰 기준                                                     | 현재 처리                                                                                   |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 데이터 없는 최초 진입   | 실제 목록 크기를 예상할 수 있는 pending UI                    | `isPending`이고 표시 데이터가 없으면 `ProductGridSkeleton` 표시                             |
| 이전 데이터가 있는 갱신 | 기존 목록을 비우지 않고 갱신 중임을 표시                      | `keepPreviousData`, `isPlaceholderData`, `aria-busy=true`, opacity 적용                     |
| 성공 + 0건              | 현재 URL 조건과 결과가 0건임을 표시                           | `총 0개`와 `조건에 맞는 상품이 없습니다.` 표시                                              |
| 최초 실패               | 목록 대신 실패 이유와 다시 시도 방법 표시                     | `상품 목록을 불러오지 못했습니다.`와 `다시 시도` 버튼 표시                                  |
| 갱신 실패               | 기존 목록 유지, 갱신 실패와 다시 시도 방법 표시               | 기존 목록 유지, `상품 목록을 갱신하지 못했습니다. 기존 목록을 계속 보여드립니다.` 배너 표시 |
| 취소                    | 취소된 이전 요청이 오류로 보이거나 현재 화면을 덮지 않아야 함 | active list request가 `net::ERR_ABORTED`로 취소되고 최종 URL 결과가 화면에 남음             |

## `isPending`, `isFetching`, `isPlaceholderData` 역할

- `isPending`
  - 현재 query에 아직 성공 데이터가 없는 최초 진입 로딩을 구분한다.
  - 이때는 목록 대신 실제 카드 크기를 예상할 수 있는 skeleton을 보여준다.

- `isFetching`
  - 데이터 유무와 관계없이 네트워크 요청이 진행 중임을 나타낸다.
  - 화면 분기 자체는 사용자 관찰 기준에 맞춰 데이터 보유 여부와 `isPlaceholderData`를 함께 본다.

- `isPlaceholderData`
  - URL 조건이 바뀌었지만 이전 목록을 임시로 보여주는 갱신 중 상태를 구분한다.
  - 이때 목록은 유지하고 `aria-busy=true`를 적용한다.

## URL, query key, GET 요청 일치

상품 목록의 active query는 URL 상태에서 정규화한 값을 기준으로 만든다.

| 조건       | query key 포함 | GET query 포함  | 비고                   |
| ---------- | -------------- | --------------- | ---------------------- |
| `q`        | 포함           | 포함            | 검색어                 |
| `category` | 포함           | 포함            | 카테고리               |
| `sort`     | 포함           | 포함            | 정렬                   |
| `page`     | 포함           | 포함            | 현재 페이지            |
| `pageSize` | 포함           | 포함            | 목록 페이지 크기       |
| `scenario` | 제외           | 환경에서만 추가 | 사용자 URL 상태가 아님 |

예시 GET 요청:

```txt
/api/products?q=%EC%8A%A4%ED%83%A0%EB%A6%AC&category=all&sort=latest&page=1&pageSize=12&scenario=slow
```

최종 URL이 `/products?category=all&sort=latest&q=스탠리`일 때 화면은 `총 4개`의 스탠리 결과를 표시했다.

## 취소 요청 관찰

Chrome DevTools MCP로 slow dev 환경에서 검색어를 `스` -> `스탠` -> `스탠리` 순서로 연속 변경했다.

Network request 목록:

| 요청 | URL 조건             | 상태               |
| ---- | -------------------- | ------------------ |
| 193  | `q=스`, `page=1`     | `net::ERR_ABORTED` |
| 195  | `q=스탠`, `page=1`   | `net::ERR_ABORTED` |
| 197  | `q=스탠리`, `page=1` | `200`              |

상세 확인:

```txt
Request http://localhost:3000/api/products?q=%EC%8A%A4&category=all&sort=latest&page=1&pageSize=12&scenario=slow
Status: net::ERR_ABORTED
Request failed with net::ERR_ABORTED
```

```txt
Request http://localhost:3000/api/products?q=%EC%8A%A4%ED%83%A0&category=all&sort=latest&page=1&pageSize=12&scenario=slow
Status: net::ERR_ABORTED
Request failed with net::ERR_ABORTED
```

최종 화면은 `/products?category=all&sort=latest&q=스탠리` 조건과 일치했고, 취소된 요청은 오류 UI로 표시되지 않았다.

참고: `page=2` prefetch 요청은 일부 `200`으로 완료될 수 있다. 이 요청은 active list query가 아니라 다음 페이지 캐시 warming 용도이므로 현재 화면 결과를 직접 교체하지 않는다.

## 실패 상태 구분

### 최초 실패

데이터가 없는 상태에서 목록 요청이 실패하면 목록 영역 전체를 실패 UI로 대체한다.

- 표시 문구: `상품 목록을 불러오지 못했습니다.`
- 사용자 행동: `다시 시도` 버튼으로 `refetch`
- 기존 목록: 없음

### 갱신 실패

이미 목록이 표시된 상태에서 새 조건 요청이 실패하면 기존 목록을 유지한다.

- 표시 문구: `상품 목록을 갱신하지 못했습니다. 기존 목록을 계속 보여드립니다.`
- 사용자 행동: `다시 시도` 버튼으로 `refetch`
- 기존 목록: 유지
- 서버 응답 복사: 하지 않음. React Query 캐시에서 마지막 표시 query key의 데이터를 읽음.

## 빈 결과

검색어와 카테고리 조건이 성공적으로 반영된 뒤 결과가 0건이면 빈 상태를 표시한다.

- 예시 행동: `category=goods` 상태에서 `q=스탠리` 입력
- 기대 화면:
  - `총 0개`
  - `조건에 맞는 상품이 없습니다.`
- 판단: 실패가 아니라 성공 응답의 0건 상태로 구분한다.

## CLS 관찰

Products slow 조건을 Lighthouse navigation과 DevTools Performance trace로 나눠 확인했다.

- Lighthouse report: [products-slow-lighthouse.html](./products-slow-lighthouse.html)
- Raw trace: [products-slow-performance-trace.json.gz](./products-slow-performance-trace.json.gz)

### Lighthouse navigation

`/products` 최초 navigation 기준 Lighthouse 결과는 다음과 같다.

| 지표        | 값   |
| ----------- | ---- |
| Performance | 94   |
| FCP         | 0.8s |
| LCP         | 3.0s |
| TBT         | 10ms |
| Speed Index | 3.3s |
| CLS         | 0    |

초기 navigation에서는 skeleton과 실제 콘텐츠 교체가 Lighthouse CLS를 만들지 않았다.

### 조건 변경 Performance trace

같은 slow 조건에서 조건 변경 중 Layout Shifts track을 확인했다. 이 trace에서는 `LayoutShift` 이벤트가 10개 기록됐고, 그중 `had_recent_input=false`인 이벤트가 3개 있었다.

| 구분                               |      값 |
| ---------------------------------- | ------: |
| 전체 `LayoutShift` 이벤트 수       |      10 |
| `had_recent_input=false` 이벤트 수 |       3 |
| no recent input shift 합계         | `0.467` |
| 가장 큰 단일 shift                 | `0.197` |

영향 노드는 주로 상품 카드 `ARTICLE class='group grid gap-2.5'`였다. 기록된 rect는 아래 콘텐츠가 세로로 밀리는 형태가 아니라, 같은 줄에서 카드가 x축으로 재배치되거나 새 카드가 viewport 안에 등장하는 형태였다.

따라서 이 trace의 LayoutShift는 skeleton/fallback 높이 불일치보다 slow API 응답 후 실제 상품 grid가 새 결과로 교체되며 생긴 카드 재배치로 판단한다. Lighthouse navigation CLS는 0이지만, 조건 변경 interaction trace에서는 이 재배치가 LayoutShift로 기록되므로 후속 관찰 대상으로 남긴다.

### 추가 실험: min-height와 grid remount

멘토 피드백 후 Chrome DevTools MCP로 같은 production slow 조건에서 `all` -> `casual` 카테고리 변경을 다시 재현했다.

| 실험                                                   |   관찰 CLS | 판단                                                                 |
| ------------------------------------------------------ | ---------: | -------------------------------------------------------------------- |
| 기존 코드                                              | `0.253206` | 상품 `ARTICLE`가 기존 grid 위치에서 새 grid 위치로 이동하며 기록됨   |
| 상품 목록 컨테이너에 현재 높이 `min-height` 임시 고정  | `0.253206` | 아래 영역 밀림은 줄일 수 있지만, grid 내부 카드 이동 source는 유지됨 |
| `ProductGrid`를 결과 상품 id 목록 기준 `key`로 remount | `0.000166` | 카드 DOM 이동은 줄었지만, 하위 카드 DOM 재사용을 포기하는 비용 발생  |

따라서 이 케이스의 주된 source는 목록 전체 높이 축소보다 같은 상품 카드 DOM이 새 결과 grid에서 다른 위치로 재사용되는 동작으로 판단했다. `ProductGrid`에 결과 id 기반 `key`를 주면 수치는 크게 줄었지만, 카드 하위 트리를 매번 remount해 포커스, 이미지, 내부 상태, 렌더 비용에 영향을 줄 수 있다.

최종 코드에는 이 실험 변경을 반영하지 않았다. 현재 상품 카드는 가볍지만, CLS 수치를 줄이기 위해 DOM 재사용을 포기하는 방식은 과한 처방으로 판단했다. 실무 개선으로 이어간다면 단순 `key`보다 이전 grid와 새 grid를 분리한 전환 UI, 또는 결과 영역의 높이와 교체 타이밍을 함께 설계하는 방향을 우선 검토한다.

## 검증

코드 변경 후 다음 검증을 통과했다.

```bash
pnpm vitest run src/_pages/products/ui/ProductListPage.test.tsx src/_pages/products/ui/ProductListCommerceState.test.tsx src/_pages/products/api/productApi.test.ts src/_pages/products/queries/productQueries.test.ts
pnpm lint
pnpm typecheck
pnpm format:check
```

결과:

- Vitest: 4개 파일, 21개 테스트 통과
- ESLint: 통과
- TypeScript: 통과
- Prettier check: 통과

## 판단

- `placeholderData: keepPreviousData`는 갱신 중 이전 목록을 유지하는 데 충분하지만, 새 query가 실패 상태로 확정된 뒤에는 이전 데이터를 자동 유지하지 않는다.
- 갱신 실패 요구사항을 만족하기 위해 서버 응답을 복사하지 않고 마지막 표시 query key만 기억해 React Query 캐시를 읽었다.
- active list request에는 `AbortSignal`을 전달해 이전 검색 요청이 `net::ERR_ABORTED`로 취소되는 것을 확인했다.
- `prefetch`는 다음 페이지 체감 전환을 위한 캐시 warming으로 유지했다. prefetch 요청이 완료되어도 현재 화면의 active query 결과를 직접 덮지 않는다.
- Lighthouse navigation CLS는 0이지만, 조건 변경 Performance trace에서는 slow API 응답 후 실제 상품 grid가 새 결과로 교체되는 시점에 카드 재배치가 LayoutShift로 기록됐다.
- 추가 실험에서 컨테이너 `min-height`는 카드 재배치 source를 줄이지 못했고, grid remount는 수치를 줄였지만 DOM 재사용을 포기하는 trade-off가 있어 최종 반영하지 않았다.
- CLS를 더 줄이는 후속 실험으로는 이전 grid와 새 grid를 분리한 overlay 전환이 있지만, 현재는 코드 복잡도와 UX 영향이 커서 적용하지 않았다.
