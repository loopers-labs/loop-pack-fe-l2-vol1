# Week-07 성능 측정 기록

## 측정 조건 (Before·After 공통 — SHA 제외 전부 동일하게 유지)

| 항목               | 값                                                                              |
| ------------------ | ------------------------------------------------------------------------------- |
| URL                | `http://localhost:3000/` (cold load)                                            |
| 실행               | `pnpm build` → `pnpm start` (production)                                        |
| viewport           | Lighthouse 기본 모바일 에뮬레이션 (412×823, DPR 1.75)                           |
| CPU throttling     | 4x slowdown (Lighthouse 기본, simulate)                                         |
| Network throttling | Slow 4G 시뮬레이션 (RTT 150ms, 1.6Mbps — Lighthouse 기본)                       |
| 브라우저 버전      | HeadlessChrome 150.0.0.0                                                        |
| Lighthouse 버전    | 13.4.1 (`npx lighthouse`, `--form-factor=mobile --only-categories=performance`) |
| load 조건          | cold load (캐시 비우고 하드 리로드)                                             |
| 브라우저 프로필    | 매회 새 임시 `--user-data-dir` (확장·캐시·로그인 없음)                          |

## Before

- **Before SHA**: `0178eb13641d21e621178bf6966195a16414c129`

### Lighthouse 5회 raw 값 (홈 cold load)

| 회차       | FCP    | LCP       | CLS    |
| ---------- | ------ | --------- | ------ |
| 1          | 911 ms | 40,542 ms | 0.0393 |
| 2          | 906 ms | 40,524 ms | 0.0393 |
| 3          | 906 ms | 40,524 ms | 0.0393 |
| 4          | 906 ms | 40,527 ms | 0.0393 |
| 5          | 905 ms | 40,522 ms | 0.0393 |
| **중앙값** | 906 ms | 40,524 ms | 0.0393 |
| **최솟값** | 905 ms | 40,522 ms | 0.0393 |
| **최댓값** | 911 ms | 40,542 ms | 0.0393 |

### DevTools 관찰

- **LCP element**: Hero 이미지 — `section.hero > img` (`<img src="/images/week-07/hero-original.jpg" width="3840" height="2160">`). Lighthouse insight: "Request is discoverable in initial document = false", "fetchpriority=high applied = false" (클라이언트 렌더 후에야 요청이 발견됨)
- **filmstrip 표시 순서**: 375ms 프레임 — Header + 스켈레톤 그리드만 표시(제목·Hero 없음) → 750ms 프레임 — `/api/home` 응답 직후 배너·페이지 제목·Hero가 한꺼번에 등장. 즉 Header 먼저, 제목과 Hero는 API 응답 후 동시 표시. 녹화: [home-loading-before.gif](assets/week-07/home-loading-before.gif)
- **Network waterfall** (Lighthouse run 1 관찰값, localhost 비스로틀 기준):
  | 요청                | 시작 시점                               | 전송 크기            |
  | ------------------- | --------------------------------------- | -------------------- |
  | document (`/`)      | 1 ms                                    | 3.2 KB               |
  | `/api/home`         | 81 ms (완료 586 ms — mock 지연 0.5s)    | 4.2 KB               |
  | `hero-original.jpg` | 595 ms (`/api/home` 완료 직후에야 시작) | 7,545,525 B ≈ 7.5 MB |
- **Layout Shifts**: 1건, score 0.0393 — 원인 요소 `<main>` (body > div.week05-page > main). 홈 스켈레톤이 `/api/home` 응답 후 실제 콘텐츠로 교체되는 시점(관찰 트레이스 기준 약 0.6s)에 발생. CLS 총합 = 이 1건

### 목록 slow 녹화 (`/products?scenario=slow`)

- **데이터 없는 최초 진입** (하드 리로드): 1.5초 동안 페이지 제목·검색·카테고리·정렬·페이지 크기 필터 + 스켈레톤 그리드(`aria-busy="true"` pending UI)가 표시됨. 스켈레톤→실제 목록 교체 시 layout shift 없음 (Lighthouse CLS 0). 녹화: [products-slow-loading-before.gif](assets/week-07/products-slow-loading-before.gif)
- **기존 목록이 있는 갱신** (검색·카테고리·정렬·페이지 변경): `placeholderData: keepPreviousData` 덕에 목록이 비워지지 않고 이전 목록 유지. 단 `isFetching`/`isPlaceholderData`를 UI에 쓰지 않아 **갱신 중 표시가 전혀 없음**
- **연속 조건 변경** (카테고리→정렬→검색 0.3초 간격 연속 변경, 200ms 간격 DOM 샘플링): URL은 각 변경 즉시 반영되지만 화면은 마지막 응답 도착까지(~1.5초 이상) 이전 조건의 목록("총 30개")을 그대로 표시 → **URL과 화면 불일치 구간 존재**. 중간 조건의 늦은 응답 2건은 나중에 완료됐지만 화면을 덮지 않았고, 화면은 최종 조건 결과("총 0개")로만 교체됨 (queryKey 기반이라 race 안전)
- **취소된 요청**: 취소 자체가 발생하지 않음 — queryFn이 AbortSignal을 fetch에 전달하지 않아 조건 변경으로 뒤처진 요청 3건 모두 완주(canceled 없음). 오류로 노출되지도 않음

### 판단 (각 한 문장)

- **관찰한 사실**: LCP 중앙값이 40.5초로 FCP(0.9초)와 44배 차이 나고, LCP 요소인 hero-original.jpg(7.5MB, 3840×2160)는 초기 HTML에 없어 `/api/home` 응답(0.5초) 후에야 요청이 시작된다.
- **원인 가설**: 원본 크기 그대로의 7.5MB 이미지를 최적화 없는 `<img>`로, 그것도 클라이언트 fetch 완료 후에야 로드하기 때문에 모바일 회선(1.6Mbps)에서 전송에만 ~37초가 걸려 LCP가 지연된다.
- **가설을 반증할 방법**: 로딩 시점은 그대로 두고 이미지 파일만 뷰포트 크기에 맞게 줄여(예: next/image 최적화) 재측정했을 때 LCP가 5회 측정 범위(±20ms)보다 크게 줄지 않으면 가설 기각.
- **먼저 시도할 가장 작은 변경**: HeroSection의 `<img>`를 `next/image`의 `<Image priority>`로 교체해 자동 리사이즈·포맷 변환과 preload를 적용한다.

## 1단계 — Hero LCP (중간 측정)

### LCP 구간 분해 판정 (Before 데이터 기준)

| 구간                  | 관찰값(비스로틀)                                 | Slow 4G 시뮬레이션 환산       | 판정     |
| --------------------- | ------------------------------------------------ | ----------------------------- | -------- |
| 서버 응답 대기        | 4~6ms                                            | ~0.15초                       |          |
| 이미지 요청 시작 대기 | 585~595ms (하이드레이션 + `/api/home` 0.5s 대기) | ~3초                          |          |
| 전송                  | 48~63ms (localhost)                              | **~36.8초** (7.5MB ÷ 1.6Mbps) | **최장** |
| 그리기                | 80~98ms                                          | ~0.4초                        |          |

→ 전송이 LCP 40.5초의 약 90%. 적용한 변경(승인 후 구현):

1. **전송**: HeroSection `<img>` → `next/image` `<Image sizes="100vw" priority>` — 실제 표시 크기(모바일 412 CSS px × DPR 1.75 ≈ 721px → 750w 후보) 기준 리사이즈 + WebP 재인코딩, 시각적 크기·비율(3840×2160 intrinsic, `object-fit: cover`)·품질(q75) 유지
2. **렌더링 경계**: HeroSection을 데이터 분기 밖으로 이동해 항상 렌더(SSR HTML 포함 → preload 발견), 로딩 중 HomeBanner 자리는 같은 공간의 `.week05-hero` placeholder(min-height 220px)가 유지, Hero copy는 absolute 배치라 늦게 떠도 밀림 없음

### 1단계 후 Lighthouse 5회 (홈 cold load, Before와 같은 조건)

| 회차       | FCP    | LCP      | CLS |
| ---------- | ------ | -------- | --- |
| 1          | 909 ms | 3,107 ms | 0   |
| 2          | 906 ms | 3,013 ms | 0   |
| 3          | 905 ms | 3,124 ms | 0   |
| 4          | 905 ms | 2,869 ms | 0   |
| 5          | 905 ms | 3,010 ms | 0   |
| **중앙값** | 905 ms | 3,013 ms | 0   |
| **최솟값** | 905 ms | 2,869 ms | 0   |
| **최댓값** | 909 ms | 3,124 ms | 0   |

### Before 대비 인과관계

- **이미지 전송 크기**: 7,545,525 B → **32,424 B** (750w WebP, 약 1/233) — 최장 구간이던 전송이 시뮬레이션 ~36.8초 → ~0.16초로 줄어 LCP 중앙값 40,524ms → 3,013ms (−92.6%). 측정 흔들림(5회 범위 FCP ±5ms, LCP ±255ms)보다 압도적으로 큰 변화
- **요청 시작**: 595ms(`/api/home` 완료 후) → **17ms**(초기 HTML의 preload가 문서 파싱 직후 발동, `/api/home`(96ms)보다도 먼저). Lighthouse insight "Request is discoverable in initial document" false → true
- **Layout shift**: 0.0393(스켈레톤→콘텐츠 교체) → **0** — 배너 placeholder가 같은 공간을 차지하고 Hero가 항상 렌더되므로 교체 시 밀리는 요소 없음
- **filmstrip**: 375ms 프레임에 Header+배너 placeholder+**Hero 이미지**까지 표시(Before는 스켈레톤뿐), 750ms에 h1·copy·카테고리가 같은 자리에 등장. 녹화: [home-loading-step1.gif](assets/week-07/home-loading-step1.gif)
- **LCP element**: 변화 없음 — 동일한 Hero `<img>`(이제 `/_next/image?...&w=750` 최적화 응답)
- **부작용 확인**: FCP 변화 없음(905ms), `/products?scenario=slow` 목록 pending UI·동작 이전과 동일

## 2단계 — 목록 상태와 CLS (중간 기록)

### 여섯 상태 사전 검증 (구현 전, 클로드 브라우저)

| 상태                    | 검증 결과                                                                                                                                         | 판정       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 데이터 없는 최초 진입   | SSR HTML에 `aria-busy="true" aria-label="상품 목록 불러오는 중"` + pageSize(12)개 스켈레톤 카드 — 목록 크기 예상 가능                             | 충족       |
| 이전 데이터가 있는 갱신 | 정렬 변경 후 1.5초 동안 기존 목록 유지되지만 갱신 중 표시가 전혀 없음 (busy/status 마커 0건)                                                      | **미충족** |
| 성공 + 0건              | 없는 검색어 입력 시 URL에 q 반영 + 검색창에 조건 표시 + "총 0개" + "검색 결과가 없어요" 안내                                                      | 충족       |
| 최초 실패               | `throwOnError`(status≥500)가 던져져 `products/error.tsx` 바운더리가 실패 이유 + "다시 시도"를 표시 (코드 경로로 확정)                             | 충족       |
| 갱신 실패               | 같은 throw 경로로 바운더리가 **페이지 전체를 교체** → 기존 목록 유지 불가 (코드 경로로 확정)                                                      | **미충족** |
| 취소                    | queryFn이 AbortSignal 미사용 → 취소 자체가 없고 뒤처진 요청은 완주하되 queryKey가 달라 화면을 덮지 않음, 오류 노출 없음 (연속 변경 실험에서 확인) | 충족       |

### 최소 변경 (미충족 2건만)

- [queries.ts](../../src/_pages/products/api/queries.ts): 목록 쿼리의 `throwOnError` 제거 — 에러를 컴포넌트에서 최초/갱신으로 구분 처리
- [product-list-content.tsx](../../src/_pages/products/ui/product-list-content.tsx):
  - `isPending` → 스켈레톤(최초 진입), `!isPending && isFetching` → 기존 목록 위에 "목록을 갱신하는 중…" 상태 줄(항상 같은 높이 유지로 shift 방지)
  - `isError && 캐시에 성공 없음` → 전체 실패 Placeholder + 다시 시도 (최초 실패)
  - `isError && 캐시에 성공 있음` → React Query 캐시에서 가장 최근 성공 응답을 읽어 기존 목록 유지 + 갱신 실패 알림 + 다시 시도 (서버 응답의 로컬 복사 없음 — 캐시가 단일 출처)
- **isPending/isFetching 역할**: `isPending`은 "보여줄 데이터가 아직 없다"(최초 스켈레톤 담당), `isFetching`은 "네트워크 요청 진행 중"(기존 목록 위 갱신 표시 담당). placeholderData가 있으면 isPending=false·isFetching=true가 되어 두 상태가 자연히 갈린다
- **URL 조건과 query key**: nuqs 파서 → `productSearchParsers` 상태가 queryKey(`["products", normalized]`)와 GET 쿼리스트링에 동일하게 들어감 (기존 충족, 변경 없음)

### 구현 후 재검증 + 증거 (production build)

| 상태                    | 재검증 결과 (실측)                                                                                                                                          | 증거                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 데이터 없는 최초 진입   | 1.5초 동안 제목·필터 + pageSize개 스켈레톤, 목록 교체 시 CLS 0 (Lighthouse layout shift 0건)                                                                | [state1-initial-pending.gif](assets/week-07/state1-initial-pending.gif) |
| 이전 데이터가 있는 갱신 | 정렬 변경 → 기존 목록 유지 + "목록을 갱신하는 중…" 표시 → 완료 시 새 결과로 교체 (DOM 샘플: 0→1174ms 표시→2168ms 교체)                                      | [state2-refreshing.png](assets/week-07/state2-refreshing.png)           |
| 성공 + 0건              | `scenario=empty` 진입: "총 0개" + "검색 결과가 없어요" 안내, URL 조건은 필터 컨트롤에 반영                                                                  | [state3-empty.gif](assets/week-07/state3-empty.gif)                     |
| 최초 실패               | `scenario=error` 하드 리로드: 스켈레톤 → 재시도 소진(~9.1초) 후 목록 대신 "상품을 불러오지 못했어요" `role="alert"` + 다시 시도, 필터 유지                  | [state4-initial-error.png](assets/week-07/state4-initial-error.png)     |
| 갱신 실패               | 목록 있는 상태에서 500 응답 강제 → 기존 목록 그대로 + "목록을 갱신하지 못했어요 (…) 다시 시도" `role="alert"`; 다시 시도 클릭 → 갱신 중 → 새 결과 복구 확인 | [state5-refresh-failed.png](assets/week-07/state5-refresh-failed.png)   |
| 취소                    | 카테고리→정렬→카테고리 연속 변경: 요청 3건 모두 완주(취소 없음)·오류 노출 없음, 갱신 내내 "갱신하는 중" 표시, 최종 URL(active query)과 화면 일치            | DOM·네트워크 타임라인 (아래)                                            |

- **연속 변경 타임라인**(5번 루틴 재수행): URL은 각 변경 즉시 반영, 화면은 기존 목록 + "갱신하는 중…" 유지, 최종 조건 응답(end 2990ms) 도착 후 총 30개·최신순으로 확정 — 중간 응답(end 1521/1995ms)이 최종 화면을 덮지 않음
- **fallback→콘텐츠 교체 CLS**: slow·empty·error 세 시나리오 모두 Lighthouse CLS 0, layout shift 0건
- **상태 줄 고정 높이**: idle에도 같은 라인박스를 차지하는 숨김 텍스트를 렌더해 갱신 표시 전환 시 아래 콘텐츠가 밀리지 않게 함
- 측정 환경 참고: 클로드 브라우저 패널이 비표시(hidden)면 TanStack Query가 재시도를 일시정지하므로, 에러 상태 검증은 headless Chrome(visible)로 수행함

## 3단계 — metadata와 Open Graph (중간 기록)

### 합성 확인과 구현

- **루트 layout**: `metadataBase(APP_ORIGIN)` + `title.template("%s | Commerce")` + 공통 openGraph(siteName·locale·type·fallback image). 페이지 `openGraph`는 shallow merge로 루트를 통째로 덮으므로 `sharedOpenGraph` 공통 객체를 각 페이지에서 spread해 siteName·locale·type을 유지
- **발견**: `title.template`은 자식 세그먼트에만 적용된다 — `/products`(자식)는 `"…" | Commerce`가 붙지만, 홈(`app/page.tsx`)은 template을 정의한 layout과 같은 세그먼트라 suffix 없이 배너 title만 노출 (Next 문서상 의도된 동작)
- **같은 query factory·URL 정규화**: 홈은 `homeQueries.home()`, 목록은 `productListQueries.list()`를 본문과 그대로 사용. 목록의 URL 조건은 nuqs `createLoader(productSearchParsers)`로 본문과 같은 파서에서 정규화 → queryKey와 GET 쿼리스트링이 본문과 동일
- **서버 QueryClient**: `getQueryClient()`는 호출마다 새 QueryClient (singleton·영속 캐시 없음)
- **서버 fetch 절대 URL**: `fetchCommerceApi`가 서버에서만 `APP_ORIGIN`을 앞에 붙임 (클라이언트는 상대 URL 유지)
- 홈·목록 모두 요청 시점 metadata를 위해 동적 렌더링 (`/` force-dynamic, `/products`는 searchParams 사용으로 자동) — `robots: noindex` 없음

### 규칙 적용 실측 (JS 끈 초기 HTML = curl document 응답)

| URL 조건                                                      | title                         | description                                                | og:image              |
| ------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------- | --------------------- |
| `/` (홈)                                                      | 매일 새롭게 발견하는 취향     | 지금 가장 사랑받는 상품을 만나보세요.                      | banner image (p6.jpg) |
| `/products?q=후디`                                            | "후디" 검색 결과 \| Commerce  | 전체 카테고리 상품 1개를 최신순으로 만나보세요.            | 첫 상품 (p27.jpg)     |
| `/products?page=2`                                            | 상품 목록 2페이지 \| Commerce | 전체 카테고리 상품 30개를 최신순으로 만나보세요.           | 첫 상품 (p30.jpg)     |
| `/products?q=니트&category=fashion&sort=price-asc` (성공 0건) | "니트" 검색 결과 \| Commerce  | 패션 카테고리(낮은 가격순) 조건에 맞는 상품이 0개입니다. … | **fallback 유지**     |
| `/products?scenario=empty`                                    | 상품 목록 \| Commerce         | 전체 카테고리(최신순) 조건에 맞는 상품이 0개입니다. …      | **fallback 유지**     |

### metadata query failure (`APP_ORIGIN=http://127.0.0.1:9` build·runtime)

- 홈·목록 document 모두 **HTTP 200** + **root 공통 metadata 상속** (`<title>Commerce</title>`, 루트 description, 루트 og) — 페이지별 빈 metadata가 만들어지지 않음. 본문은 클라이언트 상대 URL fetch라 화면은 정상 동작

### Route Handler 실제 호출 횟수 (임시 서버 로그 계수 → 제거 완료)

- curl document 1회 (JS 없음): `/api/products` **1회** — generateMetadata의 서버 fetch만
- 실제 브라우저 로드 1회 (JS 실행): **4회** — ① metadata 서버 fetch ② 본문 클라이언트 fetch (서버/클라이언트가 별개 실행이라 같은 URL이어도 memoization 대상 아님) ③④ Header `<Link href="/">`·`<Link href="/products">` prefetch가 각 라우트의 generateMetadata를 실행시켜 `/api/home`·기본 `/api/products` 추가 호출 — **동적 metadata의 숨은 비용**

> 이 계수는 서버 prefetch 도입 전(`18bc4400`) 값이다. 이후 본문을 서버에서 prefetch하고 hydration으로 넘기면서 ②가 사라졌다. 재측정은 [After 이후 변경](#after-이후-변경--서버-prefetch와-queryclient-정리)에 있다.

### UA별 document 응답 시점 (`/products?scenario=slow`, 3회)

| UA                  | time_starttransfer | time_total   | 해석                                                 |
| ------------------- | ------------------ | ------------ | ---------------------------------------------------- |
| 일반(curl 기본)     | 0.007~0.010s       | 1.511~1.529s | 스트리밍 — 셸 먼저 전송, metadata는 body로 늦게 합류 |
| facebookexternalhit | 1.513~1.523s       | 1.513~1.523s | HTML 제한 봇 — metadata 완성까지 문서 전체 블로킹    |

→ 크롤러에게는 slow API 1.5초가 그대로 첫 바이트 지연이 된다. 동적 metadata의 비용은 일반 사용자가 아니라 봇 응답 시점과 prefetch 유발 호출에서 드러남

> 이 비교도 서버 prefetch 도입 전(`18bc4400`) 값이다. 이후 본문이 서버에서 데이터를 기다리게 되면서
> 일반 UA의 스트리밍 이점이 사라졌다. 재측정은 [After 이후 변경](#ua별-document-응답-시점-재측정-일반-ua의-스트리밍-이점-상실)에 있다.

## After

- **After SHA**: `18bc44003be4d0fd0f2fcd86ad5e2b980471d532`
- **최종 head와의 관계**: 3단계 제출 head `c923cfb7`은 측정 SHA와 다르지만, 두 커밋 사이
  변경은 이 문서와 After GIF 2개뿐이다(`git diff 18bc4400..c923cfb7 --stat`).
  측정 대상 실행 코드는 3단계 제출 상태와 동일하다
- 측정 조건은 Before와 동일 (측정 조건 표), 실행만 `APP_ORIGIN=http://localhost:3000 pnpm build`→`pnpm start` (3단계 metadata의 서버 fetch용 origin 지정)

### Lighthouse 5회 raw 값 (Before와 같은 조건)

| 회차       | FCP    | LCP      | CLS |
| ---------- | ------ | -------- | --- |
| 1          | 909 ms | 2,789 ms | 0   |
| 2          | 905 ms | 2,642 ms | 0   |
| 3          | 905 ms | 2,719 ms | 0   |
| 4          | 904 ms | 2,564 ms | 0   |
| 5          | 905 ms | 2,721 ms | 0   |
| **중앙값** | 905 ms | 2,719 ms | 0   |
| **최솟값** | 904 ms | 2,564 ms | 0   |
| **최댓값** | 909 ms | 2,789 ms | 0   |

### Before 대비 비교

- **LCP element 변화**: 동일한 Hero `<img>` — src만 원본 jpg에서 `/_next/image?...&w=750`(WebP) 최적화 응답으로 변경, "Request is discoverable in initial document" false → true
- **Hero 이미지 전송 크기·요청 시작 순서 변화**: 전송 7,545,525 B → **32,423 B** (약 1/233). 요청 시작 순서 document → `/api/home`(81ms) → hero(595ms)였던 것이 document → **hero(21ms)** → `/api/home`(93ms)로 역전 (초기 HTML preload)
- **가장 길었던 구간의 변화**: 전송(load duration) — 시뮬레이션 ~~36.8초(전체의 90%)가 ~~0.16초로. 관찰 트레이스 기준 4구간 모두 균등하게 짧아짐 (TTFB 7~~11ms / load delay 6~~8ms / 전송 7~~41ms / 렌더 41~~54ms)
- **측정 흔들림(5회 범위)보다 큰 변화인가**: 그렇다 — Before LCP 5회 범위는 20ms(40,522~~40,542), After 범위는 225ms(2,564~~2,789)인데 변화량은 **37,805ms(−93.3%)**. CLS도 5회 모두 0.0393 → 5회 모두 0으로 결정적
- **효과 없거나 악화된 변경과 유지/되돌림 판단**:
  - 홈이 정적 프리렌더 → **동적 렌더링**으로 전환됨(3단계 요청 시점 metadata 요구): 문서 완료 시간 6ms → 528ms(스트리밍이 `/api/home` metadata를 기다림). 다만 첫 바이트는 스트리밍으로 즉시 나가 FCP(905ms 동일)·LCP(오히려 개선)·CLS(0) 등 사용자 체감 지표 악화 없음 → **유지** (비용은 크롤러 첫 바이트 1.5s와 Link prefetch 유발 API 호출로 3단계에 기록)
  - 홈 title에 template 미적용(같은 세그먼트): Next 의도된 동작으로 기록하고 유지
  - 그 외 되돌릴 변경 없음 — 이미지 품질(q75)·시각 크기·기존 기능 저하 없음

### 회귀 확인

- 목록 최초 진입·갱신 재녹화, URL 복원(검색·카테고리·정렬·페이지): 최초 진입 스켈레톤→목록 재녹화 [products-slow-after.gif](assets/week-07/products-slow-after.gif) (CLS 0), 갱신 중 표시·실패 유지 동작은 2단계 증거와 동일. `?q=후디&category=all&sort=popular&page=1` 하드 로드 시 검색 input·셀렉트·목록 모두 URL대로 복원 ✓
- 뒤로/앞으로 가기: casual 변경 → 뒤로(이전 조건·목록·input 복원) → 앞으로(casual 복원) 모두 URL·화면·컨트롤 일치 ✓
- 장바구니·위시리스트·Header 개수: 찜 클릭 → `aria-pressed=true` + "위시리스트 1", 담기 클릭 → "담김" + "장바구니 1" 즉시 반영 ✓
- 로딩·에러·빈 상태·재시도: 스켈레톤(GIF), `scenario=error` 실패 이유+다시 시도, `scenario=empty` "총 0개"+안내 모두 After 빌드에서 재확인 ✓ (다시 시도 클릭 복구는 2단계에서 검증)
- FSD 의존 방향·슬라이스 Public API 우회 여부: 외부에서 `_pages` 내부 deep import 0건(모두 index 경유), shared→상위 레이어 역참조 0건, entities/widgets 방향 위반 0건 ✓
- `pnpm check`(test+lint+typecheck+build) 통과
- 홈 After 재녹화: [home-loading-after.gif](assets/week-07/home-loading-after.gif)

## After 이후 변경 — 서버 prefetch와 QueryClient 정리

After 측정(`18bc4400`) 이후 데이터 동기화 경로를 TanStack Query의
[Advanced SSR 가이드](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)에 맞춰 정리했다.
**Lighthouse(FCP·LCP·CLS)는 재측정하지 않았다** — 아래 값은 데이터 경로 관련 재측정만이며,
성능 지표를 다시 비교하려면 같은 조건으로 5회 재실행이 필요하다.

- **측정 SHA**: `729c61c1d2b4c66beca56cb8b6b4be5f34ae2921`
- **측정 SHA와 head의 관계**: 계수 재측정(`729c61c1`)과 UA 재측정(`68e80f18`) 사이의 코드
  변경은 OG fallback 정적 에셋 교체(`68e80f18`)뿐이고, `68e80f18` 이후 이 절의 head
  `9806af46`까지는 문서만 변경됐다
- **실행**: `APP_ORIGIN=http://localhost:3100 pnpm build` → `pnpm start -p 3001`
  (`3100`은 서버 측 호출만 세는 계수용 프록시 → `3001`로 포워딩. 클라이언트는 상대 URL이라 프록시를 거치지 않아
  서버 호출과 브라우저 호출이 자동으로 분리된다)

### 변경 내역

| 커밋                  | 내용                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `f0678347`·`ec54886c` | 홈·목록 서버 prefetch와 `HydrationBoundary` 적용                                                                                         |
| `9cacfd65`            | 적용되지 않던 기본값 제거 — Provider의 `staleTime` 20초(각 쿼리가 자체 지정), 목록의 `gcTime` 5분(v5 클라이언트 기본값과 동일)           |
| `293a0452`·`bdcbbe7c` | `getQueryClient()` 단일 팩토리로 통합. 서버는 호출마다 새 인스턴스, 브라우저는 모듈 단일 인스턴스 (`environmentManager.isServer()` 분기) |
| `991bd77d`            | 갱신 실패 폴백에서 캐시 전체 스캔 제거                                                                                                   |

`getQueryClient()`가 서버에서 호출마다 새 QueryClient를 만드는 동작은 그대로다.
싱글턴은 브라우저 분기에만 있으므로 metadata와 본문은 여전히 캐시를 공유하지 않는다.

### Route Handler 호출 계수 재측정 (계수용 프록시 → 측정 후 제거)

| 상황                                        | 서버 측 `/api` 호출 | 브라우저 `/api` 호출 |
| ------------------------------------------- | ------------------- | -------------------- |
| curl document `/products` (JS 없음)         | **1회**             | —                    |
| 브라우저 전체 로드 `/products?sort=popular` | **1회**             | **0건**              |
| 브라우저 전체 로드 `/`                      | **1회**             | **0건**              |
| 클라이언트 내비게이션 홈 → 상품             | **1회**             | **0건**              |

- **memoization 유지**: `generateMetadata`와 본문이 각자 새 QueryClient로 각각 fetch하는데도 서버 측 호출은 1회다.
  `fetchCommerceApi`가 옵션 없는 `fetch(url)`을 쓰기 때문에 URL·options가 모두 같아 memoization 대상이 된다.
  queryFn에 `AbortSignal`을 넘기기 시작하면 호출마다 options가 달라져 이 dedupe가 깨진다.
- **본문 클라이언트 fetch 소멸**: 3단계에서 관찰한 ②가 없어졌다. 서버 prefetch 결과가 hydration으로 넘어오고,
  목록 `staleTime` 60초 안이라 마운트 시 재요청하지 않는다. 브라우저 네트워크 14건은 document·폰트·CSS·JS 청크뿐이다.
- **③④(Link prefetch 유발 호출)는 이번 측정에서 재현되지 않았다.** 브라우저 네트워크에 RSC prefetch 요청 자체가
  잡히지 않았다. 3단계 관찰을 부정하는 근거로 쓰기에는 조건이 다를 수 있어, 재현되지 않았다는 사실만 남긴다.

### UA별 document 응답 시점 재측정 (일반 UA의 스트리밍 이점 상실)

`68e80f18` production build, `APP_ORIGIN=http://localhost:3000`, `/products?scenario=slow`, 워밍업 1회 후 각 3회.

| UA                  | time_starttransfer | time_total   | 3단계(`18bc4400`) 대비  |
| ------------------- | ------------------ | ------------ | ----------------------- |
| 일반(curl 기본)     | 1.518~1.530s       | 1.519~1.531s | **0.007s → 1.52s 악화** |
| facebookexternalhit | 1.520~1.527s       | 1.521~1.528s | 변화 없음               |

- **원인**: 본문 `page.tsx`가 `await queryClient.prefetchQuery(...)` 뒤에 JSX를 반환한다. 셸의 어느 부분도
  렌더될 수 없어 스트리밍이 시작되지 못한다. metadata가 늦어서가 아니라 **본문이 먼저 막기 때문**이다.
- **반증 확인**: 같은 응답에서 `og:title`이 byte 1316, `<body`가 byte 2409 — metadata가 body로 늦게 합류하지
  않고 head에 완성된 채 전송됐다. 3단계에서 관찰한 streaming metadata 경로가 더 이상 동작하지 않는다는 증거다.
- **트레이드오프 판단**: 서버 prefetch는 브라우저 `/api` 호출을 0건으로 만들고 목록 하이드레이션을 얻었지만,
  그 대가로 일반 사용자의 첫 바이트가 slow API 1.5초를 그대로 기다리게 됐다. 이제 동적 metadata의 비용은
  봇에만 국한되지 않는다. 되돌리지 않고 유지하는 이유는 이번 주 병목이 Hero LCP와 목록 상태 전환이고,
  일반 UA의 `time_total`은 두 측정에서 같은 1.5초대이기 때문이다. 셸을 먼저 보내려면 `await` 없이
  prefetch를 Suspense 경계 아래로 내려야 하는데, 그러면 2단계에서 맞춘 pending·갱신 화면 경계가 다시 흔들린다.

> 이 악화는 이후 pending 쿼리 dehydrate 스트리밍(`e0d3eb4e`)으로 해소됐다.
> 재측정은 [셸 스트리밍 복원](#셸-스트리밍-복원--서버-데이터-함수-직접-조회와-홈-slow-재측정)에 있다.

### 하이드레이션 확인

- `/products?category=digital` 전체 로드: 카드 6개 렌더, 캐시에 서버가 넣어준 키 1건, 클라이언트 `/api` 요청 0건
- 클라이언트 내비게이션(상품 → 홈 → 상품): QueryClient가 **동일 인스턴스**로 유지(참조 비교), 캐시 3건 누적, `/api` 요청 0건
- **초기 HTML 주의**: `/products` document에는 목록이 없고 Suspense fallback 마커(`<!--$?-->`)와 스켈레톤만 있다.
  nuqs의 `useSearchParams`가 SSR에서 해당 서브트리를 지연시키기 때문이다.
  dehydrate 페이로드는 RSC 스트림에 정상적으로 실려 있어 **클라이언트 캐시 동기화는 되고 SSR 렌더만 안 된다**.
  홈은 `useSuspenseQuery`라 초기 HTML에 배너·인기 상품·신상품이 모두 들어간다.

### 목록 갱신 실패 재검증 (`window.fetch`를 500으로 가로채 재현)

| 경로                            | 결과                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 같은 조건 재요청 실패           | 목록 6개 **유지** + `role="alert"` "목록을 갱신하지 못했어요 (…) 다시 시도". 캐시 상태 `status: error` / `data` 유지 |
| 조건 변경 후 실패 (패션→캐주얼) | pending 동안 이전 목록 유지 + "갱신하는 중…" → 실패 후 전체 실패 Placeholder, URL·셀렉트 모두 `casual`로 일치        |
| 복구                            | 패치 해제 후 "다시 시도" → 총 6개 정상 복원                                                                          |

2단계 상태표의 "갱신 실패 = 기존 목록 유지"는 React Query가 같은 키의 재요청 실패에서 `data`를 유지하기 때문에
별도 폴백 없이 성립한다(`query.js`의 error 전이가 `...state`로 기존 `data`를 보존).
조건을 바꾼 뒤의 실패는 그 조건의 최초 실패로 처리해 "현재 URL의 active query와 화면 결과 일치"를 지킨다.
이전 구현은 캐시 전체에서 `dataUpdatedAt`이 가장 최근인 응답을 골랐기 때문에 `casual` URL 아래 `fashion` 목록이 남을 수 있었다.

### 재시도 일시정지의 실제 원인

2단계에 "패널이 비표시면 재시도가 일시정지된다"고 적었는데, 원인은 패널이 아니라 **탭 포커스**다.
`retryer.js`의 `canContinue()`가 `focusManager.isFocused()`를 요구하고, `focusManager`는 **window**의
`visibilitychange`를 듣는다. 탭이 hidden이면 `fetchStatus: "paused"`로 멈추고 재시도가 진행되지 않는다.

## 셸 스트리밍 복원 — 서버 데이터 함수 직접 조회와 홈 slow 재측정

앞 절에서 유지로 판단했던 "일반 UA 첫 바이트 1.5초" 트레이드오프를 해소하고,
홈에서 재현할 수 없던 과제의 1.5초 slow 조건을 URL로 되살려 재측정했다.
**Lighthouse(FCP·LCP·CLS)는 이번에도 재측정하지 않았다.**

- **측정 SHA**: `e0d3eb4e` — 이 SHA 이후 head까지의 커밋은 이 문서 변경뿐이다
  (측정 대상 실행 코드 = 최종 제출 상태)
- **실행**: `pnpm build` → `pnpm start -p 3210`. 서버 조회가 HTTP 자기 호출이 아니게 되어
  `APP_ORIGIN` 지정도 계수용 프록시도 더 이상 필요 없다

### 변경 내역

| 커밋       | 내용                                                                                                                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `8a560558` | mock 응답 생성을 Route Handler에서 서버 데이터 함수(`getHomeResponse`·`getProductListResponse`)로 분리. 에러는 자체 계약 `MockApiError`, dedupe는 React cache                                                                                  |
| `e0d3eb4e` | 홈 URL scenario를 queryKey·조회 조건까지 전파(`/?scenario=slow` 재현), generateMetadata·본문 prefetch가 `APP_ORIGIN` HTTP 자기 호출 대신 데이터 함수를 직접 조회, prefetch를 await하지 않고 pending 쿼리를 dehydrate에 포함해 셸 우선 스트리밍 |

pending 쿼리 dehydrate는 앞 절의 우려(prefetch를 Suspense 아래로 내리면 2단계 경계가 흔들린다)와
달리 경계 구조를 그대로 두고 promise만 스트림에 싣는다. `useSuspenseQuery`·pending fallback·갱신
화면은 변경 없이 유지된다.

### UA별 document 응답 시점 재측정 (`scenario=slow`, 워밍업 1회 후 각 3회)

| 경로        | UA                  | time_starttransfer | time_total   | 직전(`68e80f18`) 대비        |
| ----------- | ------------------- | ------------------ | ------------ | ---------------------------- |
| `/`         | 일반(curl 기본)     | 0.007~0.009s       | 1.516~1.521s | 홈 slow는 이번이 첫 기록     |
| `/`         | facebookexternalhit | 1.512~1.517s       | 1.513~1.518s |                              |
| `/products` | 일반(curl 기본)     | 0.007~0.018s       | 1.511~1.523s | **1.52s → 0.007s 복원**      |
| `/products` | facebookexternalhit | 1.513~1.518s       | 1.513~1.520s | 변화 없음 — 완성된 head 대기 |

크롤러가 metadata 완성(slow 조회)을 기다리는 비용은 동적 metadata를 쓰는 한 남는다. 일반
사용자·크롤러 모두에게 첫 바이트를 앞당기려면 metadata를 조회와 무관한 정적 값으로 바꿔야 한다.

### 홈 slow의 document·API·이미지 요청 순서 재기록

스트림 청크 계측 (`/?scenario=slow`, node fetch로 청크 도착 시각 기록):

| 시각   | 청크 | 내용                                                                                    |
| ------ | ---- | --------------------------------------------------------------------------------------- |
| 0.057s | 1    | 고정 셸 — 실제 크기 Hero fallback `<img>`(byte 305)·스켈레톤(`aria-busy`)·Suspense 마커 |
| 1.552s | 7    | 배너 title·본문 데이터 — Suspense 경계 교체분                                           |
| 1.552s | 9    | `og:title` — streaming metadata가 head가 아닌 body 끝에 합류                            |

브라우저 전체 로드의 요청 순서 (총 15건):

1. document `/?scenario=slow`
2. 폰트 preload 2건
3. **Hero 이미지** `/_next/image?url=…hero-original.jpg&w=3840` — 첫 flush의 셸에서 즉시 발견
4. CSS 2건·JS 청크 9건
5. `/api/home` 요청 **0건** — 조회 결과는 서버 prefetch가 RSC 스트림으로 전달

→ 제목·설명은 조회 결과이므로 데이터 합류 시점(slow 1.55초)에 등장하는 것 자체는 그대로지만,
이제 document가 조회를 기다리지 않고 같은 자리의 실제 크기 Hero fallback과 스켈레톤이 먼저
표시된다. 기본 500ms 경로도 같은 구조다(셸 0.056s → 데이터 0.553s 합류).

metadata와 본문 조회가 직렬이었다면 slow에서 `time_total`이 3초대였을 텐데 1.52초로 관찰돼
최소한 병렬임은 확인했다. 요청당 1회 실행(React cache dedupe)은 별도로 계수하지 않았다.

### 시나리오·API 회귀

- `/?scenario=error`: document 200 + 셸 즉시 전송(0.006s) + fallback metadata(`<title>Commerce</title>`)
  — 조회 실패가 문서 응답을 막지 않는다
- 에러 경계 유지(브라우저 확인): 서버에서 거부된 pending promise는 redact되고 클라이언트가
  `/api/...?scenario=error`로 3회 재시도(모두 500) 후 홈은 전역 에러 화면, 목록은 실패
  Placeholder + "다시 시도"를 표시한다. 탭이 hidden이면 재시도가 시작되지 않아 스켈레톤이
  유지되는데, 이는 위 "재시도 일시정지의 실제 원인"에 기록한 focusManager 동작이다
- Route Handler 동작 동일: `/api/home` 기본 0.53s·slow 1.50s·error 500·잘못된 scenario 400,
  `/api/products` slow 1.51s·잘못된 page 400
- `pnpm check`(test 78건+lint+typecheck+build) 통과

## 후속 — `priority` → `preload` 교체 (`42a5a6dc`)

Next 16에서 `next/image`의 `priority`가 deprecated 되었다(설치된 16.2.10 타입 정의에
`@deprecated Use 'preload' prop instead`로 명시). 동작은 같고 이름만 바뀐 것이므로
Hero의 `priority`를 `preload`로 교체했다. 교체 후 production document 응답에서
`<link rel="preload" as="image" imageSrcSet="/_next/image?...">`가 이전과 동일하게
생성되는 것을 확인했다 — 1단계의 "요청 시작" 개선(초기 HTML preload)에 회귀 없음.

## Advanced A — 관계없는 카드 렌더 축소 (`/performance-lab/inp?pageSize=24`)

### 측정 조건과 이번 측정의 한계

- 실행: `pnpm build` → `pnpm start`(production). Before SHA `99bc535b`, After SHA `fd7c7b13`.
  두 측정 모두 해당 SHA 코드에 아래 임시 render 계수만 더한 빌드로 진행했고, 계수는 기록 후 제거했다.
- 원격 자동화 브라우저(창이 가려진 상태)로 측정해 과제 명시 조건과 두 가지 편차가 있다:
  - **CPU 4x slowdown 미적용** — 자동화 확장으로는 DevTools CPU 스로틀을 걸 수 없다. 절대값은
    4x 조건보다 작게 나오므로, 판단은 같은 조건의 Before/After 상대 비교로 했다.
  - **presentation delay 측정 불가** — 창이 가려진 상태에서는 rAF·paint가 억제되어 Event Timing
    항목이 확정되지 않았다(Interactions track 대체 수단도 같은 이유로 무효). 대신 document
    capture 리스너(React 핸들러 실행 전)와 window bubble 리스너(React가 discrete 이벤트
    업데이트를 동기 flush한 뒤) 사이 시간으로 **processing duration**을, capture 시각 −
    `event.timeStamp`로 **input delay**를 측정했다.
- 렌더 범위는 profiling build의 React Profiler 대신 카드 컴포넌트 본문에 임시
  `window.__cardRenders` 계수를 넣어 클릭 전후 증가분으로 세었다(3단계 임시 서버 로그와 같은
  '계측 후 제거' 방식). 창이 보이는 로컬 환경이라면 DevTools 4x + Interactions track +
  profiling build Profiler로 같은 절차를 재현할 수 있고, 리렌더 계수가 24 → 1로 결정적이어서
  상대 결론은 같을 것으로 판단한다.
- 매 회차 절차: 페이지 리로드(모듈 스코프 store가 아니라 페이지 내 `create` store라 리로드로
  미찜 상태 복원) → 24개 이미지 로드 완료 확인 → 같은 상품 p1("성능 측정 상품 1")의 찜 버튼
  1회 클릭. pageSize 24와 카드 필수 계산은 그대로 두었다.

### Before — 3회 측정과 원인

| 회차       | input delay | processing | 리렌더된 카드 |
| ---------- | ----------- | ---------- | ------------- |
| 1          | 0.5 ms      | 29.2 ms    | 24 / 24       |
| 2          | 0.4 ms      | 25.6 ms    | 24 / 24       |
| 3          | 0.5 ms      | 25.8 ms    | 24 / 24       |
| **중앙값** | 0.5 ms      | 25.8 ms    | 24            |

- **원인**: 카드가 `usePerformanceWishlist((state) => state.wishlistIds)`로 배열 전체를
  구독한다. toggle마다 새 배열 참조가 만들어져 클릭과 무관한 카드까지 24개 전부 리렌더되고,
  카드마다 150,000회 루프(`calculateCardPresentation`)가 다시 실행된다. processing이 카드
  1개분(~3ms대)의 약 24배 규모로 관찰된 것과 일치한다.
- **반증 방법**: 셀렉터만 카드별 boolean 구독으로 좁혀 재측정했을 때 리렌더 계수와 processing이
  줄지 않으면 이 가설을 기각한다.

### 변경 — 가장 작은 개입 (`fd7c7b13`)

```diff
-  const wishlistIds = usePerformanceWishlist((state) => state.wishlistIds);
-  const toggleWishlist = usePerformanceWishlist((state) => state.toggleWishlist);
-  const selected = wishlistIds.includes(product.id);
+  const selected = usePerformanceWishlist((state) => state.wishlistIds.includes(product.id));
+  const toggleWishlist = usePerformanceWishlist((state) => state.toggleWishlist);
```

셀렉터가 배열 대신 boolean을 반환하면 zustand 기본 strict equality 비교로 값이 바뀌지 않은
카드는 리렌더를 건너뛴다. fixture 수(24), 카드 필수 계산, 찜 버튼의 즉각 피드백은 그대로다.

### After — 같은 조건 3회

| 회차       | input delay | processing | 리렌더된 카드 |
| ---------- | ----------- | ---------- | ------------- |
| 1          | 0.5 ms      | 3.7 ms     | 1 (p1)        |
| 2          | 0.6 ms      | 3.1 ms     | 1 (p1)        |
| 3          | 0.5 ms      | 3.7 ms     | 1 (p1)        |
| **중앙값** | 0.5 ms      | 3.7 ms     | 1             |

- processing 중앙값 25.8ms → **3.7ms**(−86%), 리렌더 24 → **1**. Before 3회 범위(25.6~~29.2ms)와
  After 3회 범위(3.1~~3.7ms)가 겹치지 않아 측정 흔들림보다 큰 변화다.
- 즉각 피드백 유지: 클릭한 카드는 클릭 직후 렌더에서 "찜 해제"·`aria-pressed="true"`로 바뀌고,
  "화면 계산" 값도 selected 시드(31) 기준으로 재계산되어 표시된다.
- 회귀 확인: `pnpm check`(test 78건+lint+typecheck+build) 통과, 임시 계수 코드는 측정 후 제거.
