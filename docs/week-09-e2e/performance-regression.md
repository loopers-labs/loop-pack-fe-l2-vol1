# 9주차 — 로그인 초기 HTML과 상품 이미지 회귀 확인

로그인 상태를 초기 HTML에 반영하면서 사용자 화면이 동적 렌더링으로 전환됐습니다. 인증 변경 뒤에도 FCP와 LCP에서 7주차보다 느려지는 회귀를 확인하지 않았고, 로그인 상태 영역은 layout shift 원인에 포함되지 않았습니다.

일반 상품 이미지는 기존 렌더링 크기를 유지한 채 `next/image`로 전환했습니다. 이미지 전송량과 LCP를 별도로 비교하지 않았으므로 추가 성능 개선 수치는 주장하지 않고, 레이아웃 회귀가 없었다는 결과만 기록했습니다.

## 사용자 화면의 동적 렌더링 범위

루트 레이아웃은 [`getCurrentUser()`](../../src/app/_lib/session.ts)를 호출하고, 이 함수는 요청의 세션 쿠키를 읽습니다. Next.js 공식 문서는 [`cookies()`를 Dynamic API](https://nextjs.org/docs/app/api-reference/functions/cookies)로 분류하며, layout이나 page에서 호출하면 해당 경로가 동적 렌더링을 사용한다고 설명합니다.

다음 표는 `pnpm build` 출력에서 사용자 화면의 렌더링 판정을 확인해 수기로 옮긴 결과입니다. 성능 측정 스크립트의 출력에는 포함되지 않습니다.

| 빌드 판정 | 경로 |
| --- | --- |
| 동적 경로(`ƒ`) | `/`, `/cart`, `/login`, `/orders`, `/orders/new`, `/performance-lab/inp`, `/products`, `/products/[id]` |
| 정적 경로(`○`) | `/robots.txt`, `/sitemap.xml` |

이 구조는 JavaScript 실행 전부터 로그인 상태를 초기 HTML에 반영하기 위한 선택입니다.

## 초기 HTML에서 로그인 상태 확인

2026-09-04에 프로덕션 서버의 원본 문서 응답을 확인했습니다. `Invoke-WebRequest`의 `WebRequestSession`으로 로그인 응답의 httpOnly 세션 쿠키를 보관하고, 하이드레이션(hydration) 이후의 브라우저 DOM이 아닌 `/` 응답의 `Content`를 직접 비교했습니다.

| 요청 상태 | HTTP | 원본 HTML에서 확인한 UI |
| --- | ---: | --- |
| 쿠키 없는 `/` | 200 | `/login` 링크와 `로그인` 문구가 있고 `/orders` 링크와 `주문 내역`은 없음 |
| 로그인 후 같은 세션의 `/` | 200 | `/orders` 링크, `주문 내역`, `루퍼1 로그인 중`, `로그아웃` 버튼이 있고 `/login` 링크는 없음 |

재현할 때는 `pnpm build` 후 `APP_ORIGIN=http://127.0.0.1:3209`로 `pnpm start -- -p 3209`를 실행했습니다.

## 모바일 로딩 지표 재측정

7주차와 같은 모바일 412×823, DPR(Device Pixel Ratio) 1.75, Slow 4G 전송 조건, CPU 4배 제한과 캐시 비활성 조건으로 홈을 5회 측정했습니다. 먼저 프로덕션 서버를 3100 포트에서 실행합니다.

```powershell
pnpm build
$env:APP_ORIGIN='http://127.0.0.1:3100'
pnpm start -- -p 3100
```

다른 터미널에서 다음 명령을 실행하고 표준 출력을 [`performance-regression.json`](./performance-regression.json)에 그대로 저장합니다.

```powershell
node scripts/measure-week09-performance.mjs > docs/week-09-e2e/performance-regression.json
```

7주차에 사용한 Chrome 151과 Lighthouse 12.8.2 실행 파일은 현재 환경에 남아 있지 않았습니다. 이번에는 Chrome 152에서 Playwright CDP(Chrome DevTools Protocol)와 `PerformanceObserver`로 같은 원시 지표를 수집했습니다. 도구 버전이 다르므로 작은 차이를 개선으로 해석하지 않고 기존 범위를 벗어난 회귀가 있는지만 판단했습니다.

| 지표 | 7주차 최종값 | 로그인 초기 HTML 적용 후 | 판단 |
| --- | ---: | ---: | --- |
| FCP 중앙값 | 2,198ms | 2,060ms | 기존 2,122–2,734ms보다 62ms 낮음 |
| LCP 중앙값 | 2,262ms | 2,228ms | 기존 2,184–2,856ms 범위 안 |
| CLS 중앙값 | 0 | 0.0248 | 이동 원소를 별도 확인 |
| 응답 시작 | 대표 실행 9.8ms | 중앙값 24.7ms | 첫 실행 52.7ms, 나머지 21.2–25.9ms |

다음 CLS(Cumulative Layout Shift) 원인 설명은 `PerformanceObserver`가 수집한 `rows[].shifts`의 노드와 좌표를 사람이 해석한 결과입니다. 자동 생성된 판정이 아닙니다.

CLS는 다섯 번 모두 0.0247–0.0248이었습니다. 가장 큰 이동은 홈 콘텐츠가 완성되며 초기 뷰포트(viewport)의 푸터가 밀려난 구간이었습니다. 더 작은 이동은 웹폰트 적용 전후의 헤더 내비게이션 폭 변화였습니다. 로그인 상태 영역은 레이아웃 이동 원인에 포함되지 않았습니다.

LCP는 7주차 측정 범위 안에 있었고, FCP 중앙값은 기존 범위보다 62ms 낮았습니다. 첫 실행을 제외한 응답 시작 시간은 21.2–25.9ms였습니다. 측정 결과에서 유의한 회귀를 확인하지 못했으므로 현재 레이아웃 구조를 유지합니다. 사용자별 HTML을 반환하므로 공개 캐시 헤더는 추가하지 않았습니다.

재현 스크립트는 [`measure-week09-performance.mjs`](../../scripts/measure-week09-performance.mjs), 스크립트가 출력한 5회 원시 측정값은 [`performance-regression.json`](./performance-regression.json)에 남겼습니다. 빌드 환경과 route 판정, CLS 원인 설명은 이 문서에 수기로 기록했습니다.

## 상품 이미지 전환 후 레이아웃 확인

7주차에 전송 병목을 확인한 Hero `<picture>`는 그대로 유지했습니다. 구조 변경과 섞지 않으려고 미뤘던 일반 상품 이미지는 후속 작업에서 `next/image`로 옮겼습니다.

Next.js의 [`Image` 공식 문서](https://nextjs.org/docs/app/api-reference/components/image)는 반응형 이미지에 `sizes`를 제공하면 브라우저가 생성된 `srcset`에서 적절한 파일을 선택할 수 있다고 설명합니다. 현재 구현은 카드의 2·3·4열, 카테고리 최대 112px, 상세 최대 564px, 장바구니·주문 80px과 다이얼로그 64px 슬롯을 각각 `sizes`에 반영합니다.

프로덕션 빌드의 390×844 뷰포트에서 전환 전후 렌더링 박스를 비교했습니다.

| 위치 | 전환 전후 렌더링 크기 |
| --- | ---: |
| 카테고리 | 65.19px |
| 상품 카드 | 173px |
| 상품 상세 | 358px |
| 장바구니·주문 | 80px |
| 장바구니 다이얼로그 | 64px |

전환 후 다섯 유형의 이미지 위치는 모두 `/_next/image` 최적화 경로를 사용했습니다. 375×812 소형 화면, 844×390 가로 화면, 768×1024 태블릿과 1440×900 데스크톱에서도 이미지와 기존 비율 wrapper의 너비·높이가 일치했습니다.

이 비교는 기존 렌더링 크기와 레이아웃 이동을 막는 예약 공간을 보존했다는 근거입니다. 이미지 전송량과 LCP를 별도로 비교하지 않았으므로 `next/image` 전환으로 성능 수치가 개선됐다고 해석하지 않습니다.
