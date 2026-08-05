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
