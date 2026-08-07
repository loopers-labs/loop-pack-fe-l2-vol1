# 4단계 — 최종 성능 및 회귀 검증

> 측정일: 2026-08-07  
> Before Home: `ccd46b2f` · Before Products: `4cfd4b7` · 최종 After: `b021c86d`

## 측정 조건

- Node.js `v22.12.0`, pnpm `10.15.1`
- `pnpm build` 후 `pnpm start` production 서버
- URL `http://localhost:3000/`, Home slow API 1.5초 유지
- Lighthouse `12.8.2`, mobile simulated throttling, cold load 5회
- Chrome/프로필·URL·viewport 조건은 Before와 동일하게 유지

## Home Lighthouse 5회

| 지표 | run1 | run2 | run3 | run4 | run5 | 중앙값 | min~max | max-min |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Performance | 97 | 97 | 97 | 97 | 97 | **97** | 97~97 | 0 |
| FCP (ms) | 917.140 | 906.930 | 907.066 | 905.594 | 905.814 | **906.930** | 905.594~917.140 | 11.546 |
| LCP (ms) | 2655.710 | 2640.395 | 2641.599 | 2637.391 | 2639.721 | **2640.395** | 2637.391~2655.710 | 18.319 |
| CLS | 0.009752 | 0.009752 | 0.009752 | 0.009752 | 0.009752 | **0.009752** | 0.009752~0.009752 | 0 |

Before 중앙값 FCP `919ms`, LCP `40.9s`, CLS `0.016`과 비교하면 최종 LCP는 약 `38.26s` 감소했다. 점수나 향상률을 합격선으로 사용하지 않고 동일 조건 5회의 분포와 회귀 결과를 함께 판단했다.

원본은 `evidence/stage4/lighthouse/run1.json`~`run5.json`, 집계값은 `summary.json`에 보존했다.

## LCP 요소와 구간

중앙 LCP 실행은 run2이며 LCP 요소는 Home Hero 이미지다.

- selector: `body > main.week05-page > section...hero > img...image`
- URL: `/_next/image?url=%2Fimages%2Fweek-07%2Fhero-original.jpg&w=750&q=75`
- 응답 형식/크기: WebP, transfer `32,423B`, resource `31,994B`
- TTFB `453.465ms`
- resource load delay `163.418ms`
- resource load duration `152.081ms`
- element render delay `1871.431ms`

Hero는 초기 document에서 발견되며 `loading="eager"`로 확인됐다. 별도 `priority`/preload는 앞선 실험에서 총 LCP 개선이 없어 추가하지 않았다.

## Network·filmstrip·Layout Shift

mobile 412×823 cold load HAR에서 document는 `0ms`에 시작해 `1528.962ms`에 완료됐고 `10,124B`가 전송됐다. Hero는 document 시작 `14ms` 후 요청되어 `11.364ms`, `24,693B`, status 200으로 완료됐다. Home 데이터 조회는 RSC 서버 내부 fetch이므로 브라우저 HAR에 별도 `/api/home` 요청으로 나타나지 않는다.

Performance trace의 사용자 입력 없는 Layout Shift 합계는 `0.003392`였다. fallback과 실제 콘텐츠가 바뀌어도 Hero 공간은 유지됐다. desktop에서는 이미지 비율·선명도와 카피 가독성을 확인했다. mobile lazy-load 미완료를 최종 검증 중 발견해 `loading="eager"`로 보완했고, 모바일 E2E에서 상호작용 없이 `naturalWidth > 0`을 확인했다.

- HAR: `evidence/stage4/home-network.har`
- trace: `evidence/stage4/home-performance.json.gz`
- 자동 관찰: `evidence/stage4/home-observation.json`

## Products 회귀

최종 SHA에서 Playwright 14개가 모두 통과했다.

- 최초 데이터 없음: 실제 12개 크기의 skeleton
- 갱신: 직전 목록 유지, `aria-busy=true`, 완료 후 현재 URL 조건의 결과
- empty·최초 실패·갱신 실패·재시도·예상 밖 응답 Error Boundary 구분
- 검색·카테고리·정렬·페이지의 URL, GET query, 화면 결과 일치
- 빠른 category 변경에서 casual/fashion/goods 3건 `net::ERR_ABORTED`, 최종 digital 요청 200
- 최종 digital 결과 ID: `p24`, `p22`, `p30`, `p21`, `p25`, `p23`
- 최초 CLS `0`, 갱신 CLS `0.000943`로 기준 `0.1` 미만

영상은 빠른 연속 변경·취소·최종 URL 정합성 시나리오이며 상세 자동 관찰은 `products-regression.json`에 기록했다.

## Metadata 회귀

최종 SHA의 production document를 다시 확인했다.

| URL | status | title | description | OG image |
| --- | ---: | --- | --- | --- |
| `/` | 200 | `매일 새롭게 발견하는 취향` | `지금 가장 사랑받는 상품을 만나보세요.` | `p6.jpg` |
| `/products?category=fashion` | 200 | `패션 상품 \| Loopers` | `카테고리 패션 · 정렬 최신순 · 상품 6개` | `p6.jpg` |
| `/products?category=digital&scenario=empty` | 200 | `디지털 상품 \| Loopers` | `카테고리 디지털 · 정렬 최신순 · 상품 0개` | fallback `p1.jpg` |

세 문서 모두 하나의 `h1`, 페이지 설명, 주요 `/products` 링크를 유지한다. query failure의 root metadata 상속, Route Handler 호출 1회, normal/crawler UA 비용은 3단계 원본 증거(`stage3-documents.json`, `stage3-route-count.json`, `stage3-ua-timings.json`)를 유지한다. 이후 변경은 E2E 재현과 Hero loading 속성뿐이라 metadata 데이터 경로에는 변화가 없다.

## 최종 검증

- Vitest: 9 files, 50 tests 통과
- Playwright: 14 tests 통과
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm format:check` 통과
- 서버 응답을 Zustand나 별도 로컬 response state에 복사하지 않음
- FSD public API와 기존 장바구니·위시리스트 상태 소유권 유지

남은 성능 상한은 이미지 전송보다 slow 데이터 경계 뒤의 element render delay에 가깝다. 이번 과제 범위를 넘어 추가 최적화를 진행하지 않았다.
