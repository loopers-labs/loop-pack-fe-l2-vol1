# Week 07 Performance Before

## 공통 실행 조건

- 기준 SHA: `16d2fb7`
- 실행 모드: production build
  - `pnpm build`
  - `pnpm start`
- 기준 URL: `http://localhost:3000`
- 브라우저 / Lighthouse: Chrome `150.0.0.0`, Lighthouse `13.3.0`
- 브라우저 상태: Lighthouse `Clear storage` on
- 별도 브라우저 프로필 여부는 raw report에 남지 않으므로, After 측정 전 동일 프로필과 캐시 조건으로 다시 고정한다.

## Home / Hero LCP 측정 조건

- 측정 URL: `http://localhost:3000/`
- Lighthouse: Chrome DevTools Lighthouse
  - Mode: Navigation
  - Device: Mobile
  - Category: Performance
  - Clear storage: on
  - Throttling: Lighthouse 기본 simulated throttling

## Home / Hero LCP Raw Reports

- [before-try1.html](./before-try1.html)
- [before-try2.html](./before-try2.html)
- [before-try3.html](./before-try3.html)
- [before-try4.html](./before-try4.html)
- [before-try5.html](./before-try5.html)

## Home / Hero LCP 측정 결과

| 회차 | Performance |  FCP |   LCP |  TBT | CLS | LCP Resource                        |
| ---- | ----------: | ---: | ----: | ---: | --: | ----------------------------------- |
| 1    |          75 | 0.9s | 40.6s | 20ms |   0 | `/images/week-07/hero-original.jpg` |
| 2    |          75 | 0.9s | 40.6s | 30ms |   0 | `/images/week-07/hero-original.jpg` |
| 3    |          75 | 0.9s | 40.6s | 10ms |   0 | `/images/week-07/hero-original.jpg` |
| 4    |          75 | 0.9s | 40.6s | 20ms |   0 | `/images/week-07/hero-original.jpg` |
| 5    |          75 | 0.9s | 40.6s | 20ms |   0 | `/images/week-07/hero-original.jpg` |

## Home / Hero LCP 집계

- LCP median: 40.590s
- LCP min: 40.588s
- LCP max: 40.599s
- Performance median: 75
- Performance min: 75
- Performance max: 75
- LCP resource transfer size: 약 7.5MB

## Home / Hero Performance Trace 관찰

Performance trace는 Lighthouse와 같은 모바일 viewport에서 확인했다. 다만 DevTools Performance 탭은 `CPU: 제한 없음`, `Network: 제한 없음` 상태였기 때문에 Lighthouse Mobile 수치와 직접 비교하지 않고 표시 순서와 LCP 후보 변화만 관찰했다.

- Raw trace: [home-hero.trace.json.gz](./home-hero.trace.json.gz)

Trace에서 확인한 주요 이벤트는 다음과 같다.

| 이벤트                              | 상대 시점 | 내용                                                                       |
| ----------------------------------- | --------: | -------------------------------------------------------------------------- |
| `ResourceSendRequest`               |   621.4ms | document `http://localhost:3000/` 요청 시작                                |
| `ResourceSendRequest`               |   623.2ms | `/images/week-07/hero-original.jpg` 요청 시작                              |
| `firstContentfulPaint`              |   739.2ms | 첫 콘텐츠 페인트                                                           |
| `largestContentfulPaint::Candidate` |   739.2ms | `H2 id='week07-hero-title'`, size `8,926`, type `text`                     |
| `largestContentfulPaint::Candidate` |   889.2ms | 상품 이미지, size `53,586`, type `image`                                   |
| `largestContentfulPaint::Candidate` | 1,005.8ms | `IMG class='HeroSection-module__...__image'`, size `288,000`, type `image` |

Trace에서 직접 확인한 것은 Header와 Hero 텍스트가 먼저 표시되고, 상품 이미지 후보를 거친 뒤 Hero 이미지가 더 큰 LCP 후보로 교체되는 순서다. Lighthouse 보고서에서도 LCP resource가 `/images/week-07/hero-original.jpg`로 잡혔으므로, 이 근거를 바탕으로 Before의 LCP 대상은 Hero 이미지로 판단했다.

Layout Shifts track에서 눈에 띄는 layout shift 이벤트는 관찰하지 못했다. Lighthouse 5회 측정의 CLS도 모두 `0`으로 기록되어, layout shift는 이번 Before 측정의 우선 병목 후보에서 제외했다.

주의: Performance trace의 ms 값은 제한 없는 로컬 환경 기준이므로, Before/After 성능 비교 수치는 Lighthouse Mobile 5회 median을 기준으로 한다.

## Home / Hero Network Waterfall 관찰

Chrome DevTools Network에서 새로고침 직후 초기 요청 순서와 전송 크기를 확인했다.

| 요청                                | 상대 시점 | 전송 크기 | 소요 시간 | 비고               |
| ----------------------------------- | --------: | --------: | --------: | ------------------ |
| document `/`                        |     0.0ms |    10.4KB |   522.7ms | 초기 HTML          |
| `/images/week-07/hero-original.jpg` |   540.0ms |     7.5MB |   190.2ms | Hero 이미지        |
| `/_next/image?...p21.jpg`           |   582.0ms |    72.3KB |    44.5ms | 상품 이미지        |
| `/?_rsc=...`                        |   706.0ms |     0.9KB |    16.4ms | 홈 데이터/RSC 흐름 |

초기 새로고침 한 번에서 브라우저가 받은 전체 리소스 전송량은 약 `7.9MB`였다. 이 중 Hero 이미지 하나가 약 `7.5MB`로 전체 전송량의 약 `95.0%`를 차지했다.

홈 데이터는 App Router의 서버 prefetch/RSC 흐름으로 초기 HTML과 `/?_rsc=...` 응답에 포함된다. 따라서 Network waterfall에서는 `/api/home` 직접 요청 대신 `/?_rsc=...` 요청을 홈 데이터 흐름으로 확인했다.

로컬 Network 탭에서는 document 요청 소요 시간이 Hero 이미지보다 길게 보인다. 하지만 document는 페이지 로드를 시작하기 위한 기본 요청이고, Lighthouse Mobile 기준 LCP resource는 Hero 이미지로 확인되었다.

이 판단은 Lighthouse Mobile의 LCP resource와 Network 전송 크기 기록에 근거한 가설이다. 다음 단계에서 Hero 이미지 전송 크기를 줄인 뒤 같은 조건으로 재측정해 반증한다.

## 관찰

- LCP resource는 홈 첫 화면의 hero 이미지인 `/images/week-07/hero-original.jpg`로 확인했다.
- Before 단계에서는 과제 조건에 따라 원본 고용량 hero 이미지를 최적화하지 않았다.
- LCP가 5회 모두 약 40.6초로 안정적으로 재현되어, 다음 단계의 최적화 전 기준선으로 사용한다.
- CLS는 5회 모두 0으로 측정되어, 현재 Before 상태에서는 큰 레이아웃 이동은 관찰되지 않았다.

## Products / Slow API 관찰 계획

Products 페이지는 Lighthouse 점수 측정보다 slow API 상태 전이와 요청 경합을 확인한다. Home 측정이 Hero LCP 병목을 보기 위한 기준선이라면, Products 측정은 검색 조건 변경 중 화면 상태와 active query 일치를 확인하기 위한 기준선이다.

- 관찰 URL: `http://localhost:3000/products`
- 관찰 도구: Chrome DevTools Network, 화면 상태, URL query
- 관찰 실행:
  - `NEXT_PUBLIC_PRODUCT_API_SCENARIO=slow pnpm build`
  - `NEXT_PUBLIC_PRODUCT_API_SCENARIO=slow pnpm start`
- DevTools 조건: `CPU: 제한 없음`, `Network: 제한 없음`
- `scenario`는 사용자 URL 상태와 `ProductListQuery`에 넣지 않고, 관찰 실행 환경에서 API 요청에만 `scenario=slow`를 붙인다.
- 확인 대상:
  - 데이터가 없는 최초 진입
  - 기존 목록이 있는 상태에서 검색/카테고리/정렬/페이지 변경
  - 검색·카테고리·정렬·페이지를 빠르게 변경했을 때 현재 URL의 active query와 화면 결과 일치
  - 이전 요청이 늦게 끝나도 현재 화면을 덮지 않는지 여부
  - 취소된 요청의 Network 상태

| 시나리오          | 시작 URL    | 행동                                     | 기대값                                            | 실제 결과                                                                                                                  |
| ----------------- | ----------- | ---------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 최초 진입 pending | `/products` | 새로고침                                 | 기존 데이터가 없으므로 최초 로딩 상태를 표시한다. | 서버 `prefetchQuery`가 완료된 뒤 document/RSC가 도착해, 브라우저 fetch에는 초기 `/api/products` 요청이 따로 보이지 않았다. |
| 기존 목록 갱신    | `/products` | 목록이 보이는 상태에서 조건 변경         | 기존 목록을 유지한 채 갱신 중 상태를 표시한다.    | 카테고리 변경 중 `aria-busy=true`가 되고 기존 목록을 유지했다. 약 1.5초 뒤 active query 결과로 교체됐다.                   |
| 빠른 조건 변경    | `/products` | 검색·카테고리·정렬·페이지를 빠르게 변경  | 현재 URL query와 화면 결과가 일치한다.            | 최종 URL `/products?category=home&sort=popular`와 화면 결과가 일치했다.                                                    |
| 늦은 응답 경합    | `/products` | 이전 요청이 끝나기 전 다른 조건으로 변경 | 이전 응답이 현재 화면을 덮지 않는다.              | `digital&sort=popular` 응답이 먼저 200으로 끝났지만 화면은 덮이지 않았고, 이후 `home&sort=popular` 결과로 갱신됐다.        |
| 요청 취소         | `/products` | 조건을 연속 변경                         | Network에서 취소된 요청을 별도 확인한다.          | DevTools Network에서 관찰한 `/api/products?...scenario=slow` 요청은 모두 200으로 완료됐고 취소 요청은 보이지 않았다.       |

## Products / Slow API 관찰 결과

Chrome DevTools MCP로 `http://localhost:3000/products`를 production slow 환경에서 관찰했다.

- 관찰 방법: Chrome DevTools MCP로 화면 snapshot, Network 요청 목록, 특정 API 요청 상세, 페이지 상태 로그를 확인했다.
- 최초 진입 완료 후 화면: URL `/products`, `총 30개`, 첫 페이지 상품 12개 표시.
- 최초 진입 이후 next page prefetch: `/api/products?category=all&sort=latest&page=2&pageSize=12&scenario=slow`가 브라우저 fetch로 발생하고 200으로 완료됐다.
- 페이지 2 이동: page 2가 이미 prefetch되어 즉시 전환됐고, 이동 후 `/api/products?category=all&sort=latest&page=3&pageSize=12&scenario=slow` prefetch가 약 1.5초 뒤 200으로 완료됐다.
- 카테고리 변경: `/products?page=2`에서 `goods`로 바꾸면 `category=goods&page=1`과 `category=goods&page=2` 요청이 함께 시작됐다. pending 동안 기존 page 2 목록과 `총 30개`가 유지되고 `aria-busy=true`가 됐다. 완료 후 URL은 `/products?category=goods`, 화면은 `총 6개` goods 결과로 바뀌었다.
- 검색 결과 empty: `goods` 상태에서 `q=스탠리`를 입력하면 pending 동안 기존 goods 6개 목록이 유지되고, 완료 후 `총 0개`와 빈 상태 문구로 바뀌었다.
- 빠른 변경 경합: `digital&sort=popular` 요청과 `home&sort=popular` 요청을 약 120ms 간격으로 겹치게 만들었다. 더 이른 `digital&sort=popular` 응답이 먼저 200으로 끝났지만 화면을 덮지 않았고, 최종 URL `/products?category=home&sort=popular`에 맞는 home 상품 6개가 표시됐다.
- 검색 연속 입력: 제한 없는 로컬 DevTools 조건에서 검색어를 `스` → `스탠` → `스탠리`로 입력했다. 100ms 간격 입력은 debounce 때문에 최종 `스탠리` 요청만 발생했다. 350ms 간격 입력은 `스`, `스탠`, `스탠리` 요청이 각각 발생해 겹쳤지만, 이전 검색어 응답이 먼저 200으로 끝나도 화면은 최종 URL `/products?q=스탠리`에 맞는 `총 4개` 결과로 갱신됐다.
- 요청 취소: 이번 관찰에서 Network에 남은 `/api/products?...scenario=slow` 요청들은 모두 200으로 완료됐다. React Query가 stale 응답을 화면에 반영하지는 않지만, fetch abort로 취소된 요청은 확인되지 않았다.
- Console: preserved error/warn/issue 메시지는 없었다.

## Products / Slow API Performance Trace 보조 관찰

Chrome DevTools Performance trace로 Products slow scenario의 조건 변경 경합과 검색 연속 입력을 한 번에 녹화했다.

- Raw trace: [products-slow.trace.json.gz](./products-slow.trace.json.gz)

- Trace 조건: `http://localhost:3000/products`, CPU `1x`, Network throttling 없음.
- 녹화 행동: 카테고리 `goods` 변경, 정렬 `price-asc` 변경, 필터 초기화, 검색어 `스` → `스탠` → `스탠리` 350ms 간격 입력.
- 최종 화면: `/products?q=스탠리`, `총 4개`, 스탠리 상품 목록 표시.
- Trace 원본에는 `had_recent_input=false`인 LayoutShift 이벤트가 기록됐다. 가장 큰 단일 score는 `0.3380`이고, 누적 score는 최대 `0.6007`로 확인됐다.

Products trace의 LayoutShift는 조건 변경 UI에서 관찰된 별도 리스크로 기록한다. 다만 이번 1차 개선 대상은 Lighthouse Mobile 5회에서 반복 재현된 Home Hero LCP 병목으로 한정한다.

## Before 판단

- 관찰한 사실: Home Lighthouse Mobile 5회에서 LCP는 모두 약 40.6초였고, LCP resource는 `/images/week-07/hero-original.jpg`로 확인됐다.
- 원인 가설: 모바일 제한 조건에서 실제 표시 크기보다 큰 원본 Hero 이미지 하나만 내려오고 있어, 이미지 전송과 렌더링 비용이 Home LCP의 주요 병목이 된다.
- 가설을 반증할 방법: 원본 이미지는 보존한 채 Hero의 표시 크기에 맞는 압축 파생 이미지로 교체했는데도 같은 조건의 Lighthouse Mobile 5회 median LCP와 LCP resource 전송 크기가 측정 흔들림 이상으로 개선되지 않으면 이 가설을 기각한다.
- 먼저 시도할 가장 작은 변경: Hero의 현재 시각적 크기와 비율을 유지하고, 원본 이미지는 보존한 채 실제 표시 크기 기준으로 품질 저하가 눈에 띄지 않는 압축 파생 이미지 하나를 추가해 Hero의 이미지 요청 경로만 교체한다.
