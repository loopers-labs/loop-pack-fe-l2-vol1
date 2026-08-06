# Week 07 Step 4 Regression After

## 범위

4단계는 Before와 같은 조건에서 최종 After를 다시 확인해 개선 효과와 회귀를 함께 기록하는 단계다.

이 문서는 현재 HEAD 기준 Home normal 5회 재측정, Network, Performance trace를 정리하고, Products 상태 처리와 metadata 증거는 2~3단계 문서와 연결한다.

## 비교 기준

| 구분       | SHA       | 용도                                   |
| ---------- | --------- | -------------------------------------- |
| Before     | `16d2fb7` | 0단계 공통 기준선                      |
| After code | `bdde154` | 1~3단계 코드와 문서가 반영된 현재 HEAD |

## 공통 측정 조건

Before 문서의 Home normal 조건을 유지했다.

- 실행 모드: production build
  - `pnpm build`
  - `pnpm start`
- 기준 URL: `http://localhost:3000/`
- Home API: normal 응답
  - `NEXT_PUBLIC_HOME_API_SCENARIO` 미설정
- 브라우저 / Lighthouse: Chrome `150.0.0.0`, Lighthouse `13.3.0`
- Lighthouse:
  - Mode: Navigation
  - Device: Mobile
  - Category: Performance
  - Clear storage: on
  - Throttling: Lighthouse 기본 simulated throttling

## 저장 자료

| 자료                                                                             | 용도                          |
| -------------------------------------------------------------------------------- | ----------------------------- |
| [home-normal-lighthouse-try1.html](./home-normal-lighthouse-try1.html)           | Home normal Lighthouse 1회차  |
| [home-normal-lighthouse-try2.html](./home-normal-lighthouse-try2.html)           | Home normal Lighthouse 2회차  |
| [home-normal-lighthouse-try3.html](./home-normal-lighthouse-try3.html)           | Home normal Lighthouse 3회차  |
| [home-normal-lighthouse-try4.html](./home-normal-lighthouse-try4.html)           | Home normal Lighthouse 4회차  |
| [home-normal-lighthouse-try5.html](./home-normal-lighthouse-try5.html)           | Home normal Lighthouse 5회차  |
| [home-normal-network.har](./home-normal-network.har)                             | Home normal Network waterfall |
| [home-normal-performance-trace.json.gz](./home-normal-performance-trace.json.gz) | Home normal Performance trace |

관련 이전 자료:

- Before 기준선: [../../before/summary.md](../../before/summary.md)
- 1단계 Home LCP after-final: [../../step-1-home-lcp/after-final/summary.md](../../step-1-home-lcp/after-final/summary.md)
- 2단계 Products 상태 처리: [../../step-2-products-state/after/summary.md](../../step-2-products-state/after/summary.md)
- 3단계 metadata document 비용: [../../step-3-metadata/after/summary.md](../../step-3-metadata/after/summary.md)

## Home Lighthouse 5회 결과

| 회차 | Performance |    FCP |    LCP |  TBT | CLS | Speed Index |
| ---- | ----------: | -----: | -----: | ---: | --: | ----------: |
| 1    |          94 | 0.915s | 3.156s | 27ms |   0 |      1.330s |
| 2    |          93 | 0.917s | 3.240s |  5ms |   0 |      1.248s |
| 3    |          94 | 0.912s | 3.153s | 37ms |   0 |      1.267s |
| 4    |          93 | 0.916s | 3.234s |  5ms |   0 |      1.234s |
| 5    |          94 | 0.912s | 3.152s |  5ms |   0 |      1.261s |

## Home Lighthouse 집계

| 항목        | 중앙값 | 범위           |
| ----------- | -----: | -------------- |
| Performance |     94 | `93~94`        |
| FCP         | 0.915s | `0.912~0.917s` |
| LCP         | 3.156s | `3.152~3.240s` |
| CLS         |      0 | `0~0`          |

Lighthouse의 LCP 분석 기준 최종 LCP element는 Home Hero 이미지였다.

```txt
main > section.HeroSection-module__...__hero > picture.HeroSection-module__...__image > img
src="http://localhost:3000/images/week-07/hero-mobile-768.webp"
fetchpriority="high"
```

LCP 요청 탐색 항목도 모두 통과했다.

- `fetchpriority=high` 적용됨
- 초기 문서에서 요청 검색 가능
- 지연 로드가 적용되지 않음

## Home Network 관찰

Raw HAR: [home-normal-network.har](./home-normal-network.har)

| 요청                                   | 순서 | 전송 크기 | 소요 시간 | 상태 |
| -------------------------------------- | ---: | --------: | --------: | ---: |
| document `/`                           |    1 |   11.2KiB |   546.8ms |  200 |
| `/images/week-07/hero-mobile-768.webp` |   19 |   46.0KiB |    39.3ms |  200 |
| `/_next/image?...p21.jpg&w=640&q=75`   |   20 |   70.6KiB |    21.6ms |  200 |

- 전체 전송량은 약 `459.5KiB`였다.
- Hero 이미지는 `46.0KiB`로 유지됐다.
- 첫 상품 이미지 `p21.jpg`는 `70.6KiB`로 Hero 이미지보다 컸지만, Lighthouse LCP element는 Hero 이미지였다.

## Home Performance Trace 관찰

Raw trace: [home-normal-performance-trace.json.gz](./home-normal-performance-trace.json.gz)

Trace에서 확인한 값:

| 항목                              |  값 |
| --------------------------------- | --: |
| `LayoutShift` 이벤트 수           |   0 |
| `had_recent_input=false` shift 수 |   0 |
| no recent input shift 합계        |   0 |
| LCP candidate 이벤트 수           |   1 |

Home real-final trace에서는 Layout Shifts track에 shift가 기록되지 않았다. Lighthouse 5회 CLS도 모두 `0`이었다.

## Before / After 비교

| 항목                     |       Before normal |       After real-final | 변화               |
| ------------------------ | ------------------: | ---------------------: | ------------------ |
| Performance median       |                  75 |                     94 | 개선               |
| FCP median               |              0.900s |                 0.915s | 측정 흔들림 범위   |
| FCP range                |        0.900~0.900s |           0.912~0.917s | 측정 흔들림 범위   |
| LCP median               |             40.590s |                 3.156s | 크게 개선          |
| LCP range                |      40.588~40.599s |           3.152~3.240s | 크게 개선          |
| CLS median               |                   0 |                      0 | 유지               |
| Hero image transfer size |            약 7.5MB |                46.0KiB | 크게 감소          |
| LCP resource             | `hero-original.jpg` | `hero-mobile-768.webp` | 모바일 후보로 변경 |

판단:

- FCP는 Before와 After 모두 약 0.9초대로, 의미 있는 개선이나 악화로 보지 않는다.
- LCP는 `40.590s`에서 `3.156s`로 줄었다. 5회 raw 값 범위보다 훨씬 큰 변화이며, Hero 이미지 전송 크기 감소와 직접 연결된다.
- CLS는 Before와 After 모두 `0`으로 유지됐다.
- 이미지 전송량은 Home 전체 기준 약 `7.9MB`에서 약 `459.5KiB`로 줄었다.
- Hero 이미지는 약 `7.5MB` 원본에서 `46.0KiB` 모바일 WebP로 바뀌었다.

## Products 상태 회귀

2단계에서 확인한 상태 처리 증거는 다음 문서에 남겼다.

- [../../step-2-products-state/after/summary.md](../../step-2-products-state/after/summary.md)
- [../../step-2-products-state/after/products-step2-states-network.mp4](../../step-2-products-state/after/products-step2-states-network.mp4)

이미 확인한 상태:

- 데이터 없는 최초 진입: skeleton 표시
- 이전 데이터가 있는 갱신: 기존 목록 유지 + 갱신 상태 표시
- 성공 + 0건: `총 0개`와 빈 결과 문구
- 최초 실패: 목록 대신 실패 UI와 다시 시도 버튼
- 갱신 실패: 기존 목록 유지 + 실패 배너와 다시 시도 버튼
- 취소: active products 요청이 `net::ERR_ABORTED`로 취소되고 최종 URL 결과가 유지됨

4단계 최종 제출에서 Products를 별도 녹화하지 않는다면, 2단계 녹화와 문서를 회귀 확인 증거로 연결한다. 더 엄격히 맞추려면 현재 HEAD에서 짧은 Products 회귀 체크를 추가로 남긴다.

추가 확인 후보:

- 검색, 카테고리, 정렬, 페이지 조건 변경
- 뒤로 가기와 앞으로 가기
- 장바구니, 위시리스트, Header count
- 로딩, 에러, 빈 상태, 재시도
- URL query와 화면 결과 일치

## Metadata 회귀

3단계에서 확인한 metadata document 증거는 다음 문서에 남겼다.

- [../../step-3-metadata/after/summary.md](../../step-3-metadata/after/summary.md)

이미 확인한 항목:

- normal document 응답
- 정상 empty document 응답
- metadata query failure document 응답
- 서버 Route Handler 호출 계수와 계측 제거
- normal UA와 `facebookexternalhit` 응답 시점 비교

판단은 유지한다. 동적 metadata는 공유 정보 품질을 높였지만, slow 조건에서는 document 응답 시작이 약 `1.5s`까지 늦어지는 비용을 만든다.

## 회귀 판단

- 유지한 변경: 모바일 Hero WebP 후보, `<picture>` 분기, `fetchPriority="high"`, 상품 목록 상태 처리, metadata 구성.
- 되돌린 변경: 모바일 q60 추가 압축은 파일 크기 절감과 Lighthouse 변화가 작아 유지하지 않았다.
- Home 기준으로 LCP는 크게 개선됐고 CLS는 악화되지 않았다.
- FCP는 사실상 유지됐다.
- Products 조건 변경 Performance trace에서 LayoutShift가 관찰된 점은 2단계 문서에 남겼다. Lighthouse navigation CLS는 0이었고, 현재는 UX/복잡도 tradeoff 때문에 후속 관찰 대상으로 유지한다.
- 첫 상품 이미지가 Hero보다 큰 전송 크기로 관찰됐지만, 이번 4단계 Home LCP element는 Hero 이미지였으므로 별도 후속 최적화 후보로 분리한다.
