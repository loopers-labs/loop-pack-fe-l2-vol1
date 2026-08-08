# 7주차 2단계 — 최초 pending · 목록 갱신 · CLS

> 재현 조건은 [measurement-conditions.md](./measurement-conditions.md), Before 원본 관찰은 [baseline-and-regression.md](./baseline-and-regression.md) 0단계, 가설·반증 과정은 [diagnosis-log.md](./diagnosis-log.md)를 따른다. 상품 목록 pending·갱신·실패 상태 설계는 [product-list-pending-design.md](./product-list-pending-design.md) 참고.

---

## 2️⃣ 최초 pending · 목록 갱신 · CLS

slow API의 1.5초 지연은 그대로 둔다.

| 상태                    | 사용자에게 보여야 할 것                    | 이번 구현에서 보여준 화면                                                                                                                          | 대응하는 Query 상태                                                                                                                        |
| ----------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 데이터 없는 최초 진입   | 실제 목록 크기를 예상할 수 있는 pending UI | ✅ **해소.** 그리드 스켈레톤 12개(실제 `.product-grid` 재사용)가 초기 HTML에 포함되고, 데이터 도착 시 실제 12개로 교체. 서버 prefetch를 제거해 이 분기가 실제로 도달한다 — 5회 모두 `skeleton@26~50ms → grid@1549~1578ms` | `isPending` — 서버 prefetch 제거로 실제 도달 확인됨 |
| 이전 데이터가 있는 갱신 | 기존 목록을 비우지 않고 갱신 중임을 표시   | ✅ **해소.** 기존 목록 유지 + 상태줄 `총 30개 · 갱신 중` + 그리드 `is-stale`(opacity, 레이아웃 영향 없음) + `aria-busy=true`. 실측 확인 | `isFetching && !isPending` (신규 조건 요청이면 `isPlaceholderData`도 참) |
| 성공 + 0건              | 현재 URL 조건과 결과 0건임을 명시          | 일치 — "총 0개" + "검색 결과가 없습니다." + "다른 검색어나 카테고리를 선택해 보세요." 표시를 브라우저에서 확인 | `isSuccess`(데이터 있음, `totalCount === 0`)                                                                                               |
| 최초 실패               | 목록 대신 실패 이유와 다시 시도할 방법     | 일치 — 목록 대신 에러 문구와 "다시 시도" 버튼이 표시되는 것을 브라우저에서 확인 | `isError && !productList`                                                                                                                  |
| 갱신 실패               | 기존 목록을 유지한 채 갱신 실패와 재시도   | ✅ **해소, 재검증 완료.** 격리 headless Chrome + CDP `Fetch` 도메인으로 카테고리 변경 직후 `/api/products`만 500 강제해 재현. `git stash`로 수정 전(초안) 코드를 잠시 복원해 재빌드·재현한 뒤(`before-*.png`, `카드 0개` + 전체 `mock error`), `git stash pop`으로 `findLastSuccessfulProductList(queryClient)` 수정본을 복원해 같은 시나리오를 다시 실행(카드 12개 유지). 각 단계를 스크린샷 3장씩으로 대조했고, 판정 결과는 아래 Before/After 표에 옮겨 적었다 | `isError && !productList`일 때 `findLastSuccessfulProductList`로 대체 — 로컬 state·ref 복사 없이 query cache가 계속 소유 |
| 취소                    | 오류로 보이거나 현재 화면을 덮지 않음      | 일치 — 마지막 요청 결과만 반영, 에러 없음(0단계 확인) | react-query가 query key 변경 시 이전 요청을 자동 취소(`AbortSignal` 전파, `getProductList.ts:19`), 취소된 요청은 `isError`로 노출되지 않음 |

**갱신 실패 재검증** (`APP_ORIGIN=http://localhost:3000`로 재빌드·재기동한 production 서버, 기존 Chrome 세션과 별도 프로필·포트로 격리한 headless Chrome + CDP `Fetch` 도메인)

재현 방법: 최초 진입으로 목록 30개를 정상 로드시킨 뒤(이 시점까지는 `Fetch` 가로채기를 켜지 않아 실제 API가 그대로 응답), 그 이후부터 `Fetch.enable`로 `/api/products` 요청만 500으로 강제하고 카테고리를 캐주얼로 변경해 갱신을 유발했다. `git stash`로 수정 전(초안) 코드를 잠시 복원해 같은 시나리오를 먼저 실행하고, `git stash pop`으로 `findLastSuccessfulProductList` 수정본을 복원해 다시 실행해 대조했다.

| 항목 | Before (수정 전, `product-card` × 0) | After (수정 후, `findLastSuccessfulProductList` 적용) |
| --- | --- | --- |
| 결과 영역 | 전체가 `<div><p>mock error</p><button>다시 시도</button></div>`로 대체 | 기존 30개 목록 유지, `<div class="product-grid is-stale">` |
| 카드 개수 | 0 | 12 |
| 상태 문구 | 없음(필터 영역만 남고 목록 문맥 소실) | "갱신 실패 — 아래는 이전 조건의 결과입니다 · 총 30개" |
| 카테고리 select | `disabled: true`, `optionCount: 1`(`전체`만), `value: "all"`로 되돌아감 | `disabled: false`, `optionCount: 6`, `value: "casual"`(시도한 값 유지) |
| "다시 시도" 버튼 | 있음 | 있음 |
| 대조한 시점 (스크린샷 3장씩) | 최초 30개 정상 로드 → 갱신 요청 중 → 에러 응답 후 | 같은 3시점. 각 시점의 관찰 결과는 위 행들에 옮겨 적었다(이미지 원본은 로컬 보관) |

**판정**: [diagnosis-log.md](./diagnosis-log.md)의 "채택" 결정이 실제 코드 동작으로 확인됨. `findLastSuccessfulProductList`가 `queryClient.getQueryCache()`에서 가장 최근 성공 쿼리를 렌더 중에 직접 조회하는 방식이라(로컬 state·ref 복사 없음) react-query 캐시가 데이터를 계속 소유하고, 필터 UI는 사용자가 시도한 새 값을 그대로 유지해 "무엇을 눌렀는지" 잃지 않는다.

**URL ↔ 화면 정합성**

| 항목                                                         | 내용                                                                                                                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| query key와 실제 GET 요청에 함께 넣은 URL 조건               | `toProductListQuery`로 정규화된 `query`가 `productQueries.ts:19` 쿼리 키(`[...all(), 'list', query]`)와 `getProductList.ts:19`의 실제 GET 요청 파라미터에 동일하게 사용됨(코드 확인) |
| 빠른 연속 변경 후 마지막 URL의 active query와 화면 일치 확인 | 0단계 목록 녹화 확인 — 카테고리 150ms 간격 연속 변경 후 URL `?category=home&page=1`과 화면 결과("총 6개") 일치                                                                       |
| 이전 요청의 늦은 완료가 현재 화면을 덮지 않음을 확인한 방법  | 위 "취소" 행과 동일 관찰 — query key 기반 자동 취소로 늦게 도착하는 stale 응답이 반영되지 않음                                                                                       |
| 서버 응답을 Zustand·로컬 상태에 복사하지 않았음              | `ProductListSection.tsx` 전체에 Zustand import 없음, `useQuery`의 `data`를 그대로 렌더에 사용(코드 확인)                                                                             |

**전환 전략 선택**

| 전략                        | 적용 여부 | 근거 (적용 / 무개입 모두 기록)                                                                                                                                                                                                                  |
| --------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `placeholderData`           | 적용      | `productQueries.ts:24` `placeholderData: keepPreviousData` — 목록 갱신 시 기존 목록 유지 요구를 충족하는 데 필요, 0단계 목록 녹화로 효과 확인됨                                                                                                 |
| prefetch                    | 무개입    | Route prefetch·Query prefetch 모두 다음 페이지에 대한 사용자 의도 기반 prefetch가 없음(페이지네이션 버튼을 눌러야만 요청 시작). "다음 페이지 클릭마다 1.5초를 기다린다"는 문제가 아직 실측으로 확인되지 않아 우선순위를 낮게 둠 — 열린 항목     |
| `AbortSignal`               | 적용      | `productQueries.ts:20`의 `queryFn`이 받은 `signal`이 `getProductList.ts:19`를 거쳐 실제 `apiFetch`에 전달됨(코드 확인)                                                                                                                          |
| server prefetch + hydration | **철회(목록)** | `ProductListPage.tsx`에서 제거했다. 초기 HTML에 목록 데이터가 담기는 이점보다, `await`가 필터 셸(검색·카테고리·정렬)까지 1.5초 함께 막는 비용이 컸다. 제거 후 문서 응답 `time_starttransfer`가 **1.508~1.522 s → 0.007~0.010 s**로 줄고, 데이터 없는 최초 진입에 pending UI가 실제로 도달하게 됐다. 근거·감수한 비용(3단계 서버 호출 계수 관찰 축소)·대안 검토는 [product-list-pending-design.md](./product-list-pending-design.md) 참고. **홈은 그대로 유지**한다 |

**CLS** — fallback과 실제 콘텐츠 교체 시점의 Layout shifts 확인 결과: **0.** production build·viewport 1350×940에서 `PerformanceObserver('layout-shift')`로 5회 측정, 모두 CLS 0이고 layout-shift 엔트리 0건이다. 스켈레톤이 실제 목록과 같은 `.product-grid`·`.product-card`·`.product-card-image` 클래스를 그대로 써서 열 수(5/3/2)와 이미지 비율이 자동으로 일치하고, 카드 제목에 `min-height: 2lh`를 주어 이름이 1줄이든 2줄이든 같은 공간을 쓰게 했다.

측정 중 잡힌 초기 CLS 0.000141의 원인은 그리드가 아니라 **카테고리 select**였다 — 옵션이 서버 응답으로 채워지며 폭이 66px → 93px로 넓어져 옆의 정렬 라벨을 밀어냈다. `min-width: 7rem`으로 폭을 미리 예약해 0으로 만들었다.

**폴백 교체와 별개로 남은 구간**: 필터를 바꿔 결과가 교체될 때는 shift가 남는다. 30건 → 6건은 0.416(목록이 실제로 줄어 불가피), 정렬만 바꿔 건수가 같은 6건 → 6건도 0.226(본문 높이 1704 → 1761)이다.

**클램프 가설 검증 — 반려**

카드 제목이 2줄을 넘어 3줄이 되는 카드가 있어 카드 높이가 제각각(69~140px)이고, 그게 정렬 변경 시 레이아웃을 밀어 CLS를 만든다고 판단해 `.product-card h2, h3`에 `-webkit-line-clamp: 2`(제목 높이를 `min-height`가 아닌 `height`로 상한 고정)를 적용했다. 같은 6건→6건 정렬 변경 시나리오로 재측정한 결과:

| | 클램프 전 | 클램프 후 |
| --- | --- | --- |
| 카드 제목 높이 | 69~140px(들쭉날쭉) | 56px(6장 전부 균일) |
| 본문 높이(정렬 전→후) | 1703→1760 | 1617→1617(불변) |
| CLS | 0.217439 | **0.217439(동일)** |

카드 높이를 완전히 균일화했는데도 CLS가 클램프 전후로 조금도 안 변해 **가설이 틀렸음을 실측으로 확인했다.**

`LayoutShift.sources`를 직접 열어 기록해보니 원인은 카드 높이가 아니라 **같은 상품이 재정렬되며 `<article class="product-card">` DOM 노드 자체가 그리드 안에서 다른 칸으로 물리적으로 이동**하는 것이었다(예: x=800→68). React의 `key`로 재사용되는 노드가 자리를 옮기는 이동량 자체를 클램프는 줄이지 못해 애초에 무관한 대응이었다.

부수적으로 확인된 사실: CDP `Input` 도메인의 신뢰된(isTrusted) 클릭·키보드 이벤트로 재현해도 같은 CLS 값(0.21743931167879527)이 나왔다 — slow API의 1.5초 지연이 Layout Instability API의 500ms recent-input 유예 기간을 넘기기 때문에, 실제 사용자 조작이었어도 이 shift는 CLS에 그대로 집계된다.

**남은 과제**: 근본 원인(재정렬로 인한 DOM 노드 위치 이동)에 맞는 다음 시도는 아직 미정 — 열린 항목.

> 자동화 실측이 두 차례 막혔던 기록(로컬 Chrome 원격 디버깅 권한, auto mode classifier의 CDP `Emulation`/`Tracing` 차단)은 CDP 대신 `PerformanceObserver`를 쓰는 방식으로 우회해 해소했다. 이 방식은 CPU·네트워크 스로틀링을 재현하지 않으므로, 위 CLS는 스로틀링 없는 조건의 값이다.

**상품목록 SSR 재검증** (현재 커밋 `e040b92cf93788fc8cdabeda9ccc9e0167f12247`, `APP_ORIGIN=http://localhost:3000`로 재빌드·재기동한 production 서버에서, 기존 Chrome 세션과 별도 프로필·포트로 격리한 headless Chrome으로 확인)

| 항목 | 값 |
| --- | --- |
| SSR 문서 응답 5회 (`curl`, `time_starttransfer`) | 0.099 / 0.011 / 0.008 / 0.014 / 0.011 s (첫 회 콜드스타트 제외 4회 평균 0.011 s) — 기존 서술된 1.508~1.522 s → 0.007~0.010 s와 같은 자릿수로 일치 |
| SSR 초기 HTML | `curl`로 받은 초기 HTML에 `product-card-skeleton` 12개와 `aria-busy="true"`가 있는 것을 확인했다(응답 원본은 로컬 보관) — `PRODUCT_PAGE_SIZE=12`와 일치 |
| 스켈레톤 → 실데이터 전환 (CDP, page load 시점 기준) | t=384ms: skeleton 12/card 0/aria-busy=true → t=1082ms: 동일 → t=2208ms: skeleton 0/card 12/aria-busy=false (각 시점 스크린샷 4장으로 확인, 이미지 원본은 로컬 보관) |
| 레이아웃 일치 여부 (스크린샷 육안 대조) | 스켈레톤 5열 그리드와 실제 카드 5열 그리드의 카드 높이·시작 y좌표 동일. "총 30개" 문구가 스켈레톤이 있던 자리에 그대로 나타남 |

기존 문서 서술("skeleton@26~50ms → grid@1549~1578ms")과 이번 재검증(전환 완료 시점이 1082~2208ms 구간 안)은 같은 범위를 가리킨다 — 5회 반복이 아닌 CDP 폴링(150ms 간격)이라 전환 정확 시점을 좁히지 못했을 뿐, 결론(스켈레톤이 실 API 지연 1.5초 동안 유지되다가 교체됨)은 일치한다.
