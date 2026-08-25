# Part 1 — Hero LCP 개선 측정 결과

> `/products`의 병목은 검색·카테고리·정렬·페이지 로직이 아니라 두 페이지가 공유하는 hero 이미지다([Part 0](../week07-part0/README.md)에서 Slow 4G로 쿼리 조건을 실제 연속 조작해 확인). Part 1은 그 이미지 하나만 고치는 작업이라, 측정은 `/`(홈)·`/products`(쿼리 없는 기본) 두 URL로 고정한다.

- **변경 범위(Round 0, 합의된 3가지)**: ① `next/image`로 전환 ② 프리로드 요청에 `fetchpriority=high` 적용 ③ 실제 표시 크기·viewport에 맞게 `next/image`가 원본에서 서버 사이드로 리사이즈하도록 함(별도 리사이즈 파일을 만들지 않음) — 이후 Round 1–4에서 `sizes`·`deviceSizes`·AVIF·렌더링 경계·상품 카드 이미지까지 추가로 다듬었다(변경 파일은 각 라운드 섹션에 명시)
- **Before/After commit SHA**: Before = `61214ccabb448fa70910566295958d78036f8e87`(Part 0, raw `<img>`) → After(Round 0–headerfix) = `25df6c55e49ea0550180732a84e218b0f8a36ea9` → 최종(Round 4까지) = `c56bfddc`
- **눈으로 보는 리포트(Round 0, 이 커밋에 포함됨)**: [`./lighthouse/round0/1. lighthouse html 문서/home/run-1.html`](<./lighthouse/round0/1. lighthouse html 문서/home/run-1.html>), [`./lighthouse/round0/1. lighthouse html 문서/products/run-1.html`](<./lighthouse/round0/1. lighthouse html 문서/products/run-1.html>) — run-2–5는 raw 값이 표에 이미 있어 대표로 run-1만 포함(이후 라운드 리포트는 각 섹션에 링크)
- **문서 진행 순서**: Before 기준선(Part 0) → `fetchpriority` 확인 → Round 0(전송 크기 변화 누적표) → 관찰-가설-반증-변경 → Round 1(`sizes`) → Round 2(`deviceSizes` DPR2) → Round 3(AVIF) → LCP breakdown → 최종 결론 → 남은 gap(Header/h1) → `<h2>` 유지 결정 → Round 4(상품 카드 이미지) → 사용자 직접 녹화 filmstrip

---

## Before 기준선 — Part 0에서 가져온 `/`·`/products` 결과

Part 1의 Before는 별도로 다시 재지 않고 [Part 0 문서](../week07-part0/README.md)에서 그대로 가져온다. Part 0에 있던 AI CLI 측정 수치는 이후 공식 재측정으로 대체되어 문서에서 제거됐고, 아래는 사용자가 Slow 4G로 직접 잰 기록이다.

### 사용자 직접 측정 — Slow 4G 실측(DevTools Performance 패널, 실제 DPR1)

- **홈(`/`) 하드 리로드**: FCP 1,351.7ms, hero는 47.6초 녹화 내내 공식 LCP 후보로 갱신되지 않음(progressive JPEG로 서서히 채워지다 44.9초 시점 육안상 거의 완료) — [Part 0 filmstrip](../week07-part0/README.md#filmstrip--홈-slow-4g) 참고.
- **`/products` 쿼리 인터랙션**: category·sort·q·page를 실제로 조작해도 위 Lighthouse 결론과 다른 동작 없음 — [Part 0 filmstrip](../week07-part0/README.md#filmstrip--상품-목록products-slow-4g) 참고.

---

## `fetchpriority=high` 적용 확인 — Lighthouse `lcp-discovery-insight` 오디트

과제가 요구한 "이미지 프리로드 요청에 `fetchpriority=high` 적용"이 실제로 됐는지, curl로 렌더링된 HTML을 직접 보는 것과 Lighthouse 오디트 두 가지로 확인했다.

- **curl로 본 실제 HTML**:
  - `<link rel="preload" as="image" imageSrcSet="/_next/image?url=%2Fimages%2Fweek-07%2Fhero-original.jpg&w=640&q=75 640w, ... &w=3840&q=75 3840w" imageSizes="100vw" fetchPriority="high"/>`
  - `<img alt="" fetchPriority="high" decoding="async" data-nimg="fill" ... srcSet="...hero-original.jpg&w=640..., ...&w=1920..., ...&w=3840..." src="/_next/image?url=%2Fimages%2Fweek-07%2Fhero-original.jpg&w=3840&q=75"/>` — `src`는 srcset 폴백용으로 항상 최대 크기가 찍히고, 실제로 브라우저가 받는 건 `sizes="100vw"`와 뷰포트에 맞춰 srcset에서 고른 파일이다
  - `/products`도 동일하게 `fetchPriority="high"`가 img·preload link 양쪽에 확인됨
- **Lighthouse `lcp-discovery-insight` 오디트(데스크톱, run-1)**:

  | 체크 항목                                     | 결과           |
  | --------------------------------------------- | -------------- |
  | `fetchpriority=high applied`                  | ✅ true        |
  | `Request is discoverable in initial document` | ✅ true        |
  | `LCP resources should not use loading=lazy`   | ✅ true(eager) |

  LCP element로 특정된 노드도 `<img ... fetchpriority="high" ... class="PageHeading-module__..._image">`로, `PageHeading`의 hero 이미지가 맞다.

---

## Round 0 — `next/image` 전환 + `fetchpriority` + 원본 기반 리사이즈

**변경**: 원본(`hero-original.jpg`, 7.5MB, 3840×2160)을 그대로 소스로 두고, raw `<img>` → `next/image`(`fill`+`sizes="100vw"`+`priority`+`fetchPriority="high"`)로 전환해 요청 시점마다 서버가 필요한 크기로 리사이즈·재인코딩하도록 했다. 별도로 미리 리사이즈한 파일을 만들지 않는다.

### 전송 크기 변화 — Round 0–4 누적 (사용자 Lighthouse 리포트 `network-requests` 오디트 기준)

아래는 전부 사용자가 직접 실행한 Lighthouse(`--preset=desktop`)의 `network-requests` 오디트에서 hero 이미지 요청 하나를 뽑은 값이다 — 라운드마다 표를 반복하지 않고 여기 한 표로 모은다. 이 측정 환경은 `screenEmulation.disabled: true`(Lighthouse가 실제 디바이스 값을 그대로 씀)이고, 리포트의 `configSettings.screenEmulation.deviceScaleFactor`가 `1.75`로 기록돼 있다 — 즉 이 표는 실제 DPR 1.75 환경 하나에서 각 라운드가 무엇을 바꿨는지 보여준다(홈·상품목록 모두 같은 `PageHeading` hero 요청이라 값이 동일).

| 상태                                  | 선택된 파일              | transferSize    | 원본 대비 |
| ------------------------------------- | ------------------------ | --------------- | --------- |
| 원본(로컬 파일 크기)                  | `hero-original.jpg`      | 7,545,239 bytes | —         |
| Round 0(`sizes="100vw"`)              | `w=3840` webp            | 409,736 bytes   | 94.6%↓    |
| Round 1(`sizes` 정밀화)               | `w=3840` webp(변화 없음) | 409,736 bytes   | 94.6%↓    |
| Round 2(`deviceSizes`에 2400 추가)    | `w=2400` webp            | 211,652 bytes   | 97.2%↓    |
| Round 3(AVIF 우선 협상)               | `w=2400` avif            | 167,625 bytes   | 97.8%↓    |
| Round 4(hero `deviceSizes` 1800 추가) | `w=2400` avif(변화 없음) | 167,625 bytes   | 97.8%↓    |

- **Round 0→1**: `sizes`를 실제 렌더 폭(1200px)에 맞게 정밀화했지만, 이 환경(DPR 1.75)의 필요 폭은 1200×1.75=2100px다. 당시 `deviceSizes`(`640–1200, 1920, 2048, 3840`)엔 2100을 만족하는 후보가 1920·2048로는 부족해 여전히 3840까지 건너뛰어 파일 크기가 그대로였다 — Round 1의 효과는 이 Lighthouse 환경(DPR 1.75)에는 반영되지 않고, 아래 "사용자 직접 측정 — Round 1"의 Performance 실측(실제 DPR 1 환경)에서 확인된다.
- **Round 1→2**: `deviceSizes`에 2400을 추가하자 이 환경(필요 폭 2100px)에서도 `w=2400`이 선택되며 409,736→211,652 bytes(**48.4%↓**)로 즉시 줄었다.
- **Round 2→3**: 같은 `w=2400`에서 포맷만 webp→avif로 바뀌며 211,652→167,625 bytes(**20.8%↓**) 추가 감소.
- **Round 3→4**: hero의 `deviceSizes` 1800 추가는 DPR 1.25–1.5 구간을 겨냥한 변경이라 이 DPR 1.75 환경에는 영향이 없다(변화 없음이 정상 — Round 4 "원인 1" 참고).

각 라운드의 실제 FCP·LCP ms 값과 CLS는 라운드마다 아래 "사용자 직접 측정 — Round N" 절 표에서 확인한다.

### Round 0 결론

- 합의된 3개 변경(`next/image` 전환, `fetchpriority=high`, 원본에서 서버 사이드 리사이즈) 모두 실제 프로덕션 빌드·HTML·Lighthouse 오디트로 적용 확인됨.
- **별도 리사이즈 파일을 쓰지 않고 원본에서 최적화하는 방식으로 전환**했다 — 리포지토리에 미리 만든 리사이즈 이미지를 유지·관리할 필요가 없고, `next/image`가 요청되는 모든 breakpoint(640–3840w)에 대해 항상 원본으로부터 정확한 해상도를 생성한다.
- **이 시점에 아직 남아있던 것**(이후 라운드에서 순서대로 다룸): 이미지 포맷(AVIF/WebP)·`quality` 조정, DPR 2 대응, `<h2>`→`<h1>` 여부, Part 2(목록 pending/CLS), Part 3(metadata).

### 사용자 직접 측정 — Round 0 상태 재확인(Lighthouse + Performance)

아래는 사용자가 Round 0 코드 상태(`sizes="100vw"`, `deviceSizes`·AVIF·헤더 수정·Round 4는 전부 미적용)에서 직접 Lighthouse·Performance 패널로 측정한 FCP/LCP/CLS 기록이다(위 "전송 크기 변화" 표와 같은 리포트에서 나온 값).

- **측정 시점 코드 상태**: 커밋 `61214cca`(Part 0) 위에 `PageHeading.tsx`만 Round 0 사양(`next/image`+`fill`+`sizes="100vw"`+`priority`+`fetchPriority="high"`)으로 임시 적용 — Round 1–4 미적용
- **측정 일시**: 2026-08-06 UTC 11:46(Performance 트레이스) / 11:48–11:52(Lighthouse)
- **포트**: `localhost:3000`

#### Lighthouse — 홈 (`/`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,390.7     | 4,299.9     | 0.000     |
| 2          | 1,387.7     | 4,290.0     | 0.000     |
| 3          | 1,389.7     | 4,296.6     | 0.000     |
| 4          | 1,391.5     | 4,302.5     | 0.000     |
| 5          | 1,402.3     | 4,337.4     | 0.000     |
| **중앙값** | **1,390.7** | **4,299.9** | **0.000** |
| 최솟값     | 1,387.7     | 4,290.0     | 0.000     |
| 최댓값     | 1,402.3     | 4,337.4     | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round0/1. lighthouse html 문서/home/run-1.html`](<./lighthouse/round0/1. lighthouse html 문서/home/run-1.html>) ~ `run-5.html`

#### Lighthouse — 상품 목록 (`/products?page=2`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,402.9     | 3,838.0     | 0.000     |
| 2          | 1,402.4     | 3,636.7     | 0.000     |
| 3          | 1,401.4     | 3,633.9     | 0.000     |
| 4          | 1,404.3     | 4,404.1     | 0.000     |
| 5          | 1,402.3     | 4,337.4     | 0.000     |
| **중앙값** | **1,402.4** | **3,838.0** | **0.000** |
| 최솟값     | 1,401.4     | 3,633.9     | 0.000     |
| 최댓값     | 1,404.3     | 4,404.1     | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round0/1. lighthouse html 문서/products/run-1.html`](<./lighthouse/round0/1. lighthouse html 문서/products/run-1.html>) ~ `run-5.html`

#### Performance — 홈(`/`) filmstrip (DevTools Performance 패널, Slow 4G, 실제 DPR1)

| 시점      | 스크린샷                                                                                                     | 내용                                           |
| --------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| t=1,347ms | [`lighthouse/round0/2. performance/home/t1347ms.jpg`](<./lighthouse/round0/2. performance/home/t1347ms.jpg>) | 셸 완성(FCP 시점과 근접), hero는 아직 배경색만 |
| t=3,289ms | [`lighthouse/round0/2. performance/home/t3289ms.jpg`](<./lighthouse/round0/2. performance/home/t3289ms.jpg>) | hero progressive 렌더 진행 중                  |
| t=4,582ms | [`lighthouse/round0/2. performance/home/t4582ms.jpg`](<./lighthouse/round0/2. performance/home/t4582ms.jpg>) | 대부분 채워짐                                  |
| t=5,745ms | [`lighthouse/round0/2. performance/home/t5745ms.jpg`](<./lighthouse/round0/2. performance/home/t5745ms.jpg>) | 육안상 완료                                    |
| t=7,501ms | [`lighthouse/round0/2. performance/home/t7501ms.jpg`](<./lighthouse/round0/2. performance/home/t7501ms.jpg>) | 안정 상태(스크롤됨)                            |

실측 FCP 1,356.2ms(트레이스 이벤트 기준) — 위 Lighthouse 중앙값(1,390.7ms)과 자릿수가 일치한다. Part 0의 raw `<img>`(7.5MB, Slow 4G에서 47.6초 넘게 안 끝남)와 달리, Round 0의 `w=3840` 이미지(409KB)는 Slow 4G에서도 5–6초대에 육안상 완료된다 — next/image 전환의 효과가 Slow 4G 조건에서도 확인된다.

#### Performance — 상품 목록(`/products`) filmstrip (DevTools Performance 패널, Slow 4G, 실제 DPR1)

| 시점      | 스크린샷                                                                                                             | 내용                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| t=3,124ms | [`lighthouse/round0/2. performance/products/t3124ms.jpg`](<./lighthouse/round0/2. performance/products/t3124ms.jpg>) | 셸("상품 목록" 타이틀) 완성, hero는 아직 배경색만                                |
| t=3,701ms | [`lighthouse/round0/2. performance/products/t3701ms.jpg`](<./lighthouse/round0/2. performance/products/t3701ms.jpg>) | hero 대부분 채워짐                                                               |
| t=4,946ms | [`lighthouse/round0/2. performance/products/t4946ms.jpg`](<./lighthouse/round0/2. performance/products/t4946ms.jpg>) | 안정                                                                             |
| t=6,460ms | [`lighthouse/round0/2. performance/products/t6460ms.jpg`](<./lighthouse/round0/2. performance/products/t6460ms.jpg>) | 안정 유지                                                                        |
| t=7,166ms | [`lighthouse/round0/2. performance/products/t7166ms.jpg`](<./lighthouse/round0/2. performance/products/t7166ms.jpg>) | 안정 유지(트레이스 뒷부분에 재로드로 보이는 구간이 있어 이 앞부분만 대표로 채택) |

이 트레이스는 `navigationStart`가 잡히지 않아(홈에서 클릭으로 진입한 것으로 추정) 절대 FCP 시각은 계산하지 않았다 — 첫 스크린샷을 기준으로 한 상대 시간이다. LCP 후보는 최종적으로 hero(810,000px²)에서 확정됨을 트레이스 이벤트로 확인했다.

---

## 관찰 사실 → 가설 → 반증 방법 → 최소 변경안 (Part 1 통합)

Round 0 적용 이후 이번 Part에서 조사한 두 가지를 Part 0과 같은 한 표로 정리한다. 개별 배경·재현 과정은 각 섹션(Round 1·2, 남은 gap)에 그대로 남겨두고, 여기서는 표만 모았다.

| 관찰한 사실                                                                                                                                                                  | 원인 가설                                                                                                                                                                                | 반증할 방법                                                                                                                                                                                             | 가장 작은 변경                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next/image` 전환·`fetchpriority=high` 적용 이후에도 이미지가 `sizes` 힌트나 DPR 계산상 실제 필요한 크기보다 큰 변형(`w=1920`, DPR 2 환경에선 `w=3840`)으로 요청되고 있었다. | `sizes="100vw"`가 실제 렌더 폭(1200px)과 다르게 잡혀 있고, 기본 `deviceSizes` 후보 목록엔 DPR 2가 필요로 하는 폭(2400px)에 맞는 값이 없어서 불필요하게 큰 이미지가 선택되고 있는 것이다. | Lighthouse `lcp-discovery-insight`의 `boundingRect`로 실제 렌더 폭을 확인하고, Network 패널에서 실제 요청된 srcset 후보(`w=` 값)를 "렌더 폭×DPR"로 계산한 진짜 필요 폭과 대조해 차이가 있는지 확인한다. | `sizes`를 실제 렌더 폭에 맞게 `(min-width: 1200px) 1200px, 100vw`로 고치고, `images.deviceSizes`에 DPR 2에 맞는 후보(`2400`)를 추가한다 — **Round 1·2에서 검증·적용**                                                                                                             |
| `HomeView.tsx`에서 `PageHeading`(제목·설명)이 `QueryState`의 render-prop 안에 있어, `homeQuery`가 pending인 동안 `Header`만 즉시 보이고 나머지는 전부 `null`로 렌더된다.     | 배너 제목·설명이 홈 API 응답에만 존재하는 진짜 동적 값이라, 페이지 셸의 제목·설명을 그 데이터가 도착해야만 그릴 수 있는 구조로 설계됐기 때문이다.                                        | 배너 텍스트가 실제로 요청마다 달라지는 값인지, 아니면 사실상 고정 문구인지 확인 — 고정 문구라면 API 의존 자체가 불필요했다는 뜻이라 가설이 반증된다.                                                    | **반증 실패, 가설 확정**(배너는 실제 동적 데이터임을 확인). `PageHeading`을 `QueryState` 밖으로 빼서 `Header`처럼 즉시 렌더하고, `title`·`description`은 배너 데이터 도착 전엔 고정 fallback 문구를 보여주다가 데이터가 오면 실제 값으로 교체 — **"남은 gap" 절에서 적용·재측정** |

---

## Round 1 — `sizes`를 실제 렌더 폭에 맞게 정밀화

Round 0은 `sizes="100vw"`로 적용됐었다. Lighthouse `lcp-discovery-insight`의 `boundingRect`를 보면 실제 렌더 폭은 뷰포트(1350px) 전체가 아니라 **1200px**로 제한돼 있었다 — 페이지 레이아웃에 max-width 제약이 있기 때문이다. `sizes="100vw"`는 브라우저에게 "뷰포트 전체 폭"이라고 알려주므로, 실제로는 1200px만 필요한데도 `srcset`에서 그보다 큰 후보가 선택되고 있었다.

**`srcset` 후보 목록과 `sizes`는 서로 다른 역할을 한다.** `srcset`에 나열되는 폭 후보는 `sizes` 값과 무관하게 **Next.js가 기본으로 정해둔 `deviceSizes` 설정값**이라 항상 고정이다 — `next/image`는 이 고정된 후보군으로 `srcset`을 미리 만들어 둔다. `sizes`가 바꾸는 건 이 목록 자체가 아니라 **브라우저가 그중 어떤 걸 실제로 다운로드할지 고르는 계산**이다.

- **변경**: `sizes="100vw"` → `sizes="(min-width: 1200px) 1200px, 100vw"`(`PageHeading.tsx`) — 실제 렌더 폭(최대 1200px)을 정확히 반영.
- 이 변경의 전송 크기·타이밍 효과는 위 "전송 크기 변화" 표와 아래 "사용자 직접 측정 — Round 1"에서 확인한다.

### 사용자 직접 측정 — Round 1 상태 재확인(Lighthouse + Performance)

Round 0와 같은 방식으로, 사용자가 Round 1 코드 상태(`sizes="(min-width: 1200px) 1200px, 100vw"`, `deviceSizes`·AVIF·Round 4·headerfix는 전부 미적용)로 직접 재확인했다.

- **측정 시점 코드 상태**: 커밋 `61214cca`(Part 0) 위에 `PageHeading.tsx`만 Round 0+1 사양으로 임시 적용
- **측정 일시**: 2026-08-06 UTC 12:09(Performance 트레이스) / 12:06–12:11(Lighthouse)
- **포트**: `localhost:3000`

#### Lighthouse — 홈 (`/`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,395.9     | 4,376.5     | 0.000     |
| 2          | 1,403.6     | 4,341.6     | 0.000     |
| 3          | 1,401.4     | 4,334.5     | 0.000     |
| 4          | 1,401.8     | 4,416.0     | 0.000     |
| 5          | 1,392.9     | 4,306.8     | 0.000     |
| **중앙값** | **1,401.4** | **4,341.6** | **0.000** |
| 최솟값     | 1,392.9     | 4,306.8     | 0.000     |
| 최댓값     | 1,403.6     | 4,416.0     | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round1/1. lighthouse html 문서/home/run-1.html`](<./lighthouse/round1/1. lighthouse html 문서/home/run-1.html>) ~ `run-5.html`

#### Lighthouse — 상품 목록 (`/products?sort=price-asc&page=2`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,403.2     | 4,400.3     | 0.000     |
| 2          | 1,403.7     | 4,402.0     | 0.000     |
| 3          | 1,402.6     | 4,398.4     | 0.000     |
| 4          | 1,399.4     | 4,388.0     | 0.000     |
| 5          | 1,402.4     | 4,397.8     | 0.000     |
| **중앙값** | **1,402.6** | **4,398.4** | **0.000** |
| 최솟값     | 1,399.4     | 4,388.0     | 0.000     |
| 최댓값     | 1,403.7     | 4,402.0     | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round1/1. lighthouse html 문서/products/run-1.html`](<./lighthouse/round1/1. lighthouse html 문서/products/run-1.html>) ~ `run-5.html`

**Round 0 사용자 재측정(홈 LCP 중앙값 4,299.9ms)보다도 오히려 조금 높게 나왔다(4,341.6ms)** — Lighthouse 시뮬레이션 기준으로는 `sizes` 정밀화 효과가 보이지 않는다. FCP도 Round 0과 같은 1,390–1,400ms대 이례적 관측치가 이번에도 그대로 재현됐다(이 측정 환경 고유의 특성으로 보임, Round 0 절 참고). Lighthouse만 보면 Round 1의 개선이 안 보이지만, 아래 Performance 실측에서는 뚜렷하게 확인된다 — Lighthouse 시뮬레이션과 실제 브라우저 관측이 갈리는 사례로 남긴다.

#### Performance — 홈(`/`) filmstrip (DevTools Performance 패널, Slow 4G, 실제 DPR1)

| 시점      | 스크린샷                                                                                                     | 내용                                           |
| --------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| t=598ms   | [`lighthouse/round1/2. performance/home/t598ms.jpg`](<./lighthouse/round1/2. performance/home/t598ms.jpg>)   | 셸 완성(FCP 시점과 근접), hero는 아직 배경색만 |
| t=636ms   | [`lighthouse/round1/2. performance/home/t636ms.jpg`](<./lighthouse/round1/2. performance/home/t636ms.jpg>)   | **hero 이미 완전히 로드됨**                    |
| t=896ms   | [`lighthouse/round1/2. performance/home/t896ms.jpg`](<./lighthouse/round1/2. performance/home/t896ms.jpg>)   | 안정                                           |
| t=1,196ms | [`lighthouse/round1/2. performance/home/t1196ms.jpg`](<./lighthouse/round1/2. performance/home/t1196ms.jpg>) | 안정                                           |
| t=2,048ms | [`lighthouse/round1/2. performance/home/t2048ms.jpg`](<./lighthouse/round1/2. performance/home/t2048ms.jpg>) | 안정                                           |

실측 FCP 610.4ms, LCP(hero) **610.4ms**(트레이스 이벤트 기준) — Round 0(FCP 1,356ms, hero 육안상 완료 5.7초)보다 **훨씬 빠르다.** `sizes` 정밀화로 파일이 작아진 효과가 Slow 4G 실측에서 명확하게 드러난다 — Lighthouse 시뮬레이션 표에서는 안 보이던 개선이 실제 브라우저에서는 확인된다.

#### Performance — 상품 목록(`/products`) filmstrip (DevTools Performance 패널, Slow 4G, 실제 DPR1)

| 시점      | 스크린샷                                                                                                             | 내용                                           |
| --------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| t=605ms   | [`lighthouse/round1/2. performance/products/t605ms.jpg`](<./lighthouse/round1/2. performance/products/t605ms.jpg>)   | 셸 완성(FCP 시점과 근접), hero는 아직 배경색만 |
| t=899ms   | [`lighthouse/round1/2. performance/products/t899ms.jpg`](<./lighthouse/round1/2. performance/products/t899ms.jpg>)   | 전환 중                                        |
| t=951ms   | [`lighthouse/round1/2. performance/products/t951ms.jpg`](<./lighthouse/round1/2. performance/products/t951ms.jpg>)   | **hero 이미 완전히 로드됨**                    |
| t=1,451ms | [`lighthouse/round1/2. performance/products/t1451ms.jpg`](<./lighthouse/round1/2. performance/products/t1451ms.jpg>) | 안정                                           |
| t=2,101ms | [`lighthouse/round1/2. performance/products/t2101ms.jpg`](<./lighthouse/round1/2. performance/products/t2101ms.jpg>) | 안정                                           |

실측 FCP 618.2ms, LCP(hero) **909.9ms** — Round 0(hero 육안상 완료 ≈4.9–6.5초대)보다 대폭 빨라졌다. 이 트레이스는 이후 구간(약 6.8초 지점)에 더 작은 LCP 후보(89,600px²)가 추가로 잡히는 등 후속 활동이 관찰됐으나, 첫 로드 사이클(0–2.2초)만 대표로 채택했다.

---

## Round 2 — DPR 2 환경의 srcset 후보 보강 (`deviceSizes`에 2400 추가)

실제 DPR 2(레티나) 브라우저에서 Chrome DevTools Network 패널을 확인해보니, Round 1 이후에도 `w=1200`이 아니라 `w=3840`이 요청되고 있었다. `sizes`가 알려주는 건 CSS 표시 폭(1200px)뿐이고, 브라우저는 여기에 DPR을 곱해 실제 필요한 픽셀 수를 계산한다 — DPR 2면 1200×2=2400px가 필요한데, 당시 `srcset` 후보 목록(Next.js 기본 `deviceSizes`: 640/750/828/1080/1200/1920/2048/3840)엔 2400을 만족하는 값이 1920·2048로는 부족해 3840까지 건너뛰고 있었다.

- **변경**: `next.config.ts`의 `images.deviceSizes`에 `2400`을 추가 — `[640, 750, 828, 1080, 1200, 1800, 1920, 2048, 2400, 3840]`(1800은 Round 4에서 추가). `2400 = 1200px(실제 렌더 폭) × 2(DPR)`로 정확히 맞아떨어지는 값이라, DPR 2 환경에서 화질 손실 없이 딱 필요한 만큼만 받게 된다.
- 이 변경의 실제 전송 크기 효과(409,736→211,652 bytes, 48.4%↓)는 위 "전송 크기 변화" 표에서 이미 확인했다 — 이 세션의 실측 환경 자체가 DPR 1.75라, 사용자 Lighthouse 재측정이 곧 "DPR 2에 가까운 환경에서의 Before/After" 역할을 겸한다.

### Round 2 결론

- DPR 2 환경에서 hero 이미지 전송 크기가 즉시 48.4% 추가로 줄었다 — 정확히 DPR 1.0인 환경에서는 여전히 `w=1200`이 선택되므로 영향 없음(deviceSizes 후보가 하나 늘었을 뿐, 필요 폭 1200px엔 이미 정확히 맞는 후보가 있어 선택 로직 자체가 그대로다).
- 이번 발견은 Lighthouse desktop 프리셋을 DPR 1로 강제 고정해서 실행하면 못 잡아내는 문제였다 — 실제 DPR(1.75–2)이 반영되는 이 세션의 측정 환경(`screenEmulation.disabled`)이라 드러났다.

### 사용자 직접 측정 — Round 2 상태 재확인(Lighthouse + Performance)

Round 0·1과 같은 방식으로, 사용자가 Round 2 코드 상태(`deviceSizes`에 2400 추가, AVIF·Round 4·headerfix는 전부 미적용)로 직접 재확인했다.

- **측정 시점 코드 상태**: 커밋 `61214cca`(Part 0) 위에 `PageHeading.tsx`(Round 0+1 사양) + `next.config.ts`(Round 2 `deviceSizes` 2400 추가)만 임시 적용
- **측정 일시**: 2026-08-06 UTC 12:22(Performance 트레이스) / 12:20–12:24(Lighthouse)
- **포트**: `localhost:3000`

#### Lighthouse — 홈 (`/`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,387.8     | 3,161.7     | 0.000     |
| 2          | 1,389.4     | 3,164.0     | 0.000     |
| 3          | 1,388.5     | 3,162.8     | 0.000     |
| 4          | 1,387.9     | 3,161.9     | 0.000     |
| 5          | 1,388.4     | 3,162.7     | 0.000     |
| **중앙값** | **1,388.4** | **3,162.7** | **0.000** |
| 최솟값     | 1,387.8     | 3,161.7     | 0.000     |
| 최댓값     | 1,389.4     | 3,164.0     | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round2/1. lighthouse html 문서/home/run-1.html`](<./lighthouse/round2/1. lighthouse html 문서/home/run-1.html>) ~ `run-5.html`

#### Lighthouse — 상품 목록 (`/products?page=2`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,391.4     | 3,202.9     | 0.000     |
| 2          | 1,396.6     | 3,213.2     | 0.000     |
| 3          | 1,392.8     | 2,705.6     | 0.000     |
| 4          | 1,391.2     | 3,166.8     | 0.000     |
| 5          | 1,398.7     | 3,178.0     | 0.000     |
| **중앙값** | **1,392.8** | **3,178.0** | **0.000** |
| 최솟값     | 1,391.2     | 2,705.6     | 0.000     |
| 최댓값     | 1,398.7     | 3,213.2     | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round2/1. lighthouse html 문서/products/run-1.html`](<./lighthouse/round2/1. lighthouse html 문서/products/run-1.html>) ~ `run-5.html`

**이번엔 Lighthouse 시뮬레이션에서도 뚜렷한 개선이 보인다** — 홈 LCP 중앙값이 Round 1(4,341.6ms) → Round 2(3,162.7ms)로 **27.2%↓**, 상품목록도 4,398.4ms → 3,178.0ms로 **27.7%↓**. 이 측정 환경의 실제 DPR이 1.75로 2에 가까워서(위 "전송 크기 변화" 표와 같은 이유) `deviceSizes`에 2400을 추가한 효과가 Lighthouse 표에도 그대로 반영된 것으로 보인다 — Round 1에서는 시뮬레이션에 안 보이던 개선이 Round 2에서는 보인다는 점이 흥미롭다. FCP는 여전히 1,387–1,398ms대 이례적 관측치(Round 0·1과 동일 패턴).

#### Performance — 홈(`/`) filmstrip (DevTools Performance 패널, Slow 4G, 실제 DPR1)

| 시점      | 스크린샷                                                                                                     | 내용                                           |
| --------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| t=605ms   | [`lighthouse/round2/2. performance/home/t605ms.jpg`](<./lighthouse/round2/2. performance/home/t605ms.jpg>)   | 셸 완성(FCP 시점과 근접), hero는 아직 배경색만 |
| t=628ms   | [`lighthouse/round2/2. performance/home/t628ms.jpg`](<./lighthouse/round2/2. performance/home/t628ms.jpg>)   | **hero 이미 완전히 로드됨**                    |
| t=904ms   | [`lighthouse/round2/2. performance/home/t904ms.jpg`](<./lighthouse/round2/2. performance/home/t904ms.jpg>)   | 안정                                           |
| t=1,202ms | [`lighthouse/round2/2. performance/home/t1202ms.jpg`](<./lighthouse/round2/2. performance/home/t1202ms.jpg>) | 안정                                           |
| t=2,243ms | [`lighthouse/round2/2. performance/home/t2243ms.jpg`](<./lighthouse/round2/2. performance/home/t2243ms.jpg>) | 안정                                           |

실측 FCP 619.0ms, LCP(hero) **619.0ms** — Round 1(FCP 610.4ms, LCP 610.4ms)과 사실상 동일하다. 이 트레이스는 `hostDPR: 1`로 기록돼 있어(Lighthouse 쪽에서 추정한 실제 DPR ~1.75-2와는 다른 환경/세션으로 보임), DPR 1 기준으로는 Round 1에서 이미 `w=1200`이 선택되고 있었으므로 Round 2(`deviceSizes` 2400 추가)의 영향을 받지 않는 게 정상이다 — 본문의 "정확히 DPR 1인 환경엔 영향 없음" 결론과 일치한다.

#### Performance — 상품 목록(`/products`) filmstrip (DevTools Performance 패널, Slow 4G, 실제 DPR1)

| 시점      | 스크린샷                                                                                                             | 내용                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| t=8ms     | [`lighthouse/round2/2. performance/products/t8ms.jpg`](<./lighthouse/round2/2. performance/products/t8ms.jpg>)       | `loading.tsx` fallback("불러오는 중입니다…") |
| t=602ms   | [`lighthouse/round2/2. performance/products/t602ms.jpg`](<./lighthouse/round2/2. performance/products/t602ms.jpg>)   | **hero 이미 완전히 로드됨**                  |
| t=1,054ms | [`lighthouse/round2/2. performance/products/t1054ms.jpg`](<./lighthouse/round2/2. performance/products/t1054ms.jpg>) | 안정                                         |
| t=1,640ms | [`lighthouse/round2/2. performance/products/t1640ms.jpg`](<./lighthouse/round2/2. performance/products/t1640ms.jpg>) | 안정                                         |
| t=2,162ms | [`lighthouse/round2/2. performance/products/t2162ms.jpg`](<./lighthouse/round2/2. performance/products/t2162ms.jpg>) | 안정                                         |

이 트레이스는 홈에서 카테고리 링크 클릭으로 진입한 소프트 내비게이션이라(`navigationStart` 미기록, 첫 `/api/products` 관련 요청 시점을 t=0으로 삼음) 절대 FCP는 없지만, LCP(hero, 810,000px²)가 요청 시작 후 **약 615.6ms**만에 확정됨을 트레이스 이벤트로 확인했다 — Round 1과 비슷한 수준으로 빠르다(DPR 1 환경이라 Round 2 변경의 영향 밖).

---

## Round 3 — AVIF 우선 협상 (`images.formats`)

WebP보다 더 작은 AVIF를 지원 브라우저에 우선 제공하도록 설정을 바꿨다.

- **변경**: `next.config.ts`의 `images.formats`에 `['image/avif', 'image/webp']` 추가 — AVIF를 지원하는 브라우저(`Accept` 헤더에 `image/avif` 포함)에는 AVIF를, 지원하지 않는 브라우저에는 자동으로 WebP나 원본으로 폴백한다.
- 같은 해상도(`w=2400`, 이 환경 기준)에서 webp(211,652 bytes) → avif(167,625 bytes)로 **20.8%** 추가로 줄었다 — 위 "전송 크기 변화" 표 참고.
- 미지원 브라우저는 `Accept` 헤더 협상으로 자동 폴백되므로 별도 분기 코드 없이 안전하게 적용 가능.
- 원본(7.5MB) 대비 최종 전송 크기 감소율은 **97.8%**(7,545,239→167,625 bytes)까지 누적됨.

### 사용자 직접 측정 — Round 3 상태 재확인(Lighthouse + Performance)

Round 0–2와 같은 방식으로, 사용자가 Round 3 코드 상태(AVIF 우선 협상 추가, Round 4·headerfix는 미적용)로 직접 재확인했다.

- **측정 시점 코드 상태**: 커밋 `61214cca`(Part 0) 위에 `PageHeading.tsx`(Round 0+1 사양) + `next.config.ts`(Round 2+3: `deviceSizes` 2400 + AVIF)만 임시 적용
- **측정 일시**: 2026-08-06 UTC 12:34(Performance 트레이스) / 12:32–12:36(Lighthouse)
- **포트**: `localhost:3000`

#### Lighthouse — 홈 (`/`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,388.5     | 2,882.8     | 0.000     |
| 2          | 1,387.7     | 2,881.5     | 0.000     |
| 3          | 1,387.0     | 2,880.5     | 0.000     |
| 4          | 1,388.4     | 2,882.7     | 0.000     |
| 5          | 1,388.0     | 2,882.0     | 0.000     |
| **중앙값** | **1,388.0** | **2,882.0** | **0.000** |
| 최솟값     | 1,387.0     | 2,880.5     | 0.000     |
| 최댓값     | 1,388.5     | 2,882.8     | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round3/1. lighthouse html 문서/home/run-1.html`](<./lighthouse/round3/1. lighthouse html 문서/home/run-1.html>) ~ `run-5.html`

#### Lighthouse — 상품 목록 (`/products?page=2`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,397.2     | 3,143.7     | 0.000     |
| 2          | 1,397.4     | 3,144.0     | 0.000     |
| 3          | 1,389.5     | 2,884.2     | 0.000     |
| 4          | 1,389.6     | 2,884.3     | 0.000     |
| 5          | 1,394.3     | 3,137.1     | 0.000     |
| **중앙값** | **1,394.3** | **3,137.1** | **0.000** |
| 최솟값     | 1,389.5     | 2,884.2     | 0.000     |
| 최댓값     | 1,397.4     | 3,144.0     | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round3/1. lighthouse html 문서/products/run-1.html`](<./lighthouse/round3/1. lighthouse html 문서/products/run-1.html>) ~ `run-5.html`

**Round 2 대비 계속 줄었다** — 홈 LCP 중앙값 3,162.7ms(Round2) → 2,882.0ms(Round3), **8.9%↓**. AVIF가 같은 해상도에서 WebP보다 파일이 작다는 본문 결론과 방향이 일치한다. FCP는 여전히 1,387–1,397ms대 이례적 관측치(Round 0–2와 동일 패턴, 이 측정 환경 고유 특성으로 보임).

#### Performance — 홈(`/`) filmstrip (DevTools Performance 패널, Slow 4G, 실제 DPR1)

| 시점      | 스크린샷                                                                                                     | 내용                                           |
| --------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| t=624ms   | [`lighthouse/round3/2. performance/home/t624ms.jpg`](<./lighthouse/round3/2. performance/home/t624ms.jpg>)   | 셸 완성(FCP 시점과 근접), hero는 아직 배경색만 |
| t=646ms   | [`lighthouse/round3/2. performance/home/t646ms.jpg`](<./lighthouse/round3/2. performance/home/t646ms.jpg>)   | **hero 이미 완전히 로드됨**                    |
| t=913ms   | [`lighthouse/round3/2. performance/home/t913ms.jpg`](<./lighthouse/round3/2. performance/home/t913ms.jpg>)   | 안정                                           |
| t=1,198ms | [`lighthouse/round3/2. performance/home/t1198ms.jpg`](<./lighthouse/round3/2. performance/home/t1198ms.jpg>) | 안정                                           |
| t=2,277ms | [`lighthouse/round3/2. performance/home/t2277ms.jpg`](<./lighthouse/round3/2. performance/home/t2277ms.jpg>) | 안정                                           |

실측 FCP 638.8ms, LCP(hero) **638.8ms** — Round 1(610.4ms)·Round 2(619.0ms)와 같은 수준으로 여전히 매우 빠르다. DPR 1 환경(`hostDPR:1`)이라 AVIF 전환의 파일 크기 절감(같은 해상도 기준 20.8%)이 이미 서브초 단위인 로드 시간에는 육안상 차이를 만들 정도는 아니었다.

#### Performance — 상품 목록(`/products`) filmstrip (DevTools Performance 패널, Slow 4G, 실제 DPR1)

| 시점      | 스크린샷                                                                                                             | 내용                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| t=979ms   | [`lighthouse/round3/2. performance/products/t979ms.jpg`](<./lighthouse/round3/2. performance/products/t979ms.jpg>)   | `loading.tsx` fallback("불러오는 중입니다…") |
| t=2,224ms | [`lighthouse/round3/2. performance/products/t2224ms.jpg`](<./lighthouse/round3/2. performance/products/t2224ms.jpg>) | **hero 이미 완전히 로드됨**                  |
| t=2,590ms | [`lighthouse/round3/2. performance/products/t2590ms.jpg`](<./lighthouse/round3/2. performance/products/t2590ms.jpg>) | 안정                                         |
| t=2,752ms | [`lighthouse/round3/2. performance/products/t2752ms.jpg`](<./lighthouse/round3/2. performance/products/t2752ms.jpg>) | 안정                                         |
| t=2,928ms | [`lighthouse/round3/2. performance/products/t2928ms.jpg`](<./lighthouse/round3/2. performance/products/t2928ms.jpg>) | 안정                                         |

LCP(hero, 810,000px²)가 이미지 요청 시작 후 **약 2,237ms**만에 확정됨 — 홈(639ms)보다 훨씬 느리다. 상품목록 페이지는 hero 외에도 여러 상품 그리드 이미지를 동시에 요청하느라 Slow 4G 대역폭을 나눠 쓰는 게 원인으로 보인다(Part 1 "LCP breakdown"의 `Resource load delay` 관찰과 같은 맥락 — 상품목록만 유독 지연이 크다는 패턴이 여기서도 재확인됨).

---

## LCP breakdown (Lighthouse `lcp-breakdown-insight`, Round 4 사용자 리포트 run-1 기준)

`lcp-breakdown-insight`는 로컬에서 실제로 캡처된 트레이스의 관측값을 그대로 보여주는 반면, 헤드라인 LCP는 그 트레이스를 회선 프로필로 재계산(Lantern 시뮬레이션)한 값이다 — 그래서 이 섹션의 절대값을 헤드라인 LCP와 초 단위로 직접 비교하지 않는다(Part 0에서 설명한 것과 같은 구조). 대신 과제가 요구하는 "서버 응답 대기 / 이미지 요청 시작 대기 / 이미지 전송 / 화면에 그려질 때까지"의 4단계 구간이 전체에서 차지하는 비중을 관찰하는 데 쓴다. 아래는 사용자가 직접 실행한 Round 4 Lighthouse 리포트(`round4/1. lighthouse html 문서/{home,products}/run-1.html`)에 실제로 담긴 값이다.

| 구간                   | 의미                  | 홈            | 상품목록      |
| ---------------------- | --------------------- | ------------- | ------------- |
| Time to first byte     | 서버 응답 대기        | 4.2ms         | 10.9ms        |
| Resource load delay    | 이미지 요청 시작 대기 | 582.1ms       | 609.3ms       |
| Resource load duration | 이미지 전송           | 2,684.3ms     | 2,560.1ms     |
| Element render delay   | 화면에 그려질 때까지  | 41.3ms        | 46.1ms        |
| **합계(로컬 관측치)**  |                       | **3,311.8ms** | **3,226.4ms** |

**관찰 1**: `Resource load duration`(이미지 전송)이 두 페이지 모두 2.5–2.7초로 압도적으로 크다 — 이 세션의 측정 환경이 실제 DPR 1.75라 `w=2400` avif(167,625 bytes)를 매번 서버가 그 자리에서 리사이즈·재인코딩해서 내려주는 처리 시간이 포함되기 때문으로 보인다.

**관찰 2**: 상품목록의 `Resource load delay`(이미지 요청 시작 대기)가 홈보다 27ms 정도 더 크다 — Part 0에서부터 반복 관찰된 "상품목록만 유독 요청 시작이 늦다"는 패턴과 방향은 같지만, 이 세션(실제 DPR 환경)에서는 그 격차가 Part 0 시점(약 530ms 차이)보다 훨씬 작다. 왜 격차 자체가 줄었는지는 이번 조사에서 원인을 확정하지 못했다 — Part 2 작업 시 함께 확인이 필요하다.

---

## 최종 결론 — 어떤 방식이 더 나은가

### 1. 처음 시도: 미리 리사이즈한 파일(1200×675)을 별도로 만들어 쓰는 방식

처음에는 실제 표시 크기(16:9, 1200×675)에 맞춰 원본을 미리 잘라둔 별도 파일(`hero-1200x675.jpg`, 214KB)을 만들어 `next/image`에 물리는 방식으로 시작했다(Round 0의 최초 버전). Before 대비 LCP를 크게 줄이는 데는 성공했지만, 이 방식은 구조적인 한계가 있었다:

- **DPR 2(레티나) 화면에 대응할 수 없다** — 소스 파일 자체가 이미 1200px로 고정돼 있어서, 실제로 2400px가 필요한 레티나 화면에서도 브라우저가 더 선명한 버전을 요청할 방법이 없다. 결과적으로 레티나 사용자에게는 저해상도 이미지가 그대로 업스케일되어 흐릿하게 보인다.
- **리포지토리에 리사이즈 자산을 별도로 관리해야 한다** — 표시 크기가 바뀌거나 새 breakpoint가 필요해지면 파일을 다시 만들어야 하고, 원본과 리사이즈본 중 어느 게 최신인지 추적하는 부담이 생긴다.
- `srcset`에 여러 후보를 만들어도 전부 같은 1200px 소스에서 나온 것이라 반응형 대응이 사실상 무의미하다.

즉 데스크톱 DPR 1, 1200px라는 딱 하나의 시나리오에서는 가장 작은 파일을 주지만, 그 외 모든 시나리오(레티나 등)에서 화질이 깨지거나 아예 대응이 안 되는 방식이었다.

### 2. 현재 방식: 원본을 그대로 두고 `next/image`가 서버에서 리사이즈

원본(`hero-original.jpg`, 7.5MB, 3840×2160)을 소스로 그대로 두고, `next/image`가 요청 시점마다 필요한 크기로 직접 리사이즈·재인코딩하도록 전환했다(Round 0). 여기에 Round 1–3에서 3가지를 추가로 다듬었다:

- `sizes`를 실제 렌더 폭(1200px)에 맞게 `(min-width: 1200px) 1200px, 100vw`로 정확히 지정해, DPR 1에서 불필요하게 큰 후보(`w=1920`)가 선택되던 걸 `w=1200`으로 바로잡았다(Round 1).
- `images.deviceSizes`에 `2400`(=1200px×DPR 2)을 추가해, 레티나 화면에서 `w=3840`까지 건너뛰던 걸 `w=2400`으로 바로잡았다(Round 2) — 화질 손실 없이 전송량 48.4% 절감.
- `images.formats`에 AVIF를 우선순위로 추가해, 같은 해상도(`w=2400`)에서 WebP보다 20.8% 더 작은 파일을 지원 브라우저에 제공했다(Round 3, 미지원 브라우저는 자동 폴백).

이 방식은 어떤 뷰포트·DPR 조합이 와도 항상 "필요한 만큼만, 화질 손실 없이" 대응한다 — 관리해야 할 이미지 자산도 원본 파일 하나뿐이다.

### 3. 결론

**원본 기반 방식이 더 낫다.** 사전 리사이즈 파일은 특정 조건 하나(1200px, DPR 1)에서만 최소 용량을 주지만, 그 조건을 벗어나면 대응이 안 되거나 화질이 깨진다. 반면 원본 기반 방식은 매 요청마다 실제 조건(뷰포트·DPR·지원 포맷)에 맞춰 결과를 동적으로 생성하기 때문에 어떤 실사용 환경에서도 최선의 결과를 보장한다. Round 2에서 발견한 DPR 2 과다 전송 문제 — 사전 리사이즈 방식이었다면 애초에 존재 자체를 몰랐을 문제 — 가 그 근거다. 다만 매 요청마다 서버가 리사이즈·재인코딩을 수행해야 하므로(위 LCP breakdown의 `Resource load duration` 참고), 순수 정적 파일 서빙보다는 서버 처리 비용이 든다는 트레이드오프가 있다 — `minimumCacheTTL` 등으로 결과물을 캐싱해 반복 요청 비용을 낮추는 건 Next.js가 기본으로 해준다.

---

## 남은 gap — Header·h1·설명이 홈 데이터 대기 중 함께 막힘

1단계 요구사항 중 "홈 데이터를 기다리는 동안 Header, 하나의 `h1`, 페이지 설명까지 함께 막히지 않도록 현재 데이터 소유권에 맞는 렌더링 경계를 선택해요"는 Round 0–3(이미지 관련 변경) 범위 밖으로 남아있었다. 관찰-가설-반증-변경 표는 위 "관찰 사실 → 가설 → 반증 방법 → 최소 변경안" 통합 표의 두 번째 행 참고.

**참고**: 정상 시나리오(`scenario=slow` 아님)에서는 서버가 `prefetchQuery`로 미리 데이터를 채워 HTML에 내려주므로(`HydrationBoundary`), 클라이언트가 마운트되는 시점엔 이미 `homeQuery.data`가 존재해 이 gap이 실제로 드러나지 않는다 — `scenario=slow`(1.5초 지연)처럼 응답이 늦어지는 경우에만 관찰된다.

### 적용 및 재측정

`HomeView.tsx`에서 `PageHeading` 호출을 `QueryState` 밖, `Header` 바로 다음으로 옮기고, `title`/`description`을 `homeQuery.data?.banner.title ?? '다양한 상품을 만나보세요'` 형태로 바꿨다. 이 변경은 Round 4의 "사용자 직접 측정" 코드 상태(`HomeView.tsx` 포함, 커밋 `c56bfddc` 기준)에 이미 포함돼 있어 별도 표로 다시 재지 않는다 — 위 "사용자 직접 측정 — Round 4"의 수치가 이 변경까지 반영된 최종 상태다.

**측정 흔들림 범위 안이라 유의미한 차이는 없을 것으로 예상한다.** 이유는 위 "참고"에 이미 적은 것과 같다 — `(home)/page.tsx`가 `await prefetchQuery`로 문서(document) 응답 자체를 홈 데이터가 준비될 때까지 기다린 뒤에야 HTML을 내려보내기 때문에, `PageHeading`이 `QueryState` 안에 있든 밖에 있든 브라우저가 받는 첫 HTML에는 이미 실제 배너 데이터가 채워져 있다. 즉 **cold load(Lighthouse가 측정하는 시나리오) 기준으로는 이 gap이 애초에 노출되지 않는 구조**다 — 이번 변경은 Lighthouse 수치를 개선하기 위한 게 아니라, `scenario=slow`처럼 실제로 데이터가 늦게 도착하는 경우(예: 캐시 미스 후 클라이언트 재요청)에 대비한 구조적 안전장치다.

### 결론

- 코드 변경은 요구사항("Header·h1·설명이 함께 안 막히게 렌더링 경계 선택")을 구조적으로 충족시켰다.
- 다만 이 앱의 현재 아키텍처(서버 `prefetchQuery` + `HydrationBoundary`)에서는 cold load 기준으로 이 gap이 원래도 관측되지 않으므로, Lighthouse LCP/FCP 수치에는 유의미한 변화가 없을 것으로 예상된다(구조상 이유는 위 설명 참고 — cold load 자체를 겨냥한 변경이 아니라서 별도 재측정하지 않았다).
- `<h2>` 유지 결정(`h1` 아님)은 이 변경과 무관하게 그대로 남아있다 — 아래 "`<h2>` 유지 결정" 섹션 참고.

---

## `<h2>` 유지 결정 — `h1`이 아닌 이유

`PageHeading`의 페이지 제목(`{title}`)은 `<h1>`이 아니라 `<h2>`로 유지한다. `PageHeading`은 애초에 홈과 상품 목록 두 페이지의 히어로 영역을 하나의 공통 컴포넌트로 묶어 재사용하도록 설계됐고, 페이지별 `<h1>`은 각 페이지 컴포넌트가 아니라 두 라우트가 공유하는 layout 쪽에서 갖는 구조를 염두에 둔 결정이다. 지금은 그 layout 레벨 구조가 아직 없어 `/`·`/products` 렌더 트리에 `<h1>`이 없는 상태지만, `PageHeading`을 페이지마다 다른 heading level로 분기시키지 않고 `<h2>`로 고정해 두는 편이 이후 layout 공통화 방향과 충돌하지 않는다고 판단했다.

과제 문서가 요구하는 "초기 응답의 하나의 명확한 `h1`"은 이 결정으로 인해 이번 Part 1에서는 아직 충족되지 않은 상태이며, Part 3(metadata) 작업 범위에서 layout 구조와 함께 다시 판단한다.

---

## Round 4 — DPR 1.25–1.5 srcset 갭 해소 + 상품 목록 이미지 반응형·지연 로딩

Round 3 적용 후 크롬 DevTools에서 직접 Lighthouse를 돌려보다가 두 가지 경고를 추가로 발견했다.

- 홈 hero 이미지: "This image file is larger than it needs to be (1920×1080) for its displayed dimensions (1718×966). Use responsive images to reduce the image download size."
- 상품 목록 카드 이미지: "Increasing the image compression factor could improve this image's download size." (간헐적으로 발생)

### 원인 1 — hero: `deviceSizes`에 1200과 1920 사이 후보가 없음

`sizes="(min-width: 1200px) 1200px, 100vw"`이므로 요청 폭은 `1200 × DPR`인데, DPR 1.25–1.5(스케일된 레티나 디스플레이에서 흔함) 구간에서는 필요 폭이 1500–1800인데도 `deviceSizes`(`[..., 1200, 1920, 2048, 2400, ...]`)에 그 사이 후보가 없어 1920까지 건너뛰고 있었다. Playwright로 DPR별 실제 선택 결과를 재현해 확인함:

| DPR      | 실제 필요 폭(1200×DPR) | 선택되는 srcset(수정 전)        |
| -------- | ---------------------- | ------------------------------- |
| 1.0      | 1200                   | `w=1200`                        |
| 1.25–1.5 | 1500–1800              | **`w=1920`**(과다 전송)         |
| 1.75–2.0 | 2100–2400              | `w=2400`(Round 2에서 이미 해결) |

**변경**: `next.config.ts`의 `deviceSizes`에 `1800`(=1200×1.5) 추가 → `[640, 750, 828, 1080, 1200, 1800, 1920, 2048, 2400, 3840]`. 재확인 결과 DPR 1.5에서 `w=1920` → **`w=1800`**으로 바뀜.

### 원인 2 — 상품 목록: 고정 `width/height`가 실제 반응형 렌더 폭과 불일치

`ProductCard`가 `next/image`에 `width={400} height={400}`(고정)를 줬는데, 실제 CSS(`.week05-image { width:100% }`)는 그리드 열 수(5/3/2)에 따라 폭이 224–276px로 변한다. next/image는 `width/height`가 주어지면 "이 크기로 보일 것"이라고 가정해 DPR(1x/2x)만 고려한 srcset을 만들기 때문에, 실제로는 224px밖에 안 쓰는데 400px(1x) 또는 828px(2x) 기준 파일을 받고 있었다.

**변경**: `width/height` 대신 `fill` + `sizes="(max-width: 720px) 50vw, (max-width: 960px) 33vw, 20vw"`(그리드 열 수에 맞춘 근사치)로 전환. 이미지를 감싸는 `.week05-image-wrap`(`position: relative`)을 새로 두고 포지셔닝 기준을 분리했다. 실측 결과 데스크톱 5열 기준 요청 파일이 **`w=828` → `w=384`**로 줄었다(실렌더 224px에 맞는 후보).

**비율 관련 실수와 정정**: 처음엔 `.week05-image-wrap`에 `aspect-ratio: 1`을 줬는데, 적용해보니 카드 이미지가 기존(224×400, 세로로 눌린 직사각형)과 다른 정사각형(224×224)으로 바뀌어 있었다. 원인을 보니 기존 `width={400} height={400}` HTML 속성이 CSS 캐스케이드에서 낮은 우선순위 `height: 400px`로 작동하고 있었는데, `.week05-image`가 `width`만 재정의하고 `height`는 건드리지 않아 `aspect-ratio: 1`이 처음부터 적용되지 못했었다 — 즉 카드 이미지는 원래부터 정사각형이 아니라 "그리드 열 폭(가변) × 400px(고정)"인 직사각형이었다(의도했는지는 불확실하지만 기존 화면 그대로 유지하기로 함). 요청받은 범위(용량 최적화)를 벗어나는 비율 변경이라 판단해, `aspect-ratio: 1` 대신 `height: 400px`을 명시해 기존 비율을 그대로 재현했다.

### 원인 3(개선) — 상품 목록 이미지 전체가 lazy 상태였음

기존에도 `next/image`는 `priority`를 안 준 이미지는 기본값(`loading="lazy"`)으로 처리하고 있어서, 뷰포트 밖 이미지는 원래도 지연 로딩되고 있었다. 다만 **첫 줄(뷰포트 안에 바로 보이는 카드)까지 전부 lazy**였던 건 그대로였다.

**변경**: `ProductCard`에 `isAboveFold` prop을 추가하고, `ProductListSection`이 `index < ABOVE_FOLD_COUNT(5)`인 카드에만 `loading="eager"`를 준다. 나머지는 기존과 동일하게 `loading="lazy"`.

**`ABOVE_FOLD_COUNT`를 5로 고정한 근거**: 데스크톱(5열)이 그리드 열 수가 가장 많은 브레이크포인트라 "첫 줄"의 최댓값(5개)에 맞췄다. 태블릿(3열)·모바일(2열)에서는 실제 첫 줄이 3개·2개뿐이라 5개까지 eager 처리하면 2–3장을 더 미리 받게 되지만, 카드 이미지 한 장이 이미 `w=384` 기준으로 충분히 작아졌고(Round 4 원인 2에서 확인) 이 정도 초과분이 페이지 전체 로딩에 주는 영향은 미미하다고 판단했다 — 열 수별로 다른 상수를 쓰는 분기를 추가하는 복잡도 대비 얻는 이득이 작다고 봐서 단일 상수(5)로 유지하기로 했다. 정밀하게 맞추려면 `ResizeObserver`나 CSS 컨테이너 쿼리로 실제 열 수를 감지해야 하지만, 이번 변경 범위(용량·타이밍 최적화)에서는 과한 대응이라 보류했다.

### 사용자 직접 측정 — Round 4 상태 재확인(Lighthouse + Performance)

Round 0–3과 같은 방식으로, 사용자가 Round 4 코드 상태(hero `deviceSizes` 1800 추가, 상품 카드 반응형 `sizes`+lazy)로 직접 재확인했다.

- **측정 시점 코드 상태**: 커밋 `c56bfddc`와 동일한 파일 상태(`PageHeading.tsx`·`next.config.ts`·`ProductCard.tsx`·`ProductListSection.tsx`·`layout.css`·`HomeView.tsx`)를 Part 0 커밋(`61214cca`) 위에 그대로 적용
- **측정 일시**: 2026-08-06 UTC 12:46(Performance 트레이스) / 12:44–12:48(Lighthouse)
- **포트**: `localhost:3000`

#### Lighthouse — 홈 (`/`, 5회 raw 값, `--preset=desktop`)

| run        | FCP(ms)     | LCP(ms)     | CLS       |
| ---------- | ----------- | ----------- | --------- |
| 1          | 1,388.3     | 2,122.4     | 0.000     |
| 2          | 1,394.5     | 2,231.8     | 0.000     |
| 3          | 1,390.1     | 2,125.2     | 0.000     |
| 4          | 1,389.9     | 2,224.8     | 0.000     |
| 5          | 1,390.0     | 2,225.0     | 0.000     |
| **중앙값** | **1,390.0** | **2,224.8** | **0.000** |
| 최솟값     | 1,388.3     | 2,122.4     | 0.000     |
| 최댓값     | 1,394.5     | 2,231.8     | 0.000     |

눈으로 보는 리포트: [`./lighthouse/round4/1. lighthouse html 문서/home/run-1.html`](<./lighthouse/round4/1. lighthouse html 문서/home/run-1.html>) ~ `run-5.html`

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

눈으로 보는 리포트: [`./lighthouse/round4/1. lighthouse html 문서/products/run-1.html`](<./lighthouse/round4/1. lighthouse html 문서/products/run-1.html>) ~ `run-5.html`

**Round 3 대비 계속 줄었다** — 홈 LCP 중앙값 2,882.0ms(Round3) → 2,224.8ms(Round4), **22.8%↓**. hero의 DPR 갭 해소(`w=1920→1800`)가 이 측정 환경(실제 DPR ~1.5–2로 추정)에서 실질적으로 반영된 것으로 보인다. 상품목록도 3,137.1ms → 2,383.1ms로 **24.0%↓**. FCP는 여전히 1,388–1,395ms대 이례적 관측치(Round 0–3와 동일 패턴).

#### Performance — 홈(`/`) filmstrip (DevTools Performance 패널, Slow 4G, 실제 DPR1)

| 시점      | 스크린샷                                                                                                     | 내용                                           |
| --------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| t=621ms   | [`lighthouse/round4/2. performance/home/t621ms.jpg`](<./lighthouse/round4/2. performance/home/t621ms.jpg>)   | 셸 완성(FCP 시점과 근접), hero는 아직 배경색만 |
| t=648ms   | [`lighthouse/round4/2. performance/home/t648ms.jpg`](<./lighthouse/round4/2. performance/home/t648ms.jpg>)   | **hero 이미 완전히 로드됨**                    |
| t=919ms   | [`lighthouse/round4/2. performance/home/t919ms.jpg`](<./lighthouse/round4/2. performance/home/t919ms.jpg>)   | 안정                                           |
| t=1,101ms | [`lighthouse/round4/2. performance/home/t1101ms.jpg`](<./lighthouse/round4/2. performance/home/t1101ms.jpg>) | 안정                                           |
| t=1,218ms | [`lighthouse/round4/2. performance/home/t1218ms.jpg`](<./lighthouse/round4/2. performance/home/t1218ms.jpg>) | 안정                                           |

실측 FCP 633.1ms, LCP(hero) **633.1ms** — Round 1–3(610–639ms)과 같은 수준으로 여전히 매우 빠르다. DPR 1 환경이라 Round 4의 hero DPR 갭 해소(`w=1920→1800`, DPR 1.25–1.5 대상)는 이 조건에 영향을 주지 않는다 — 이미 Round 1부터 `w=1200`이 선택되고 있었다.

#### Performance — 상품 목록(`/products`) filmstrip (DevTools Performance 패널, Slow 4G, 실제 DPR1)

| 시점      | 스크린샷                                                                                                             | 내용                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| t=12ms    | [`lighthouse/round4/2. performance/products/t12ms.jpg`](<./lighthouse/round4/2. performance/products/t12ms.jpg>)     | `loading.tsx` fallback("불러오는 중입니다…")                              |
| t=1,265ms | [`lighthouse/round4/2. performance/products/t1265ms.jpg`](<./lighthouse/round4/2. performance/products/t1265ms.jpg>) | **hero 완전히 로드됨**                                                    |
| t=1,655ms | [`lighthouse/round4/2. performance/products/t1655ms.jpg`](<./lighthouse/round4/2. performance/products/t1655ms.jpg>) | 안정                                                                      |
| t=2,227ms | [`lighthouse/round4/2. performance/products/t2227ms.jpg`](<./lighthouse/round4/2. performance/products/t2227ms.jpg>) | 재안정(중간 구간에 카드 이미지 지연 로딩으로 보이는 일시적 흔들림 있었음) |
| t=2,485ms | [`lighthouse/round4/2. performance/products/t2485ms.jpg`](<./lighthouse/round4/2. performance/products/t2485ms.jpg>) | 안정                                                                      |

LCP(hero, 810,000px²)가 이미지 요청 시작 후 **약 1,277.6ms**만에 확정됨 — Round 3(약 2,237ms)보다 **거의 절반으로 빨라졌다.** Round 4의 카드 이미지 lazy-loading(첫 5장만 즉시 로드)이 hero와의 대역폭 경쟁을 줄여준 것으로 보인다 — Round 3 결론에서 추정했던 "상품목록은 hero 외 리소스와 경쟁해서 느리다"는 가설과 맞아떨어지는 개선이다.
