# 7주차 4단계 — 최종 After와 회귀 확인

<!-- AI 초안 — 측정·기록 자동화, 검토 필요 -->

- **최종 After SHA**: `268acdc` (3단계까지 반영) / 중간 After: `7f5755b`(1단계) / **Before: `c572ae2`**
- 측정 조건: 0단계와 SHA 제외 동일 — Lighthouse 13.4.1 · Chrome 151 headless · 모바일 412×823 · 시뮬레이트 slow 4G(RTT 150ms·1474.56Kbps·CPU 4x) · 매회 새 프로필 · `/` cold load · production(`APP_ORIGIN=http://localhost:3000`)

## 홈 — Before → 1단계 → 최종

| 지표 | Before `c572ae2` | 1단계 `7f5755b` | 최종 `268acdc` (raw) | 판정 |
| --- | --- | --- | --- | --- |
| FCP 중앙값 | 904ms | 904ms | **905ms** (909/905/905/905/906) | 불변 |
| LCP 중앙값 | 40,662ms | 2,913ms | **3,073ms** (3222/3064/3066/3190/3073) | Before 대비 **−92.4%**. 1단계 대비 +160ms — 아래 판단 |
| CLS | 0.000 | 0.003 | **0.000** ×5 | 1단계의 copy 박스 shift가 **hydration으로 소멸** — 배너 문구가 SSR에 이미 있어 교체 자체가 없다 |

측정 흔들림: 최종 LCP 범위 158ms — Before 대비 변화(37.6s)가 범위를 압도한다.

## LCP 구간 비교 (관측 기준)

| 구간 | Before | 1단계 | 최종 | 원인 |
| --- | --- | --- | --- | --- |
| TTFB | 4ms | 4ms | **521ms** | 홈이 동적 렌더로 전환 — 문서가 서버에서 API(mock 500ms)를 기다린다 (3단계 비용) |
| load delay (발견) | 595ms | 37ms | **5ms** | preload가 초기 문서에 + 문서 도착 즉시 요청 |
| load time (전송) | 스로틀 ~39s | 86ms | 42ms | 750w 후보 32KB (Before 7,369KB) |
| render delay | 147ms | 20ms | 42ms | — |

**가장 길었던 구간의 이동**: 이미지 전송(39s) → TTFB(0.5s). 클라이언트 `/api/home` fetch는 waterfall에서 사라졌다(서버로 이동, hydration으로 전달). LCP element는 세 시점 모두 hero `<img>`.

## 1단계 대비 +160ms 판단 — 유지

문서 TTFB +517ms를 치르고 LCP는 +160ms만 늘었다(발견·hydration 이득이 상쇄). 대가로 얻은 것: 실데이터 기반 metadata·OG(크롤러/공유 미리보기), 초기 HTML의 실콘텐츠(JS 없이 의미 전달), CLS 0 복귀, 직접 진입 시 스켈레톤 없이 즉시 목록. **효과 대비 손실이 측정 범위(158ms) 근처라 유지한다.** FCP·이미지 품질·기능 회귀 없음.

## 목록 페이지

CLS **0.000 ×3** (LCP 3068–3218ms — 첫 카드 이미지). 스켈레톤·placeholder 교체 모두 shift 없음 유지.

## 기능 회귀 확인 (production 브라우저 실측)

| 항목 | 결과 |
| --- | --- |
| 검색·카테고리·정렬·페이지 URL 복원 | 조건 2단 변경 → 뒤로×1 → 앞으로×1: select `[fashion, popular]`·총 6개·인기순 첫 카드 복원, 탭 URL 일치 |
| 장바구니·위시리스트 + Header | 찜+담기 → 배지 1/1, `<Link>` 홈 이동 후 유지 + 동기화 버튼 2개 |
| 동적 title 클라 반영 | 클라 내비에서도 문서 title 갱신 (`매일 새롭게 발견하는 취향 | Commerce` ↔ `상품 목록 | Commerce`) |
| 0건 화면 | `검색 "…" 조건에 맞는 상품이 없어요. (0개)` + URL 일치 |
| 로딩·에러·재시도 | 2단계에서 상태 6종 재현 완료(`1b1e64d` 기준). 3단계는 해당 클라 분기 코드를 변경하지 않음 |

**3단계 이후의 관찰 하나**: 조건 변경 시 서버 경유 데이터(RSC + hydrate)가 함께 흐르므로, **브라우저 fetch 주입만으로는 목록 에러가 재현되지 않는다**(서버 fetch는 정상 → 성공 데이터가 hydrate됨 — 실측: 주입 상태에서도 0건 정답 화면 정착·URL 일치). 실제 API 장애에서는 서버 prefetch도 실패(무해)하고 클라 fetch도 실패하므로 기존 에러 분기가 그대로 동작한다. 에러 재현 주입 지점이 클라에서 서버로 이동했다는 뜻이며, 상태 6종 증거는 2단계 SHA 기준이다.

## FSD 의존 방향·Public API (grep 전수 검사)

- entities → features/_pages/app import: **0건**
- features → 다른 feature·상위 import: **0건**
- shared → 상위 import: **0건**
- entities 내부 경로 직접 import(Public API 우회): **0건** — 전부 `@/entities/<슬라이스>` 루트

3단계 신규 파일도 방향 준수: `shared/api/base-url`(하위) ← api 모듈, `app/get-query-client`·`shared-metadata`(app) → `_pages` 조회는 라우팅 파일(app 최상위)에서만.

## 효과 없거나 악화된 것

- 문서 TTFB +517ms (위 판단 — 유지, 근거 기록)
- 1단계 CLS 0.003은 3단계에서 자연 해소 — 별도 개입 불필요했음이 결과로 증명
- 되돌린 변경: 없음

`pnpm check` 41/41 통과.
