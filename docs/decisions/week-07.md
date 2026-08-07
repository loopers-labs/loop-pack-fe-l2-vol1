# 7주차 성능 최적화 — 측정 기록

## 공통 측정 조건 (Before/After 동일하게 유지)

- 브라우저 / 버전: 
  - Chrome 148.0.7778.179 (arm64, macOS 15.1.1)
- Lighthouse 버전: 
  - DevTools 내장 Lighthouse 패널 (Chrome 148 기준 내장 버전, 패널 실행 시 표시되는 버전 확인해서 보완 가능)
- viewport: 
  - Desktop 
- CPU throttling: 
  - Lighthouse 기본 simulated throttling 사용 (패널에서 별도 조정 안 함) 
- Network throttling: 
  - Lighthouse 기본 simulated throttling 사용 (Slow 4G 계열, 패널 기본값 그대로)
- 브라우저 프로필: 
  - 새 Chrome 프로필 생성, 확장 프로그램 미설치, 로그인 없음, 캐시 비움 상태로 매 측정 시작
- 측정 URL: 
  - http://localhost:3000/ (production build, pnpm build && pnpm start)
- load 조건: cold load — 매 회 새 탭에서 열기 (또는 DevTools Lighthouse의 기본 navigation 모드로 자동 cold load 처리됨)

---

## 0단계 — Before

### Commit SHA (Before)
```
1a4c309d9205e9a859f82dbc3dabce00b92aee7f
```

### Lighthouse 5회 raw 값 — 홈 cold load

| 지표 | 1회 | 2회 | 3회 | 4회 | 5회 | 중앙값 | 최솟값 | 최댓값 |
|------|-----|-----|-----|-----|-----|--------|--------|--------|
| FCP  | 273.8ms | 269.5ms | 258.4ms | 258.2ms | 261.0ms | 261.0ms | 258.2ms | 273.8ms |
| LCP  | 6795.3ms | 6783.4ms | 6813.6ms | 6813.0ms | 6824.1ms | 6813.0ms | 6783.4ms | 6824.1ms |
| CLS  | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

### LCP element
- 확인된 LCP element: `<img>` (Hero 이미지, hero-original.jpg, 3840×2160), selector: `body > main.week05-page > section.hero > img.hero__image`
- Lighthouse JSON 5개 저장 완료 (lighthouse-before-1~5.json)

### LCP breakdown (Lighthouse lcp-breakdown-insight, 1회차 기준)
| 구간 | 시간 |
|------|------|
| Time to first byte | 16.4ms |
| Resource load delay | 670.2ms |
| Resource load duration | 92.6ms |
| Element render delay | 113.3ms |
| **구간 합계** | **892.5ms** |
| **실제 LCP 총합** | **~6813ms** |

⚠️ 구간 합계(892.5ms)와 실제 LCP(6813ms) 사이 약 5900ms 차이 있음. 아래 waterfall/인사이트 참고.

### Performance filmstrip 확인
- Header 표시 시점: ~750~770ms 구간 (Hero와 거의 동시)
- 페이지 제목(h1)/Hero 텍스트 표시 시점: ~750~770ms 구간 (Header와 거의 동시)
- Hero 이미지 표시 시점: ~748~770ms 구간

**관찰**: Header, Hero 텍스트, Hero 이미지가 개별 시점으로 나뉘지 않고 거의 동시(750~770ms)에 한꺼번에 나타남. 이는 `HomePage.tsx`가 `isLoading` 상태로 전체를 게이트하고 있어서(`{isLoading && <p>로딩 중...</p>}`), `/api/home` 응답이 오기 전까지는 Header조차 렌더링되지 않고, 응답이 온 순간 전체가 한 번에 그려지기 때문으로 추정됨.
→ 1단계에서 Header/h1을 데이터 대기와 무관하게 먼저 렌더링하도록 분리하면 FCP를 앞당길 수 있는 근거.

### Network waterfall
| 요청 | URL | 시작 시점(문서 기준) | 완료 시점 | 전송 크기 | 비고 |
|------|-----|-----------|--------|-----------|------|
| document | / | 0ms | 8.8ms | 3.1KB | |
| 홈 데이터 (/api/home) | /api/home | 160ms | 671ms | 4.2KB | scenario=slow 미적용, 기본 500ms 지연만 반영됨 |
| Hero 이미지 | /images/week-07/hero-original.jpg | 676ms | 748.5ms (로컬 기준) | 7,545,239 bytes (~7.5MB) | 로컬에서는 72ms만에 전송되지만 실제 병목의 핵심 |

### ⭐ 핵심 인사이트: Lighthouse LCP 6.8초의 정체
로컬 Performance trace(cache disabled, 진짜 cold load)로 재보면 document~Hero 완료까지 전체 750ms밖에 안 걸림. 반면 Lighthouse는 5회 모두 LCP ~6.8초로 일관되게 측정됨. 그 차이(~5.9초)는:

- Lighthouse Desktop 기본 시뮬레이션 네트워크 조건: `throughputKbps: 10240` (10Mbps)
- Hero 원본 7,545,239 bytes ÷ 1,280,000 bytes/s ≈ **5.89초**
- 이 계산값이 정확히 Lighthouse의 LCP breakdown 구간 합계(892ms)와 실제 LCP(6813ms) 사이 차이(~5920ms)와 일치함

**결론**: 로컬에서는 이미지가 빨리 도착해서 문제가 안 보이지만, 일반적인 네트워크 환경을 가정하면 **7.5MB Hero 원본 이미지의 전송 시간 자체가 LCP를 지배하는 가장 큰 요인**이다. 서버 응답 지연이나 렌더링 로직 문제가 아니라 순수하게 이미지 용량 문제 — 1단계 이미지 최적화로 직접 해결 가능한 병목임을 확인.

### 목록 상태 관찰 (/api/products?scenario=slow)
- 최초 진입 (데이터 없음) 녹화: 화면 기록 확인함. 검색/카테고리/정렬 필터 UI는 즉시 보이고, 상품 그리드 영역이 완료 시까지 비어있음
- 기존 목록이 있는 상태에서 갱신 녹화: **문제 확인됨** — 상품 30개가 이미 로딩된 상태에서 재요청이 발생하면, 기존 상품 카드가 전부 사라지고 "로딩 중..." 텍스트만 남음. Header와 필터 UI(검색/카테고리/정렬)는 그대로 유지되지만, 상품 그리드는 완전히 비워짐
- 화면 기록 프레임: 0초(30개 로딩 완료) → ~1.75초(전체 삭제, "로딩 중..."만 표시) → ~3.5초(다시 30개 로딩 완료)

**관찰 요약**: 현재 구현은 `isLoading` 하나로 최초 진입과 갱신을 구분 없이 처리하고 있어, 이미 목록이 있는 상태에서도 재요청 시 기존 목록을 통째로 비움. 이는 2단계에서 `isPending`(최초 로딩, 데이터 없음)과 `isFetching`(갱신 중, 기존 데이터 유지)을 구분해 UX를 나누는 작업의 직접적인 근거가 됨.

### 가설 기록

| 관찰한 사실 | 원인 가설 | 반증 방법 | 가장 작은 변경 |
|------------|-----------|-----------|----------------|
| Lighthouse 5회 LCP가 6.8초대로 일관되게 측정되지만, 로컬 cache-disabled Performance trace에서는 document~Hero 완료까지 750ms밖에 안 걸림 | Hero 원본 이미지(7.5MB)의 전송 크기가 커서, Lighthouse의 시뮬레이션 네트워크 조건(10Mbps)에서는 이미지 전송에만 ~5.9초가 걸리는 것으로 계산되고 있다. 서버 응답 지연이나 렌더링 로직은 병목이 아니다 | Hero 이미지를 임시로 작은 파일(예: 100KB급)로 교체하고 Lighthouse를 다시 돌려서, LCP가 크게 줄어드는지(5.9초 근처만큼) 확인한다 | Hero 이미지를 실제 표시 크기(카드 폭 기준)에 맞는 해상도로 리사이즈하고 WebP/AVIF 등 압축 포맷으로 변환하여 전송 크기를 줄인다 |


---

## 1단계 — Hero LCP

### LCP 구간 분리

| 구간 | 시간 (로컬 실측) | 시간 (Lighthouse 시뮬레이션 반영) | 비고 |
|------|-------------------|-------------------------------------|------|
| 서버 응답 대기 (TTFB) | 16.4ms | 16.4ms | document 첫 응답까지 |
| 이미지 요청 시작 대기 (resourceLoadDelay) | ~676ms (`/api/home` 완료 후 이미지 요청 시작) | 670.2ms | `/api/home` 응답(500ms 기본 지연)을 기다린 뒤에야 Hero `<img>`가 DOM에 나타나 요청이 시작됨 |
| 이미지 전송 (resourceLoadDuration) | ~72ms (748.5ms - 676.1ms, 로컬 네트워크) | 92.6ms → **시뮬레이션 시 약 5.89초로 재계산됨** (7.5MB ÷ 10Mbps) | 로컬에서는 빠르지만, 원본 용량(7.5MB) 자체가 일반 네트워크 조건에서는 병목의 핵심. Lighthouse 헤드라인 LCP(6813ms)가 이 구간을 실질적으로 지배함 |
| 화면에 그려짐 (elementRenderDelay) | 포함 | 113.3ms | 다운로드 완료 후 실제 paint까지 |
| **합계** | ~750ms (로컬) | **~6813ms (Lighthouse 헤드라인 LCP)** | 로컬 서브파트 합계(892.5ms)와 헤드라인 LCP 사이 약 5920ms 차이 = 이미지 용량 기반 시뮬레이션 전송 시간 |

**결론**: "이미지 요청 시작 대기"(API 응답을 기다리는 구조)와 "이미지 전송"(원본 용량) 두 구간이 병목 후보였으나, 계산상 **이미지 전송(용량) 쪽이 압도적으로 지배적**(약 5.89초)이라 1단계는 이미지 최적화에 집중. "이미지 요청 시작 대기" 구간(API 응답 기다리는 구조)은 3단계에서 렌더링 구조 개선과 함께 다룰 예정.

### 이미지 최적화 내역
- 원본: 3840×2160, 7.5MB (JPEG)
- 변경 후: `next/image` (`fill`, `priority`, `sizes="100vw"`) 적용, 실제 응답은 WebP 자동 변환, 409,306 bytes (~400KB), q=75
- 실제 표시 크기 대비 적정성: `.hero`가 `width: 100%` 반응형이라 뷰포트 기준 가변. Desktop 측정 조건(넓은 뷰포트)에서 Next.js가 요청 시 `w=3840`으로 서빙(가장 큰 후보). 원본 해상도 자체는 유지했지만 WebP 압축으로 용량이 7.5MB→400KB로 감소
- 요청 우선순위 조정 여부: `priority` 속성 추가함 — Hero는 LCP 요소라 기본 lazy loading을 건너뛰고 즉시 로드하도록 설정

### 시도한 방안 비교 (실험 기록)

**인사이트 메모**
- 0단계에서 확인: 로컬 실제 전송은 72ms로 빠르지만, Lighthouse 시뮬레이션(10Mbps 기준)에서는 7.5MB 이미지 전송에만 ~5.9초가 걸리는 것으로 계산되어 LCP 6.8초의 핵심 원인이 됨
- 즉 서버 응답 지연이나 렌더링 로직이 아니라, 순수 이미지 전송 크기가 병목 → 압축/포맷 변경으로 직접 해결 가능하다고 판단

| 시도한 방안 | 적용 내용 | 전송 크기 | LCP 변화(중앙값) | 채택 여부 |
|-------------|-----------|-----------|----------|-----------|
| 원본 (Before) | `<img>` 직접 사용, 원본 JPEG 그대로 서빙 | 7,545,239 bytes (~7.5MB) | 6813.0ms | 기준 |
| next/image 적용 | `fill` + `priority` + `sizes="100vw"`, Next.js가 자동으로 리사이즈/포맷 변환/압축 처리 | 409,306 bytes (~400KB, WebP, q=75) | 772.0ms | **채택** |

**최종 채택 이유 / 다른 방안을 채택하지 않은 이유**
- `next/image` 하나로 포맷 변환(WebP), 압축(q=75), lazy-loading 제외(priority)가 한 번에 해결되어 별도의 수동 리사이즈 스크립트나 fetchpriority 수동 조정 등 추가 방안은 시도하지 않음
- LCP가 6813ms → 772ms로 약 88.7% 개선되어(측정 흔들림 범위를 훨씬 상회) 추가 실험 없이 채택 확정
- 참고: 이 표의 After 값은 1단계 변경 직후 중간 확인용 측정이며, 최종 After는 4단계에서 전체 변경 완료 후 재측정

### 렌더링 경계
- Header/h1/설명이 Hero와 분리되어 먼저 렌더되는가:
  - **Header**: 이미 `src/app/(commerce)/layout.tsx`에서 렌더링되고 있어 `HomePage`의 `isLoading`과 무관하게 항상 즉시 렌더링됨. 별도 조치 불필요
  - **h1/설명**: 현재 `HomePage.tsx`가 `{isLoading && <p>로딩 중...</p>} / {data && (...)}` 구조로 되어 있어, Hero의 h2(제목)와 설명이 `data.banner`(API 응답) 없이는 렌더링되지 않음. 이 페이지에는 데이터와 무관한 정적 h1/설명이 없음
- **판단**: h1/설명 분리는 이번 1단계에서 별도로 처리하지 않고 **3단계(metadata)로 이월**하기로 결정.
  근거: 3단계 요구사항 중 "홈은 본문 prefetch와 같은 query factory가 조회한 응답의 title·description·image를 사용해요"는 `generateMetadata`(서버 실행)가 서버에서 홈 데이터를 미리 조회해야 함을 의미하며, 이 서버 조회 구조를 본문(HomePage) 쪽에서도 재사용하면 server prefetch + hydration까지 자연스럽게 연결됨. 지금 1단계에서 별도로 Client-only 임시 구조를 만드는 것보다, 3단계에서 한 번에 설계하는 것이 중복 작업을 줄임.
- 적용한 방법: (3단계에서 결정 후 기록 예정)

### Hero fallback / CLS
- fallback이 실제 Hero와 같은 공간을 차지하는가: Hero 컨테이너(`.hero`)가 `aspect-ratio: 16/9`로 고정되어 있어, `isLoading` 상태의 "로딩 중..." 텍스트만 있을 때도 Hero 영역 자체의 공간은 아직 예약되지 않음(Hero 컴포넌트 자체가 `data` 존재 시에만 렌더링되므로). 이 부분도 3단계 렌더링 구조 개선과 함께 재확인 예정
- Layout shifts track 확인 결과: 0단계에서 CLS 5회 모두 0으로 측정됨. 다만 이는 "빈 화면 → 완성된 화면"으로 한 번에 전환되어 발생한 0이며, 레이아웃이 안정적이어서가 아님 (Part 4 원칙 참고). 3단계 구조 개선 후 재확인 필요

---

## 2단계 — 목록 상태 6가지 / CLS

## 2단계 — 목록 상태 6가지 / CLS

**배경**: 6주차 멘토 피드백에서 동일 문제 지적됨 — "productsQueries.ts에 placeholderData: keepPreviousData가 걸려 있어서 이전 목록을 들고 있어도 배경 refetch가 실패하면 목록·총 개수·페이지네이션이 통째로 사라진다", "로딩에 대한 처리가 보이지 않는다". 원인은 `placeholderData` 부재가 아니라 `ProductListPage.tsx`의 조건문이 `{!isLoading && !isError && (...)}` 형태로 **isError를 data 존재 여부보다 먼저 체크**하고 있었기 때문. `data` 존재를 최우선 기준으로 바꾸는 방식으로 해결.

| 상태 | 구현 여부 | 확인 방법 | 비고 |
|------|-----------|-----------|------|
| 데이터 없는 최초 진입 (pending UI) | 구현됨 (텍스트 수준) | 화면 기록 확인 | `<p>로딩 중...</p>` 텍스트만 표시. 실제 목록 크기를 예상 가능한 스켈레톤은 시간상 후순위로 미룸(4단계 이전 여유 있으면 추가) |
| 이전 데이터 있는 갱신 (isFetching) | ✅ 구현 완료 | 화면 기록 확인 — 카테고리 필터 변경 시 기존 상품 목록 유지된 채 "갱신 중..." 텍스트가 함께 표시됨 | Before(0단계)에서는 기존 목록이 통째로 사라지는 문제였으나 해결됨 |
| 성공 + 0건 | ✅ 구현됨 | `data.products.length === 0` 조건으로 "상품이 없습니다" 표시 | |
| 최초 실패 | ✅ 구현됨 | `{!data && isError && (...)}` — data 없을 때만 오류+재시도 노출 | |
| 갱신 실패 (기존 목록 유지) | ✅ 구현됨 | `{data && (...)}` 블록 안에서 `isError` 표시 — data가 `placeholderData`로 유지되므로 목록 안 사라짐 | 6주차 피드백에서 지적된 문제의 직접적 해결 |
| 취소 (오류로 안 보임) | 부분 확인 | 0단계에서 AbortSignal 미구현 확인함(관찰 사실 기록) | 별도 취소 로직 추가는 하지 않음 — 현재 응답 순서상 문제가 관찰되지 않아 무개입 근거로 기록 |

### 정합성 확인
- active query와 화면 결과 일치 여부: 0단계에서 카테고리+정렬 연속 변경 테스트로 확인 완료 (URL, 필터 UI, 실제 정렬 결과 일치)
- 이전 요청 늦은 완료가 현재 화면을 덮지 않는지: 0단계에서 확인, race condition 관찰되지 않음 (React Query가 최신 쿼리 결과만 반영하는 기본 동작 덕분으로 추정)
- 서버 응답을 Zustand/로컬 상태에 복사하지 않았는지: 확인함 — `data`는 `useQuery` 반환값을 그대로 사용, 별도 복사 없음

### 선택한 전략과 이유
- placeholderData / prefetch / AbortSignal 중 적용한 것과 이유: **`placeholderData: keepPreviousData`는 이미 6주차 구현에 적용되어 있었음** (productsQueries.ts). 이번 작업은 이 옵션을 새로 추가한 게 아니라, 컴포넌트의 조건 분기 순서를 `data` 우선으로 바로잡아 placeholderData가 실제로 효과를 발휘하도록 수정한 것
- 적용하지 않은 것과 무개입 근거: `AbortSignal` 기반 요청 취소는 미적용. 0단계 관찰(카테고리 goods→fashion 빠른 연속 변경)에서 race condition이나 취소 필요성이 드러나지 않아, **현재 관찰된 범위 안에서는** 불필요하다고 판단. 향후 더 느린 네트워크 조건이나 더 빈번한 연속 변경 상황에서 화면 불일치가 재현되면 재검토 필요.
---

## 3단계 — Metadata / Open Graph

### 기본 확인

- 홈 title/description/OG: 완료. `generateMetadata`가 `getHomeServerData()`로 서버에서 직접 데이터 조회, title/description을 banner에서 생성. curl로 초기 HTML에 title/OG 태그/h1/전체 상품 데이터가 JS 실행 전에 포함됨을 확인
- 상품 목록 title/description/OG (검색어→title, category/sort→description, 2페이지 이상 page 번호): 완료. 검색어 우선(`'니트' 검색 결과`), category/sort는 description(`뷰티·잡화 · 높은 가격순 카테고리의 상품 6개를...`), 2페이지 이상은 title에 페이지 번호(`상품 둘러보기 - 2페이지`) — curl로 3가지 케이스 모두 검증 완료
- shallow merge 확인 (siteName/locale/type 유지 여부): 완료. `shared/config/site-metadata.ts`에 `SITE_OPENGRAPH` 공통 상수(siteName/locale/type) 작성, 루트 layout과 home/products의 generateMetadata가 이를 spread하여 사용. curl로 og:site_name/og:locale/og:type이 페이지별 og:title/description을 덮어써도 유지됨을 확인

### server prefetch 구조 (1단계에서 이월된 h1/설명 문제도 함께 해결)

- home, products 페이지 모두 Server Component로 전환, `getQueryClient()` + `prefetchQuery()` + `HydrationBoundary`로 서버에서 미리 가져온 데이터를 브라우저가 이어받도록 구성
- Route Handler(`route.ts`)와 metadata/본문이 `commerce.ts`의 `getHomeData()`/`getProductsData()`를 공통으로 재사용 — HTTP 왕복 없이 서버 내부에서 직접 함수 호출
- 1단계에서 미뤄뒀던 "h1/설명이 데이터 로딩과 무관하게 즉시 보이지 않던 문제"가 이 구조 도입으로 해결됨 (curl로 초기 HTML에 h1과 전체 데이터가 포함됨을 확인)
- Hero의 제목을 h2에서 h1으로 변경 (페이지 대표 제목 역할)

### 케이스별 document 증거

| 상황                                     | title/description | OG image | 비고 |
| ---------------------------------------- | ----------------- | -------- | ---- |
| normal | `<title>매일 새롭게 발견하는 취향</title>` | `og:image` 정상 반영 | curl로 확인 완료 |
| 정상 empty (0건) | `<title>상품 둘러보기</title>` / description "최신순 카테고리의 상품 0개를 확인해보세요." | - | `?scenario=empty`로 curl 검증 완료 |
| metadata query failure | root 공통 metadata로 상속: `<title>Commerce</title>` | root 상속, 페이지별 이미지 없음 | 아래 메모 참고 |

**메모 (query failure 케이스 재현 방법 변경)**: 과제 안내문이 제시한 재현법(`APP_ORIGIN`을 닿지 않는 origin으로 설정해 HTTP fetch 실패 유도)은 `generateMetadata`가 자기 자신의 Route Handler를 **HTTP로 호출하는 구조**를 전제로 함. 이번 구현은 안내문의 다른 원칙("Server Component는 자기 Route Handler를 HTTP로 호출하지 않는다")을 따라 `getHomeServerData()`/`getProductsServerData()`가 **HTTP 없이 서버 함수를 직접 호출**하도록 설계했기 때문에, `APP_ORIGIN` 재현법 자체가 적용되지 않음(끊어도 애초에 그 값을 참조하지 않아 실패가 발생하지 않음).

대안으로 환경변수 `SIMULATE_METADATA_FAILURE=true`를 도입해 두 서버 함수가 강제로 reject하도록 만들고, `generateMetadata`에서 `try/catch`로 감싸 실패 시 빈 객체(`{}`)를 반환하도록 구현. 이러면 Next.js가 페이지별 metadata 없음으로 처리하고 루트 layout의 공통 metadata(title: "Commerce")를 그대로 상속함.

검증:
```bash
SIMULATE_METADATA_FAILURE=true pnpm build && SIMULATE_METADATA_FAILURE=true pnpm start
curl -s http://localhost:3000/ | grep -oE '<title>[^<]*</title>'
# 결과: <title>Commerce</title>

curl -s "http://localhost:3000/products?category=goods" | grep -oE '<title>[^<]*</title>'
# 결과: <title>Commerce</title>
```
home, products 둘 다 root 공통 metadata로 정상 상속됨을 확인.

### 서버 호출 계수

- **확인 완료**. `getHomeData()`에 임시 콘솔 로그(`[SERVER_CALL_COUNT]`) 추가 후 `pnpm build` 실행 결과, 빌드 시점에 **2회** 호출됨 (metadata용 1회 + 본문 prefetch용 1회) — 동일한 정적 페이지 생성 사이클 안에서.
- 홈 라우트(`/`)는 `next build` 로그에서 `○ (Static) prerendered`로 표시됨. 즉 **빌드 시점에 한 번 미리 렌더링되고, 실제 사용자 요청(curl)에는 서버 함수가 다시 호출되지 않음**을 확인함 — `pnpm start` 후 `curl http://localhost:3000/`을 실행해도 서버 로그에 추가 호출이 찍히지 않았음.
- **결론**: metadata와 본문이 같은 query factory(같은 데이터)를 사용하면서도 요청당 중복 호출이 발생하지 않는 이유는, 페이지 자체가 정적 프리렌더링 대상이라 빌드 시점 1회 생성 이후 캐시된 HTML을 재사용하기 때문. slow scenario의 지연은 빌드 시점에만 발생하고 실사용자 요청에는 영향 없음.
- 계측 제거 여부: 확인 완료 후 임시 로그(console.log, eslint-disable 주석) 제거함. lint/typecheck 재통과 확인.


### UA별 응답 시점 비교

```bash
curl -s -o /dev/null -w 'normal start=%{time_starttransfer} total=%{time_total}\n' "$APP_ORIGIN/products"
curl -A 'facebookexternalhit/1.1' -s -o /dev/null -w 'facebook start=%{time_starttransfer} total=%{time_total}\n' "$APP_ORIGIN/products"
```

| UA                  | time_starttransfer | time_total |
| ------------------- | ------------------ | ---------- |
| normal              | **진행 예정** |            |
| facebookexternalhit | **진행 예정** |            |

### 접근성 체크

- 주요 콘텐츠/탐색/상품 영역 역할이 마크업에 드러나는가: **확인 필요**
- href 링크로 주요 이동 제공되는가: 카테고리, 페이지네이션 등 `<a href>` 형태로 확인됨 (curl 결과에서 육안 확인)
- 의미 있는 이미지 alt 텍스트: 상품 이미지에 상품명이 alt로 들어가 있음 확인됨 (curl 결과). Hero 이미지는 `alt=""` (장식용 이미지로 처리, 텍스트가 별도로 있어 스크린리더 중복 방지 의도 — 재확인 필요)

---

## 4단계 — After / 회귀 확인

### Commit SHA (After)

```
（여기에 SHA）
```

### Lighthouse 5회 raw 값 — 홈 cold load (Before와 동일 조건)

| 지표 | 1회 | 2회 | 3회 | 4회 | 5회 | 중앙값 | 최솟값 | 최댓값 |
| ---- | --- | --- | --- | --- | --- | ------ | ------ | ------ |
| FCP  |     |     |     |     |     |        |        |        |
| LCP  |     |     |     |     |     |        |        |        |
| CLS  |     |     |     |     |     |        |        |        |

### Before vs After 비교

| 지표 | Before 중앙값 | After 중앙값 | 변화 | 측정 흔들림보다 큰 변화인가 |
| ---- | ------------- | ------------ | ---- | --------------------------- |
| FCP  |               |              |      |                             |
| LCP  |               |              |      |                             |
| CLS  |               |              |      |                             |

### LCP 구간 비교

- LCP element 변화:
- Hero 전송 크기 변화:
- 요청 시작 순서 변화:
- 가장 길었던 구간이 어떻게 달라졌는가:

### 회귀 확인 체크리스트

- [ ] 검색/카테고리/정렬/페이지가 URL에서 복원되는가
- [ ] 뒤로가기/앞으로가기 동일 화면 복원
- [ ] 장바구니/위시리스트/Header 개수 유지
- [ ] 로딩/에러/빈 상태/재시도 유지
- [ ] FSD 의존 방향 / Public API 우회 없음
- [ ] `pnpm test` 통과
- [ ] `pnpm check` 통과

### 효과 없었거나 악화된 변경

| 시도한 변경 | 결과 | 되돌림/유지 여부 및 이유 |
| ----------- | ---- | ------------------------ |
|             |      |                          |

---

## AI 활용 기록

| 단계 | AI에게 준 근거 (raw 값/waterfall/URL 등) | AI 제안 | 직접 반증한 방법 | 채택/반려 |
| ---- | ---------------------------------------- | ------- | ---------------- | --------- |
|      |                                          |         |                  |           |

---

## Technical Writing 초안 메모

(제출 문서 작성 전, 여기에 단계별로 "왜 이렇게 판단했는지" 짧게 메모)

- 0단계:
- 1단계:
- 2단계:
- 3단계:
- 4단계:
