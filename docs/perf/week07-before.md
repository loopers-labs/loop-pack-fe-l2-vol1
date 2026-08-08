# 7주차 0단계 — Before 측정 기록

<!-- AI 초안 — 측정·기록 자동화, 검토 필요 -->

## 측정 조건 (After에서 SHA 제외 동일하게 유지할 것)

| 항목 | 값 |
| --- | --- |
| **Before SHA** | `c572ae2` (스타터 Hero를 홈에 연결, 원본 이미지 그대로) |
| URL | `http://localhost:3000/` (홈), cold load |
| 실행 | `APP_ORIGIN=http://localhost:3000 pnpm build && pnpm start` — **production** |
| 도구 | Lighthouse 13.4.1 (CLI, `--only-categories=performance`), Chrome 151.0.0.0 headless (`--headless=new`) |
| 스로틀링 | Lighthouse 기본 시뮬레이트 — RTT 150ms, 다운로드 1474.56Kbps, CPU 4x slowdown |
| 화면 | mobile 에뮬레이션 412×823, DPR 1.75 |
| 프로필 | 매 실행 새 임시 Chrome 프로필 (확장·캐시·로그인 없음) |

## FCP · LCP · CLS — 5회 raw

| 회 | FCP(ms) | LCP(ms) | CLS |
| --- | --- | --- | --- |
| 1 | 909 | 40678 | 0.000 |
| 2 | 904 | 40662 | 0.000 |
| 3 | 904 | 40662 | 0.000 |
| 4 | 904 | 40662 | 0.000 |
| 5 | 904 | 40662 | 0.000 |
| **중앙값** | **904** | **40662** | **0.000** |
| 범위 (최소–최대) | 904–909 | 40662–40678 | 0–0 |

측정 흔들림이 LCP 기준 16ms(0.04%)로 사실상 결정적 — 시뮬레이트 스로틀링 덕. **범위보다 큰 변화만 개선으로 인정한다.**

## LCP element와 요청 체인

- **LCP element**: `section.HeroSection-module__hero > img.HeroSection-module__image` — hero 원본 이미지.
- **Network waterfall** (관측 시각, 스로틀 미적용 기준 — **`run1` 1회분**. 5회 집계는 아래 구간 분해 표):

| 시작 | 완료 | 요청 | 전송 크기 |
| --- | --- | --- | --- |
| 0ms | 4ms | document `/` (정적 셸 — 로딩 상태) | 3KB |
| 78ms | 587ms | `/api/home` (mock 500ms 지연 포함) | 4KB |
| **599ms** | 706ms | `/images/week-07/hero-original.jpg` | **7,369KB** |

- **요청 시작 순서의 의미**: hero 이미지는 `/api/home` 응답이 와야 렌더되는 클라이언트 컴포넌트 안에 있어서, **데이터 조회가 끝난 뒤에야 발견·요청된다**. Lighthouse LCP discovery 체크: `Request is discoverable in initial document: false`, `fetchpriority=high: 미적용`.
- **LCP 구간 분해** (`lcp-breakdown-insight`, **관측 시계 · 5회 중앙값(범위)**):

| 구간 | 중앙값 | 범위 |
| --- | --- | --- |
| TTFB | 2ms | 2–4 |
| load delay (발견 지연 — api 대기) | **587ms** | 583–595 |
| load time (전송) | 32ms | 24–108 |
| render delay | 92ms | 80–147 |
| (참고) 요청 시작 시각 = TTFB + load delay | 589ms | 586–598 |

  구간값은 관측 시계라 시뮬레이트 시계의 LCP(40,662ms)와 더해 맞출 수 없다 — 구간 합은 713ms다. 관측 로컬에는 대역폭 제한이 안 걸려 7.2MB가 32ms에 내려오지만, 시뮬레이트 가정에서는 **7.2MB ÷ 1.47Mbps ≈ 39초**가 되고 이것이 LCP 40.7초의 대부분이다. 반면 load delay 587ms는 두 시계 어느 쪽에도 그대로 남는다.
- filmstrip 관찰: FCP(904ms)에 헤더+로딩 텍스트가 먼저 그려지고, hero는 전송 완료까지 배경색 박스로 남는다.
- CLS 0인 이유: hero 컨테이너가 `aspect-ratio: 16/9`로 공간을 선점하고 `img`에 width/height가 있어 교체 시 밀림이 없다.

## slow 목록 관찰 (`scenario=slow`, +1.5s — 앱 코드 무변경, fetch 감싸서 주입)

| 상황 | 관찰 |
| --- | --- |
| 데이터 없는 최초 진입 | `불러오는 중…` 텍스트 한 줄 — **실제 목록 크기를 예상할 수 없는 pending UI** (2단계 대상) |
| 기존 목록이 있는 갱신 (정렬 변경) | 0.4s 시점에 **기존 목록이 즉시 사라지고** `불러오는 중…`만 표시 — key 변경 = 새 쿼리 = `isPending` (2단계 대상) |
| 조건 연속 변경 (price-asc → 120ms 뒤 price-desc) | 완료 후 URL `?sort=price-desc` = select 값 = 화면 첫 상품(23AW Voyager Balmacaan, 최고가) — **active query와 화면 일치, 이전 요청이 화면을 덮지 않음** (query key 분리 덕, 유지) |

## 부수 관찰

- Hero 교체로 홈의 `h1`이 사라졌다(HeroSection은 `h2` 렌더, 기존 week05-hero의 `h1` 제거됨). 데이터 도착 전에는 제목이 아예 없다 — 1단계 "Header·하나의 `h1`·페이지 설명이 함께 막히지 않게" + 3단계 초기 HTML 요구의 대상.
- 홈 document는 정적 셸이라 초기 HTML에 배너·상품·이미지가 없다(클라이언트 조회 후 렌더). 3단계 metadata 작업과 연결됨.

## 관찰 → 가설 → 반증 → 최소 변경 (0단계 요구)

- **관찰한 사실**: LCP 요소는 hero `<img>`이고 중앙값 40.66s, 전송 7.2MB이며 요청은 `/api/home` 완료 후(589ms · 5회 중앙값)에야 시작된다.
- **원인 가설**: LCP의 지배 구간은 이미지 전송 시간(7.2MB ÷ 1.47Mbps ≈ 39s)이고, 부차 구간은 초기 문서에서 발견 불가한 요청 시작 지연(~600ms+)이다.
- **반증 방법**: 이미지 내용·비율·표시 크기를 유지한 채 전송 크기만 표시 크기 기준으로 줄여 같은 조건으로 재측정 — LCP가 측정 범위(16ms)보다 크게 줄지 않으면 가설을 기각한다.
- **먼저 시도할 가장 작은 변경**: hero 이미지를 실제 표시 크기(모바일 412px 폭 × DPR 1.75 ≈ 720px)에 맞는 후보로 리사이즈·재인코딩해 전송 크기부터 줄인다.

## 증거 자산

| 자산 | 위치 | 내용 |
| --- | --- | --- |
| Lighthouse filmstrip 8프레임 + final | `docs/perf/assets/before-filmstrip-*.jpg` | 표시 순서: 375ms 빈 화면 → 750ms **헤더+로딩 텍스트 먼저** → 1125ms~ hero 렌더 (관측 시간 기준. 스로틀 시뮬레이션에서는 hero 완성이 LCP 40.7s 시점) |
| slow 목록 녹화 GIF (7프레임) | `docs/perf/assets/before-slow-list.gif` | 홈(hero) → 목록 → **갱신 시 목록 소멸+`불러오는 중…`** → 인기순 목록 → **새 키 검색 pending** → 결과 1개. `scenario=slow`는 앱 코드 무변경, 브라우저에서 `window.fetch`를 감싸 주입 |
| Performance trace (DevTools에서 열기 가능) | `docs/notes/perf-week07/devtools-run-0.trace.json.gz` (개인 노트 영역, repo 미포함) | `--throttling-method=devtools --save-assets`로 생성. **주의: localhost는 devtools 방식 대역폭 제한이 완전히 적용되지 않아(해당 런 LCP 3.7s) 절대값 증거로 쓰지 않는다** — 요청 순서·의존 체인 확인용. 수치 증거는 위 시뮬레이트 5회 |
| Lighthouse 원본 JSON (run1) | `docs/notes/perf-week07/run1.json` | 표의 모든 수치 출처. 재생성: `npx lighthouse http://localhost:3000/ --only-categories=performance --output=json --chrome-flags="--headless=new"` |

Layout shifts: 시뮬레이트 5회·devtools 런 모두 CLS 0.000 — shift 이벤트 자체가 없어 track에 표시할 항목이 없다(hero `aspect-ratio` 선점 + `img` width/height).
