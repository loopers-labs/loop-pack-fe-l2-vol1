# Part 2 — 최초 pending·목록 갱신·CLS

## 요약

`/products`에서 목록이 바뀌는 동안 사용자가 지금 무슨 상태인지 알 수 있게 만드는 작업. Before 관찰에서 6개 상태 중 3개가 미충족이었고, Round 0–12를 거쳐 **6개 모두 충족**시켰다.

> **⚠️ 먼저 읽을 것 — 이 문서에서 Lighthouse 숫자는 "개선 지표"가 아니라 "회귀 확인용"이다.**
>
> Part 1은 "hero 이미지 7.5MB → 167KB"처럼 숫자가 곧 개선이었지만, **Part 2는 성격이 다르다.** 여기서 다루는 건 필터 변경·갱신 실패·요청 취소처럼 **cold load가 끝난 뒤 상호작용 중에 벌어지는 일**이라, 단일 URL을 새로 여는 Lighthouse 지표에는 원래 반영되지 않는다. 그래서 라운드마다 "FCP/LCP 변화 없음(오차범위 내)"이 반복되는데, **그게 실패가 아니라 예상된 결과이고 회귀가 없다는 확인**이다.
>
> 실제 라운드별 성과를 지표 관점으로 정리하면:
>
> | 라운드    | cold load 지표                                       | 실제 가치                                                  |
> | --------- | ---------------------------------------------------- | ---------------------------------------------------------- |
> | Round 0   | **CLS 0.035 → 0**                                    | 유일한 점수 개선 + "갱신 중"임을 알 수 있게 됨             |
> | Round 1   | 변화 없음                                            | 가설이 틀렸음을 확인(실패로 기록)                          |
> | Round 2   | 변화 없음(예상대로)                                  | 갱신 실패해도 보던 목록이 안 사라짐 · 요청이 실제로 취소됨 |
> | Round 3·5 | CLS 0 확인                                           | 검색 시 시프트가 없음을 근거와 함께 확정                   |
> | Round 4   | 해당 없음                                            | 검색할 때 화면이 맨 위로 안 튐                             |
> | Round 6   | 해당 없음                                            | `Failed to fetch` 원문 대신 읽을 수 있는 문구              |
> | Round 7   | FCP·CLS 영향 없음 / LCP는 **비교 불가**(캐시 미통제) | 목록 크기·형태를 미리 예고                                 |
> | Round 8   | 시도했다가 **철회**(진단 오류)                       | — (기록으로만 남김)                                        |
> | Round 9   | CLS 회귀 수정(미측정)                                | fallback 경계의 Pagination 시프트 제거                     |
> | Round 10  | 점수 변화 없음(카드는 병목이 아니었음)               | 카드가 hero 뒤로 밀림 — 방향 자체는 유효                   |
> | Round 11  | hero 전송량 −19%(크롭)                               | — (성능 목적)                                              |
> | Round 12  | **hero 구간 −316ms · SI −176ms · score 0.76→0.77**   | 안 쓰는 폰트 52KB 제거(렌더 결과 불변)                     |
>
> Round 7의 LCP는 처음에 "432ms 악화"로 적었다가 **철회했다** — 측정 URL이 라운드마다 달랐고 이미지 변환 캐시 상태가 통제되지 않아 라운드 간 비교가 성립하지 않는다(Round 7 절 참고). 과제 완료조건도 "Lighthouse 몇 점 이상"이 아니라 "여섯 화면이 녹화에서 구분되는가 / active query와 화면이 일치하는가 / 눈에 띄는 CLS가 없는가"이며, 셋 다 사용자가 화면에서 겪는 것이다.

| 항목             | 내용                                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before 코드      | 커밋 `25df6c55e49ea0550180732a84e218b0f8a36ea9` (Part 1 최종 상태, Part 2 변경 없음)                                                                  |
| 현재 코드        | Round 0–12 적용 후 (**아직 커밋 전** — 변경 파일은 각 Round 절에 명시)                                                                                |
| cold load 기준선 | Before 코드가 Part 1 최종 상태와 같아 재측정하지 않고 Part 1 기록을 그대로 가져옴(1부 첫 절)                                                          |
| 측정 프로토콜    | 사용자가 크롬 DevTools에서 직접 실행 — Lighthouse `--preset=desktop` 5회 + Performance 패널 Slow 4G 트레이스, 포트 3000 (Part 1에서 정한 규칙과 동일) |
| Before 관찰 도구 | Playwright `1.61.1`(Chromium `149.0.7827.55`) + CDP — 상태 전이 스크린샷·네트워크 로그·Layout Shift 실측용                                            |
| 자료             | [`./captures/`](./captures/) Before 관찰 · [`./lighthouse/`](./lighthouse/) Round별 리포트·캡처                                                       |

### 라운드 목록

| 라운드    | 내용                                                                   | 코드 변경 | 측정                 |
| --------- | ---------------------------------------------------------------------- | --------- | -------------------- |
| Round 0   | 갱신 중 시각 신호(pending 오버레이) + 필터 변경 CLS 해소(리키잉)       | O         | 완료                 |
| Round 1   | `layout.css` 전역 import 통합 (render-blocking 대응 — **실패로 판명**) | O         | 완료                 |
| Round 2   | 갱신 실패 시 목록 유지 + `AbortSignal` 연결                            | O         | 완료                 |
| 부수 개선 | `/products` 히어로 높이 축소                                           | O         | Round 3에 포함       |
| Round 3   | 검색 시나리오 CLS 측정                                                 | —         | 완료                 |
| Round 4   | 검색 스크롤 유지(`scroll: false`) + 미확인 2개 화면 재현               | O         | 완료                 |
| Round 5   | 검색 CLS 재측정                                                        | —         | 완료                 |
| Round 6   | 실패 문구 정리(`Failed to fetch` 노출 제거)                            | O         | 불필요(사유는 3부)   |
| Round 7   | 최초 pending에 12칸 스켈레톤 도입 (**1부 결정 번복**)                  | O         | 완료                 |
| Round 8   | 이미지 변환 캐시 TTL 연장 — **시도 후 철회**(코드 되돌림)              | —         | 철회                 |
| Round 9   | 스켈레톤에 Pagination 자리 추가 (CLS 회귀 수정)                        | O         | **⚠️ 미측정**        |
| Round 10  | 배너 우선 — 카드 이미지 `fetchPriority="low"`(홈·상품목록 공통)        | O         | 완료(점수 변화 없음) |
| Round 11  | hero 21:9 크롭 + `sizes` 정정 (전송량 −19%)                            | O         | 완료                 |
| Round 12  | 쓰이지 않는 Geist 폰트 제거 (−52KB, hero 구간 −316ms)                  | O         | 완료                 |

### 문서 구성

**1부 Before**(기준선·측정 대상·상태별 관찰·설계 결정) → **2부 개선 라운드**(Round 0–12) → **3부 정리**(처리 현황·완료조건 점검·마무리)

---

## 1부. Before — 무엇이 문제였나

## Part 1 최종 측정 결과 — Part 2의 cold load Before 기준

Part 2의 Before 코드 상태는 Part 1이 끝난 시점(Round 4까지 적용, 커밋 `c56bfddc`)과 동일하다. cold load FCP/LCP/CLS는 별도로 다시 재지 않고, Part 1에서 사용자가 직접 측정한 마지막 기록을 그대로 가져온다.

- **측정 시점 코드 상태**: 커밋 `c56bfddc`와 동일한 파일 상태를 Part 0 커밋(`61214cca`) 위에 그대로 적용(Part 1 문서와 동일한 조건)
- **측정 일시**: 2026-08-06 UTC 12:46(Performance 트레이스) / 12:44–12:48(Lighthouse)
- **포트**: `localhost:3000`

#### Lighthouse — 상품 목록 (`/products?page=2`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,388.0     | 2,155.0     | 0.000     |
| 2          | 1,388.7     | 2,383.1     | 0.000     |
| 3          | 1,389.5     | 2,896.0     | 0.000     |
| 4          | 1,388.4     | 2,155.5     | 0.000     |
| 5          | 1,389.8     | 2,894.6     | 0.000     |
| **중앙값** | **1,389.5** | **2,383.1** | **0.000** |
| 최솟값     | 1,388.0     | 2,155.0     | 0.000     |
| 최댓값     | 1,389.8     | 2,896.0     | 0.000     |

눈으로 보는 리포트: [`../week07-part1/lighthouse/round4/1. lighthouse html 문서/products/run-1.html`](<../week07-part1/lighthouse/round4/1. lighthouse html 문서/products/run-1.html>) ~ `run-5.html`

**Part 2의 cold load Before 기준은 상품 목록 LCP 중앙값 2,383.1ms, FCP 중앙값 1,389.5ms, CLS 0.000이다.** Part 1 문서에서 설명했듯 FCP는 이 측정 세션 고유의 이례적 관측치(약 1,388–1,395ms대)이고, 실제 브라우저 체감은 아래 Performance 실측(서브초 단위)이 더 정확하다.

#### Performance — 상품 목록(`/products`) filmstrip (DevTools Performance 패널, Slow 4G, 실제 DPR1)

| 시점      | 스크린샷                                                                                                                                           | 내용                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| t=12ms    | [`../week07-part1/lighthouse/round4/2. performance/products/t12ms.jpg`](<../week07-part1/lighthouse/round4/2. performance/products/t12ms.jpg>)     | `loading.tsx` fallback("불러오는 중입니다…")                              |
| t=1,265ms | [`../week07-part1/lighthouse/round4/2. performance/products/t1265ms.jpg`](<../week07-part1/lighthouse/round4/2. performance/products/t1265ms.jpg>) | **hero 완전히 로드됨**                                                    |
| t=1,655ms | [`../week07-part1/lighthouse/round4/2. performance/products/t1655ms.jpg`](<../week07-part1/lighthouse/round4/2. performance/products/t1655ms.jpg>) | 안정                                                                      |
| t=2,227ms | [`../week07-part1/lighthouse/round4/2. performance/products/t2227ms.jpg`](<../week07-part1/lighthouse/round4/2. performance/products/t2227ms.jpg>) | 재안정(중간 구간에 카드 이미지 지연 로딩으로 보이는 일시적 흔들림 있었음) |
| t=2,485ms | [`../week07-part1/lighthouse/round4/2. performance/products/t2485ms.jpg`](<../week07-part1/lighthouse/round4/2. performance/products/t2485ms.jpg>) | 안정                                                                      |

LCP(hero, 810,000px²)가 이미지 요청 시작 후 약 1,277.6ms만에 확정됨. 상세 배경·라운드별 진행 과정은 [Part 1 문서](../week07-part1/README.md#사용자-직접-측정--round-4-상태-재확인lighthouse--performance)의 "사용자 직접 측정 — Round 4 상태 재확인" 절 참고.

---

## 측정 대상 — 어떤 URL·액션을 잴 것인가

Part 2가 다루는 6가지 상태는 URL 6개가 아니라, 기준 URL `/products`(쿼리 없음)에서 발생시키는 6가지 상태 전이다. cold load FCP/LCP/CLS는 위 "Part 1 최종 측정 결과"를 그대로 Before로 쓰고, 아래는 상태 전이 하나하나를 재현할 때 쓰는 액션이다 — `/products?page=2`·`?sort=price-asc` 같은 개별 쿼리 URL은 예전 Lighthouse cold-load 참고용으로만 썼던 것이라 더는 따로 재지 않는다.

| 상태                    | 재현 액션                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 데이터 없는 최초 진입   | `scenario=slow` 켠 채로 `/products` 하드 리로드 — SSR prefetch + `keepPreviousData` 때문에 실사용 경로로는 거의 재현 안 됨(아래 "Before 상세 관찰 1)" 참고) |
| 이전 데이터가 있는 갱신 | `/products`에서 카테고리 변경(전체→캐주얼) + `scenario=slow`                                                                                                |
| 성공 + 0건              | 검색어를 결과 없는 문자열로                                                                                                                                 |
| 최초 실패               | 코드 검토로 대신 확인(아래 "Before 상세 관찰 4)" 참고) — 실사용 경로로 서버 최초 실패를 재현할 방법이 없음                                                  |
| 갱신 실패               | 정렬 변경 시 `scenario=error` 주입                                                                                                                          |
| 취소                    | 카테고리를 캐주얼→패션→홈처럼 빠르게 연속 클릭                                                                                                              |

---

## 사용자 직접 측정 — Before(개선 전) 실측 조건

위 Playwright/CDP 실측과 별개로, 사용자가 DevTools Performance 패널로 직접 측정한 Before 인터랙션 기록. "몇 ms·CLS 몇 점"을 주장하는 타이밍 증거는 사용자가 직접 재는 게 공식이라는 기준(Part 1에서 정한 측정 규칙)에 따른다. cold load FCP/LCP/CLS는 위 "Part 1 최종 측정 결과"를 그대로 쓰므로 여기서는 다시 재지 않는다.

- **측정 시점 코드 상태**: 커밋 `25df6c55e49ea0550180732a84e218b0f8a36ea9`(Part 1 최종 상태, Part 2 코드 변경 전)
- **측정 도구**: DevTools Performance 패널 트레이스
- **측정 일시**: 2026-08-06 UTC 03:16

### DevTools Performance 트레이스 — 실제 인터랙션 시퀀스

이 트레이스는 cold load가 아니라 **`/products`에서 필터·정렬·페이지를 연속으로 바꾸는 상호작용**을 녹화한 것이다(하드 리로드 없음 — `navigationStart` 0건, `SoftNavigation` 11건으로 전부 클라이언트 사이드 쿼리 변경). 트레이스 안에서 실제로 발생한 `/api/products` 요청을 시간순으로 뽑으면:

| 경과 시간   | 요청 URL                                                                         |
| ----------- | -------------------------------------------------------------------------------- |
| t=0ms       | `/api/products?category=fashion&sort=price-asc&page=1&pageSize=12`               |
| t=2,218.5ms | `/api/products?category=casual&sort=price-asc&page=1&pageSize=12`                |
| t=6,533.0ms | `/api/products?sort=latest&page=1&pageSize=12`                                   |
| t=6,533.7ms | `/api/products?sort=latest&page=2&pageSize=12`(다음 페이지 자동 prefetch로 보임) |
| t=8,247.5ms | `/api/products?sort=latest&page=3&pageSize=12`                                   |

즉 "카테고리 변경(fashion→casual) → 정렬 초기화(latest) → 페이지 이동(1→2→3)" 순서로 조작한 기록이다. 이 트레이스는 "갱신 중 로딩 신호 없음"(아래 개선 항목) 문제를 실제 인터랙션 중 화면으로 확인하는 근거로 쓴다.

---

## 사용자 관찰 기준 — 상태별 Before/After

Part 2가 다뤄야 할 6가지 상태를 Before(Part 1 종료 시점)와 현재(Round 0–2 적용 후)로 나눠 정리한다. 상태별 상세 관찰 과정은 아래 "Before 상세 관찰" 절에 그대로 남겨뒀다.

| 상태                    | 요구되는 것                                    | Before                                                                     | 현재(Round 0–2 적용 후)                                                           |
| ----------------------- | ---------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 데이터 없는 최초 진입   | 실제 목록 크기를 예상할 수 있는 pending UI     | ❌ 코드상 `null` — 단 실사용 경로로는 **재현 자체가 거의 불가능**          | ⚠️ 변경하지 않음(근거는 "결정" 절) — 실측 재현은 여전히 못 함                     |
| 이전 데이터가 있는 갱신 | 기존 목록을 비우지 않고 갱신 중임을 표시       | 목록 유지 ✅ / "갱신 중" 표시 ❌ + Pagination 마운트·언마운트              | ✅ `aria-busy` + pending 오버레이, Pagination 상시 렌더(**Round 0**)              |
| 성공 + 0건              | 조건과 0건임을 분명히 표시                     | ✅ 충족("총 0개" + "검색 결과가 없습니다.")                                | ✅ 유지(변경 없음)                                                                |
| 최초 실패               | 목록 대신 실패 이유·재시도 방법                | 코드상 충족되나 당시 방법으로는 **재현 못 함**                             | ✅ 코드 구조 유지 + 회귀 테스트로 고정(**Round 2**) — 재현 방법은 Part 4에서 찾음 |
| 갱신 실패               | 기존 목록을 유지한 채 실패·재시도 표시         | ❌ 재시도 소진 후 목록이 통째로 사라지고 에러 화면으로 대체                | ✅ 목록 유지 + 인라인 에러 배너·재시도 버튼(**Round 2**)                          |
| 취소                    | 취소된 요청이 오류로 보이거나 화면을 덮지 않음 | 화면 정합성 ✅ / `AbortSignal` 미연결로 실제로는 취소되지 않고 끝까지 완료 | ✅ 화면 정합성 유지 + Network 탭에서 `(canceled)` 실측 확인(**Round 2**)          |

---

## Before 상세 관찰 (Round 0–2 이전 기록)

아래 6개 절은 Part 1 종료 시점(Round 0–2 적용 전)에 관찰한 원본 기록이다. 각 절 끝에 지금 어떻게 됐는지를 한 줄로 덧붙였다.

### 1) 데이터 없는 최초 진입 — 처음엔 재현 불가로 봤다 (아래에서 정정)

`src/shared/ui/QueryState/index.tsx:15`

```ts
if (query.isPending) return null;
```

`isPending`일 때 아무것도 그리지 않는다 — 요구사항이 말하는 "실제 목록 크기를 예상할 수 있는 pending UI"가 없다. 코드만 보면 명백한 gap이지만, **이 상태가 실제로 화면에 뜨는지**를 확인하려고 여러 경로로 재현을 시도했다.

- `/products`의 `page.tsx`가 `await queryClient.prefetchQuery(...)`로 **document 응답 자체**를 데이터가 준비될 때까지 막고, `HydrationBoundary`로 넘겨준다 — 그래서 하드 리로드(cold load)에서는 클라이언트가 마운트되는 시점에 이미 `data`가 존재해, 시도한 경로에서는 `isPending`이 `true`가 되지 않았다.
- 필터 변경(카테고리·정렬 등)으로 쿼리 키가 바뀌어도 `placeholderData: keepPreviousData`가 있어서, 세션 안에서 한 번이라도 성공한 쿼리가 있으면 그 이후의 모든 키 변경은 이전 데이터를 placeholder로 즉시 보여준다 — `QueryState`의 주석("keepPreviousData + SSR prefetch로 isPending 분기가 구조상 거의 도달 불가능")이 실측으로도 확인된다.
- `nuqs`의 `useQueryStates`가 기본값(`shallow`)으로 동작해 필터 변경이 Next.js 서버 컴포넌트를 다시 태우지 않는다 — 즉 최초 1회를 제외하면 서버 prefetch가 다시 일어나지 않는다.

**이 시점의 결론**: 시도해본 사용자 여정(하드 리로드, 필터 변경)에서는 `isPending===true`가 노출되지 않았다. 이 gap은 "지금 당장 사용자가 겪는 문제"가 아니라, **향후 SSR prefetch 없는 라우트(예: 클라이언트 전용 모달, CSR-only 진입점)가 추가될 때를 위한 안전망 부재**로 봐야 한다.

> **현재 상태**: 의도적으로 변경하지 않음 — 근거는 아래 "결정" 절 참고.
>
> **정정(Round 4)**: 위 "재현 불가"라는 서술은 **부정확했다.** `QueryState.isPending` 분기에는 도달하지 않는 게 맞지만, 이 앱의 "데이터 없는 최초 진입" 화면은 애초에 `QueryState`가 아니라 **`products/loading.tsx`(Next.js가 라우트 세그먼트를 감싸는 Suspense fallback)가 담당**한다. `page.tsx`가 `await prefetchQuery`로 document를 막는 동안 이 fallback이 스트리밍되며, Round 0·2·3 필름스트립에도 "불러오는 중입니다…"로 이미 찍혀 있었다. 즉 **화면은 존재하고 녹화도 된다** — 미충족인 건 "실제 목록 크기를 예상할 수 있는"이라는 요구사항 쪽이다(현재는 텍스트 한 줄).
>
> **덧붙임(Part 4)**: 실패 화면들을 "재현할 수 없다"고 적은 것은 **방법을 찾지 못한 것**이지 재현이 불가능하다는 뜻은 아니었다. Part 4에서 브라우저 쪽 요청 가로채기가 안 통하는 이유(서버가 목록을 프리페치한다)를 확인하고, **API 라우트에 환경변수로만 켜지는 임시 계측을 넣어** 서버에서 실패를 만들자 갱신 실패 화면이 그대로 재현됐다. 같은 방법이면 여기 남은 시나리오들도 관찰할 수 있다.

---

### 2) 이전 데이터가 있는 갱신 — 목록은 유지되지만 "갱신 중" 표시가 전혀 없음

카테고리를 "전체" → "캐주얼"로 바꾸고 `/api/products` 응답에 `scenario=slow`(1.5초 지연)를 주입해 갱신 구간을 관찰했다.

| 시점                     | 총 개수 문구    | 그리드 항목 수 | Pagination       | 명시적 로딩 표시(spinner/aria-busy 등) |
| ------------------------ | --------------- | -------------- | ---------------- | -------------------------------------- |
| 변경 전                  | 총 30개         | 12             | 있음             | —                                      |
| 변경 중(≈0.7–1.9초 구간) | 총 30개(그대로) | 12(그대로)     | **없음(사라짐)** | **없음**                               |
| 변경 후                  | 총 6개          | 6              | 다시 나타남      | —                                      |

- `data`는 `keepPreviousData` 덕분에 그대로 유지된다(✅ 목록이 비워지지 않음).
- `ProductView.tsx:60`의 `{!productListQuery.isFetching && <Pagination .../>}` 때문에 **갱신 중에는 Pagination이 통째로 사라졌다가 응답이 오면 다시 나타난다.**
- CDP `Tracing`으로 이 전이 구간의 실제 `LayoutShift` 이벤트를 떴더니 **1건, score 0.0353**이 잡혔다 — Pagination이 없어졌다 생기는 것 자체가 측정 가능한 레이아웃 이동이다.
- 사용자 입장에서는 "필터는 바뀌었는데 목록도 총 개수도 그대로"인 상태가 1.5초(느린 케이스 기준) 동안 지속되고, 그 사이 **아무 시각적 신호도 없다** — Part 0에서 이미 지적된 "필터는 캐주얼인데 목록은 전체" gap이 Part 2 시점에도 그대로 남아있음을 재확인.

캡처: [`captures/02-update-pending-existing-list.png`](./captures/02-update-pending-existing-list.png), [`captures/layoutshift-update-existing-list.json`](./captures/layoutshift-update-existing-list.json)

> **현재 상태**: **Round 0에서 해결** — `aria-busy` + pending 오버레이로 갱신 중임을 표시하고, Pagination은 항상 렌더한다. CLS 0.035의 실제 원인은 Pagination이 아니라 카드 `key` 재사용이었고, 리키잉으로 `LayoutShift` 0건 확인.

---

### 3) 성공 + 0건 — 이미 충족

검색어를 결과 없는 문자열로 바꿔 확인했다. "총 0개"와 "검색 결과가 없습니다." 문구가 함께, 명확하게 표시된다. 로딩·에러와 혼동될 여지가 없다.

캡처: [`captures/04-zero-results.png`](./captures/04-zero-results.png)

> **현재 상태**: 이미 충족돼 있어 변경하지 않음.

---

### 4) 최초 실패 — 코드는 충족하지만 실사용 경로로 재현은 못함

처음엔 `?category=존재하지않는값`으로 SSR 단계 자체를 실패시키려 했으나, `productSearchParams`(`parseAsStringEnum(...).withDefault('all')`)가 알 수 없는 값을 **API에 도달하기 전에 `'all'`로 조용히 보정**한다는 걸 확인했다(`src/features/product-filter/model/productSearchParams.ts:14`, 주석: "파서 사전 보정으로 에러 UI 미표시 전제와 구현을 일치"). 즉 이 앱은 **URL 파라미터 자체를 원인으로 한 최초 실패**가 애초에 나지 않도록 설계돼 있다.

남은 경로는 `/api/products?scenario=error`처럼 서버가 실제로 500을 내는 경우인데, `scenario`는 페이지 URL 파라미터로 노출돼 있지 않고 서버 컴포넌트의 `prefetchQuery`는 Node 프로세스에서 직접 실행되어 Playwright의 `page.route()`로 가로챌 수 없다(브라우저가 발생시키는 요청만 가로챌 수 있음 — Part 0에서 이미 같은 제약이 확인됨). 따라서 "최초 진입부터 서버 데이터가 실패하는 상황"은 이 앱의 실제 라우트로는 인위적으로 재현할 방법이 없었다.

**코드 검토로 대신 확인**: `QueryState`는 `isPending → isError → children` 순서로 분기하고, `isError`면 `renderError(query.error)`(=`<ErrorRetry/>`)만 렌더해 목록 없이 실패 이유+재시도 버튼을 보여준다. React Query의 `dehydrate` 기본 설정은 `status:'error'`인 쿼리를 dehydrate 대상에서 제외하므로, SSR이 실패하면 클라이언트가 마운트 직후 같은 조건으로 다시 fetch를 시도하고 결국 `isError`로 귀결된다 — **구조적으로는 요구사항을 충족**한다고 판단하지만, 실측 스크린샷으로 증명하지는 못했다는 한계를 남겨둔다.

> **현재 상태**: Round 2에서 이 동작(직전 데이터가 없으면 전체 교체)을 **회귀 테스트로 고정**했고, Round 4에서 **실제 재현 방법을 찾아 캡처까지 완료**했다(아래 Round 4 절 참고).

---

### 5) 갱신 실패 — 가장 심각한 gap: 재시도가 끝나면 기존 목록이 통째로 사라짐

정렬을 "최신순" → "가격 높은순"으로 바꾸고 그 요청에만 `scenario=error`(500)를 주입해 관찰했다.

| 경과 시간                        | 그리드 항목 수 | 총 개수 문구  | 비고                                                                                                                 |
| -------------------------------- | -------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| +1.0초 (1차 실패)                | 12(유지)       | 총 30개(유지) | `keepPreviousData`가 버텨줌                                                                                          |
| +3.0초 (2차 실패, 재시도 1)      | 12(유지)       | 총 30개(유지) |                                                                                                                      |
| +5.0초 (재시도 2)                | 12(유지)       | 총 30개(유지) |                                                                                                                      |
| +8.0초 (재시도 3, 마지막)        | 12(유지)       | 총 30개(유지) |                                                                                                                      |
| 재시도 소진 후(관측상 +9초 전후) | **0**          | **없음**      | `role="alert"`(`ErrorRetry`)가 목록 자리를 완전히 대체. "상품 목록을 불러오지 못했습니다." + "다시 시도" 버튼만 남음 |

- 원인: React Query `QueryClient`에 `retry`가 커스터마이즈돼 있지 않아 **기본값(3회, 지수 백오프 1s/2s/4s)** 이 그대로 적용된다. 재시도가 진행되는 동안은 `status`가 아직 `'pending'`(정확히는 `isFetching:true`, 이전 성공 데이터를 placeholder로 유지)이라 `keepPreviousData`가 살아있지만, 3회를 모두 실패하면 `status`가 `'error'`로 확정되고 이 순간 `data`가 `undefined`가 되어 `QueryState`의 `if (query.isError) return renderError(...)` 분기가 **이전 목록 없이 통째로 갈아친다.**
- "기존 목록을 유지한 채 갱신 실패와 다시 시도할 방법을 보여줘야 해요"라는 요구사항을 직접적으로 위반하는 지점.
- 흥미로운 부수 관찰: 이 전이 구간을 CDP `Tracing`으로 재보니 `LayoutShift` 이벤트가 **0건**으로 잡혔다. 스크린샷상으로는 12개 카드 그리드가 통째로 두 줄짜리 에러 문구로 바뀌는 극적인 변화인데도 점수가 0인 이유는, 기본 스크롤 위치(맨 위)에서는 히어로 이미지가 뷰포트(940px) 대부분을 차지해 **그리드 영역 자체가 화면 밖(below the fold)에 있었기 때문**으로 보인다 — Layout Instability API는 뷰포트 안에서 실제로 움직이는 요소만 점수화한다. 즉 **CLS 수치만 보면 이 회귀가 전혀 안 보이지만, 실제로는 심각한 콘텐츠 손실**이다. CLS 점수를 개선 여부 판단 기준으로 쓰면 이 문제를 놓친다는 것 자체가 중요한 발견이다.

캡처: [`captures/05-update-failure-list-wiped.png`](./captures/05-update-failure-list-wiped.png), [`captures/layoutshift-update-failure-wipe.json`](./captures/layoutshift-update-failure-wipe.json)

> **현재 상태**: **Round 2에서 해결** — 직전 성공 데이터가 있으면 목록을 그대로 두고 인라인 에러 배너+재시도 버튼만 추가한다.

---

### 6) 취소된 요청 관찰 — Part 0과 동일하게 여전히 "취소되지 않음"

카테고리를 캐주얼→패션→홈으로 200ms 간격 연속 변경(각 요청에 `scenario=slow` 주입)했다.

```json
[
  { "request": "category=casual", "t": 0 },
  { "request": "category=fashion", "t": +211 },
  { "request": "category=home", "t": +422 },
  { "response": "category=casual", "status": 200, "t": +1506 },
  { "response": "category=fashion", "status": 200, "t": +1719 },
  { "response": "category=home", "status": 200, "t": +1928 }
]
```

- **최종 상태**: URL `?category=home`, `<select>` 값 `home`, "총 6개" — 셋 다 마지막 선택과 정확히 일치. 먼저 보낸 `casual`·`fashion` 응답이 나중에 와도 화면을 덮지 않았다.
- **왜 안전한가**: query key(`['products', {category, ...}]`)가 다르면 화면은 "현재 URL의 active query"에 해당하는 key만 구독한다 — Part 0에서 확인된 것과 동일한 메커니즘.
- **취소는 실제로 안 됨**: `fetchProductList`(`src/entities/product/api/productsService.ts`) → `apiResponseResult`(`src/shared/api/response.ts`) 어디에도 `AbortSignal`이 전달되지 않는다. `queryFn`이 받는 `{ signal }` 컨텍스트를 쓰지 않으므로, `casual`·`fashion` 요청은 화면에서 안 쓰여도 끝까지 실행되고 응답도 다 받는다(네트워크 로그의 3개 응답이 전부 200으로 도착) — 화면 정합성엔 문제없지만 **불필요한 API 호출이 항상 낭비된다.**

캡처: [`captures/06-rapid-changes-final-state.png`](./captures/06-rapid-changes-final-state.png), [`captures/network-log-rapid-changes.json`](./captures/network-log-rapid-changes.json)

> **현재 상태**: **Round 2에서 해결** — `queryFn`의 `{ signal }`을 `fetch`까지 전달해, Network 탭에서 이전 요청이 `(canceled)`로 실제 중단되는 것을 확인했다.

---

## `isPending` vs `isFetching` — 각각 어떤 화면을 맡는가

|                         | 의미                                                                       | Before                                                                    | 현재(Round 0–2 적용 후)                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `isPending`             | 이 쿼리 키로 **한 번도 성공한 데이터가 없는** 상태(fetch 진행 여부와 무관) | `QueryState`가 `null` 반환 — 아무것도 안 그림                             | 그대로 유지. SSR prefetch + `keepPreviousData` 때문에 실사용 경로에서는 도달하지 않는 분기라 의도적으로 손대지 않았다(바로 아래 "결정" 절) |
| `isFetching`            | 지금 **네트워크 요청이 진행 중**인지(이전 데이터 유무와 무관)              | 오직 **Pagination을 숨기는 데만** 쓰임 — 로딩 신호가 아니라 CLS 유발 요인 | **"갱신 중" 화면을 맡는다** — `ProductListSection`에 `isUpdating`으로 전달돼 `aria-busy` + pending 오버레이를 띄운다(Round 0)              |
| `isError` + 직전 데이터 | 갱신에 최종 실패했지만 직전 성공 데이터는 남아있는 상태                    | 구분 없이 무조건 전체 교체                                                | **"갱신 실패" 화면을 맡는다** — 목록은 유지하고 인라인 에러 배너만 추가(Round 2)                                                           |

Before에는 두 플래그 모두 담당 화면과 어긋나 있었다(`isPending`은 도달 불가, `isFetching`은 Pagination 숨김이라는 부수효과에만 쓰임). 지금은 `isFetching`이 "갱신 중", `isError`+직전 데이터가 "갱신 실패"를 각각 맡고, `isPending`만 의도적으로 비워둔 상태다.

---

## 결정 — 최초 pending에 스켈레톤을 쓰지 않기로 함

처음엔 "`QueryState`의 `isPending → null` 분기에 최소한의 스켈레톤을 남겨두면 안전망이 된다"고 제안했는데, 다시 논의하면서 그 제안을 접었다.

- **스켈레톤은 임시방편이다**: 스켈레톤·Suspense fallback은 결국 사용자가 반드시 보게 되는 화면이다. "언젠가 실제 콘텐츠로 바뀐다"는 전제로 정당화되지만, 그 사이 사용자는 빈 틀만 보고 기다린다 — 근본적인 지연을 안 보이게 가리는 것이지 지연 자체를 줄이는 게 아니다.
- **진짜 타협 지점은 캐시다**: 이 화면의 본질적인 문제는 "데이터가 없어서 뭘 보여줄지 모르는 상태"가 아니라 "API 응답이 느리다"는 것이다. 그렇다면 풀어야 할 건 CDN·API 앞단의 짧은 데이터 캐시(예: `stale-while-revalidate`류 정책)로 응답 자체를 빠르게 만드는 것이지, 느린 응답을 스켈레톤으로 감싸는 게 아니다.
- **콘텐츠의 우선순위로 구분한다**: Hero·상품명·가격처럼 사용자가 이 페이지에 온 이유(주요 데이터)는 가능한 한 실제 콘텐츠를 빨리 보여줘야 한다 — 이 자리를 스켈레톤으로 채우는 건 오히려 핵심 콘텐츠 표시를 늦추는 방향으로 오해될 수 있다. 스켈레톤·Suspense는 늦게 나와도 괜찮은 영역(예: 리뷰 개수, 추천 상품처럼 부가적인 섹션)에만 적용하는 게 맞다.

이 기준으로 보면 상품 목록(Hero 다음으로 사용자가 온 목적 그 자체)에 스켈레톤을 놓는 건 이 페이지의 우선순위 판단과 맞지 않는다. 그래서 "최초 pending" 항목은 스켈레톤 안전망 없이 그대로 "변경 불필요"로 남기고, 대신 원인 자체(API 응답 지연)를 다룰 필요가 생기면 그때는 캐시 정책 쪽을 먼저 검토한다.

> **⚠️ 이 결정은 이후 번복됐다(Round 7).** 위 세 근거 중 "스켈레톤이 핵심 콘텐츠 표시를 늦춘다"가 사실이 아니었고, 레이아웃이 일치하는 스켈레톤은 오히려 CLS에 도움이 된다는 점이 확인됐다. 번복 근거와 실제 적용 결과는 2부 "Round 7" 절에 있다 — 이 절은 당시 판단 기록으로 그대로 남긴다.

---

## 2부. 개선 라운드

## Round 0 — 갱신 중 시각 신호 + 필터 변경 CLS 해소

1부에서 정리한 개선 항목 중 2·3번(우선순위 High·Medium)을 Round 0으로 묶는다. Part 1과 같은 방식으로, 이후 개선은 Round 단위로 문서화한다(전체 항목의 처리 현황은 3부 참고).

- **원인 1(High)**: `isFetching`을 Pagination 숨기는 데만 썼고, "갱신 중"임을 알리는 신호가 화면 어디에도 없었다.
- **원인 2(Medium)**: 필터 변경으로 겹치는 상품(같은 `product.id`)이 다른 그리드 슬롯으로 옮겨갈 때, `ProductCard`가 `key={product.id}`를 써서 React가 DOM 노드를 "이동"으로 재사용 → 실제 `LayoutShift`(score 0.035) 발생.
- **변경**: `ProductListSection`에 `isUpdating` prop 추가 → `aria-busy` + 절대 위치 pending 오버레이(`position: absolute`+`z-index`, "목록 갱신 중…" 문구, 레이아웃 크기 변화 없음). 처음엔 `opacity: 0.6`로 전체를 흐릿하게 하는 방식이었으나 신호가 은근해서 별도 레이어 방식으로 재수정했다. `ProductListSection`을 `key={productListQuery.dataUpdatedAt}`로 리키잉해 데이터가 바뀔 때마다 카드 전체를 새로 마운트시켜, key 기반 "이동"(=LayoutShift)을 원천 차단. Pagination도 `isFetching`일 때 숨기던 걸 없애 항상 렌더링하도록 바꿨다.
- **변경 파일**: `src/widgets/product-list-section/ui/ProductListSection.tsx`, `src/app/products/_ui/ProductView.tsx`, `src/app/layout.css`(아직 커밋 전)

### 사용자 직접 측정 — Round 0 상태 확인(Lighthouse + Performance)

Part 1에서 정한 프로토콜(Slow 4G·실제 DPR1·포트 3000, Lighthouse는 `--preset=desktop`)과 동일하게, 사용자가 위 변경이 반영된 현재 코드 상태로 직접 측정했다. Part 2는 `/products`만 다루므로(위 "측정 대상" 절 참고) 홈은 재지 않는다.

- **측정 시점 코드 상태**: 현재 워킹트리(`ProductListSection.tsx` pending 오버레이 버전 + `key={dataUpdatedAt}` 적용 후, 아직 커밋 전)
- **측정 일시**: 2026-08-06 UTC 14:00–14:02(Lighthouse) / 14:03(Performance 트레이스)
- **포트**: `localhost:3000`

#### Lighthouse — 상품 목록 (`/products`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,388.7     | 2,175.8     | 0.000     |
| 2          | 1,389.7     | 1,389.7     | 0.000     |
| 3          | 1,389.6     | 1,401.6     | 0.000     |
| 4          | 1,391.1     | 2,158.9     | 0.000     |
| 5          | 1,388.5     | 2,382.8     | 0.000     |
| **중앙값** | **1,389.6** | **2,158.9** | **0.000** |
| 최솟값     | 1,388.5     | 1,389.7     | 0.000     |
| 최댓값     | 1,391.1     | 2,382.8     | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round0/1. lighthouse html 문서/products/run-1.html`](<./lighthouse/round0/1. lighthouse html 문서/products/run-1.html>) ~ `run-5.html`

Part 1 최종(Round 4) 상품목록 LCP 중앙값(2,383.1ms)과 같은 자릿수 — Round 0의 변경(오버레이·리키잉)은 필터 인터랙션 도중의 신호·CLS를 다룬 것이라, cold load Lighthouse 지표에는 원래도 반영되지 않는다(예상된 결과).

#### DevTools Performance 트레이스 — 실제 인터랙션 시퀀스

이 트레이스는 cold load가 아니라 `/products`에서 페이지 이동·카테고리 변경을 연속으로 조작한 것이다(`SoftNavigation` 4건, `navigationStart` 없음). 트레이스에서 실제로 발생한 `/api/products` 요청:

| 경과 시간   | 요청 URL                                                                     |
| ----------- | ---------------------------------------------------------------------------- |
| t=2,176.7ms | `/api/products?sort=latest&page=3&pageSize=12`(페이지 이동)                  |
| t=8,980.1ms | `/api/products?category=goods&sort=latest&page=1&pageSize=12`(카테고리 변경) |

`scenario=slow`를 켜지 않은 일반 조작이라 카테고리 변경 응답이 매우 빨라(로컬 API 기준), pending 오버레이가 뜨는 구간이 스크린샷 간격(≈8–9ms)보다 짧게 지나갔다 — 오버레이 자체를 필름스트립으로 잡으려면 `scenario=slow` 조건에서 다시 녹화해야 한다.

| 시점        | score    | hadRecentInput | 이동한 노드                                                        |
| ----------- | -------- | -------------- | ------------------------------------------------------------------ |
| t=2,178.5ms | 0.000174 | `true`         | `week05-pagination`, `(286,1312)→(286,1300)`(페이지 클릭 직후)     |
| t=4,829.3ms | 0.013907 | `true`         | `week05-pagination`, `(0,0,0,0)→(286,1300)`(다음 페이지 클릭 직후) |

**카테고리 변경(t=8,980.1ms) 구간에서는 `LayoutShift` 이벤트가 0건이다** — Round 0 이전(수정 전)에는 바로 이 시나리오에서 score 0.035가 잡혔었는데, `key={dataUpdatedAt}` 리키잉 이후로는 이 세션에서도 재현되지 않는다(실제 사용자 인터랙션 기준 재확인 완료). 위 두 Pagination 관련 시프트는 이번에도 `hadRecentInput: true`라 공식 CLS에서 제외된다 — 즉 이 트레이스 전체의 실질 CLS 기여는 0.

### Lighthouse에서 발견된 요소 — 구현 변경으로 해결 가능한 것

위 5회 리포트(run-1 기준) 오디트를 훑어보다가, Round 0 변경과 무관하게 계속 존재해온 항목들을 발견했다. 코드 변경으로 해결 가능한지 나눠서 기록한다.

**해결 가능성 있음:**

- **Render-blocking requests(`render-blocking-insight`) — 추정 640ms 절감(FCP)**: 두 CSS 파일이 렌더를 막고 있다.
  - `_next/static/chunks/34u-34zjm7nft.css`(2.6KB) — `next/font/google`(Geist)가 생성하는 `@font-face` 전용 CSS, 614ms
  - `_next/static/chunks/3nzugg62b4gre.css`(1.5KB) — 이 프로젝트의 `layout.css`(`.week05-*` 클래스), 654ms
  - `network-dependency-tree-insight`에서도 같은 두 파일이 "가장 긴 체인"(1,246ms)으로 잡힌다. 이 세션 내내 관측됐던 "FCP가 항상 1,388ms대"인 이례적 현상의 상당 부분이 여기서 설명될 가능성이 있다 — 작은 파일 2개가 각자 blocking 상태로 순차적/병렬로 로드되는데, 이 throttled 환경에서는 요청당 RTT 비용이 크기 때문이다.
  - **시도해볼 것**: `layout.css`를 `HomeView.tsx`/`ProductView.tsx`에서 각각 import하는 대신 루트 레이아웃(`src/app/layout.tsx`)의 `globals.css`에 합쳐서 blocking 요청 수를 2개→1개로 줄여보고 재측정. 폰트 쪽은 `next/font`가 자동 최적화하는 영역이라 직접 손댈 여지는 적지만, 실제로 필요한 font-weight 범위(`Geist`가 기본으로 100–900 가변 폭 전체를 로드 중)를 줄일 수 있는지 확인해볼 만하다.

**프레임워크 레벨이라 컴포넌트 코드로는 해결 안 됨(참고만):**

- **Legacy JavaScript(`legacy-javascript-insight`) — 13KB**: `Array.prototype.at/flat/flatMap`, `Object.fromEntries/hasOwn` 등에 대한 폴리필. 해당 청크(`2uw6_lcn_5z8c.js`)를 직접 열어보니 이 프로젝트 코드나 특정 라이브러리가 아니라 **Next.js/Turbopack 자체의 런타임 부트스트랩 코드**였다 — 이 프로젝트의 `browserslist`나 소스 코드를 바꿔도 영향을 주지 못한다.
- **`bf-cache` 복원 실패 — 2건**: 둘 다 `Cache-Control: no-store` 때문인데, Lighthouse 자체가 이 두 사유를 "Not actionable"로 분류한다. 상품 목록처럼 자주 바뀌는 데이터를 캐싱 정책 없이 `no-store`로 두는 건 의도된 선택일 가능성이 높아, 굳이 손대지 않는다.
- **Unused JavaScript — 26KB**: 위 legacy JS 청크와 같은 파일(`2uw6_lcn_5z8c.js`)에서 대부분 나온다 — 폴리필 코드가 모던 브라우저에서 "안 쓰이는" 코드로 잡히는 것과 같은 원인.

---

## Round 1 — `layout.css` 전역 import 통합 (render-blocking 대응 시도)

위 "시도해볼 것"을 실제로 적용해봤다.

- **변경**: `layout.css`를 `HomeView.tsx`/`ProductView.tsx`에서 각각 import하던 걸 지우고, 루트 레이아웃(`src/app/layout.tsx`)에서 `globals.css` 바로 다음에 한 번만 import하도록 옮겼다.
- **빌드로 확인한 구조 변화**: `/products` 응답의 stylesheet가 예전엔 Geist 폰트 CSS + `layout.css` 두 개로 따로 잡혔는데, 이제는 이 둘이 같은 파일(`3q5owqku7wp0z.css`)로 합쳐진 걸 빌드 결과물로 확인했다.
- **변경 파일**: `src/app/layout.tsx`, `src/app/products/_ui/ProductView.tsx`, `src/app/(home)/_ui/HomeView.tsx`(아직 커밋 전)

### 사용자 직접 측정 — Round 1 상태 확인(Lighthouse + Performance)

- **측정 시점 코드 상태**: 위 `layout.css` 통합 반영 후, 아직 커밋 전
- **측정 일시**: 2026-08-06 UTC 14:19–14:20(Lighthouse) / 14:21(Performance 트레이스)
- **포트**: `localhost:3000`

#### Lighthouse — 상품 목록 (`/products?category=fashion`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,390.3     | 2,097.9     | 0.000     |
| 2          | 1,388.6     | 2,095.8     | 0.000     |
| 3          | 1,387.9     | 2,207.9     | 0.000     |
| 4          | 1,388.7     | 2,095.9     | 0.000     |
| 5          | 1,389.5     | 2,384.3     | 0.000     |
| **중앙값** | **1,388.7** | **2,097.9** | **0.000** |
| 최솟값     | 1,387.9     | 2,095.8     | 0.000     |
| 최댓값     | 1,390.3     | 2,384.3     | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round1/1. lighthouse html 문서/products/run-1.html`](<./lighthouse/round1/1. lighthouse html 문서/products/run-1.html>) ~ `run-5.html`

**Round 0(FCP 1,389.6ms/LCP 2,158.9ms) 대비 사실상 변화 없다(오차범위 내).** `render-blocking-insight`를 다시 확인해보니 여전히 "추정 640ms 절감"이 그대로 뜨고, 여전히 파일 2개가 잡힌다 — 다만 그 2개의 정체가 바뀌었다:

- `3q5owqku7wp0z.css`(3.2KB, 615ms) — 이번에 합쳐진 폰트+`layout.css` 번들
- `3f4ndc68xsdhk.css`(1.2KB, 655ms) — `PageHeading.module.css`(CSS Module) — Round 0 리포트에는 잡히지 않았던 파일이다.

즉 이 페이지엔 최소 "전역 번들 1개 + 컴포넌트 스코프 CSS Module 1개"로 render-blocking 요청이 항상 2개 생기는 구조였다 — `layout.css`를 합쳐서 하나 줄였더니, 예전엔 안 잡혔던(혹은 그 그림자에 가려 있던) `PageHeading.module.css`가 그 자리를 대신 채웠다. **솔직한 결론: 이 변경은 중복 import 정리로는 의미가 있지만, Lighthouse가 지적한 render-blocking 문제 자체는 해결하지 못했다** — FCP 실측도 변화 없음으로 확인된다. CSS Module의 컴포넌트 스코프 이점을 포기하고 전부 한 파일로 합치지 않는 이상, 이 구조에서 blocking 요청을 1개로 줄이긴 어려워 보인다.

#### DevTools Performance 트레이스

이번 트레이스는 정렬 변경·페이지 이동(카테고리 변경 없음)을 담고 있다. `LayoutShift` 1건(t=10,208.9ms, score 0.0008, `hadRecentInput: true`) — 페이지 클릭 직후라 공식 CLS엔 안 잡힌다. Round 1은 CSS만 바꾼 변경이라 CLS 관련 회귀가 없는 게 정상이고, 실측도 그 예상과 일치한다.

---

## Round 2 — 갱신 실패 시 목록 유지(1번) + AbortSignal 연결(4번)

"개선할 요소 리스트업"의 1번(Critical)·4번(Low)을 적용했다.

- **1번 변경**: `QueryState`가 마지막 성공 데이터를 기억해두고(렌더 중 조건부 `setState` — `ref` 대신 이 패턴을 쓴 이유는 렌더 중 `ref` 읽기/쓰기를 금지하는 `react-hooks/refs` 린트 규칙 때문), 갱신 실패 시 그 데이터가 있으면 목록은 그대로 두고 인라인 에러 배너("목록을 갱신하지 못했습니다. 이전 목록을 표시하고 있어요." + 다시 시도)를 추가로 보여준다. 직전 데이터가 아예 없는 최초 실패는 기존처럼 전체 교체.
- **4번 변경**: `productsQueryOptions`의 `queryFn`이 받는 `{ signal }`을 `fetchProductList` → `apiResponseResult` → `fetch`까지 그대로 전달해, 쿼리 키가 바뀌면 이전 요청이 React Query에 의해 실제로 취소되도록 함.
- **변경 파일**: `src/shared/ui/QueryState/index.tsx`, `src/app/products/_ui/ProductView.tsx`, `src/shared/api/response.ts`, `src/entities/product/api/productsService.ts`, `src/entities/product/api/productsQueryOptions.ts`(아직 커밋 전)
- **회귀 테스트 추가**: `src/shared/ui/QueryState/QueryState.test.tsx` — (a) 직전 데이터 없이 최초 실패하면 전체 교체, (b) 직전 데이터가 있으면 목록 유지 + 인라인 에러 추가, (c) `renderInlineError`를 안 넘기면 기존 동작(항상 전체 교체) 유지, 3가지를 커버.

### 사용자 직접 측정 — Round 2 상태 확인

#### 4번(AbortSignal) — Network 패널 직접 확인

사용자가 검색창에 빠르게 연속 입력해(각 키 입력마다 쿼리 키가 바뀜) Network 패널로 직접 확인한 결과:

![AbortSignal 적용 후 Network 패널 — 이전 검색어 요청이 (canceled)로 표시됨](<./lighthouse/round2/3. captures/network-abortsignal-canceled.png>)

`products?q=%EC%B9%B5&category=home&sort=latest&page=1&pageSize=12` 요청이 **`(canceled)`**로 표시되고 전송량도 `0.0 kB`다 — 다음 키 입력으로 쿼리 키가 바뀌자 이전 요청이 실제로 중단됐다. Part 0부터 계속 "화면엔 문제없지만 취소되지 않고 끝까지 완료된다"고 기록해온 것과 달리, 이제는 브라우저 Network 탭에서 취소가 직접 관측된다.

#### Lighthouse — 상품 목록 (`/products?page=2`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,387.4     | 2,227.4     | 0.000     |
| 2          | 1,389.8     | 2,229.8     | 0.000     |
| 3          | 1,389.2     | 2,229.2     | 0.000     |
| 4          | 1,389.4     | 2,096.8     | 0.000     |
| 5          | 1,388.9     | 2,383.3     | 0.000     |
| **중앙값** | **1,389.2** | **2,229.2** | **0.000** |
| 최솟값     | 1,387.4     | 2,096.8     | 0.000     |
| 최댓값     | 1,389.8     | 2,383.3     | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round2/1. lighthouse html 문서/products/run-1.html`](<./lighthouse/round2/1. lighthouse html 문서/products/run-1.html>) ~ `run-5.html`

**Round 1(FCP 1,388.7ms/LCP 2,097.9ms) 대비 사실상 변화 없다(오차범위 내).** 예상된 결과다 — 1·4번은 둘 다 갱신 실패·취소라는 인터랙션 중 동작을 다룬 변경이라, cold load Lighthouse 지표에는 원래도 반영되지 않는다. `render-blocking-insight`도 Round 1과 동일하게 "추정 640ms 절감"(같은 두 파일)으로 변화 없음 — CSS를 건드리지 않은 변경이니 당연하다.

Performance 인터랙션 트레이스는 Round 1에서 쓴 것과 동일한 조건(정렬·페이지 이동)이라 이번엔 새로 녹화하지 않았다 — 1·4번은 이 시나리오의 CLS나 타이밍에 영향을 주는 변경이 아니다.

---

## 부수 개선 — `/products` 히어로 높이 축소 (Round 2 이후, Round 3 측정 전)

측정과 별개로, 실사용 중 발견한 체감 문제 하나를 같이 고쳤다.

- **관찰**: 검색창에 입력할 때마다 `useProductListParams`의 `useQueryStates(..., { scroll: true })` 때문에 페이지가 맨 위로 스크롤된다. 히어로가 16:9(1200px 폭 기준 675px)로 크다 보니 그 이동 폭이 커서, 검색할 때마다 화면이 크게 튀는 느낌을 준다.
- **결정**: 스크롤 동작을 건드리는 대신 **히어로 높이를 줄여 이동 폭 자체를 줄이는 방향**을 직접 선택했다.
- **변경**: `PageHeading`에 `compact` prop을 추가하고 `/products`에서만 켠다 — 히어로 비율을 16:9 → **21:9**(675px → 약 571px, 약 104px 축소)로 줄여 스크롤 이동 폭 자체를 줄였다. 모바일(≤640px)에서는 4:5 → 3:2로 축소. 스크롤 동작 자체(`scroll: true`)는 그대로 뒀다 — 검색 결과를 목록 맨 위부터 보여주는 건 의도된 동작이라고 판단했다.
- **변경 파일**: `src/shared/ui/PageHeading/PageHeading.tsx`, `src/shared/ui/PageHeading/PageHeading.module.css`, `src/app/products/_ui/ProductView.tsx`, 회귀 테스트 `PageHeading.test.tsx`(compact 클래스 적용 확인)

---

## Round 3 — 검색 시나리오 CLS 측정 (변경 없음, 측정만)

Round 0–2 이후 남아 있던 유일한 미측정 항목(검색 시 CLS)을 실제로 재봤다. **코드 변경은 하지 않았고, 가설을 검증하는 측정만 수행했다.**

### 세운 가설

- **결과 개수가 크게 변한다**: 그리드는 5열이고 카드 한 줄 높이가 400px + gap 20px = 420px다. 검색으로 12개 → 몇 개로 줄면 그리드가 몇 줄씩 줄어들고, **그 아래 Pagination이 그만큼 위로 올라온다.** 카드 자체는 `key={dataUpdatedAt}` 리키잉으로 "새로 삽입"이라 채점 대상이 아니지만, **Pagination은 리마운트되지 않는 형제 요소라 "이동"으로 잡힐 수 있다.**
- **히어로 축소가 노출을 늘렸을 수 있다**: 5번 절에서 "그리드가 화면 밖(below the fold)이라 CLS가 0으로 잡혔다"고 관찰했는데, 히어로를 약 104px 줄였으니 그만큼 그리드·Pagination이 뷰포트 안으로 더 들어온다 — 예전엔 안 잡히던 시프트가 이제 잡힐 수 있다.

### 측정 조건

- **측정 시점 코드 상태**: Round 0–2 + 히어로 compact 적용 후(아직 커밋 전)
- **측정 도구**: DevTools Performance 패널, **Slow 4G**, `hostDPR: 1`, 포트 3000(프로덕션 빌드)
- **측정 일시**: 2026-08-06 UTC 15:00
- **조작**: `/products`에서 검색창에 `스탠리` 입력(총 30개 → 총 4개, 카드 3줄 → 1줄로 2줄 감소)

### 결과 — `LayoutShift` **0건**

트레이스 전체에서 `LayoutShift` 이벤트가 **하나도 잡히지 않았다.** 검색 자체는 정상 동작했다(`/api/products?q=스탠리&sort=latest&page=1&pageSize=12` 요청 1건 — 디바운스가 걸려 10번의 `SoftNavigation` 중 실제 API 호출은 1회뿐).

| 시점       | 스크린샷                                                                                                                               | 내용                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| t=5,535ms  | [`t5535ms-검색직후-맨위로스크롤.jpg`](<./lighthouse/round3/2. performance/products/t5535ms-검색직후-맨위로스크롤.jpg>)                 | 검색어 입력 직후 — 페이지가 맨 위로 스크롤됨, 히어로가 뷰포트 대부분 점유 |
| t=6,727ms  | [`t6727ms-결과교체후-그리드는화면밖.jpg`](<./lighthouse/round3/2. performance/products/t6727ms-결과교체후-그리드는화면밖.jpg>)         | 결과 교체 완료 — **그리드·Pagination은 여전히 화면 밖**                   |
| t=15,016ms | [`t15016ms-사용자가스크롤내려확인-총4개.jpg`](<./lighthouse/round3/2. performance/products/t15016ms-사용자가스크롤내려확인-총4개.jpg>) | 사용자가 직접 스크롤을 내려 확인 — "총 4개", 카드 1줄, Pagination `1/1`   |

### 해석 — "시프트가 없다"가 아니라 "채점 구간 밖에서 일어난다"

**가설의 전제(그리드가 줄어든다)는 맞았지만, 결론(CLS에 잡힌다)은 틀렸다.** 이유는 검색 플로우 자체에 있다:

`useProductListParams`가 `useQueryStates(..., { scroll: true })`로 동작하기 때문에, 검색어를 입력하면 **결과가 바뀌기 전에 페이지가 먼저 맨 위로 스크롤된다.** 위 t=5,535ms·t=6,727ms 스크린샷이 그 증거로, 결과가 12개에서 4개로 교체되는 순간 그리드와 Pagination은 이미 뷰포트 밖에 있었다. Layout Instability API는 **뷰포트 안에서 실제로 움직인 요소만** 점수화하므로, 그리드가 2줄 줄어들고 Pagination이 840px 올라갔더라도 채점되지 않는다.

즉 5번 절에서 관찰했던 것과 같은 구조가 검색에서도 반복된다 — 다만 그때는 "히어로가 커서 우연히 가려진" 것이었고, 지금은 **`scroll: true`가 매 검색마다 뷰포트를 히어로 위치로 되돌리기 때문에 구조적으로 항상 가려진다**는 차이가 있다. 히어로를 104px 줄인 것도 이 결론을 바꾸지 못했다.

### 결론 — 대응하지 않는다

- 공식 CLS 기준으로 **측정값 0**, 실사용 경로에서 사용자가 시프트를 볼 수 없는 위치라 **고칠 문제가 없다.**
- 대응책으로 검토했던 "그리드에 `min-height` 예약"은 채택하지 않는다. 마지막 페이지나 결과가 적은 검색에서 빈 여백이 남는 트레이드오프만 생기고, 정작 막으려던 시프트는 애초에 화면 밖에서 일어나기 때문이다 — **관측되지 않는 문제에 코드를 더하지 않는다**는 과제 지침("이미 조건을 만족하면 코드를 더 만들지 말고, 개입하지 않은 근거를 남겨도 돼요")에 해당한다.
- 다만 한계는 남긴다: 이 결론은 **`scroll: true`가 유지되는 한**에서만 성립한다. 나중에 검색 시 스크롤을 보존하는 방향으로 UX를 바꾼다면, 그 순간 이 시프트가 뷰포트 안으로 들어와 CLS에 잡히기 시작하므로 재측정이 필요하다.

---

## Round 4 — 검색 스크롤 유지 + 미확인 2개 화면 재현

Round 3에서 남긴 두 가지 숙제(검색 시 맨 위로 튀는 UX, 녹화로 못 보여준 2개 화면)를 함께 처리했다.

### 4-1) 검색 시 스크롤 유지 (`scroll: false`)

- **관찰**: 검색창은 히어로 아래에 있는데, `useQueryStates(..., { scroll: true })`가 모든 파라미터 변경에 적용돼 **디바운스(300ms)마다 페이지가 맨 위로 튄다.** 타이핑 중 검색창 자체가 시야에서 밀려나 체감이 나쁘다.
- **결정**: 검색 중 화면이 맨 위로 튀는 체감이 나쁘다고 직접 판단해, **검색에서는 스크롤을 유지하기로 결정**했다.
- **변경**: `setQuery`에만 `scroll: false`를 추가했다(`useProductListParams.ts`). `setPage`는 새 페이지를 처음부터 보는 게 자연스러워 `scroll: true`를 유지했고, `setCategory`/`setSort`도 그대로 뒀다.
- **⚠️ Round 3 결론에 대한 영향**: Round 3에서 "검색 CLS 0건"이 나온 이유가 바로 `scroll: true`가 그리드를 화면 밖으로 밀어냈기 때문이었다. 이제 스크롤이 유지되므로 **그리드가 줄어드는 게 뷰포트 안에서 일어나고, Pagination 이동이 공식 CLS에 잡히기 시작할 수 있다.** Round 3의 "대응하지 않는다"는 결론은 이 변경으로 **무효가 됐고, 재측정이 필요하다**(아래 "다음 측정" 참고).

### 4-2) 최초 pending 화면 — 재현·캡처 완료

`products/loading.tsx`가 담당하는 화면이라, 서버 prefetch가 도는 동안 스트리밍되는 구간을 잡으면 된다. 회선을 아주 느리게(6KB/s) 낮춰 이 구간을 넓힌 뒤 캡처했다.

![최초 pending — loading.tsx fallback](<./lighthouse/round4/3. captures/state-initial-pending-loading-fallback.png>)

- 화면에는 **"불러오는 중입니다…" 텍스트 한 줄**만 있다. Header·히어로·필터도 아직 없다.
- **요구사항 대비 판정**: "pending 화면이 있는가"는 ✅, "실제 목록 크기를 예상할 수 있는가"는 ❌. 목록이 12개짜리 그리드라는 정보를 전혀 주지 못한다.
- 다만 이 gap을 스켈레톤으로 메우지 않기로 한 결정은 그대로 유지한다(1부 "결정" 절) — 판단이 바뀐 게 아니라, **"재현 불가"라던 서술이 틀렸음을 바로잡고 실제 화면을 근거로 남기는 것**이 이번 작업의 목적이다.

### 4-3) 최초 실패 화면 — 재현·캡처 완료

`resolveUrl`이 **서버에서만** `NEXT_PUBLIC_SITE_URL`을 쓴다는 점을 이용했다. 죽은 포트를 가리키게 하면 서버 prefetch가 실패하고, `dehydrate`가 에러 쿼리를 제외하므로 클라이언트는 데이터 없이 마운트된다. 여기에 클라이언트 재요청까지 막으면 "직전 데이터가 없는 최초 실패"가 만들어진다.

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:9999 pnpm start   # 서버 prefetch 실패
# + 브라우저에서 */api/products* 요청 차단(DevTools의 Block request URL 또는 Playwright route.abort)
```

![최초 실패 — 목록 없이 전체 교체](<./lighthouse/round4/3. captures/state-initial-failure-full-replace.png>)

- 상품 카드 **0개**, 목록 자리에 실패 문구 + "다시 시도" 버튼만 남는다 — Round 2에서 넣은 인라인 배너(목록 유지)가 아니라 **원래의 전체 교체 경로**가 맞게 동작함이 확인된다. 두 경로가 실제로 구분된다는 근거이기도 하다.
- **새로 발견한 문제**: 화면에 노출되는 문구가 `Failed to fetch`다. `apiResponseResult`가 `res.ok`가 아닐 때만 서버 메시지를 꺼내 쓰고, **네트워크 자체가 실패하면 브라우저 원문 에러가 그대로 사용자에게 보인다.** 요구사항의 "실패 이유를 보여줘야 한다"를 형식적으로는 만족하지만, 사용자가 읽을 수 있는 문구는 아니다 — 아래 "다음 측정"과 함께 남은 항목으로 둔다.

### 다음 측정 — 이번 변경으로 새로 필요해진 것

1. ~~**검색 CLS 재측정(필수)**~~ — **Round 5에서 완료.** 결과: `LayoutShift` 0건, `min-height` 예약 불필요로 결론.
2. ~~**`Failed to fetch` 문구 정리(선택)**~~ — **Round 6에서 완료.**
3. **Round 7(스켈레톤) cold load 재측정(필수)** — 아래 참고.

### Round 7 재측정 방법

Round 0–5와 같은 프로토콜로 재면 된다.

- **환경**: `pnpm build && pnpm start`(포트 3000), 시크릿 창
- **Lighthouse**: `/products`를 `--preset=desktop`으로 **5회**, FCP·LCP·CLS raw 값과 중앙값·최솟값·최댓값 기록 → Round 5 이전 값(FCP 중앙값 약 1,389ms / LCP 약 2,159–2,229ms)과 비교
- **Performance 패널**: Slow 4G로 `/products` 하드 리로드 1회 녹화(Screenshots 체크) — 확인할 것 두 가지
  1. 필름스트립에서 **스켈레톤 → 실제 목록** 교체가 보이는지(이제 fallback이 텍스트 한 줄이 아니라 12칸 그리드여야 함)
  2. 그 교체 구간에 `LayoutShift`가 잡히는지 · `had_recent_input`이 `false`인지

**Round 6(에러 문구)은 별도 측정하지 않는다** — 실패 경로의 문자열만 바꾼 변경이라 cold load 지표에 영향을 주지 않고, 동작은 Round 6 절의 캡처와 회귀 테스트 5개로 확인했다.

---

## Round 5 — 검색 CLS 재측정 (`scroll: false` 적용 후)

Round 4의 `scroll: false` 변경으로 무효가 된 Round 3 결론을 같은 조건으로 다시 확인했다. **코드 변경 없이 측정만 했다.**

- **측정 시점 코드 상태**: Round 0–4 전부 적용(아직 커밋 전)
- **측정 도구**: DevTools Performance 패널, **Slow 4G**, `hostDPR: 1`, 포트 3000(프로덕션 빌드) — Round 3과 동일
- **측정 일시**: 2026-08-06 UTC 15:16
- **조작**: `/products`에서 스크롤을 내려 그리드가 보이는 상태로 만든 뒤 `스탠리` 검색(총 30개 → 총 4개, 카드 3줄 → 1줄)

### 결과 — `LayoutShift` 여전히 **0건**

| 시점      | 스크린샷                                                                                                                       | 내용                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| t=6,997ms | [`t6997ms-검색요청시점-스크롤유지됨.jpg`](<./lighthouse/round5/2. performance/products/t6997ms-검색요청시점-스크롤유지됨.jpg>) | 검색 요청 시점 — **히어로가 안 보임 = 스크롤이 유지됐다**(Round 3과 다름) |
| t=7,600ms | [`t7600ms-결과교체후-같은스크롤위치.jpg`](<./lighthouse/round5/2. performance/products/t7600ms-결과교체후-같은스크롤위치.jpg>) | 결과가 4개로 교체 — **같은 스크롤 위치 유지**, 화면 튐 없음               |
| t=9,352ms | [`t9352ms-안정.jpg`](<./lighthouse/round5/2. performance/products/t9352ms-안정.jpg>)                                           | 안정                                                                      |

`scroll: false`가 의도대로 동작한 것은 스크린샷으로 확인됐다 — Round 3에서는 검색 순간 히어로가 화면을 가득 채웠는데, 이번엔 필터 바와 그리드가 그대로 보이는 위치를 유지한다. **즉 이번엔 그리드 변화가 뷰포트 안에서 일어났는데도 `LayoutShift`가 0건이다.**

### 왜 0인가 — 이번엔 이유가 다르다

Round 3의 0건은 "그리드가 화면 밖이라 채점되지 않아서"였다. 이번 0건은 이유가 둘로 나뉜다:

1. **카드는 애초에 "이동"하지 않는다**: `ProductListSection`이 `key={dataUpdatedAt}`로 리키잉되므로(Round 0), 결과가 바뀌면 기존 카드가 **언마운트되고 새 카드가 삽입**된다. Layout Instability API는 기존 요소의 이동만 점수화하고 삽입·제거는 채점하지 않는다 — 그리드 첫 줄의 시작 위치도 변하지 않는다.
2. **실제로 움직이는 Pagination은 이 스크롤 위치에서 화면 밖이었다**: 그리드가 2줄(약 840px) 줄면서 Pagination은 그만큼 위로 올라왔지만, 이번 녹화의 스크롤 위치 기준으로도 Pagination은 뷰포트 아래에 있었다.

### 결론 — 대응하지 않는다(근거가 Round 3보다 강해졌다)

- `scroll: false`로 바꿔 **그리드 변화를 뷰포트 안으로 끌어온 조건에서도 공식 CLS는 0**이다. Round 3처럼 "화면 밖이라 안 잡힌 것"이 아니라, **주된 이유가 리키잉(Round 0) 덕분에 카드가 이동 자체를 하지 않기 때문**이라는 게 이번 측정으로 분리돼 확인됐다.
- 따라서 그리드 `min-height` 예약은 이번에도 채택하지 않는다 — 막으려던 이동이 구조적으로 발생하지 않는다.
- **남은 잔여 리스크**: Pagination이 화면에 보일 만큼 더 아래로 스크롤한 상태에서 결과 수가 크게 줄면, Pagination 이동이 채점될 여지는 남아 있다. 이번 녹화로는 그 조건까지 확인하지 못했다 — 필요하면 Pagination이 뷰포트에 들어온 상태로 한 번 더 녹화해 확인한다.

---

## Round 6 — 실패 문구를 사용자가 읽을 수 있게

Round 4에서 최초 실패 화면을 재현하다가 발견한 문제를 고쳤다.

- **관찰**: 실패 화면에 노출되는 문구가 `Failed to fetch`였다. `apiResponseResult`가 `res.ok`가 아닐 때만 서버 메시지를 꺼내 썼기 때문에, **네트워크 자체가 실패해 `fetch`가 throw하면 브라우저 원문 에러가 `ErrorRetry`를 거쳐 그대로 사용자에게 보였다.**
- **변경**(`src/shared/api/response.ts`):
  - `fetch`를 `try/catch`로 감싸 네트워크 실패를 "네트워크에 연결하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요."로 바꿨다.
  - 실패 응답의 본문 파싱이 깨져도(`res.json()` throw) "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."로 대체한다 — 기존에는 여기서도 파싱 에러가 그대로 튀어나왔다.
  - **`AbortError`는 변환하지 않고 그대로 다시 던진다.** 취소는 실패가 아니라 정상 흐름이고, 여기서 일반 에러로 바꿔버리면 Round 2에서 연결한 `AbortSignal` 취소가 "에러"로 처리돼 회귀가 난다.
- **회귀 테스트 추가**(`src/shared/api/response.test.ts`, 5개): 네트워크 실패 문구 치환 / `AbortError` 그대로 전파 / 서버 메시지 우선 사용 / 본문 파싱 실패 시 기본 문구 / 성공 시 본문 반환.

### 확인

Round 4와 똑같은 방법(`NEXT_PUBLIC_SITE_URL`을 죽은 포트로 + 클라이언트 요청 차단)으로 재현해 캡처했다.

![수정 후 최초 실패 — 읽을 수 있는 문구](<./lighthouse/round6/3. captures/state-initial-failure-readable-message.png>)

`Failed to fetch` → **"네트워크에 연결하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요."** 로 바뀐 것을 확인했다. 목록 없이 전체 교체되는 동작(최초 실패 경로)은 그대로다.

---

## Round 7 — 최초 pending에 스켈레톤 도입 (결정 번복)

1부 "결정" 절에서 "스켈레톤을 쓰지 않는다"고 정했었는데, **그 결정을 번복했다.** "전체 화면이 아니라 목록 영역만 채우는 것이라 FCP 부담이 크지 않다"고 직접 판단해 **스켈레톤 도입을 결정**했고, 아래는 그 판단을 뒷받침하는 재검토다.

### 왜 번복했나 — 기존 근거 3개 중 1개가 사실과 달랐다

| 당시 근거                                             | 재검토                                                                                                                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "스켈레톤은 핵심 콘텐츠 표시를 늦춘다"                | **사실이 아니다.** 스켈레톤은 어차피 비어 있을 시간을 채울 뿐, 실제 데이터 도착 시점을 늦추지 않는다.                                                       |
| "진짜 문제는 API 지연이니 캐시로 풀어야 한다"         | 여전히 맞다. 다만 **스켈레톤과 배타적이지 않다** — 캐시는 실제 속도를, 스켈레톤은 기다리는 동안의 예측 가능성을 다루는 서로 다른 층이다.                    |
| "스켈레톤은 늦게 나와도 되는 부가 영역에만 써야 한다" | 이 페이지에서는 오히려 반대다. **레이아웃이 정확히 일치하는 스켈레톤은 fallback→실제 콘텐츠 교체 시 기하 변화를 없애** Part 2의 주제인 CLS에 직접 기여한다. |

또한 Round 4에서 확인했듯, 기존 `loading.tsx`는 **텍스트 한 줄뿐**이라 요구사항("실제 목록 크기를 예상할 수 있는 pending UI")을 명백히 만족하지 못하는 상태였다.

### 변경

- **`src/app/products/loading.tsx`**: 실제 페이지와 같은 골격을 그린다 — `Header`·`PageHeading`(둘 다 **실제 컴포넌트를 그대로 재사용**해 기하가 어긋나지 않게 함) + 필터 자리 + `pageSize`와 같은 **12칸 스켈레톤 그리드**.
- **`src/app/layout.css`**: 스켈레톤 스타일 추가. 카드 높이는 실측한 실제 카드 한 줄 높이(약 565px)에 맞췄고, `prefers-reduced-motion: no-preference`일 때만 은은한 pulse 애니메이션이 돈다.
- 접근성: 스켈레톤 시각 요소는 `aria-hidden`, 목록 영역에는 `aria-busy="true"` + `aria-label="상품 목록을 불러오는 중입니다"`.

### 확인 — 기하가 1px 차이로 일치

API 응답을 6초 지연시켜 스켈레톤 구간을 넓힌 뒤, 스켈레톤 상태와 실제 콘텐츠 상태의 레이아웃을 각각 측정했다.

| 측정 항목         | 스켈레톤 | 실제 콘텐츠 |
| ----------------- | -------- | ----------- |
| 그리드 시작 y좌표 | 745px    | 745px       |
| 그리드 높이       | 1,735px  | 1,734px     |
| 카드 수           | 12칸     | 12개        |

![최초 pending — 12칸 스켈레톤](<./lighthouse/round7/3. captures/state-initial-pending-skeleton.png>)

**그리드 시작 위치가 정확히 일치하고 높이 차이는 1px**다. 즉 fallback이 실제 목록으로 바뀔 때 아래 요소(Pagination 등)가 사실상 움직이지 않는다 — 요구사항의 "목록 크기를 예상할 수 있는" 조건을 충족하면서, 교체 시 레이아웃 흔들림도 만들지 않는다.

### 요구사항 판정 갱신

"데이터 없는 최초 진입"은 이제 **충족**이다. 화면이 존재할 뿐 아니라(Round 4에서 확인), 실제로 12개짜리 5열 그리드가 온다는 것을 크기·형태로 예고한다.

### 사용자 직접 측정 — Round 7 상태 확인

- **측정 일시**: 2026-08-06 UTC 15:40–15:42(Lighthouse) / 15:43(Performance 트레이스)
- **조건**: `--preset=desktop` 5회, 포트 3000 / Performance는 Slow 4G·`hostDPR: 1`

#### Lighthouse — 상품 목록 (`/products`, 5회 raw 값)

| run        | FCP(ms)     | LCP(ms)     | Speed Index(ms) | CLS       |
| ---------- | ----------- | ----------- | --------------- | --------- |
| 1          | 1,391.3     | 2,582.5     | 2,273.5         | 0.000     |
| 2          | 1,389.4     | 2,578.8     | 2,263.7         | 0.000     |
| 3          | 1,398.1     | 2,756.2     | 2,361.9         | 0.000     |
| 4          | 1,389.4     | 2,738.9     | 2,284.0         | 0.000     |
| 5          | 1,390.7     | 2,661.5     | 2,345.7         | 0.000     |
| **중앙값** | **1,390.7** | **2,661.5** | **2,284.0**     | **0.000** |
| 최솟값     | 1,389.4     | 2,578.8     | 2,263.7         | 0.000     |
| 최댓값     | 1,398.1     | 2,756.2     | 2,361.9         | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round7/1. lighthouse html 문서/products/run-1.html`](<./lighthouse/round7/1. lighthouse html 문서/products/run-1.html>) ~ `run-5.html`

**앞서 세운 예상 3개 중, 확정할 수 있는 건 1개뿐이다.**

| 예상                                       | 결과                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| document가 커져 FCP가 나빠질 수 있다       | ❌ **틀렸다.** FCP 중앙값 1,390.7ms로 이전 라운드(1,388–1,390ms대)와 오차범위 내. 1.3KB 증가는 FCP에 영향을 주지 못했다. |
| hero preload가 빨라져 LCP가 좋아질 수 있다 | ⚠️ **판단 불가**(아래 참고)                                                                                              |
| 교체 시 CLS가 없을 것                      | ✅ **맞았다.** cold load CLS 5회 모두 0.000 — 스켈레톤과 실제 목록의 기하가 1px 차이로 일치한다는 앞선 확인과 일관된다.  |

#### ⚠️ LCP는 라운드 간 비교가 성립하지 않는다 — 측정 프로토콜의 구멍

처음에는 "Round 2(2,229ms) → Round 7(2,661ms)로 432ms 나빠졌다"고 적었으나, **그 비교는 두 가지 이유로 잘못됐다.**

**첫째, 서로 다른 URL을 비교했다.** 라운드마다 측정 URL이 달랐다.

| 라운드  | 측정 URL                     | LCP raw                                |
| ------- | ---------------------------- | -------------------------------------- |
| Round 0 | `/products`                  | [2176, **1390**, **1402**, 2159, 2383] |
| Round 1 | `/products?category=fashion` | [2098, 2096, 2208, 2096, 2384]         |
| Round 2 | `/products?page=2`           | [2227, 2230, 2229, 2097, 2383]         |
| Round 7 | `/products`                  | [2583, 2579, 2756, 2739, 2661]         |

같은 URL끼리 비교 가능한 쌍은 **Round 0 ↔ Round 7뿐**이다(중앙값 2,158.9ms → 2,661.5ms).

**둘째, 그마저도 이미지 변환 캐시 상태에 오염돼 있다.** Round 0의 2·3회차 LCP(**1,390 / 1,402ms**)는 같은 리포트의 FCP(1,389.6ms)와 사실상 같은 값이다 — 즉 **hero가 이미 완성된 상태여서 LCP가 FCP와 동시에 확정된 회차**다. 서버의 이미지 변환 캐시(`.next/cache/images`)가 히트했다는 뜻이다. Round 7에는 그런 회차가 하나도 없는데, **측정 직전에 `rm -rf .next && pnpm build`로 캐시가 통째로 비워졌고** 당시 `minimumCacheTTL`이 기본 60초라 측정 중에도 계속 만료됐을 가능성이 크다(Round 8에서 실측한 대로 변환 유무의 차이는 232ms vs 1.6ms).

**결론**: Round 7의 LCP 상승이 스켈레톤 때문인지, 캐시가 비어 있어서인지 **이 데이터로는 구분할 수 없다.** 그동안 포트·throttling·URL은 고정해왔지만 **이미지 변환 캐시 상태는 한 번도 통제 항목에 넣지 않았고**, 그것이 라운드 간 LCP 비교를 무의미하게 만들고 있었다.

**앞으로의 측정 규칙에 추가**: 라운드 간 LCP를 비교하려면 ① **URL을 고정**하고 ② **이미지 캐시 상태를 명시**해야 한다(예열 후 / 비운 직후 중 하나로 통일). 설정으로 우회하려 했던 시도(Round 8)는 철회했으므로, **측정 절차로 통제하는 것이 유일한 방법**이다.

#### Performance 트레이스 — 공식 CLS에 잡히는 시프트 발견

이 트레이스(인터랙션 녹화, `navigationStart` 없음)에서 `LayoutShift`가 **5건** 잡혔고, 그중 **1건은 `had_recent_input: false`라 공식 CLS에 반영된다.**

| 시점           | score      | hadRecentInput | 이동한 노드                                      |
| -------------- | ---------- | -------------- | ------------------------------------------------ |
| t=11,923ms     | 0.0367     | `true`         | `week05-pagination` 나타남                       |
| t=12,938ms     | 0.0136     | `true`         | `week05-pagination` 사라짐                       |
| **t=17,123ms** | **0.0136** | **`false`**    | **`week05-pagination` 나타남 — 공식 CLS에 반영** |
| t=19,463ms     | 0.0367     | `true`         | `week05-pagination` 사라짐                       |
| t=26,364ms     | 0.0008     | `true`         | `week05-pagination` 위치 이동                    |

**원인**: `loading.tsx`(스켈레톤)에는 Pagination이 없다. 그래서 라우트 세그먼트가 fallback으로 바뀔 때 Pagination이 언마운트되고, 실제 콘텐츠가 오면 다시 마운트된다 — Round 0에서 `{!isFetching && <Pagination/>}`를 없애 해결했던 것과 **같은 형태의 문제가 fallback 경계에서 재발**한 셈이다.

**한계와 남은 일**: cold load Lighthouse에서는 CLS 0.000이고, 이 트레이스에서 반영되는 값도 0.0136으로 "좋음" 기준(0.1)에는 한참 못 미친다. 다만 **Round 0 이후 "공식 CLS에 잡히는 시프트는 없다"고 정리해온 서술은 이제 정확하지 않다.** → **Round 9에서 스켈레톤에 Pagination 자리를 추가해 수정했다**(재측정은 아직).

---

## Round 8 — 이미지 변환 캐시 TTL 연장 (시도 후 **철회**)

> **결론부터**: 이 라운드의 코드 변경은 **되돌렸다.** `next.config.ts`는 Part 1 종료 시점 그대로다. **측정 결과를 다시 검토한 뒤 "느려진 원인이 캐시는 아니다"라고 직접 판단해 철회를 결정했다.** 아래는 무엇을 근거로 시도했고 왜 접었는지의 기록이다 — 그 과정에서 얻은 실측 하나는 계속 쓸모가 있어 남긴다.

### 세웠던 가설

Round 7 측정에서 **Speed Index 중앙값 2,284ms**로 FCP·LCP보다 점수가 낮았다. Part 1 "LCP breakdown"에서 hero의 `Resource load duration`이 **2,560–2,684ms**로 4개 구간 중 압도적이었던 걸 근거로, **"이 시간의 대부분은 원본(7.5MB)을 매 요청마다 리사이즈·AVIF 재인코딩하는 서버 처리 비용"**이라고 봤다.

### 남길 만한 실측 — 변환 비용은 실제로 크다

```
GET /_next/image?url=%2Fimages%2Fweek-07%2Fhero-original.jpg&w=2400&q=75
```

| 상태                           | 응답 시간 | `X-Nextjs-Cache` |
| ------------------------------ | --------- | ---------------- |
| 캐시 비운 직후(실제 변환 수행) | **232ms** | `MISS`           |
| 같은 요청 재요청(변환 생략)    | **1.6ms** | `HIT`            |

**약 145배 차이**다. 변환 비용 자체가 크다는 것은 사실로 확인됐고, 이 수치는 **"라운드 간 LCP 비교가 왜 캐시 상태에 오염됐는지"를 설명하는 근거**로 이 문서 여러 곳에서 계속 인용된다.

### 왜 철회했나 — 판단 근거

`images.minimumCacheTTL`을 기본 60초 → 1일로 늘렸다가 되돌렸다. 이 변경이 계속 마음에 걸려 근거를 다시 따져본 결과 **"느려진 원인이 캐시는 아니다"라고 직접 판단**했고, 그 근거는 넷이다.

1. **진단이 틀렸다.** 이후 Round 10에서 사용자 리포트의 `network-requests`를 열어보니, hero의 2,460ms는 변환 비용이 아니라 **카드 이미지 5장과 대역폭을 나눠 쓴 결과**였다. 실제 해결도 캐시가 아니라 `fetchPriority="low"`로 이뤄졌다(hero 구간 2,460ms → 39ms).
2. **효과를 측정한 적이 없다.** 이 변경이 Speed Index를 실제로 줄였다는 증거가 없다.
3. **실사용 리스크가 있다.** `next/image`의 캐시 키는 소스 URL + width + quality라, 같은 경로에 이미지를 교체해도 키가 그대로다 → TTL이 만료될 때까지 옛 이미지가 나간다. 게다가 이 값은 브라우저·CDN에 내려가는 `Cache-Control: max-age`에도 반영돼 서버 캐시를 비워도 회수가 어렵다.
4. **60초가 실제로 무언가를 망가뜨린 적이 없다.** 유일하게 문제가 됐던 건 _우리 측정 중에_ 캐시가 만료돼 수치가 흔들린 것인데, 그건 사용자가 겪는 문제가 아니라 **측정 방법의 문제**다 — "예열하고 잰다"로 해결할 일이지 프로덕션 설정을 바꿀 일이 아니다.

**교훈**: 프레임워크 기본값을 벗어나려면 (a) 그 기본값이 실제로 문제를 일으킨다는 증거와 (b) 변경 후 개선됐다는 측정이 둘 다 있어야 한다. 이번엔 둘 다 없이 추정만으로 바꿨다 — Round 1(render-blocking CSS)과 같은 종류의 실패이며, 지우지 않고 남긴다.

---

## Round 9 — 스켈레톤에 Pagination 자리 추가 (CLS 회귀 수정)

Round 7 Performance 트레이스에서 발견한 **공식 CLS에 반영되는 시프트**(score 0.0136, `had_recent_input: false`)를 고쳤다.

- **원인**: `loading.tsx` 스켈레톤에 Pagination이 없었다. 라우트 세그먼트가 fallback으로 바뀌면 Pagination이 언마운트되고 실제 콘텐츠가 오면 다시 마운트되는데, 이 나타남/사라짐이 레이아웃 이동으로 채점됐다 — Round 0에서 `{!isFetching && <Pagination/>}`를 없애 해결했던 것과 **같은 형태의 문제가 fallback 경계에서 재발**한 것이다.
- **변경**: `loading.tsx`에 실제 Pagination과 같은 높이(34px)의 자리를 `nav.week05-pagination`으로 미리 잡았다(`layout.css`에 `.week05-skeleton-pagination` 추가). 시각 요소는 `aria-hidden`.

### 확인 — 스켈레톤과 실제 콘텐츠의 기하

API 응답을 5초 지연시켜 두 상태의 레이아웃을 각각 측정했다.

| 측정 항목             | 스켈레톤    | 실제 콘텐츠 |
| --------------------- | ----------- | ----------- |
| 그리드 시작 y         | 745px       | 745px       |
| 그리드 높이           | 1,735px     | 1,734px     |
| **Pagination 시작 y** | **2,512px** | **2,511px** |
| **Pagination 높이**   | **34px**    | **34px**    |

Pagination이 **양쪽 상태에 모두 존재**하고 위치도 1px 차이다. 더 이상 fallback 경계에서 언마운트/재마운트되지 않으므로, Round 7에서 관측된 시프트는 발생하지 않을 것으로 본다.

**아직 재측정 안 함**: 위는 레이아웃 좌표 비교일 뿐이고, **공식 CLS가 실제로 0이 되는지는 Performance 트레이스로 확인해야 한다**(3부 "남은 항목" 참고).

---

## Round 10 — 배너(hero)를 먼저 받도록 카드 이미지 우선순위 낮춤

진단에서 확인한 "hero와 카드 이미지의 대역폭 경쟁"을 실제로 고쳤다. 원래는 Part 1 주제라 관찰 기록으로만 남기려 했으나, **"배너를 먼저 보여주는 쪽"을 직접 선택**해 이 Part에서 처리했다.

- **원인**: hero는 `fetchPriority="high"`인데 **카드 이미지에는 우선순위 지정이 없어** 브라우저가 둘을 비슷하게 취급했다. 그래서 hero(163KB)를 받는 도중 첫 줄 카드 5장이 끼어들어 다운로드가 2,460ms까지 늘어났다.
- **변경**: `ProductCard`의 이미지에 `fetchPriority="low"`를 추가했다(`src/entities/product/ui/ProductCard.tsx`). 카드 이미지는 LCP 요소가 아니므로 우선순위를 낮춰 hero가 먼저 끝나게 한다. `loading="eager"`(첫 줄 5장)는 그대로 둬서 **"먼저 요청은 하되 hero보다 뒤에 받는다"**가 된다.
- **홈에도 같이 적용됨**: 홈의 인기·신상품 목록도 같은 `ProductCard`를 쓰므로 자동으로 반영된다. 실제 HTML에서 두 페이지 모두 hero만 `high`, 카드 이미지 12장은 `low`로 확인했다.

### 확인 (AI가 CLI로 잰 참고용 수치, 예열된 캐시)

|                          | score | FCP   | LCP   | Speed Index | **hero 네트워크 구간** |
| ------------------------ | ----- | ----- | ----- | ----------- | ---------------------- |
| 변경 전(`/products`)     | 1.0   | 246ms | 582ms | 291ms       | —                      |
| **변경 후(`/products`)** | 1.0   | 248ms | 585ms | **248ms**   | **39ms**               |
| **변경 후(홈 `/`)**      | 1.0   | 246ms | 668ms | 481ms       | **6ms**                |

hero 다운로드 구간이 **39ms / 6ms**로 떨어졌다(사용자 측정에서 2,460ms였던 그 구간). Speed Index도 291ms → 248ms로 개선됐다.

**이 수치는 참고용이다** — headless CLI + 예열된 캐시 조건이라, 공식 확인은 사용자가 브라우저로 재야 한다(3부 참고). 다만 hero 구간이 2,460ms → 수십 ms로 줄어든 방향성은 명확하다.

---

## Round 11 — hero 이미지 quality 낮추기 (`q=75` → `q=65`)

Round 10 재측정에서 **점수가 오르지 않은 원인**을 다시 파고들어, 이번엔 우선순위가 아니라 **파일 크기 자체**를 줄이기로 직접 판단했다.

### Round 10은 왜 점수를 못 올렸나

`fetchPriority="low"`는 **의도대로 작동했다** — 카드 이미지가 hero 뒤로 밀려났다.

|                        | 카드 이미지 시작 시점                     |
| ---------------------- | ----------------------------------------- |
| Round 10 전(77점 측정) | **1,205ms** — hero 다운로드 중간에 끼어듦 |
| Round 10 후            | **3,194ms** — hero가 거의 끝난 뒤         |

그런데도 hero는 빨라지지 않았다(2,460ms → 2,840ms). 요청 타임라인을 보니 **진짜 경쟁자가 카드가 아니었다.**

| 시작      | 종료        | 크기        | priority | 리소스          |
| --------- | ----------- | ----------- | -------- | --------------- |
| 616ms     | 1,610ms     | 22.9KB      | High     | Geist 폰트      |
| 616ms     | 1,686ms     | 28.9KB      | High     | Geist Mono 폰트 |
| **616ms** | **3,453ms** | **163.7KB** | High     | **hero**        |
| 616ms     | 1,303ms     | 3.3KB       | VeryHigh | CSS             |
| 1,286ms   | 3,035ms     | 69.7KB      | Low      | JS 청크         |
| 1,303ms   | 2,651ms     | 36.9KB      | Low      | JS 청크         |

hero는 폰트 2개(52KB)·CSS·JS 청크들과 **같은 시점에 출발해 대역폭을 나눠 쓴다.** 전체 전송량이 588KB인데 시뮬레이션 대역폭은 1,280KB/s다. 카드를 뒤로 미뤄도 나머지 경쟁자는 그대로였다.

### 판단 — 우선순위가 아니라 크기를 줄인다

경쟁을 없앨 수 없다면 **hero 자체를 가볍게 만드는 것**이 남은 방법이라고 직접 판단했다. 처음에는 quality를 낮추는 방향을 검토했다. `w=2400` 변형의 quality별 실측:

| quality      | 크기              | 절감       |
| ------------ | ----------------- | ---------- |
| **75**(기본) | 167,195 bytes     | —          |
| **65**(채택) | **108,965 bytes** | **−34.8%** |
| 55           | 71,978 bytes      | −57%       |

q=75와 q=65를 실제 표시 크기(1200×514)로 렌더해 비교했으나 **육안으로 구분되지 않았다.** 부드러운 그라데이션 위주의 사진이라 AVIF가 이 구간에서 손실을 잘 감춘다. q=55는 더 작지만 안전 여유를 두고 채택하지 않았다.

### 방향 전환 — quality 대신 치수를 맞추기로 결정

q=65를 적용했다가, **"화질을 깎아서 버는 것"과 "안 쓰는 픽셀을 안 받는 것"은 성격이 다르다**는 판단에 따라 방향을 바꿨다. 이 페이지에는 후자의 낭비가 두 겹 있었다.

1. **크롭 낭비 약 19%** — `/products` 히어로는 21:9로 표시되는데 소스가 16:9라, `object-fit: cover`가 잘라낼 위아래 픽셀까지 매번 내려받고 있었다.
2. **폭 오버슛 약 17%** — 표시 폭 1200px × DPR 1.75 = 2100px가 필요한데 `deviceSizes`에 2100이 없어 2400을 받는다. 이미 있는 **2048**을 고르게 하면 해결된다(2048 → 2100 업스케일 2.5%는 육안으로 드러나지 않는다).

| 조합                             | bytes       | 절감              |
| -------------------------------- | ----------- | ----------------- |
| 16:9, w=2400, q=75 (Part 1 상태) | 167,195     | —                 |
| 16:9, w=2400, q=65               | 108,965     | 34.8% (화질 손실) |
| 21:9 크롭, w=2400, q=75          | 135,133     | 19.2%             |
| **21:9 크롭, w=2048, q=75**      | **112,773** | **32.5%**         |

**크롭 + 폭 정리만으로 q=65와 거의 같은 절감(32.5% vs 34.8%)을 화질 손실 없이 얻는다.** 그래서 quality는 75로 되돌리고 치수를 맞추는 쪽을 선택했다.

### 변경

- `public/images/week-07/hero-original-21x9.jpg` 추가 — 원본을 21:9(3840×1646)로 잘라둔 소스. `next/image`는 리사이즈만 하고 크롭은 못 하므로, 표시 비율과 다른 소스를 쓰면 버릴 픽셀까지 내려받게 된다. `compact`(=`/products`)일 때만 이 소스를 쓰고, 홈은 16:9 원본을 그대로 쓴다.
- `sizes`를 `(min-width: 1232px) 1170px, calc(100vw - 32px)`로 변경 — 컨테이너 폭(`min(100% - 32px, 1200px)`)을 정확히 반영하고, 넓은 쪽은 1170px로 선언해 2048을 고르게 한다.
- `quality`는 기본값 75 유지(`next.config.ts`의 `qualities` 설정도 제거).

### ⚠️ 측정은 사용자 확인 필요

AI가 CLI로 잰 값은 이번엔 **참고조차 되지 않는다** — headless Chrome은 DPR 1이라 `w=1200`(44KB) 변형을 받아, 실제 환경(DPR 1.75, `w=2400`, 108KB)과 다른 파일을 측정하기 때문이다. Round 7에서 캐시 상태를 통제하지 않아 잘못된 결론을 냈던 것과 같은 종류의 함정이라, 여기서는 수치를 인용하지 않는다.

**확실한 것은 하나**: `w=2400`에서 전송량이 줄었다는 직접 측정값이며, 이는 실제 환경에 그대로 적용된다. LCP·Speed Index에 실제로 얼마나 반영되는지는 아래 사용자 측정으로 확인했다.

### 사용자 직접 측정 — Round 11 (`/products`, 5회, `--preset=desktop`)

| run        | score    | FCP(ms)   | LCP(ms)   | Speed Index(ms) | CLS       | hero            |
| ---------- | -------- | --------- | --------- | --------------- | --------- | --------------- |
| 1          | 0.76     | 1,399     | 2,735     | 2,446           | 0.000     | 132KB / 2,623ms |
| 2          | 0.76     | 1,401     | 2,738     | 2,453           | 0.000     | 132KB / 2,623ms |
| 3          | 0.76     | 1,395     | 2,728     | 2,448           | 0.000     | 132KB / 2,628ms |
| 4          | 0.74     | 1,401     | 2,803     | 2,865           | 0.000     | 132KB / 2,620ms |
| 5          | 0.75     | 1,399     | 2,798     | 2,463           | 0.000     | 132KB / 2,632ms |
| **중앙값** | **0.76** | **1,399** | **2,738** | **2,453**       | **0.000** | **132KB**       |

눈으로 보는 리포트: [`./lighthouse/round11/1. lighthouse html 문서/products/run-1.html`](<./lighthouse/round11/1. lighthouse html 문서/products/run-1.html>) ~ `run-5.html`

**결과: 크롭은 적용됐고, `sizes` 변경은 적용되지 않았다.**

리포트의 hero 요청 URL이 `hero-original-21x9.jpg&w=2400`이었다 — 소스는 21:9 크롭본으로 바뀌었지만 **폭은 여전히 2400**이다. 의도한 2048이 선택되지 않았다.

|                                   | hero 전송량                |
| --------------------------------- | -------------------------- |
| Round 10까지 (16:9, w=2400)       | 167,195 bytes              |
| **이번 측정 (21:9 크롭, w=2400)** | **135,568 bytes (−18.9%)** |
| 의도했던 값 (21:9 크롭, w=2048)   | 112,773 bytes (−32.5%)     |

**원인 — `sizes`에서 페이지 좌우 여백을 빠뜨렸다.** 페이지 컨테이너는 `width: min(100% - 32px, 1200px)`인데, 처음 선언한 `(min-width: 1200px) 1170px, 100vw`는 뷰포트가 1232px 미만일 때 `100vw`로 떨어지면서 **실제 폭보다 32px 넓게 신고**한다. 그 결과 필요 폭이 2048을 넘어 2400이 선택됐다.

**수정**: `(min-width: 1232px) 1170px, calc(100vw - 32px)`로 바꿨다.

옛 선언으로 뷰포트별 재현해 원인을 확정했다 — **1170–1200px 구간에서만 2400이 선택**된다.

| 뷰포트(DPR 1.75)          | 옛 `sizes`  | 수정 후     |
| ------------------------- | ----------- | ----------- |
| 1512 / 1280 / 1232 / 1200 | 2048        | 2048        |
| **1190 / 1180**           | **2400** ❌ | **2048** ✅ |
| 1100                      | 2048        | 1920        |
| 1024                      | 1800        | 1800        |

그 구간에서는 `(min-width: 1200px)`가 매칭되지 않아 `100vw`로 떨어지는데, 좌우 여백 32px을 빼지 않은 탓에 예를 들어 1190×1.75 = 2082가 되어 2048을 넘겨 2400을 고른다. 사용자의 Lighthouse 창이 이 구간이었다.

**⚠️ 이 수정분은 위 측정에 반영되지 않았다.** 적용 시 hero는 135,568 → 112,773 bytes(추가 −17%)가 되며, Part 1 시작점 대비 누적 **−32.5%**다. 재측정은 Part 3 착수 전에 수행하는 것이 정확하다(Part 3 문서 "Before 성능 지표" 참고).

### 점수는 왜 거의 그대로인가

전송량이 19% 줄었는데 점수는 0.75 → 0.76으로만 움직였다. hero의 네트워크 구간이 **2,623ms**로 거의 그대로이기 때문이다(직전 라운드 2,840ms).

132KB를 시뮬레이션 대역폭(1,280KB/s)으로 받으면 약 103ms면 된다. **2,623ms의 대부분은 파일 크기가 아니라 같은 시점에 출발하는 다른 리소스(폰트 2개·CSS·JS 청크)와의 대역폭 경쟁**이라는 Round 11 진단이 여기서도 재확인된다. 즉 hero만 줄여서는 이 구간이 비례해서 줄지 않는다.

---

## Round 12 — 쓰이지 않는 폰트 제거 (Part 2 최종)

Round 11 측정에서 hero의 네트워크 구간(2,620ms)이 여전히 병목이라, 요청 타임라인에서 **hero와 같은 시점에 출발하는 High 우선순위 리소스**를 다시 살펴보다 발견한 것이다.

### 관찰 — 폰트 52KB가 다운로드되는데 화면에 쓰이지 않는다

```
var(--font-geist-sans) 참조: 0건
var(--font-geist-mono) 참조: 0건
globals.css:  body { font-family: Arial, Helvetica, sans-serif; }
```

`layout.tsx`가 `next/font/google`의 `Geist`·`Geist_Mono`를 불러 `<html className={...variable}>`로 CSS 변수를 심어두는데, **그 변수를 참조하는 CSS가 한 줄도 없다.** 화면은 시스템 `Arial`로 렌더되고 있었다.

**언제부터인가**: git 이력을 보니 **리포지토리 최초 커밋부터** 그랬다. `create-next-app` 템플릿은 `layout.tsx`(변수 주입)와 `globals.css`(`font-family: var(--font-geist-sans), …`)가 짝으로 동작하는데, 이 프로젝트는 처음부터 `globals.css`를 직접 작성하면서 변수 참조 없이 `Arial`로 시작했다. **누가 나중에 끊은 게 아니라 애초에 연결된 적이 없다.**

문제는 `next/font`가 지정된 폰트를 **자동으로 preload**한다는 점이다. 결과적으로 "쓰이지도 않는데 가장 먼저 받는" 조합이 되어, hero(LCP 요소)와 같은 시점·같은 High 우선순위로 대역폭을 나눠 쓰고 있었다.

### 변경

`layout.tsx`에서 폰트 import 2줄과 `className`의 CSS 변수 주입을 제거했다. **렌더 결과는 바뀌지 않는다**(어차피 Arial로 그리고 있었다).

### 사용자 직접 측정 — Round 12 (`/products`, 5회, `--preset=desktop`)

| run        | score    | FCP(ms)   | LCP(ms)   | Speed Index(ms) | CLS       | hero 구간   | 폰트    |
| ---------- | -------- | --------- | --------- | --------------- | --------- | ----------- | ------- |
| 1          | 0.79     | 1,401     | 2,381     | 2,269           | 0.000     | 2,309ms     | 0개     |
| 2          | 0.79     | 1,395     | 2,373     | 2,266           | 0.000     | 2,303ms     | 0개     |
| 3          | 0.77     | 1,398     | 2,675     | 2,280           | 0.000     | 2,299ms     | 0개     |
| 4          | 0.76     | 1,397     | 2,685     | 2,277           | 0.000     | 2,304ms     | 0개     |
| 5          | 0.76     | 1,399     | 2,692     | 2,279           | 0.000     | 2,305ms     | 0개     |
| **중앙값** | **0.77** | **1,398** | **2,675** | **2,277**       | **0.000** | **2,304ms** | **0개** |

눈으로 보는 리포트: [`./lighthouse/round12/1. lighthouse html 문서/products/run-1.html`](<./lighthouse/round12/1. lighthouse html 문서/products/run-1.html>) ~ `run-5.html`

|                        | Round 11 | **Round 12** | 변화       |
| ---------------------- | -------- | ------------ | ---------- |
| score(중앙값)          | 0.76     | **0.77**     | +0.01      |
| LCP                    | 2,738ms  | **2,675ms**  | −63ms      |
| **Speed Index**        | 2,453ms  | **2,277ms**  | **−176ms** |
| **hero 네트워크 구간** | 2,620ms  | **2,304ms**  | **−316ms** |
| 폰트 요청              | 2개 52KB | **0개**      | −52KB      |

**hero 구간이 316ms 줄었다** — 폰트가 빠지자 그만큼 대역폭이 hero로 돌아갔다는 뜻으로, "경쟁 리소스를 줄이면 hero가 빨라진다"는 가설이 처음으로 수치로 확인됐다. Speed Index도 176ms 개선됐다.

## Part 2 최종 상태와 남은 것

### 점수 구성 — 이 Part가 다룬 영역은 만점이다

| 지표        | score    | weight | 감점 |
| ----------- | -------- | ------ | ---- |
| **TBT**     | **1.00** | 30     | 0    |
| **CLS**     | **1.00** | 25     | 0    |
| LCP         | 0.50     | 25     | 12.5 |
| Speed Index | 0.51     | 10     | 4.9  |
| FCP         | 0.62     | 10     | 3.8  |

**Part 2의 주제였던 CLS와 상호작용 응답성(TBT)은 만점**이고, 남은 감점은 전부 이미지 로딩(LCP·SI·FCP)이다.

### 남은 Lighthouse 항목 — 무엇이 고칠 수 있고 무엇이 아닌가

| 항목                            | 코드로 해결 가능?  | 근거                                                                                                                                                                                  |
| ------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| hero 전송량                     | ✅ 가능            | 아래 표 참고 — **이제부터는 전부 화질과의 교환**                                                                                                                                      |
| render-blocking CSS 650ms       | ⚠️ 부분            | 남은 2개는 전역 CSS 청크 + `PageHeading.module.css`. 요청 수를 줄이려면 CSS Module의 컴포넌트 스코프를 포기해야 할 것으로 봤다 — **이 판단은 Part 4에서 뒤집혔다**(아래 참고)         |
| unused JS 26KB / legacy JS 13KB | ❌ 불가            | 둘 다 `2uw6_lcn_5z8c.js` 한 파일에서 나오며, 열어보니 **Next.js/Turbopack 런타임 부트스트랩**이다. 이 프로젝트 코드도 의존성도 아니다                                                 |
| `bf-cache` 2건                  | ❌ 불가            | `Cache-Control: no-store` 때문이며 Lighthouse 자체가 "Not actionable"로 분류                                                                                                          |
| Resource load delay 544ms       | ⚠️ 가능하나 부적절 | document가 622ms 걸리는 이유는 `page.tsx`의 `await prefetchQuery`가 **mock API의 인위적 500ms 지연**을 기다리기 때문이다. 과제가 준 fixture이므로 이를 없애는 것은 측정 조작에 가깝다 |

### hero를 더 줄이려면 (미적용)

| 방법                     | 크기             | 대가                                                 |
| ------------------------ | ---------------- | ---------------------------------------------------- |
| 현재(21:9, w=2400, q=75) | 135,568          | —                                                    |
| w=2048                   | 112,773 (−17%)   | DPR 2에서 1.17배 업스케일                            |
| q=65                     | 88,722 (−35%)    | 압축 손실(표시 크기 육안 비교에서는 구분되지 않았음) |
| 둘 다                    | 약 74,000 (−45%) | 둘 다                                                |

**이미지 쪽에서 공짜로 얻을 수 있는 것은 여기까지 쓴 것으로 보인다.** 크롭(−19%)과 폰트 제거(−52KB)는 화질·디자인을 건드리지 않고 얻은 이득이었지만, 그 다음부터는 업스케일이나 압축 손실을 감수해야 한다. Part 2의 완료조건은 이미 충족됐으므로 여기서 멈춘다.

> **덧붙임(Part 4에서 정정).** 위 두 문단은 "남은 개선은 전부 화질과의 교환"이라는 전제로 쓰였는데, 그 전제가 틀렸다. 이미지만 보고 있었을 뿐 **임계 경로 자체를 줄이는 방법을 찾지 못한 것**이다.
>
> - render-blocking CSS는 CSS Module을 포기하지 않고도 없앨 수 있었다 — `experimental.inlineCss`로 3.7KB를 문서에 인라인하니 왕복 하나가 통째로 사라지고 **FCP 1,388 → 780ms**가 됐다.
> - "Resource load delay가 mock API 500ms 때문"이라고 위에서 짚은 것은 맞았지만, 그 500ms가 **Lighthouse의 오리진 단위 서버 응답 추정치를 통해 문서·CSS 요청에까지 부과된다**는 것까지는 보지 못했다.
>
> 자세한 경위는 [Part 4](../week07-part4/README.md) 5부에 있다.

---

## 3부. 정리

## 개선할 요소 리스트업 — 처리 현황

1. ~~**[Critical] 갱신 실패 시 기존 목록이 사라지는 문제**~~ — **Round 2에서 적용 완료.** 자세한 내용·재측정 기록은 위 "Round 2" 절 참고.
2. ~~**[High] 갱신 중(기존 목록 있음) 상태에 시각적 신호가 전혀 없음**~~ — **Round 0에서 적용 완료.** 자세한 내용·재측정 기록은 위 "Round 0" 절 참고.
3. ~~**[Medium] 필터 변경 시 그리드 카드 재배치로 인한 CLS(0.035)**~~ — **Round 0에서 적용 완료.** 자세한 내용·재측정 기록은 위 "Round 0" 절 참고.
4. ~~**[Low] `AbortSignal` 미연결로 인한 불필요한 API 호출**~~ — **Round 2에서 적용 완료.** 자세한 내용·재측정 기록은 위 "Round 2" 절 참고.
5. ~~**[정보성] 최초 pending 화면이 목록 크기를 예고하지 못함**~~ — **Round 7에서 적용 완료.** `QueryState.isPending` 분기는 그대로 두고(실사용 경로로 도달하지 않음), 실제 담당인 `loading.tsx`에 12칸 스켈레톤을 넣었다. 스켈레톤을 쓰지 않기로 했던 1부 결정은 Round 7에서 근거와 함께 번복했다.

---

## 완료조건 점검

과제가 명시한 완료조건 3가지를 하나씩 대조한다.

### ① 상태 표의 여섯 화면이 녹화에서 구분되는가 — ✅ 충족

| 상태                    | 구분 가능 여부                                                      |
| ----------------------- | ------------------------------------------------------------------- |
| 데이터 없는 최초 진입   | ✅ Round 7 스켈레톤 — 12칸 그리드가 실제 레이아웃과 1px 차이로 일치 |
| 이전 데이터가 있는 갱신 | ✅ pending 오버레이("목록 갱신 중…")로 명확히 구분                  |
| 성공 + 0건              | ✅ "총 0개" + "검색 결과가 없습니다."                               |
| 최초 실패               | ✅ Round 4에서 재현·캡처, Round 6에서 문구까지 정리                 |
| 갱신 실패               | ✅ 목록 유지 + 인라인 에러 배너·재시도 버튼                         |
| 취소                    | ✅ 화면은 항상 마지막 선택과 일치, Network 탭에서 `(canceled)` 확인 |

**gap 해소**: 6개 화면 모두 실제 캡처로 구분해 보일 수 있고(Round 4), 마지막까지 남아 있던 "최초 pending 화면의 질" 문제도 Round 7의 스켈레톤으로 해소됐다.

### ② 조건을 연속으로 바꿔도 현재 URL의 active query와 화면이 일치하는가 — ✅ 충족

Before 관찰(6번 절)에서 카테고리 3연속 변경으로 확인했고, Round 2 이후에는 이전 요청이 실제로 `(canceled)` 되면서도 최종 화면·URL·`<select>` 값이 모두 마지막 선택과 일치함을 재확인했다. 서버 응답을 Zustand 등 별도 로컬 상태로 복사하지 않고 React Query 캐시만 단일 출처로 쓰는 구조도 그대로 유지된다.

### ③ 늦은 완료·fallback 교체가 눈에 띄는 CLS를 만들지 않는가 — ✅ 충족

- 카테고리 변경 시나리오: ✅ Round 0 재측정에서 `LayoutShift` **0건**(수정 전 1건, score 0.035).
- 페이지 이동 시나리오: ✅ 관측된 시프트가 모두 `hadRecentInput: true`(클릭 직후)라 공식 CLS에서 제외.
- 검색어 입력 시나리오: ✅ Round 3(스크롤 맨 위) · Round 5(`scroll: false`로 그리드가 뷰포트 안) 두 조건 모두 `LayoutShift` **0건**. Round 5에서 **주된 이유가 Round 0의 리키잉 덕분에 카드가 이동 자체를 하지 않기 때문**임이 분리 확인됐다(상세·잔여 리스크는 "Round 5" 절 참고).

---

## 마무리 — Part 2가 실제로 다룬 것

### 완료조건은 전부 충족했다

Part 2의 완료조건에는 **성능 점수 기준이 없다.** "여섯 화면이 녹화에서 구분되는가 / 조건을 연속으로 바꿔도 active query와 화면이 일치하는가 / 늦은 완료·fallback 교체가 눈에 띄는 CLS를 만들지 않는가" 세 가지이며, 위 "완료조건 점검"에서 확인했듯 모두 충족했다. 사용자가 직접 잰 Lighthouse에서도 **CLS 0.000(score 1.00)**으로, 이 문서가 가장 많이 다룬 CLS는 지표로도 깨끗하다.

### 점수가 낮았던 원인은 Part 2 밖에 있었다

측정 도중 Performance **77점**이 나와 스켈레톤(Round 7)을 의심했지만, 원인은 다른 곳이었다.

| 지표        | 값      | score    | 가중치 |
| ----------- | ------- | -------- | ------ |
| LCP         | 2,580ms | 0.44     | 25     |
| Speed Index | 2,279ms | 0.50     | 10     |
| FCP         | 1,390ms | 0.63     | 10     |
| **TBT**     | 0ms     | **1.00** | 30     |
| **CLS**     | 0.000   | **1.00** | 25     |

**Part 2가 다룬 영역(CLS·TBT)은 만점**이고 감점은 전부 이미지 로딩에서 나왔다. `network-requests`를 보면 hero 163.7KB를 받는 데 **2,460ms**가 걸렸는데(desktop 프리셋 대역폭이면 약 130ms면 될 양), **hero 다운로드 중간에 카드 이미지 5장이 끼어들어 대역폭을 나눠 쓴 것**이 원인이었다.

**스켈레톤은 원인이 아니었다.** 오히려 `PageHeading`이 fallback에서 먼저 렌더되어 hero가 **619ms에 출발**하고 카드는 1,205ms에 합류했다 — 스켈레톤이 hero에 약 585ms 헤드스타트를 준 셈이다. 같은 조건에서 `loading.tsx`만 바꿔가며 비교한 대조 실험(AI CLI 참고 측정)에서도 스켈레톤 쪽이 나았다(LCP 700→582ms, SI 436→291ms).

원래는 이미지 로딩이 Part 1 주제라 관찰 기록으로만 남기려 했으나, **"배너를 먼저 보여준다"는 선택을 해 Round 10에서 실제로 고쳤다**(카드 이미지 `fetchPriority="low"`, 홈·상품목록 공통). 참고 측정에서 hero 네트워크 구간이 2,460ms → 39ms로 줄었다.

### 측정하지 않고 남긴 것

| 라운드                    | 상태                                                       | 판단                                                                         |
| ------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Round 8 (이미지 캐시 TTL) | **철회** — 코드 되돌림                                     | 진단이 틀렸고(실제 원인은 Round 10) 효과 측정도 없어 기본값으로 복귀         |
| Round 9 (Pagination 자리) | 레이아웃 좌표 1px 일치는 확인, Performance 트레이스 미실시 | 사용자 Lighthouse에서 CLS 0.000·score 1.00이 나와 완료조건 ③은 충족으로 판단 |
| Round 10 (배너 우선)      | AI CLI 참고 측정만                                         | 공식 확인은 사용자 브라우저 측정 필요                                        |

### 이 Part에서 남는 교훈

1. **측정 프로토콜에 "이미지 변환 캐시 상태"가 빠져 있었다.** URL·포트·throttling은 고정해왔지만 캐시는 통제하지 않아, 라운드 간 LCP 비교가 오염됐고 한 번은 잘못된 결론("스켈레톤이 432ms 악화")까지 냈다가 철회했다. 변환 유무의 차이가 232ms vs 1.6ms인 만큼, 캐시 상태는 반드시 명시해야 한다.
2. **지표가 안 움직이는 게 정상인 작업이 있다.** Part 2 변경 대부분은 cold load 지표에 반영되지 않는다 — 측정의 목적이 "개선 증명"이 아니라 "회귀 없음 확인"이었다.
3. **CLS 점수만 보면 놓치는 문제가 있다.** 갱신 실패로 목록이 통째로 사라지는 회귀는 그리드가 화면 밖이라 CLS 0으로 잡혔다. 점수가 아니라 화면을 봐야 발견되는 문제였다.
