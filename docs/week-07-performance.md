# 7주차 성능 최적화 — 측정 기록과 판단

> **AI 협업 표기** — 이번 주는 시간 제약 때문에 **측정·구현·병목 판단까지 AI가 수행**했고, 각 판단의 근거를 전부 측정값으로 남겼다. 어디까지가 누구 몫이었는지는 문서 끝 「AI 협업 표기」에 나눠 적었다. 다른 주차와 기준이 다르므로 그대로 읽지 말고 대조할 것.

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
| URL                     | `http://localhost:3000/` | 같음 |
| query string            | 없음 | 같음 |
| 행동                    | cold load | 같음 |
| viewport                | 412 × 823 @1.75x (Lighthouse mobile emulation) | 같음 |
| CPU throttling          | 4× slowdown | 같음 |
| Network throttling      | 1,638.4 Kbps · RTT 150ms | 같음 |
| throttling method       | `devtools` (실제 스로틀링) | 같음 |
| 브라우저 · 버전         | Chrome 150.0.7871.188 (`--headless=new`) | 같음 |
| Lighthouse 버전         | 13.4.1 | 같음 |
| 브라우저 프로필         | 회차마다 새 `--user-data-dir` (확장·캐시·로그인 없음) | 같음 |
| commit SHA              | `4f07c0ef` | `6220deef` |
| 측정 날짜               | 2026-08-07 | 2026-08-07 |

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
| 무엇이 느린가 (Lab)                                 | Hero 이미지 다운로드. LCP 44,828ms 중 41,450ms(92%)가 이 구간이다 |
| 초기 측정이 끝난 뒤에도 남은 기다림이 있었는가      | 있다. 상품 카드 이미지 11장이 LCP 이후에도 계속 내려온다(마지막 완료 5,497ms). LCP 값에는 잡히지 않는다 |
| 점수에는 안 잡혔지만 화면에서 기다린 구간           | 목록 화면의 갱신 대기 — 홈 cold load만 재는 이 측정에는 아예 들어오지 않는다. 2단계에서 따로 다뤘다 |
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

목록 상태는 홈 cold load 측정(위 Lighthouse)과 별개 화면이라 여기서는 Before 상태만 적는다. 6상태를 실제로 재현하고 확인한 기록은 아래 **2단계**에 있다.

> mock의 slow scenario(`?scenario=slow`)는 mock API 전용 제어값이고 사용자 URL 상태에 넣지 않기로 5주차에 정했다. 그래서 앱은 이 파라미터를 보내지 않으며, 아래 관찰은 기본 500ms 지연에서 했다.

| 상황                                      | Before 관찰 결과 |
| ----------------------------------------- | --------- |
| 데이터 없는 최초 진입                     | 텍스트 한 줄("상품을 불러오는 중입니다…")만 노출. 목록 크기를 예상할 수 없다 |
| 기존 목록이 있는 갱신                     | 조건을 바꾸면 목록이 즉시 사라지고 같은 텍스트로 바뀐다 |
| 검색·카테고리·정렬·페이지 빠르게 연속 변경 | 매 변경마다 목록이 비워진다 |
| 현재 URL의 active query와 화면 일치 여부  | 일치한다(query key에 조건 전체가 들어 있다) |
| 늦게 끝난 이전 요청이 현재 화면을 덮는지  | 덮지 않는다. 다만 요청 취소는 하지 않아 불필요한 응답을 끝까지 받는다 |
| 취소된 요청의 화면 표현                   | 취소 자체가 없다(`signal` 미전달) |

### Before — 네 문장

- **관찰한 사실**: LCP 44,828ms의 구간을 나누면 다운로드가 41,450ms(92%), 발견 지연이 3,344ms(7%)이고 TTFB·렌더 지연은 합쳐 33ms다. LCP element는 Hero 원본 이미지이며 전송 크기가 7,545,525B다.
- **원인 가설**: 3840×2160 원본을 412px 뷰포트에 그대로 내려보내는 것이 다운로드 구간을 만들고, Hero가 초기 HTML에 없어 클라이언트 쿼리가 끝난 뒤에야 발견되는 것이 발견 지연을 만든다.
- **가설을 반증할 방법**: 표시 폭에 맞춘 후보만 내려보냈는데도 다운로드 구간이 안 줄면 첫 가설이 틀린 것이다. 서버에서 Hero를 그렸는데도 이미지 요청이 여전히 document 완료 뒤에 시작하면 둘째 가설이 틀린 것이다.
- **먼저 시도할 가장 작은 변경**: 다운로드가 92%이므로 거기부터. Hero를 실제 표시 폭에 맞춰 내려보내고, 그 변경만으로 다시 잰다.

## 1단계 — Hero의 실제 LCP 병목을 줄인다

가장 긴 구간부터 하나씩, 한 번에 한 가설만 건드리고 그때마다 다시 쟀다. 커밋도 그 단위로 나눴다.

### 1-a. 다운로드 41,450ms (LCP의 92%) — 커밋 `77aafb2b`

3840×2160 원본 7.5MB를 412px 뷰포트에 그대로 내려보내고 있었다. `widgets/hero`를 새로 두고 `next/image`(fill)로 그린다. `sizes`는 `.shop-page`의 `width: min(100% - 32px, 1200px)`와 같게 맞췄다 — 어긋나면 실제 표시 폭보다 큰 후보가 선택된다.

`priority`는 새 개입이 아니다. `next/image` 기본값 `loading="lazy"`로 두면 발견이 Before보다 더 늦어지므로, Before의 `<img>` 기본 동작(eager)을 유지하기 위한 것이다.

| | Before | 1-a 이후 |
| --- | --- | --- |
| LCP 중앙값 | 44,828ms | **4,265ms** |
| 다운로드 구간 | 41,450ms | **914ms** |
| Hero 전송 크기 | 7,545,525B | **32,424B** |
| 선택된 후보 | 원본 3840w | `w=750` (412px × DPR 1.75 = 721px) |
| 발견 지연 | 3,344ms | 3,334ms (겨냥한 구간이 아님) |
| FCP · CLS | 1,353ms · 0.0000 | 1,354ms · 0.0000 |

### 1-b. 발견 지연 3,334ms (남은 LCP의 78%) — 커밋 `4c9520a0`

waterfall이 원인을 그대로 보여줬다. document 578ms → JS 부팅 → 클라이언트 쿼리 2,698ms 시작 → 3,329ms 응답 → 그제야 이미지 발견 3,338ms. Hero가 초기 HTML에 없어서 브라우저가 찾을 수가 없었다.

홈 데이터를 서버에서 prefetch → dehydrate → `HydrationBoundary`로 넘긴다. 본문과 같은 query factory를 쓰고, `getQueryClient()`는 호출마다 새 인스턴스를 만든다.

초기 HTML 확인(JS 실행 전): hero preload link **있음**, hero `<img>` **있음**, `h1` **1개**, "불러오는 중" 문구 **없음**.

| | 1-a 이후 | 1-b 이후 |
| --- | --- | --- |
| LCP 중앙값 | 4,265ms | **1,709ms** |
| 발견 지연 | 3,334ms | **75ms** |
| 이미지 요청 시작 | 3,338ms | **586ms** (document 완료 603ms보다 앞) |
| TTFB | 2ms | **508ms** ← 대가 |

**대가와 판단.** TTFB가 2 → 508ms로 늘었다. 서버가 mock API의 500ms 지연을 기다리기 때문이고, 강의의 "하나의 `await`가 셸까지 세운다"에 해당한다. 순변화가 −2,556ms이므로 유지하되, **셸까지 함께 세우는 문제는 남아 있다** — 셸을 먼저 흘려보내는(streaming) 개입은 하지 않았다. LCP element가 배너 데이터에 의존하므로 셸 스트리밍은 FCP를 당길 뿐 LCP를 당기지 못한다고 판단했고, 이번 병목이 아니라서 제외했다.

### 하지 않은 것

- **`fetchPriority`·`preload` 추가 쌓기** — `priority` 하나로 이미 preload가 나가고 발견 지연이 75ms다. 더 얹을 구간이 없다.
- **이미지 품질·크기 축소** — 시각적 크기·비율·주요 피사체·문구를 그대로 뒀다. 줄인 것은 전송 바이트뿐이다.
- **셸 스트리밍** — 위 판단대로 이번 병목과 연결되지 않는다.

## 2단계 — 최초 pending · 목록 갱신 · CLS

상태표 6개 중 3개(pending·error·empty)만 그리고 있었다. 나머지를 채우고 production build에서 하나씩 재현했다. 커밋 `d47c0380`.

| 상태 | 화면에 보인 것 | 재현과 결과 |
| --- | --- | --- |
| 데이터 없는 최초 진입 | 실제 `pageSize`와 같은 12장 스켈레톤 + 안내 문구, `aria-busy` | 500ms 창이라 브라우저로 잡기 어려워 렌더 테스트로 고정 (카드 12장·같은 그리드·`aria-hidden`) |
| 이전 데이터가 있는 갱신 | 목록 유지 + "갱신하는 중" + 흐림 | 카테고리 변경 중 카드 **최소 6장 유지**(0장 없음), URL 갱신 |
| 성공 + 0건 | URL 조건을 문장으로 되짚고 0개 명시 | `검색어 "존재하지않는상품zzz"에 맞는 상품이 없습니다. (0개)` · 그리드·총개수·페이지네이션 없음 · alert 아님 |
| 최초 실패 | 목록 자리에 실패 이유 + 재시도 | `page=0` → 400 → `role="alert"` + 다시 시도, 필터 2개 계속 조작 가능 |
| 갱신 실패 | 기존 목록 유지 + 실패 배너 + 재시도 | 다음 요청만 400으로 만들어 재현 → 카드 **12장 유지**, 배너 노출, 최초 실패 화면으로 떨어지지 않음 |
| 취소 | 오류로 보이지 않고 현재 화면을 덮지 않음 | 카테고리 4연속 변경 → 에러 없음, 목록 안 비워짐, 최종 URL(`digital`)과 화면(총 6개) 일치 |

### 처음 구현이 틀렸던 것

갱신 실패를 `placeholderData(keepPreviousData)`만으로 처리했는데, **새 조건의 요청이 실패하면 placeholder가 버려진다.** 브라우저 확인에서 목록이 12장 → **0장**으로 사라지고 최초 실패 화면으로 떨어졌다. 상태표가 요구하는 "기존 목록을 유지한 채"를 못 지킨다.

고친 방식: **마지막으로 성공한 조건(key)만 상태로 두고, 데이터는 캐시에서 읽는다.** 상태에 담기는 것은 URL에서 온 조건뿐이라 "서버 응답을 로컬 상태에 복사하지 않는다"를 지킨다.

### isPending과 isFetching이 맡은 화면

- `isPending` — 보여줄 데이터가 아예 없는 첫 진입. 스켈레톤이 이 상태만 담당한다.
- `isFetching` + 보여줄 목록 있음 — 갱신 중. 목록을 비우지 않고 안내만 얹는다.
- 화면을 가르는 실제 기준은 `status` 하나가 아니라 **"지금 보여줄 목록이 있는가"** 였다.

### URL·query key·취소

- 서버 응답을 바꾸는 조건(`q`·`category`·`sort`·`page`)을 query key와 실제 GET에 함께 넣는다.
- `queryFn`에 `signal`을 넘겨 필요 없어진 요청을 실제로 끊는다. 취소된 요청은 에러로 올라오지 않는다.
- 서버 응답을 Zustand나 별도 로컬 상태에 복사하지 않는다.

### CLS

스켈레톤은 실제 카드와 같은 수·같은 그리드·같은 이미지 비율을 쓴다. Hero는 `aspect-ratio`로 공간을 예약한다. **CLS는 Before·중간·After 전 구간에서 5회 모두 0.0000.**

## 3단계 — 동적 metadata와 Open Graph의 비용

커밋 `6220deef`.

| 남길 것 | 내용 |
| --- | --- |
| root title template · 공통 OG 합성 | root에 `metadataBase`와 `title.template("%s · Commerce")`. 공통 `openGraph`를 객체로 내보내고 각 페이지가 명시적으로 펼친다 |
| shallow merge 대응 | 페이지 `openGraph`는 root를 **통째로 덮는다**. 그래서 펼쳐 쓰지 않으면 `siteName`·`locale`·`type`이 사라진다. 확인 결과 세 필드 모두 유지됨 |
| 같은 정규화·같은 factory | `resolveProductListQuery`가 서버에서 URL을 읽고, nuqs 파서와 같은 기본값·같은 좁히기를 쓴다. metadata와 본문이 같은 GET URL·options를 만든다 |
| request 범위 memoization | 같은 render/request 안의 같은 URL·options인 native fetch만 대상 |
| `getQueryClient()` | 호출마다 새 인스턴스. singleton·영속 캐시로 바꾸지 않았다 |
| 색인 | `robots: noindex` 없음 (문서에서 0건 확인) |

### 재현과 증거

| 상황 | 결과 |
| --- | --- |
| normal (홈) | title·description·og:image가 배너 응답에서 나옴. `og:site_name`·`locale`·`type` 유지 |
| normal (목록) | `q=케이스&sort=price-asc&page=2` → title `"케이스" 검색 결과 (2페이지) · Commerce`, description `카테고리 전체 · 낮은 가격순 기준 총 2개의 상품.` — 검색어는 title에 먼저, category·sort는 description에, 2페이지 이상은 title에 페이지 번호 |
| normal (목록, 결과 있음) | `category=digital&sort=popular` → og:image가 **첫 상품 이미지** |
| 정상 empty | title `… 검색 결과 — 결과 없음 · Commerce`, description `… 조건에 맞는 상품이 0개입니다.`, **OG fallback image 유지** |
| metadata query failure | `APP_ORIGIN=http://127.0.0.1:9`로 build·start → 홈·목록 모두 **root 공통 metadata 상속**, 페이지별 빈 값 없음, HTTP 200. build도 성공 |
| UA 비교 | 일반 vs `facebookexternalhit` — 3회 반복 모두 차이 없음 (양쪽 `start`·`total` 모두 ~0.510s) |

### metadata가 데이터를 기다린 비용

`/products` document 응답이 일반 UA·crawler 모두 **~510ms**다. mock API 지연이 500ms이므로 이 값은 **1회분**이다. generateMetadata와 본문이 각각 호출했다면 ~1,010ms여야 한다 — 같은 request 안에서 native fetch가 memoize되고 있다는 간접 증거다.

**남은 것**: 임시 서버 로그로 Route Handler 호출 횟수를 직접 세는 계수는 하지 않았다. 위 응답 시점은 간접 증거이므로, 제출 전에 서버 측 계수로 한 번 확정하는 편이 좋다.

### 같은 경로에서 캐시 상태별 재현

이 과제의 범위는 **같은 render/request 안의 memoization**이고, 서버 캐시(`cacheLife`·`cacheTag`)는 넣지 않았다. 아래는 그 범위가 어디까지였는지를 남기는 표다.

| 상태 | 재현 방법 | 관찰 결과 |
| --- | --- | --- |
| COLD | 새 프로필로 첫 요청 | document ~510ms. mock 지연 500ms 1회분 |
| WARM | 같은 request 안의 metadata + 본문 | 추가 호출 없음 — 총 시간이 여전히 ~510ms |
| CHANGE · STALE · FRESH | 서버 캐시를 도입해야 재현되는 상태 | **해당 없음 — 도입하지 않았다** |

**서버 캐시를 넣지 않은 이유.** 측정에서 나온 병목은 이미지 전송과 발견 지연이었고 둘 다 캐시와 무관하다. mock API의 500ms는 과제가 그대로 두라고 한 조건이라 캐시로 감출 대상이 아니다. 강의에 나왔다는 이유로 범위를 넓히면 병목과 무관한 최적화가 된다.

## 4단계 — 같은 조건에서 After와 회귀

측정 조건은 0단계와 같다(같은 URL·행동·viewport·throttling·브라우저·Lighthouse·프로필 방식).

| | Before `4f07c0ef` | After `6220deef` | 변화 |
| --- | --- | --- | --- |
| FCP 중앙값 | 1,353ms (폭 18ms) | 1,369ms (폭 101ms) | +16ms — 흔들림 폭 안 |
| **LCP 중앙값** | **44,828ms** (폭 26ms) | **1,891ms** (폭 30ms) | **−42,937ms (−95.8%)** |
| CLS | 0.0000 | 0.0000 | 변화 없음 |

### LCP 구간 비교

| 구간 | Before | After | 변화 |
| --- | --- | --- | --- |
| TTFB | 2ms | 508ms | **+506ms** (서버가 데이터를 기다림) |
| 발견 지연 | 3,344ms | 79ms | −3,265ms |
| 다운로드 | 41,450ms | 1,283ms | −40,167ms |
| 렌더 지연 | 31ms | 28ms | 변화 없음 |

### Hero 이미지

| | Before | After |
| --- | --- | --- |
| LCP element | 원본 `<img>` 3840×2160 | `next/image` (`w=750`) |
| 전송 크기 | 7,545,525B | 32,423B |
| 요청 시작 | 3,345ms | 584ms |

### 회귀 확인 (production build, 브라우저)

| 항목 | 결과 |
| --- | --- |
| 검색·카테고리·정렬·페이지 URL 반영 | 정렬 변경 → `?category=digital&sort=price-desc` |
| 뒤로 가기 | `?category=digital` 복원, 정렬 select `latest`, 카드 6장 |
| 앞으로 가기 | `?category=digital&sort=price-desc` 복원, select `price-desc` |
| 장바구니·위시리스트·Header 개수 | 담기·찜 후 `위시리스트 1 장바구니 1`, 이후 모든 전환에서 유지 |
| 로딩·에러·빈 상태·재시도 | 2단계 표 6종 모두 재현 확인 |
| 이미지 품질 | 시각적 크기·비율·피사체·문구 유지. 줄인 것은 전송 바이트뿐 |
| FSD 의존 방향 · Public API | Hero를 `widgets/hero`로 두고 `index.ts`로 공개. 측정용 픽스처(`src/examples/**`)를 제품 경로에서 걷어냈다 |
| 게이트 | `pnpm check`(test 42 · lint · typecheck · build) · `format:check` 모두 exit 0 |

### 효과가 없거나 악화된 것

- **TTFB +506ms** — 유일한 악화다. 서버가 홈 데이터를 기다리는 대가이고, 되돌리면 발견 지연 3.3초가 돌아온다. 순변화가 −42.9초라 유지한다.
- **FCP는 사실상 그대로** (1,353 → 1,369ms, After 흔들림 폭 101ms 안). 이번 개입은 전부 LCP 경로를 겨냥했고 FCP는 목표가 아니었다. 셸을 먼저 흘려보내지 않는 한 여기서 더 줄지 않는다.

## Advanced A — 관계없는 카드 렌더 (선택)

**하지 않았다.** Basic 범위를 먼저 마무리했고, 실제 클릭에서 관계없는 카드까지 렌더되는 병목을 아직 측정으로 확인하지 않았다. 강의 슬라이드가 보여준 "배열 대신 카드의 boolean을 구독" 패턴이 후보지만, Interactions track과 Profiler로 원인을 확인하기 전에는 넣지 않는다.

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
| 7 | 1-a·1-b·최종까지 같은 조건으로 5회씩 3번 더 측정(총 4세트 20회) | 1·4단계 표에 기록 |

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

이번 주는 앞선 주차와 기준이 다르다. **설계 판단까지 AI가 수행했고**, 그 근거를 모두 측정값으로 남겼다.

| 구분 | 범위 |
| --- | --- |
| **직접 결정 (최종 판단)** | eslint 적용 범위를 어느 룰에 어떻게 둘지(메타 룰 + 옵션으로 좁히는 안을 채택), Hero를 기존 `h1`을 유지한 채 연결할지, 커밋을 어떻게 나눌지, 슬라이드 자료를 레포에 넣지 않을지. 그리고 **1~4단계를 AI가 진행하도록 한 결정** |
| **AI가 판단 (설계·병목), 근거는 측정값** | 어느 구간이 병목인지의 판정(다운로드 92% → 발견 지연 78%), 각 단계에서 고른 개입과 그 순서, `priority`를 새 개입이 아니라 Before 동작 유지로 본 판단, TTFB +506ms를 감수하고 유지한 판단, 셸 스트리밍·`fetchPriority` 추가·Advanced A를 하지 않은 판단, 목록 6상태의 화면 구분 기준(`status`가 아니라 "보여줄 목록이 있는가"), metadata title·description 규칙 |
| **AI가 구현 (기계적)** | 머지 충돌 해결 반영, eslint 설정 블록, `widgets/hero`, 서버 prefetch·`getQueryClient`·`fetchJson` origin 해석, 목록 6상태 UI와 스켈레톤, `resolveProductListQuery`, root/페이지 metadata, 이 문서 |
| **AI가 실행·기록 (측정)** | Lighthouse 4세트 20회(Before·1-a·1-b·최종), LCP 구간·waterfall, 초기 HTML 검증, 목록 6상태 브라우저 재현, metadata 6종 확인, `APP_ORIGIN` 실패 재현, UA 비교, 회귀 확인, 게이트 결과 |

### 되짚을 지점

시간이 없어 AI가 판단까지 했으므로, 다음 세 가지는 직접 확인하는 편이 좋다.

1. **서버 호출 계수** — 임시 서버 로그로 Route Handler 호출 횟수를 직접 세지 않았다. 응답 시점(~510ms = 1회분)은 간접 증거다.
2. **filmstrip과 Layout Shifts track** — Lighthouse headless로만 쟀다. CLS는 전 구간 0.0000이지만 눈으로 대조하지 않았다.
3. **TTFB +506ms를 감수한 판단** — 순변화가 −42.9초라 유지했지만, 셸을 먼저 흘려보내는 선택지를 실제로 재보지는 않았다.
