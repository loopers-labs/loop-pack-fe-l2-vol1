# Week 07 Performance After

## 공통 실행 조건

- 측정 코드 상태: `c4f6fe9` 이후 Hero 이미지 변경 작업트리
- 실행 모드: production build
  - `pnpm build`
  - `pnpm start`
- 기준 URL: `http://localhost:3000`
- 브라우저 / Lighthouse: Chrome `150.0.0.0`, Lighthouse `13.3.0`
- 브라우저 상태: Lighthouse `Clear storage` on

## 적용한 변경

- 원본 이미지 `public/images/week-07/hero-original.jpg`는 보존했다.
- 실제 Hero 표시 크기와 viewport를 기준으로 `1600x900` WebP 파생 이미지를 추가했다.
- Hero 이미지 요청 경로를 `/images/week-07/hero-original.jpg`에서 `/images/week-07/hero-1600.webp`로 교체했다.
- Hero의 CSS 크기, aspect-ratio, object-fit, 문구, 피사체 배치 의도는 변경하지 않았다.

| 이미지 후보          | 크기      | 파일 크기 |
| -------------------- | --------- | --------: |
| `hero-original.jpg`  | 3840x2160 |    7.2 MB |
| `hero-1600.webp` q78 | 1600x900  |    143 KB |
| `hero-1600.webp` q72 | 1600x900  |    123 KB |

After 반복 측정은 `hero-1600.webp` 적용 후 수행했다. 이후 Lighthouse의 이미지 전송 개선 제안을 확인하고 같은 후보 크기에서 quality를 `78`에서 `72`로 낮춰 최종 적용 파일을 `143KB`에서 `123KB`로 줄였다. q72 1회 확인에서도 LCP는 약 `3.1s`, CLS는 `0`으로 유지됐다.

## Home / Hero LCP 측정 조건

- 측정 URL: `http://localhost:3000/`
- Home API 조건: normal 응답 (`NEXT_PUBLIC_HOME_API_SCENARIO` 미설정, `/api/home`)
- Lighthouse: Chrome DevTools Lighthouse
  - Mode: Navigation
  - Device: Mobile
  - Category: Performance
  - Clear storage: on
  - Throttling: Lighthouse 기본 simulated throttling

## Home / Hero LCP Raw Reports

- [home-normal-lighthouse-try1.html](./home-normal-lighthouse-try1.html)
- [home-normal-lighthouse-try2.html](./home-normal-lighthouse-try2.html)
- [home-normal-lighthouse-try3.html](./home-normal-lighthouse-try3.html)
- [home-normal-lighthouse-try4.html](./home-normal-lighthouse-try4.html)
- [home-normal-lighthouse-try5.html](./home-normal-lighthouse-try5.html)

## Home / Hero LCP 측정 결과

| 회차 | Performance |  FCP |  LCP |  TBT | CLS |
| ---- | ----------: | ---: | ---: | ---: | --: |
| 1    |          94 | 1.0s | 3.2s | 10ms |   0 |
| 2    |          93 | 0.9s | 3.2s | 10ms |   0 |
| 3    |          94 | 1.0s | 3.2s |  0ms |   0 |
| 4    |          93 | 0.9s | 3.2s | 10ms |   0 |
| 5    |          94 | 0.9s | 3.1s |  0ms |   0 |

## Home / Hero LCP 집계

- LCP median: 3.153s
- LCP min: 3.149s
- LCP max: 3.173s
- FCP median: 0.922s
- CLS median: 0
- Performance median: 94
- Performance min: 93
- Performance max: 94

## Home / Hero Network Waterfall 관찰

Chrome DevTools Network에서 새로고침 직후 초기 요청 순서와 전송 크기를 확인했다.

- Raw Network: [home-normal-network.har](./home-normal-network.har)

| 요청                             | 전송 크기 | 소요 시간 | 비고                         |
| -------------------------------- | --------: | --------: | ---------------------------- |
| document `/`                     |    10.4KB |   531.8ms | 초기 HTML                    |
| `/images/week-07/hero-1600.webp` |   146.3KB |    33.3ms | Hero 이미지, q78 반복 측정값 |
| `/?_rsc=...`                     |     0.9KB |     4.1ms | 홈 데이터/RSC 흐름           |

Before의 Hero 원본 전송 크기 약 `7.5MB`가 After 반복 측정에서는 약 `146KB`로 줄었다. 최종 적용한 q72 파일의 로컬 파일 크기는 `123KB`다.

## Home / Hero Performance Trace 관찰

Performance trace는 Lighthouse와 같은 모바일 viewport에서 확인했다. 다만 DevTools Performance 탭은 `CPU: 제한 없음`, `Network: 제한 없음` 상태였기 때문에 Lighthouse Mobile 수치와 직접 비교하지 않고 표시 순서와 LCP 후보 변화만 관찰했다.

- Raw trace: [home-normal-performance-trace.json.gz](./home-normal-performance-trace.json.gz)

Trace에서 확인한 주요 이벤트는 다음과 같다.

| 이벤트                              | 내용                                              |
| ----------------------------------- | ------------------------------------------------- |
| `ResourceSendRequest`               | document `http://localhost:3000/` 요청 시작       |
| `ResourceSendRequest`               | `/images/week-07/hero-1600.webp` 요청 시작        |
| `firstContentfulPaint`              | 첫 콘텐츠 페인트                                  |
| `largestContentfulPaint::Candidate` | Header link text 후보                             |
| `largestContentfulPaint::Candidate` | `IMG class='HeroSection-module__...__image'` 후보 |

Trace에서 document 요청 직후 Hero 이미지 요청이 시작되고, 최종 LCP 후보가 Hero 이미지로 기록됐다. LayoutShift 이벤트는 `0`개였다.

## Home / Slow API 보조 관찰

Hero LCP 구간 중 서버 응답 대기와 이미지 요청 시작 대기를 확인하기 위해 `NEXT_PUBLIC_HOME_API_SCENARIO=slow` 조건을 별도로 재측정했다. 이 측정은 normal Home 5회 기준선을 대체하지 않고, LCP 구간 분해를 위한 보조 자료로 사용한다.

- 실행:
  - `NEXT_PUBLIC_HOME_API_SCENARIO=slow pnpm build`
  - `NEXT_PUBLIC_HOME_API_SCENARIO=slow pnpm start`
- 측정 URL: `http://localhost:3000/`
- Raw reports:
  - [home-slow-lighthouse-try1.html](./home-slow-lighthouse-try1.html)
  - [home-slow-lighthouse-try2.html](./home-slow-lighthouse-try2.html)
  - [home-slow-lighthouse-try3.html](./home-slow-lighthouse-try3.html)
- Raw Network: [home-slow-network.har](./home-slow-network.har)
- Raw trace: [home-slow-performance-trace.json.gz](./home-slow-performance-trace.json.gz)

### Home / Slow API Lighthouse 결과

| 회차 | Performance |  FCP |  LCP |  TBT | CLS |
| ---- | ----------: | ---: | ---: | ---: | --: |
| 1    |          96 | 0.9s | 2.7s | 50ms |   0 |
| 2    |          93 | 1.0s | 3.2s | 40ms |   0 |
| 3    |          93 | 0.9s | 3.2s |  0ms |   0 |

- LCP median: 3.153s
- LCP min: 2.720s
- LCP max: 3.218s
- CLS: 3회 모두 `0`

### Home / Slow API 구간 분해

| 구간                  | 관찰                                                                                |
| --------------------- | ----------------------------------------------------------------------------------- |
| 서버 응답 대기        | Network HAR에서 document `/` 요청이 약 `1.54s` 걸렸다.                              |
| 이미지 요청 시작 대기 | Performance trace에서 document 요청 직후 Hero 이미지 요청이 시작됐다.               |
| 이미지 전송           | `/images/week-07/hero-1600.webp` 전송 크기는 약 `146KB`로 기록됐다.                 |
| 화면에 그려질 때까지  | Trace에서 최종 LCP 후보는 Hero 이미지가 됐다.                                       |
| Layout shift 확인     | Trace의 LayoutShift 이벤트는 `0`개였고, Lighthouse CLS도 3회 모두 `0`으로 기록됐다. |

Home slow 조건에서도 서버 응답 대기 약 `1.5s`는 document 요청에 남아 있었지만, Hero 이미지 전송 크기가 크게 줄어 LCP median은 Before slow 약 `40.6s`에서 After slow 약 `3.15s`로 개선됐다.

## Before / After 비교

| 항목                     | Before normal | After normal |
| ------------------------ | ------------: | -----------: |
| LCP median               |       40.590s |       3.153s |
| LCP min                  |       40.588s |       3.149s |
| LCP max                  |       40.599s |       3.173s |
| Performance median       |            75 |           94 |
| CLS median               |             0 |            0 |
| Hero image transfer size |      약 7.5MB |     약 146KB |

## 판단

- 관찰한 사실: Hero 이미지 요청은 document 직후 발견됐고, 전송 크기는 Before 약 `7.5MB`에서 After 반복 측정 약 `146KB`, 최종 q72 파일 `123KB`로 줄었다.
- 원인 가설 검증: 같은 조건의 Lighthouse Mobile에서 LCP median이 `40.590s`에서 `3.153s`로 줄어, 고용량 Hero 원본 이미지 전송 비용이 주요 병목이라는 가설을 지지한다.
- 요청 우선순위 판단: Lighthouse는 LCP image preload request에 `fetchpriority=high` 적용을 제안했지만, 이번 변경은 이미지 후보와 전송 크기만 바꾸는 최소 변경으로 한정하고 요청 우선순위 조정은 후속 실험 후보로 남긴다.
- 추가 압축 판단: q72 적용 후에도 Lighthouse는 Hero 이미지에 약 `17.2KiB` 추가 절감 가능성을 표시했지만, Before 대비 남은 절감량은 작아 더 낮은 품질 압축은 적용하지 않는다.
- 범위 제외: 상품 이미지 최적화 제안도 표시됐지만, 이번 1단계의 병목 가설은 Home Hero LCP로 한정했기 때문에 ProductCard 이미지 최적화는 별도 후속 작업으로 분리한다.
