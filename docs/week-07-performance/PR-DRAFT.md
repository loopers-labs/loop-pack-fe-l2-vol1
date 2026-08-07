# 7주차 성능 최적화 PR 초안

## 요약

1.5초 slow API 조건을 유지한 production 환경에서 Home LCP와 상품 목록의 대기 경험을 관찰했습니다. Hero 병목을 원본 전송량과 발견 시점으로 나눠 한 번에 하나씩 변경했고, 상품 목록은 최초 pending과 기존 목록 갱신을 다른 상태로 처리했습니다. Home·Products 동적 metadata와 서버 prefetch/hydration도 같은 query 계약을 사용하도록 구성했습니다.

## 최종 결과

Before Home `ccd46b2f`, Before Products `4cfd4b7`, 최종 After `b021c86d`를 고정했습니다. Lighthouse 12.8.2 mobile cold load 5회 결과입니다.

| 항목 | Before | 최종 After |
| --- | ---: | ---: |
| Home FCP 중앙값 | `919ms` | `906.930ms` |
| Home LCP 중앙값 | `40.9s` | `2.640s` |
| Home CLS 중앙값 | `0.016` | `0.009752` |
| Hero resource | 약 `7.5MB` JPEG | `31,994B` WebP |

1단계 중간 SHA의 `2.637s`는 Hero/RSC 변경 직후 결과이며, 위 `2.640s`가 3단계와 최종 모바일 Hero 보완까지 포함한 제출 기준값입니다.

## 주요 판단

- Hero를 `next/image`로 교체하자 LCP가 `40.9s → 4.219s`로 줄어 원본 전송량이 첫 지배 병목임을 확인했습니다.
- Header·h1·설명·Hero를 RSC 셸에서 먼저 보내고 데이터 영역만 Suspense로 분리해 Hero 발견을 앞당겼습니다.
- `priority`는 별도 실험에서 총 LCP 개선이 없어 제거했습니다. 최종 모바일 cold load에서 native lazy Hero가 완료되지 않는 회귀를 발견해 preload 없이 `loading="eager"`만 적용했고, LCP 범위는 `2.637~2.656s`로 유지됐습니다.
- 상품 목록은 12개 skeleton, 이전 목록 유지 갱신, empty, 최초/갱신 실패와 retry, 취소를 분리했습니다. 빠른 조건 변경에서 이전 3요청은 `net::ERR_ABORTED`, 마지막 digital 요청은 200이며 URL·GET·화면 결과가 일치합니다.
- Products 갱신 CLS는 `0.000943`, Home trace의 사용자 입력 없는 shift 합계는 `0.003392`였습니다.
- root title template·공통 Open Graph와 Home/Products 동적 metadata를 추가했습니다. 정상 empty는 0건 metadata를 만들고 query failure는 root metadata를 상속합니다.
- Products 서버 prefetch 결과를 hydration하되 기존 client query의 URL 정합성·AbortSignal·상태 소유권을 유지했습니다.

## 검증

- Node `v22.12.0`, pnpm `10.15.1`
- Vitest 50개 통과
- Playwright 14개 통과
- lint, typecheck, production build, format check 통과
- Lighthouse raw 5개, HAR, Performance trace, Products 회귀 영상·JSON 보존

상세 수치와 재현 조건은 `docs/week-07-performance/after-final.md`, 원본은 `docs/week-07-performance/evidence/stage4/`에 있습니다.

## 멘토에게 질문

1. Lighthouse breakdown의 구간명과 단일 변수 실험이 서로 다른 원인을 가리킬 때, 실무에서는 어떤 추가 지표로 우선순위를 결정하는지 궁금합니다.
2. 동적 metadata가 본문과 같은 데이터를 조회하면서 crawler의 첫 바이트를 지연시킬 때, 비용과 정보 품질을 어떤 기준으로 절충하는지 궁금합니다.
