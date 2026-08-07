# 7주차 성능 — 수치가 아니라 원인을 고친다

점수를 올리는 것이 목적이 아니다. 무엇이 느린지를 측정으로 특정하고, 그 원인 하나에
대응하는 변경을 하나씩 넣고, 같은 조건으로 다시 재서 인과를 확인한다.

이 문서는 각 커밋이 어떤 측정에서 나왔고 무엇을 바꿨고 그 결과가 얼마였는지를 남긴다.
개선되지 않은 지표와 적용하지 않은 제안도 함께 적는다.

## 사용한 도구와 버전

| 도구 | 버전 | 이 글에서 쓴 것 |
| --- | --- | --- |
| Next.js | 16.2.10 (App Router) | RSC, `Suspense`, streaming metadata, `next/image` |
| React | 19.2.4 | `cache()`, `connection()`, `<Profiler>` |
| TanStack Query | 5.101 | `prefetchQuery`, `HydrationBoundary`, `keepPreviousData` |
| nuqs | 2.9 | `useQueryStates`, `createLoader` (`nuqs/server`) |
| Zustand | 5.0 | selector 구독 |
| Lighthouse | 12.8.2 | headless, 기본 모바일 프리셋 |
| Playwright | 1.62.1 | 상호작용 측정, 레이아웃 측정, 기능 회귀 |

## 측정 환경

| 항목 | 값 |
| --- | --- |
| 빌드 | production build (`next build`), `next start` |
| Lighthouse | 12.8.2 headless, 기본 모바일 프리셋 (412×823, DPR 1.75, CPU 4배, slow 4G) |
| 반복 | 지표마다 5회, 중앙값과 범위를 함께 적는다 |
| 프로필 | 회차마다 새 사용자 프로필 |
| 서버 | 로컬 `127.0.0.1`, `APP_ORIGIN`으로 자기 주소 주입 |

### 비교 SHA

| 구분 | SHA | 설명 |
| --- | --- | --- |
| Before | `3aa1981` | 병합 시작점. 별도 worktree에 이 커밋을 체크아웃해 같은 방식으로 빌드했다 |
| After | `36e31e0` | Basic 마지막 커밋 |

Advanced A 커밋 `3dc3726`은 `/performance-lab/inp`만 바꾼다. `/`와 `/products`의 위 수치는
`36e31e0` 기준이고 이후 커밋이 두 화면을 건드리지 않는다.

로컬 단일 머신 측정이다. 절대값은 이 환경의 값이고, 판단의 근거로 쓰는 것은 같은 조건에서의 차이다.

## 1. 최종 Before / After

### `/` 홈

| 지표 | Before 중앙 [범위] | After 중앙 [범위] |
| --- | --- | --- |
| LCP | 42,175 ms [42,169~42,184] | **3,131 ms** [3,129~3,341] |
| CLS | 0.065 [변동 없음] | **0** [변동 없음] |
| FCP | 1,360 ms [1,357~1,363] | 2,259 ms [2,258~2,260] |
| TBT | 13 ms [9~19] | 1 ms [0~10] |
| Speed Index | 1,572 ms [1,482~1,948] | 2,259 ms [2,258~2,260] |
| Performance | 74 | 91 |

```
Before  FCP 1360,1363,1357,1357,1360   LCP 42175,42184,42170,42169,42175   CLS 0.065×5
After   FCP 2260,2259,2258,2258,2259   LCP  3341, 3129, 3131, 3131, 3143   CLS 0×5
```

### `/products` 목록

| 지표 | Before 중앙 [범위] | After 중앙 [범위] |
| --- | --- | --- |
| FCP | 1,358 ms [1,356~1,360] | **1,205 ms** [1,204~1,205] |
| LCP | 3,217 ms [3,215~3,221] | **2,465 ms** [2,454~2,466] |
| CLS | 0 | 0 |
| TBT | 6 ms [5~9] | 6 ms [0~7] |
| Performance | 93 | 97 |

```
Before  FCP 1357,1359,1356,1358,1360   LCP 3215,3218,3221,3216,3217
After   FCP 1204,1205,1205,1205,1205   LCP 2466,2455,2465,2454,2466
```

## 2. 홈 LCP — 42초의 정체

LCP 후보 원소는 Before와 After 모두 같은 Hero 이미지다. 바뀐 것은 그 이미지가 무엇으로
어떻게 도착하느냐다.

| 측정 | Before | After |
| --- | --- | --- |
| Hero 전송량 | 7,545,525 B | **32,425 B** |
| Hero 요청 시작 시각 | 626 ms | **36 ms** |
| LCP element | `<img class="week07-hero-image" src="/images/week-07/hero-original.jpg">` | 같은 Hero, `data-nimg` 최적화 경로 |
| document | 9,107 B / TTFB 2 ms | 32,947 B / TTFB 6 ms |

원인은 두 가지가 겹쳐 있었다.

**크기.** 3840×2160 원본 7.2 MB를 그대로 내려보내고 CSS로 줄여 그렸다. 모바일 프리셋의
표시 폭은 388 CSS px, DPR 1.75로 679 물리 px이면 충분하다. `next/image`에 실제 표시 폭을
알려주는 `sizes`를 붙여 후보 폭을 좁혔다.

```
sizes="(max-width: 760px) calc(100vw - 24px), (min-width: 1488px) 1440px, calc(100vw - 48px)"
```

세 구간인 이유는 760px 이하에서 컨테이너 padding이 24px이고 그 위에서 48px이기 때문이다.
두 구간으로 적으면 좁은 화면에서 필요한 것보다 큰 후보를 고른다.

**발견 시각.** Before는 홈 셸 전체가 조회 결과를 기다렸다. 데이터가 오기 전에는 화면에
`Loading home…` 한 줄뿐이라, Hero는 초기 HTML에 존재하지 않았고 브라우저가 626 ms까지
그 이미지의 존재를 몰랐다.

`13b5113`에서 셸을 서버 컴포넌트로 올리고 조회 부분만 `Suspense` 안으로 내렸다. Hero가
첫 응답 HTML에 들어가면서 preload 힌트가 함께 나가고, 요청이 36 ms에 시작된다.

여기서 처음에 틀린 판단을 했다. `next/image`의 `preload` prop이 힌트를 만든다고 적었는데,
실제로는 **React 19가 서버에서 렌더된 non-lazy `<img>`에 대해 `<link rel="preload">`를
발행**한다. 평범한 `<img>`로 바꿔도 힌트가 남는 것을 확인해 검증했다. 즉 결정적인 변수는
prop이 아니라 **Hero가 서버 셸에 있느냐**였다.

CLS 0.065도 같은 커밋에서 사라졌다. 로딩 문구 한 줄이 실제 콘텐츠로 교체되며 밀리던 것이
원인이고, 셸이 처음부터 최종 높이를 잡으면서 이동이 없어졌다.

## 3. 개선되지 않은 것 — 홈 FCP 899 ms 악화

숨기지 않는다. 홈 FCP는 1,360 ms에서 2,259 ms로 나빠졌다.

`13b5113`에서 셸을 서버로 올리며 초기 HTML에 한글 제목과 설명이 들어갔다. 그 시점에
첫 200 ms 구간의 Pretendard 한글 서브셋 요청이 **2개 64 KB에서 7개 183 KB로** 늘었다.

반증 실험을 두 개 했다.

| 실험 | 결과 | 해석 |
| --- | --- | --- |
| Hero 이미지를 통째로 차단 | FCP 2,257 ms로 그대로 | 이미지가 FCP를 밀어낸다는 가설은 반증됨 |
| 문구만 라틴 문자로 치환 | FCP 1,357 ms로 복귀 | 한글 문구가 원인 변수 |

다만 Lighthouse Lantern의 내부 요청 스케줄링까지는 관측하지 않았다. **한글 문구가 원인
변수라는 것까지가 확인된 범위이고, 구체적인 지연 기전은 확정하지 않았다.**

되돌리지 않은 이유는 **두 FCP가 같은 것을 재고 있지 않기 때문이다.** Before의 첫 페인트는
`Loading home…` 한 줄이고, After의 첫 페인트는 제목과 설명과 Hero가 있는 실제 셸이다.
사용자가 그 시점에 보는 것이 다르다. LCP 42.2초를 3.1초로 줄이고 CLS를 없앤 대가로
"글자 한 줄이 먼저 뜨는 시점"을 899 ms 내준 것으로 판단했다.

## 4. 목록 화면의 여섯 상태

목록은 조회 결과 하나에 여섯 가지 화면이 있다. 각 상태를 URL로 재현할 수 있게 만들고
production 빌드에서 확인했다.

| 상태 | 재현 | 화면 |
| --- | --- | --- |
| 최초 로딩 | `/products` 첫 진입 | 개수 행, 안내 행, 카드 12개, 페이지네이션까지 자리를 잡은 skeleton |
| 성공 | `/products` | 개수 행과 목록 |
| 조건 전환 중 | 정렬 변경 | 이전 목록 유지, `Updating…`, 페이지 이동 버튼 잠금 |
| 갱신 실패 | `?scenario=error` (2회차) | 이전 목록 유지, 실패 문구와 `Try again` |
| 0건 | `?scenario=empty` 또는 `?q=니트` | 개수 0과 무엇을 걸어서 0건인지 설명하는 문장 |
| 조회 실패 | `?scenario=error` (최초) | 실패 종류에 맞는 출구 하나 (재시도 / 초기화 / 홈) |

### 레이아웃 이동 0

skeleton은 카드 그리드만 잡으면 부족했다. 개수 행과 **성공 상태가 늘 비워 두는 안내 행**과
페이지네이션까지 같은 높이로 예약해야 결과가 도착할 때 목록이 내려가지 않는다.

안내 행을 26px 고정으로 남긴 것이 특히 그렇다. `scenario=error`는 1.5초 뒤에 실패 문구를
띄우는데, 그 자리가 예약되어 있지 않으면 이미 읽고 있던 목록이 그 순간 아래로 밀린다.
`PerformanceObserver`로 `layout-shift` 엔트리를 수집해 `shifts: []`를 확인했다.

셸 분리가 레이아웃을 바꾸지 않았다는 것도 확인했다.

| | Before | After |
| --- | --- | --- |
| desktop 첫 카드 top / docH | 684 / 2338 | 684 / 2338 |
| mobile 첫 카드 top / docH | 793 / 3536 | 793 / 3536 |
| desktop hero 높이 | 472 | 283 |

Hero 높이만 달라졌고(`sizes` 변경의 결과) 나머지 요소의 top과 height, 문서 전체 높이는
글자까지 같다.

### 갱신 실패에서 목록을 남기는 방법

처음 설계는 "`keepPreviousData`가 실패 상태에서도 이전 결과를 준다"였다. 프로브로 확인해
보니 **최종 실패 시점에 `hasData:false`, `isPlaceholderData:false`** 였다. placeholder는
pending에만 걸린다.

그래서 마지막으로 표시가 확정된 조건만 ref에 기억하고, 실패했을 때만 그 key로 Query Cache를
직접 읽는 방식으로 바꿨다. 서버 응답을 별도 상태에 복사하지 않는다. 목록의 원본은 계속
Query Cache이고 화면이 기억하는 것은 어느 key를 보고 있었는지뿐이다. 캐시가 이미 비워졌으면
`undefined`가 되어 "보여줄 목록이 없는 실패"로 자연히 떨어진다.

0건 문구의 조건도 여기서 갈린다. 이전 결과를 보여주는 동안 현재 URL 조건으로 설명하면
아직 확인되지도 않은 0건을 사실처럼 말하게 된다. placeholder 구간과 실패 구간을 하나로 묶어
표시 중인 목록을 만든 조건으로 문장을 만든다.

## 5. metadata

세 화면의 metadata를 본문과 같은 조회 계약 위에 세웠다.

| 화면 | title | description |
| --- | --- | --- |
| root | `title.template`으로 `%s \| Loop Market` | 공통 |
| `/` | 본문 Hero와 같은 문구 | 같은 조회 결과 |
| `/products` | `Search “니트” (page 2)` | `30 products in 뷰티 잡화, sorted by Popular.` |

세 가지를 지켰다.

**같은 요청 범위를 공유한다.** metadata와 본문이 각자 조회하면 한 문서에 같은 요청이 두 번
나간다. URL 조립 함수를 하나로 두고 React `cache()`로 요청 범위 안에서 결과를 공유한다.
홈의 서버 조회가 문서당 2회에서 **1회**로 줄었다. (브라우저로 방문하면 2회로 보이는데,
Header의 `<Link href="/">`가 RSC prefetch를 별도 문서 요청으로 보내기 때문이고 같은 문서
안의 중복이 아니다.)

**실패마다 화면이 다르다.** 예상 가능한 조회 실패(5xx, 네트워크 단절)는 아무 필드도 정하지
않아 root metadata를 상속한다. 예상 밖 오류(200인데 본문이 JSON이 아님)는 삼키지 않고
던진다. 계약이 깨진 것이라 화면이 복구 방법을 모른다.

**재현용 `scenario`는 문구에 드러내지 않는다.** 디버깅 수단이 공유 카드에 새면 안 된다.

### 카테고리 이름이 화면과 갈리는 지점

| | 문장 |
| --- | --- |
| metadata | `No products match “니트” in 뷰티 잡화.` |
| 화면 | `No products match “니트” in Beauty & Goods.` |

문장 구조는 `describeEmptyResult` 하나를 공유하고 카테고리 이름만 다르다. 요구는
"metadata는 같은 query 응답의 카테고리명"이고, 화면 필터는 storefront의 고정 영문명을 쓴다.
두 계약을 동시에 지킨 결과다. 서버가 표시명을 바꾸면 공유 카드가 따라 바뀌고, 응답에 선택
카테고리가 없으면 id를 노출하지 않고 storefront 이름으로 축퇴한다.

언어 통일은 이번 성능 범위가 아니라 별도 논리적 변경으로 남긴다.

### metadata가 데이터를 기다리는 비용은 누구에게 청구되는가

`/products`, UA만 바꿔 5회씩.

| UA | TTFB | total |
| --- | --- | --- |
| 일반 | 0.005~0.016 s | 0.510~0.521 s |
| `facebookexternalhit` | 0.509~0.515 s | 0.509~0.516 s |

`scenario=slow`로 지연을 키우면 더 분명하다.

| UA | TTFB | total |
| --- | --- | --- |
| 일반 | 0.004 s | 1.507 s |
| `facebookexternalhit` | 1.506 s | 1.507 s |

Next 16이 일반 UA에는 metadata를 스트리밍으로 내보내 셸이 먼저 나가고 `<title>`이 뒤따른다.
크롤러 UA에는 metadata가 준비될 때까지 응답 자체를 붙잡는다. 크롤러는 부분 HTML을 못 읽으니
당연한 선택이다.

그래서 같은 비용이 **사용자에게는 TTFB 4 ms, 크롤러에게는 1,506 ms로** 다르게 청구된다.
조회가 느려지면 크롤러 쪽만 그대로 늘어난다.

## 6. 초기 HTML 감사

| 항목 | `/` | `/products` |
| --- | --- | --- |
| 고유 title | 매일 새롭게 발견하는 취향 | Products \| Loop Market |
| description | 있음 | `30 products.` |
| h1 | 1개 | 1개 |
| main | 1개 | 1개 |
| nav | 1 (Main navigation) | 2 (Main navigation, Pagination) |
| href 링크 | 8 (카테고리 5개 포함) | 3 |
| alt 없는 img | 0 | 0 |
| alt 빈값 | 1 (Hero, 장식) | 0 |

홈의 콘텐츠 `<section>` 세 곳(Categories, Popular, New arrivals)에는 accessible name이 없어
region landmark로 노출되지 않는다. 다만 셋 다 보이는 `h2`가 있어 문서 구조와 heading 탐색으로
이미 발견된다. 접근성 요구사항이 홈 영역의 landmark 노출을 명시하지 않았고, 측정으로 확인된
결함도 아니라서 **region landmark는 추가하지 않았다.** 여기 기록만 남긴다.

목록 화면에 카테고리 링크가 없다. 카테고리 이동이 `select`로만 된다. 홈에
`/products?category=...` 링크 5개가 있어 크롤러가 모든 카테고리 목록에 도달할 수 있으므로
"주요 이동 경로가 href 링크인가"는 충족한다고 본다. 화면에 없는 탐색 UI를 새로 만드는 일이라
이번 범위 밖으로 뒀다.

## 7. Advanced A — 상호작용 지연

대상은 `/performance-lab/inp`다. 찜 버튼 하나를 누르면 카드 24개가 전부 다시 그려진다.

### 측정 방법

| 항목 | 값 |
| --- | --- |
| URL | `/performance-lab/inp?pageSize=24` |
| 카드 수 | 24 (줄이지 않는다) |
| 빌드 | 일반 production build |
| CPU | 4배 감속 (CDP `Emulation.setCPUThrottlingRate`) |
| 시작 상태 | 매 회차 새 문서, 같은 상품이 찜되지 않은 상태 |
| 행동 | 이미지 로딩 완료 후 같은 상품의 찜 버튼 1회 클릭 |
| 반복 | Before / After 각 5회, 중앙값 |

`PerformanceObserver`의 `event` 엔트리를 `durationThreshold: 16`으로 수집하고, 같은
`interactionId`의 `pointerdown + pointerup + click`을 묶어 그중 가장 긴 duration을 상호작용
값으로 썼다. 임계값을 기본에 맡기면 개선 후 엔트리가 사라져 비교가 끊긴다.

```
input delay        = processingStart - startTime
processing         = processingEnd - processingStart
presentation delay = duration - (processingEnd - startTime)
```

**이 값은 현장 INP가 아니다.** 로컬에서 한 번의 클릭을 재현한 것이고, INP에 영향을 주는
상호작용 지연 시간으로 읽어야 한다.

렌더 범위는 별도 profiling build(`next build --profile`)에서 각 카드를 `<Profiler>`로 감싸
`onRender`를 수집했다. `actualDuration`으로 비용을, 카드 id와 `phase === 'update'`로 범위를,
`commitTime` 그룹으로 같은 commit 여부를 봤다. 두 계측 모두 측정 후 제거했고 최종 diff에 없다.
profiling build의 시간은 일반 build의 상호작용 숫자와 직접 비교하지 않는다.

### 결과

| 구간 | Before 중앙 | After 중앙 |
| --- | --- | --- |
| input delay | 3 ms | 3 ms |
| processing | 1 ms | 1 ms |
| **presentation** | **117 ms** | **51 ms** |
| **duration** | **128 ms** | **56 ms** |

```
Before  run1 input 16  proc 3  pres 117  dur 136
        run2 input  4  proc 1  pres 124  dur 128
        run3 input  2  proc 1  pres 109  dur 112
        run4 input  3  proc 1  pres 116  dur 120
        run5 input  3  proc 1  pres 124  dur 128

After   run1 input 11  proc 1  pres  51  dur  64
        run2 input  2  proc 1  pres  45  dur  48
        run3 input  3  proc 1  pres  52  dur  56
        run4 input  3  proc 1  pres  52  dur  56
        run5 input  3  proc 1  pres  44  dur  48
```

| 렌더 범위 (profiling build) | Before | After |
| --- | --- | --- |
| commit 수 | 1 | 1 |
| 렌더된 카드 | **24개 전부** | **1개** |
| phase | update 24 / mount 0 | update 1 / mount 0 |
| 합계 `actualDuration` | 66 ms | 4 ms |

### 원인과 변경

이벤트 핸들러 자체는 원래 1 ms였다. **비용은 핸들러가 끝난 뒤 다음 paint까지의 렌더에
있었다.** Profiler가 그 렌더의 범위가 카드 24개 전부라는 것을 보여줬다.

```diff
- const wishlistIds = usePerformanceWishlist((state) => state.wishlistIds)
- const selected = wishlistIds.includes(product.id)
+ const selected = usePerformanceWishlist((state) =>
+   state.wishlistIds.includes(product.id),
+ )
```

카드마다 `wishlistIds` 배열 전체를 구독하고 있었다. 토글이 새 배열을 만들면 24개 카드의
selector 결과가 전부 새 참조가 되어 전원이 다시 렌더된다. 자기 찜 여부 boolean으로 좁히면
다른 상품의 찜이 바뀌어도 결과가 같은 값이라 리렌더 대상에서 빠진다.

**`memo`는 붙이지 않았다.** selector를 좁힌 뒤 Profiler에서 렌더가 1개로 떨어져 추가 경계가
필요 없다는 것이 확인됐기 때문이다. 측정 전에 메모이제이션부터 붙였다면 원인을 모른 채
증상만 덮었을 것이다.

### 우회하지 않았다는 확인

| 항목 | 확인 |
| --- | --- |
| 카드 수 | 24개 유지 |
| 화면 계산 | 24개 카드 전부 표시. 클릭 후 값도 `349624 → 578445`로 실제 재계산 |
| `setTimeout` 지연 | 없음 |
| 즉시 피드백 | `찜하기 → 찜 해제`, `aria-pressed false → true` |
| TBT를 INP 증거로 | 사용하지 않음 |

`?pageSize=24`는 요구된 URL 형태 그대로 썼지만, **현재 fixture가 24개 고정이라 이 파라미터는
결과에 관여하지 않는다.** 파라미터를 실제로 읽게 만들면 24보다 작은 값을 넣을 길이 생겨
그대로 뒀다.

## 8. 커밋과 근거

| SHA | 커밋 | 근거가 된 측정 |
| --- | --- | --- |
| `8a1352d` | Hero 이미지를 표시 폭에 맞는 후보로 내려보낸다 | 전송 7.2 MB, 표시 폭 388 CSS px |
| `13b5113` | 홈 셸을 느린 응답에서 떼어낸다 | Hero 요청 시작 626 ms, LCP 42.2초, CLS 0.065 |
| `89d9584` | 목록의 느린 응답을 URL로 재현할 수 있게 한다 | 전환 상태를 재현할 수단이 없었음 |
| `6c8474a` | 조건을 바꾸는 동안 목록을 비우지 않는다 | 조건 전환 시 화면 전체가 비는 것 |
| `b4ba2d9` | 최초 진입에서 결과가 들어올 자리를 먼저 잡는다 | 결과 도착 시 목록이 내려앉음 |
| `721bff5` | 목록의 빈 결과와 실패도 URL로 재현할 수 있게 한다 | 0건과 실패를 재현할 수단이 없었음 |
| `528a28d` | 갱신이 실패해도 보던 목록을 남긴다 | 최종 실패에서 `hasData:false` 프로브 |
| `1f72de6` | 0건 화면이 무엇을 걸어서 0건인지 말한다 | 0건 화면에 조건 설명이 없었음 |
| `6abc5ae` | 루트 metadata 합성 계약을 세운다 | 화면별 title 부재 |
| `a7950eb` | 홈 metadata를 본문과 같은 조회 계약으로 만든다 | 문서당 서버 조회 2회 |
| `36e31e0` | 상품 목록 metadata를 URL 조건과 응답으로 만든다 | UA별 응답 시점 차이 |
| `3dc3726` | 찜 하나가 관계없는 카드까지 다시 그리지 않게 한다 | Profiler 카드 24개, duration 128 ms |

## 9. 기능 회귀

| 항목 | 결과 |
| --- | --- |
| 검색, 카테고리, 정렬이 URL에 복원 | `q=니트&category=goods&sort=popular`, 검색 입력값도 유지 |
| 뒤로 가기 | sort가 제거된 직전 상태로 복원 |
| 앞으로 가기 | `sort=popular` 복원 |
| 장바구니, 위시리스트, Header 개수 | client navigation에서 Bag 1 / Wishlist 1 유지, 같은 상품이 홈에서도 `aria-pressed=true` |
| 빈 상태 | `0 products` / `No products match “니트”.` / `Reset filters` |
| 오류와 재시도 | `Try again` 표시, 카드 0 |
| FSD 의존 방향과 Public API | architecture check 108 files, 320 imports, 3 public APIs 통과 |

전체 새로고침 후 Header 개수가 0으로 보이는 것은 Zustand에 persist 미들웨어가 없는 기존
동작이고 이번 작업과 무관하다.

`pnpm check`(architecture → test → test:storybook → lint → typecheck → build → build:storybook)
전체 통과. unit 259건, storybook 18건.

## 10. 적용하지 않은 제안과 이유

| 제안 | 판단 |
| --- | --- |
| 홈 `<section>`에 `aria-labelledby` 추가 | 유효한 개선 후보지만 측정으로 확인된 결함이 아니다. 각 영역에 보이는 `h2`가 있어 이미 발견된다 |
| 목록 화면에 카테고리 링크 추가 | 화면에 없는 탐색 UI를 새로 만드는 일이다. 홈의 링크로 크롤링 도달성은 이미 충족한다 |
| `pageSize` 파라미터를 실제로 읽게 하기 | 24보다 작은 값을 넣을 길이 생긴다. 카드를 줄이지 못하게 막는 것이 요구의 취지다 |
| 측정 전 `memo` 부착 | 원인을 모른 채 증상만 덮는다. selector를 좁힌 뒤 렌더가 1개로 떨어져 불필요해졌다 |
| 홈 FCP 회귀를 되돌리기 | 두 FCP가 서로 다른 시각적 완료 상태를 재고 있다. LCP 42.2초와 CLS 0.065를 되돌리는 대가가 더 크다 |
| 목록 셸에도 `connection()` 적용 | 목록은 `searchParams`를 읽는 것 자체가 동적 API라 이미 요청 시점 렌더링이다. 홈에는 그런 입력이 없어서 필요했다 |
| 화면 카테고리 이름을 서버 응답으로 통일 | 성능 범위가 아니다. 화면 계약 변경이라 별도 논리적 변경으로 둔다 |

## 11. 이 측정의 한계

- 로컬 단일 머신, Lighthouse Lantern 시뮬레이션이다. 절대값은 실제 사용자 환경의 값이 아니다.
- Advanced A의 상호작용 값은 로컬 재현이지 현장 INP가 아니다. 실제 INP는 여러 상호작용의
  분포에서 나온다.
- 홈 FCP 악화는 한글 문구가 원인 변수라는 것까지 확인했고, 구체적인 지연 기전은 확정하지
  않았다.
- profiling build의 `actualDuration`은 일반 build의 상호작용 시간과 직접 비교하지 않는다.
  렌더 범위와 원인 확인에만 썼다.
- CLS는 Lighthouse 로드 구간의 값이다. 로드 이후의 상호작용 CLS는 별도로
  `PerformanceObserver`의 `layout-shift` 엔트리로 확인했다.
