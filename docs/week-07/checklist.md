# 7주차 체크리스트

> 전체 결과와 핵심 판단을 먼저 보려면 [7주차 성능 측정 및 개선 요약](README.md)을 확인한다.

7주차 발제(성능 최적화: 사용자 경로별 병목 측정과 개선)의 체크리스트다. 진행 순서는 [plan.md](plan.md), Basic 측정 기록은 [measurement.md](measurement.md), 선택 과제는 [Advanced A — INP 측정 및 개선](advanced-a-inp.md)에 있다.

⚠️ 발제 슬라이드와 과제 명세(`docs/assignments/week-07.md`)가 어긋나는 항목은 **명세를 따른다.** 슬라이드는 정적 `metadata`면 충분하다고 하지만 명세 3단계는 `generateMetadata`와 Open Graph를 요구한다.

## 이번 주에 다루지 않는 것

- Basic에서 Next Cache API를 새로 도입하지 않는다. 캐시는 Advanced B에서만 선택한다.
- `cacheComponents`를 누적 과제 브랜치에서 바로 켜지 않는다.
- OG 이미지 생성(`opengraph-image`), sitemap, robots 정책, JSON-LD까지 확장하지 않는다. 동적 `metadata`와 Open Graph 필드 자체는 명세 3단계의 필수 범위다.
- 가상화나 무거운 라이브러리를 과제를 위해 새로 추가하지 않는다.
- API의 고정 지연(1.5초)을 줄이거나 제거해서 개선했다고 제출하지 않는다.
- 여러 최적화 기법을 한 번에 적용하지 않는다.

## 공통 측정

- [x] production build(`pnpm build && pnpm start`)에서 측정했는가
- [x] URL·사용자 행동·viewport·throttling을 기록했는가 — [측정 조건](measurement.md#홈--측정-조건). **뷰포트는 Before가 미기록**이라 "같다"고 적지 못하고 그대로 남겼다
- [x] cold load와 warm navigation을 구분했는가 — 전 측정이 cold load다. 조건 표에 명시했다
- [x] Lighthouse 5회와 중앙값을 남겼는가
- [x] Before / After commit SHA와 원값(최솟값·최댓값)을 남겼는가 — Before `3da2db4`, After `a081464`
- [x] 변경 전 원인 가설과 반증 방법을 기록했는가 — [관찰 → 가설 → 반증 → 최소 변경](measurement.md#관찰--가설--반증--최소-변경)
- [x] 같은 조건의 Before / After를 비교했는가
- [x] 변화가 측정 흔들림보다 컸는지 확인했는가 — 5회 범위가 겹치면 개선이라고 쓰지 않았다(개입 3이 그 사례다)

## 홈 히어로와 렌더링 경계

- [x] 실제 FCP와 LCP element를 확인했는가 — LCP element는 hero `<img>`다
- [x] 느린 hero 데이터가 셸까지 막는지 확인했는가 — Before에서 `h1`이 566.0ms에야 등장했다
- [x] 헤더·`h1`·설명 같은 RSC 셸이 먼저 렌더링되는가 — `HomePage`를 async에서 빼고 `h1`·설명을 페이지가 소유하게 바꿨다
- [x] 느린 영역이 선택한 경계의 Suspense fallback 또는 Query pending UI에서 기다리는가 — 홈은 Suspense 2개, 목록은 Query pending
- [x] streaming, Client Query, hydration 중 선택한 이유를 설명했는가 — 홈은 server prefetch + hydration, 목록은 Client Query
- [ ] **RSC가 자기 Route Handler를 HTTP로 호출하지 않는가 — 충족하지 못한다.** `getHome`·`getProductList`가 `fetch('${APP_ORIGIN}/api/…')`로 자기 Route Handler를 부른다.

이 항목만 발제와 명세가 어긋난다. 명세는 이 구조를 전제로 "같은 render의 동일 native fetch가 request memoization으로 합쳐지는지"(142~143줄)와 "서버 측 계수로 Route Handler 호출 횟수 확인"(154줄)을 요구하고, 87줄에서 "기존 Route Handler 내부와 누적 FSD 구조를 성능 과제 때문에 다시 설계하지 않는다"고 못 박는다. 이 문서 5번 줄의 원칙대로 **명세를 따라 구조를 유지했고**, 대신 명세가 요구한 memoization 근거를 [측정으로 남겼다](measurement.md#개입-4--hero의-이미지와-카피를-분리한다).

### 렌더링 경계 선택 기준

| 상황                                         | 먼저 검토할 경로            | 선택 이유                                     |
| -------------------------------------------- | --------------------------- | --------------------------------------------- |
| 읽기 중심이고 서버에서 바로 조합할 수 있다   | async RSC + `Suspense`      | Client JS 없이 서버 결과를 스트리밍할 수 있다 |
| URL 조건이 자주 바뀌고 브라우저 cache를 쓴다 | Client `useQuery`           | pending·refetch·prefetch를 한 계약에서 관리   |
| 초기 HTML에도 데이터가 필요하고 이후 Query가 | server prefetch + hydration | 서버 Query Cache를 브라우저가 이어받는다      |

`Suspense`는 어느 UI를 먼저 보낼지 정하고, `HydrationBoundary`는 서버 QueryClient 스냅샷을 브라우저에 전달한다. 같은 기능이 아니다. Client `useQuery`로 브라우저에서 가져오는 것은 streaming도 selective hydration도 아니다.

## CLS와 느린 API UX

- [x] fallback이 실제 hero·목록과 비슷한 공간을 예약하는가
- [x] fallback이 실제 카드와 같은 grid·이미지 비율·responsive CSS를 쓰는가
- [x] Layout shifts track에서 이동한 요소를 확인했는가 — 트레이스 `LayoutShift` 집계 + Step 7 캡처
- [x] 최초 `isPending`과 갱신 중 `isFetching`을 다르게 보여주는가 — [`isFetching` 대신 `isPlaceholderData`를 쓴 이유](measurement.md#ispending과-isfetching이-각각-맡는-화면)
- [x] query key에 서버 응답을 바꾸는 조건이 모두 있는가 — `productQueryKeys.list(params)`가 `params` 전체를 담는다
- [x] queryFn의 `AbortSignal`을 실제 `fetch`에 전달했는가 — `c29ccaa`
- [x] 빠른 연속 변경 뒤 URL과 상품 결과가 일치하는가 — 시나리오 5 녹화, Step 7 회귀에서 재확인
- [x] 이전 데이터·prefetch·cancellation 중 필요한 전략을 증거로 선택했거나 무개입 근거를 남겼는가 — 6상태 중 2건만 개입하고 나머지는 무개입 근거를 남겼다
- [x] 갱신 실패·빈 결과·취소를 서로 다른 상태로 처리했는가 — `e836a06`, `c29ccaa`
- [x] slow API의 고정 지연을 제거하지 않았는가 — 측정용 `scenario=slow` 임시 패치는 관찰 후 되돌렸다

서버 대기 시간(1.5초)과 INP를 같은 숫자로 부르지 않는다. INP는 클릭 뒤 다음 paint가 메인 스레드 작업으로 얼마나 막혔는지를 본다.

## SEO

- [x] 페이지마다 의미 있는 title과 description이 있는가 — `generateMetadata` 2개
- [x] 초기 응답에 하나의 명확한 `h1`과 설명이 있는가 — 두 벌 실리던 목록 `h1`을 `875bfd6`에서 정리했다
- [x] `main`, `nav`, `section`의 역할을 설명할 수 있는가 — `PageContainer`가 `main`, `Header`·`Pagination`이 `nav`, 콘텐츠 묶음이 `section`이다
- [x] 주요 이동 경로가 `href`를 가진 링크인가 — 헤더 탐색과 홈 카테고리가 `Link`다. 상품 상세 라우트는 아직 없어 카드에 링크가 없다
- [x] 의미 있는 이미지에 적절한 `alt`가 있는가 — `ProductCard`는 `alt={product.name}`, 장식용 hero는 `alt=""`
- [x] Network Response나 View Source에서 초기 HTML을 확인했는가 — `curl` document와 JS 비활성 캡처 두 가지
- [ ] **(명세 추가분) 상품 목록 초기 HTML에 상품 데이터가 없다.** 목록 조회가 클라이언트 전용이라 문서에 카테고리 이름 0회·상품 링크 0개다(홈은 실린다). [근거와 남긴 이유](measurement.md#js-비활성--화면과-문서가-다르다)

Elements 패널은 JavaScript 실행 뒤의 DOM이다. 서버가 만든 HTML은 `curl -s http://localhost:3000/products`, View Source, JS 비활성 요청으로 확인한다.

위 항목은 발제의 Basic 범위다. 이 레포의 과제 명세 3단계는 여기에 더해 `generateMetadata`, 루트 title template·공통 Open Graph, shallow merge 처리, 정상 empty와 query failure의 서로 다른 fallback, 서버 호출 계수, 일반 UA와 `facebookexternalhit` 응답 시점 비교까지 요구한다. 해당 체크 항목은 `docs/assignments/week-07.md`에 있고 진행 순서는 [plan.md](plan.md) Step 6에 있다.

## Advanced A — INP (선택)

- [x] `pageSize=24`와 API 로딩 완료 조건에서 측정했는가 — 이미지 24장 로드 후 첫 번째 카드 클릭
- [x] Performance에서 `4x slowdown`과 같은 찜 클릭을 사용했는가 — Network는 No throttling
- [x] 같은 초기 찜 상태에서 Before / After를 각각 3회 반복했는가 — 매 회차 전부 찜 해제 상태로 새로고침
- [x] Interaction의 input·processing·presentation 구간을 기록했는가 — INP 중앙값 107.2ms → 35.6ms
- [x] Profiler에서 Before의 전체 카드 렌더를 확인했는가 — `PerformanceProductCard` `p1`~`p24`
- [x] selector 또는 컴포넌트 경계를 바꾼 근거가 있는가 — `SyncExternalStore` 변경으로 관계없는 23장까지 렌더되는 것을 확인한 뒤 selector 변경
- [x] After에서 관계없는 카드의 렌더가 줄었는가 — 24장 → 누른 카드 1장
- [x] 카드 수·필수 계산·즉시 피드백을 제거하지 않았는가 — 회귀 4항목 전부 통과. 카드 24장, `화면 계산` 표시, 즉시 토글 유지
- [x] Lighthouse TBT를 INP 증거로 제출하지 않았는가 — production Performance 트레이스의 EventTiming만 사용

측정 없이 `memo`부터 붙이지 않는다. 넓은 selector(`state.wishlistIds` 배열 전체 구독)를 필요한 값(boolean)으로 좁혔다. 렌더 원인은 webpack dev 서버(`pnpm exec next dev --webpack`)에서 확인했고, 그 commit 시간을 일반 production build 숫자와 직접 비교하지 않았다. `pnpm next build --profile`은 Next 16(build 기본이 Turbopack)에서 무시돼 React DevTools가 붙지 않았다 — 근거는 [Advanced A — INP 측정 및 개선](advanced-a-inp.md#react-profiler를-붙이는-데-네-번-걸렸다)에 적었다.

### 진행 결과 — 완료

선행 조건인 Basic 4단계를 끝내고 [측정 화면](../../app/performance-lab/inp/page.tsx)에서 Before를 측정했다. production 트레이스에서는 processing이 79.26ms로 가장 컸고, Profiler에서는 첫 번째 카드 한 장을 눌렀을 때 24장이 모두 `SyncExternalStore` 변경으로 렌더됐다.

관계없는 카드 렌더 병목을 확인한 뒤 배열 전체 대신 카드별 boolean을 구독하도록 selector 한 줄만 변경했다. `memo`, 카드 수, `calculateCardPresentation`, 상태 갱신 시점에는 손대지 않았다.

| 항목              | Before         | After               |
| ----------------- | -------------- | ------------------- |
| 렌더된 카드       | 24장           | 누른 카드 1장       |
| INP 중앙값        | 107.2ms        | 35.6ms (`−67%`)     |
| processing 중앙값 | 79.26ms        | 8.59ms (`−89%`)     |
| selector          | 배열 전체 구독 | 카드별 boolean 구독 |

감소한 총 71.6ms 중 70.7ms가 processing에서 나왔다. input delay와 presentation delay는 거의 그대로라 관계없는 카드 렌더 제거가 processing 감소로 이어졌다는 해석과 맞는다. Before·After 모두 INP 200ms 이하이므로 등급 변화가 아니라 processing 감소를 개선 근거로 삼는다.

`app/performance-lab/` 안에서만 고치면 홈·상품 목록의 After SHA(`a081464`)가 가리키는 측정에는 영향이 없다. Advanced A는 별도 SHA로 기록한다.

전달 항목을 모두 마쳤다.

- [x] After Profiler의 `Why did this render?` 캡처 — 클릭 커밋에서 `p1` 한 장만 `SyncExternalStore`로 렌더. 원인 문구는 Before와 같고 범위만 줄었다
- [x] 측정 뷰포트 값 기록 — 960 × 929, dpr 1(스크롤바 제외 콘텐츠 폭 945). 두 값 모두 3열 구간이라 레이아웃은 동일하다
- [x] 카드 24장·필수 계산·즉시 피드백·복수 카드 상태 회귀 확인 — 4항목 전부 통과
- [x] `pnpm lint && pnpm exec tsc --noEmit` — 통과
- [x] Advanced A After SHA 기록 — **`f50b925`** (Before `8aa15c5`)

Advanced B(Next Cache)는 하지 않는다. 과제 명세의 선택 원칙대로 하나를 끝까지 하는 편이 낫고, `cacheComponents: true` starter를 따로 검증해야 해서 비용이 훨씬 크다.

## Advanced B — Next Cache (선택)

- [ ] 별도로 검증한 `cacheComponents: true` starter에서 진행했는가
- [ ] 전체 document·반복 HTTP 측정 경로와 client navigation 경로를 나누고 실제 경로에 있는 캐시만 그렸는가
- [ ] 캐시의 저장 위치·재사용 범위·신선도 시계·무효화 사건을 기록했는가
- [ ] cold miss와 warm hit의 서버 요청 여부, request counter, 원본 호출 횟수와 표시 시점을 비교했는가
- [ ] 같은 비교에서는 `measurementRunId`를 유지하고 `dataVersion`을 캐시 키에서 제외했는가
- [ ] `revalidateTag(tag, "max")`를 골랐다면 첫 읽기의 이전 값과 원본 재호출, 갱신 완료 신호, 그 뒤 읽기의 새 값을 확인했는가
- [ ] `updateTag(tag)`를 골랐다면 첫 읽기가 새 값을 기다리고 이전 값을 노출하지 않았는가
- [ ] `router.refresh()`를 서버 캐시 무효화로 설명하지 않았는가
- [ ] Next Cache와 Query Cache의 TTL 숫자만 맞추지 않았는가
- [ ] Redis·CDN·다중 인스턴스 구현을 과제에 추가하지 않았는가

| 사용자 경험                                    | 선택                        |
| ---------------------------------------------- | --------------------------- |
| 잠깐 이전 값을 보여줘도 되고 빠른 응답이 중요  | `revalidateTag(tag, "max")` |
| 방금 저장한 값을 같은 사용자에게 바로 보여준다 | `updateTag(tag)`            |
| 특정 page·layout의 렌더 결과를 다시 확인       | `revalidatePath(path)`      |
| 브라우저 Query Cache만 다시 가져온다           | `invalidateQueries()`       |

## 회귀와 설명

아래 항목은 [Step 7 — 회귀 확인](measurement.md#step-7--회귀-확인)에서 한 번에 확인했다.

- [x] URL, Query, Zustand, 로컬 상태의 책임이 유지되는가 — 서버 응답을 Zustand로 복사한 곳이 없다
- [x] 검색·카테고리·정렬·페이지가 URL에서 복원되는가 — 5개 상태 왕복, 주소창과 컨트롤이 전부 일치
- [x] 뒤로 가기와 앞으로 가기가 같은 화면을 복원하는가
- [x] 장바구니·위시리스트와 Header 개수가 일치하는가 — persist와 두 store 독립성까지 확인
- [x] FSD 의존 방향과 Public API가 유지되는가 — lint 통과, `boundaries` 예외 0건, 우회 import 0건. `eslint-disable`은 `HeroSection.tsx`의 `@next/next/no-img-element` 1건뿐이고, 후보 파일을 직접 만들어 런타임 변환 없이 측정을 재현하려는 의도적 예외다
- [x] 로딩·에러·빈 상태·재시도가 동작하는가 — 차단 해제 후 `다시 시도`로 복구되는 것까지 확인
- [x] 효과가 없던 변경을 되돌리거나 유지 이유를 기록했는가 — 개입 3(preload)은 되돌렸고, 갱신 중 CLS 0.37은 유지 근거를 남겼다
- [x] `pnpm check`가 통과하는가 — 통과. E2E는 35/36(WebKit 1건은 6주차부터 기록된 플래키)
- [x] 왜 이렇게 설계했는지 한 줄 근거가 있는가
- [x] AI로 생성한 부분을 표기하고 직접 검토했는가 — 각 문서 끝에 분담을 적었다

Basic의 미흡함을 Advanced 구현으로 상쇄하지 않는다. Advanced A와 B는 독립된 선택 과제이고, 도전한다면 둘 다 하는 것보다 하나를 재현·가설·변경·검증까지 끝내는 편이 낫다.

---

이 문서는 Claude(AI)가 7주차 발제 자료를 이 레포 기준으로 정리해 작성했다.

체크 표시는 Claude(AI)가 각 항목을 코드와 [measurement.md](measurement.md), [advanced-a-inp.md](advanced-a-inp.md)의 근거에 대조해 채웠다. Advanced A의 회귀 4항목과 After `Why` 캡처는 작성자가 직접 확인·수행한 결과를 AI가 옮겨 적었다. 근거를 찾지 못한 Basic 두 항목(RSC의 Route Handler HTTP 호출, 상품 목록 초기 HTML의 상품 데이터)은 체크하지 않고 사유를 적었다. 측정과 스크린샷은 작성자가 직접 수행했다. Advanced A의 개입 후보는 처음에는 AI가 코드를 읽고 세운 가설이었고, 작성자가 Before Profiler에서 카드 24장의 렌더와 `SyncExternalStore` 변경 원인을 확인한 뒤 적용했다. 트레이스 6건의 계산과 해석은 AI가 수행했다.
