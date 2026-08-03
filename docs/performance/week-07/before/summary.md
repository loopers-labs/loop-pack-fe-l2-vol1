# Week 07 Performance Before

## 공통 실행 조건

- 기준 SHA: `16d2fb7`
- 실행 모드: production build
  - `pnpm build`
  - `pnpm start`
- 기준 URL: `http://localhost:3000`

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

Trace에서 확인한 주요 이벤트는 다음과 같다.

| 이벤트                              | 상대 시점 | 내용                                                                       |
| ----------------------------------- | --------: | -------------------------------------------------------------------------- |
| `ResourceSendRequest`               |   548.4ms | document `http://localhost:3000/` 요청 시작                                |
| `ResourceSendRequest`               |   550.9ms | `/images/week-07/hero-original.jpg` 요청 시작                              |
| `firstContentfulPaint`              |   650.9ms | 첫 콘텐츠 페인트                                                           |
| `largestContentfulPaint::Candidate` |   650.9ms | `H2 id='week07-hero-title'`, size `13,735`, type `text`                    |
| `largestContentfulPaint::Candidate` |   750.9ms | `IMG class='HeroSection-module__...__image'`, size `378,225`, type `image` |

Filmstrip 기준으로 Header와 Hero 텍스트는 먼저 표시되고, 이후 Hero 이미지가 더 큰 LCP 후보로 교체되는 흐름을 확인했다. Lighthouse 보고서에서도 LCP resource가 `/images/week-07/hero-original.jpg`로 잡혔으므로, Before의 LCP 대상은 Hero 이미지로 판단했다.

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

따라서 Before의 병목은 document 요청 자체보다, 모바일 제한 조건에서 큰 원본 Hero 이미지를 전송하고 렌더링하는 비용으로 판단했다.

## 관찰

- LCP resource는 홈 첫 화면의 hero 이미지인 `/images/week-07/hero-original.jpg`로 확인했다.
- Before 단계에서는 과제 조건에 따라 원본 고용량 hero 이미지를 최적화하지 않았다.
- LCP가 5회 모두 약 40.6초로 안정적으로 재현되어, 다음 단계의 최적화 전 기준선으로 사용한다.
- CLS는 5회 모두 0으로 측정되어, 현재 Before 상태에서는 큰 레이아웃 이동은 관찰되지 않았다.

## Products / Slow API 관찰 계획

Products 페이지는 Lighthouse 점수 측정보다 slow API 상태 전이와 요청 경합을 확인한다. Home 측정이 Hero LCP 병목을 보기 위한 기준선이라면, Products 측정은 검색 조건 변경 중 화면 상태와 active query 일치를 확인하기 위한 기준선이다.

- 관찰 URL: `http://localhost:3000/products?scenario=slow`
- 관찰 도구: Chrome DevTools Network, 화면 상태, URL query
- 확인 대상:
  - 데이터가 없는 최초 진입
  - 기존 목록이 있는 상태에서 검색/카테고리/정렬/페이지 변경
  - 검색·카테고리·정렬·페이지를 빠르게 변경했을 때 현재 URL의 active query와 화면 결과 일치
  - 이전 요청이 늦게 끝나도 현재 화면을 덮지 않는지 여부
  - 취소된 요청의 Network 상태

| 시나리오          | 시작 URL                  | 행동                                      | 기대값                                            | 실제 결과 |
| ----------------- | ------------------------- | ----------------------------------------- | ------------------------------------------------- | --------- |
| 최초 진입 pending | `/products?scenario=slow` | 새로고침                                  | 기존 데이터가 없으므로 최초 로딩 상태를 표시한다. | 기록 예정 |
| 기존 목록 갱신    | `/products`               | 목록이 보이는 상태에서 slow 조건으로 변경 | 기존 목록을 유지한 채 갱신 중 상태를 표시한다.    | 기록 예정 |
| 빠른 조건 변경    | `/products?scenario=slow` | 검색·카테고리·정렬·페이지를 빠르게 변경   | 현재 URL query와 화면 결과가 일치한다.            | 기록 예정 |
| 늦은 응답 경합    | `/products?scenario=slow` | 이전 요청이 끝나기 전 다른 조건으로 변경  | 이전 응답이 현재 화면을 덮지 않는다.              | 기록 예정 |
| 요청 취소         | `/products?scenario=slow` | 조건을 연속 변경                          | Network에서 취소된 요청을 별도 확인한다.          | 기록 예정 |
