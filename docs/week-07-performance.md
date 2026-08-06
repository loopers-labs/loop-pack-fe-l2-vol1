# 7주차 성능 최적화 — 측정 기록과 판단

> **AI 협업 표기** — 0단계의 **Lighthouse raw 값·LCP 구간·waterfall은 실행해서 기록한 값**이고, **병목 판단·개입 선택·그 근거는 직접 채운다**. filmstrip 순서와 Layout Shifts track, slow API 목록 6상태 녹화는 DevTools에서 직접 관찰할 몫으로 비어 있다. 작업 수준별 구분은 문서 끝 「AI 협업 표기」에 적는다.

## 0단계 — 측정 조건을 고정하고 Before를 남긴다

### 실행 환경

| 항목            | 값                                                       |
| --------------- | -------------------------------------------------------- |
| 실행 방식       | `pnpm build` + `pnpm start` (production). dev 서버로 비교하지 않는다 |
| Next            | 16.2.10                                                  |
| Node            | 24.17.0 (`.nvmrc`) · pnpm 10.15.1                        |
| origin          | `http://localhost:3000`                                  |
| mock API 지연   | 기본 500ms · `?scenario=slow` 1,500ms                    |

### Before / After 고정 조건 — SHA를 제외한 모든 칸이 양쪽에서 같아야 한다

| 항목                    | Before | After |
| ----------------------- | ------ | ----- |
| URL                     | `http://localhost:3000/` | |
| query string            | 없음   |       |
| 행동                    | cold load | |
| viewport                | 412 × 823 @1.75x (Lighthouse mobile emulation) | |
| CPU throttling          | 4× slowdown |  |
| Network throttling      | 1,638.4 Kbps · RTT 150ms |  |
| throttling method       | `devtools` (실제 스로틀링) |  |
| 브라우저 · 버전         | Chrome 150.0.7871.188 (`--headless=new`) | |
| Lighthouse 버전         | 13.4.1 |  |
| 브라우저 프로필         | 회차마다 새 `--user-data-dir` (확장·캐시·로그인 없음) | |
| commit SHA              | `4f07c0ef` | |
| 측정 날짜               | 2026-08-07 |  |

재현 명령 — 회차마다 `$PROF`를 새로 만든다.

```bash
pnpm dlx lighthouse "http://localhost:3000/" \
  --only-categories=performance --throttling-method=devtools \
  --output=json --output-path="run-N.json" \
  --chrome-flags="--headless=new --no-first-run --no-default-browser-check --user-data-dir=$PROF"
```

> **`--throttling-method=devtools`를 쓴 이유.** Lighthouse 기본값은 `simulate`(Lantern 추정)다. 이 경우 headline 지표는 추정치인데 `lcp-breakdown-insight`의 구간값은 관측치라 **기준이 섞인다** — 실제로 기본값으로 5회 돌렸을 때 구간 합은 947ms인데 LCP는 40,514ms로 나왔다. `devtools`는 실제로 스로틀링하므로 아래 표에서 4구간 합과 LCP가 일치한다.

### Before — FCP · LCP · CLS 5회 raw 값

점수나 향상률에는 합격선이 없다. 남길 것은 raw 값과 흔들림의 폭이다.

| 회차   | FCP        | LCP          | CLS    |
| ------ | ---------- | ------------ | ------ |
| 1      | 1,358ms    | 44,824ms     | 0.0000 |
| 2      | 1,353ms    | 44,828ms     | 0.0000 |
| 3      | 1,350ms    | 44,829ms     | 0.0000 |
| 4      | 1,351ms    | 44,821ms     | 0.0000 |
| 5      | 1,368ms    | 44,847ms     | 0.0000 |
| 중앙값 | **1,353ms** | **44,828ms** | 0.0000 |
| 최솟값 | 1,350ms    | 44,821ms     | 0.0000 |
| 최댓값 | 1,368ms    | 44,847ms     | 0.0000 |
| 폭     | 18ms       | 26ms         | 0      |

측정 흔들림은 FCP 18ms · LCP 26ms다. After에서 이 폭보다 큰 변화만 변화로 읽는다.

### Before — Lab 측정이 답하지 못하는 것

Lighthouse는 Lab이다. **무엇이 느린가**에는 답하지만 **실제로 느린가**에는 답하지 않고, 초기 측정이 끝난 뒤의 기다림은 점수 밖에 남을 수 있다. 이번 과제는 Lab만 쓰므로, 점수에 잡히지 않은 기다림을 따로 적어 둔다.

| 질문                                                | 이번 측정에서 |
| --------------------------------------------------- | ------------- |
| 무엇이 느린가 (Lab)                                 |               |
| 초기 측정이 끝난 뒤에도 남은 기다림이 있었는가      |               |
| 점수에는 안 잡혔지만 화면에서 기다린 구간           |               |
| 실제로 느린가 (Field) — 이번 범위 밖, 판단하지 않음 | —             |

### Before — LCP element와 표시 순서

| 확인할 것                                             | 관찰 결과 |
| ----------------------------------------------------- | --------- |
| Lighthouse가 지목한 LCP element                       | Hero 원본 이미지 — `<img class="…HeroSection…image" alt="" width="3840" height="2160" src="/images/week-07/hero-original.jpg">` (selector: `body > main.shop-page > section.…hero > img.…image`) |
| filmstrip의 Header · 페이지 제목 · Hero 표시 순서     | *(DevTools Performance 녹화에서 직접 확인)* |
| Layout Shifts track에 기록된 이동                     | Lighthouse CLS는 5회 모두 0.0000. Hero가 `aspect-ratio: 16/9`로 공간을 예약한다. *(track에서 직접 대조)* |

### Before — Network waterfall

Lighthouse `network-requests` 기준(run 1, 회차 간 차이는 위 폭 안).

| 리소스      | URL                                  | 전송 크기     | 요청 시작 | 완료      |
| ----------- | ------------------------------------ | ------------- | --------- | --------- |
| document    | `/`                                  | 2,953 B       | 0ms       | 578ms     |
| 홈 데이터   | `/api/home`                          | 4,179 B       | 2,699ms   | 3,327ms   |
| Hero 이미지 | `/images/week-07/hero-original.jpg`  | **7,545,525 B** | 3,345ms   | 44,795ms  |

### Before — LCP를 구간으로 나눈 값

구간 이름은 강의 용어를 따른다.

Lighthouse `lcp-breakdown-insight` 기준. 5회 중앙값이며, 네 구간의 합이 LCP와 일치한다.

| 구간      | 이 구간에 들어가는 것 | 중앙값     | 최소     | 최대     |
| --------- | --------------------- | ---------- | -------- | -------- |
| TTFB      | 서버 · CDN · 캐시     | 2ms        | 2ms      | 2ms      |
| 발견 지연 | HTML · 우선순위       | 3,344ms    | 3,342ms  | 3,359ms  |
| 다운로드  | 크기 · 전송           | 41,450ms   | 41,448ms | 41,455ms |
| 렌더 지연 | CSS · JS · layout     | 31ms       | 27ms     | 33ms     |
| **합**    |                       | **44,828ms** |          |          |

### Before — slow API 목록 관찰

`/api/products?scenario=slow`에서 각각 녹화한다. **아직 측정하지 않았다** — 위 Lighthouse는 홈 cold load만 대상이었다.

| 상황                                      | 관찰 결과 |
| ----------------------------------------- | --------- |
| 데이터 없는 최초 진입                     |           |
| 기존 목록이 있는 갱신                     |           |
| 검색·카테고리·정렬·페이지 빠르게 연속 변경 |           |
| 현재 URL의 active query와 화면 일치 여부  |           |
| 늦게 끝난 이전 요청이 현재 화면을 덮는지  |           |
| 취소된 요청의 화면 표현                   |           |

### Before — 네 문장

- **관찰한 사실**:
- **원인 가설**:
- **가설을 반증할 방법**:
- **먼저 시도할 가장 작은 변경**:

## 1단계 — Hero의 실제 LCP 병목을 줄인다

| 남길 것                                            | 내용 |
| -------------------------------------------------- | ---- |
| 가장 길었던 구간과 그렇게 판단한 근거              |      |
| 선택한 변경과 그 구간의 인과관계                   |      |
| 실제 표시 크기 · viewport에 맞춰 고른 후보·포맷·압축률 |      |
| 이미지가 발견되어 요청되는 시점 (변경 전 → 후)     |      |
| 요청 우선순위를 높일 이유가 있었는지 / 없었는지    |      |
| Hero의 시각적 크기·비율·주요 피사체·문구 유지 확인 |      |
| Header · `h1` · 페이지 설명이 Hero와 함께 막히지 않게 한 방법 |      |
| Hero fallback이 같은 공간을 차지하는지 · 교체 시 CLS |      |
| 하지 않기로 한 변경과 그 이유                      |      |

> `next/image` 사용 여부는 완료 기준이 아니다. 실제 요청 URL·전송 크기·waterfall·LCP가 함께 달라졌는지로 판단한다.

## 2단계 — 최초 pending · 목록 갱신 · CLS

| 상태                    | 화면에 보인 것 | 녹화에서 구분되는가 |
| ----------------------- | -------------- | ------------------- |
| 데이터 없는 최초 진입   |                |                     |
| 이전 데이터가 있는 갱신 |                |                     |
| 성공 + 0건              |                |                     |
| 최초 실패               |                |                     |
| 갱신 실패               |                |                     |
| 취소                    |                |                     |

| 남길 것                                                | 내용 |
| ------------------------------------------------------ | ---- |
| `isPending`과 `isFetching`이 각각 맡은 화면            |      |
| query key와 실제 GET 요청에 함께 넣은 URL 조건         |      |
| 이전 요청의 늦은 완료가 현재 화면을 덮지 않게 한 방법  |      |
| 서버 응답을 로컬 상태에 복사하지 않았음을 보이는 근거  |      |
| fallback ↔ 실제 콘텐츠 교체 시 CLS 확인 결과           |      |
| 이미 조건을 만족해서 개입하지 않은 항목과 그 근거      |      |

## 3단계 — 동적 metadata와 Open Graph의 비용

| 상황                   | 남길 증거 | 결과 |
| ---------------------- | --------- | ---- |
| normal                 | production document 응답 · 초기 HTML | |
| 정상 empty (성공 + 0건) | URL 조건 · 0건 설명 metadata · OG fallback image | |
| metadata query failure | `APP_ORIGIN`을 닿지 않는 origin으로 두고 재현 · root 공통 metadata 상속 여부 | |
| 서버 호출 계수         | 동일 slow Route Handler 호출 횟수 (임시 서버 로그) · 계측 제거 여부 | |
| UA 비교                | 일반 요청 vs `facebookexternalhit`의 `time_starttransfer` · `time_total` | |

| 남길 것                                                     | 내용 |
| ----------------------------------------------------------- | ---- |
| root title template · 공통 OG와 페이지 metadata 합성 방식   |      |
| shallow merge에도 `siteName`·`locale`·`type`을 유지한 방법   |      |
| metadata와 본문이 같은 URL 정규화·query factory를 쓴 근거    |      |
| request 범위 memoization의 범위                              |      |
| metadata가 데이터를 기다린 비용                              |      |

### 같은 경로에서 캐시 상태별 재현

같은 URL을 캐시 상태만 바꿔 다시 밟는다. 이 과제의 범위는 **같은 render/request 안의 memoization**이므로, 아래는 그 범위가 어디까지였는지 보이기 위한 재현이다. 서버 캐시(`cacheLife`·`cacheTag`)까지 넓힐지는 여기서 나온 호출 횟수를 보고 판단하고, 필요 없으면 넓히지 않은 근거를 적는다.

| 상태   | 재현 방법 | 관찰 결과 | Route Handler 호출 횟수 |
| ------ | --------- | --------- | ----------------------- |
| COLD   | 원본 조회 · cache miss |  |  |
| WARM   | 같은 요청 재사용 |  |  |
| CHANGE | 원본 수정 · invalidation |  |  |
| STALE  | 이전 값 노출인가 새 값 대기인가 |  |  |
| FRESH  | 갱신 완료 후 다음 조회 |  |  |

## 4단계 — 같은 조건에서 After와 회귀

### After — FCP · LCP · CLS 5회 raw 값

| 회차     | FCP | LCP | CLS |
| -------- | --- | --- | --- |
| 1        |     |     |     |
| 2        |     |     |     |
| 3        |     |     |     |
| 4        |     |     |     |
| 5        |     |     |     |
| 중앙값   |     |     |     |
| 최솟값   |     |     |     |
| 최댓값   |     |     |     |

### Before ↔ After 비교

| 항목                        | Before | After |
| --------------------------- | ------ | ----- |
| LCP element                 |        |       |
| Hero 이미지 전송 크기       |        |       |
| 요청 시작 순서              |        |       |
| 가장 길었던 구간            |        |       |

### 회귀 확인

| 항목                                        | 결과 |
| ------------------------------------------- | ---- |
| 검색·카테고리·정렬·페이지 URL 복원          |      |
| 뒤로 가기 · 앞으로 가기                     |      |
| 장바구니 · 위시리스트 · Header 개수         |      |
| 로딩 · 에러 · 빈 상태 · 재시도              |      |
| FSD 의존 방향 · 슬라이스 Public API 우회 여부 |      |
| 이미지 품질                                 |      |
| 효과가 없거나 악화된 변경 (되돌림 / 유지 이유) |      |

## Advanced A — 관계없는 카드 렌더 (선택)

Basic 완료 후, 실제 클릭에서 관계없는 카드까지 렌더되는 병목이 확인될 때만 진행한다.

| 항목                                          | Before | After |
| --------------------------------------------- | ------ | ----- |
| input delay                                   |        |       |
| processing duration                           |        |       |
| presentation delay                            |        |       |
| Profiler가 보여준 렌더 범위와 변경 원인       |        |       |
| 24개 카드 · 즉각적인 찜 피드백 유지 확인      |        |       |

## 준비 작업 기록 (완료)

측정 이전에 끝난 배선과 게이트다. 여기까지가 Before의 출발점이다.

| # | 내용 | 결과 |
| - | ---- | ---- |
| 1 | `volume-7` 생성 → `upstream/main`(`3d42a443`) 머지. 충돌 2건은 누적 FSD 구조 결정을 유지하며 해결 — `MockApiScenario "slow"`는 소유자인 `app/api/scenario.ts`에, 죽은 타입 `ProductListQuery`는 되살리지 않음, `HeroSection`의 `@/types/commerce` → `@/entities/product`, `waitForMockApi(delay)`는 upstream 그대로 | 커밋 `665a08ff` |
| 2 | `src/examples/**`를 측정용 픽스처로 규정하고 eslint 적용 범위를 선언. 스타터 Hero의 억제 지시문이 1주차 `eslint-comments/no-use`와 부딪히는데, 그 지시문은 해당 플러그인이 없는 레퍼런스 레포에서 작성된 것이었다. 룰을 끈 것이 아니라 범위를 좁혔다 — 메타 룰에만, 이유가 붙은 한 줄 억제만(`allow`), 설명 없는 억제와 파일 전체 억제는 픽스처 안에서도 금지(`require-description`), 제품 코드는 `no-use: error` 유지 | 커밋 `8a39d158` |
| 3 | 최적화하지 않은 원본 Hero를 홈에 연결. 기존 `h1`을 지우지 않고 그 아래에 붙였다 — 1단계가 "`h1`이 느린 Hero와 함께 막히지 않는가"를 요구하므로 `h1`이 살아 있어야 그 판단이 성립한다. 배너 문구가 `h1`과 겹치는 것은 1단계에서 렌더링 경계를 정할 때 정리한다 | 커밋 `4f07c0ef` |
| 4 | `pnpm check` (test 41 · lint · typecheck · build) · `pnpm format:check` | 둘 다 **exit 0** · 2026-08-07 |
| 5 | production build로 실행해 Hero 렌더 확인 (`pnpm build` + `pnpm start`, `http://localhost:3000`) | 아래 표 |
| 6 | Lighthouse 5회 실행(0단계 Before). 기본 `simulate`로 먼저 돌렸다가 구간값과 headline 지표의 기준이 섞이는 것을 확인하고 `devtools`로 다시 측정했다 | 0단계 표에 기록 · 2026-08-07 |

### Hero 렌더 확인 — DOM에서 읽은 값

viewport 1280×900. 측정이 아니라 **배선이 의도대로 붙었는지**만 확인한 값이다. Network 증거는 0단계에서 DevTools로 직접 남긴다.

| 항목                              | 값                                                     |
| --------------------------------- | ------------------------------------------------------ |
| Hero `currentSrc`                 | `http://localhost:3000/images/week-07/hero-original.jpg` |
| `naturalWidth` × `naturalHeight`  | 3840 × 2160 (원본 그대로)                              |
| 화면 표시 크기                    | 1200 × 675                                             |
| `complete`                        | `true`                                                 |
| 응답 크기 (curl)                  | 7,545,239 bytes                                        |
| 페이지의 `h1` 개수                | 1개 — "매일 새롭게 발견하는 취향"                      |
| Hero 제목 레벨                    | `h2` (접근성 트리에서 `h1` → `h2` 유지)                |
| Hero `<img>`의 접근성 트리 노출   | 없음 — 스타터가 `alt=""`로 장식용 선언                 |

## AI 협업 표기

| 구분                                          | 범위 |
| --------------------------------------------- | ---- |
| **직접 결정 (최종 판단)**                     | eslint 적용 범위를 어느 룰에 어떻게 둘지(메타 룰 + 옵션으로 좁히는 안을 채택), Hero를 기존 `h1`을 유지한 채 연결할지, 커밋을 어떻게 나눌지. **어느 구간이 병목인지의 판정, 개입 선택과 그 근거, 하지 않기로 한 변경**은 전부 여기에 들어간다 |
| **AI가 초안 작성 (설계 판단), 검토 후 채택**  | eslint 예외의 형태 제안 — 폴더 스코프 + 품질 룰이 아니라 메타 룰에 예외 + `off` 대신 `allow`/`require-description`으로 3중 제한. 판단 근거는 upstream 설정에 해당 플러그인이 없다는 사실이었고, 원본에 없던 개선은 얹지 않았다 |
| **AI가 구현 (기계적), 검토 후 채택**          | 머지 충돌 해결 반영, eslint 설정 블록, `HomePage`의 Hero 배선(import 1줄 + JSX 1줄 + 주석), 이 문서의 표 골격. 결정을 코드로 옮긴 작업이고 새 설계를 얹지 않았다 |
| **AI가 실행·기록 (측정)**                     | 게이트 결과(`pnpm check`·`format:check` exit 0, test 41), 각 커밋 단독 검증, production build 실행과 위 「Hero 렌더 확인」 표. **0단계 Lighthouse 5회 raw 값·LCP element·LCP 4구간·network waterfall**과, `simulate`에서 기준이 섞이는 것을 확인하고 `devtools`로 바꾼 경위. 코드는 바꾸지 않고 실행 결과만 옮겼다 |

> **아직 비어 있는 것** — filmstrip의 표시 순서와 Layout Shifts track(DevTools Performance 녹화), slow API 목록 6상태 녹화, 0단계 「네 문장」, 「Lab 측정이 답하지 못하는 것」, 1~4단계와 Advanced A 전체. Lighthouse는 headless에서 돌렸으므로, 눈으로 볼 증거(filmstrip·Layout Shifts·목록 상태)는 DevTools에서 따로 남긴다.
