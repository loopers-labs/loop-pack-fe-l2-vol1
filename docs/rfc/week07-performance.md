# 7주차 성능 최적화 — 측정 기록

과제가 요구하는 산출물만 단계별로 채운다. 실측은 production build(`pnpm build && pnpm start`)에서, 확장·캐시·로그인 없는 별도 브라우저 프로필로 한다.

## 0단계 — Before

### SHA와 재현 조건

SHA를 제외한 아래 조건은 Before·After에서 동일하게 둔다.

- **Before SHA**: `213d205`
- **After SHA**: `e7d0c2b`
- **URL·행동**: 홈 `/` cold load
- **측정 방식 (Before·After 공통)**: Lighthouse Navigation · Device Desktop(viewport 1350×940) · Categories Performance만 · **Simulated throttling**(RTT 40ms · 10.24Mbps · CPU 1x).
- **Simulated를 쓰는 이유**: Before↔After를 같은 잣대로 비교하려면 run 간 편차가 작아야 한다. Simulated는 빠르게 한 번 잰 뒤 목표 조건을 계산해 편차가 작아 5회 median이 안정적이다. 실제로 느리게 받는 DevTools throttling은 체감엔 정확하나 편차가 커 비교엔 불리하므로, 실제 전송 지연은 아래 실측 waterfall로 따로 관찰한다.
- **브라우저·Lighthouse 버전**: 표의 5회는 실브라우저 Chrome / DevTools Lighthouse 13.3.0. 헤드리스 CLI(Lighthouse 13.4.1)로도 교차 확인했고 방향은 같다(LCP median 6.71s — 헤드리스가 절대값은 더 빠름).

Before 구성: 최적화하지 않은 7.5MB 원본(`hero-original.jpg`)을 `HeroSection`으로 홈 LCP에 연결했다. 목록 지연은 `productListQueryOptions`가 빌드 env `NEXT_PUBLIC_MOCK_SCENARIO`를 읽어 서버 prefetch·클라 요청 모두에 `scenario=slow`를 싣는 방식으로 재현한다(사용자 URL 상태와 분리해 metadata·공유 URL엔 안 샘). 측정은 `pnpm build:slow && pnpm start:slow`로 실행하며, env는 build 인라인·start 런타임 양쪽에 필요하다(둘이 다르면 서버·클라 query key가 어긋난다).

### 5회 raw 값

| 지표    | 1     | 2     | 3     | 4     | 5     | median | min   | max   |
| ------- | ----- | ----- | ----- | ----- | ----- | ------ | ----- | ----- |
| FCP (s) | 0.58  | 0.58  | 0.57  | 0.93  | 0.58  | 0.58   | 0.57  | 0.93  |
| LCP (s) | 8.10  | 8.10  | 8.09  | 8.79  | 8.10  | 8.10   | 8.09  | 8.79  |
| CLS     | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000  | 0.000 | 0.000 |

### 관찰

출처 표기 — `[실측]` 실브라우저 DevTools(Network 탭 HAR · Performance 탭 trace · Lighthouse 13.3.0), `[HTML]` 서버 첫 응답 마크업.

관찰 조건(Network·Performance 탭) — Disable cache · CPU No throttling · Screenshots 켜고, **네트워크는 Fast 4G(≈10Mbps)로 throttle**한다. localhost는 대역폭이 무제한이라 throttle을 끄면 7.2MB Hero도 즉시 로드돼 병목이 사라지므로, 실제 사용자 전송을 재현하려면 반드시 조여야 한다. Fast 4G는 desktop 기준(10Mbps)에 가장 가까운 프리셋이라 실측 Hero ≈8s와 정합한다. 이 탭들은 simulate가 아닌 applied throttling이라 값이 위 표(simulate)가 아니라 실측에 대응한다.

- **LCP element** `[실측]`: performance trace 기준 LCP 후보가 둘이다. FCP(1.02s)에 제목 `H2#week07-hero-title`(32,678px²)이 첫 후보였다가, 더 큰 Hero `img.HeroSection-module__image`(508,725px², `hero-original.jpg`)가 8.9s에 최종 LCP로 교체된다. 즉 텍스트가 먼저 최대 요소였지만 Hero가 뒤늦게 그것을 밀어내며 LCP를 8.9s로 끌어올린다.
- **filmstrip 표시 순서** (Header · 페이지 제목 · Hero) `[실측]`: 필름스트립 65컷(0~9.1s). FCP 1.02s에 Header·제목이 그려지고 Hero 자리는 계속 비어 있다가, 다운로드가 끝나는 8.9s에야 Hero가 채워진다 — 이 8초 공백이 LCP 지연의 원인이다.
- **Network waterfall** (document · 홈 데이터 · Hero 이미지 요청 시작 순서와 전송 크기) `[실측]`: document `/`(7.4KB, 623ms) 직후 +642ms에 `hero-original.jpg`(7,368.7KB)가 시작해 로드에 8.16s 소요(675ms→8830ms) — CSS·JS·상품 이미지(webp 3~70KB)는 같은 구간에서 1s 내 병렬 완료. Hero 발견은 672ms로 이르다(상품 이미지 +0.94s·데이터 `_rsc` +1.53s보다 앞서 Hero가 먼저 발견됨). `[HTML]` 확인: Hero는 `<link rel="preload" as="image">`로 예약되고 `width/height`가 명시되며 `loadingAttr`이 비어 lazy가 아니다 — 발견·치수는 최적, 병목은 페이로드 크기뿐. Lighthouse "Improve image delivery" 절감 추정 7,099 KiB `[실측]`.
- **목록 slow 녹화** `[실측]` (Network Preserve log HAR + Performance trace, `scenario=slow` 배선 경유):
  - **데이터 없는 최초 진입**: 하드 로드 시 SSR이 항상 prefetch하므로 클라 스켈레톤 없이 **서버에서 1.5s 블록** 후 목록이 한 번에 뜬다(Before 동작 — 2단계에서 `loading.tsx`로 개선).
  - **기존 목록 갱신**: 목록이 있는 상태에서 카테고리 변경 시 `keepPreviousData`로 이전 목록을 유지한 채 1.5s 재요청한다(즉시 비우지 않음).
  - **취소된 요청**: 카테고리를 1.5s 내 연속 변경(fashion +4079~5591ms · goods +5459~6971ms)하면 두 요청이 겹친다. 먼저 끝난 fashion 응답(5591ms)은 활성 key가 goods라 화면에 반영되지 않아, 늦은 이전 요청이 현재 화면을 덮지 않는다. (당시 AbortSignal 미사용이라 네트워크 취소가 아니라 TanStack이 비활성 key 결과를 무시하는 방식 — 2단계에서 AbortSignal 추가.)
  - **URL 복원(뒤로가기)** `[실측]`: 카테고리 변경은 `history: "push"`로 쌓여, 취소 시퀀스(…→fashion→goods) 뒤 뒤로가기를 누르면 URL이 직전 `category=fashion`으로 복원되고 화면도 fashion으로 돌아온다(URL↔화면 일치). 취소된 fashion 요청은 화면 반영만 막혔을 뿐 완료돼 캐시에 남아, 이 복원이 재요청 없이 즉시 이뤄진다.
  - **전환 시 CLS** `[실측]`: 느린 목록이 최종 렌더될 때 Layout Shift score **0.164**(입력 근접 제외) 관찰. 홈 CLS 0과 대비된다. 정확한 원인 분석과 수정은 2단계에서 다룬다.

### 가설

- **관찰한 사실**: 최종 LCP element가 3840×2160 원본 Hero(전송 7,368.7KB)이고, 제목이 먼저 그려진 뒤(FCP 1.02s) LCP까지의 격차 전부가 이 이미지의 로드 시간(실측 8.16s)이다.
- **원인 가설**: Hero는 preload·치수 명시로 발견은 최적이나, 원본 크기 그대로 내려받아 대역폭을 수 초 점유해 LCP를 지배한다.
- **반증 방법**: Hero만 렌더 치수로 리사이즈+최신 포맷으로 교체했을 때 LCP만 떨어지고 FCP·CLS가 불변인지 확인한다 — 불변이 아니면 크기 외 다른 원인이다.
- **가장 작은 변경**: Hero 이미지를 렌더 치수에 맞춰 리사이즈하고 webp/avif로 변환(발견·preload·치수는 이미 최적이라 손대지 않음).

## 1단계 — Hero LCP와 렌더링 경계

### 변경 개요

1단계는 두 변경으로 나눠 각각 측정·커밋한다. 조건은 0단계와 동일(Device Desktop · Performance만 · Simulated; 단 셸 FCP는 "렌더링 경계"의 측정 주의 참고).

- **이미지 최적화(LCP)**: `ff85cab` — Hero를 `next/image`로 바꿔 원본을 소스로 두고 표시폭(<=1200px) 후보·webp로 리사이즈한다. 이하 "LCP 구간 분해"~"검증".
- **셸 렌더링 경계(FCP)**: `d92de5f` — 셸을 `await` 밖으로. 아래 "렌더링 경계" 절.

### LCP 구간 분해 (Before) `[실측]`

LCP를 네 구간으로 나누면 전송이 지배한다. 발견·치수·preload는 이미 최적이라 남는 병목은 크기뿐.

| 구간                | Before      | 판단                       |
| ------------------- | ----------- | -------------------------- |
| 서버 응답(document) | 623ms       | 짧음                       |
| 이미지 발견         | 672ms       | 이르다(문서 직후, preload) |
| **이미지 전송**     | **8,155ms** | **지배 구간**              |
| 렌더(전송→paint)    | ~78ms       | 짧음                       |

### 선택·제외한 변경

Before 사실로 걸러 채택한 변경은 하나뿐이다.

- **채택 — 표시폭 리사이즈 + webp + viewport 후보(srcset/sizes)**: 3840×2160·7,368.7KB가 표시폭(<=1200px)보다 과대해 전송이 8.16s를 차지. `next/image fill`+`sizes`로 표시폭 후보를 받게 한다. `fill`은 img의 명시 `width/height`(3840×2160) 대신 `.hero`의 기존 `aspect-ratio`로 공간을 잡으므로, 공간 예약 방식은 그대로여서 CLS가 유지된다.
- **제외 — 요청 순서 분리**: 상품 이미지(webp 3~70KB, 총 ~200KB)는 Hero보다 늦게 시작해 ~1s 내 끝나고 대역 경합이 ≈2%라 Hero를 막지 않는다.
- **제외 — lazy loading**: Hero는 above-fold LCP 요소라 지연하면 LCP가 악화된다(상품 이미지만 lazy).
- **제외 — 우선순위 상향**: 발견이 672ms로 이미 이르다. `next/image`가 무지정 시 lazy로 내리므로 `priority`로 기존 preload·eager를 **유지**만 하고 더 높이지 않는다.

### Before ↔ After 비교 `[실측]`

After 5회 raw (실브라우저 Chrome / DevTools Lighthouse 13.3.0):

| 지표    | 1    | 2    | 3    | 4    | 5    | median | min  | max  |
| ------- | ---- | ---- | ---- | ---- | ---- | ------ | ---- | ---- |
| FCP (s) | 0.58 | 0.58 | 0.58 | 0.58 | 0.58 | 0.58   | 0.58 | 0.58 |
| LCP (s) | 1.18 | 1.18 | 1.18 | 1.18 | 1.18 | 1.18   | 1.18 | 1.18 |
| CLS     | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.000  | 0.00 | 0.00 |

| 증거        | Before                               | After                    | 변화                              |
| ----------- | ------------------------------------ | ------------------------ | --------------------------------- |
| LCP median  | 8.10s                                | 1.18s                    | −85% (poor→good)                  |
| Hero 전송   | 7,368.7KB                            | 170.7KB (w=2048, retina) | −97.7%                            |
| 전송 구간   | 8,155ms                              | 510ms                    | 병목 해소                         |
| 발견        | 672ms                                | 531ms                    | preload 유지                      |
| FCP median  | 0.58s                                | 0.58s                    | 불변                              |
| CLS         | 0.000                                | 0.0001                   | 불변                              |
| SI          | 2.65s                                | 0.96s                    | −64%                              |
| LCP element | Hero `img.HeroSection-module__image` | 동일                     | 시각 요소 그대로, 바이트만 최적화 |

가설이 예측한 대로 LCP만 급감하고 FCP·CLS는 불변 → 크기 외 다른 원인이 아니었음이 반증을 통과한다.

### filmstrip 관찰 `[실측]`

Before·After 모두 제목(텍스트) 먼저 → Hero 이미지 나중 순서는 동일하다. 다만 제목→이미지 격차(LCP−FCP)가 7.52s에서 0.60s로 줄어든다. 순서가 그대로인 것은 이미지 크기만 바꾼 격리된 변경임을 확인해 준다(렌더 경계는 손대지 않음).

### 검증

- 육안 품질: 원본 대비 열화 없음(작성자 확인).
- 회귀: 테스트 88개·lint·typecheck·build 통과. LCP element·비율·문구 유지, CLS 무이동.

### 렌더링 경계 — 셸을 await 밖으로 (FCP) `[실측]`

**After SHA**: `d92de5f`

**측정 방법 주의**: 이 문제는 서버 응답 지연(TTFB)이 원인이라 Lighthouse **simulate가 FCP를 오보**한다(홈 slow에서 simulate FCP 0.26s인데 observed는 1.87s). 서버 대기 시간을 FCP에 반영하지 못하기 때문이다. 그래서 이 절은 observed·실측(HAR TTFB · Performance filmstrip)으로 판단한다.

**문제(Before)**: 홈 데이터가 느릴 때 `app/(commerce)/page.tsx`가 `await queryClient.prefetchQuery(homeQueryOptions())`로 문서 전체(셸 포함)를 막는다. document TTFB 1.5s → observed FCP 1.87s로 Header·제목·설명까지 데이터 뒤에야 그려진다.

**변경**: 제목·설명 셸을 `await` 밖에서 즉시 렌더하고, 프리패치+`HomeView`를 async `HomeContent`로 옮겨 `<Suspense fallback={<HomeSkeleton />}>`로 스트리밍한다. Suspense fallback이 실제로 보이게 되므로 스켈레톤 Hero 높이를 실제와 같은 aspect-ratio(16/9·모바일 4/5)로 맞춰 교체 시 CLS를 막는다.

**h1 선택 근거**: 홈엔 h1이 없었고 배너 제목은 slow 데이터라, 데이터와 무관한 정적 h1·설명을 둔다(최종 문구·sr-only 처리는 4단계). 정적이라 즉시 렌더되고(셸 안 막힘), 빠른 초기 HTML에 담겨 크롤러가 일찍 읽으며, 실제 섹션(인기·신상품)을 설명해 SEO에 이롭다. 동적 배너 제목은 hero의 h2로 유지한다.

| 증거 (홈 slow) | Before  | After   | 변화                               |
| -------------- | ------- | ------- | ---------------------------------- |
| document TTFB  | 1,625ms | 169ms   | 셸 즉시 스트림                     |
| observed FCP   | 1,874ms | 463ms   | −75%                               |
| CLS            | —       | 0.0001  | 스켈레톤 정합, 무이동              |
| 최종 LCP       | 1,894ms | 2,099ms | 변화 없음(Hero가 아직 데이터-결합) |

Before 값은 CLI observed다(실브라우저 Before-①은 ①a 적용 전 상태라 별도로 잡지 않음). After는 실측이라 절대값 잣대가 다르지만, 방식과 무관한 document TTFB가 1.5s→0.17s로 떨어져 셸이 데이터 대기에서 분리됐음을 확정한다. 셸이 15~169ms에 스트림돼 제목·설명이 먼저 paint되고 느린 본문은 스켈레톤 뒤 채워진다. 정상 데이터에서도 셸이 500ms 데이터 대기를 하지 않아 FCP가 개선된다.

### 제외 — Hero 이미지 hoist

최종 LCP는 여전히 Hero 이미지이고 홈 slow에서 2.1s다. 이미지 URL은 정적이라 셸로 올려 데이터와 무관하게 일찍 그리면 slow LCP를 낮출 수 있으나, 아래 이유로 제외한다.

- **prod 이득 없음**: 정상 데이터에서 Hero 발견은 이미 이르고(531ms) LCP는 이미지 최적화로 ~1.1s다. hoist가 개선하는 건 slow(측정용 렌즈)뿐이다.
- **비용이 과도**: 이미지만 셸로 올리려면 Hero의 이미지와 오버레이(copy)를 쪼개고 copy 데이터 흐름을 다시 짜야 한다(이중 fetch·HydrationBoundary 상향 등) — "Route Handler·FSD 재설계 금지"와 충돌하고 데이터 소유권을 흔든다.
- **요구는 확인·판단**: line 82는 발견 시점을 확인하고 우선순위를 높일 이유가 있는지 판단하라는 것이지 hoist를 강제하지 않는다. 발견이 prod에서 이미 최적이므로 개입하지 않는다.
- **UX상 우위도 아님**: prod(데이터 ~500ms)에선 hoist 유무 차이가 미미하다. slow에서 hoist는 이미지를 일찍 보여주지만 텍스트 없는 빈 오버레이를 노출하고, 제외 쪽은 일관된 전체 스켈레톤을 보인다 — 어느 쪽도 명확한 UX 우위가 없다. 전제는 prod 홈 데이터가 계속 빠르다는 것이고, 느려지면 재검토한다.

## 2단계 — 목록 pending·갱신·CLS

### 6-state 처리

`ProductListResults`가 실패 케이스를 먼저 걸러내고 목록을 마지막에 그린다. 대부분은 5·6주차 구현이라 그대로 두고, 측정으로 드러난 문제만 손봤다.

| 상태                  | 처리                                                                                    | 확인                      |
| --------------------- | --------------------------------------------------------------------------------------- | ------------------------- |
| 데이터 없는 최초 진입 | route `loading.tsx` 스켈레톤                                                            | 실측                      |
| 이전 데이터 갱신      | `keepPreviousData`로 목록 유지 + 펄스 딤                                                | 실측                      |
| 성공 + 0건            | "조건에 맞는 상품이 없습니다"                                                           | 실측(검색 무매칭 `q=zzz`) |
| 최초 실패             | 서버 prefetch 5xx → `app/error.tsx`(재시도); 클라 4xx·network → `!data → role="alert"`  | 실측(scenario=error)      |
| 갱신 실패             | 클라 4xx·network → `isError && data` 인라인 오류·재시도(목록 유지); 5xx → ErrorBoundary | 코드                      |
| 취소                  | 활성 key만 반영(stale 무시) + AbortSignal 취소                                          | 실측(0단계·아래)          |

에러는 두 경로로 갈린다. 초기 로드(서버 prefetch) 5xx는 라우트 경계 `app/error.tsx`가, hydration 이후 클라 쿼리 실패는 ProductListResults(4xx·network는 인라인, 5xx는 `QueryErrorResetBoundary`)가 맡는다. scenario=error(500)는 서버 prefetch를 깨 error.tsx 경로로 확인된다.

### 측정으로 잡은 변경 `[실측]`

- **전환 CLS 제거**: 원인이 둘이다 — 상품명 줄 수(1↔2줄)로 카드 높이가 가변이고, `all↔카테고리`에서 겹치는 상품이 `product.id` key로 DOM이 유지된 채 자리를 옮긴다. 상품명을 2줄로 clamp(높이 고정)하고 key를 `${product.id}-${index}`로 바꿔(위치가 바뀌면 새로 mount) 없앴다. 전환 CLS **0.13~0.15 → 0.000**.
- **갱신 중 표시**: 이전 목록을 유지한 채 새 조건을 기다릴 때 `aria-busy` 목록을 은은히 펄스(opacity)시켜 알린다(스크린리더는 aria-busy, 시각은 펄스). opacity라 CLS 없음.
- **AbortSignal**: `fetchJson`이 signal을 fetch에 전달. 1.5s 내 5연속 변경 시 완료 1건·취소 4건. 정합성은 활성 key가, 취소는 낭비 요청 감소를 맡는다.

### 최초 진입 pending — 방식 비교

목록은 서버 prefetch+hydration(6주차 설계)이라 클라 `isPending` 스켈레톤이 우회된다. 스켈레톤을 띄우는 세 방식을 실측 비교했다.

| 방식                        | 스켈레톤     | TTFB   | 목록 초기 HTML | RSC 자기호출 | 6주차 설계·계약                                         |
| --------------------------- | ------------ | ------ | -------------- | ------------ | ------------------------------------------------------- |
| A: SSR + Suspense 스트리밍  | ✓            | 빠름   | ✓              | 유지         | 유지(단 큰 재구조화)                                    |
| B: 클라 주도(prefetch 제거) | ✓ (SSR HTML) | 0.013s | ✗              | 해소         | 깨짐(CSR-bailout 재도입·서버 redirect 계약 테스트 실패) |
| **C: `loading.tsx`** (채택) | ✓            | 빠름   | ✓              | 유지         | 유지(page.tsx·테스트 무변경)                            |

**채택 — `loading.tsx`**: 6주차가 CSR-bailout·waterfall 제거를 위해 client/Suspense에서 SSR-prefetch로 바꾼 결정을 되돌리지 않는다. route-level Suspense fallback으로 스켈레톤만 얹어 프리패치 대기 중 pending UI를 보이고, 끝나면 실제 목록으로 교체한다. 하드로드 실측: ~0.4s에 스켈레톤 → 완료 후 실제 10개, loading→page CLS **0.000**. B는 스켈레톤·TTFB는 좋았으나 6주차 SSR 설계를 되돌려 CSR-bailout을 재도입하고 서버 redirect 계약 테스트를 깼고, A는 설계를 유지하나 `ProductListView` 분리 등 재구조화가 커, 같은 결과를 최소 변경으로 얻는 C를 택했다.

### AbortSignal — 판단 근거

0단계에서 취소는 이미 활성 key만 반영해 화면이 덮이지 않음을 확인했다(AbortSignal 없이도 정합성 안전). AbortSignal은 정합성이 아니라 쓸모없어진 요청의 낭비를 줄이려 추가했다(체크리스트 항목).

### 상태 소유권·완료조건 확인

- **isPending / isFetching / isPlaceholderData 분담**: `isPending`(데이터 없음)은 최초 진입 스켈레톤을 맡는다 — 단 하드로드는 서버 prefetch로 hydrate돼 route `loading.tsx`가 대신 담당한다. `isPlaceholderData`(이전 데이터 유지)는 갱신 중 표시(aria-busy 펄스 딤)를, `isFetching`은 배경 재조회 표시(재시도 버튼 비활성)를 맡는다.
- **서버 응답을 store에 복사하지 않는다**: 목록은 TanStack Query 캐시에서만 읽는다. products의 `useState`는 검색 인풋 리마운트 key·필터 리셋 key(UI 상태)뿐이고, 서버 응답을 Zustand·로컬 상태로 옮기지 않는다.
- **URL active query ↔ 화면 일치**: 조건을 연속으로 바꿔도 활성 query key의 결과만 화면에 반영되므로, 앞선 요청이 늦게 끝나도 현재 화면을 덮지 않는다(0단계 취소·뒤로가기 실측 — AbortSignal 없이도 성립). AbortSignal은 그 요청을 아예 취소해 낭비를 줄일 뿐이며, 취소는 `AbortError`를 그대로 던져(네트워크 오류로 오변환하지 않음) 오류 UI로 노출되지 않는다.

## 3단계 — 동적 metadata와 Open Graph의 비용

### 변경 개요

- 루트 `layout.tsx`: `title` template `%s | Loopers`·공통 `openGraph`(siteName·locale·type·fallback image)·`metadataBase`.
- 홈·목록 `generateMetadata`: 본문 prefetch와 같은 query factory로 조회한 응답으로 동적 title·description·image.
- `buildPageMetadata`(shared/config): title·description을 top-level과 openGraph에 함께 넣고 공통 OG를 spread해 조립. og:url·canonical(정규화 URL)도 여기서 붙인다. 조회·문구 구성은 각 페이지가, 공통 조립은 이 헬퍼가 맡는다.
- origin 통일: 서버 self-fetch base와 metadataBase가 같은 `APP_ORIGIN`(`appOrigin.ts`, 미설정 시 기존 base·로컬 폴백)을 쓰게 fetcher를 정렬한다. 이래야 미도달 origin으로 query failure를 재현할 수 있다.

### 합성·shallow merge `[실측]`

페이지 `openGraph`는 루트 `openGraph`를 통째로 덮으므로, `buildPageMetadata`가 매 페이지에서 공통 OG를 spread해 siteName·locale·type·fallback image를 유지한다. JS 없는 curl(초기 HTML)로 확인: og:site_name `Loopers`·og:locale `ko_KR`·og:type `website`가 모든 페이지에 남고, title은 template로 `제목 | Loopers`로 합성된다.

### metadata 규칙 검증 `[실측]`

- 홈: 배너 응답의 title·description·image(og:image = 배너 이미지).
- 목록 `?q=니트`: title `"니트" 검색 결과`(검색어 우선), description `전체 상품 · 최신순`(category·sort).
- 목록 `?category=fashion&sort=price-asc`: title `패션`, description `패션 · 낮은 가격순`.
- 목록 `?page=2`: title `전체 상품 — 2페이지`(2페이지 이상 page 번호).
- 정상 empty: title `"…" 검색 결과 없음`, description `… 조건에 맞는 상품이 없습니다(0개)`, og:image는 공통 fallback 유지.

### metadata 비용 — UA별 응답 시점 `[실측]`

같은 URL에 일반 UA와 `facebookexternalhit`를 보내 TTFB를 비교:

| 홈 `/`             | 일반 UA TTFB | facebookexternalhit TTFB | total  |
| ------------------ | ------------ | ------------------------ | ------ |
| normal(배너 ~0.5s) | 0.010s       | 0.518s                   | ~0.52s |
| slow(배너 1.5s)    | 0.020s       | 1.536s                   | ~1.53s |

Next 15는 일반 UA엔 metadata를 스트리밍해 셸이 먼저 나가고(TTFB≈0.01~0.02s), 봇엔 완성 metadata를 초기 바이트에 담으려 데이터를 기다린다(TTFB=배너 시간). **동적 metadata의 대기 비용은 크롤러 응답에만 실리고 사용자 FCP는 안 해친다** — 1단계에서 셸을 await 밖으로 뺀 개선이 그대로 유지된다. 봇은 그 대가로 배너 title·description·image가 담긴 완성 문서를 받는다.

### 서버 호출 계수 — request memoization `[실측]`

metadata는 호출마다 새 QueryClient(`makeQueryClient`), 본문은 요청당 하나(`getServerQueryClient`)로 **캐시를 공유하지 않는다**. 둘이 같은 GET URL·options를 만들어 request 범위 native fetch memoization이 묶으므로, `/` 1회 요청당 `/api/home` Route Handler 호출은 **1회**(임시 handler 계수 로그로 세어 확인하고 관찰 뒤 제거, 일반 UA·봇 동일). QueryClient를 singleton·영속으로 공유하지 않고 fetch 계층에서 중복을 제거했다.

### query failure — root 상속 `[실측]`

`APP_ORIGIN`을 미도달 origin으로 두면(build·runtime 동일 값) metadata 조회가 실패한다. 이때 `generateMetadata`는 페이지별 빈 값이 아니라 root 공통 metadata를 상속한다(try/catch → 빈 객체):

- 홈·목록 모두 title `Loopers — 인기 상품과 신상품`(root default), og:image는 fallback(`p1.jpg`), og:url은 metadataBase로 절대화.
- 정상 empty(페이지별 "결과 없음/0개")와 **다른 fallback** — empty는 조건을 설명하고, query failure는 공통 metadata로 물러선다.

### 필터 변경과 metadata — shallow 라우팅 판단

목록의 검색·카테고리·정렬·페이지는 2단계 요구(active query key·`isPending`/`isFetching` 분담·"이전 요청이 늦게 끝나도 현재 화면을 덮지 않음")를 따라 **클라 TanStack Query + nuqs `shallow`**로 처리한다. shallow는 history API로 URL만 바꾸고 서버 왕복을 건너뛰어, 필터를 바꾸면 목록·URL은 갱신돼도 `generateMetadata`가 다시 돌지 않아 **탭 title은 마지막 서버 렌더 값에 머문다**(새로고침·이동 시 갱신). "화면은 바뀌는데 title은 안 바뀌는" 비대칭이지만 개입하지 않는 근거는:

- **metadata의 소비 지점은 URL별 document 요청이다.** 크롤러·소셜봇·직접 진입은 각 URL로 새 document를 요청하고 그 시점 `generateMetadata`가 조건에 맞는 title·OG를 준다(`/products?category=fashion`→"패션" 등 실측). 클라 필터 중 OG가 실시간 갱신되는 건 크롤러엔 의미가 없다.
- **미갱신 항목은 탭 title 하나뿐이다.** 목록·URL·공유 링크는 모두 올바르다.
- **고치는 비용이 더 크다.** `shallow: false`면 필터마다 서버 RSC 왕복이 생기고 `generateMetadata`가 slow API(1.5s)를 기다려 인터랙션마다 대기가 붙는다 — 3단계가 판단하라는 "metadata가 기다리는 비용"에서 나쁜 트레이드. 클라 `document.title` 동기화는 title 규칙을 서버·클라에 복제하는 이중 소스라 "가장 작은 변경"에 어긋난다.
- **실무 결과도 같다.** 커머스 목록은 대개 정렬·세부 필터를 탭 title에 실시간 반영하지 않고 색인 단위(카테고리·검색어)로 title을 관리한다. 우리 규칙(검색어·카테고리·페이지→title, 정렬→description)도 이 결에 있다.

결론: shallow 유지. metadata는 소비 지점(URL별 document)에서 정확하고, 실시간 title 하나를 위해 인터랙션당 서버 왕복·slow 대기를 얹지 않는다.

### 완료조건 확인

- 모든 페이지 기본 색인 가능(`robots` noindex 미설정).
- localhost·미도달 origin의 OG URL은 배포 증거가 아니라 응답 시점·구조 측정용이다.
- 초기 HTML에 하나의 `h1`(홈은 배너와 무관한 정적 문구, 1단계)·페이지 설명·주요 링크가 metadata와 함께 남는다.
- 접근성: 탐색 `<nav>`·콘텐츠 `<main>`·상품 `<article>` 역할이 마크업에 드러나고, 카테고리 이동은 `href` 링크, ProductCard는 상품명 alt, Hero는 이미지 내용을 설명하는 alt(오버레이 제목 중복 회피)를 둔다.

## 4단계 — After와 회귀

### Before·After SHA와 조건

- **Before SHA** `213d205` · **After SHA** `e7d0c2b`(4단계 최종 커밋 — Hero preload·error 경계·retry·페이지네이션·h1 sr-only 모두 포함). 측정 조건은 0단계와 동일(홈 `/` cold load · normal build · Lighthouse Desktop 1350×940 · Performance만 · Simulated). SHA 외 조건은 동일.

### Before ↔ After 종합 `[실측]`

0단계 Before → 최종 After(after_4), 같은 조건의 median:

| 지표    | Before (0단계) | After (4단계) | 변화             |
| ------- | -------------- | ------------- | ---------------- |
| FCP (s) | 0.58           | 0.6           | 불변             |
| LCP (s) | 8.10           | 1.2           | −85% (poor→good) |
| CLS     | 0              | 0             | 불변             |

LCP 급감은 1단계 Hero 전송 최적화(7,368.7KB→170.7KB · 전송 8,155→510ms)가 주효했다. 3단계에서 스트리밍 metadata가 Hero를 데이터 뒤로 미뤄 1.5s로 후퇴했고, 4단계에서 셸 preload로 1.2s로 회복했다(아래 상세). FCP·CLS는 전 구간 불변.

### 3단계가 홈 LCP를 악화 — 재측정에서 발견하고 수정 `[실측]`

4단계 재측정에서 **3단계가 홈 LCP를 1.2s→1.5s로 악화**시킨 것을 발견했다(5회씩 안정적, 변동 아님). 실브라우저 Lighthouse 13.3.0:

| 측정       | FCP  | LCP      | CLS |
| ---------- | ---- | -------- | --- |
| 3단계 직전 | 0.6s | **1.2s** | 0   |
| 3단계 후   | 0.6s | **1.5s** | 0   |

**원인** — LCP breakdown 비교:

| Subpart                | 3단계 직전 | 3단계 후  |
| ---------------------- | ---------- | --------- |
| Time to first byte     | 530ms      | 40ms      |
| Resource load delay    | 40ms       | **650ms** |
| Resource load duration | 510ms      | 540ms     |
| Element render delay   | 80ms       | 120ms     |

3단계의 동적 metadata(스트리밍)가 **TTFB는 개선(530→40ms)**했지만, 셸이 먼저 나가는 대신 **Hero(LCP element)를 데이터 뒤로 미뤘다**(load delay 40→650ms). Hero는 배너 title·description이 필요한 `HeroSection`이 `HomeContent`(Suspense) 안에 있어, 이미지 자체는 데이터가 필요 없는데도 배너를 기다린다. (헤드리스 Lighthouse는 localhost·throttle 없음이라 이 load delay가 안 드러나 0.72s로 같게 나온다 — 회귀를 못 잡으니 실브라우저 simulated로만 확인된다.)

**수정** — 셸에서 Hero 이미지를 미리 preload한다:

- `page.tsx` 셸(즉시 렌더)에서 `next/image`의 `getImageProps`로 `<Image fill sizes>`와 같은 srcset을 만들고, `react-dom`의 `preload(src, { as:"image", imageSrcSet, imageSizes, fetchPriority:"high" })`로 **초기 head에 preload**를 넣는다.
- 브라우저가 배너를 기다리는 동안 ~40ms부터 Hero를 받아, HeroSection이 렌더될 때 이미 준비됨 → load delay 제거.
- src·sizes·alt는 `HERO_IMAGE`(HeroSection이 export)로 한 곳에서 공유해, preload와 실제 `<Image>`가 같은 URL로 dedup되게 한다(드리프트 시 이중 로드).
- 초기 HTML head에 `<link rel="preload" as="image" fetchpriority="high" imagesrcset=…2048w>` 들어감 확인. 1단계의 Hero 전송 최적화(7,368.7KB→170.7KB)는 그대로 유지된다.

### After 5회 — 홈 FCP·LCP·CLS (수정 후) `[실측]`

실브라우저 Lighthouse 13.3.0(위 After SHA):

| 지표    | 1   | 2   | 3   | 4   | 5   | median | min | max |
| ------- | --- | --- | --- | --- | --- | ------ | --- | --- |
| FCP (s) | 0.6 | 0.6 | 0.6 | 0.6 | 0.6 | 0.6    | 0.6 | 0.6 |
| LCP (s) | 1.2 | 1.3 | 1.2 | 1.3 | 1.2 | 1.2    | 1.2 | 1.3 |
| CLS     | 0   | 0   | 0   | 0   | 0   | 0      | 0   | 0   |

**LCP 1.5s(after_3) → 1.2s로 회복** — 3단계 직전(after_2)의 1.2s와 같아 3단계 회귀가 완전히 복구됐다. breakdown(after_4-1): TTFB 30ms · **load delay 650→180ms**(preload 효과) · load duration 700ms · render delay 80ms. Hero가 일찍 그려지며 **LCP element가 Hero → 상품 이미지(`img.week05-image`)로 이동** — Hero는 더 이상 병목이 아니고 상품 이미지가 새 LCP(1.2s)다. 상품 이미지 최적화는 3단계 회귀 복구 범위 밖으로, pre-3단계 baseline 1.2s 도달로 4단계 목표를 채웠다.

### h1 sr-only — 시각 정리, 의미 유지

셸의 정적 h1·설명이 히어로의 배너 title·description과 시각적으로 중복돼, `sr-only`(Tailwind, `clip-path:inset(50%)`)로 **시각만 숨기고 DOM엔 유지**한다. 1단계 요구(h1이 홈 데이터에 안 막힘·초기 응답에 존재)·SEO·스크린리더는 그대로 만족하고, 최상단 비주얼은 히어로가 맡는다. 문구는 페이지 정체성을 담아 "Loopers 커머스 인기 상품과 신상품"으로 둔다.

### 에러 경로 정합 — error boundary 위치·재시도 fail-fast `[실측]`

에러 재녹화에서 두 가지를 고쳤다:

- **error boundary `app/error.tsx` → `app/(commerce)/error.tsx` 이동.** `ea941da`에서 Header를 `(commerce)/layout`으로 옮겼는데 error.tsx는 root에 남아, root 경계가 Header layout **위**라 에러 시 Header까지 교체됐다. commerce 그룹으로 옮겨 **에러가 나도 Header·nav는 유지되고 본문 자리에만 에러**를 보인다(2단계 "목록 대신 실패 이유"에 부합, SSR HTML에 Header 유지 확인). layout이 `<main>`을 감싸므로 error.tsx는 `<section>`으로 둔다.
- **query 재시도 fail-fast.** 홈은 `prefetchQuery`+클라 `useQuery`라 5xx가 기본 3회 재시도(backoff ~7s) 뒤에야 표면화돼, 에러 시 스켈레톤이 오래 떠 "무한 로딩"처럼 보였다(HAR: `/api/home` 3회). `makeQueryClient`에서 **HTTP·business 오류는 재시도 안 함**(같은 응답이라 낭비), 네트워크만 1회로 바꿔 **에러가 즉시** 뜬다(HAR 재측정: `/api/home` 1회, 목록 에러 응답 0.5s). 목록·홈 공통 적용. Header 유지 변경이 products→home 이동을 열어 이 지연을 드러냈다.

### 회귀 확인

- **272 URL 복원**: 검색·카테고리·정렬·페이지가 URL(searchParams)·query key에 실리고, popstate(뒤로/앞으로)에서 화면이 복원된다(0단계 실측 뒤로가기 + `ProductSearchInput`·`ProductListView` 테스트). debounce는 popstate 시 즉시 취소·리마운트해 옛 검색어를 밀지 않는다. slow 재녹화(`after_slow`)에서 갱신·복원과 함께 **취소된 요청**(연속 변경 시 이전 `/api/products`가 `net::ERR_ABORTED`, 활성 요청만 반영)을 확인했다.
- **273 상태·개수**: 빈 결과("조건에 맞는 상품이 없습니다" — 페이지네이션은 `totalCount 0`이라 숨겨 "1/1"이 결과 있는 듯 보이지 않게 한다)·최초 실패(인라인)·갱신 실패(목록 유지+배너)·재시도, 장바구니·위시리스트·Header 개수 파생이 테스트로 유지된다(88개 통과). 4단계 재녹화 확인: slow에서 최초 진입 스켈레톤·갱신(목록 유지), normal(`after_normal`)에서 cart·wishlist·Header 개수(클라 전용, HAR에 cart/wishlist API 호출 없음), error에서 목록 error.tsx·홈 인라인 alert.
- **274 FSD**: shared·entities·features·widgets가 상위를 import하지 않는다(감사 통과). products는 의도적 무배럴(세그먼트 직접 import) 규약대로다.
- **289**: `pnpm test` 88개 통과, `pnpm check`(test·lint·typecheck·build) 통과.

### 효과 없거나 악화 — 숨기지 않은 결과

- **metadata의 slow 대기 비용**(3단계): 동적 metadata는 크롤러(`facebookexternalhit`)에 배너 데이터를 기다리게 해 slow에서 TTFB가 1.5s가 된다. 사용자 FCP는 스트리밍으로 무해하나 크롤러 응답엔 비용이 실린다. URL별 정확한 공유·SEO metadata 이점이 커 유지한다.
- **필터 시 metadata 미갱신**(3단계 shallow 판단): 2단계 클라 필터링의 결과로 온페이지 필터에선 탭 title이 새로고침 전까지 갱신되지 않는다. 크롤러·공유는 URL별 서버 렌더로 정확해 개입하지 않는다.
- **3단계의 홈 LCP 악화와 그 수정**(위 절): 동적 metadata 스트리밍이 Hero를 데이터 뒤로 미뤄 LCP 1.2→1.5s. metadata 자체는 요구라 되돌리지 않고, Hero 이미지를 셸에서 preload해 발견만 분리해 회복했다. 헤드리스가 throttle 없음이라 이 회귀를 못 잡은 점도 함께 기록한다.
- 그 외 이미지 품질·FCP·CLS·기존 기능 회귀는 없다(1단계 FCP·CLS 불변, 육안 품질 유지, 88 테스트 통과).
