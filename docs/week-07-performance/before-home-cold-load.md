# Before — 홈 cold load (7주차 성능 0단계)

> 측정일: 2026-08-06 · 도구: Lighthouse 12.8.2 (CLI, mobile 시뮬레이션 스로틀)
> Before 상태 커밋: `ccd46b2f`

목록 갱신 관측은 [before-product-list.md](before-product-list.md)에 따로 있다.

> **정정 노트 (2026-08-07)** — 최초 작성 시 재현조건 커밋을 `b739ac6c`로 적었으나
> 이 객체는 브랜치에 존재하지 않는다(작성 중 reset으로 유실). 실제로 측정된 상태는
> 재현조건과 측정이 한 커밋에 뭉친 `ccd46b2f`다. 리뷰어가 재현할 수 있는 SHA로 고친다.

## 측정 조건 (Before/After 공통으로 고정)

| 항목      | 값                                                                                       |
| --------- | ---------------------------------------------------------------------------------------- |
| 빌드      | production (`pnpm build && pnpm start`), **dev 아님**                                     |
| URL       | `http://localhost:3000/`                                                                 |
| 도구      | Lighthouse 12.8.2 CLI, `--form-factor=mobile --screenEmulation.mobile=true`               |
| 스로틀    | 시뮬레이션 기본값 — RTT 150 ms, 하향 1474.56 Kbps, CPU 4x                                 |
| 브라우저  | HeadlessChrome 150.0.0.0 (Win64)                                                         |
| 실행      | 5회, cold load                                                                           |
| SHA       | `ccd46b2f` (홈→`?scenario=slow`, 7.5 MB `<img>` hero)                                    |

재현:

```bash
pnpm build && pnpm start
for n in 1 2 3 4 5; do
  npx --yes lighthouse@12 http://localhost:3000/ --only-categories=performance \
    --form-factor=mobile --screenEmulation.mobile=true \
    --output=json --output-path=./lh_before$n.json \
    --chrome-flags="--headless=new --no-sandbox" --quiet
done
```

## 재현조건 (제출물 아님, Before의 전제)

- `fetchHome()` → `/api/home?scenario=slow` (1.5초 지연)
- `HeroSection`이 `public/images/week-07/hero-original.jpg`(3840×2160, **7.5 MB**)를
  최적화 없이 `<img width=3840 height=2160>`로 렌더

## 결과 — 5회 raw + 중앙값 + 범위

| 지표     | run1 | run2 | run3 | run4 | run5 | **중앙값** | 범위(min~max)             |
| -------- | ---- | ---- | ---- | ---- | ---- | ---------- | ------------------------- |
| FCP (ms) | 949  | 921  | 912  | 919  | 915  | **919**    | 912~949                   |
| LCP (s)  | 40.9 | 41.0 | 41.0 | 40.9 | 40.9 | **40.9**   | 40.9~41.0                 |
| CLS      | 0.016| 0.016| 0.016| 0.016| 0.016| **0.016**  | 0.016                     |
| TBT (ms) | 167  | 29   | 28   | 32   | 27   | **29**     | 27~167 (run1 워밍업 outlier) |

- **LCP element**: `<img class="HeroSection-module__…__image" src="/images/week-07/hero-original.jpg">`
- **Perf score**: 71 · Speed Index 2.8 s · 루트 document 서버 응답 **4.2 ms**

## LCP 구간 분해

| 구간             | 시간        | 비중    |
| ---------------- | ----------- | ------- |
| TTFB             | 455 ms      | 1 %     |
| **Load Delay**   | **36,245 ms** | **88 %** |
| Load Time (전송) | 2,013 ms    | 5 %     |
| Render Delay     | 2,267 ms    | 6 %     |

## Network waterfall (관측값, 시작 시각 순)

| 시작    | 종료    | 전송        | 리소스                                             |
| ------- | ------- | ----------- | -------------------------------------------------- |
| 1 ms    | 7 ms    | 2.9 KB      | `/` document                                       |
| 14~32 ms | ~39 ms | 약 210 KB   | JS 청크 14개 · 폰트 2 · CSS 2                      |
| **88 ms** | **1609 ms** | 4.2 KB | **`/api/home?scenario=slow`** (1.5초 지연)         |
| **1617 ms** | 1706 ms | **7,545,525 B** | **`/images/week-07/hero-original.jpg`** (LCP element) |
| 1655 ms~ | ~1688 ms | 3~72 KB   | 상품 이미지 12개 (`/_next/image`, 이미 최적화됨)   |

**hero 이미지 요청이 홈 API 완료 8 ms 뒤에 시작된다.** 이미지 URL은 배너 데이터
안에 있는 게 아니라 컴포넌트에 하드코딩돼 있는데도, 홈 전체가 client component라
데이터가 오기 전에는 `HeroSection` 자체가 렌더되지 않아 `<img>`가 DOM에 없다.

## Filmstrip

375 ms 간격 8프레임 (375 · 750 · 1125 · 1500 · 1875 · 2250 · 2625 · 3000 ms).
FCP 919 ms 시점에 보이는 것은 **Header뿐**이다 — `h1`·설명·hero는 없다.

## 초기 HTML

`curl http://localhost:3000/` = 8.5 KB. Header와 `불러오는 중…`만 있고
**`<h1>`·배너·hero 참조가 0건**이다. 홈이 100 % client component라 의미 있는
콘텐츠가 전부 fetch 뒤에 온다.

## 관찰 → 가설 → 반증 → 최소 변경

| # | 관찰한 사실                                                            | 원인 가설                                                            | 반증할 측정                                                                                   | 가장 작은 변경                                     |
| - | ---------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1 | FCP 919 ms인데 LCP 40.9 s — 간극 40초                                   | 7.5 MB 원본 전송이 LCP의 대부분을 차지한다                           | 표시 크기에 맞는 이미지로 바꿔도 LCP가 거의 그대로면 전송은 지배 요인이 아니다                | `<img>` → `next/image`                             |
| 2 | LCP 구간표는 전송(Load Time)에 5 %, **발견 지연(Load Delay)에 88 %**를 준다 | 이미지가 client 게이트 뒤에서야 DOM에 들어가 요청 시작이 늦다        | 위 변경 후에도 hero 요청 시작이 여전히 API 완료 직후라면 발견 지연이 남은 것이다              | 홈 셸을 RSC로 올려 이미지를 초기 HTML에 노출        |
| 3 | 초기 HTML에 `h1`·설명·hero가 없다                                       | 홈 전체가 `'use client'` + `useQuery`라 셸까지 데이터를 기다린다      | 셸을 서버로 올린 뒤 `curl` 응답에 `h1`이 나타나는지 확인                                       | (2와 같은 변경)                                    |
| 4 | CLS 0.016으로 안정                                                      | `<img>`에 `width`/`height`가 박혀 공간이 예약돼 있다                 | 이미지 교체 후 CLS가 올라가면 예약이 깨진 것이다                                              | **변경하지 않음** — 회귀만 감시                     |

### 가설 1과 2는 서로 충돌한다 — 그래서 1단계가 결정적 실험이 된다

산수로는 전송이 지배한다: 7,545,525 B ÷ 1474.56 Kbps ≈ **40.9초**로 총 LCP와 거의
같다. 반면 Lighthouse의 구간 귀속은 전송에 5 %만 준다. **둘 중 하나는 부정확하다.**

1단계에서 `next/image` 하나만 바꾸면 어느 쪽인지 갈린다.

| After 결과            | 결론                                             |
| --------------------- | ------------------------------------------------ |
| LCP가 크게 떨어진다   | 전송이 지배 — 가설 1 채택, 구간표의 귀속이 부정확 |
| LCP가 거의 그대로다   | 발견 지연이 지배 — 가설 1 기각, 가설 2로 이동     |

어느 쪽이 나오든 기록한다. 기각도 결과다.

## 측정 신뢰 범위 (Lab vs Field)

- 5회 편차 0.1 s가 낮은 건 **시뮬레이션 스로틀이 결정적**이기 때문이다 —
  "실사용자 신뢰"가 아니라 **랩 재현성**의 증거다.
- 신뢰 가능: 같은 조건의 Before/After 델타. 신뢰 불가: 실사용자가 정확히 40.9 s를
  겪는다는 주장 (그건 Field/CrUX 영역).

## 증거 파일

- HTML 리포트: `lh-before-home.html` (1회분, fetchTime `2026-08-06T08:11:20Z`)
  — 위 waterfall·filmstrip·LCP 구간은 이 리포트에 포함된 원본 JSON에서 추출했다.
- ⚠️ **5회 JSON 원본은 유실됐다.** 최초 측정 시 `/tmp`에 두었고 이후 정리됐다.
  표의 5회 raw 값은 남았지만 원본으로 역추적할 수 없다. After 측정부터는 JSON을
  `evidence/`에 보존한다.
