# Week 07 Performance After Final

## 공통 실행 조건

- 측정 코드 상태: `6e154e0` 이후 Home Hero 최종 이미지 실험 작업트리
- 실행 모드: production build
  - `pnpm build`
  - `pnpm start`
- 기준 URL: `http://localhost:3000`
- 브라우저 / Lighthouse: Chrome `150.0.0.0`, Lighthouse `13.3.0`
- 브라우저 상태: Lighthouse `Clear storage` on

## 최종 적용 변경

- 원본 이미지 `public/images/week-07/hero-original.jpg`는 보존했다.
- 데스크톱/태블릿 fallback으로 `1600x900` WebP 후보를 유지했다.
- 모바일 Hero의 실제 CSS 비율 `4 / 5`에 맞춰 `768x960` WebP 후보를 추가했다.
- `<picture>`로 `max-width: 640px`에서는 `/images/week-07/hero-mobile-768.webp`를 선택하게 했다.
- LCP 이미지에 `fetchPriority="high"`를 적용했다.
- Hero의 CSS 크기, 문구, 주요 피사체 배치 의도, CLS 방지용 aspect-ratio는 유지했다.

| 이미지 후보            | 크기      | 파일 크기 |
| ---------------------- | --------- | --------: |
| `hero-original.jpg`    | 3840x2160 |    7.2 MB |
| `hero-1600.webp` q72   | 1600x900  |    123 KB |
| `hero-mobile-768.webp` | 768x960   |     46 KB |

모바일 후보는 q72로 유지했다. q60 추가 압축도 실험했지만 파일 크기 절감이 약 `7.7KB`에 그쳤고, Lighthouse LCP 변화도 작아 품질 여유를 남기는 q72로 되돌렸다.

## Home / Normal Lighthouse Raw Reports

- [home-normal-lighthouse-try1.html](./home-normal-lighthouse-try1.html)
- [home-normal-lighthouse-try2.html](./home-normal-lighthouse-try2.html)
- [home-normal-lighthouse-try3.html](./home-normal-lighthouse-try3.html)
- [home-normal-lighthouse-try4.html](./home-normal-lighthouse-try4.html)
- [home-normal-lighthouse-try5.html](./home-normal-lighthouse-try5.html)

## Home / Normal Lighthouse 결과

| 회차 | Performance |  FCP |  LCP |  TBT | CLS | LCP Resource                           |
| ---- | ----------: | ---: | ---: | ---: | --: | -------------------------------------- |
| 1    |          93 | 0.9s | 3.2s |  7ms |   0 | `/images/week-07/hero-mobile-768.webp` |
| 2    |          93 | 0.9s | 3.3s | 23ms |   0 | `/images/week-07/hero-mobile-768.webp` |
| 3    |          93 | 0.9s | 3.2s |  7ms |   0 | `/images/week-07/hero-mobile-768.webp` |
| 4    |          93 | 1.0s | 3.2s |  4ms |   0 | `/images/week-07/hero-mobile-768.webp` |
| 5    |          93 | 1.0s | 3.2s |  5ms |   0 | `/images/week-07/hero-mobile-768.webp` |

## Home / Normal 집계

- LCP median: 3.228s
- LCP min: 3.227s
- LCP max: 3.251s
- FCP median: 0.914s
- FCP min: 0.912s
- FCP max: 0.959s
- CLS median: 0
- Performance median: 93
- Performance min: 93
- Performance max: 93

## Home / Normal Network Waterfall 관찰

- Raw Network: [home-normal-network.har](./home-normal-network.har)

| 요청                                   | 전송 크기 | 소요 시간 | 비고                                  |
| -------------------------------------- | --------: | --------: | ------------------------------------- |
| document `/`                           |    10.8KB |   529.1ms | 초기 HTML                             |
| `/images/week-07/hero-mobile-768.webp` |    46.0KB |    10.5ms | 모바일 Hero 이미지, 최종 LCP resource |
| `/?_rsc=...`                           |     1.2KB |     8.4ms | 홈 데이터/RSC 흐름                    |

전체 전송량은 약 `459.1KB`였다. 모바일 Hero 이미지는 document 응답 이후 요청됐고, Lighthouse의 LCP 요청 탐색 항목에서 `fetchpriority=high`, 초기 문서 발견, eager load가 모두 통과했다.

## Home / Normal Performance Trace 관찰

- Raw trace: [home-normal-performance-trace.json.gz](./home-normal-performance-trace.json.gz)

Performance trace는 Lighthouse와 같은 모바일 viewport에서 표시 순서와 CLS를 확인하는 용도로 사용했다. 최종 LCP 후보는 Hero 이미지였고, LayoutShift 이벤트는 관찰되지 않았다. Lighthouse 5회 CLS도 모두 `0`이었다.

## Home / Slow API 보조 관찰

Hero LCP 구간 중 서버 응답 대기와 이미지 전송 비용을 분리해 보기 위해 slow API 조건을 별도로 측정했다. 이 측정은 normal Home 5회 기준선을 대체하지 않고 보조 자료로 사용한다.

- 실행:
  - `NEXT_PUBLIC_HOME_API_SCENARIO=slow pnpm build`
  - `NEXT_PUBLIC_HOME_API_SCENARIO=slow pnpm start`
- 측정 URL: `http://localhost:3000/`
- Raw reports:
  - [home-slow-lighthouse-try1.html](./home-slow-lighthouse-try1.html)
  - [home-slow-lighthouse-try2.html](./home-slow-lighthouse-try2.html)
  - [home-slow-lighthouse-try3.html](./home-slow-lighthouse-try3.html)
- Raw Network: [home-slow-network.har](./home-slow-network.har)

### Home / Slow API Lighthouse 결과

| 회차 | Performance |  FCP |  LCP |  TBT | CLS | LCP Resource                           |
| ---- | ----------: | ---: | ---: | ---: | --: | -------------------------------------- |
| 1    |          91 | 0.9s | 3.4s | 12ms |   0 | `/images/week-07/hero-mobile-768.webp` |
| 2    |          92 | 0.9s | 3.2s |  6ms |   0 | `/images/week-07/hero-mobile-768.webp` |
| 3    |          93 | 1.0s | 3.2s |  5ms |   0 | `/images/week-07/hero-mobile-768.webp` |

- LCP median: 3.234s
- LCP min: 3.229s
- LCP max: 3.393s
- FCP median: 0.915s
- CLS: 3회 모두 `0`
- Performance median: 92

### Home / Slow API Network 관찰

| 요청                                   | 전송 크기 | 소요 시간 | 비고                                  |
| -------------------------------------- | --------: | --------: | ------------------------------------- |
| document `/`                           |    10.8KB |  1530.1ms | slow Home API 대기 포함               |
| `/images/week-07/hero-mobile-768.webp` |    46.0KB |     6.2ms | 모바일 Hero 이미지, 최종 LCP resource |
| `/?_rsc=...`                           |     0.4KB |    17.2ms | 홈 데이터/RSC 흐름                    |

slow 조건에서는 document 응답 대기가 약 `1.5s`로 남았다. 그래도 LCP resource는 모바일 Hero 이미지였고, 이미지 전송 크기는 normal 조건과 같은 약 `46KB`로 유지됐다.

## Before / After Final 비교

| 항목                     | Before normal | After final normal |
| ------------------------ | ------------: | -----------------: |
| LCP median               |       40.590s |             3.228s |
| LCP min                  |       40.588s |             3.227s |
| LCP max                  |       40.599s |             3.251s |
| Performance median       |            75 |                 93 |
| CLS median               |             0 |                  0 |
| Hero image transfer size |      약 7.5MB |            약 46KB |

## 판단

- 관찰한 사실: Before의 LCP resource는 `/images/week-07/hero-original.jpg`였고 전송 크기는 약 `7.5MB`였다. After final에서는 모바일 viewport에서 `/images/week-07/hero-mobile-768.webp`가 LCP resource로 선택됐고 전송 크기는 약 `46KB`였다.
- 원인 가설 검증: 같은 Lighthouse Mobile 조건에서 LCP median이 `40.590s`에서 `3.228s`로 줄어, 고용량 Hero 원본 이미지 전송 비용이 주요 병목이라는 가설을 지지한다.
- 요청 탐색 판단: LCP 요청 탐색에서 `fetchpriority=high`, 초기 문서 발견, eager load가 모두 통과했다.
- 모바일 후보 판단: 모바일 Hero는 CSS에서 `4 / 5` 비율로 표시되므로, `1600x900` 단일 후보 대신 `768x960` 후보를 제공했다. 그 결과 모바일 LCP resource가 `hero-mobile-768.webp`로 바뀌고 Hero 전송 크기가 약 `46KB`로 줄었다.
- 남은 병목 판단: LCP는 여전히 약 `3.2s`에 머물렀다. 남은 영향 후보는 document 응답 대기, render-blocking CSS, JS/font 비용이다. Hero title과 description은 Home API의 `banner` 응답 소유권을 유지해야 하므로, API prefetch를 제거해 Hero를 정적 상수로 바꾸는 방식은 적용하지 않았다.
- 제외한 변경: `next/image` 전환은 수동 `<picture>`와 `fetchPriority`로 Lighthouse LCP discovery 조건이 이미 충족되어 제외했다. 모바일 q60 추가 압축은 효과가 작아 q72로 되돌렸다. 남은 이미지 전송 개선 항목은 첫 상품 이미지였지만 LCP 직접 후보가 아니므로 별도 후속 작업으로 분리했다.
