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

### UA별 document 응답 시점 (`/products?scenario=slow`, 3회)

| UA                  | time_starttransfer | time_total   | 해석                                                 |
| ------------------- | ------------------ | ------------ | ---------------------------------------------------- |
| 일반(curl 기본)     | 0.007~0.010s       | 1.511~1.529s | 스트리밍 — 셸 먼저 전송, metadata는 body로 늦게 합류 |
| facebookexternalhit | 1.513~1.523s       | 1.513~1.523s | HTML 제한 봇 — metadata 완성까지 문서 전체 블로킹    |

→ 크롤러에게는 slow API 1.5초가 그대로 첫 바이트 지연이 된다. 동적 metadata의 비용은 일반 사용자가 아니라 봇 응답 시점과 prefetch 유발 호출에서 드러남

## After

- **After SHA**: (4단계에서 기입)

### Lighthouse 5회 raw 값 (Before와 같은 조건)

| 회차       | FCP | LCP | CLS |
| ---------- | --- | --- | --- |
| 1          |     |     |     |
| 2          |     |     |     |
| 3          |     |     |     |
| 4          |     |     |     |
| 5          |     |     |     |
| **중앙값** |     |     |     |
| **최솟값** |     |     |     |
| **최댓값** |     |     |     |

### Before 대비 비교

- **LCP element 변화**:
- **Hero 이미지 전송 크기·요청 시작 순서 변화**:
- **가장 길었던 구간의 변화**:
- **측정 흔들림(5회 범위)보다 큰 변화인가**:
- **효과 없거나 악화된 변경과 유지/되돌림 판단**:

### 회귀 확인

- 목록 최초 진입·갱신 재녹화, URL 복원(검색·카테고리·정렬·페이지):
- 뒤로/앞으로 가기:
- 장바구니·위시리스트·Header 개수:
- 로딩·에러·빈 상태·재시도:
- FSD 의존 방향·슬라이스 Public API 우회 여부:
