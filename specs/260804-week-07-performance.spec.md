# 7주차 성능 최적화 스펙

## 목표

같은 사용자 경로를 production build에서 반복 측정해 병목을 특정하고, 가장 작은 변경만 골라 적용한 뒤 같은 조건에서 재측정한다. 결과물은 개선 목록이 아니라 **무엇을 보고 그 변경을 골랐는가**의 기록이다.

## 비범위

- 점수·향상률 자체를 목표로 삼는 것 (과제가 합격선을 두지 않음)
- slow API의 1.5초 지연 제거, 이미지 품질 저하로 수치만 줄이기
- Route Handler 내부와 누적 FSD 구조 재설계
- `robots: noindex`, `getQueryClient()` singleton 전환, 서버 응답의 로컬 상태 복제
- Bundle Analyzer (JS bundle이 병목이라는 가설이 측정에서 나올 때만 선택 증거로)
- Advanced A — 조건부 범위. Basic 완료 후 실제 클릭 병목이 확인될 때만 착수

## 확정 목표

0~4단계 Basic을 완료하고, 각 단계에서 **관찰한 사실 → 원인 가설 → 반증 방법 → 가장 작은 변경**을 연결해 기록한다. 이미 조건을 만족하는 부분은 코드를 더 만들지 않고 개입하지 않은 근거를 남긴다.

## 조사 결과

**홈 — 이번 주 개입 지점이 명확히 하나 있다**

- `HomePage.tsx:12-21` — Suspense fallback이 페이지 전체를 덮고, `HomePageContent`가 root에서 `await prefetchQuery(home)`. 발제 Part 2 "하나의 await가 셸까지 세운다" 예시와 동형이다.
- `HomeContent.tsx:60` — 유일한 `h1`이 배너 안에 있어 홈 데이터에 묶여 있다. 1단계 요구("Header, 하나의 `h1`, 페이지 설명까지 함께 막히지 않도록")와 정면으로 충돌한다.
- `HomeContent.tsx:55-61` — 현재 배너는 `background-image`라 Network에서 발견 시점이 늦고 공간 예약도 CSS에 의존한다.

**목록 — 경계는 이미 나뉘어 있고 6화면 중 2개가 비어 있다**

- `ProductsPage.tsx:30-40` — 제목·검색·필터 셸을 먼저 보내고 `ProductListContent`만 Suspense로 감쌌다. 홈과 달리 셸이 막히지 않는다.
- `ProductList.tsx:37-63` — 최초 실패(에러 화면 + 홈으로 가기), 최초 pending(텍스트 1줄), 갱신 실패(상단 배너), placeholder 표시가 구현돼 있다.
- 비어 있는 것: **최초 진입 pending UI가 실제 목록 크기를 예상할 수 없는 텍스트 1줄**, **취소된 요청 관찰·처리 없음**.
- `queries.ts` — list는 `staleTime` 1분 + `placeholderData: keepPreviousPage`, home은 `staleTime` 5분 / `gcTime` 10분.

**metadata — 3단계는 전부 신규**

- `src/app/layout.tsx:18` 루트 `metadata`만 정적으로 있고, `(commerce)/page.tsx`·`(commerce)/products/page.tsx`에 `generateMetadata`가 없다. title template·Open Graph도 없다.
- `get-query-client.ts:25-31` — 서버는 요청마다 새 client를 만든다. 3단계 요구사항을 이미 만족한다.

**스타터**

- `HeroSection.tsx` — `3840×2160` 원본을 `<img>`로 직접 렌더하고 `next/image`를 eslint-disable로 회피한다. `HomeResponse['banner']`의 `title`·`description`만 받는다.
- `_data/commerce.ts` — `waitForMockApi(requestedDelayMs = 500)`, `scenario=slow`는 1.5초.

## 결정 사항

- **D1: 측정 실행은 사람이, 준비물은 에이전트가 맡는다** — Lighthouse 실행과 DevTools 관찰(filmstrip · Layout Shifts · waterfall · Interactions track)은 브라우저 작업이라 사용자가 직접 한다. 에이전트는 Before/After가 어긋나지 않도록 고정 조건 체크리스트와 raw 값 기록 표를 만들고, 터미널로 가능한 `curl` UA 비교와 서버 호출 계수용 임시 로그를 맡는다. 측정 재현성이 최상위 배점 축인데 조건을 기억에 의존하면 이틀 뒤 After에서 반드시 어긋나므로 문서로 고정한다. Lighthouse CLI 도입은 보류해 새 의존성을 늘리지 않는다.
- **D2: 기존 배너를 `HeroSection`으로 대체한다.**
- **D3: 0단계 Before는 `h1`이 홈 데이터를 기다리는 상태 그대로 측정한다** — `h1`을 셸로 올리는 것은 1단계의 개입이다. Before에서 미리 고치면 그 변경의 효과를 측정으로 보여줄 수 없다. 0단계에서는 배너 자리를 `HeroSection`으로 바꾸고 `h1`은 같은 위치(데이터 의존)에 남긴다.
- **D4: 2단계는 6화면을 전부 재점검한다** — 이미 동작하는 4화면도 과제 기준(특히 "실제 목록 크기를 예상할 수 있는 pending UI", "취소된 요청이 오류로 보이지 않음")으로 다시 판정한다. 재구현이 필요 없다고 판단하면 그 근거를 기록한다.
- **D5: Advanced A는 Basic 완료 후 결정한다** — 과제가 "Basic을 완료한 뒤, 실제 클릭에서 병목이 확인될 때만" 선택하라고 명시했다. 4단계까지 끝내고 `/performance-lab/inp?pageSize=24`에서 측정한 결과로 판단한다.
- **D6: 개입하지 않은 근거도 산출물이다** — 과제가 "이미 조건을 만족하면 코드를 더 만들지 말고, 개입하지 않은 근거를 남겨도 돼요"라고 명시했다. 6주차에 이미 구현한 `placeholderData`·인라인 에러 분기·URL 단일 원본은 측정으로 확인만 하고 근거를 남긴다.
- **D7: 공통 Open Graph는 페이지마다 직접 완성한다** — 공유 모듈을 두지 않고 각 `generateMetadata`가 `siteName`·`locale`·`type`까지 채워 shallow merge에도 유실되지 않게 한다.
- **D8: `generateMetadata`는 라우트 파일(`(commerce)/page.tsx`, `(commerce)/products/page.tsx`)에 직접 작성한다** — layout은 navigation 시 rerender되지 않아 stale을 막으려 `searchParams`를 받지 못한다(Next 공식 문서 `layout.js` Caveats). 검색어·정렬·페이지 번호가 전부 searchParams라 페이지별 동적 metadata는 `page.tsx`에만 둘 수 있다. 루트 `app/layout.tsx`는 title template과 기본 metadata를 맡는다. 6주차의 "라우트 파일은 얇은 진입점" 방침에 대한 예외로 기록한다.
- **D9: metadata 조회 실패는 `try/catch`로 잡고 빈 객체를 반환한다** — 페이지별 부분 값을 만들지 않아 root 공통 metadata가 그대로 상속되고, 정상 empty(조건과 0건을 설명)와 서로 다른 fallback이 된다.
- **D10: 효과 판정 기준은 크기와 원인 두 조건이다** — 중앙값 변화가 Before 5회 raw 값의 범위보다 크고, 그 변화가 그 라운드에서 지목한 병목 구간에서 나왔을 때만 유지한다. 하나라도 못 채우면 되돌리거나 유지하는 이유를 적는다. 과제가 "범위보다 큰 변화인지, 그리고 그 변화가 선택한 병목과 연결되는지"로 조건을 둘 다 걸었다. 범위만 보면 원인과 무관한 변화도 효과로 통과한다. 사후 합리화를 막으려 기준을 측정 전에 고정한다.

## 완료 조건

**측정과 기록**

- [ ] Before·After를 production build(`pnpm build` → `pnpm start`)로 측정하고 각각의 commit SHA를 기록한다
- [ ] 고정 조건(URL, 행동, viewport, CPU·network throttling, 브라우저·Lighthouse 버전, cold load, 별도 프로필)을 문서로 못박고 Before·After에서 동일하게 유지한다
- [ ] FCP·LCP·CLS의 5회 raw 값과 중앙값·최솟값·최댓값을 Before·After 각각 남긴다
- [ ] 각 단계마다 관찰한 사실 / 원인 가설 / 반증 방법 / 가장 작은 변경을 한 문장씩 적는다
- [ ] 변화가 5회 raw 값의 범위보다 큰지, 그리고 그 변화가 지목한 병목 구간에서 나왔는지 각각 설명한다
- [ ] LCP element, Network waterfall, Performance filmstrip을 함께 확인한다
- [ ] Layout Shifts와 **document · `/api/home` · Hero 이미지**의 URL·전송 크기·요청 시작 시점을 확인한다
- [ ] Before 시점에 slow 목록의 최초 진입과 기존 목록 갱신을 각각 녹화하고, 취소된 요청을 별도로 관찰한다

**1단계 — Hero LCP**

- [ ] 고용량 원본(`3840×2160`, 7.5MB)을 그대로 쓰는 Before를 먼저 남긴다
- [ ] LCP를 서버 응답 대기 / 이미지 요청 시작 대기 / 이미지 전송 / 렌더 지연으로 나눠 관찰하고 가장 긴 구간을 지목한다
- [ ] Hero 이미지의 실제 요청 URL·**표시 크기**·전송 크기·요청 시작 시점이 Before와 달라진 것을 증거로 보인다
- [ ] Hero의 시각적 크기·비율·주요 피사체·문구가 유지된다
- [ ] **Header**와 `h1`, 페이지 설명이 홈 데이터를 기다리지 않고 먼저 그려진다
- [ ] Hero fallback이 실제 Hero와 같은 공간을 차지하고, 교체 시 Layout shifts track에 눈에 띄는 이동이 없다

**2단계 — 목록 6화면과 CLS**

- [ ] 데이터 없는 최초 진입 / 이전 데이터 있는 갱신 / 성공+0건 / 최초 실패 / 갱신 실패 / 취소 여섯 화면이 녹화에서 구분된다
- [ ] 최초 진입 pending UI가 실제 목록 크기를 예상할 수 있는 형태다
- [ ] 취소된 요청을 별도로 관찰했고 오류로 보이거나 현재 화면을 덮지 않는다
- [ ] 검색·카테고리·정렬·페이지를 연속으로 바꿔도 현재 URL의 active query와 화면 결과가 일치한다
- [ ] 서버 응답을 Zustand나 로컬 상태에 복사하지 않는다
- [ ] fallback ↔ 실제 콘텐츠 교체에서 CLS가 생기지 않는다

**3단계 — metadata와 Open Graph**

- [ ] 홈과 목록에 `generateMetadata`가 있고, 본문 prefetch와 **같은 query factory**가 조회한 응답을 쓴다
- [ ] 루트 title template·공통 Open Graph가 있고, 페이지 metadata와 합성해도 `siteName`·`locale`·`type`이 유지된다
- [ ] 검색어는 title 우선, category·sort는 description, 2페이지 이상은 title에 페이지 번호가 반영된다
- [ ] 정상 empty는 URL 조건과 0개를 설명하고 Open Graph fallback image를 유지한다
- [ ] metadata 조회 실패 시 페이지별 빈 값이 아니라 root 공통 metadata를 상속한다
- [ ] 모든 페이지가 기본 색인 가능 상태를 유지한다(`robots: noindex` 없음)
- [ ] 같은 slow Route Handler의 호출 횟수를 **서버 측 계수**로 확인하고, 관찰 후 계측을 제거한다
- [ ] normal / 정상 empty / metadata query failure의 document 증거를 남긴다
- [ ] 일반 UA와 `facebookexternalhit`의 `time_starttransfer`·`time_total`을 비교해 기록한다
- [ ] `APP_ORIGIN`을 build와 runtime에 같은 값으로 두고, localhost Open Graph URL을 배포 증거로 쓰지 않는다
- [ ] JavaScript 실행 전에도 제목·설명·주요 링크와 구조가 보인다 (document Response·View Source·JS off 중 하나 이상으로 확인)
- [ ] 주요 콘텐츠·탐색·상품 영역의 역할이 마크업에 드러나고, 주요 이동이 `href` 링크이며 의미 있는 이미지에 대체 텍스트가 있다

**4단계 — After와 회귀**

- [ ] 0단계와 같은 조건으로 5회 재측정하고 Before와 비교한다
- [ ] LCP element, Hero 전송 크기, 요청 시작 순서, 가장 길었던 구간의 변화를 비교한다
- [ ] 검색·카테고리·정렬·페이지와 뒤로/앞으로 가기가 같은 화면을 복원한다
- [ ] 장바구니·위시리스트·Header 개수, 로딩·에러·빈 상태·재시도가 유지된다
- [ ] FSD 의존 방향과 슬라이스 Public API를 우회하지 않는다 (하네스 통과)
- [ ] 효과가 없거나 악화된 변경, 개입하지 않은 근거를 라운드 폴더의 `notes.md`에 기록한다

**서술 — PR 본문 (T9)**

- [ ] 서버 `getQueryClient()`를 요청마다 새로 만드는 이유(사용자 간 캐시 격리), 그럼에도 HTTP 호출이 합쳐지는 이유(같은 render/request에서 URL·options가 같은 native fetch만 memoization), 서버 계수로 센 실제 호출 횟수를 설명한다
- [ ] `isPending`과 `isFetching`이 각각 어떤 화면을 맡는지 설명한다
- [ ] 효과가 없거나 악화된 변경과 개입하지 않은 근거를 설명한다
- [ ] 각 변경에 "왜 이렇게 설계했는가"를 한 줄 근거로 적는다
- [ ] Before·After SHA, 재현 조건, raw 값·중앙값·범위, LCP element와 가장 긴 구간을 연결해 설명한다

**공통**

- [ ] 성능 변경이 기존 동작을 깨지 않았음을 확인한다 — 목록 6화면·URL 복원·장바구니·위시리스트 개수를 수동 관찰과 녹화로 확인하고 라운드 기록에 남긴다
- [ ] `pnpm check`(test + lint + typecheck + build)와 `pnpm test:e2e` 통과
- [ ] AI가 만든 부분을 표기하고 직접 검토한다

## 태스크

- **T0**: 측정 절차서와 기록 템플릿 작성 — 고정 조건 체크리스트, Before/After raw 값 표, `curl` UA 비교 스크립트, 서버 호출 계수용 임시 로그 — fulfills: 측정 조건 1·2·3
- **T1**: 기존 배너를 `HeroSection`으로 대체 (최적화 없음, `h1`은 데이터 의존 위치 유지) — fulfills: D2·D3
- **T2**: Before 측정 — 홈 cold load 5회, slow 목록 최초 진입·갱신·취소 녹화, waterfall·filmstrip·Layout Shifts 관찰, 사실·가설·반증·최소 변경 기록 — fulfills: 측정 조건 전부, 각 단계 진입 근거
- **T3**: 1단계 — 렌더링 경계 조정(셸과 Hero 분리, `h1`·설명을 데이터 밖으로), Hero 이미지 개입, fallback 공간 계약 — fulfills: 1단계 완료 조건
- **T4**: 2단계 — 6화면 재점검, 최초 진입 pending UI와 취소 처리 보강, 나머지는 근거 기록 — fulfills: 2단계 완료 조건
- **T5**: 3단계 — 루트 title template·공통 OG, 홈·목록 `generateMetadata`, fallback 2종 구분, 서버 호출 계수와 UA 비교 — fulfills: 3단계 완료 조건
- **T6**: 동작 회귀 확인 — 목록 6화면, URL 복원, 장바구니·위시리스트 개수를 관찰로 확인하고 근거를 기록 — fulfills: 공통 조건 1
- **T7**: 4단계 — After 5회 재측정, 회귀 확인, 효과 없던 시도와 개입하지 않은 근거 정리 — fulfills: 4단계 완료 조건
- **T8**: Advanced A 판단 — `/performance-lab/inp?pageSize=24`에서 병목 확인 후 착수 여부 결정 — fulfills: D5
- **T9**: Technical Writing — 측정에서 판단으로 이어지는 서술을 PR 본문으로 정리 — fulfills: 공통 조건 3

**순서 제약**: T1은 개선이 아니라 측정 대상을 설치하는 단계라 Before보다 먼저다(과제 0단계 — "제공된 `HeroSection`을 연결하고, 고용량 원본 이미지는 아직 최적화하지 않아요"). T3부터의 모든 코드 변경은 T2(Before 측정) 이후에만 한다. T3~T6은 T2의 관찰 결과에 따라 우선순위를 정하고, T7은 T3~T6 완료 후.
