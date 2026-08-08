# 7주차 성능 — 수치가 아니라 원인을 고친다

점수를 올리는 것이 목적이 아니다. 무엇이 느린지를 측정으로 특정하고, 그 원인 하나에
대응하는 변경을 하나씩 넣고, 같은 조건으로 다시 재서 인과를 확인한다.

이 문서는 각 커밋이 어떤 측정에서 나왔고 무엇을 바꿨고 그 결과가 얼마였는지를 남긴다.
개선되지 않은 지표와 적용하지 않은 제안도 함께 적는다.

## 사용한 도구와 버전

| 도구 | 버전 | 이 글에서 쓴 것 |
| --- | --- | --- |
| Next.js | 16.2.10 (App Router) | RSC, `Suspense`, streaming metadata, `next/image` |
| React | 19.2.4 | `cache()`, `connection()`, `<Profiler>` |
| TanStack Query | 5.101 | `prefetchQuery`, `HydrationBoundary`, `keepPreviousData` |
| nuqs | 2.9 | `useQueryStates`, `createLoader` (`nuqs/server`) |
| Zustand | 5.0 | selector 구독 |
| Lighthouse | 12.8.2 | headless, 기본 모바일 프리셋 |
| Playwright | 1.62.1 | 상호작용 측정, 레이아웃 측정, 기능 회귀 |

## 측정 환경

| 항목 | 값 |
| --- | --- |
| 빌드 | production build (`next build`), `next start` |
| Lighthouse | 12.8.2 headless, 기본 모바일 프리셋 (412×823, DPR 1.75, CPU 4배, slow 4G) |
| 반복 | 지표마다 5회, 중앙값과 범위를 함께 적는다 |
| 프로필 | 회차마다 새 사용자 프로필 |
| 서버 | 로컬 `127.0.0.1`, `APP_ORIGIN`으로 자기 주소 주입 |

### 비교 SHA

| 구분 | SHA | 설명 |
| --- | --- | --- |
| Before | `3aa1981` | 병합 시작점. 별도 worktree에 이 커밋을 체크아웃해 같은 방식으로 빌드했다 |
| After | `0785d2c` | Hero `sizes`를 cover 기하로 고친 커밋 |

`/products`의 수치는 `36e31e0` 기준이다. 이후 커밋이 그 화면을 건드리지 않는다.
`3dc3726`은 `/performance-lab/inp`만, `0a78276`은 문서만 바꾼다.

**홈 LCP를 두 번 쟀다.** `36e31e0`에서 3,131 ms가 나왔는데, 그 값은 `sizes`가 실제보다
좁아서 모바일이 절반 크기 후보를 받은 상태의 값이다. 화질 계약을 깨서 얻은 수치라
최종값으로 쓰지 않는다. 아래 3절에 중간 측정으로 따로 남긴다.

로컬 단일 머신 측정이다. 절대값은 이 환경의 값이고, 판단의 근거로 쓰는 것은 같은 조건에서의 차이다.

## 1. 최종 Before / After

### `/` 홈

아래는 전부 **Lighthouse 기본 감속(`simulate`, Lantern 추정)** 값이다. 과제가 요구한 조건이라
그대로 둔다. FCP는 적용형 감속에서 다르게 나오므로 4절에 대조를 따로 적었다.

| 지표 | Before 중앙 [범위] | After 중앙 [범위] |
| --- | --- | --- |
| LCP | 42,175 ms [42,169~42,184] | **3,384 ms** [3,264~3,387] |
| CLS | 0.065 [변동 없음] | **0** [변동 없음] |
| FCP | 1,360 ms [1,357~1,363] | 2,259 ms [2,257~2,263] |
| TBT | 13 ms [9~19] | 6 ms [2~9] |
| Performance | 74 | 89 |

```
Before  FCP 1360,1363,1357,1357,1360   LCP 42175,42184,42170,42169,42175   CLS 0.065×5
After   FCP 2260,2263,2258,2257,2259   LCP  3387, 3270, 3264, 3384, 3387   CLS 0×5
```

### `/products` 목록

| 지표 | Before 중앙 [범위] | After 중앙 [범위] |
| --- | --- | --- |
| FCP | 1,358 ms [1,356~1,360] | **1,205 ms** [1,204~1,205] |
| LCP | 3,217 ms [3,215~3,221] | **2,465 ms** [2,454~2,466] |
| CLS | 0 | 0 |
| TBT | 6 ms [5~9] | 6 ms [0~7] |
| Performance | 93 | 97 |

```
Before  FCP 1357,1359,1356,1358,1360   LCP 3215,3218,3221,3216,3217
After   FCP 1204,1205,1205,1205,1205   LCP 2466,2455,2465,2454,2466
```

## 2. 홈 LCP — 42초의 정체

LCP 후보 원소는 Before와 After 모두 같은 Hero 이미지다. 바뀐 것은 그 이미지가 무엇으로
어떻게 도착하느냐다.

| 측정 | Before | After |
| --- | --- | --- |
| Hero 전송량 | 7,545,525 B | **162,058 B** |
| Hero 요청 시작 시각 | 626 ms | **41 ms** |
| 선택된 후보 폭 | 3840 (후보 없음) | 1920 |
| LCP element | `<img class="week07-hero-image" src="/images/week-07/hero-original.jpg">` | 같은 Hero, `data-nimg` 최적화 경로 |
| document | 9,107 B / TTFB 2 ms | 32,947 B / TTFB 6 ms |

원인은 두 가지가 겹쳐 있었다.

**크기.** 3840×2160 원본 7.2 MB를 그대로 내려보내고 CSS로 줄여 그렸다. `next/image`에
실제 렌더 크기를 알려주는 `sizes`를 붙여 후보를 고르게 했다.

```
sizes="(max-width: 760px) calc(222.222vw - 53.333px), (min-width: 1488px) 1440px, calc(100vw - 48px)"
```

**`sizes`는 박스 폭이 아니라 `object-fit: cover`가 그리는 이미지 폭이다.** 760px 이하에서
`.week07-hero`는 `aspect-ratio: 4/5`인 세로 박스라, 16:9 원본이 높이를 채우려고 확대되며
좌우가 잘린다. 그려지는 폭은 박스 폭 `W`가 아니라 `W × 5/4 × 16/9 = W × 20/9`다.
`W = 100vw - 24px`를 넣으면 `222.222vw - 53.333px`가 된다.

그 위 구간은 `aspect-ratio: 16/8`인 가로 박스라 폭이 그대로 크기를 정한다. 여백은 48px이고,
1440px에 그 여백을 더한 1488px이 컨테이너가 최대 폭에 닿는 지점이다.

이 구분을 처음에 놓쳤다. 3절에 무엇이 어떻게 틀렸는지 측정과 함께 적는다.

**발견 시각.** Before는 홈 셸 전체가 조회 결과를 기다렸다. 데이터가 오기 전에는 화면에
`Loading home…` 한 줄뿐이라, Hero는 초기 HTML에 존재하지 않았고 브라우저가 626 ms까지
그 이미지의 존재를 몰랐다.

`13b5113`에서 셸을 서버 컴포넌트로 올리고 조회 부분만 `Suspense` 안으로 내렸다. Hero가
첫 응답 HTML에 들어가면서 preload 힌트가 함께 나가고, 요청이 41 ms에 시작된다.

여기서 처음에 틀린 판단을 했다. `next/image`의 `preload` prop이 힌트를 만든다고 적었는데,
실제로는 **React 19가 서버에서 렌더된 non-lazy `<img>`에 대해 `<link rel="preload">`를
발행**한다. 평범한 `<img>`로 바꿔도 힌트가 남는 것을 확인해 검증했다. 즉 결정적인 변수는
prop이 아니라 **Hero가 서버 셸에 있느냐**였다.

`preload`는 그래도 남겼다. 이 이미지가 LCP 후보라는 의도를 코드에 적어 두는 값이 있고,
지우면 다음 사람이 lazy로 되돌릴 여지가 생긴다. 다만 요청 발견 시점을 결정한 변수는 이 prop이
아니라 Hero가 첫 서버 응답에 포함되는지였다.

CLS 0.065도 같은 커밋에서 사라졌다. 로딩 문구 한 줄이 실제 콘텐츠로 교체되며 밀리던 것이
원인이고, 셸이 처음부터 최종 높이를 잡으면서 이동이 없어졌다.

## 3. Hero 화질 — 스스로 만든 회귀를 찾아 고쳤다

증거를 정리하다가 **모바일 Hero가 2배로 확대되고 있는 것**을 발견했다. `8a1352d`에서
`sizes`에 박스 폭을 적은 것이 원인이다.

### 무엇이 틀렸나

`sizes`는 이미지가 차지하는 폭을 신고하는 계약인데, `object-fit: cover`가 걸린 세로 박스에서는
**그려지는 폭이 박스 폭보다 크다.** 이미지가 좌우로 넘쳐 잘리기 때문이다.

| | 모바일 (412px, DPR 1.75) | 데스크톱 (1280px, DPR 1) |
| --- | --- | --- |
| 박스 | 388×485 (비율 0.8) | 1232×616 (비율 2.0) |
| 크기를 정하는 변 | **높이** | 폭 |
| 그려지는 이미지 폭 | **862 CSS px** | 1232 CSS px |
| 필요한 물리 픽셀 | **1,509** | 1,232 |

데스크톱은 박스가 가로형이라 폭이 그대로 크기를 정한다. 그래서 **모바일에서만** 어긋났다.

### 고치기 전후

| | 고치기 전 | 고친 뒤 |
| --- | --- | --- |
| 선택된 후보 | 750 | **1,920** |
| 배율 | **2.01배 확대** | 0.79배 (확대 없음) |
| 원본 대비 평균 절대차 | 4.22 | **2.04** |
| 원본 대비 최대 채널차 | 99 | **38** |

최적화본과 원본에 **같은 `object-fit: cover` 크롭과 `object-position`을 적용해** 실제 표시
해상도(679×849 device px)로 잘라 채널별 차이를 냈다. 캔버스 전체에 늘려 그리면 잘려 나간
영역까지 섞여 화면에 없는 그림을 비교하게 된다.

육안으로도 가방 가죽 결이 고치기 전에는 뭉개졌고 고친 뒤 되살아났다. 데스크톱은 원래 여유가
있어 변화가 없다(2.15 / 29 그대로).

**피사체와 문구는 두 경우 모두 같다.** 크롭은 CSS `object-position: 56% 50%`가 정하므로
후보 크기와 무관하다. 잘린 것은 해상도지 구도가 아니다.

### 대가

| 지표 | 잘못된 `sizes` (`36e31e0`) | 고친 `sizes` (`0785d2c`) |
| --- | --- | --- |
| LCP 중앙 [범위] | 3,131 ms [3,129~3,341] | **3,384 ms** [3,264~3,387] |
| Hero 전송 | 32,425 B | **162,058 B** |
| Performance | 91 | 89 |

중앙값 차이 253 ms는 각 조건 내부 산포(212 ms, 123 ms)보다 크다. **측정 노이즈가 아니라
실제 악화다.**

그래도 고친 쪽을 택했다. 3,131 ms는 화질 계약을 깨서 얻은 값이고, 전송량은 원본 대비
여전히 **46배** 작다. `sizes`를 실제보다 좁게 신고하는 것은 최적화가 아니라 결함이다.

### 남은 낭비

1920px 가로 이미지를 받아 4:5로 잘라내므로 폭의 **45%만 화면에 보인다.** 이걸 없애려면
모바일용 세로 crop 에셋을 따로 두는 art direction이 필요하다. 새 에셋이 생기는 더 큰
변경이라 이번 범위 밖으로 두고 후속 과제로 기록한다.

## 4. 홈 FCP — 시뮬레이션에서만 나타난 899 ms

시뮬레이션 감속에서 홈 FCP가 1,360 ms에서 2,259 ms로 늘었다. 처음에는 이것을 실제 지연으로
읽고 원인을 찾았고, **틀린 원인을 문서에 적었다가 실험으로 뒤집었다.** 그 과정을 남긴다.

### 세운 가설과 반증

여섯 번 쟀다. 각 회차의 원값은
[`docs/measurements/week-07/lighthouse-fcp-exp*.json`](measurements/week-07)에 있다.

| # | 실험 | 감속 | FCP 중앙 | 판정 |
| --- | --- | --- | --- | --- |
| 1 | Hero 요청 차단 | simulate | 2,258 ms | Hero 대역폭 경쟁 **반증** |
| 2 | 폰트 서브셋 차단 | simulate | 3,485 ms | 차단해도 FCP가 **개선되지 않음** (오히려 악화) |
| 3 | 셸 문구만 라틴 치환 | simulate | 1,356 ms | 상관은 재현 |
| 4 | 한글 문구 그대로 | **devtools** | 1,705 ms | — |
| 5 | 셸 문구만 라틴 치환 | **devtools** | 1,700 ms | 문자 종류 차이 **없음** |
| 6 | Before `3aa1981` | **devtools** | 1,627 ms | — |

실험 2는 차단이 대역폭과 글꼴 이용 가능성을 함께 바꾸므로, 이 하나만으로 대역폭 경쟁이라는
인과를 분리하지는 못한다. 다른 실험과 합쳐 기존 가설을 폐기했다.

### 폐기했다가 되돌린 주장

**"한글 서브셋 요청이 2개 64 KB에서 7개 183 KB로 늘었다"는 처음 적은 값이 맞았다.** 이
주장을 한 번 폐기했는데, 폐기 근거가 틀렸다.

폐기할 때 든 근거는 "세 상태 모두 폰트 요청이 10건 265,088 B로 같다"였다. 총합은 실제로
같다. 그러나 원래 주장은 총합이 아니라 **paint 이전 창**에 대한 것이었다. **총합으로 부분
창의 주장을 반증할 수 없다.** 두 값이 재는 대상이 다르다.

같은 raw를 요청 시각으로 나눠 다시 세면 이렇다. 폰트는 두 버스트로 갈라져 도착한다.

| 조건 | 1차 버스트 (요청 < 300 ms) | 2차 버스트 | 총합 |
| --- | --- | --- | --- |
| Before `3aa1981` | **2건 64,312 B** | 8건 200,776 B (612 ms) | 10건 265,088 B |
| After 한글 | **7건 183,324 B** | 3건 81,764 B (519 ms) | 10건 265,088 B |
| 라틴 치환 | **2건 64,312 B** | 8건 200,776 B (525 ms) | 10건 265,088 B |

**총합은 같고 버스트 배분만 다르다.** 5회 전부 2건 / 7건 / 2건으로 편차가 없었다. 셸을
서버 컴포넌트로 올려 한글 문구가 첫 flush에 실리면서, 그 문구를 그리는 데 필요한 서브셋이
2개에서 7개로 늘어난 결과다. 라틴으로 치환하면 2개로 돌아온다.

**"한글 문구가 원인 변수"는 시뮬레이션에 한정해 성립한다.** 적용형 감속에서는 한글
1,705 ms, 라틴 1,700 ms로 차이가 없다. 실제 브라우저는 이 서브셋을 기다리지 않는다 —
Pretendard 서브셋 CSS의 `@font-face` 92개에 **모두 `font-display: swap`이 걸려 있고**,
적용형 감속에서 셸 문구에 필요한 서브셋 6개가 4,040 ms에 도착하는 동안 **FCP는 1,705 ms에
이미 일어난다.** 이 비용은 시뮬레이션만 청구한다. 청구 지점은 다음 절에서 특정한다.

### Lantern이 899 ms를 만든 지점

> Lantern 시뮬레이션의 899 ms 증가는 applied throttling에서 재현되지 않았고, 적용형 Lab
> 측정에서는 78 ms 차이였다.

| 측정 방식 | Before `3aa1981` | After | 차이 |
| --- | --- | --- | --- |
| Lighthouse simulated (Lantern) | 1,360 ms [1,357~1,363] | 2,259 ms [2,257~2,263] | 899 ms |
| Lighthouse applied (devtools) | 1,627 ms [1,624~1,668] | 1,705 ms [1,695~1,724] | **78 ms** |

**적용형도 Lab 측정이다.** 실제 사용자의 지연이라고 말할 수 없다. 확인된 것은 같은 두 빌드가
**감속 방식에 따라 다른 결과를 냈다는 것**이다. 원본 리포트의 추정값과 관측값, document와
CSS 요청을 같은 회차에서 대조하자 차이가 생긴 지점도 확인됐다.

**판별 변수는 라틴 대조군이 잡았다.** 세 조건을 같은 simulate 원본에서 나란히 놓는다.

| 같은 simulate 원본의 중앙값 | Before | After 한글 | 라틴 치환 |
| --- | ---: | ---: | ---: |
| document 완료 | 5 ms | **509 ms** | **509 ms** |
| 1차 버스트 폰트 | 64,312 B | **183,324 B** | **64,312 B** |
| CSS 요청 시작 | 38 ms | 43 ms | 39 ms |
| CSS 자체 `wastedMs` | 303 ms | 302 ms | 302 ms |
| render-blocking 전체 추정 | 732 ms | **1,625 ms** | **725 ms** |
| Lantern FCP | 1,360 ms | **2,259 ms** | **1,356 ms** |
| 실제 관측 FCP (`observedFirstContentfulPaint`) | 80 ms | 92 ms | 83 ms |

**라틴 치환은 document가 After와 똑같이 509 ms까지 열려 있는데 추정이 725 ms로 Before
수준에 돌아온다.** document를 원인으로 두면 이 회차를 설명할 수 없다.

이 절에 한 번 "Lantern이 끝까지 열린 document를 CSS의 선행 의존 비용으로 모델링한 결과"라고
적었는데, **위 대조군이 그 설명을 반증한다.** 폐기하고 이 표로 바꾼다. 폐기한 설명은 Before와
After 두 조건만 비교해서 얻은 것이었다. 두 조건에서는 document와 폰트 버스트가 함께 움직여
어느 쪽이 원인인지 가를 수 없었는데, 그걸 확인하지 않고 document를 골랐다.

움직인 변수는 **1차 버스트의 폰트 바이트 하나**다. CSS 자체 비용은 302~303 ms로 세 조건이
같은데도 render-blocking 전체 추정만 두 배가 된다. 실제 브라우저는 `font-display: swap`
덕에 이 서브셋을 기다리지 않고 81~97 ms에 셸을 그렸다. Lantern은 같은 요청 집합을 감속된
가상 링크에 얹어 재생하므로, 첫 버스트가 119 KB 무거워진 만큼 뒤따르는 렌더 경로가 밀린
것으로 보인다. **다만 그 바이트가 Lantern 내부의 어느 경로로 FCP에 반영되는지까지는 이
측정으로 특정하지 않았다.** 확인된 것은 판별 변수가 무엇인지까지다.

[Lighthouse 공식 throttling 문서](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md)도
simulated throttling은 비감속 관측을 재생하는 추정이며 다른 실행 경로를 예측할 때 고유한
부정확성이 있다고 설명한다.

1절의 FCP는 과제가 요구한 조건인 시뮬레이션 값 그대로 둔다. 이 절의 적용형 측정은 그 값을
대체하는 것이 아니라 대조하는 자료다.

### 이 절에서 배운 것

**Lighthouse의 기본 감속은 관측이 아니라 추정이다.** 그 추정치를 사용자가 겪는 지연으로 읽고
원인을 찾아 나선 것이 처음의 잘못이었다. 지표가 나빠 보이면 **먼저 그 지표가 무엇을 재고
있는지부터 확인해야 했다.**

이 절은 그 뒤로 두 번 더 틀렸고, 두 오류의 형태가 서로 다르다.

| 오류 | 무엇을 했나 | 형태 |
| --- | --- | --- |
| 맞는 주장을 폐기 | paint 이전 창의 주장을 **총합**으로 반증했다 | 반증에 쓴 값이 주장이 말하는 대상과 달랐다 |
| 틀린 설명으로 대체 | 함께 움직이는 두 변수 중 **대조군 없이** 하나를 골랐다 | 원인 후보를 가르는 실험을 하지 않고 결론을 냈다 |

**둘 다 새 측정이 아니라 이미 커밋한 raw를 다시 읽어서 잡혔다.** 라틴 치환 회차는 처음부터
가지고 있었는데, document가 After와 같다는 사실을 확인하지 않은 채 document를 원인으로
적었다. **대조군을 이미 손에 쥐고도 쓰지 않은 것**이 이 절에서 가장 크게 배운 것이다.

## 5. 목록 화면의 여섯 상태

목록은 조회 결과 하나에 여섯 가지 화면이 있다. 각 상태를 URL로 재현할 수 있게 만들고
production 빌드에서 확인했다.

| 상태 | 재현 | 화면 |
| --- | --- | --- |
| 최초 로딩 | `/products` 첫 진입 | 개수 행, 안내 행, 카드 12개, 페이지네이션까지 자리를 잡은 skeleton |
| 성공 | `/products` | 개수 행과 목록 |
| 조건 전환 중 | 정렬 변경 | 이전 목록 유지, `Updating…`, 페이지 이동 버튼 잠금 |
| 갱신 실패 | `?scenario=error` (2회차) | 이전 목록 유지, 실패 문구와 `Try again` |
| 0건 | `?scenario=empty` 또는 `?q=니트` | 개수 0과 무엇을 걸어서 0건인지 설명하는 문장 |
| 조회 실패 | `?scenario=error` (최초) | 실패 종류에 맞는 출구 하나 (재시도 / 초기화 / 홈) |

### 최초 로딩은 한동안 이 표와 달랐다

**이 표의 첫 줄이 코드와 어긋나 있었다.** 처음 제출한 구현에서 서버 Suspense fallback은
빈 필터 컨테이너 하나였고, 카드 12개 skeleton은 `ProductListView` 안에만 있었다. 그
컴포넌트는 서버 prefetch가 끝난 뒤에야 내려오므로, **hard navigation 최초 진입에서는
`scenario=slow`의 1.5초 동안 제목 아래가 비어 있었다.** client 전환에서만 skeleton이
보였고, 단위 테스트가 `ProductListView`만 렌더해서 이 경계를 검사하지 못했다.

서버 fallback과 클라이언트 pending이 같은 `ProductResultsPending`을 쓰도록 고쳤다.

| `scenario=slow` 첫 400 ms | 고치기 전 | 고친 뒤 |
| --- | --- | --- |
| 수신 | 9,635 B | **28,116 B** |
| skeleton 카드 | **0개** | **12개** |
| 개수 행 / 안내 행 / 페이지네이션 | 없음 | 있음 |
| 결과 region과 `aria-busy` | 없음 | 있음 |

필터 줄도 실제 클래스를 그대로 써서 높이를 맞췄다. 임의의 skeleton 막대로 채웠을 때는
110 px로 실제 125 px보다 짧아 그리드가 15 px 밀렸다.

```
pending  gridTop 684, documentHeight 2338, 카드 12
resolved gridTop 684, documentHeight 2338, 카드 12
layout-shift 엔트리 없음
```

`ProductListPage.test.tsx`가 완료되지 않는 `searchParams`로 서버 fallback을 그대로 렌더해
이 경계를 고정한다. fallback을 빈 `div`로 되돌리면 3건 중 2건이 실패하는 것을 확인했다.

### 레이아웃 이동 0

skeleton은 카드 그리드만 잡으면 부족했다. 개수 행과 **성공 상태가 늘 비워 두는 안내 행**과
페이지네이션까지 같은 높이로 예약해야 결과가 도착할 때 목록이 내려가지 않는다.

안내 행을 26px 고정으로 남긴 것이 특히 그렇다. `scenario=error`는 1.5초 뒤에 실패 문구를
띄우는데, 그 자리가 예약되어 있지 않으면 이미 읽고 있던 목록이 그 순간 아래로 밀린다.
`PerformanceObserver`로 `layout-shift` 엔트리를 수집해 `shifts: []`를 확인했다.

셸 분리가 레이아웃을 바꾸지 않았다는 것도 확인했다.

| | Before | After |
| --- | --- | --- |
| desktop 첫 카드 top / docH | 684 / 2338 | 684 / 2338 |
| mobile 첫 카드 top / docH | 793 / 3536 | 793 / 3536 |
| desktop hero 높이 | 472 | 283 |

Hero 높이만 달라졌고(`sizes` 변경의 결과) 나머지 요소의 top과 height, 문서 전체 높이는
글자까지 같다.

### 갱신 실패에서 목록을 남기는 방법

처음 설계는 "`keepPreviousData`가 실패 상태에서도 이전 결과를 준다"였다. 프로브로 확인해
보니 **최종 실패 시점에 `hasData:false`, `isPlaceholderData:false`** 였다. placeholder는
pending에만 걸린다.

그래서 마지막으로 표시가 확정된 조건만 ref에 기억하고, 실패했을 때만 그 key로 Query Cache를
직접 읽는 방식으로 바꿨다. 서버 응답을 별도 상태에 복사하지 않는다. 목록의 원본은 계속
Query Cache이고 화면이 기억하는 것은 어느 key를 보고 있었는지뿐이다. 캐시가 이미 비워졌으면
`undefined`가 되어 "보여줄 목록이 없는 실패"로 자연히 떨어진다.

0건 문구의 조건도 여기서 갈린다. 이전 결과를 보여주는 동안 현재 URL 조건으로 설명하면
아직 확인되지도 않은 0건을 사실처럼 말하게 된다. placeholder 구간과 실패 구간을 하나로 묶어
표시 중인 목록을 만든 조건으로 문장을 만든다.

## 6. metadata

세 화면의 metadata를 본문과 같은 조회 계약 위에 세웠다.

| 화면 | title | description |
| --- | --- | --- |
| root | `title.template`으로 `%s \| Loop Market` | 공통 |
| `/` | 본문 Hero와 같은 문구 | 같은 조회 결과 |
| `/products` | `Search “니트” (page 2)` | `6 products in 뷰티·잡화, sorted by Popular.` |

세 가지를 지켰다.

**같은 요청 범위를 공유한다.** metadata와 본문이 각자 조회하면 한 문서에 같은 요청이 두 번
나간다. URL 조립 함수를 하나로 두고 React `cache()`로 요청 범위 안에서 결과를 공유한다.
홈의 서버 조회가 문서당 2회에서 **1회**로 줄었다. (브라우저로 방문하면 2회로 보이는데,
Header의 `<Link href="/">`가 route prefetch로 별도 RSC 요청을 보내 서버 렌더가 한 번 더
일어나기 때문이고, 같은 문서 안의 중복이 아니다.)

**실패마다 화면이 다르다.** 예상 가능한 조회 실패(5xx, 네트워크 단절)는 아무 필드도 정하지
않아 root metadata를 상속한다. 예상 밖 오류(200인데 본문이 JSON이 아님)는 삼키지 않고
던진다. 계약이 깨진 것이라 화면이 복구 방법을 모른다.

**재현용 `scenario`는 문구에 드러내지 않는다.** 디버깅 수단이 공유 카드에 새면 안 된다.

### document의 실제 응답

production 서버에 `curl`로 요청해 `<head>`를 그대로 확인했다. Elements 패널이 아니라
서버가 만든 응답이다.

**query failure는 두 경로를 따로 재현했다.** 서버가 status를 돌려준 실패와, 요청이 origin에
닿지도 못한 실패는 다른 사건이다. 단위 테스트에서 둘 다 `{}`가 되는 것과 실제 document로
확인하는 것도 다르다.

| | normal | 정상 empty |
| --- | --- | --- |
| URL | `?category=goods&sort=popular` | `?q=니트&category=goods&scenario=empty` |
| `<title>` | `Products \| Loop Market` | `Search “니트” \| Loop Market` |
| description | `6 products in 뷰티·잡화, sorted by Popular.` | `No products match “니트” in 뷰티·잡화.` |
| `og:image` | `/images/products/p11.jpg` (첫 상품) | `/images/products/p6.jpg` (fallback) |
| `og:site_name` / `locale` / `type` | `Loop Market` / `ko_KR` / `website` | 동일 |
| `robots` | 없음 (색인 가능) | 없음 |
| `scenario` 누출 | 없음 | 없음 |

| | query failure (HTTP 500) | query failure (NetworkError) |
| --- | --- | --- |
| 재현 | `?scenario=error` | `APP_ORIGIN=http://127.0.0.1:9`로 build와 start |
| 실패 종류 | Route Handler가 500을 응답 | 요청이 origin에 닿지 못함 |
| `<title>` | `Loop Market` | `Loop Market` |
| description | `A curated commerce experience by Loopers.` | 동일 |
| `og:image` | `/images/products/p6.jpg` (root) | 동일 (origin만 `:9`) |
| `og:site_name` / `locale` | `Loop Market` / `ko_KR` | 동일 |
| `robots` | 없음 | 없음 |

포트 9는 discard 포트라 열려 있지 않다. 이 origin으로 빌드하면 metadata 조회가 응답을
받는 것이 아니라 **요청 자체를 보내지 못한다.** 그 경로에서도 페이지별 빈 값을 만들지 않고
root를 상속했고, `/`와 `/products` 둘 다 같았다.

이 상태에서 본문은 초기 HTML에 로딩 자리를 그대로 내보낸다. `prefetchQuery`는 실패를 던지지
않으므로 서버는 셸을 끝까지 스트리밍하고, 브라우저가 같은 key로 다시 가져가다 실패해
조회 실패 화면으로 간다. 서버 조회가 실패해도 문서가 깨지지 않는다.

**정상 empty는 조건과 0건을 문장으로 설명하면서 fallback 이미지를 유지**하고, **두 실패
경로 모두 root를 상속**하며, **공통 Open Graph 필드가 shallow merge에도 살아남는다.**

`og:image`가 `http://127.0.0.1:3210/...` 절대 URL로 나간다. **배포 환경의 절대 URL은
확인하지 못했다.** 16절에 닫지 못한 항목으로 적는다.

### 카테고리 이름이 화면과 갈리는 지점

| | 문장 |
| --- | --- |
| metadata | `No products match “니트” in 뷰티·잡화.` |
| 화면 | `No products match “니트” in Beauty & Goods.` |

문장 구조는 `describeEmptyResult` 하나를 공유하고 카테고리 이름만 다르다. 요구는
"metadata는 같은 query 응답의 카테고리명"이고, 화면 필터는 storefront의 고정 영문명을 쓴다.
두 계약을 동시에 지킨 결과다. 서버가 표시명을 바꾸면 공유 카드가 따라 바뀌고, 응답에 선택
카테고리가 없으면 id를 노출하지 않고 storefront 이름으로 축퇴한다.

언어 통일은 이번 성능 범위가 아니라 별도 논리적 변경으로 남긴다.

### metadata가 데이터를 기다리는 비용은 누구에게 청구되는가

`/products`, UA만 바꿔 5회씩.

| UA | TTFB | total |
| --- | --- | --- |
| 일반 | 0.005~0.016 s | 0.510~0.521 s |
| `facebookexternalhit` | 0.509~0.515 s | 0.509~0.516 s |

`scenario=slow`로 지연을 키우면 더 분명하다.

| UA | TTFB | total |
| --- | --- | --- |
| 일반 | 0.004 s | 1.507 s |
| `facebookexternalhit` | 1.506 s | 1.507 s |

Next 16이 일반 UA에는 metadata를 스트리밍으로 내보내 셸이 먼저 나가고 `<title>`이 뒤따른다.
크롤러 UA에는 metadata가 준비될 때까지 응답 자체를 붙잡는다. 이 UA를 Next.js가 metadata
streaming 대상에서 제외한 결과로 관찰됐다. 크롤러가 부분 HTML을 어떻게 다루는지는 이번
측정으로 확인한 것이 아니다.

그래서 같은 비용이 **사용자에게는 TTFB 4 ms, 크롤러에게는 1,506 ms로** 다르게 청구된다.
조회가 느려지면 크롤러 쪽만 그대로 늘어난다.

## 7. 요청 범위 중복 제거를 native fetch로 하지 않은 이유

같은 render/request에서 URL과 options가 모두 같은 native fetch만 memoization 대상이다.
이 조건이 실제로 어떻게 걸리는지 네 가지 구성으로 확인했다.

**계수 방법.** Route Handler 안에 임시 카운터와 로그를 넣고 `/products` document를 한 번
요청해 서버 로그의 호출 횟수를 셌다. 브라우저 Network은 쓰지 않았다. 서버 안에서 일어나는
중복은 브라우저에 보이지 않기 때문이다.

| 구성 | document 1건당 Route Handler 실호출 |
| --- | --- |
| A. 현재 (`cache()` + timeout signal) | **1회** |
| B. `cache()` 제거, signal 유지 | 2회 |
| C. `cache()` 제거, signal 안 넘김 | 1회 |
| D. `cache()` 제거, **같은 signal 객체**를 두 호출이 공유 | 2회 |

**D가 결정적이다.** 같은 signal 객체를 넘겨도 중복 제거되지 않았다. 객체 참조가 달라서가
아니라 signal이 options에 있다는 사실 자체가 memoization을 막는다.

> Next.js 16.2.10의 현재 구현과 이 요청 경로에서, signal이 포함된 fetch는 같은 signal
> 객체를 공유해도 중복 제거되지 않았다. native memoization을 사용하려면 timeout signal을
> 제거해야 했으므로, 요청 범위 React `cache()`를 선택했다.

두 선택의 결과를 비교하면 이렇다.

| 선택 | 실호출 | `AbortSignal`로 fetch를 10초에 중단 |
| --- | --- | --- |
| `cache()` (채택) | 1회 | **유지** |
| native memoization | 1회 | **없음** |

중복 제거 효과는 같고, native 쪽은 `AbortSignal`로 요청 자체를 끊는 수단을 잃는다. 호출자만
먼저 실패시키는 방식은 남지만, 그때 요청은 서버에 그대로 떠 있다. 응답이 오지 않는 upstream에
RSC 렌더가 매달리면, metadata를 기다리는 크롤러는 document 전체를 붙잡히게 된다. 얻는 것 없이
가용성을 내주는 교환이라 `cache()`를 택했다.

`cache()`의 범위는 한 요청이다. 사용자 요청 사이로 새지 않고 Next Cache나 모듈 싱글턴으로
넓히지도 않는다. `getQueryClient()`는 호출마다 새 인스턴스를 만들고 metadata와 본문이
QueryClient 캐시를 공유하지 않는다. 공유되는 것은 조회 Promise 하나뿐이다.

측정에 쓴 카운터와 로그는 전부 되돌렸다. 커밋된 트리에 `console.log`나 카운터가 없다.

## 8. 빠른 조건 변경과 취소된 요청

`?scenario=slow`(1.5초 지연)에서 정렬을 세 번 연속으로 바꿔, 낡은 요청이 실제로 끊기는지와
마지막에 남는 화면이 URL과 맞는지 확인했다.

| 순서 | 요청 query | 결과 |
| --- | --- | --- |
| 1 | `sort=popular` | **CANCELLED** (`net::ERR_ABORTED`) |
| 2 | `sort=price-asc` | **CANCELLED** (`net::ERR_ABORTED`) |
| 3 | `sort=price-desc` | finished |

| 최종 상태 | 값 |
| --- | --- |
| URL | `?scenario=slow&sort=price-desc` |
| 완료된 요청 | `sort=price-desc` (URL과 일치) |
| 표시 개수 | `30 products` |
| 카드 수 | 12 |
| 안내 행 | 비어 있음 |
| 오류 UI | 없음 |

**취소는 실패가 아니다.** 두 건이 끊겼는데 화면에는 오류 문구도 `Try again`도 나타나지
않았다. 취소를 사용자에게 보여줄 실패로 다루면, 사용자가 스스로 조건을 바꾼 정상 동작이
매번 에러처럼 보인다.

먼저 시작한 요청이 나중에 도착해 화면을 덮는 일도 없다. 낡은 요청은 끊기고, 화면은 마지막
조건의 결과만 그린다.

## 9. 초기 HTML 감사

| 항목 | `/` | `/products` |
| --- | --- | --- |
| 고유 title | 매일 새롭게 발견하는 취향 | Products \| Loop Market |
| description | 있음 | `30 products.` |
| h1 | 1개 | 1개 |
| main | 1개 | 1개 |
| nav | 1 (Main navigation) | 2 (Main navigation, Pagination) |
| href 링크 | 8 (카테고리 5개 포함) | 3 |
| alt 없는 img | 0 | 0 |
| alt 빈값 | 1 (Hero, 장식) | 0 |

홈의 콘텐츠 `<section>` 세 곳(Categories, Popular, New arrivals)에는 accessible name이 없어
region landmark로 노출되지 않는다. 다만 셋 다 보이는 `h2`가 있어 문서 구조와 heading 탐색으로
이미 발견된다. 접근성 요구사항이 홈 영역의 landmark 노출을 명시하지 않았고, 측정으로 확인된
결함도 아니라서 **region landmark는 추가하지 않았다.** 여기 기록만 남긴다.

목록 화면에 카테고리 링크가 없다. 카테고리 이동이 `select`로만 된다. 홈에
`/products?category=...` 링크 5개가 있어 크롤러가 모든 카테고리 목록에 도달할 수 있으므로
"주요 이동 경로가 href 링크인가"는 충족한다고 본다. 화면에 없는 탐색 UI를 새로 만드는 일이라
이번 범위 밖으로 뒀다.

## 10. Advanced A — 상호작용 지연

대상은 `/performance-lab/inp`다. 찜 버튼 하나를 누르면 카드 24개가 전부 다시 그려진다.

### 측정 방법

| 항목 | 값 |
| --- | --- |
| URL | `/performance-lab/inp?pageSize=24` |
| 카드 수 | 24 (줄이지 않는다) |
| 빌드 | 일반 production build |
| CPU | 4배 감속 (CDP `Emulation.setCPUThrottlingRate`) |
| 시작 상태 | 매 회차 새 문서, 같은 상품이 찜되지 않은 상태 |
| 행동 | 이미지 로딩 완료 후 같은 상품의 찜 버튼 1회 클릭 |
| 반복 | Before / After 각 5회, 중앙값 |

`PerformanceObserver`의 `event` 엔트리를 `durationThreshold: 16`으로 수집하고, 같은
`interactionId`의 `pointerdown + pointerup + click`을 묶어 그중 가장 긴 duration을 상호작용
값으로 썼다. 임계값을 기본에 맡기면 개선 후 엔트리가 사라져 비교가 끊긴다.

```
input delay        = processingStart - startTime
processing         = processingEnd - processingStart
presentation delay = duration - (processingEnd - startTime)
```

**이 값은 현장 INP가 아니다.** 로컬에서 한 번의 클릭을 재현한 것이고, INP에 영향을 주는
상호작용 지연 시간으로 읽어야 한다.

렌더 범위는 별도 profiling build(`next build --profile`)에서 각 카드를 `<Profiler>`로 감싸
`onRender`를 수집했다. `actualDuration`으로 비용을, 카드 id와 `phase === 'update'`로 범위를,
`commitTime` 그룹으로 같은 commit 여부를 봤다. 두 계측 모두 측정 후 제거했고 최종 diff에 없다.
profiling build의 시간은 일반 build의 상호작용 숫자와 직접 비교하지 않는다.

### 결과

| 구간 | Before 중앙 | After 중앙 |
| --- | --- | --- |
| input delay | 3 ms | 3 ms |
| processing | 1 ms | 1 ms |
| **presentation** | **117 ms** | **51 ms** |
| **duration** | **128 ms** | **56 ms** |

```
Before  run1 input 16  proc 3  pres 117  dur 136
        run2 input  4  proc 1  pres 124  dur 128
        run3 input  2  proc 1  pres 109  dur 112
        run4 input  3  proc 1  pres 116  dur 120
        run5 input  3  proc 1  pres 124  dur 128

After   run1 input 11  proc 1  pres  51  dur  64
        run2 input  2  proc 1  pres  45  dur  48
        run3 input  3  proc 1  pres  52  dur  56
        run4 input  3  proc 1  pres  52  dur  56
        run5 input  3  proc 1  pres  44  dur  48
```

| 렌더 범위 (profiling build) | Before | After |
| --- | --- | --- |
| commit 수 | 1 | 1 |
| 렌더된 카드 | **24개 전부** | **1개** |
| phase | update 24 / mount 0 | update 1 / mount 0 |
| 합계 `actualDuration` | 66 ms | 4 ms |

### 원인과 변경

이벤트 핸들러 자체는 원래 1 ms였다. **비용은 핸들러가 끝난 뒤 다음 paint까지의 렌더에
있었다.** Profiler가 그 렌더의 범위가 카드 24개 전부라는 것을 보여줬다.

```diff
- const wishlistIds = usePerformanceWishlist((state) => state.wishlistIds)
- const selected = wishlistIds.includes(product.id)
+ const selected = usePerformanceWishlist((state) =>
+   state.wishlistIds.includes(product.id),
+ )
```

카드마다 `wishlistIds` 배열 전체를 구독하고 있었다. 토글이 새 배열을 만들면 24개 카드의
selector 결과가 전부 새 참조가 되어 전원이 다시 렌더된다. 자기 찜 여부 boolean으로 좁히면
다른 상품의 찜이 바뀌어도 결과가 같은 값이라 리렌더 대상에서 빠진다.

**`memo`는 붙이지 않았다.** selector를 좁힌 뒤 Profiler에서 렌더가 1개로 떨어져 추가 경계가
필요 없다는 것이 확인됐기 때문이다. 측정 전에 메모이제이션부터 붙였다면 원인을 모른 채
증상만 덮었을 것이다.

### 우회하지 않았다는 확인

| 항목 | 확인 |
| --- | --- |
| 카드 수 | 24개 유지 |
| 화면 계산 | 24개 카드 전부 표시. 클릭 후 값도 `349624 → 578445`로 실제 재계산 |
| `setTimeout` 지연 | 없음 |
| 즉시 피드백 | `찜하기 → 찜 해제`, `aria-pressed false → true` |
| TBT를 INP 증거로 | 사용하지 않음 |

`?pageSize=24`는 요구된 URL 형태 그대로 썼지만, **현재 fixture가 24개 고정이라 이 파라미터는
결과에 관여하지 않는다.** 파라미터를 실제로 읽게 만들면 24보다 작은 값을 넣을 길이 생겨
그대로 뒀다.

## 11. 커밋과 근거

| SHA | 커밋 | 근거가 된 측정 |
| --- | --- | --- |
| `8a1352d` | Hero 이미지를 표시 폭에 맞는 후보로 내려보낸다 | 전송 7.2 MB. 다만 이때 쓴 표시 폭 전제가 틀렸다 |
| `13b5113` | 홈 셸을 느린 응답에서 떼어낸다 | Hero 요청 시작 626 ms, LCP 42.2초, CLS 0.065 |
| `89d9584` | 목록의 느린 응답을 URL로 재현할 수 있게 한다 | 전환 상태를 재현할 수단이 없었음 |
| `6c8474a` | 조건을 바꾸는 동안 목록을 비우지 않는다 | 조건 전환 시 화면 전체가 비는 것 |
| `b4ba2d9` | 최초 진입에서 결과가 들어올 자리를 먼저 잡는다 | 결과 도착 시 목록이 내려앉음 |
| `721bff5` | 목록의 빈 결과와 실패도 URL로 재현할 수 있게 한다 | 0건과 실패를 재현할 수단이 없었음 |
| `528a28d` | 갱신이 실패해도 보던 목록을 남긴다 | 최종 실패에서 `hasData:false` 프로브 |
| `1f72de6` | 0건 화면이 무엇을 걸어서 0건인지 말한다 | 0건 화면에 조건 설명이 없었음 |
| `6abc5ae` | 루트 metadata 합성 계약을 세운다 | 화면별 title 부재 |
| `a7950eb` | 홈 metadata를 본문과 같은 조회 계약으로 만든다 | 문서당 서버 조회 2회 |
| `36e31e0` | 상품 목록 metadata를 URL 조건과 응답으로 만든다 | UA별 응답 시점 차이 |
| `3dc3726` | 찜 하나가 관계없는 카드까지 다시 그리지 않게 한다 | Profiler 카드 24개, duration 128 ms |
| `0785d2c` | 잘린 Hero가 실제 그려지는 폭으로 후보를 고르게 한다 | 모바일 2.01배 확대, 픽셀 차이 3.12 / 66 |

## 12. 기능 회귀

| 항목 | 결과 |
| --- | --- |
| 검색, 카테고리, 정렬이 URL에 복원 | `q=니트&category=goods&sort=popular`, 검색 입력값도 유지 |
| 뒤로 가기 | sort가 제거된 직전 상태로 복원 |
| 앞으로 가기 | `sort=popular` 복원 |
| 장바구니, 위시리스트, Header 개수 | client navigation에서 Bag 1 / Wishlist 1 유지, 같은 상품이 홈에서도 `aria-pressed=true` |
| 빈 상태 | `0 products` / `No products match “니트”.` / `Reset filters` |
| 오류와 재시도 | `Try again` 표시, 카드 0 |
| FSD 의존 방향과 Public API | architecture check 108 files, 320 imports, 3 public APIs 통과 |

전체 새로고침 후 Header 개수가 0으로 보이는 것은 Zustand에 persist 미들웨어가 없는 기존
동작이고 이번 작업과 무관하다.

`pnpm check`(architecture → test → test:storybook → lint → typecheck → build → build:storybook)
전체 통과. unit 259건, storybook 18건.

## 13. server prefetch를 고른 대가

브라우저가 조회를 다시 하지 않게 만든 값은 공짜가 아니다. 얻은 것과 낸 것을 함께 적는다.

| | 얻은 것 | 낸 것 |
| --- | --- | --- |
| 홈 | 브라우저 `/api/` 요청 **0회** | document 9,107 → **32,947 B** |
| 목록 | 브라우저 `/api/` 요청 **0회** | document **30,995 B** |

서버가 받은 조회 결과가 직렬화되어 문서에 실린다. 문서가 커지는 대신 브라우저는 화면을
그리자마자 결과를 갖고 있다. 요청 하나를 왕복시키지 않는 값이 문서 24 KB보다 크다고 봤다.
느린 네트워크일수록 왕복 한 번의 비용이 바이트 몇 KB보다 크기 때문이다.

같은 선택이 만든 비용이 두 개 더 있다.

| 비용 | 값 |
| --- | --- |
| 크롤러가 metadata 조회를 기다린다 | `scenario=slow`에서 TTFB 1,506 ms |
| Header `<Link href="/">`의 route prefetch가 별도 RSC 요청과 서버 렌더를 만든다 | document가 하나 더 생기는 것은 아니다. 실측에서 `{rsc:false, type:"document"}`와 `{rsc:true, type:"fetch"}`로 구분된다 |

둘 다 기능 오류는 아니지만 서버 작업이 늘어나는 것은 사실이라 숨기지 않는다.

### 이 대가를 누가 치르는가

여기까지의 대가는 전부 "지표가 얼마 움직였나"로만 적혀 있다. 그 비용을 실제로 내는 사람이
누구인지 한자리에 모은다. **세 항목 모두 빠른 회선에서는 거의 보이지 않고, 느린 셀룰러에서만
청구된다.** 즉 이 문서의 개선 폭이 가장 큰 사용자와, 남은 비용을 내는 사용자가 같다.

| 선택 | 낸 것 | 왜 그래도 택했나 |
| --- | --- | --- |
| Hero `sizes`를 실제 렌더 폭으로 정정 | 전송 32,425 → 162,058 B, LCP +253 ms | 좁게 신고한 값은 화질 계약을 깨서 얻은 것이다. 정정 후에도 원본 대비 46배 작다 |
| server prefetch + hydration | document 9,107 → 32,947 B (홈), 30,995 B (목록) | 왕복 1회를 아끼는 값이 24 KB보다 크다고 봤다. **회선 조건에 의존하는 판단이라 뒤집힐 수 있다** |
| art direction 미적용 | 받은 폭의 **45%가 화면 밖에서 버려진다** | 세로 crop 에셋이 새로 생기는 더 큰 변경이라 이번 범위 밖에 뒀다 |

**세 번째가 첫 번째의 대가를 만든다.** 모바일 4:5 크롭 에셋을 직접 내려보내면 확대도 없고
버려지는 45%도 없다. 지금은 정확한 `sizes`로 확대를 막는 대신, 잘려나갈 픽셀까지 함께 받고
있다. **남은 낭비 중 가장 크고, 다음 범위의 1순위로 둔다.**

셋 다 측정으로 회피 가능하다고 확인된 것이 아니다. **"알고 낸 비용"이지 "못 찾은 병목"이
아니다.** 다만 세 번째는 알고 낸 비용에서 못 낸 작업으로 성격이 바뀌었다.

## 14. 증거 원본과 재현 절차

**원본 Lighthouse 리포트를 회차별로 보관했다.** 44개 회차를 `gzip -n`으로 개별 압축해
5.7 MB로 커밋했고, `SHA256SUMS`와 `manifest.json`으로 무결성과 회차 대응을 확인할 수 있다.
보고한 수치를 원본에서 직접 감사할 수 있다.

| | 위치 |
| --- | --- |
| 원본 리포트 | [`docs/measurements/week-07/raw/`](measurements/week-07/raw) |
| 추출 산출물 | [`docs/measurements/week-07/`](measurements/week-07) |
| 측정 스크립트와 대응표 | [`scripts/measure/README.md`](../scripts/measure/README.md) |

각 추출 JSON에는 그 값을 잰 코드의 `measuredSha`와 봉투에 담은 시점의 `extractorSha`가 따로
들어 있다. `manifest.json`은 추출 산출물과 원본 회차를 파일명과 해시로 잇는다.

`render-scope.mjs`의 산출물만 없다. profiling build와 임시 계측이 있어야 도는데, 그 계측을
커밋된 트리에 남길 수 없기 때문이다.

| 증거 | 재현 |
| --- | --- |
| Lighthouse 5회 | 원본이 `raw/`에 있다. 다시 만들려면 `npx lighthouse@12.8.2 <URL> --only-categories=performance --output=json --chrome-flags="--headless=new --user-data-dir=<새 프로필>"` |
| Hero 전송량과 요청 시작 | 위 JSON의 `audits["network-requests"].details.items`에서 `_next/image` 항목 |
| Route Handler 실호출 | Route Handler에 임시 카운터와 로그를 넣고 document 1건 요청, 서버 로그 계수 후 계측 제거 |
| 취소된 요청 | Playwright에서 `requestfailed` 이벤트로 `net::ERR_ABORTED` 수집 |
| Hero 화질 | 같은 페이지에서 최적화본과 원본을 같은 크기 canvas에 그려 채널별 절대차 계산 |
| 상호작용 3구간 | `PerformanceObserver({type:'event', buffered:true, durationThreshold:16})`, `interactionId`로 묶어 최장 duration |
| 렌더 범위 | `next build --profile` 후 카드마다 `<Profiler>`, 측정 뒤 제거 |
| document 증거 | `curl -s <URL>`로 `<head>` 확인 |

측정 조건은 문서 상단의 표와 각 절에 적어 두었다. filmstrip과 trace는 별도로 보관하지 않았고,
위 명령으로 같은 조건에서 다시 만들 수 있다.

## 15. 적용하지 않은 제안과 이유

| 제안 | 판단 |
| --- | --- |
| 홈 `<section>`에 `aria-labelledby` 추가 | 유효한 개선 후보지만 측정으로 확인된 결함이 아니다. 각 영역에 보이는 `h2`가 있어 이미 발견된다 |
| 목록 화면에 카테고리 링크 추가 | 화면에 없는 탐색 UI를 새로 만드는 일이다. 홈의 링크로 크롤링 도달성은 이미 충족한다 |
| `pageSize` 파라미터를 실제로 읽게 하기 | 24보다 작은 값을 넣을 길이 생긴다. 카드를 줄이지 못하게 막는 것이 요구의 취지다 |
| 측정 전 `memo` 부착 | 원인을 모른 채 증상만 덮는다. selector를 좁힌 뒤 렌더가 1개로 떨어져 불필요해졌다 |
| 홈 FCP 회귀를 되돌리기 | 되돌릴 회귀가 아니었다. 시뮬레이션의 899 ms가 적용형 감속에서 78 ms로 줄어 원인 후보가 전부 반증됐다 (4절) |
| 목록 셸에도 `connection()` 적용 | 목록은 `searchParams`를 읽는 것 자체가 동적 API라 이미 요청 시점 렌더링이다. 홈에는 그런 입력이 없어서 필요했다 |
| 화면 카테고리 이름을 서버 응답으로 통일 | 성능 범위가 아니다. 화면 계약 변경이라 별도 논리적 변경으로 둔다 |
| 모바일용 세로 crop 에셋 추가 (art direction) | 1920px 가로 이미지의 45%만 보이는 낭비를 없앨 수 있다. 새 에셋이 생기는 더 큰 변경이라 후속으로 남긴다 |
| native fetch memoization으로 정정 | timeout signal을 버려야 한다. 중복 제거 효과는 같고 가용성만 잃는다 (7절) |

## 16. 닫지 못한 항목

증거를 못 채운 것과 판단이 열려 있는 것을 남긴다.

| 항목 | 상태 |
| --- | --- |
| 배포 환경의 절대 Open Graph URL | **닫지 못했다.** 로컬 `127.0.0.1` origin으로만 확인했다. 배포해야 확인할 수 있다 |
| 요구 문서 사이의 충돌 | **판단이 열려 있다.** 아래 참조 |
| filmstrip과 trace 원본 | 보관하지 않았다. 14절에 재현 절차를 남겼다 |

### 어느 문서가 최종 계약인가

과제 본문과 발제 자료가 서로 다른 것을 요구한다.

| 항목 | 과제 본문 | 발제 자료 |
| --- | --- | --- |
| metadata | 응답과 URL 조건으로 만드는 동적 metadata | Basic은 정적 metadata까지 |
| 서버 데이터 접근 | `APP_ORIGIN`으로 자기 API 조회 | RSC가 자기 Route Handler를 HTTP로 호출하지 않는다 |

**현재 구현은 과제 본문을 따랐다.** 발제 자료의 self-HTTP 금지에는 어긋난다. 표현 차이가
아니라 서버 조회 토폴로지가 달라지는 문제라 코드로 임의 해소하지 않고 확인을 요청한 상태다.

> 최종 평가 기준은 `APP_ORIGIN` 내부 HTTP 호출로 동적 metadata를 만드는 과제 본문인가요,
> 아니면 RSC의 self-HTTP 호출을 금지하는 발제 자료인가요? 후자라면 서버 데이터 계층을
> 공유 함수 직접 호출로 바꿔야 합니다.

## 17. 이 측정의 한계

- 로컬 단일 머신, Lighthouse Lantern 시뮬레이션이다. 절대값은 실제 사용자 환경의 값이 아니다.
- Advanced A의 상호작용 값은 로컬 재현이지 현장 INP가 아니다. 실제 INP는 여러 상호작용의
  분포에서 나온다.
- **Lighthouse 기본 감속은 관측이 아니라 Lantern의 추정이다.** 홈 FCP의 899 ms 차이는 적용형
  감속에서 78 ms였다. 판별 변수는 첫 버스트에 실린 폰트 바이트(64,312 → 183,324 B)였고,
  라틴 대조군이 document를 고정한 채 이 변수만 되돌려 확인했다. 실제 브라우저는
  `font-display: swap` 덕에 이 서브셋을 기다리지 않고 셸을 그린다.
- Lantern 내부에서 그 바이트가 어느 경로로 FCP 추정에 반영되는지는 특정하지 않았다. 판별
  변수까지만 확인했고 시뮬레이터의 계산 경로는 열어 뒀다.
- 적용형 감속 역시 Lab 측정이다. 어느 쪽도 실제 사용자의 지연은 아니다.
- profiling build의 `actualDuration`은 일반 build의 상호작용 시간과 직접 비교하지 않는다.
  렌더 범위와 원인 확인에만 썼다.
- CLS는 Lighthouse 로드 구간의 값이다. 로드 이후의 상호작용 CLS는 별도로
  `PerformanceObserver`의 `layout-shift` 엔트리로 확인했다.
