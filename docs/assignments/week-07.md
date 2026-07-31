# 7주차 — 프론트엔드 성능 최적화: 같은 사용자 경로에서 병목만 줄인다

> 느린 API를 없애서 숫자만 줄이지 않습니다.
>
> 같은 사용자 경로를 production 환경에서 반복 측정하고, 사용자가 실제로 기다리는 이유를 찾아 가장 작은 변경으로 개선합니다.

## 왜 이 과제를 하는가

- 성능 개선은 한 번 나온 최고 점수가 아니라 **같은 조건에서 다시 확인할 수 있는 변화**여야 합니다.
- LCP가 느리다는 결과만으로는 이미지 전송이 느린지, 요청이 늦게 시작됐는지, 렌더링이 밀렸는지 알 수 없습니다. 지표를 원인과 연결해야 다음 변경을 선택할 수 있습니다.
- 빠른 화면은 빈 화면을 오래 보여주는 화면이 아닙니다. 먼저 보여줄 셸, 기다려야 하는 데이터, 실제 콘텐츠와 같은 크기의 fallback을 구분해야 합니다.
- 5주차에 정한 서버·URL·클라이언트 상태의 소유권과 6주차의 FSD 의존 방향은 성능을 이유로 바뀌지 않습니다.
- 효과가 없는 최적화를 되돌리거나, 지금은 개입하지 않겠다고 판단하는 것도 성능 작업입니다. 중요한 것은 그 판단을 측정으로 설명하는 것입니다.

## 제공되는 것

- `GET /api/home?scenario=slow`
- `GET /api/products?scenario=slow`
- `src/examples/week-07-performance/HeroSection.tsx`
- `public/images/week-07/hero-original.jpg`
- Advanced A용 `/performance-lab/inp?pageSize=24`

두 slow API는 정상 응답과 같은 데이터를 **1.5초 뒤에** 반환합니다. 기존 `empty`, `error`와 요청·응답 필드도 그대로 유지합니다.

`HeroSection`은 기존 홈 배너의 `title`, `description`을 받아 렌더링하는 예시 컴포넌트입니다. 3840×2160 원본 이미지를 일반 `<img>`로 직접 요청하므로, 처음에는 약 7.5MB 이미지가 그대로 전송됩니다. 이 컴포넌트와 이미지는 LCP 병목을 같은 조건에서 관찰하기 위한 시작점입니다.

제공된 Hero의 파일 구조와 컴포넌트 경계는 정답이 아닙니다. 누적 홈에 필요한 부분만 연결하고, 측정 뒤에는 현재 구조에 맞게 바꿔도 됩니다. starter는 최적화된 이미지, 렌더링 경계, Query 구성, fallback, 제출용 측정 결과를 제공하지 않습니다.

## 실행 환경과 측정 조건

- Node.js 24.17.0 (`.nvmrc`, 지원 범위 `>=22.12.0`)
- pnpm 10.15.1 (`package.json`의 `packageManager`)
- Before와 After 모두 production build
- `APP_ORIGIN`은 build와 runtime에 같은 값으로 설정하고 서버가 접근할 수 있는 origin 사용

```bash
pnpm build
pnpm start
```

Before와 After의 commit SHA는 각각 기록합니다. SHA를 제외한 아래 조건은 같게 유지합니다.

- URL과 query string
- 사용자가 한 행동
- viewport
- CPU·network throttling
- 브라우저와 Lighthouse 버전
- cold load인지 warm navigation인지
- 확장 프로그램이 없는 별도 브라우저 프로필 또는 시크릿 창

문서에 없는 Lighthouse 점수나 향상률은 합격선이 아닙니다. 같은 조건을 반복하고, 원본 값의 흔들림보다 큰 변화인지 확인합니다.

## 기본 과제

### 1. 코드를 바꾸기 전에 Before를 남깁니다

누적 홈에 제공된 `HeroSection`을 연결하고, 이미지 최적화 코드는 아직 추가하지 않습니다.

홈 cold load에서 다음을 확인합니다.

1. 같은 viewport와 throttling으로 Lighthouse를 5회 실행합니다.
2. FCP, LCP, CLS의 5회 원값과 중앙값, 최솟값, 최댓값을 기록합니다.
3. LCP element가 무엇인지 확인합니다.
4. Performance filmstrip에서 헤더, 페이지 제목, Hero가 나타나는 순서를 확인합니다.
5. Network waterfall에서 document, 홈 데이터, Hero 이미지 요청의 시작 순서와 전송 크기를 확인합니다.

상품 목록에서는 `/api/products?scenario=slow`를 사용합니다.

1. 데이터가 없는 최초 진입과 기존 목록이 있는 갱신을 각각 녹화합니다.
2. 검색·카테고리·정렬·페이지를 빠르게 연속 변경합니다.
3. 현재 URL의 active query와 화면에 표시된 상품이 일치하는지 확인합니다.
4. 이전 요청이 늦게 끝나도 현재 화면을 덮지 않는지 확인하고, Network에서 취소 여부를 별도로 관찰합니다.

변경 전 관찰한 사실, 원인 가설, 가설을 반증할 방법, 먼저 시도할 가장 작은 변경을 각각 한 문장으로 기록합니다.

### 2. Hero의 LCP와 기다림을 줄입니다

먼저 LCP 시간을 다음 구간으로 나누어 봅니다.

- 서버 응답을 기다린 시간
- 이미지 요청이 시작되기까지의 시간
- 이미지가 전송되는 시간
- 전송 후 화면에 그려지기까지의 시간

그 뒤 실제로 큰 구간을 줄이는 변경을 선택합니다.

- 화면에 표시되는 크기에 맞는 이미지 후보와 포맷을 제공합니다.
- viewport마다 불필요하게 큰 이미지가 내려가지 않도록 합니다.
- Hero 이미지가 발견되고 요청되는 시점을 확인합니다.
- 현재 페이지에서 Hero의 요청 우선순위를 높여야 하는지 판단합니다.
- 이미지의 시각적 크기, 비율, 주요 피사체와 문구를 유지합니다.

`next/image`를 사용하는 것 자체가 완료 조건은 아닙니다. `sizes`, 이미지 후보, 포맷, 압축률, 요청 우선순위를 잘못 선택하면 컴포넌트만 바꾸고 전송량은 그대로일 수 있습니다. 변경 뒤 실제 요청 URL·전송 크기·waterfall과 LCP를 다시 확인합니다.

홈 데이터를 기다리는 동안 Header, 하나의 `h1`, 페이지 설명까지 함께 막히지 않게 합니다. 기존 구현의 데이터 소유권에 따라 async Server Component와 `Suspense`, 또는 Client island와 Query pending UI 중 맞는 경계를 선택합니다. 과제를 위해 기존 Route Handler의 내부 구현이나 누적 FSD 구조를 다시 설계하지 않습니다.

Hero가 준비되기 전 fallback은 실제 Hero와 같은 공간을 차지해야 합니다. fallback이 교체될 때 아래 콘텐츠가 밀리지 않는지 Layout shifts track으로 확인합니다.

### 3. 최초 pending과 목록 갱신을 구분합니다

서버의 1.5초 지연은 그대로 둡니다.

- 데이터가 없을 때는 실제 목록 크기를 예상할 수 있는 최초 pending UI를 보여줍니다.
- 기존 목록이 있을 때 조건을 바꾸면 목록을 즉시 비우지 않고 갱신 중임을 표시합니다.
- `isPending`과 `isFetching`이 각각 어떤 화면을 맡는지 설명합니다.
- 최초 실패, 기존 목록이 있는 갱신 실패, 빈 결과, 취소된 요청을 구분합니다.
- 서버 응답을 바꾸는 URL 조건이 query key와 실제 요청에 함께 들어가야 합니다.
- 서버 응답을 Zustand나 별도 로컬 상태에 복사하지 않습니다.

`placeholderData`, prefetch, `AbortSignal`, server prefetch와 hydration을 모두 넣는 과제가 아닙니다. 녹화와 Network에서 확인한 문제에 필요한 전략만 선택합니다. 이미 완료 조건을 만족한다면 코드를 더 만들지 말고 Before 증거와 무개입 근거를 남깁니다.

### 4. 초기 HTML에 페이지의 의미를 남깁니다

JavaScript가 실행되기 전에도 홈과 상품 목록의 의미와 이동 경로를 확인할 수 있어야 합니다.

- 페이지마다 의미 있는 `title`과 `description`을 제공합니다.
- 루트 layout의 title template·공통 Open Graph와 페이지 metadata가 어떻게 합성되는지 확인합니다. Next metadata의 shallow merge로 페이지 `openGraph`가 루트 `openGraph` 전체를 덮을 수 있으므로, 페이지에서 공통 필드를 완성해 제공하거나 공통 객체를 명시적으로 재사용해 `siteName`·`locale`·`type` 등이 유지되는지 확인합니다.
- 홈은 본문 prefetch와 같은 query factory가 조회한 배너의 title·description·image를 title·description·Open Graph에 사용합니다. 상품 목록은 정규화한 URL 조건과 본문 prefetch와 같은 query factory가 조회한 응답의 카테고리명·전체 개수·첫 상품 이미지를 사용합니다. 검색어가 있으면 title에 우선 반영하고, category·sort는 description에 반영하며, 2페이지 이상이면 title에 페이지 번호를 덧붙입니다.
- 정상 empty는 요청 성공과 결과 0건을 설명하는 페이지 title·description과 Open Graph fallback image를 제공합니다. metadata 조회가 실패하면 페이지별 빈 metadata를 만들지 않고 root 공통 metadata를 유지합니다.
- metadata와 본문은 같은 URL 정규화와 query factory를 사용해 같은 GET URL·options를 만들고 최종 요청 URL이 갈라지지 않게 합니다.
- 서버에서는 `getQueryClient()`를 호출할 때마다 새 QueryClient를 만듭니다. metadata와 본문이 QueryClient 캐시를 공유하게 만들려고 singleton이나 영속 캐시로 바꾸지 않습니다.
- 중복 방지는 한 document 또는 RSC render/request 범위에서 URL·options가 같은 native fetch에 적용되는 React/Next server request memoization으로 확인합니다. Browser Network만으로 Route Handler 실행 횟수를 판정하지 않습니다.
- `robots: noindex`를 추가하지 않습니다. 모든 페이지는 기본 색인 가능 상태를 유지합니다.
- 초기 응답에 하나의 명확한 `h1`과 페이지 설명을 둡니다.
- 주요 콘텐츠, 탐색, 상품 영역의 역할이 마크업에 드러나야 합니다.
- 주요 이동 경로는 `href`가 있는 링크로 제공합니다.
- 의미 있는 이미지에는 내용을 설명하는 대체 텍스트를 제공합니다.
- 느린 데이터가 준비되기 전에도 제목, 설명, 구조, 링크를 확인할 수 있어야 합니다.

Elements 패널만 확인하지 않습니다. Network의 document/RSC 경계와 최종 요청 URL을 확인하고, document Response·View Source·JavaScript를 끈 새 요청 중 하나 이상으로 초기 HTML을 확인합니다. Route Handler의 실제 호출 횟수는 Network 추정이 아니라 임시 서버 로그 같은 서버 측 계수로 확인한 뒤 계측 변경은 되돌립니다.

같은 `APP_ORIGIN`의 slow URL에 일반 document 요청과 `facebookexternalhit` User-Agent 요청을 보내 `time_starttransfer`와 `time_total`을 비교합니다. 로컬 origin으로 응답 시점과 HTML을 측정할 수 있지만, localhost Open Graph URL은 배포 증거로 사용하지 않습니다.

### 5. 같은 조건의 After와 기능 회귀를 확인합니다

Before와 같은 URL, 행동, viewport, throttling, 브라우저 버전으로 After를 측정합니다.

- 홈의 FCP, LCP, CLS를 다시 5회 측정하고 원값과 중앙값·범위를 비교합니다.
- LCP element와 이미지 요청 크기, 요청 시작 순서가 어떻게 바뀌었는지 확인합니다.
- 목록의 최초 진입과 갱신 중 화면을 다시 녹화합니다.
- 검색·카테고리·정렬·페이지가 URL에서 복원되는지 확인합니다.
- 뒤로 가기와 앞으로 가기가 같은 화면을 복원하는지 확인합니다.
- 장바구니·위시리스트와 Header 개수가 일치하는지 확인합니다.
- 로딩·에러·빈 상태와 재시도가 동작하는지 확인합니다.
- FSD 의존 방향과 슬라이스 Public API를 우회하지 않았는지 확인합니다.

효과가 없던 변경은 되돌리거나 유지할 이유를 적습니다. FCP가 줄었더라도 LCP, CLS, 이미지 품질 또는 기존 기능이 나빠졌다면 함께 기록합니다.

## Advanced A — 관계없는 카드 렌더 줄이기

Advanced는 선택 과제입니다. Basic을 먼저 완료한 뒤 더 도전하고 싶은 멘티만 진행합니다. 선택하지 않아도 Basic 평가에 영향을 주지 않습니다.

`/performance-lab/inp?pageSize=24`에서 이미지 로딩이 끝날 때까지 기다린 뒤 같은 상품의 찜 버튼을 한 번 누릅니다.

1. 일반 production build에서 CPU를 `4x slowdown`으로 설정합니다.
2. 같은 상품이 찜되지 않은 초기 상태에서 Before와 After를 각각 3회 측정합니다.
3. Interactions track에서 input delay, processing duration, presentation delay를 확인합니다.
4. profiling build에서 같은 클릭을 React Profiler로 재현합니다.
5. 관계없는 카드가 렌더링되는지, 어떤 값의 변경이 원인인지 확인합니다.
6. 실제 원인에 맞는 가장 작은 변경으로 렌더 범위를 줄입니다.

```bash
pnpm next build --profile
pnpm start
```

Performance의 시간과 profiling build의 commit 시간을 직접 비교하지 않습니다. Performance는 사용자가 경험한 클릭 구간을, Profiler는 React 렌더 범위와 원인을 설명하는 데 사용합니다.

다음 변경은 개선으로 인정하지 않습니다.

- `pageSize`를 24보다 작게 변경
- 카드에 표시되는 필수 계산이나 결과 삭제
- `setTimeout`으로 갱신을 다음 paint 뒤로 미루기
- 찜 버튼의 즉각적인 피드백 제거
- fixture 수를 줄여 병목 숨기기
- Lighthouse TBT를 실제 클릭의 INP로 설명하기

## 기존 과제 코드와 통합할 때

7주차 starter는 멘티의 누적 브랜치에 동기화됩니다.

- 기존 홈·상품 목록·검색·카테고리·정렬·페이지네이션을 교체하지 않습니다.
- 장바구니·위시리스트, TanStack Query, nuqs, Zustand 구현을 덮어쓰지 않습니다.
- `src/app/page.tsx`와 기존 FSD 슬라이스를 starter 예시 구조로 바꾸지 않습니다.
- 기존 Route Handler의 import, 검증 순서, 정렬·필터·응답 구조를 다시 작성하지 않습니다.
- slow scenario와 Hero 예시, Advanced A 측정 화면만 필요한 위치에 통합합니다.
- `src/examples/week-07-performance/`는 자동 적용되지 않습니다. 누적 홈에서 필요한 부분만 가져갑니다.

충돌을 해결하기 위해 누적 구현을 지우거나 새 정답 구조로 맞춰야 한다면 진행하지 말고 멘토에게 먼저 알립니다.

## 기록할 판단 근거

- 측정한 commit SHA와 재현 조건
- Lighthouse 원값 5개와 중앙값·범위
- LCP element와 가장 오래 걸린 구간
- Hero 이미지의 실제 표시 크기와 전송 크기
- 선택한 렌더링 경계와 선택하지 않은 경로
- fallback이 실제 Hero와 같은 공간을 갖는 근거
- 목록의 최초 pending과 갱신 UI를 나눈 기준
- 루트 metadata와 페이지 metadata를 합성한 방법, shallow merge에도 `siteName`·`locale`·`type` 등 공통 Open Graph 필드를 유지한 근거, 홈 배너와 상품 목록의 실제 데이터·빈 결과·조회 실패 fallback
- 검색어 우선 title, category·sort를 반영한 description, 2페이지 이상 page 번호를 포함한 상품 목록 metadata 문구의 근거
- metadata와 본문이 같은 query factory·최종 GET URL·options를 사용한 근거, `getQueryClient()`마다 서버 QueryClient가 별도임을 전제로 React/Next server fetch request memoization의 document/RSC render/request 범위를 구분한 설명
- 같은 slow URL에서 일반 document 요청과 `facebookexternalhit` User-Agent 요청의 metadata 응답 시점 비교 (`time_starttransfer`, `time_total`)
- Network로 document/RSC 경계와 URL을 확인한 결과, 임시 서버 로그 같은 서버 측 계수로 한 document 또는 RSC 요청 안에서 동일 slow Route Handler가 한 번만 실행되는지 확인한 결과
- metadata가 API를 기다리는 비용과 실제 공유 정보의 이점을 함께 판단한 이유
- 적용한 최적화와 적용하지 않은 최적화의 이유
- 성능 외 기능·접근성·이미지 품질 회귀 확인 결과

## ✅ Checklist

**Before / After**

- [ ] production build에서 같은 조건으로 Before와 After를 측정했는가
- [ ] FCP·LCP·CLS를 각각 5회 측정하고 원값과 중앙값·범위를 남겼는가
- [ ] LCP element, waterfall, filmstrip을 함께 확인했는가
- [ ] 측정 흔들림보다 큰 변화인지 설명할 수 있는가

**Hero / LCP**

- [ ] 고용량 원본을 사용한 Before를 먼저 남겼는가
- [ ] 이미지 표시 크기·전송 크기·요청 시작 시점을 확인했는가
- [ ] Hero의 시각적 역할과 품질을 유지하면서 병목을 줄였는가
- [ ] `next/image` 사용 여부가 아니라 실제 요청과 LCP 결과를 확인했는가
- [ ] Header·`h1`·페이지 설명이 느린 Hero와 함께 막히지 않는가
- [ ] fallback 교체가 눈에 띄는 layout shift를 만들지 않는가

**목록 / 초기 HTML**

- [ ] 최초 pending과 기존 목록 갱신 UI를 구분했는가
- [ ] 현재 URL의 active query와 화면 결과가 일치하고, 이전 요청의 늦은 완료가 화면을 덮지 않는가
- [ ] 서버 응답을 Zustand나 로컬 상태에 복사하지 않았는가
- [ ] JavaScript 실행 전에도 제목·설명·주요 링크를 확인할 수 있는가
- [ ] 루트 title template·공통 Open Graph와 페이지 metadata가 의도대로 합성되고, shallow merge에도 `siteName`·`locale`·`type` 등 공통 Open Graph 필드가 유지되는가
- [ ] document 응답에서 `title`, `description`, `og:title`, `og:description`, `og:image`를 확인했는가
- [ ] 홈은 본문 prefetch와 같은 query factory가 조회한 배너의 title·description·image를 사용했는가
- [ ] 상품 목록은 정규화된 URL 조건과 카테고리명·전체 개수·첫 상품 이미지를 사용하고, 검색어 우선 title·category/sort description·2페이지 이상 page 번호 규칙을 지켰는가
- [ ] 정상 empty는 URL 조건·0건을 설명하고 fallback image를 유지하며, metadata 조회 실패는 root 공통 metadata를 유지하는가
- [ ] metadata와 본문이 같은 query factory·GET URL·options를 사용하는가
- [ ] `getQueryClient()`마다 서버 QueryClient가 별도임을 전제로, singleton·영속 캐시를 추가하지 않고 React/Next server fetch request memoization의 document/RSC render/request 범위를 설명했는가
- [ ] 모든 페이지가 기본 색인 가능 상태를 유지하는가
- [ ] Network는 document/RSC 경계와 URL 확인에만 사용하고, 동일 slow Route Handler의 실제 호출 횟수는 임시 서버 로그 같은 서버 측 계수로 확인했는가
- [ ] 일반 document 요청과 `facebookexternalhit` 요청의 metadata 응답 시점을 같은 slow URL에서 비교했는가
- [ ] 누적 기능과 FSD 의존 방향을 보존했는가

**Advanced A를 선택한 경우에만**

- [ ] Basic을 먼저 완료했는가
- [ ] 24개 카드를 유지한 같은 조건에서 Before와 After를 각각 3회 측정했는가
- [ ] Performance와 Profiler를 각각의 용도에 맞게 사용했는가
- [ ] 관계없는 카드 렌더와 반복 계산이 줄었는가
- [ ] 필수 계산과 찜 버튼의 즉각적인 피드백을 유지했는가

**공통**

- [ ] 관찰한 사실과 원인 가설, 반증 방법, 가장 작은 변경을 기록했는가
- [ ] 효과가 없거나 악화된 결과도 숨기지 않았는가
- [ ] 개발 중 `pnpm test`, 제출 전 `pnpm check`가 통과하는가
- [ ] AI로 생성한 부분을 표기하고 직접 검토했는가
