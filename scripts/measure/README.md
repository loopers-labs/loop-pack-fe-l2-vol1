# 7주차 성능 측정 스크립트

문서에 적은 수치를 다시 만들기 위한 스크립트다. 원본 Lighthouse와 Performance trace는
용량 때문에 커밋하지 않았다. 대신 이 스크립트와 회차별 핵심 추출 JSON을 남겨,
보고한 수치를 기계적으로 확인하고 같은 조건으로 재생산할 수 있게 했다.

**추출 JSON만으로 원본 trace의 진위를 감사할 수는 없다.** 값이 맞는지 확인하고 같은
절차를 다시 밟는 데까지가 이 산출물의 범위다.

판단과 해석은 [`docs/week-07-performance.md`](../../docs/week-07-performance.md)에 있다.

## 실행 전에

production 서버가 떠 있어야 한다. 측정 대상 주소는 `MEASURE_BASE_URL`로 준다.

```bash
APP_ORIGIN=http://127.0.0.1:3210 pnpm build
APP_ORIGIN=http://127.0.0.1:3210 pnpm start -- -p 3210

export MEASURE_BASE_URL=http://127.0.0.1:3210
```

## 스크립트와 산출물

| 스크립트 | 산출물 | 무엇을 재는가 |
| --- | --- | --- |
| `lighthouse.mjs` | `lighthouse-{home,products}-{before,after}.json` | FCP, LCP, CLS, TBT 5회와 Hero 요청 기록 |
| `hero.mjs` | `hero-geometry.json`, `hero-geometry-before-sizes-fix.json` | cover가 그리는 폭, 선택된 후보, 배율, 원본 대비 픽셀 차이 |
| `interaction.mjs` | `interaction-{before,after}.json` | 찜 클릭의 input delay, processing, presentation |
| `cancellation.mjs` | `cancellation.json` | 낡은 요청의 취소와 최종 URL 정합성 |
| `hydration.mjs` | `hydration-cost.json` | 브라우저 조회 횟수와 document 크기의 교환 |
| `render-scope.mjs` | **산출물 없음** | 클릭 한 번이 다시 그린 카드 범위 |

산출물은 전부 `docs/measurements/week-07/`에 있다.

`render-scope.mjs`만 산출물을 커밋하지 않았다. profiling build와 임시 계측이 있어야 도는데,
그 계측을 커밋된 트리에 남길 수 없기 때문이다. 측정한 값(카드 24개에서 1개, 합계
`actualDuration` 66ms에서 4ms)은 문서에만 있다.

## 산출물의 SHA 두 가지

`measuredSha`는 그 값을 잰 코드의 커밋이고, `extractorSha`는 값을 봉투에 담은 시점의 HEAD다.
지난 측정을 담을 때 둘이 달라진다. `MEASURE_SHA`로 측정 대상 커밋을 반드시 넘겨야 한다.

| 산출물 | measuredSha | 무엇의 값인가 |
| --- | --- | --- |
| `lighthouse-*-before.json` | `3aa1981` | 병합 시작점 |
| `lighthouse-home-after.json` | `0785d2c` | Hero `sizes`를 고친 뒤 |
| `lighthouse-products-after.json` | `36e31e0` | 목록은 이후 커밋이 건드리지 않는다 |
| `interaction-before.json` | `36e31e0` | selector를 좁히기 전 |
| `interaction-after.json` | `3dc3726` | selector를 좁힌 뒤 |
| `hero-geometry-before-sizes-fix.json` | `fff007f` | `sizes`만 `36e31e0` 상태로 임시 복원한 재현 측정. 실제로 그 커밋을 빌드한 것이 아니라 `conditions.variant`에 밝혀 두었다 |

`harness.mjs`는 브라우저 기동, 뷰포트, CPU 감속, 결과 봉투를 공유한다. 직접 실행하지 않는다.

## 사용법

```bash
export MEASURE_SHA=$(git rev-parse --short HEAD)

# Lighthouse 5회를 새로 돌린다
MEASURE_PATH=/ MEASURE_LABEL=home node scripts/measure/lighthouse.mjs

# 이미 받아 둔 원본 리포트에서 추출만 한다. 그때의 커밋을 MEASURE_SHA로 넘긴다
MEASURE_SHA=3aa1981 MEASURE_LH_RAW_DIR=<원본 디렉터리> MEASURE_LABEL=home-before \
  node scripts/measure/lighthouse.mjs

# 제출 당시 잰 상호작용 원값을 그대로 담는다
MEASURE_SHA=3dc3726 MEASURE_RUNS_FILE=<원값 JSON> MEASURE_LABEL=interaction-after \
  node scripts/measure/interaction.mjs

node scripts/measure/hero.mjs
node scripts/measure/cancellation.mjs
node scripts/measure/hydration.mjs
```

환경 변수로 조절한다. `MEASURE_SHA`(필수), `MEASURE_RUNS`(기본 5), `MEASURE_STEPS`(기본 3),
`MEASURE_LH_VERSION`(기본 12.8.2).

## `render-scope.mjs`만 다르다

이 스크립트는 profiling build와 임시 계측이 함께 있어야 동작한다. **계측은 측정 뒤 반드시
되돌린다.** 커밋된 트리에 `<Profiler>`나 `window.__renders`가 남으면 안 된다.

1. `src/app/performance-lab/inp/page.tsx`에서 카드마다 `<Profiler>`로 감싸고
   `onRender`의 `id`, `phase`, `actualDuration`, `commitTime`을 `window.__renders`에 모은다.
2. `pnpm next build --profile` 후 서버를 띄운다.
3. `node scripts/measure/render-scope.mjs`
4. 계측을 되돌리고 일반 build로 재빌드한다.

## 스크립트로 남기지 않은 것

- **Route Handler 실호출 계수** — Route Handler에 임시 카운터와 로그를 넣고 document를
  한 번 요청해 서버 로그를 센다. production 코드를 건드려야 해서 스크립트로 두지 않았다.
- **document 증거** — `curl -s <URL>`로 `<head>`를 확인한다.
- **UA별 응답 시점** — `curl -w 'start=%{time_starttransfer} total=%{time_total}'`을
  일반 UA와 `facebookexternalhit`으로 각각 보낸다.
- **기능 회귀** — URL 복원, 뒤로 가기, store 공유, 빈 상태, 재시도는 화면에서 확인했다.
