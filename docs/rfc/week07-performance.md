# 7주차 — 프론트엔드 성능 최적화 근거 기록

> 개선 목록이 아니라, **실제로 본 사실에서 어떤 결정을 내렸는지**를 남긴다.
> 각 변경은 `왜 → AS-IS → TO-BE → 확인` 네 칸을 채운다.
> 효과가 없었거나 악화된 변경도 같은 형식으로 남긴다. 숨기지 않는다.

---

## 0. 측정 조건 (Before / After 고정)

SHA를 제외한 아래 값은 Before와 After에서 **동일해야 한다.** 하나라도 달라지면 그 회차는 폐기한다.

| 항목              | 값                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------- |
| 실행 방식         | `APP_ORIGIN=http://localhost:3000 pnpm build && APP_ORIGIN=http://localhost:3000 pnpm start` |
| 측정 URL          | `http://localhost:3000/`                                                                     |
| 행동              | cold load (탐색·클릭 없음)                                                                   |
| Lighthouse preset | **Mobile** — 412×823, DPR 1.75 · 데스크탑은 부수 지표로 별도 기록                            |
| **Throttling**    | **No throttling** (멘토 지시)                                                                |
| 캐시              | 매 회차 disable cache + hard reload                                                          |
| 브라우저 프로필   | 확장·로그인·기존 캐시 없는 별도 프로필                                                       |
| 회차              | **버리는 warm-up 1회 후 5회**                                                                |
| Node / pnpm       | v24.17.0 / 10.15.1                                                                           |
| Next / React      | 16.2.10 / 19.2.4                                                                             |
| Chrome 버전       | 150.0.7871.187                                                                               |
| Lighthouse 버전   | 13.4.1                                                                                       |

CLI 교차 검증에서 확인한 실측 설정값 — DevTools 설정이 이와 다르면 그 회차는 폐기한다.

```
formFactor: mobile · screen 412×823 @DPR 1.75
throttlingMethod: provided   (= No throttling)
rttMs 0 · throughputKbps 0 · cpuSlowdownMultiplier 1
```

### warm-up 1회를 버리는 이유

warm-up 없이 잰 첫 회차가 LCP 831ms 로 나머지(705~742ms)보다 크게 튀었다.
Next 서버가 첫 요청에서 라우트를 워밍업하는 몫이다.

| 절차               | LCP 중앙값 | LCP 범위         | 편차     |
| ------------------ | ---------- | ---------------- | -------- |
| warm-up 없음       | 721 ms     | 705 – 831 ms     | 17.9%    |
| **warm-up 1회 후** | **701 ms** | **698 – 725 ms** | **3.9%** |

범위가 126ms → 27ms 로 좁아졌다. 판정 기준이 "5회 raw 범위보다 큰 변화인가"이므로,
이 절차 하나가 계측기의 분해능을 4.7배 올린다. Before·After 모두 같은 절차를 쓴다.

### 계측 함정 — DevTools Lighthouse 패널로는 No throttling 이 재현되지 않았다

패널에서 `No throttling` 을 골라도 리포트 하단 런타임 줄이 계속 `Slow 4G throttling` 으로 찍혔다.
`+` 로 설정 화면을 새로 열어 다시 시도해도 같았다.

라벨이 신뢰할 수 있는지부터 검증했다. 리포트 렌더러는 `throttlingMethod` 로 분기한다.

| `throttlingMethod` | 하단 라벨                   |
| ------------------ | --------------------------- |
| `provided`         | **Provided by environment** |
| `simulate`         | Slow 4G throttling          |
| `devtools`         | Slow 4G throttling          |

CLI 로 `--throttling-method=provided` 실행 시 실제로 `Provided by environment` 가 찍힌다.
따라서 `Slow 4G throttling` 이 찍혔다는 것은 **선택이 반영되지 않았다는 뜻**이다.

패널에서 `Slow 4G` 를 명시적으로 고르면 이번엔 타임아웃이 난다.

> The page loaded too slowly to finish within the time limit. Results may be incomplete.

이 회차는 무효다. Hero 가 그려지기 전에 측정이 끊겨 LCP 가 다른 요소 값(2.1s)으로 대체됐다.
SI 11.7s(빨강)와 LCP 2.1s(초록)가 동시에 나온 모순이 그 증거다.

**결론**: 이 환경의 DevTools 패널로는 no throttling 측정을 얻을 수 없어 CLI 를 공식 경로로 쓴다.
누구나 아래 한 줄로 재현할 수 있고, 조건이 플래그로 박혀 UI 상태에 좌우되지 않는다.

```bash
pnpm dlx lighthouse http://localhost:3000/ \
  --throttling-method=provided \
  --throttling.rttMs=0 --throttling.throughputKbps=0 --throttling.cpuSlowdownMultiplier=1 \
  --view
```

세 모드를 같은 서버·같은 코드에서 CLI 로 재현해 둔 대조표다.

| 모드                       | `throttlingMethod` | LCP        | 경고         |
| -------------------------- | ------------------ | ---------- | ------------ |
| Simulated throttling       | `simulate`         | 40,883 ms  | 없음         |
| DevTools throttling (실제) | `devtools`         | 43,655 ms  | **타임아웃** |
| **No throttling**          | **`provided`**     | **701 ms** | 없음         |

측정값과 경고 유무만으로도 어느 모드가 돌았는지 식별할 수 있다.

### 조건 변경 이력

최초에는 Lighthouse 기본값인 Slow 4G 시뮬레이션으로 측정했고, 이후 멘토링 당시 질문 피드백에 따라
**Lighthouse 를 실무 기준 측정 방식 No throttling 으로 전환**했다.

**지시의 적용 범위는 Lighthouse 뿐이다.** Performance·Network 패널은 Slow 4G 를 유지한다.

| 도구             | 조건              | 역할                                                |
| ---------------- | ----------------- | --------------------------------------------------- |
| **Lighthouse**   | **No throttling** | **공식 Before/After 판정 지표** (FCP·LCP·CLS)       |
| Network 패널     | Slow 4G           | 전송 크기·요청 시작 순서·구간 분해                  |
| Performance 패널 | Slow 4G           | 표시 순서(filmstrip)·Layout Shifts                  |
| Lighthouse (구)  | Slow 4G           | 보조. 전환 전 수집분. 실사용자 회선에서의 비용 설명 |

Network·Performance 를 Slow 4G 로 두는 것이 오히려 낫다.
no throttling 에서는 Hero 전송이 84ms 에 끝나 waterfall 과 filmstrip 에서 **아무것도 관찰되지 않는다.**
"사용자가 기다린 이유를 확인"하려면 기다림이 보이는 조건이 필요하다.

**전송 크기(7,546 kB)는 어느 조건에서도 같다.** 스로틀은 시간을 바꿀 뿐 바이트를 바꾸지 않는다.
개선 근거의 핵심 수치는 조건 변경의 영향을 받지 않는다.

**Before SHA**: `71f4e3535ba65303da4e524aa54a51f4fb95bab7` (`71f4e35`)
**After SHA**: `2607c5d61630beb9521972494f385f863a7b199c` (`2607c5d`) — 5장의 3조건 재측정
**최종 SHA**: `db84ce1` — 변경 5(상품 카드 `sizes`)까지 반영한 상태

> SHA 는 커밋 이후에만 알 수 있으므로 이 줄은 각 측정 다음 커밋에 실린다.
> Before 로 측정한 코드 상태는 `71f4e35`, After 는 `2607c5d` 그 자체다.
> After 측정 직전에 계측용 `src/middleware.ts` 를 삭제했고, 그 삭제가 곧 `2607c5d` 다.

### Device 는 Mobile 로 고정한다

과제는 device 를 지정하지 않는다. "같은 viewport 와 CPU·network throttling" 이라는 **일관성**만 요구한다.
멘토는 desktop 을 easy mode, mobile 을 hard mode 로 제시했고 **mobile 을 선택**했다.

두 device 를 같은 조건(no throttling · warm-up 후 5회)으로 재 보고 고른 것이다.

| 항목            | **Mobile** 412×823 @1.75 | Desktop 1350×940 @1 |
| --------------- | ------------------------ | ------------------- |
| FCP 중앙값      | 618 ms                   | 596 ms              |
| LCP 중앙값      | 701 ms                   | 693 ms              |
| LCP 범위        | **27 ms**                | 48 ms               |
| CLS             | 0                        | 0                   |
| Hero 표시 크기  | 332×415 → 필요 581×726   | 1136×639            |
| Lighthouse 낭비 | 7,388,963 B (98.0%)      | 7,424,255 B (98.4%) |
| TTFB            | 513 ms (73%)             | 514 ms (74%)        |

**두 device 의 측정 결과는 사실상 같다.** no throttling 에서 병목이 TTFB 514ms 이고,
이는 device 와 무관한 고정 비용이기 때문이다. 낭비율도 98.0% vs 98.4% 로 차이가 없다.

> 처음에는 "데스크탑은 문제의 크기가 줄어든다"고 가정했으나 **측정으로 반증됐다.**
> Slow 4G 시절의 격차(41.1s vs 6.8s)를 no throttling 에 그대로 대입한 것이 오류였다.

따라서 device 선택은 **측정이 아니라 구현 난이도의 문제**다.

| device  | 측정으로 보이는 문제 | 구현해야 할 것                                           |
| ------- | -------------------- | -------------------------------------------------------- |
| Desktop | 동일                 | 16:9 하나, DPR 1                                         |
| Mobile  | 동일                 | + 16:9·4:5 두 비율 art direction, DPR 1.75, CLS 2회 검증 |

Mobile 을 고른 근거는 셋이다.

- `HeroSection.module.css` 의 `@media (max-width: 640px)` 로 4:5·16:9 두 비율을 모두 다루게 되고,
  같은 원본을 비율이 다른 두 뷰포트에 쓰는 문제를 실제로 풀어야 한다
- starter 가 모바일을 상정하고 만든 컴포넌트다 (`object-position: 56%` 도 모바일 전용)
- LCP 범위가 27ms 로 desktop(48ms)보다 좁아 계측기가 더 예민하다

**device 를 측정 중간에 바꾸면 안 되는 이유**: 위 미디어쿼리 때문에 뷰포트가 640px 를 넘으면
Hero 가 `4/5` → `16/9` 로 바뀌어 **LCP 요소의 크기 자체가 달라진다.** Before/After 비교가 깨진다.
device 는 throttling 이 아니므로, throttling 지시가 바뀌어도 이 설정은 유지한다.

**데스크탑을 부수 지표로 함께 남기는 이유**: 모바일 표시 크기(332×415 CSS px)에만 맞춰 이미지를 줄이면
데스크탑(1136×639)에서 화질이 깨진다. 과제는 "작게 보이게 하거나 품질을 낮춰 수치만 줄이는 것"을 금지한다.
뷰포트별 후보를 내리고, 데스크탑 LCP·화질이 나빠지지 않았음을 데스크탑 측정으로 증명해야 한다.

### 수치를 얻은 방법 (재현 절차)

이 문서의 모든 숫자는 아래 넷 중 하나에서 나왔다. 어떤 수치가 어디서 왔는지 밝혀 둔다.

#### ① Lighthouse CLI — FCP / LCP / CLS / LCP 구간 / 전송 크기

버리는 warm-up 1회 뒤 5회. 매 회 `mktemp -d` 로 만든 새 Chrome 프로필을 쓴다.

```bash
pnpm dlx lighthouse "http://localhost:3000/" \
  --only-categories=performance \
  --throttling-method=provided \
  --throttling.rttMs=0 --throttling.throughputKbps=0 --throttling.cpuSlowdownMultiplier=1 \
  --output=json --output-path="run-N.json" \
  --chrome-flags="--headless=new --no-first-run --disable-extensions --user-data-dir=$PROFILE"
```

데스크탑 부수 측정은 여기에 `--preset=desktop` 을 더한다.

JSON 에서 읽은 필드는 다음과 같다. 화면에 표시되는 반올림값이 아니라 원값이다.

| 수치                  | JSON 경로                                                           |
| --------------------- | ------------------------------------------------------------------- |
| FCP / LCP             | `audits["first-contentful-paint"                                    | "largest-contentful-paint"].numericValue` |
| CLS                   | `audits["cumulative-layout-shift"].numericValue`                    |
| LCP 4구간             | `audits["lcp-breakdown-insight"].details.items[0].items[].duration` |
| LCP element·표시 크기 | `audits["lcp-breakdown-insight"].details.items[].boundingRect`      |
| 발견 진단 3항목       | `audits["lcp-discovery-insight"].details.items[].items`             |
| 전송 크기·요청 시각   | `audits["network-requests"].details.items[].transferSize            | networkRequestTime`                       |
| 낭비 판정             | `audits["image-delivery-insight"].details.items[].wastedBytes`      |
| 실제 적용된 조건      | `configSettings.throttling`, `configSettings.screenEmulation`       |

중앙값·최솟값·최댓값은 5회 raw 값을 정렬해 계산한다. 편차는 `(max - min) / min`.

#### ② curl — TTFB, 대역폭별 전송 시간

TTFB 는 `time_starttransfer` 다.

```bash
curl -s -o /dev/null -w 'start=%{time_starttransfer}s total=%{time_total}s\n' http://localhost:3000/
```

Slow 4G 회선에서의 전송 시간은 대역폭만 제한해 잰다. `--limit-rate 184k` 는
Lighthouse Slow 4G 프리셋의 하향 1,474.56 kbps(= 약 184 kB/s)에 맞춘 값이다.

```bash
curl -s -o /dev/null --limit-rate 184k -w '%{size_download}B %{time_total}s\n' <URL>
```

> 이 값은 대역폭만 반영한다. RTT·동시 요청 경합이 빠져 있어 브라우저 실측보다 낮게 나온다.
> 실제로 사용자가 DevTools Slow 4G 에서 잰 B1 Hero 는 3.18s 였고, 같은 파일의 curl 값은 0.55s 였다.
> 그래서 이 수치는 **절대값이 아니라 방식 간 비율 비교**에만 쓴다.

#### ③ 초기 HTML 확인 — 어떤 요소가 첫 플러시에 들어가는가

`--max-time` 으로 스트리밍 도중에 끊어 첫 청크만 읽는다.

```bash
curl -s --max-time 0.3 http://localhost:3000/ | grep -o '<h1>[^<]*</h1>'
curl -s --max-time 0.3 http://localhost:3000/ | grep -c 'hero-original\.jpg'
```

#### ④ middleware — Route Handler 호출 횟수

`src/app/**` 는 과제 제공 코드라 수정하지 않기로 했으므로 Route Handler 에 로그를 넣을 수 없다.
대신 **요청이 서버로 들어오는 자리**에서 센다.

서버가 보내는 `fetch('http://localhost:3000/api/home')` 은 자기 자신에게 보내는 진짜 HTTP 요청이라
다시 들어올 때 middleware 를 통과한다. `src/middleware.ts` 는 `app/api` 밖이므로 제약에 걸리지 않는다.

```ts
// src/middleware.ts — 계측용 임시 파일
import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  console.error(`[count] ${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
```

```bash
pnpm build && pnpm start
curl -s -o /dev/null http://localhost:3000/     # 페이지 1회 요청
# 터미널에 찍힌 [count] 줄 수 = Route Handler 호출 횟수
```

**왜 이 자리여야 하는가** — `shared/api/apiClient.ts` 에 카운터를 넣으면 **memoization 이전**을
세게 되어 홈에서 2가 나온다. Next 의 fetch memoization 은 요청을 보내기 전에 중복을 제거하므로,
실제 Route Handler 도달 횟수를 보려면 요청이 나간 뒤인 **서버 진입 지점**에서 세야 한다.

**계측 제거**: `src/middleware.ts` 파일 하나만 지우면 된다. 앱 코드에는 흔적이 남지 않는다.

> Next 16 은 이 파일 규약을 `proxy` 로 개명 중이며 `middleware` 이름은 빌드 시 deprecated 경고를 낸다.
> 계측용으로 잠깐 쓰고 지우는 파일이라 그대로 두었다.

**시도했다가 쓸 수 없었던 방법**

| 방법                                                  | 결과                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `next start` 기본 로그                                | 요청 로그를 남기지 않는다                                        |
| `next.config` 의 `logging.fetches`·`incomingRequests` | **개발 모드 전용.** production 에서는 아무것도 찍히지 않는다     |
| `nc -l` 로 요청만 받기                                | 응답을 주지 않으면 React Query 가 retry 해서 횟수가 부풀려진다   |
| 별도 카운팅 프록시(:3100) + `APP_ORIGIN` 변경         | 동작하지만 프로세스·재빌드·터미널이 늘어난다. middleware 로 대체 |

#### ⑤ curl — User-Agent 별 응답 시점

```bash
curl -s -o /dev/null -w 'normal   start=%{time_starttransfer}s total=%{time_total}s\n' "$APP_ORIGIN/"
curl -A 'facebookexternalhit/1.1' -s -o /dev/null \
  -w 'facebook start=%{time_starttransfer}s total=%{time_total}s\n' "$APP_ORIGIN/"
```

첫 청크에 무엇이 들어 있는지는 스트리밍 도중에 끊어서 본다.

```bash
curl -s --max-time 0.1 "$APP_ORIGIN/" | grep -c '<title>'   # 0 이면 나중 청크로 온다
curl -s "$APP_ORIGIN/" | grep -c '<title>'                  # 1 이면 최종 HTML 에는 있다
curl -A 'facebookexternalhit/1.1' -s --max-time 0.1 "$APP_ORIGIN/" | wc -c   # 0 이면 블로킹
```

DevTools 로도 같은 것을 볼 수 있다. Network 탭 → `⌘⇧P` → `Show Network conditions`
→ `Use browser default` 해제 → `facebookexternalhit/1.1` 입력 후 재로드하고,
document 행의 `Timing` 탭에서 `Waiting for server response` 와 `Content Download` 길이를 비교한다.

#### ⑥ sharp — 크롭 구도 검증

미리 자른 후보가 CSS 가 실제로 보여주는 영역과 같은지는 수치로 잡히지 않아 픽셀로 대조했다.
표시 크기·원본 크기·`object-position` 으로 CSS 가 보여줄 구간을 역산해 원본에서 잘라내고,
생성한 후보와 같은 크기로 맞춘 뒤 채널별 절대차의 평균을 냈다.

```
scale = 표시높이 / 원본높이            (object-fit: cover 는 높이를 맞춘다)
left  = (원본폭 - 표시폭/scale) × 0.56  (object-position 은 넘치는 폭을 비율로 배분한다)
```

평균 차이 2.47 / 255(약 1%)는 JPEG·AVIF 재압축 오차 수준이며 구도 차이가 아니다.

#### 사용자 수동 측정과의 관계

DevTools 패널로는 No throttling 이 재현되지 않아(위 "계측 함정" 참조) 공식 지표는 CLI 로 잰다.
사용자 수동 측정은 CLI 가 못 하는 것에 쓴다 — **화질 육안 판정, 크롭 구도, 로딩 중 화면**,
그리고 Network 패널의 최종 URL·전송 크기 교차 확인.

### 측정 전 코드 변경 (성능 개입 아님, Before SHA에 포함)

| 변경                                            | 이유                                                       |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `apiClient` 서버 origin을 `APP_ORIGIN`으로 전환 | 3단계 metadata query failure 재현 명령의 전제              |
| `scenario`를 URL 조건으로 승격                  | `/products?scenario=slow` 재현 경로 확보 (2단계 측정 전제) |

> `src/app/api/**` 는 과제 제공 테스트 API이므로 **수정하지 않는다.**

---

## 1. 초기 현황 (AS-IS 근거)

### 1-1. 홈 cold load — FCP / LCP / CLS (공식: No throttling)

#### Lighthouse CLI 13.4.1 · **Mobile** 412×823 @1.75 · headless · warm-up 1회 후 5회 · 매 회 새 프로필

이 표가 **공식 지표**다. 아래 Desktop 표와 1-1-보조의 Slow 4G 표는 부수 지표다.

| 회차       | FCP (ms) | LCP (ms) | CLS   |
| ---------- | -------- | -------- | ----- |
| 1          | 606      | 698      | 0     |
| 2          | 613      | 705      | 0     |
| 3          | 634      | 725      | 0     |
| 4          | 618      | 701      | 0     |
| 5          | 618      | 701      | 0     |
| **중앙값** | **618**  | **701**  | **0** |
| **최솟값** | 606      | 698      | 0     |
| **최댓값** | 634      | 725      | 0     |
| 편차       | 4.6%     | 3.9%     | —     |

#### DevTools Lighthouse 패널 · No throttling · Mobile — **수집 불가**

이 자리에 수동 측정 5회를 넣으려 했으나 **이 환경에서는 수집할 수 없다.**
패널에서 No throttling 을 골라도 반영되지 않고(리포트 하단 `Slow 4G throttling`),
Slow 4G 를 명시적으로 고르면 타임아웃으로 회차가 무효가 된다. 근거는 0장 "계측 함정".

따라서 이 조건의 수동 측정은 존재하지 않으며, 대신 두 가지로 대체한다.

- **조건 재현성**: CLI 플래그(`--throttling-method=provided`)가 리포트 JSON 의
  `configSettings.throttlingMethod` 에 그대로 찍히는 것으로 확인한다 (0장 대조표)
- **수동 측정과의 교차 검증**: 패널이 정상 동작하는 **Slow 4G 조건**에서 수행한다.
  수동 5회와 CLI 5회를 대조한 결과는 1-1-보조와 6장에 있다.

> 점수·향상률에는 합격선을 두지 않는다. 이후 모든 변화는 **[최솟값, 최댓값] 범위보다 큰가**로 판정한다.
> 현재 LCP 범위는 **27ms** 다.

**판정 가능성 사전 점검** — 어떤 개입이 이 계측기로 증명되는가

| 개입                    | 절감 예상                | 범위 27ms 대비 | 증명 가능? |
| ----------------------- | ------------------------ | -------------- | ---------- |
| TTFB 해소 (렌더링 경계) | 513 ms → ~15 ms (~500ms) | 초과           | ✅         |
| 이미지 전송량 최적화    | 89 ms → ~10 ms (~79ms)   | 초과           | ✅         |

warm-up 없이 쟀을 때는 범위가 126ms 여서 이미지 개입(79ms)이 노이즈에 묻혔다.
절차를 고쳐 두 개입 모두 판정 가능해졌다.

#### 부수 지표 — Desktop, no throttling (CLI, warm-up 후 5회)

| 회차       | FCP (ms) | LCP (ms) | CLS   |
| ---------- | -------- | -------- | ----- |
| 1          | 606      | 731      | 0     |
| 2          | 593      | 693      | 0     |
| 3          | 592      | 683      | 0     |
| 4          | 596      | 696      | 0     |
| 5          | 600      | 692      | 0     |
| **중앙값** | **596**  | **693**  | **0** |
| **최솟값** | 592      | 683      | 0     |
| **최댓값** | 606      | 731      | 0     |

Hero 표시 크기 **1136 × 639** (DPR 1) · 낭비 판정 7,424,255 B (98.4%)
LCP 구간: TTFB 514 / load delay 11 / load duration 70 / render delay 89 ms

After 에서 데스크탑 화질과 LCP 가 나빠지지 않았음을 확인하는 기준선이다.

---

### 1-1-보조. Slow 4G (simulated) — 조건 전환 전 수집분

공식 지표가 아니다. **7.5MB 가 실사용자 회선에서 어떤 비용인지** 보여주는 자료로만 쓴다.

DevTools 패널 · Mobile · Simulated throttling

| 회차       | 시각    | FCP   | LCP    | TBT   | SI    | CLS |
| ---------- | ------- | ----- | ------ | ----- | ----- | --- |
| 1          | 8:46:20 | 0.9 s | 41.1 s | 20 ms | 1.3 s | 0   |
| 2          | 8:47:43 | 0.9 s | 41.1 s | 10 ms | 1.2 s | 0   |
| 3          | 8:48:10 | 0.9 s | 41.1 s | 20 ms | 1.2 s | 0   |
| 4          |         | 0.9 s | 41.1 s |       |       | 0   |
| 5          |         | 0.9 s | 41.1 s |       |       | 0   |
| **중앙값** |         | 0.9 s | 41.1 s |       |       | 0   |

CLI 5회: 중앙값 FCP 909ms / LCP 40,883ms / CLS 0 · 범위 40,809 – 41,112ms (편차 0.7%)

LCP 값이 무엇인지 산술로 확인된다.

```
7,545,239 B × 8 ÷ 1,474,560 bps ≈ 40.9 s   ≒ 측정된 LCP 40,883 ms
```

**이 조건에서 LCP 는 사실상 Hero 이미지의 다운로드 시간 그 자체다.**

#### 부수 지표 — Desktop 1회 (Slow 4G, 8:47:00)

| FCP   | LCP       | TBT  | SI    | CLS |
| ----- | --------- | ---- | ----- | --- |
| 0.3 s | **6.8 s** | 0 ms | 0.5 s | 0   |

데스크탑도 같은 병목이고 크기만 다르다.
After 에서 화질이 나빠지지 않았는지 확인하는 기준선으로 쓴다.

### 1-2. LCP element

```html
<img class="HeroSection-module__…__image" src="/images/week-07/hero-original.jpg" alt="" width="3840" height="2160" />
```

| 항목                 | 값                                        |
| -------------------- | ----------------------------------------- |
| 표시 크기            | 332 × 415 CSS px (412px 뷰포트, DPR 1.75) |
| 표시에 필요한 픽셀   | 약 581 × 726                              |
| 실제 원본            | 3840 × 2160                               |
| 전송 크기            | 7,545,239 B                               |
| Lighthouse 낭비 판정 | 7,388,963 B (98%)                         |

#### LCP 구간 분해

**공식 조건 (No throttling) — CLI, warm-up 후**

| 구간                   | ms      | 비중    |
| ---------------------- | ------- | ------- |
| **Time to first byte** | **513** | **73%** |
| Element render delay   | 107     | 15%     |
| Resource load duration | 89      | 13%     |
| Resource load delay    | 16      | 2%      |
| 합                     | 725     |         |

**이 조건의 최대 병목은 이미지가 아니라 TTFB 다.** 홈 API 의 500ms 지연이 HTML 응답을 막고,
그 뒤에야 나머지가 시작된다. Hero 는 `534ms → 618ms`, 84ms 만에 전송이 끝난다.

**보조 조건 (Slow 4G) — 같은 구간이 어떻게 달라지는가**

| 구간                       | DevTools | CLI   | 스로틀 적용 시           |
| -------------------------- | -------- | ----- | ------------------------ |
| Time to first byte         | 530 ms   | 519.4 | 거의 그대로              |
| Resource load delay        | 10 ms    | 15.3  | 거의 그대로              |
| **Resource load duration** | 130 ms   | 70.6  | **약 40,000 ms 로 폭발** |
| Element render delay       | 110 ms   | 94.1  | 거의 그대로              |

> Slow 4G 패널의 네 값은 **스로틀을 걸지 않고 관측한** 값이라 합이 780ms 이고,
> 표시되는 LCP 41.1s 는 거기에 Slow 4G 를 수식으로 얹은 **시뮬레이션** 값이다.
> 스로틀 하에서 커지는 것은 전송 구간뿐이다.

**두 조건을 나란히 둔 병목 판정**

| 구간                   | No throttling (공식) | Slow 4G (보조)       | 판단                                                   |
| ---------------------- | -------------------- | -------------------- | ------------------------------------------------------ |
| Time to first byte     | **513 ms (73%)**     | 530 ms (1%)          | **1차 표적.** 조건과 무관하게 항상 존재하는 고정 비용  |
| Resource load duration | 89 ms (13%)          | **~40,000 ms (98%)** | **2차 표적.** 회선이 느릴수록 폭발. 전송량 자체가 근거 |
| Element render delay   | 107 ms (15%)         | 110 ms               | 손댈 몫 없음                                           |
| Resource load delay    | 16 ms (2%)           | 10 ms                | 손댈 몫 없음 (발견은 이미 빠르다)                      |

**같은 코드인데 조건에 따라 1·2순위가 뒤집힌다.** 어느 쪽도 틀린 측정이 아니다.
TTFB 는 회선과 무관한 고정 비용이라 로컬에서 두드러지고,
전송량은 회선이 느릴수록 커져 실사용자에게 두드러진다.
그래서 두 개입 모두 하되, 각각의 근거를 각각의 조건에서 가져온다.

#### LCP 요청 발견 진단

| 항목                  | 결과  | 해석                      |
| --------------------- | ----- | ------------------------- |
| `requestDiscoverable` | true  | 초기 문서에서 이미 발견됨 |
| `eagerlyLoaded`       | true  | `loading=lazy` 아님       |
| `priorityHinted`      | false | `fetchpriority=high` 없음 |

DevTools Lighthouse 패널의 **Insights → LCP request discovery** 에서 같은 세 항목과
element(`img.HeroSection-module__lqBdna__image`)를 육안으로 확인했다. CLI 결과와 일치한다.

> Lighthouse 12 부터 단독 "Largest Contentful Paint element" 감사는 사라지고
> Insights 의 `LCP breakdown` · `LCP request discovery` 로 통합됐다. 탭이 안 보이는 게 정상이다.

`resource load delay` 가 15ms 다. 이미지는 이미 충분히 일찍 발견되어 요청된다.
→ preload·fetchpriority 로 줄일 수 있는 몫이 15ms 인데 병목은 40,000ms 다. 3장에 개입하지 않는 근거로 기록한다.

### 1-3. Performance filmstrip — 표시 순서

Performance 패널 실측 (Screenshots ✅ · CPU 4x · Slow 4G · 실제 스로틀, 시뮬레이션 아님)

| 순서 | 표시된 것                                                                | 시점        |
| ---- | ------------------------------------------------------------------------ | ----------- |
| 1    | Header(Commerce · 상품 · 위시리스트 · 장바구니)                          | 초반 (~1s)  |
| 2    | Hero **텍스트** (이번 주의 발견 / 제목 / 설명) + 베이지색 빈 이미지 박스 | 초반 (~1s)  |
| 3    | 카테고리 · 인기 상품 목록                                                | 초반 (~1s)  |
| 4    | **Hero 이미지가 채워지기 시작**                                          | 약 24,151ms |

**Hero 이미지는 나머지 콘텐츠를 막지 않는다.** Header·텍스트·카테고리·상품이 모두 1초 안에 떠 있고,
Hero 자리만 `.hero { background: #d8cebf }` 의 베이지 박스로 24초 넘게 비어 있다가 뒤늦게 채워진다.

→ 1단계에서 렌더링 경계를 바꿀 이유는 "Hero 가 다른 콘텐츠를 막아서"가 아니다.
막는 것은 Hero 가 아니라 **document TTFB 530ms**(홈 API 500ms)이고, 그 앞에서는 아무것도 없다.

### 1-4. Network waterfall

CLI 관측값 (run 3 기준, 스로틀 미적용 로컬 시간축):

| 리소스                                     | 요청 시작(ms)   | 종료(ms) | 전송 크기          |
| ------------------------------------------ | --------------- | -------- | ------------------ |
| document (`/`)                             | 0               | 523      | 7,394 B            |
| 폰트 woff2 × 2                             | 529 / 530       | ~537     | 23KB / 29KB        |
| CSS chunk × 3                              | 535 / 535 / 536 | ~543     | 6.2 / 1.0 / 1.2 KB |
| **Hero `hero-original.jpg`**               | **537**         | 605      | **7,545,525 B**    |
| 상품 카드 `/_next/image?…&w=828&q=75` × 14 | 537~577         | ~580     | 3 ~ 72 KB (webp)   |
| JS chunk × 13                              | 551~569         | ~578     | 0.9 ~ 71 KB        |

**`/api/home` 이 브라우저 Network 에 없다.** 서버 prefetch(`await queryClient.prefetchQuery`)라
SSR 중 서버가 호출한다. 대신 그 500ms 지연이 **document TTFB 519ms** 안에 통째로 들어 있다.
→ Header·페이지 제목·설명이 전부 이 519ms 를 기다린다. 1단계가 겨냥하는 지점이 여기다.

**상품 카드 이미지는 이미 `next/image`** 를 거쳐 webp 로 내려온다. raw `<img>` 는 Hero 하나뿐이다.

#### DevTools Network 실측 (All 필터 · Disable cache ✅ · Slow 4G · 실제 스로틀)

| 리소스                        | Type       | 전송 크기          | Time               |
| ----------------------------- | ---------- | ------------------ | ------------------ |
| `localhost` (document)        | document   | 7.4 kB             | 603 ms             |
| woff2 × 2                     | font       | 23.4 / 29.6 kB     | 1.00 / 1.08 s      |
| CSS × 3                       | stylesheet | 6.2 / 1.0 / 1.2 kB | 712 / 585 / 579 ms |
| **`hero-original.jpg`**       | **jpeg**   | **7,546 kB**       | **45.12 s**        |
| `image?url=…&w=828&q=75` × 14 | webp       | 3.0 ~ 72.3 kB      | 633 ms ~ 1.69 s    |
| script × 13                   | script     | 0.9 ~ 71.4 kB      | 575 ms ~ 1.89 s    |

**요약 (Network 하단 상태바)**

```
46 requests · 8.0 MB transferred · 8.5 MB resources
Finish 46.43 s · DOMContentLoaded 1.29 s · Load 45.70 s
```

| 사실                                  | 값                                    |
| ------------------------------------- | ------------------------------------- |
| Hero 가 전체 전송량에서 차지하는 비중 | **7,546 kB / 8.0 MB ≈ 92%**           |
| Hero 를 뺀 나머지 전부                | 약 0.6 MB                             |
| DOMContentLoaded → Load 간격          | 1.29 s → 45.70 s (**44.4 s 가 Hero**) |

같은 화면 안에서 raw `<img>`(7,546 kB)와 `next/image` 경유(72.3 kB)가 **104배** 차이로 나란히 찍혔다.

#### `hero-original.jpg` Timing 탭 — 전송 구간 확정

| 구간                        | 값          |
| --------------------------- | ----------- |
| Queued at                   | 576.61 ms   |
| Started at                  | 578.67 ms   |
| Queueing                    | 2.06 ms     |
| Stalled                     | 57.27 ms    |
| Request sent                | 40 µs       |
| Waiting for server response | 590.02 ms   |
| **Content Download**        | **44.48 s** |
| 합계                        | **45.12 s** |

**45.12초 중 44.48초(98.6%)가 Content Download 다.** `lcp-breakdown-insight` 의
`Resource load duration` 이 스로틀 하에서 폭발한다는 예측이 실측으로 확인됐다.
발견(576ms)·연결(57ms)·서버 응답(590ms)은 모두 1초 미만이다.

### 1-5. Layout Shifts

**CLS = 0.000, 5회 전부.** Hero 에 `width`/`height` 와 `aspect-ratio` 가 있어 예약 공간이 정확하다.

| 시점 | 이동한 요소 | 원인 |
| ---- | ----------- | ---- |
| —    | 없음        | —    |

세 가지 증거가 같은 말을 한다.

1. Lighthouse CLS 0.000 — 수동 5회 · CLI 5회 모두
2. Performance 녹화에 **Layout Shifts 트랙이 생성되지 않았다** (트랙은 `Network` · `Frames` · `Main` 뿐).
   Chrome 은 이동이 0건이면 트랙을 만들지 않는다
3. filmstrip 에서 Hero 이미지가 24s 에 채워질 때 아래 콘텐츠가 밀리지 않는다 — 박스 크기가 처음부터 확정

#### 2단계 전환 CLS — 로드 후 조작에서 생기는 이동

Lighthouse 의 CLS 는 **페이지 로드 중**의 이동만 센다.
목록 필터를 바꿀 때 생기는 이동은 로드가 끝난 뒤라 그 수치에 잡히지 않는다.
과제가 "녹화와 Layout shifts track 으로 확인"하라고 지정한 이유다.

측정은 Performance 패널과 Console 을 함께 썼다. 둘이 서로를 보완했다.

| 도구             | 총합 CLS      | 원인 요소                       | 작은 이동            |
| ---------------- | ------------- | ------------------------------- | -------------------- |
| Performance 패널 | **0.29** 표시 | "Could not detect any culprits" | 클러스터로 묶여 놓침 |
| Console observer | 개별 값만     | **`[article, h3, text, div]`**  | **0.00938 도 잡음**  |

패널만 봤으면 원인을 못 찾았고, Console 만 봤으면 총합을 몰랐다.

| 전환                   | 재현                   | 결과                           |
| ---------------------- | ---------------------- | ------------------------------ |
| 스켈레톤 → 실제 목록   | 새 탭 `?scenario=slow` | **CLS 0** — 트랙이 생기지 않음 |
| 갱신 문구 삽입·제거    | 목록이 뜬 뒤 조건 변경 | **0.01447** → 고침             |
| 결과 개수 변화(12↔6)   | 카테고리 변경          | **0.32164**                    |
| 결과 개수 동일(정렬만) | 정렬만 변경            | **0.16008 / 0.07819**          |

#### 고친 것 — 갱신 문구가 목록을 밀었다

`{updating && <p>…</p>}` 로 문구를 조건부 삽입했더니 아래 목록이 그만큼 밀렸다.
삽입은 클릭 직후라 `hadRecentInput: true` 로 제외되지만, **제거는 1.5초 뒤라 CLS 에 집계됐다.**

두 번에 걸쳐 고쳤고 첫 시도는 절반만 통했다.

| 시도                        | shift       | 왜 부족했나                           |
| --------------------------- | ----------- | ------------------------------------- |
| 문구를 조건부로 삽입        | 0.01447     | —                                     |
| `min-height` 로 한 줄 예약  | **0.00938** | 좁은 화면에서 문구가 두 줄로 감겼다   |
| **문구 제거, `opacity` 만** | **0**       | 레이아웃을 쓰지 않으므로 구조적으로 0 |

`opacity` 는 컴포지터에서만 처리되어 레이아웃 계산에 참여하지 않는다.
**자리를 정확히 맞추려 애쓰는 대신 자리를 쓰지 않는 수단으로 바꾼 것**이 해법이었다.
갱신 중임은 목록 딤드(시각)와 `aria-busy`(보조기술)가 알린다.

#### 고치지 못한 것 — 카드 높이 변동

**결과 개수가 같은 정렬 변경만으로도 이동이 난다.** 행 수 변화만으로는 설명되지 않는다.
카드 높이가 상품마다 달라 grid 가 행 높이를 그 행의 가장 큰 카드에 맞추기 때문이다.

두 가설을 세우고 각각 고쳐 봤으나 **둘 다 반증됐다.**

| 시도 | 가설                    | 조치                                        | 결과               |
| ---- | ----------------------- | ------------------------------------------- | ------------------ |
| 1    | 상품명 길이 차이(1~3줄) | `h3` 에 `line-clamp: 2` + `min-height: 2lh` | **0.16008 그대로** |
| 2    | 할인 상품의 가격 두 줄  | `strong` 에 `min-height: 2lh`               | **0.16008 그대로** |

가설 2 는 데이터로 뒷받침된 것이었다. 같은 12개인데 할인 상품이 `latest` 는 2개,
`popular` 는 6개다. 좁은 화면에서 정가 취소선이 함께 붙으면 두 줄로 감긴다.
그런데도 값이 바뀌지 않았다. **아직 찾지 못한 다른 요소가 남아 있다.**

**두 변경 모두 되돌렸다.** `line-clamp` 은 상품명을 잘라내는 실질적 비용이 있는데
측정된 이득이 0이었다. 효과 없는 변경을 남길 이유가 없다.

> shift 의 `sources` 에 `h3`·`text` 가 나온다고 그것이 원인은 아니다.
> **밀린 요소와 밀리게 만든 요소는 다르다.** 소스 목록만 보고 첫 가설을 세운 것이 실수였다.

#### 개입하지 않기로 한 것

남은 이동(0.07~0.32)은 결과가 실제로 달라져 생긴다. 과제가 CLS 를 묻는 맥락은
**"fallback 과 실제 콘텐츠가 바뀔 때"** 인데, 12개→6개는 fallback 교체가 아니라
검색 결과가 달라진 것이다. 커머스에서 정상 동작이다.

고칠 수 있는 방법은 있으나 둘 다 더 나쁘다.

| 방법                               | 대가                                             |
| ---------------------------------- | ------------------------------------------------ |
| 그리드에 `pageSize` 만큼 높이 예약 | 6개 결과일 때 빈 칸 6개. UX 가 명백히 악화       |
| `keepPreviousData` 제거            | **2단계 요구 위반.** 점수를 위해 UX 를 버리는 것 |

두 번째가 특히 중요하다. 목록을 비우면 이동이 클릭 직후로 앞당겨져
`hadRecentInput: true` 가 되어 **CLS 점수에서 빠진다.**
즉 **과제가 요구한 UX 개선(기존 목록 유지)이 CLS 점수를 악화시키는 구조**다.
점수와 경험이 충돌할 때 경험을 택했고, 과제도 "미리 정한 점수 합격선은 없다"고 한다.

Frames 트랙도 7.4~9.3ms 로 60fps(16.7ms) 안쪽이라 딤드 전환 중 프레임이 밀리지 않는다.

> `hadRecentInput` 규칙 때문에 클릭 직후 500ms 안의 이동은 CLS 점수에서 제외된다.
> 트랙이 비어 있어도 눈에 보이는 이동이 있을 수 있으므로 filmstrip 도 함께 본다.

측정에는 Performance 패널 외에 Console 한 줄도 쓸 수 있다. 값과 움직인 노드까지 나온다.

```js
new PerformanceObserver((l) =>
  l.getEntries().forEach((e) => {
    if (!e.hadRecentInput)
      console.log(
        'shift',
        e.value.toFixed(5),
        e.sources?.map((s) => s.node),
      );
  }),
).observe({ type: 'layout-shift', buffered: true });
```

### 1-6. 목록의 여섯 화면 — `/products?scenario=slow`

| 상태                    | 현재 화면                                                                         | 충족   |
| ----------------------- | --------------------------------------------------------------------------------- | ------ |
| 데이터 없는 최초 진입   | `상품을 불러오는 중입니다…` 문구 한 줄이 1.5초 보인 뒤 목록으로 교체              | ✗      |
| 이전 데이터가 있는 갱신 | 기존 목록은 유지되나 **갱신 중이라는 표시가 눈에 보이지 않음**                    | △ 절반 |
| 성공 + 0건              | `조건에 맞는 상품이 없습니다.` — **URL 조건 언급 없음**. 갱신 시 위와 같은 현상   | ✗      |
| 최초 실패               | 문구가 계속 보이다가 **API 4회 시도(최초 1 + retry 3) 후** 에러 UI + 다시 시도    | △ 지연 |
| 갱신 실패               | 재시도 중에는 이전 목록이 남지만, **실패 확정 시 목록이 사라지고 에러 UI로 대체** | ✗      |
| 취소                    | 요청이 전부 200 으로 완료되고 마지막 조건의 응답이 최종 표시                      | ✓      |

- 현재 URL의 active query와 화면 결과가 일치했는가: **일치했다.** 조건을 연속으로 바꿔도 마지막 조건의 결과가 표시됐다
- 이전 요청의 늦은 완료가 현재 화면을 덮었는가: **덮지 않았다.** React Query 가 최신 query key 의 결과만 반영한다
- 취소된 요청이 오류로 보였는가: **취소된 요청 자체가 없다.** `(canceled)` 가 하나도 없고 전부 200 으로 완료된다

#### 관찰 → 코드 대조

**갱신 중 표시가 안 보이는 이유** — `ProductListResult.tsx` 가 갱신 상태를
`aria-busy={isPlaceholderData}` 하나로만 표현한다. 보조기술용 속성이라 **시각적 변화가 없다.**
필터를 눌러도 1.5초 동안 화면이 그대로여서 사용자에게는 클릭이 먹지 않은 것처럼 보인다.

> 사용자 관찰 그대로: "필터를 변경했지만 리스트가 즉각 피드백이 안 와서 멈춘 것처럼 보일 수도 있겠다"

과제 요구는 "기존 목록을 비우지 않고 **갱신 중임을 보여줘야** 한다" 이므로,
목록 유지(✓)와 갱신 중 표시(✗) 중 후자가 빠져 있다.

**최초 실패가 늦게 보이는 이유** — React Query 기본 `retry: 3`.
Network 에 동일 URL 의 `500` 응답이 **4개**(514 / 508 / 507 / 509 ms) 찍힌다.
그 2초 남짓 동안 화면에는 로딩 문구만 있어 사용자가 실패를 인지하지 못한다.

**갱신 실패가 목록을 버리는 이유** — 같은 파일의 이 분기가 데이터 유무와 무관하게
에러만 렌더한다.

```tsx
if (error !== null) {
  return ( ...에러 문구만... );   // ← 이전 목록을 버린다
}
```

**취소가 없는 이유** — `fetchProductList` 가 `AbortSignal` 을 `fetch` 에 넘기지 않는다.
요청은 끝까지 실행되고, React Query 가 최신 key 가 아닌 결과를 버릴 뿐이다.
그래서 화면이 덮이지도, 오류로 보이지도 않는다 — **요구는 이미 충족**이다.

> 부수 확인: 실제 요청 URL 이 `products?category=all&sort=latest&page=1&pageSize=12&scenario=…` 로
> 나간다. 0-3 에서 승격한 `scenario` 가 query key 와 GET 요청에 함께 실리는 것이 확인됐다.

#### 2단계에서 개입할 것 / 하지 않을 것

| 상태       | 개입 | 내용                                                      |
| ---------- | ---- | --------------------------------------------------------- |
| 최초 진입  | ✅   | 실제 목록 크기를 예상할 수 있는 pending UI                |
| 갱신 중    | ✅   | 눈에 보이는 갱신 중 표시 (목록 유지는 그대로)             |
| 성공 + 0건 | ✅   | 현재 URL 조건과 0건임을 문구에 반영                       |
| 갱신 실패  | ✅   | 기존 목록을 유지한 채 갱신 실패 + 재시도 제공             |
| 최초 실패  | ⏸    | 동작은 요구를 만족한다. retry 3회로 인한 지연만 판단 대상 |
| 취소       | ❌   | 이미 충족. `AbortSignal` 을 넣을 근거가 관찰에 없다       |

> 이 표를 근거로 한 문제 정의는 1-7-2, 실제 변경은 2장 변경 4 에 있다.

### 1-7. 관찰 → 가설 → 반증 → 가장 작은 변경

공식 조건에서 병목이 둘로 갈리므로 가설도 둘이다. 순서는 공식 조건의 비중을 따른다.

**가설 A — TTFB 513ms (1차 표적, 공식 조건 LCP 의 73%)**

| 항목           | 한 문장                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 관찰한 사실    | No throttling LCP 701ms 중 513ms(73%)가 TTFB 이고, `/api/home` 은 브라우저 Network 에 없다. filmstrip 에서도 그 전까지 화면에 아무것도 없다.      |
| 원인 가설      | 홈 페이지가 `await queryClient.prefetchQuery` 로 홈 데이터를 다 받고서야 HTML 을 내보내, Header·제목·설명까지 mock API 의 500ms 를 함께 기다린다. |
| 가설 반증 방법 | 홈 데이터에 의존하지 않는 부분(Header·`h1`·페이지 설명)을 데이터 대기 밖으로 빼고 TTFB 를 다시 잰다. 513ms 가 그대로면 원인이 다른 데 있다.       |
| 먼저 할 변경   | 데이터 소유권에 맞게 렌더링 경계를 내린다. Route Handler 와 FSD 구조는 건드리지 않는다.                                                           |

**가설 B — 이미지 전송량 (2차 표적)**

| 항목           | 한 문장                                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 관찰한 사실    | Hero 원본 한 장이 전체 전송량의 92%(7,546 kB / 8.0 MB)다. Slow 4G 에서는 45.12s 중 44.48s 가 Content Download 였다.                                                                                      |
| 원인 가설      | 표시 크기 332×415 CSS px 에 3840×2160 원본을 그대로 내려서, 전송량이 표시에 필요한 양보다 두 자릿수 크다.                                                                                                |
| 가설 반증 방법 | 표시 크기에 맞는 후보·포맷으로 전송량만 줄이고 다른 조건을 그대로 둔 뒤, 전송 크기와 `Resource load duration` 이 함께 줄었는지 본다. 크기만 줄고 구간이 그대로면 전송량이 원인이라는 가설이 틀린 것이다. |
| 먼저 할 변경   | Hero 이미지를 뷰포트별 후보로 나눠 최신 포맷으로 내린다. 데스크탑 화질이 나빠지지 않는지 부수 지표로 함께 확인한다.                                                                                      |

**개입하지 않기로 미리 정한 것**: 요청 우선순위(preload·`fetchpriority`). 두 조건 모두에서
`Resource load delay` 가 10~16ms 다. 이미 충분히 일찍 발견되어 요청된다.

### 1-7-2. 목록 축 — 문제 정의

가설 A·B 와 성격이 다르므로 형식도 다르게 잡는다.

A·B 는 "왜 느린가"를 묻는 **인과 가설**이라 반증할 대상이 있었다.
목록 4건은 과제 2단계 표에 이미 요구가 명시돼 있고, 관찰과 그 요구 사이의 **차이**가 문제다.
따라서 `관찰 → 요구 → 차이 → 변경` 으로 적는다. 반증할 인과가 없다.

| 상태       | 관찰(1-6)                            | 2단계 요구                                        | 차이                       | 변경 |
| ---------- | ------------------------------------ | ------------------------------------------------- | -------------------------- | ---- |
| 최초 진입  | 로딩 문구 한 줄                      | 실제 목록 크기를 예상할 수 있는 pending UI        | 크기를 예상할 단서가 없다  | ✅   |
| 갱신 중    | 목록 유지, 표시 없음                 | 기존 목록을 비우지 않고 **갱신 중임을 보여줄 것** | 유지는 되나 표시가 없다    | ✅   |
| 성공 + 0건 | `조건에 맞는 상품이 없습니다.`       | **현재 URL 조건**과 0건임을 분명히                | 조건이 문구에 없다         | ✅   |
| 갱신 실패  | 실패 확정 시 목록이 사라짐           | **기존 목록을 유지한 채** 실패와 재시도           | 목록을 버린다              | ✅   |
| 최초 실패  | retry 4회(약 2s) 뒤 실패 UI + 재시도 | 목록 대신 실패 이유와 다시 시도할 방법            | 요구는 충족. 지연만 관찰됨 | ⏸    |
| 취소       | 전부 200 완료, 화면 안 덮음          | 오류로 보이거나 현재 화면을 덮지 않을 것          | 없음                       | ❌   |

**개입하지 않기로 정한 것**

- **취소** — `AbortSignal` 을 넣을 근거가 관찰에 없다. 요청은 끝까지 실행되지만
  React Query 가 최신 key 가 아닌 결과를 버려서 화면이 덮이지 않는다. 요구는 이미 충족이다.
- **최초 실패의 retry 지연** — 동작 자체는 요구를 만족한다.
  `retry: 3` 을 줄이면 실패를 빨리 알릴 수 있지만, 일시적 실패에서 자동 복구할 기회도 함께 줄어든다.
  관찰만으로는 어느 쪽이 나은지 판단할 근거가 없어 남겨 둔다.

**갱신 실패를 고칠 때의 제약** — 과제가 "서버 응답을 Zustand 나 별도 로컬 상태에 복사하지 않아요"
를 금지하므로, 이전 목록을 화면에 남기는 방법이 자유롭지 않다. 이 제약이 변경 4 의 설계를 결정한다.

### 1-8. 통합 중 발견한 회귀 — 홈의 `h1` 소실

`HeroSection` 을 홈에 붙이면서 기존 `<h1>{banner.title}</h1>` 이 제거되고
`HeroSection` 내부의 `<h2>` 로 대체됐다.

```diff
-        <p>{banner.description}</p>
-        <h1>{banner.title}</h1>
+        <HeroSection title={banner.title} description={banner.description} />
```

현재 홈에는 `h1` 이 하나도 없다. 3단계 "초기 응답에 하나의 명확한 `h1`" 요구를 위반한다.
성능과 무관한 통합 부작용이므로 Phase 1 에서 되돌린다.

---

## 2. 변경 기록

<!--
변경 단위마다 아래 블록을 복사해 채운다.

### 변경 N — <제목>

**왜**
- 관찰: (1장의 어떤 사실인가)
- 가설: (그 사실의 원인)
- 선택: (왜 다른 변경이 아니라 이것인가)

**AS-IS**
```
(코드 / 동작 / 수치)
```

**TO-BE**
```
(코드 / 동작 / 수치)
```

**확인**
- 무엇이 얼마나 달라졌나:
- 1-1 표의 범위보다 큰 변화인가:
- 되돌렸다면 그 이유:
-->

### 변경 1 — 렌더링 경계를 데이터 소유권대로 나눈다 (가설 A)

**왜**

- 관찰: No throttling LCP 701ms 중 TTFB 가 513ms(73%)다. `/api/home` 은 브라우저 Network 에 없고, filmstrip 상 그 전까지 화면에 아무것도 없다.
- 가설: 홈 페이지가 `await queryClient.prefetchQuery` 로 홈 데이터를 다 받고서야 HTML 을 내보낸다. 제목·설명처럼 홈 데이터와 무관한 것까지 mock API 의 500ms 를 함께 기다린다.
- 선택: 요청 우선순위(preload·`fetchpriority`)는 고르지 않았다. `Resource load delay` 가 16ms 라 줄일 몫이 없다. 이미지 최적화도 이 시점의 1차 표적이 아니다 — 전송 구간은 89ms 였다.

**AS-IS**

```tsx
// app/(shop)/page.tsx
export default async function HomePage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(homeQueryOptions.list()); // ← HTML 을 막는다

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePageBoundary /> {/* Suspense 하나가 Hero·카테고리·상품을 통째로 감쌈 */}
    </HydrationBoundary>
  );
}
```

- 초기 HTML 에 `h1` 이 없다 (Hero 통합 때 `h1` 이 `h2` 로 대체됨)
- 홈 데이터를 기다리는 동안 화면 전체가 로딩 문구 하나로 대체된다

**TO-BE**

경계를 넷으로 나눈다. 홈 데이터를 기다려야 하는 것만 기다린다.

```
페이지 제목·설명   정적          → 초기 HTML
Hero 배경 이미지   정적          → 초기 HTML  (브라우저가 즉시 발견해 요청)
Hero 문구          banner        → Suspense
카테고리·상품 목록  나머지 응답    → Suspense (HomePageBoundary)
```

- `await` 제거 → 쿼리가 pending 상태로 dehydrate 되어 promise 째 전달된다.
  `shared/api/queryClient.ts` 의 `shouldDehydrateQuery` 가 pending 을 포함시키는 것이 전제다
- `HeroSection` 을 데이터 받지 않는 뼈대(`children`)로 바꾸고, 문구만 `HeroCopy` 로 분리
- 소실됐던 `h1` 을 정적 문구로 복구

**확인**

두 단계로 나눠 측정했다. **1차는 거의 실패였다.**

| 단계   | 변경                    | FCP    | LCP        | CLS    |
| ------ | ----------------------- | ------ | ---------- | ------ |
| Before | —                       | 618 ms | 701 ms     | 0      |
| A1     | `await` 제거 + 껍데기만 | 67 ms  | **662 ms** | 0      |
| A2     | 경계까지 분리           | 86 ms  | **178 ms** | 0.0066 |

A1 에서 LCP 가 39ms 밖에 줄지 않았다. 구간을 보면 **500ms 가 사라진 게 아니라 옮겨갔다.**

| 구간                   | Before | A1      | A2  |
| ---------------------- | ------ | ------- | --- |
| Time to first byte     | 513    | **5**   | 5   |
| Resource load delay    | 16     | **507** | 32  |
| Resource load duration | 89     | 35      | 55  |
| Element render delay   | 107    | 86      | 137 |

Hero `<img>` 가 스트리밍 청크 안에 들어가 브라우저가 발견하지 못했다. 요청 시작이 534ms → 512ms 로 사실상 그대로였다.
이미지 `src` 는 정적인데 문구와 한 컴포넌트에 묶여 있던 것이 원인이다.

경계를 나누자 이미지가 첫 플러시(약 10ms)에 들어가고 요청 시작이 **39ms** 로 앞당겨졌다.

**같은 원인이 UX 문제이기도 했다.** Hero 가 데이터 경계 안에 있어 화면 전체가 로딩 문구로 덮였다.
사용자 관찰("hero section 밑에 상품리스트쪽에만 로딩 UI가 보여야 할 것 같다")이 성능 병목과 같은 지점을 가리켰다.

A2 에서 CLS 0 → 0.0066 회귀가 생겼다. → 변경 2 에서 다룬다.

### 변경 2 — Hero 문구 카드의 자리를 확정한다 (변경 1 의 회귀 수습)

**왜**

- 관찰: A2 에서 CLS 가 0 → 0.0066. Lighthouse `layout-shifts` 가 지목한 요소는 `div.copy` 하나이고, 최종 높이는 159px 였다.
- 가설: `.copy` 는 `inset: auto auto …` 로 **좌하단에 고정**돼 있어 내용이 길어지면 위로 자란다. fallback 이 실제 문구보다 짧으면 교체 순간 카드 윗변이 움직인다.
- 선택: 변경 1 을 되돌리는 대신 fallback 쪽을 맞춘다. LCP −523ms 를 포기할 이유가 없다.

**AS-IS**

fallback 이 제목을 한 줄로만 잡았다. 실제 제목은 두 줄로 감긴다.

**TO-BE**

두 번 시도했다. **1차는 절반만 고쳤다.**

| 단계 | 변경                                      | CLS        | LCP 범위 |
| ---- | ----------------------------------------- | ---------- | -------- |
| A2   | —                                         | 0.0066     | 77 ms    |
| A3   | fallback 을 실제와 같은 태그·줄 수로 맞춤 | **0.0031** | 34 ms    |
| A4   | `.copy` 에 `min-height` 를 확정           | **0**      | **8 ms** |

A3 로도 육안에 이동이 보였다. 막대 높이 `1em` 과 실제 글자 줄 높이(`line-height 1.08` + 폰트 메트릭)가
정확히 같지 않아 몇 px 씩 남았고, 문구 길이가 바뀌면 다시 어긋나는 방식이었다.

A4 는 문구 길이에 의존하지 않는다. 실제 문구가 차지할 수 있는 최대치를 `.copy` 자체에 잡아 두면
두 상태가 같은 박스를 쓴다.

```css
.copy {
  min-height: calc(clamp(18px, 3vw, 32px) * 2 + 16px + 6px + clamp(28px, 4vw, 52px) * 2.16 + 10px + 26px * 2);
}
```

`clamp()` 를 그대로 써서 브레이크포인트가 바뀌어도 같은 비율로 따라간다.
실제 문구가 이보다 짧아 로딩 완료 상태에 여백이 생기지만, 이동이 없는 쪽을 택했다.

**확인**

부수 효과로 **측정 자체가 안정됐다.** 리플로우가 사라지자 LCP 범위가 34ms → 8ms 로 좁아졌다.

### 가설 A 종료 — Before 대비

| 지표       | Before | After A | 변화               |
| ---------- | ------ | ------- | ------------------ |
| FCP 중앙값 | 618 ms | 83 ms   | **−535 ms**        |
| LCP 중앙값 | 701 ms | 163 ms  | **−538 ms (−77%)** |
| CLS        | 0      | 0       | 유지               |
| LCP 범위   | 27 ms  | 8 ms    | 계측 안정          |

변화폭 538ms 는 Before 범위 27ms 의 **20배**다. 측정 흔들림으로 설명되지 않는다.

LCP 구간이 다음 표적을 가리킨다.

| 구간                   | Before | After A | 비중    |
| ---------------------- | ------ | ------- | ------- |
| Element render delay   | 107    | **104** | **64%** |
| Resource load delay    | 16     | 29      | 18%     |
| Resource load duration | 89     | 28      | 17%     |
| Time to first byte     | 513    | 4       | 2%      |

`Element render delay` 가 최대 조각이 됐다. 3840×2160(8메가픽셀) JPEG 의 디코딩 비용으로 보인다.
전송량을 줄이면 전송 구간(28ms)과 디코딩(104ms)이 함께 줄어들 것이다 — 가설 B 에서 다룬다.

---

### 변경 3 — Hero 이미지를 뷰포트별 후보로 나눠 내린다 (가설 B)

**왜**

- 관찰: 가설 A 종료 시점의 LCP 163ms 중 `Element render delay` 가 104ms(64%)로 최대 조각이었다.
  Hero 는 3840×2160(8.3 메가픽셀) baseline JPEG 이고, 표시에 필요한 픽셀은 모바일 581×726, 데스크탑 1136×639 다.
- 가설: 전송량이 표시에 필요한 양보다 두 자릿수 크다. 줄이면 전송 구간과 디코딩이 함께 줄어든다.
- 선택: 두 방식을 **모두 구현해 같은 조건에서 재고** 골랐다.
  - **B1** — `next/image` 로 원본 하나를 srcset·포맷 자동 처리
  - **B2** — 비율별로 미리 자른 후보를 `<picture>` 로 서빙

**AS-IS**

```tsx
<img src="/images/week-07/hero-original.jpg" width={3840} height={2160} />
```

7,545,239 B 원본 하나. 모바일은 CSS 가 4:5 로 잘라 쓰고 데스크탑은 16:9 그대로 쓴다.

**TO-BE**

`<picture>` 로 비율별 후보를 제공한다. 원본에서 두 벌을 미리 만든다.

| 후보                  | 크기      | AVIF     | WebP     | JPEG     |
| --------------------- | --------- | -------- | -------- | -------- |
| `hero-portrait-600`   | 600×750   | 27.7 kB  | 41.9 kB  | 54.8 kB  |
| `hero-portrait-900`   | 900×1125  | 53.1 kB  | 75.6 kB  | 109.3 kB |
| `hero-landscape-1280` | 1280×720  | 66.1 kB  | 104.9 kB | 123.8 kB |
| `hero-landscape-1920` | 1920×1080 | 122.0 kB | 179.6 kB | 245.6 kB |

생성은 `scripts/generate-hero-images.mjs` 가 맡는다.

**왜 sharp 인가 — next/image 로는 이 파일들을 만들 수 없다**

둘은 같은 층위의 선택지가 아니다.

|                | `next/image`                  | sharp                 |
| -------------- | ----------------------------- | --------------------- |
| 동작 시점      | **요청 시점**(런타임)         | **빌드 전**(1회 생성) |
| 자를 수 있는가 | ✗ 원본 비율 그대로 리사이즈만 | ✓ 임의 영역 crop      |
| 결과물         | `/_next/image?…` 응답         | 우리가 소유하는 파일  |

art direction 은 **비율이 다른 크롭 파일**이 있어야 성립한다. next/image 는 원본을 잘라 주지 않으므로
그 파일을 애초에 만들어 낼 수 없다. 그래서 "next/image 대신 sharp" 가 아니라,
**"crop 파일을 만드는 도구가 따로 필요했고 그게 sharp"** 다.

로컬에서 쓸 수 있는 도구를 먼저 확인했다.

| 도구                                | 상태                    | 판정                                          |
| ----------------------------------- | ----------------------- | --------------------------------------------- |
| `cwebp` `avifenc` `magick` `ffmpeg` | 미설치                  | —                                             |
| `sips` (macOS 내장)                 | 사용 가능               | AVIF·JPEG 는 쓰기 가능하나 **WebP 쓰기 불가** |
| **sharp**                           | pnpm store 에 이미 존재 | AVIF·WebP·JPEG 모두 출력 가능                 |

sharp 는 Next 의 전이 의존으로 이미 store 에 받아져 있었다(`sharp@0.34.5`).
`next/image` 가 런타임 최적화에 쓰는 것과 **같은 라이브러리**라, 미리 만든 후보와
next/image 가 만들었을 결과의 인코딩 특성이 어긋나지 않는다.

`devDependencies` 로만 추가했다. 생성 스크립트만 쓰고 앱 런타임은 쓰지 않는다.

**확인 — 두 방식의 실측 비교**

| 지표               | Before   | 가설 A 후 | **B1** (next/image)        | **B2** (picture)         |
| ------------------ | -------- | --------- | -------------------------- | ------------------------ |
| FCP 중앙값         | 618 ms   | 83 ms     | 84 ms                      | **82 ms**                |
| LCP 중앙값         | 701 ms   | 163 ms    | **84 ms**                  | **82 ms**                |
| CLS                | 0        | 0         | 0                          | 0                        |
| Hero 전송 (모바일) | 7,546 kB | 7,546 kB  | 162 kB                     | **28 kB**                |
| 요청된 후보        | 원본     | 원본      | `/_next/image?w=1920` webp | `hero-portrait-600.avif` |

**공식 조건에서는 두 방식을 구분할 수 없었다.** LCP 84 vs 82ms 는 이 계측기의 범위 안이고,
Lighthouse `image-delivery` 진단도 어느 쪽 Hero 도 지적하지 않는다.
localhost 무스로틀에서는 대역폭이 사실상 무한이라 5.7배 바이트 차이가 시간으로 나타나지 않는다.
LCP 가 발견(35ms)과 렌더(39ms) 바닥값에 걸려 있다.

그래서 회선을 씌워 다시 쟀다. 대역폭 184 kB/s(Slow 4G 하향)로 전송 시간만 측정한 값이다.

| 후보                              | 전송 크기   | 전송 시간   |
| --------------------------------- | ----------- | ----------- |
| Before `hero-original.jpg`        | 7,545,239 B | **40.04 s** |
| B1 `/_next/image?w=1920` webp     | 161,628 B   | 0.55 s      |
| B2 데스크탑 `landscape-1280.avif` | 67,653 B    | 0.26 s      |
| B2 모바일 `portrait-600.avif`     | 28,263 B    | **0.15 s**  |

Before 의 40.04s 가 Lighthouse Slow 4G 시뮬레이션 40.9s 와 일치한다. 두 계측이 서로를 검증한다.

**B2 를 고른 이유** — 공식 지표가 동률이므로 근거는 측정 밖에 있다.

- B1 은 4:5 로 보여주려고 1920px 폭을 받아 **가로 절반 이상을 버린다.**
  과제가 "불필요하게 큰 이미지가 내려가지 않게" 를 명시한다.
- 실사용자 회선에서 0.4s 차이가 난다.

**B1 을 고르지 않은 대가도 기록한다.**

- sharp devDependency, 생성 스크립트, 바이너리 12개가 늘어난다.
- **크롭 정확성을 사람이 책임진다.** 실제로 `object-position: 56%` 를
  "56% 지점을 크롭 중심에 둔다"로 잘못 읽어 원본 좌표가 103px 어긋났다.
  올바른 규칙은 "넘치는 폭을 56 : 44 로 나눠 왼쪽에 배분한다" 이다.

  |                                  | 원본에서 보이는 구간 |
  | -------------------------------- | -------------------- |
  | CSS(=B1) 가 실제로 보여주는 구간 | [1183, 2911]         |
  | 잘못 계산한 크롭                 | [1286, 3014]         |
  | 수정한 크롭                      | **[1183, 2911]**     |

  **이 오류는 어떤 수치에도 잡히지 않았다.** LCP·CLS·전송량 모두 정상이었고 육안으로만 보였다.
  수정 후 B1 이 표시하는 영역과 픽셀 단위로 대조해 평균 차이 2.47/255(약 1%)를 확인했다 — 재압축 오차 수준이다.
  브라우저가 CSS 규칙대로 자르는 B1 에는 없는 위험이다.

- 원본이 바뀌면 후보를 다시 만들어야 한다.

**art direction 이 실제로 동작하는지 확인** — 같은 HTML 에서 뷰포트별로 다른 파일을 받는다.

| 뷰포트               | 요청된 파일                | 전송 크기 |
| -------------------- | -------------------------- | --------- |
| 모바일 412×823 @1.75 | `hero-portrait-600.avif`   | 28,545 B  |
| 데스크탑 1350×940 @1 | `hero-landscape-1280.avif` | 67,936 B  |

> 브라우저 창을 리사이즈하는 것으로는 확인되지 않는다. 이미 받은 이미지를 재활용하기 때문이다.
> 각 뷰포트에서 하드 리로드해야 한다. 확장자는 양쪽 모두 avif 를 1순위로 두었으므로
> 바뀌는 것은 확장자가 아니라 `portrait` ↔ `landscape` 파일명이다.

**측정 조건의 DPR 과 실제 기기의 DPR 은 다르다 — 28 kB 는 낙관적인 값이다**

Lighthouse mobile preset 의 DPR 은 1.75(Moto G Power 에뮬레이션)다.
실제 기기는 아이폰이 대체로 3, 안드로이드 상당수가 2라서 **더 큰 후보를 받는다.**

필요한 이미지 폭은 `CSS 박스 폭 × DPR` 이고, 이 Hero 의 모바일 박스는 316 CSS px 다.

| 기기            | DPR  | 필요 픽셀 | 받는 후보           | 전송 크기   | Before 대비 |
| --------------- | ---- | --------- | ------------------- | ----------- | ----------- |
| 측정 조건       | 1.75 | 553       | `portrait-600.avif` | 27.7 kB     | −99.63%     |
| 안드로이드 다수 | 2    | 632       | `portrait-900.avif` | 53.1 kB     | −99.30%     |
| 아이폰 다수     | 3    | 948       | `portrait-900.avif` | **53.1 kB** | **−99.30%** |

**실사용자 대부분은 53.1 kB 를 받는다.** 이 문서의 28 kB 는 측정 조건에서의 값이며,
방식 간 비교(B1 vs B2)에는 같은 조건이라 유효하지만 실사용자 전송량으로 인용하면 과장이다.

`portrait-900` 을 남겨 둔 이유가 이것이다. DPR 2~3 기기가 다수이므로 600 만 두면 확대되어 뭉개진다.

**후보 12개는 전부 도달 가능하다 — 다만 한 번에 하나만 전송된다**

| 축   | 후보                                | 언제 쓰이나                               |
| ---- | ----------------------------------- | ----------------------------------------- |
| 포맷 | AVIF                                | Chrome 85+, Firefox 93+, Safari 16.4+     |
|      | WebP                                | Safari 14 ~ 16.3                          |
|      | JPEG                                | 그 이전 + `<img src>` 최종 fallback(필수) |
| 너비 | `portrait-600` / `portrait-900`     | 모바일 DPR ≤1.75 / ≥2                     |
|      | `landscape-1280` / `landscape-1920` | 데스크탑 DPR 1 / 2                        |

저장소 비용은 12개 합계 1,204 kB 로, 원본 하나(7,545 kB)보다 오히려 작다.
WebP 4개(402 kB)를 빼면 파일 수는 8개로 줄지만 Safari 14~16.3 이 JPEG 를 받게 되므로 유지한다.

**데스크탑 부수 지표 — 화질·성능 회귀 없음**

| 지표       | Before   | B2 데스크탑 |
| ---------- | -------- | ----------- |
| LCP 중앙값 | 693 ms   | **85 ms**   |
| CLS        | 0        | 0           |
| Hero 전송  | 7,546 kB | **68 kB**   |

모바일만 챙기고 데스크탑을 희생하지 않았다.
데스크탑의 LCP 요소는 이제 Hero 가 아니라 상품 카드 이미지(224×224)로 바뀌었고,
Lighthouse 의 이미지 전달 지적도 Hero 가 아닌 상품 카드로 옮겨갔다.

**next/image 를 함께 쓸 수 없는 이유** — 우회 가능한 제약이 아니다.

| 시도                                      | 가능 | 이유                                             |
| ----------------------------------------- | ---- | ------------------------------------------------ |
| `<Image>` 하나 + `sizes`                  | ✗    | 소스가 하나라 비율을 바꿀 수 없다                |
| `<Image>` 둘 + CSS `display` 토글         | ✗    | preload scanner 가 둘 다 받는다                  |
| 커스텀 `loader`                           | ✗    | loader 는 `(src, width)` 만 받고 뷰포트를 모른다 |
| `<picture>` + `/_next/image` URL 하드코딩 | △    | 동작하지만 내부 API 라 업그레이드에 깨질 수 있다 |

next/image 는 소스가 하나라는 전제 위에 서 있다. 뷰포트마다 다른 소스를 줘야 하는 art direction 과 맞지 않는다.

**그래서 이 코드베이스는 둘을 나눠 쓴다.**

| 대상      | 방식                    | 이유                              |
| --------- | ----------------------- | --------------------------------- |
| 상품 카드 | `next/image` 유지       | 정사각 고정. 비율이 바뀌지 않는다 |
| Hero      | 미리 생성 + `<picture>` | 뷰포트마다 비율이 다르다          |

### 변경 4 — 목록의 네 화면을 요구에 맞춘다 (2단계)

**왜**

1-7-2 의 차이 네 건을 메운다. 성능 지표가 아니라 과제 2단계 표의 요구 충족 여부가 기준이다.
개입하지 않기로 한 취소·최초 실패 지연은 그대로 둔다.

**AS-IS / TO-BE**

| 상태       | AS-IS                             | TO-BE                                                    |
| ---------- | --------------------------------- | -------------------------------------------------------- |
| 최초 진입  | `상품을 불러오는 중입니다…` 한 줄 | 문구 + 카드 12개 골격(정사각 이미지·3줄·버튼 자리)       |
| 갱신 중    | `aria-busy` 만 (시각 변화 없음)   | 상태 문구 + 목록 `opacity 0.45`                          |
| 성공 + 0건 | `조건에 맞는 상품이 없습니다.`    | `검색어 "…", 카테고리 "…" 조건에 맞는 상품이 0개입니다.` |
| 갱신 실패  | 목록을 버리고 에러 문구만         | 목록 유지 + 실패 배너 + 다시 시도                        |

스켈레톤 개수는 `DEFAULT_PAGE_SIZE`(12)를 그대로 쓴다. 실제로 올 목록 크기와 같아야
"목록 크기를 예상할 수 있는" 요구를 만족한다.

**확인 — 갱신 실패는 분기 순서만으로 고쳐지지 않았다**

이전 구현은 `data` 유무와 무관하게 error 분기로 먼저 빠져나가 목록을 버렸다.
그래서 순서만 바꾸면 될 것으로 보고 시작했으나, 그 전에 React Query 가 error 시
`data` 를 유지하는지 옵저버로 직접 확인했다.

```
① 최초 성공 후 : {"products":["all-1","all-2"],"totalCount":2}
② 조건 변경 후 실패 : status=error · isPlaceholderData=false · data=undefined
```

`keepPreviousData` 는 pending 동안에만 적용된다. **최종 실패하면 data 가 사라진다.**
분기 순서 변경만으로는 요구를 만족할 수 없음이 확인됐다.

**응답을 복사하지 않고 이전 목록을 남기는 방법**

과제가 서버 응답의 로컬 상태 복사를 금지하므로, 응답 대신 **마지막으로 성공한 조회 조건**만 기억하고
데이터는 React Query 캐시에서 읽는다.

```tsx
const signature = JSON.stringify(query);
const [lastSucceeded, setLastSucceeded] = useState({ signature, query });

if (current.data && lastSucceeded.signature !== signature) {
  setLastSucceeded({ signature, query });
}

// enabled: false — 새로 요청하지 않고 캐시만 읽는다
const fallback = useQuery({ ...productListQueryOptions.list(lastSucceeded.query), enabled: false });
const data = current.data ?? fallback.data;
```

상태에 담기는 것은 URL 에서 파생된 조회 조건이고, 응답의 소유자는 계속 React Query 다.

> 처음에는 `useRef` 로 응답을 붙드는 방식을 썼다가 lint 의 `react-hooks/refs`
> ("렌더 중 ref 접근 금지")에 걸렸다. 규칙이 옳았고, 우회하는 대신 설계를 바꿨다.

---

### 변경 5 — 상품 카드에 필요한 폭을 알려준다

**왜** — 5-5 에서 `p21.jpg` 가 낭비로 지적됐는데, 3장에서 "개입 수단이 품질 저하뿐"이라고
잘못 판단했다. 실제 원인은 포맷도 원본 크기도 아니고 **`sizes` 누락**이었다.

#### 문제 정의

| 단계     | 내용                                                                     |
| -------- | ------------------------------------------------------------------------ |
| **관찰** | 412px 뷰포트에서 카드가 `w=828` 을 받는다. 데스크탑은 `w=640`            |
| **요구** | 카드는 2열 그리드에서 약 **184 CSS px**. DPR 1.75 면 **322px** 이면 된다 |
| **차이** | 필요보다 2.6배 큰 이미지를 받는다                                        |
| **변경** | `sizes` 로 실제 레이아웃 폭을 알려준다                                   |

#### 왜 `w=828` 이 선택되었나 — 근본 원인

`sizes` 가 없으면 next/image 는 레이아웃을 알 수 없어 `width` prop 의 **1x·2x** 로만 후보를 만든다.

```
width={400}  →  [400, 800]  →  가장 가까운 허용 폭 [640, 828]
             →  srcset="…w=640 1x, …w=828 2x"
```

DPR 1.75 인 모바일은 `2x`(828), DPR 1 인 데스크탑은 `1x`(640) 을 고른다.
**측정에서 관찰한 두 값이 정확히 이것이다.** 원인이 확정된다.

#### AS-IS / TO-BE

```tsx
// AS-IS — 레이아웃 정보 없음
<Image className="week05-image" src={product.image} alt={product.name}
       width={400} height={400} loading="eager" />

// TO-BE
const CARD_SIZES = ['(max-width: 720px) 50vw', '(max-width: 960px) 34vw', '20vw'].join(', ');
<Image … sizes={CARD_SIZES} … />
```

값은 `week-05-layout.css` 의 그리드와 맞춘다 — 열 수가 960px·720px 에서 5 → 3 → 2 로 바뀐다.

#### 계측 함정 — `calc()` 로 감싸면 후보가 잘린다

처음에는 여백·gap 까지 반영해 정확하게 썼다.

```
(max-width: 720px) calc(50vw - 22px), (max-width: 960px) calc(33.3vw - 24px), …
```

**더 정확한데 결과는 더 나빴다.** 후보 목록이 640 부터 시작해 384 가 아예 없었다.

next/image 는 `sizes` 문자열에서 vw 값을 정규식으로 뽑아 후보 하한을 정하는데,
그 정규식이 **공백이나 문자열 시작 뒤의 숫자만** 인식한다.
`calc(50vw` 의 `50` 은 `(` 뒤라 잡히지 않고, `min(1200px, 100vw` 의 `100` 만 잡힌다.
하한이 `가장 작은 deviceSize × 1.0 = 640` 이 되어 그 아래 후보가 전부 잘린다.

| `sizes` 표기          | 인식된 vw | 후보 하한 | srcset 최솟값 |
| --------------------- | --------- | --------- | ------------- |
| `calc(50vw - 22px)` … | 100 만    | 640       | **640**       |
| `50vw, 34vw, 20vw`    | 20        | 128       | **128**       |

두 srcset 을 실제 HTML 에서 확인해 확정했다.
**정밀하게 쓰려다 기능을 껐다.** 순수 `vw` 로 쓰고 약간 넉넉하게 잡는 쪽이 맞다
(넉넉한 쪽은 과다 전송일 뿐이고, 모자란 쪽은 흐릿해진다).

#### 결과 — 공식 조건 (Mobile, no throttling, 5회)

| 항목                  | 변경 4 까지 | **변경 5 후** | 변화                      |
| --------------------- | ----------- | ------------- | ------------------------- |
| 요청된 카드 폭        | `w=828`     | **`w=384`**   | 필요치(322px)에 근접      |
| `p21.jpg` 전송        | 72,321 B    | **47,501 B**  | −34.3%                    |
| 카드 12장 합          | 169,988 B   | **129,510 B** | −23.8%                    |
| **페이지 총 전송**    | 485,102 B   | **445,484 B** | **−39,618 B (−8.2%)**     |
| Lighthouse 낭비 판정  | 54,621 B    | 29,801 B      | −45.4%                    |
| LCP 중앙값            | 79 ms       | 88 ms         | **변화 아님** (범위 54ms) |
| CLS                   | 0           | **0**         | 유지                      |
| LCP element 표시 크기 | 332×415     | **332×415**   | 동일                      |

부수 지표 — Desktop:

| 항목       | 변경 4 까지 | 변경 5 후     |
| ---------- | ----------- | ------------- |
| LCP 중앙값 | 86 ms       | **85 ms**     |
| 총 전송    | 517,939 B   | **478,146 B** |

**LCP 는 움직이지 않는다. 그게 맞다.** LCP 요소는 Hero 이고, Hero 는 `<picture>` 로
우리 파일을 직접 받으므로 이 변경과 무관하다. 실제로 Hero 요청 시작은 45 → 47ms 로 같다.
모바일 중앙값이 79 → 88ms 로 보이는 것은 **노이즈**다. 같은 변경에서 데스크탑은
86 → 85ms 로 그대로였고, 모바일 쪽 범위가 7ms 에서 54ms 로 벌어져 있었다.

이 변경이 겨냥한 것은 LCP 가 아니라 **스크롤 아래 전송량**이다. 그 축에서 −39.6 kB 다.

#### 되돌린 것 — `next.config` 의 AVIF

같은 질문에서 나온 다른 후보다. `images.formats` 기본값은 `['image/webp']` 라
카드가 webp 로 내려오고 있었다. AVIF 를 앞에 두고 5회 재측정했다.

| 대상        | webp      | avif      | 차이         |
| ----------- | --------- | --------- | ------------ |
| `p21.jpg`   | 72,321 B  | 80,700 B  | **+8,379 B** |
| 나머지 11장 | 97,667 B  | 89,898 B  | −7,769 B     |
| **합계**    | 169,988 B | 170,598 B | **+610 B**   |

**AVIF 가 항상 작지 않다.** 같은 `q=75` 라도 webp 와 AVIF 의 품질 척도가 달라
사진 특성에 따라 뒤집힌다. `p21` 한 장이 나머지 11장의 절감을 전부 먹었다.

전체 전송이 늘었으므로 **되돌렸다**. `next.config.ts` 는 비어 있는 상태 그대로다.
"AVIF 가 webp 보다 작다"는 통념을 측정 없이 적용했다면 악화된 채로 끝났을 변경이다.

> **config 와 `sizes` 는 다른 것을 정한다.** config 의 `deviceSizes`·`imageSizes` 는
> 만들 수 있는 폭의 **메뉴**이고, `sizes` 는 그 중 **무엇을 고를지**다.
> "이 카드는 모바일에서 화면의 절반"은 레이아웃 정보라 config 가 알 수 없다.
> config 로 `deviceSizes` 를 줄일 수는 있으나 모든 이미지에 일괄 적용되는 무딘 수단이다.

#### 남는 것

데스크탑에서 카드는 224 CSS px 인데 `20vw`(1350px 기준 270px) 때문에 384 를 받는다.
더 조일 수 있으나 하지 않는다 — 뷰포트 구간마다 페이지 폭이 `min(1200px, 100vw - 32px)` 로
꺾여 vw 로 정확히 표현되지 않고, 조이다 모자라면 흐릿해진다.
공식 지표는 모바일이고 거기서는 384 가 필요치 322px 바로 위 후보다.

---

## 3. 개입하지 않기로 한 것

> 이미 조건을 만족해 코드를 더 만들지 않은 항목. 근거를 남긴다.

| 항목                                       | 이미 만족하는 이유                                                                                                                                                                                                                              | 확인 방법                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Hero 이미지 preload / `fetchpriority=high` | `resource load delay` 가 **두 조건 모두에서 10~16ms** 다. 이미지는 초기 문서에서 이미 발견되어(`requestDiscoverable: true`) 일찍 요청된다. No throttling 에서는 LCP 의 2%, Slow 4G 에서는 0.04% 다. 어느 조건으로 보아도 선택한 병목과 무관하다 | Lighthouse `lcp-discovery-insight` + `lcp-breakdown-insight` |
| Hero 자리 예약 (CLS)                       | `width`/`height` + `aspect-ratio` 로 5회 모두 CLS 0.000                                                                                                                                                                                         | Lighthouse 5회 · Layout Shifts 트랙                          |
| 상품 카드 이미지 최적화                    | 이미 `next/image` 로 webp·`w=828` 리사이즈되어 내려온다                                                                                                                                                                                         | Network 의 `/_next/image?…` 최종 URL                         |
| 목록 갱신 중 이전 데이터 유지              | `keepPreviousData` + `aria-busy={isPlaceholderData}` 로 이미 동작한다                                                                                                                                                                           | `ProductListResult.tsx` · 갱신 녹화                          |

### ~~상품 카드에는 개입하지 않는다~~ — 판단을 뒤집었다

Hero 를 걷어내자 Lighthouse 가 상품 카드 `p21.jpg` 를 지적하기 시작했다 (5-5).
**처음에는 개입하지 않기로 하고 이렇게 적었다.**

> **개입 수단이 품질 저하뿐이다.** `next/image` 는 이미 붙어 있어 남은 수단은 `quality` 를 낮추는 것인데,
> 과제가 금지한 "품질을 낮춰 수치만 줄이는 것"에 정확히 해당한다.

**이 문장이 틀렸다.** "`next/image` 가 붙어 있으니 남은 수단이 없다"고 단정한 것이 오류다.
`next/image` 는 **어떤 폭이 필요한지 컴포넌트가 알려줘야** 제 일을 한다. 그 지시(`sizes`)가 빠져 있었다.
품질을 건드리지 않고 전송량을 줄일 수단이 남아 있었던 것이다.

정정한 내용과 실제 개입은 **변경 5** 에 있다. 이 절은 잘못된 판단의 기록으로 남긴다.

> **판단이 뒤집힌 경위**: "이미지 최적화는 next.config 에서도 할 수 있지 않냐"는 질문에서 시작했다.
> config 로 무엇을 할 수 있는지 확인하다가 `sizes` 누락이 드러났다.
> 계측기가 찾아낸 것이 아니다 — 리포트는 Before/After 내내 같은 항목을 같은 문구로 지적하고 있었고,
> "이미 최적화되어 있다"는 선입견이 그것을 읽지 못하게 막고 있었다.

### After 리포트에 남은 나머지 지적 — 전부 프레임워크 산출물

Hero 를 걷어내자 가려져 있던 항목이 함께 드러났다. **어디를 가리키는지 확인한 뒤 개입하지 않기로 했다.**

| 지적                     | 절감 추정          | 실제 대상                                             |
| ------------------------ | ------------------ | ----------------------------------------------------- |
| Render-blocking requests | FCP 300 ms         | `/_next/static/chunks/*.css` 3개 (6.4 / 1.0 / 0.9 kB) |
| Legacy JavaScript        | 13 KiB · LCP 150ms | `/_next/static/chunks/2uw6_lcn_5z8c.js` 의 폴리필     |
| Unused JavaScript        | 28 KiB · LCP 350ms | 같은 청크. 40% 미사용                                 |
| Back/forward cache       | —                  | `cache-control: no-store`                             |

근거는 대상이 어디냐로 갈린다.

- **앞의 셋은 `src/` 에 없다.** 전부 Next 빌드가 만든 청크다.
  Legacy JS 가 지목한 신호는 `Array.prototype.at` · `flat` · `flatMap` · `Object.fromEntries` 로,
  우리가 부른 적 없는 Next 런타임의 폴리필이다. CSS 3개도 Next 가 쪼갠 결과다.
  손대려면 번들러 설정이나 프레임워크 버전을 건드려야 하는데, **이번 과제의 개입 범위를 벗어난다.**
- **bf-cache 는 Lighthouse 자신이 `Not actionable` 로 표시한다.**
  `export const dynamic = 'force-dynamic'` 때문에 붙는 헤더이고,
  홈 데이터가 매 요청 달라지는 이 과제 API 의 성격상 제거할 수 없다.

**그리고 공식 조건에서는 이 넷 중 어느 것도 점수를 깎지 않는다** — no throttling 에서 100점이다.
Slow 4G 에서만 절감 추정이 붙는데, 그 조건은 부수 지표다.
1순위·2순위 병목을 해소하고 나면 남는 것이 프레임워크 고정 비용이라는 뜻이고, 여기서 멈춘다.

---

## 4. metadata / Open Graph 증거

### 3종 document 증거

모두 production build 의 document 응답에서 뽑았다. `APP_ORIGIN` 은 build 와 runtime 에 같은 값을 넣었다.

| 상황                       | 재현                                           | `<title>`                              | `og:image`                             |
| -------------------------- | ---------------------------------------------- | -------------------------------------- | -------------------------------------- |
| **normal** (홈)            | `APP_ORIGIN=http://localhost:3000`             | `매일 새롭게 발견하는 취향 · Commerce` | `/images/products/p6.jpg`              |
| **normal** (목록)          | `/products`                                    | `상품 목록 · Commerce`                 | `/images/products/p26.jpg`             |
| **정상 empty**             | `/products?q=가방` (0건)                       | `"가방" 검색 결과 · Commerce`          | **fallback** `hero-landscape-1280.jpg` |
| **metadata query failure** | `APP_ORIGIN=http://127.0.0.1:9` 로 build·start | **`Commerce`** (root default)          | fallback                               |

**세 상황이 서로 다른 fallback 을 보인다.**

- 정상 empty 는 **조건을 설명하는 title 을 만들되** Open Graph 이미지만 fallback 으로 둔다.
  결과가 0개라 첫 상품 이미지가 없기 때문이다.
- query failure 는 **페이지별 title 자체를 만들지 않는다.** `generateMetadata` 가 빈 객체를 돌려
  root 의 `title.default` 가 그대로 쓰인다. 빈 문자열을 돌려줬다면 `<title></title>` 이 됐을 것이다.

검색어·카테고리·페이지를 준 요청(`/products?q=가방&category=fashion&page=2`)도 query failure 에서는
title 이 `Commerce` 다. 조회에 실패했으므로 **URL 조건만 보고 title 을 조립하지 않는다.**
데이터 없이 만든 제목은 근거가 없다.

#### query failure 에서도 페이지는 살아 있다

| 경로        | status | TTFB |
| ----------- | ------ | ---- |
| `/`         | 200    | 7 ms |
| `/products` | 200    | 8 ms |

초기 HTML 에 `<h1>추천 상품 둘러보기</h1>` 와 `href="/products"` 가 그대로 남는다.
변경 1 에서 페이지 제목·설명을 데이터 대기 밖으로 뺐기 때문에, 데이터 조회가 전부 실패해도
페이지 구조와 탐색 수단은 유지된다. 목록 영역만 실패 UI 로 바뀐다.

> query failure 재현에서는 `og:image` 가 `http://127.0.0.1:9/...` 로 나온다.
> `metadataBase` 가 `APP_ORIGIN` 을 쓰기 때문이며 재현 절차상 정상이다.
> 실제 배포에서는 `APP_ORIGIN` 이 진짜 도메인이어야 공유 이미지가 유효하다.
> 이 문서의 localhost Open Graph URL 은 배포 증거가 아니다.

### 초기 HTML — JavaScript 실행 전에 무엇이 있는가

production build 의 document 응답을 그대로 받아 확인했다(`curl`). 브라우저에서는 View Source 로 같은 것을 본다.

**홈** — 랜드마크, 제목, 주요 링크, 대체 텍스트가 모두 들어 있다.

```html
<header class="week05-header">
  <a href="/">…</a>
  <nav aria-label="주요 메뉴"><a href="/products">…</a></nav>
</header>
<main>
  <h1>추천 상품 둘러보기</h1>
  <section aria-label="이번 주의 추천 배너">
    <img alt="햇빛이 드는 베이지 톤 공간에 놓인 가죽 토트백, 흰 스니커즈, 니트와 도자기 화병" … />
    <h2>매일 새롭게 발견하는 취향</h2>
  </section>
  <h2>카테고리</h2>
  <a href="/products?category=casual">…</a> … 5개
  <h2>인기 상품</h2>
  <img alt="메이커스 투명케이스" … />
</main>
```

**상품 목록** — `<main>` · `<h1>상품 목록</h1>` · `aria-label="상품 검색 결과"` 가 있다.

| 요구                             | 확인                                                                 |
| -------------------------------- | -------------------------------------------------------------------- |
| 하나의 명확한 `h1`               | 홈 `추천 상품 둘러보기` · 목록 `상품 목록` — 각 페이지에 정확히 하나 |
| 페이지 설명                      | `h1` 바로 아래 문단                                                  |
| 주요 콘텐츠·탐색 역할이 마크업에 | `<header>` · `<nav aria-label>` · `<main>`                           |
| 주요 이동은 `href` 링크          | 헤더 2개, 카테고리 5개 모두 `<a href>`                               |
| 의미 있는 이미지의 대체 텍스트   | Hero·상품 카드 모두 있음                                             |

#### Hero `alt` 를 빈 문자열로 두지 않은 이유

starter 는 `alt=""` 로 시작한다. 장식용 이미지라면 맞는 선택이지만 이 이미지는 상품을 보여준다.
위에 겹치는 문구("매일 새롭게 발견하는 취향")는 **슬로건이지 이미지 설명이 아니다.**
`alt=""` 로 두면 화면을 보지 못하는 사용자는 배너에 무엇이 놓여 있는지 알 수 없다.

`<section aria-label="이번 주의 추천 배너">` 로 영역 이름을 따로 주었으므로,
`alt` 는 영역 이름을 반복하지 않고 사진의 내용만 서술한다.

### 페이지별 metadata 규칙이 적용되는지

| URL                                              | `<title>`                              | `description`                           |
| ------------------------------------------------ | -------------------------------------- | --------------------------------------- |
| `/`                                              | `매일 새롭게 발견하는 취향 · Commerce` | `지금 가장 사랑받는 상품을 만나보세요.` |
| `/products`                                      | `상품 목록 · Commerce`                 | `정렬 최신순 · 총 30개.`                |
| `/products?q=가방`                               | `"가방" 검색 결과 · Commerce`          | `정렬 최신순 · 조건에 맞는 상품 0개.`   |
| `/products?category=fashion&sort=popular&page=2` | `패션 · 2페이지 · Commerce`            | `카테고리 패션 · 정렬 인기순 · 총 6개.` |

- 검색어가 있으면 title 에 먼저 들어간다
- category·sort 는 description 으로 간다
- 2페이지 이상이면 title 에 페이지 번호가 붙는다
- `· Commerce` 는 root 의 `title.template` 이 붙인 것이다

**shallow merge 대응 확인** — 위 네 경우 모두 `og:site_name`·`og:locale`·`og:type` 이 살아 있다.
페이지의 `openGraph` 는 루트 `openGraph` 를 통째로 덮으므로, 각 페이지가 `COMMON_OPEN_GRAPH` 를
펼쳐 넣지 않았다면 이 세 필드는 사라졌을 것이다.

**서버 측 호출 계수** (`src/app/api/**` 수정 금지 제약하의 대안)

계측 방법과 이 자리에서 재야 하는 이유는 0장 "수치를 얻은 방법 ④" 에 있다.

| 페이지 요청                                | Route Handler 호출 URL                                                        | 횟수  |
| ------------------------------------------ | ----------------------------------------------------------------------------- | ----- |
| `/`                                        | `/api/home`                                                                   | **1** |
| `/products?category=fashion&scenario=slow` | `/api/products?category=fashion&sort=latest&page=1&pageSize=12&scenario=slow` | **1** |
| `/products?q=가방`                         | `/api/products?q=가방&category=all&sort=latest&page=1&pageSize=12`            | **1** |

세 번째 줄이 **URL 정규화가 실제로 적용된 증거**이기도 하다. 검색어만 준 요청인데
`category=all&sort=latest&page=1&pageSize=12` 가 붙어 나간다. metadata 와 본문이
같은 `toProductListQuery` 를 통과했다는 뜻이다.

**홈은 두 곳에서 같은 데이터를 조회하는데도 1회다.**

```tsx
generateMetadata()  → queryClient.fetchQuery(homeQueryOptions.list())    // banner 용
HomePage()          → queryClient.prefetchQuery(homeQueryOptions.list()) // 본문 용
```

`getQueryClient()` 는 호출할 때마다 새 QueryClient 를 만들므로 두 조회는 **React Query 캐시를 공유하지 않는다.**
그런데도 Route Handler 가 한 번만 불린 것은, 같은 render/request 안에서
URL·options 가 모두 같은 native `fetch` 를 Next 가 memoization 하기 때문이다.
중복 제거가 일어나는 층은 React Query 가 아니라 **fetch** 다.

→ metadata 와 본문이 데이터를 공유하게 하려고 QueryClient 를 singleton 으로 바꿀 이유가 없다.
같은 URL·options 로만 부르면 fetch 층이 이미 그 일을 한다.

**계측 제거**: `src/middleware.ts` 파일 하나를 지우면 끝난다. 앱 코드에는 흔적이 남지 않는다.

### 일반 UA vs `facebookexternalhit` — 이 단계의 핵심 발견

`generateMetadata` 는 서버에서 실행되고 `<head>` 는 문서 맨 앞이므로,
metadata 가 API 를 기다리면 그만큼 응답이 늦어진다 — 라고 예상하고 시작했다.
**측정이 그 예상을 반증했다.**

| 경로        | UA                    | `time_starttransfer` | `time_total` |
| ----------- | --------------------- | -------------------- | ------------ |
| `/`         | normal                | **0.008 s**          | 0.512 s      |
| `/`         | `facebookexternalhit` | **0.518 s**          | 0.520 s      |
| `/products` | normal                | **0.009 s**          | 0.511 s      |
| `/products` | `facebookexternalhit` | **0.510 s**          | 0.510 s      |

**첫 청크에 무엇이 들어 있는가**

| UA                    | 첫 0.1초 수신량 | 그 안에 `<title>` | 최종 HTML 의 `<title>` |
| --------------------- | --------------- | ----------------- | ---------------------- |
| normal                | 15,810 B        | **없음**          | 있음                   |
| `facebookexternalhit` | **0 B**         | —                 | 있음                   |

Next 16 이 User-Agent 를 보고 스트리밍 여부를 가른다.

- **일반 브라우저** — 본문 껍데기를 먼저 흘려보내고 `generateMetadata` 가 끝나면 `<head>` 에 나중에 꽂는다.
  브라우저는 스트리밍 중 `<head>` 삽입을 처리할 수 있다. **TTFB 8ms 유지.**
- **크롤러** — 스트리밍을 다루지 못하는 클라이언트로 보고 metadata 가 완성될 때까지 응답을 붙든다.
  미리보기 카드를 만드는 것이 목적이므로 기다릴 이유가 있다. **TTFB 518ms.**

**그래서 비용을 내는 쪽은 사용자가 아니라 크롤러다.**

| 단계                   | 일반 사용자 TTFB | 크롤러 TTFB |
| ---------------------- | ---------------- | ----------- |
| Before                 | 513 ms           | 513 ms      |
| 변경 1 (렌더링 경계)   | 4 ms             | 4 ms        |
| 변경 5 (동적 metadata) | **8 ms**         | **518 ms**  |

변경 1 에서 없앤 500ms 가 **크롤러에게만** 돌아왔다.
동적 metadata 의 이점(검색·공유에서 페이지가 구분됨)을 얻으면서 사용자 응답 시점은 지키는 거래다.
Next 가 UA 로 그 판단을 대신하고 있었고, 우리가 한 일은 그 위에 올라탄 것뿐이다.

---

## 5. After — 같은 조건 재측정

측정 대상 코드: **After SHA `2607c5d61630beb9521972494f385f863a7b199c` (`2607c5d`)**
0장에 고정한 조건을 그대로 재사용한다. 서버·명령·회차·프로필 처리 모두 Before 와 같다.

계측용 `src/middleware.ts` 는 **측정 전에 삭제**했다. 매 API 요청마다 로그를 찍어 측정을 오염시키기 때문이다.

> **이 장은 변경 1~4 까지의 결과다.** 이후 3장의 판단 하나를 뒤집어 **변경 5**(상품 카드 `sizes`)를 넣었다.
> 변경 5 는 LCP·CLS 를 움직이지 않고 전송량만 줄이므로 아래 표의 핵심 수치는 그대로 유효하고,
> 페이지 총 전송만 **485,102 → 445,484 B** 로 더 내려간다. 대조는 변경 5 절에 있다.

### 5-1. 공식 지표 — Mobile 412×823 @1.75 · No throttling

| 회차       | FCP (ms) | LCP (ms) | CLS   | score   |
| ---------- | -------- | -------- | ----- | ------- |
| 1          | 79       | 79       | 0     | 100     |
| 2          | 77       | 77       | 0     | 100     |
| 3          | 77       | 77       | 0     | 100     |
| 4          | 80       | 80       | 0     | 100     |
| 5          | 84       | 84       | 0     | 100     |
| **중앙값** | **79**   | **79**   | **0** | **100** |
| **최솟값** | 77       | 77       | 0     | 100     |
| **최댓값** | 84       | 84       | 0     | 100     |
| 범위       | 7 ms     | 7 ms     | —     | —       |

조건이 실제로 적용됐다는 증거는 리포트 JSON 에 남는다.

```
throttlingMethod: "provided"
screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }
```

**FCP 와 LCP 가 같은 값이다.** 첫 픽셀이 곧 Hero 이미지다.
Before 는 FCP 618 → LCP 701 로 83ms 벌어져 있었다. 그 간격이 사라졌다.

### 5-2. Before / After 대조 (공식 조건)

판정 기준은 0장에서 정한 대로 **Before 의 LCP 범위 27ms 보다 큰 변화인가**다.

| 항목                   | Before                        | After                      | 변화               | 범위(27ms) 초과 |
| ---------------------- | ----------------------------- | -------------------------- | ------------------ | --------------- |
| FCP 중앙값             | 618 ms                        | **79 ms**                  | −539 ms (−87%)     | ✅              |
| LCP 중앙값             | 701 ms                        | **79 ms**                  | −622 ms (−89%)     | ✅              |
| CLS 중앙값             | 0                             | **0**                      | 유지               | 회귀 없음       |
| LCP element            | `img.…__image` 332×415        | `img.…__image` **332×415** | **동일**           | —               |
| Hero 실제 파일         | `hero-original.jpg` 3840×2160 | `hero-portrait-600.avif`   | 후보 선택으로 전환 | —               |
| Hero 전송 크기         | 7,545,239 B                   | **28,671 B**               | −99.6%             | ✅              |
| Hero 요청 시작 시점    | 537 ms                        | **45 ms**                  | −492 ms            | ✅              |
| LCP 최장 구간          | TTFB 513 ms (73%)             | **load delay 39 ms**       | 병목 자체가 이동   | ✅              |
| 페이지 총 전송         | 8.0 MB                        | **485,102 B**              | −94%               | ✅              |
| Lighthouse 이미지 낭비 | 7,388,963 B (98.0%)           | **Hero 지적 없음**         | 해소               | ✅              |

**LCP element 의 표시 크기가 332×415 로 Before 와 같다.**
과제가 금지한 "작게 보이게 하거나 품질을 낮춰 수치만 줄이는 것"에 해당하지 않는다는 직접 증거다.
같은 크기로 같은 그림을 보여주면서 전송 바이트만 263배 줄였다.

#### LCP 4구간 — 병목이 어디로 갔는가

| 구간                   | Before | After     | 판정                             |
| ---------------------- | ------ | --------- | -------------------------------- |
| Time to first byte     | 513 ms | **4 ms**  | 변경 1 이 겨냥한 지점. 해소      |
| Resource load delay    | 16 ms  | 39 ms     | 최장 구간이 됐으나 절대값은 작다 |
| Resource load duration | 89 ms  | **6 ms**  | 변경 3 이 겨냥한 지점. 해소      |
| Element render delay   | 107 ms | **35 ms** | 함께 줄었다                      |
| 합                     | 725 ms | **84 ms** |                                  |

남은 79ms 는 **load delay 39 + render delay 35** 가 거의 전부다.
`fetchpriority=high` 로 줄일 수 있는 몫이 여기 39ms 안에 있으나, 3장의 판단을 유지한다.
Before 에서 "발견 지연 15ms 를 줄이려 preload 를 붙이지 않는다"고 적은 근거가
개입 후에도 그대로다 — 절대값이 계측 노이즈에 가까운 크기다.

### 5-3. 부수 지표 — Desktop 1350×940 @1 · No throttling

| 회차       | FCP (ms) | LCP (ms) | CLS   | score   |
| ---------- | -------- | -------- | ----- | ------- |
| 1          | 86       | 86       | 0     | 100     |
| 2          | 87       | 87       | 0     | 100     |
| 3          | 82       | 82       | 0     | 100     |
| 4          | 83       | 83       | 0     | 100     |
| 5          | 94       | 94       | 0     | 100     |
| **중앙값** | **86**   | **86**   | **0** | **100** |

| 항목           | Before              | After                      |
| -------------- | ------------------- | -------------------------- |
| LCP 중앙값     | 693 ms              | **86 ms** (−88%)           |
| Hero 표시 크기 | 1136 × 639          | **1136 × 639** (동일)      |
| Hero 파일      | `hero-original.jpg` | `hero-landscape-1280.avif` |
| Hero 전송      | 7,545,239 B         | **67,936 B** (−99.1%)      |
| 총 전송        | —                   | 517,939 B                  |

**이 표가 화질 회귀 검증이다.** 0장에서 "모바일 표시 크기에만 맞춰 줄이면 데스크탑에서 깨진다"고
적어 둔 위험이 실현되지 않았음을 보인다. 데스크탑은 `landscape-1280` 을 받아
1136 CSS px 를 DPR 1 로 채운다. 필요 픽셀보다 큰 후보를 받으므로 축소만 일어난다.

### 5-4. 부수 지표 — Mobile · Slow 4G (simulated)

1-1-보조와 같은 조건이다. **7.5MB 가 실사용자 회선에서 어떤 비용이었는지**의 회수분이다.

| 회차       | FCP (ms) | LCP (ms)  | CLS   | score  |
| ---------- | -------- | --------- | ----- | ------ |
| 1          | 905      | 2,923     | 0     | 95     |
| 2          | 905      | 2,921     | 0     | 95     |
| 3          | 905      | 2,925     | 0     | 95     |
| 4          | 904      | 2,908     | 0     | 95     |
| 5          | 904      | 2,922     | 0     | 95     |
| **중앙값** | **905**  | **2,922** | **0** | **95** |

| 항목 | Before    | After        | 변화              |
| ---- | --------- | ------------ | ----------------- |
| FCP  | 909 ms    | 905 ms       | 변화 없음         |
| LCP  | 40,883 ms | **2,922 ms** | −37,961 ms (−93%) |
| CLS  | 0         | 0            | 유지              |

1-1-보조에서 세운 산술이 그대로 성립한다.

```
Before: 7,545,239 B × 8 ÷ 1,474,560 bps ≈ 40.9 s   ≒ 측정 40,883 ms
After:     28,671 B × 8 ÷ 1,474,560 bps ≈  0.16 s
```

전송 시간이 40.9s → 0.16s 로 사라지고, 남은 2.9s 는 Hero 가 아니라
**나머지 리소스(상품 카드 이미지 13장 · JS · 폰트)의 전송 시간**이다.
`LCP 구간`도 그것을 확인해 준다 — load duration 이 4ms 다. Hero 는 이미 병목이 아니다.

> **FCP 가 905ms 로 그대로인 것이 정상이다.** 이 조건의 FCP 는 document 와 CSS 전송이 정하고,
> 그 둘은 개입 대상이 아니었다. 개입한 것만 움직였다는 뜻이라 오히려 계측의 신뢰 근거다.

### 5-5. 남은 지적 — 상품 카드 이미지

After 리포트에 Hero 대신 새 지적이 하나 남는다.

| 리소스                                                 | wastedBytes | 조건    |
| ------------------------------------------------------ | ----------- | ------- |
| `/_next/image?url=/images/products/p21.jpg&w=828&q=75` | 54,621 B    | Mobile  |
| 같은 파일 `w=640`                                      | 63,539 B    | Desktop |

Hero 가 7.4MB 를 차지하던 동안 가려져 있던 항목이다. 개입하지 않는다. 근거는 3장에 적는다.

### 5-6. 수동 측정 대조 (Slow 4G) — 사람이 재는 몫

패널이 정상 동작하는 유일한 조건이라 여기서 대조한다. Before 는 1-1-보조(41.1s ×5)다.

#### DevTools Lighthouse 패널 · Mobile · Simulated throttling

| 회차       | 시각     | score  | FCP       | LCP       | TBT       | SI        | CLS   |
| ---------- | -------- | ------ | --------- | --------- | --------- | --------- | ----- |
| 1          | 22:37:04 | 95     | 0.9 s     | 2.9 s     | 10 ms     | 0.9 s     | 0     |
| 2          | 22:38:07 | 95     | 0.9 s     | 2.9 s     | 10 ms     | 0.9 s     | 0     |
| 3          |          | 95     | 0.9 s     | 2.9 s     | 10 ms     | 0.9 s     | 0     |
| 4          |          | 95     | 0.9 s     | 2.9 s     | 10 ms     | 0.9 s     | 0     |
| 5          |          | 95     | 0.9 s     | 2.9 s     | 10 ms     | 0.9 s     | 0     |
| **중앙값** |          | **95** | **0.9 s** | **2.9 s** | **10 ms** | **0.9 s** | **0** |

> 5회 모두 같은 값이라 캡처는 2회분만 남긴다. Before(1-1-보조)에서 41.1s 가 5회 내내 같았던 것과
> 같은 이유다 — Lantern 시뮬레이션은 리소스 목록이 같으면 결과도 같다.

#### 수동 ↔ CLI 대조

| 지표      | Before 수동 | After 수동 | After CLI 중앙값 | CLI raw 범위     | 판정      |
| --------- | ----------- | ---------- | ---------------- | ---------------- | --------- |
| **score** | —           | **95**     | **95**           | 95 – 95          | ✅ accept |
| FCP       | 0.9 s       | 0.9 s      | 905 ms           | 904 – 905 ms     | ✅ accept |
| **LCP**   | **41.1 s**  | **2.9 s**  | **2,922 ms**     | 2,908 – 2,925 ms | ✅ accept |
| TBT       | 10 – 20 ms  | 10 ms      | 8 ms             | 1 – 9 ms         | ✅ accept |
| SI        | 1.2 – 1.3 s | 0.9 s      | 1,124 ms         | 904 – 1,137 ms   | ✅ accept |
| CLS       | 0           | 0          | 0                | 0 – 0            | ✅ accept |

**LCP 41.1 s → 2.9 s.** 두 계측이 독립적으로 같은 값을 냈다.

**SI 판정 근거** — 표시값 0.9s 만 보면 CLI 중앙값 1,124ms 와 어긋나 보인다.
DevTools 는 0.1s 로 반올림하므로 0.9s 는 실제로 **[850, 950) ms** 를 뜻하고,
CLI raw 범위 [904, 1137] 과 [904, 950) 에서 겹친다. 같은 값을 재고 있다.
CLI run 4 는 실제로 904ms 였다. 반올림 표시를 그대로 숫자로 취급하면 안 되는 사례다.

#### LCP request discovery — 육안 확인 (1-2 대조)

패널 Insights 에서 세 항목과 element 를 확인했다. CLI 결과와 일치한다.

| 항목                  | Before | After     |
| --------------------- | ------ | --------- |
| `requestDiscoverable` | ✅     | ✅        |
| `eagerlyLoaded`       | ✅     | ✅        |
| `priorityHinted`      | ❌     | ❌ (유지) |

element 는 여전히 `img.HeroSection-module__lqBdna__image` 다.
`fetchpriority=high` 는 붙이지 않은 그대로다 — 3장의 판단을 유지한 결과가 패널에도 그대로 보인다.

#### Lighthouse 리포트 filmstrip — 표시 **순서** 확인 (시각 비교 아님)

리포트 상단 filmstrip 8프레임 중 **1프레임부터 Hero 이미지가 이미 채워져 있다.**
1프레임에서 비어 있는 것은 Hero 문구 자리(`HeroCopyFallback`)뿐이고, 2프레임부터 문구가 들어온다.

| 항목                 | Before      | After                         |
| -------------------- | ----------- | ----------------------------- |
| 먼저 채워지는 것     | 텍스트·목록 | 텍스트·목록 + **Hero 이미지** |
| 마지막에 채워지는 것 | Hero 이미지 | Hero **문구** (스트리밍 대상) |

**무엇이 마지막에 오는지가 바뀌었다.** Before 는 데이터와 무관한 이미지가 끝까지 남았고,
After 는 데이터에 묶인 문구만 남는다. 변경 1(렌더링 경계를 데이터 소유권대로 나눈다)이
의도한 결과가 순서에 그대로 나타난다.

> **이 filmstrip 으로 1-3 의 24,151ms 와 시각을 비교하면 안 된다.**
> 1-3 은 Performance 패널 녹화(CPU 4x + Slow 4G, **실제 스로틀**)로 얻은 값이고,
> 이 filmstrip 은 Lighthouse 가 **스로틀 없이 관측한** 타임라인이다. 시간 축이 다르다.
> 여기서 읽을 수 있는 것은 **순서**뿐이고, 시각 대조는 아래 Performance 패널 항목에서 한다.

#### Performance 패널 녹화 — 시각 대조 (1-3 대조)

1-3 과 같은 조건으로 다시 녹화했다: `Screenshots ✅` · `CPU 4x` · `Slow 4G` (실제 스로틀).
전체 녹화 구간 **5,429.37 ms**, 패널 상단 **CLS 0**.

| 항목                              | Before               | After                          |
| --------------------------------- | -------------------- | ------------------------------ |
| Hero 자리가 빈 박스였던 구간      | **24,151 ms 까지**   | **519.7 ms** (Frames 1개 분량) |
| 그 뒤 Hero 이미지가 유지된 프레임 | —                    | 1,925.9 ms                     |
| 전체 녹화 구간                    | (Hero 때문에 45s 대) | **5,429.37 ms**                |
| CLS                               | 0                    | **0**                          |

**Hero 자리의 빈 박스가 24초에서 0.52초로 줄었다.** 1-3 에서 "Hero 자리만 베이지 박스로
24초 넘게 비어 있다가 뒤늦게 채워진다"고 적은 현상이 한 프레임 길이로 축소됐다.

> 값은 Frames 트랙의 프레임 **지속 시간** 라벨에서 읽었다. 녹화 앞부분의 프레임들은
> 내비게이션 이전(이전 화면)이라 대조에서 제외했다.

Main thread 요약도 함께 남긴다. 이 개입이 CPU 를 늘리지 않았음을 보인다.

| 항목      | 값                |
| --------- | ----------------- |
| Scripting | 456 ms            |
| System    | 101 ms            |
| Rendering | 8 ms              |
| Painting  | 5 ms              |
| Loading   | 1 ms              |
| 1st party | 492 kB · 378.0 ms |

#### DPR 2 에서 다른 후보가 선택된다 — `srcset` 동작 확인

Performance 패널 Network 트랙에 찍힌 파일명이 **`hero-portrait-900.avif`** 다.
Lighthouse CLI 가 받은 `hero-portrait-600.avif` 와 다르다. **의도한 동작이다.**

| 계측              | DPR   | `sizes` 계산 폭     | 선택된 후보              | 전송     |
| ----------------- | ----- | ------------------- | ------------------------ | -------- |
| Lighthouse CLI    | 1.75  | 316 × 1.75 = 553 px | `hero-portrait-600.avif` | 28,389 B |
| DevTools (Retina) | **2** | 316 × 2 = 632 px    | `hero-portrait-900.avif` | 54,397 B |

`sizes="calc(100vw - 96px)"` 는 412px 뷰포트에서 316 CSS px 다.
브라우저는 거기에 DPR 을 곱한 값 이상인 가장 작은 후보를 고른다.

**두 계측이 서로 다른 파일을 받은 것이 `srcset` 이 동작한다는 직접 증거다.**
0장에서 "실기기는 DPR 2~3 이라 `portrait-900`(53.1 kB)을 받는다"고 정정해 둔 예측이 관측으로 확인됐다.
어느 쪽이든 Before 7,545 kB 대비 각각 **266배 · 139배** 작다.

#### Network 하단 상태바 (1-4 대조)

| 항목             | Before                 | After                       | 변화        |
| ---------------- | ---------------------- | --------------------------- | ----------- |
| requests         | 46                     | 45                          | −1          |
| transferred      | **8.0 MB**             | **516 kB**                  | **−93.5%**  |
| resources        | 8.5 MB                 | 977 kB                      | −88.5%      |
| Finish           | 46.43 s                | **6.56 s**                  | −39.9 s     |
| DOMContentLoaded | 1.29 s                 | 1.34 s                      | 사실상 동일 |
| Load             | **45.70 s**            | **4.65 s**                  | **−41.1 s** |
| Hero 행          | 7,546 kB · **45.12 s** | `portrait-900.avif` 54.4 kB | −99.3%      |
| document         | 7.4 kB · 603 ms        | 10.0 kB · 622 ms            | +2.6 kB     |

**`DOMContentLoaded → Load` 간격이 44.4 s 에서 3.3 s 로 줄었다.**
1-4 에서 "그 44.4초가 통째로 Hero"라고 판정했던 부분이 그대로 회수됐다.

> **document 가 2.6 kB 늘었다.** `<picture>` 의 5개 `<source>` 와 `srcset` 목록,
> 그리고 3단계에서 붙인 metadata·Open Graph 태그가 초기 HTML 에 실린 몫이다.
> 7,546 kB 를 54 kB 로 줄이는 대가로 2.6 kB 를 낸 것이라 기록해 둔다.

**남은 요청 구성** — Hero 가 빠지자 무엇이 남는지 확인했다.

| 종류                          | 건수   | 크기        | 비고                        |
| ----------------------------- | ------ | ----------- | --------------------------- |
| 상품 카드 `/_next/image` webp | 13     | 6.0~18.8 kB | 3장 참조 (p21 만 72.3 kB)   |
| `products?_rsc=…`             | 12     | 0.5~1.4 kB  | Next `<Link>` 기본 prefetch |
| script / css / font           | 나머지 | —           | 3장 "프레임워크 산출물"     |

`_rsc` prefetch 12건은 카테고리 링크에 대한 Next 기본 동작이다. 합쳐도 약 12 kB 라 개입하지 않는다.
Before 에는 Hero 에 가려 보이지 않던 항목이고, 여기서도 바이트가 아니라 **요청 수**만 늘린다.

#### Hero Timing 탭 (1-4 대조)

| 구간                        | Before        | After         |
| --------------------------- | ------------- | ------------- |
| Queued at                   | 576.61 ms     | 600.52 ms     |
| Started at                  | 578.67 ms     | 600.93 ms     |
| Queueing                    | —             | 0.41 ms       |
| Stalled                     | —             | 22.25 ms      |
| Request sent                | —             | 62 µs         |
| Waiting for server response | —             | 607.86 ms     |
| **Content Download**        | **≈ 45.12 s** | **701.27 ms** |
| 합                          | 45.12 s       | **1.33 s**    |

**Content Download 가 45.12 s 에서 0.70 s 로 줄었다.** 전송 바이트를 줄인 개입의 직접 결과다.

> `Waiting for server response 607.86 ms` 는 서버 처리 시간이 아니다.
> DevTools 실제 스로틀의 Slow 4G 는 요청마다 약 562.5 ms 의 지연을 넣는다(0장 CLI 설정의 `requestLatencyMs` 와 같은 값).
> 로컬 정적 파일이라 실제 서버 처리는 1ms 수준이고, 이 값은 스로틀이 만든 왕복 지연이다.
> Before 도 같은 조건이었으므로 대조에 영향을 주지 않는다.

**요청 시작 시점은 Before 576.61 → After 600.52 ms 로 사실상 같다.**
발견 시점을 앞당긴 것이 아니라 **받아야 할 바이트를 줄인 것**이 개선의 원인임을 보인다.
1-2 의 "발견은 이미 빠르다(load delay 15ms)"는 진단과 일치하고,
`fetchpriority=high` 에 개입하지 않기로 한 3장의 판단을 뒷받침한다.

### 회귀 확인

사람이 눈으로 확인한 항목과 도구로 확인한 항목을 나눠 적는다.

| 항목                                  | 확인 방법                                                  | 결과                                                 |
| ------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| 검색·카테고리·정렬·페이지 URL 복원    | 조건 변경 후 새로고침 → 폼 상태 일치                       | ✅ 이상 없음                                         |
| 뒤로 가기 / 앞으로 가기               | 조건 3회 변경 후 뒤로 3회 · 앞으로 3회                     | ✅ 이상 없음                                         |
| 장바구니 · 위시리스트 · Header 개수   | 담기·찜하기 → Header 수치 증가 → 새로고침 후 유지          | ✅ 이상 없음                                         |
| 로딩 · 에러 · 빈 상태 · 재시도        | `?scenario=slow` · `?q=` 0건 · `?scenario=error` 후 재시도 | ✅ 이상 없음                                         |
| Hero 시각적 크기 · 비율 · 문구 · 품질 | Lighthouse LCP element `boundingRect` · 육안               | ✅ 표시 크기 Before 와 동일 (332×415 · 1136×639)     |
| CLS                                   | Lighthouse 3조건 × 5회 · Performance 패널 녹화             | ✅ 전부 0                                            |
| FSD 의존 방향 · 슬라이스 Public API   | `eslint-plugin-boundaries`                                 | ✅ 위반 0                                            |
| `pnpm check`                          | `vitest` · `eslint` · `tsc --noEmit` · `next build`        | ✅ test 41 pass · lint · typecheck · build 전부 통과 |

**성능을 얻는 대가로 기능이 깨진 곳은 없다.**
2단계에서 목록의 네 화면을 손봤고 1단계에서 렌더링 경계를 옮겼으므로,
URL 복원·히스토리·낙관적 갱신·에러 복구가 그대로인지가 이 개입의 통과 조건이었다.

---

## 6. 교차 검증 기록

> 수동 측정(DevTools Lighthouse 패널)과 Lighthouse CLI 결과를 대조한다.
> **accept 기준**: CLI 중앙값이 수동 측정 5회의 [최솟값, 최댓값] 범위 안에 들어오면 accept.
> 범위 밖이면 측정 조건 불일치를 먼저 의심한다.

### 6-1. Before (Slow 4G)

| 지표 | 수동 중앙값 | CLI 중앙값 | CLI raw 범위       | 판정      |
| ---- | ----------- | ---------- | ------------------ | --------- |
| FCP  | 0.9 s       | 909 ms     | 908 – 912 ms       | ✅ accept |
| LCP  | 41.1 s      | 40,883 ms  | 40,809 – 41,112 ms | ✅ accept |
| CLS  | 0           | 0          | 0 – 0              | ✅ accept |

**기준 적용 시 주의** — 원래 기준은 "CLI 중앙값이 수동 [최솟값, 최댓값] 안"이었으나,
DevTools 가 0.1s 로 반올림해 표시하는 탓에 수동 5회가 전부 41.1s 로 같아 범위가 한 점으로 뭉개진다.
그래서 방향을 뒤집어 판정했다: **수동 41.1s 가 CLI raw 범위 [40.809, 41.112] 안에 들어온다.**
두 중앙값 차이 0.2s (0.5%). 같은 값을 재고 있다고 본다.

**수치가 회차마다 같은 이유** — Lighthouse 기본값이 시뮬레이션 스로틀링(Lantern)이다.
스로틀 없이 한 번 로드한 뒤 Slow 4G 를 수식으로 모델링하므로 리소스 목록이 같으면 결과도 같다.
localhost 라 네트워크 변동도 거의 없다. CLI 5회 편차는 0.7% 였다.
→ 측정 흔들림이 작아, 이후 개선이 "범위보다 큰 변화"인지 판정하기 쉬운 조건이다.

### 6-2. After (Slow 4G) — 상세는 5-6

6개 지표 전부 accept. Before 와 같은 방식으로 판정했다.

| 지표  | 수동  | CLI 중앙값 | CLI raw 범위     | 판정      |
| ----- | ----- | ---------- | ---------------- | --------- |
| score | 95    | 95         | 95 – 95          | ✅ accept |
| FCP   | 0.9 s | 905 ms     | 904 – 905 ms     | ✅ accept |
| LCP   | 2.9 s | 2,922 ms   | 2,908 – 2,925 ms | ✅ accept |
| TBT   | 10 ms | 8 ms       | 1 – 9 ms         | ✅ accept |
| SI    | 0.9 s | 1,124 ms   | 904 – 1,137 ms   | ✅ accept |
| CLS   | 0     | 0          | 0 – 0            | ✅ accept |

Before 에서 겪은 "반올림 때문에 수동 5회가 한 점으로 뭉개지는" 문제가 그대로 재현됐고,
같은 방식(수동 표시값의 반올림 구간과 CLI raw 범위가 겹치는가)으로 판정했다. 근거는 5-6.

### 6-3. Lighthouse 밖의 대조

Lighthouse 두 경로 외에, 같은 사실을 다른 도구로도 확인했다.

| 사실                  | 사람 (DevTools)                  | AI (CLI/JSON)              | 결과      |
| --------------------- | -------------------------------- | -------------------------- | --------- |
| 페이지 총 전송        | Network 상태바 **516 kB**        | `network-requests` 485 kB  | 일치      |
| 1st party 전송        | Performance Summary **492 kB**   | 위와 같음                  | 일치      |
| Hero Content Download | Timing 탭 **701.27 ms**          | LCP load duration 4 – 6 ms | 조건 차이 |
| CLS                   | 패널 **0** · 콘솔 관측 0         | 3조건 × 5회 전부 0         | 일치      |
| Hero 요청 시작        | Timing `Queued at` **600.52 ms** | `networkRequestTime` 45 ms | 조건 차이 |

**"조건 차이"로 표시한 둘은 어긋난 것이 아니다.** 수동은 Slow 4G 실제 스로틀,
CLI 공식 지표는 no throttling 이다. 스로틀이 전송 구간만 늘린다는 1-2 의 판정과 일치한다.
같은 조건(Slow 4G CLI)끼리 비교하면 load duration 4ms 로 서로 맞는다.

---

## 7. AI 활용 표기

### 작업 방식 — 두 계측을 대조하며 진행했다

AI 에게 근거를 만들게 하지 않고, **서로 다른 두 경로로 잰 값을 매번 대조**하는 방식으로 진행했다.

| 주체 | 도구                                      | 담당                                                    |
| ---- | ----------------------------------------- | ------------------------------------------------------- |
| 사람 | DevTools (Lighthouse·Network·Performance) | 수동 측정, **화질·구도 육안 판정**, 실제 사용 흐름 확인 |
| AI   | Lighthouse CLI, curl, sharp               | 5회 반복 측정, JSON 원값 추출, 픽셀 대조                |

한쪽 값이 나오면 다른 쪽으로 같은 것을 재서 맞는지 확인하고, 어긋나면 원인을 찾을 때까지 진행하지 않았다.

### 대조로 확인된 것

| 항목             | 사람(DevTools)                              | AI(CLI)                        | 결과             |
| ---------------- | ------------------------------------------- | ------------------------------ | ---------------- |
| Before FCP       | 0.9 s                                       | 909 ms                         | 일치             |
| Before LCP       | 41.1 s                                      | 40,883 ms (범위 40,809–41,112) | 일치             |
| Before CLS       | 0                                           | 0                              | 일치             |
| LCP element      | `img.HeroSection…image`                     | 동일                           | 일치             |
| 발견 진단 3항목  | discoverable ✓ / eager ✓ / priorityHinted ✗ | 동일                           | 일치             |
| LCP 4구간        | 530 / 10 / 130 / 110 ms                     | 519 / 15 / 71 / 94 ms          | 같은 순위·자릿수 |
| Hero 전송 크기   | 7,546 kB                                    | 7,545,525 B                    | 일치             |
| B1 Hero 최종 URL | `…&w=1920&q=75` webp                        | 동일                           | 일치             |

### 대조가 어긋나 원인을 찾아낸 것

**① DevTools 패널이 No throttling 을 반영하지 않았다**
사용자 수동 측정이 `No throttling` 선택인데도 41.1s 였다. AI 측정은 701ms 였다.
처음에 AI 는 "설정을 잘못 봤을 것"이라고 판단했으나 **틀렸다.**
리포트 하단 런타임 줄이 두 회차 모두 `Slow 4G throttling` 으로 찍힌 것을 사용자가 제시했고,
라벨 자체가 신뢰할 수 있는지 CLI 로 검증한 끝에 패널 쪽 문제로 확정했다.
→ 이 대조가 없었다면 Before 전체를 잘못된 조건으로 기록할 뻔했다.

**② "3.18초"의 원인을 AI 가 잘못 짚었다**
AI 는 Next 의 요청 시점 최적화 콜드스타트로 추정했으나, 사용자가 **Slow 4G 탓**임을 정정했다.
no throttling 에서는 같은 요청이 11ms 였다.

**③ 데스크탑이 더 쉬울 것이라는 AI 의 가정이 반증됐다**
"데스크탑은 문제의 크기가 줄어든다"고 판단했으나, 두 device 를 같은 조건으로 재 보니
LCP 701 vs 693ms, 낭비율 98.0 vs 98.4% 로 사실상 같았다.

**④ AI 가 계측기가 다른 두 값을 나란히 놓았다**
After filmstrip 을 Lighthouse 리포트(스로틀 미적용 관측)에서 읽고
Before 의 24,151ms(Performance 패널 **실제 스로틀**)와 비교했다. 시간 축이 다른 값이다.
사용자가 "Performance 탭은 왜 건너뛰었냐"고 물어 드러났다.
→ 리포트 filmstrip 에서는 **순서**만 읽고, 시각 대조는 같은 조건의 패널 녹화로 다시 했다.

**⑤ "AVIF 가 더 작다"는 통념이 측정으로 반증됐다**
`next.config` 에 `formats: ['image/avif','image/webp']` 를 넣고 5회 재측정했더니
`p21.jpg` 만 +8,379 B 늘어 전체가 +610 B 가 됐다. 되돌렸다.
같은 `q=75` 라도 두 포맷의 품질 척도가 달라 사진 특성에 따라 뒤집힌다.

**⑥ 더 정확하게 쓴 `sizes` 가 오히려 기능을 껐다**
`calc(50vw - 22px)` 로 여백까지 반영했더니 srcset 후보 하한이 640 이 되어 384 가 사라졌다.
next/image 의 vw 추출 정규식이 **공백 뒤 숫자만** 인식하기 때문이다.
HTML 의 실제 srcset 을 두 표기로 비교해 확정했다. 순수 `vw` 로 되돌렸다.
→ "정확하게 썼으니 맞겠지"를 확인 없이 넘겼다면 개선 폭의 절반을 잃었을 변경이다.

### 수치로는 잡히지 않아 사람이 잡아낸 것

계측이 정상값을 내는데도 잘못돼 있던 것들이다. **AI 측정만으로는 발견할 수 없었다.**

| 발견                         | 당시 수치                | 실제 문제                                                  |
| ---------------------------- | ------------------------ | ---------------------------------------------------------- |
| 홈 전체가 로딩 UI 로 덮임    | LCP·CLS 정상             | Hero 가 데이터 경계 안에 있었다. 고치자 LCP 도 662 → 178ms |
| Hero 문구 카드가 튐          | CLS 0.0031(양호)         | 육안으로 보였다. `min-height` 로 0 까지 내렸다             |
| 미리 자른 크롭의 구도 어긋남 | LCP·CLS·전송량 모두 정상 | `object-position` 해석 오류로 103px 어긋남                 |
| 목록 스켈레톤이 보이지 않음  | CLS 0 · DOM·마크업 정상  | 스켈레톤 색을 어두운 색 8% 로 깔아 다크 모드 배경에 묻혔다 |

세 번째는 사람이 지적한 뒤 AI 가 CSS 규칙을 역산해 픽셀 대조(평균 차이 2.47/255)로 확정했다.

### 계측이 계속 지적했는데 선입견이 읽지 못한 것

| 발견                        | 당시 상태                            | 실제 문제                                                    |
| --------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| 상품 카드가 `w=828` 을 받음 | Lighthouse 가 Before/After 내내 지적 | `sizes` 누락. AI 는 "이미 `next/image` 라 최적화됨"으로 넘김 |

**리포트는 처음부터 이 항목을 같은 문구로 지적하고 있었다.**
Hero 가 7.4MB 로 압도하던 동안에는 순위에 가려 있었고, Hero 를 걷어낸 뒤에도
AI 는 "`next/image` 가 붙어 있으니 남은 수단은 품질 저하뿐"이라고 판단해 3장에 그렇게 적었다.

사용자가 **"이미지 최적화는 next.config 에서도 할 수 있지 않냐"** 고 물었고,
config 로 무엇을 정할 수 있는지 확인하는 과정에서 `sizes` 누락이 드러났다.
계측기가 아니라 **질문이 찾아낸 것**이고, 결과는 전송량 −39.6 kB 였다.

> 앞의 네 건은 "계측은 정상인데 잘못됨"이고, 이건 반대로 **"계측이 지적하는데 안 읽음"** 이다.
> 도구를 늘리는 것으로는 막을 수 없고, 판단의 근거를 매번 말로 적어 두는 것으로만 드러난다.
> 3장에 "개입하지 않는 근거"를 문장으로 남겨 뒀기 때문에 그 문장이 틀렸다는 것도 지적될 수 있었다.

네 번째는 DOM 에 스켈레톤 카드 12개가 멀쩡히 있었고 Lighthouse 도 통과했다.
이 앱은 `prefers-color-scheme` 으로 배경이 바뀌는데 밝은 배경을 가정하고 색을 골랐다.
실제 카드가 이미 쓰던 `#ececec` 로 맞춰 해결했다.
같은 이유로 상태 문구의 고정 색도 `opacity` 로 바꿨다.
**어느 한쪽만으로는 잡히지 않는 종류의 오류다.**

### 산출물별 표기

| 부분                                  | AI 생성 여부                   | 직접 검토 내용                                          |
| ------------------------------------- | ------------------------------ | ------------------------------------------------------- |
| 렌더링 경계 분리 (변경 1)             | AI 초안                        | 로딩 경계 범위를 지적해 재설계, 화면으로 확인           |
| Hero 문구 fallback (변경 2)           | AI 초안                        | 육안으로 이동 확인 → 고정 높이 방식 지시                |
| 이미지 후보 생성·`<picture>` (변경 3) | AI 초안                        | 구도 어긋남 지적, 화질 판정, next/image 대안 검토 요구  |
| 생성 스크립트                         | AI 작성                        | 크롭 좌표 규칙 검증 후 수정                             |
| 측정 스크립트·JSON 추출               | AI 작성                        | 결과를 DevTools 수동 측정과 대조                        |
| 상품 카드 `sizes` (변경 5)            | AI 구현                        | **문제 자체를 사람이 발견** (next.config 질문에서 출발) |
| 이 문서                               | AI 작성, 사람 지시로 구조 결정 | 수치 출처·한계 명시 요구, 근거 없는 서술 제거 요구      |
