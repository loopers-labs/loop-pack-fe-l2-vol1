# After ① — hero 이미지를 next/image로 (1단계)

> 측정일: 2026-08-07 · 도구: Lighthouse 12.8.2 (CLI, mobile 시뮬레이션 스로틀)
> Before SHA `ccd46b2f` → After SHA `c4eeeda`

## 검증한 가설

> LCP 40.9 s의 대부분은 7.5 MB 원본 전송이다. 표시 크기에 맞는 이미지로 바꾸면
> 전송량이 급감해 LCP가 크게 준다. — [before-home-cold-load.md](before-home-cold-load.md) 가설 1

## 바꾼 것 — 하나뿐

`HeroSection`의 `<img width=3840 height=2160>` → `next/image`의 `<Image fill sizes="100vw">`.
부모 `.hero`가 이미 `position: relative` + `aspect-ratio`로 공간을 잡고 있어 시각적
크기·비율·`object-fit: cover`(모바일 `object-position` 포함)가 그대로 보존된다.

`priority`·`preload`는 **넣지 않았다.** 두 번째 변인이 되어 어느 변경이 효과를 냈는지
알 수 없게 된다.

## 측정 조건

Before와 동일. URL·viewport·스로틀·브라우저·실행 횟수 모두 같고 SHA만 다르다.
자세한 조건과 재현 명령은 [before-home-cold-load.md](before-home-cold-load.md) 참조.

## 결과 — 5회 raw + 중앙값 + 범위

| 지표     | run1 | run2 | run3 | run4 | run5 | **중앙값** | 범위        |
| -------- | ---- | ---- | ---- | ---- | ---- | ---------- | ----------- |
| FCP (ms) | 915  | 906  | 908  | 906  | 907  | **907**    | 906~915     |
| LCP (ms) | 4246 | 4219 | 3991 | 4219 | 4221 | **4219**   | 3991~4246   |
| CLS      | 0.016| 0.016| 0.016| 0.016| 0.016| **0.016**  | 0.016       |
| TBT (ms) | 27   | 30   | 29   | 29   | 18   | **29**     | 18~30       |
| SI (ms)  | 2077 | 1949 | 1971 | 1947 | 1948 | **1949**   | 1947~2077   |

원본 JSON 5개: `evidence/lh-after1-nextimage/run1~5.json`

## Before / After

| 지표        | Before 중앙값 | After 중앙값 | 변화                        |
| ----------- | ------------- | ------------ | --------------------------- |
| FCP         | 919 ms        | 907 ms       | −12 ms (**범위 내, 불변**)  |
| **LCP**     | **40,900 ms** | **4,219 ms** | **−36,681 ms (−90 %)**      |
| CLS         | 0.016         | 0.016        | 불변                        |
| TBT         | 29 ms         | 29 ms        | 불변                        |
| Speed Index | 2,825 ms      | 1,949 ms     | −876 ms                     |
| Perf score  | 71            | 86           | +15                         |

변화(−36.7 s)가 5회 범위(Before 0.1 s / After 0.26 s)보다 **네 자릿수 배로 크다.**
측정 흔들림으로 설명할 수 없다.

## Hero 이미지 요청

| 항목      | Before                              | After                                            |
| --------- | ----------------------------------- | ------------------------------------------------ |
| URL       | `/images/week-07/hero-original.jpg` | `/_next/image?url=…hero-original.jpg&w=750&q=75` |
| 포맷·크기 | JPEG 3840×2160                      | **WebP w=750**                                   |
| 전송      | **7,545,525 B**                     | **32,424 B** (−99.6 %)                           |
| 요청 시작 | 1,617 ms                            | 1,686 ms (**사실상 불변**)                       |
| 우선순위  | High                                | High                                             |

## LCP 구간 분해

| 구간         | Before        | After       |
| ------------ | ------------- | ----------- |
| TTFB         | 455 ms (1 %)  | 458 ms (11 %) |
| Load Delay   | 36,245 ms (88 %) | **3,388 ms (80 %)** |
| Load Time    | 2,013 ms (5 %) | 377 ms (9 %) |
| Render Delay | 2,267 ms (6 %) | 24 ms (1 %) |

## 판단

**가설 1 채택.** 전송량을 233배 줄이자 LCP가 90 % 줄었다. 시각적 크기·비율·품질은
유지했고(같은 피사체, `cover`, 같은 `aspect-ratio`), CLS도 그대로다.

### Before의 LCP 구간표는 원인을 잘못 가리켰다

Before에서 Lighthouse는 전송(Load Time)에 5 %, 발견 지연(Load Delay)에 88 %를
할당했다. 그 표를 액면대로 믿었다면 이미지를 건드리지 않고 발견 시점부터 손댔을
것이다. 실제로는 전송을 줄이자 **Load Delay 자체가 36,245 → 3,388 ms로 함께**
무너졌다. 시뮬레이션 스로틀에서는 거대한 전송이 뒤 구간 추정까지 밀어내며, 구간
귀속이 원인 분석의 근거가 되지 못한다.

> 교훈: 구간표는 가설을 세우는 데 쓰고, 확정은 **변경 후 재측정**으로 한다.

## 남은 병목 — 다음 가설로

LCP 4,219 ms 중 **Load Delay가 3,388 ms(80 %)로 여전히 지배적**이다. 원인은 관측에
그대로 남아 있다.

- `/api/home?scenario=slow`가 108 → 1,635 ms에 끝나고, hero 요청이 **1,686 ms에 시작**한다.
- 홈이 100 % client component라 데이터가 오기 전에는 `HeroSection`이 렌더되지 않고,
  이미지 URL이 **초기 HTML에 존재하지 않는다.**
- After의 LCP 요소에는 `loading="lazy"`가 붙어 있다(`next/image` 기본값).

이미지 URL은 배너 데이터에 있는 게 아니라 컴포넌트에 하드코딩돼 있는데도, **셸이
client 뒤에 있다는 이유만으로 1.6초 늦게 발견된다.** 다음 변경은 홈 셸을 RSC로
올려 이미지를 초기 HTML에 노출하는 것이다.

`priority`는 그다음이다 — 발제가 짚었듯 **셸이 이미지 URL을 이미 아는 경우에만**
preload 힌트가 발견을 앞당긴다. 지금 붙이면 힌트도 같이 늦게 도착한다.
