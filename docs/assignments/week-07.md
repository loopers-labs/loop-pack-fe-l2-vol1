# 7주차 — 프론트엔드 성능 최적화: 같은 사용자 경로에서 병목만 줄여요

> **Phase**: 엔지니어링 레벨업

> 💡 이번 주에는 빠른 숫자를 만들려고 느린 API를 없애지 않아요. 같은 URL과 행동을 production 환경에서 반복해 측정하고, 사용자가 기다린 이유를 확인한 뒤 가장 작은 변경만 선택해요.

## 제공되는 것과 실행 환경

- `.nvmrc`와 `package.json#packageManager`에 지정된 Node.js·pnpm 환경을 사용해요.
- production build와 runtime은 아래 명령으로 실행해요. 개발 서버 측정으로 Before와 After를 비교하지 않아요.

  ```bash
  pnpm build
  pnpm start
  ```

- 개발 중 테스트와 제출 전 전체 검증은 각각 아래 명령으로 확인해요.

  ```bash
  pnpm test
  pnpm check
  ```

- 측정은 확장 프로그램·기존 캐시·로그인이 섞이지 않는 별도 브라우저 프로필에서 해요.
- Hero 컴포넌트는 `src/examples/week-07-performance/HeroSection.tsx`, Before 원본 이미지는 `public/images/week-07/hero-original.jpg`에 있어요. 원본은 `3840×2160`, 약 `7.5MB`예요.
- slow API는 `/api/home?scenario=slow`, `/api/products?scenario=slow`이고 정상 데이터와 같은 응답을 `1.5초` 뒤에 반환해요. Advanced A 화면은 `/performance-lab/inp?pageSize=24`이고, `24개` 카드로 측정해요.
- `APP_ORIGIN`은 build와 runtime에 같은 값을 넣고, 서버가 접근할 수 있는 origin으로 맞춰요. 로컬 origin으로 응답 시점과 HTML을 측정할 수 있지만, localhost Open Graph URL은 배포 증거로 쓰지 않아요.

## DevTools에서 볼 것

| 도구        | 확인할 것                                           |
| ----------- | --------------------------------------------------- |
| Lighthouse  | LCP element                                         |
| Performance | filmstrip의 표시 순서, Layout Shifts                |
| Network     | document·API·image의 URL, 전송 크기, 요청 시작 시점 |

## 이번 주 범위

- **반복 측정과 Before 기록** — 한 번의 최고 점수 대신 같은 조건의 raw 값 5회, 중앙값, 범위를 남겨요.
- **Hero LCP** — 이미지 요청과 렌더링에서 실제로 긴 구간을 찾아 줄여요.
- **목록의 기다림과 CLS** — 최초 진입, 기존 목록 갱신, fallback 교체를 서로 다른 화면으로 다뤄요.
- **동적 metadata와 Open Graph** — 초기 HTML의 의미를 유지하면서 metadata가 기다리는 비용도 함께 판단해요.
- **After와 회귀 확인** — Before와 같은 경로에서 결과를 비교하고 기존 커머스 기능을 다시 확인해요.

## 🤖 AI 활용: 성능 분석 리뷰

AI에게 Lighthouse raw 값, Performance 녹화에서 본 순서, Network waterfall, 최종 URL처럼 **직접 확인한 근거**를 먼저 주세요. 그 근거를 바탕으로 병목 가설과 다음으로 할 가장 작은 변경의 우선순위를 함께 검토해요.

AI의 답을 구현 정답으로 쓰지는 않아요. 제안한 원인이 filmstrip, Layout shifts track, 실제 요청 URL·전송 크기, 서버 측 호출 계수와 맞는지 직접 반증해 보세요. AI가 제안한 성능 최적화가 현재 병목과 무관하다고 말해도, 그 판단을 기록한 측정과 다시 대조해야 해요.

## 📝 Implementation Quest

### 🧭 0단계 — 측정 조건을 고정하고 Before를 남겨요

성능 작업은 코드를 바꾸기 전에 같은 화면을 다시 재현할 수 있어야 해요. 제공된 `HeroSection`을 누적 홈에 필요한 만큼 연결하고, 고용량 원본 이미지는 아직 최적화하지 않아요.

**요구사항**

- Before와 After 모두 production build로 실행해요.
- 홈 cold load에서 같은 viewport와 CPU·network throttling으로 Lighthouse를 5회 실행해요.
- FCP, LCP, CLS의 5회 raw 값과 중앙값, 최솟값, 최댓값을 남겨요. Lighthouse 점수나 향상률에는 합격선을 두지 않아요.
- LCP element, Performance filmstrip의 Header·페이지 제목·Hero 표시 순서, Network waterfall의 document·홈 데이터·Hero 이미지 요청 시작 순서와 전송 크기를 확인해요.
- `/api/products?scenario=slow`에서 데이터가 없는 최초 진입과 기존 목록이 있는 갱신을 각각 녹화해요. 검색·카테고리·정렬·페이지를 빠르게 바꾼 뒤 현재 URL의 active query와 화면 결과가 맞는지, 이전 요청이 늦게 끝나도 현재 화면을 덮지 않는지 확인해요. 취소된 요청은 별도로 관찰해요.
- 관찰한 사실, 원인 가설, 가설을 반증할 방법, 먼저 시도할 가장 작은 변경을 각각 한 문장으로 적어요.

> 💡 Before와 After의 commit SHA를 각각 기록하세요. SHA를 제외한 URL과 query string, 행동, viewport, CPU·network throttling, 브라우저·Lighthouse 버전, cold load 또는 warm navigation, 브라우저 프로필은 Before와 After에서 같게 두세요.

> 💡 7주차 starter는 자동으로 정답 구조를 덮어쓰지 않아요. 기존 FSD, Route Handler, 장바구니, 위시리스트는 유지하고 slow scenario·Hero·Advanced A 측정 화면만 필요한 위치에 통합하세요. 충돌을 해결하려고 누적 구현을 지워야 한다면 멘토에게 먼저 알려요.

**완료조건**

Before와 After의 SHA, 5회 raw 값·중앙값·범위, 가장 느린 구간과 반증 가능한 가설을 제출물에서 확인할 수 있어야 해요.

### 🖼️ 1단계 — Hero의 실제 LCP 병목을 줄여요

LCP가 느리다는 결과만으로 이미지를 바꾸지 않아요. 기다린 시간을 구간으로 나누고 가장 긴 구간에만 개입해요.

**요구사항**

- LCP를 서버 응답 대기, 이미지 요청 시작 대기, 이미지 전송, 화면에 그려질 때까지의 시간으로 나눠 관찰해요.
- 실제 표시 크기와 viewport에 맞는 이미지 후보·포맷·압축률을 선택하고, 불필요하게 큰 이미지가 내려가지 않게 해요.
- Hero 이미지가 언제 발견되어 요청되는지, 이 페이지에서 요청 우선순위를 높일 이유가 있는지 확인해요.
- Hero의 시각적 크기, 비율, 주요 피사체와 문구를 유지해요. 이미지를 작게 보이게 하거나 품질을 낮춰 수치만 줄이면 안 돼요.
- 홈 데이터를 기다리는 동안 Header, 하나의 `h1`, 페이지 설명까지 함께 막히지 않도록 현재 데이터 소유권에 맞는 렌더링 경계를 선택해요.
- Hero fallback은 실제 Hero와 같은 공간을 차지하게 하고, 교체 때 아래 콘텐츠가 밀리지 않는지 Layout shifts track으로 확인해요.

> 💡 `next/image` 사용 여부는 완료 기준이 아니에요. 실제 요청 URL, 전송 크기, waterfall, LCP가 함께 달라졌는지 확인해야 해요. 기존 Route Handler 내부와 누적 FSD 구조를 성능 과제 때문에 다시 설계하지는 않아요.

**완료조건**

LCP의 병목 구간과 선택한 변경의 인과관계를 설명하고, 이미지 전송·요청 시작·레이아웃 이동을 Before와 비교할 수 있어야 해요.

### ⏳ 2단계 — 최초 pending, 목록 갱신, CLS를 나눠 다뤄요

빈 화면을 오래 보여주는 방식으로 기다림을 감추지 않아요. 사용자가 처음 보는 화면과 이미 보던 목록이 갱신되는 화면은 서로 다른 상태예요.

| 상태                    | 사용자에게 보여야 할 것                                             |
| ----------------------- | ------------------------------------------------------------------- |
| 데이터 없는 최초 진입   | 실제 목록 크기를 예상할 수 있는 pending UI가 보여야 해요.           |
| 이전 데이터가 있는 갱신 | 기존 목록을 비우지 않고 갱신 중임을 보여줘야 해요.                  |
| 성공 + 0건              | 현재 URL 조건과 결과가 0건임을 분명히 보여줘야 해요.                |
| 최초 실패               | 목록 대신 실패 이유와 다시 시도할 방법을 보여줘야 해요.             |
| 갱신 실패               | 기존 목록을 유지한 채 갱신 실패와 다시 시도할 방법을 보여줘야 해요. |
| 취소                    | 취소된 이전 요청이 오류로 보이거나 현재 화면을 덮지 않아야 해요.    |

**요구사항**

- slow API의 1.5초 지연은 그대로 두고, 데이터가 없는 최초 진입에는 실제 목록 크기를 예상할 수 있는 pending UI를 보여줘요.
- 기존 목록이 있을 때 검색·카테고리·정렬·페이지 조건을 바꾸면 목록을 즉시 비우지 않고 갱신 중임을 보여줘요.
- 표에 적은 사용자 관찰 기준을 먼저 만족시키고, 그다음 `isPending`과 `isFetching`이 각각 어떤 화면을 맡는지 설명해요. 최초 실패·기존 목록 갱신 실패·빈 결과·취소된 요청을 구분해요.
- 서버 응답을 바꾸는 URL 조건을 query key와 실제 GET 요청에 함께 넣어요. 현재 URL의 active query와 화면 결과가 일치하고, 이전 요청이 늦게 끝나도 현재 화면을 덮지 않아야 해요.
- 서버 응답을 Zustand나 별도 로컬 상태에 복사하지 않아요.
- fallback과 실제 콘텐츠가 바뀔 때 CLS가 생기지 않는지 녹화와 Layout shifts track으로 확인해요.

> 💡 `placeholderData`, prefetch, `AbortSignal`, server prefetch와 hydration을 전부 넣는 과제가 아니에요. Before에서 확인한 문제에 필요한 전략만 고르세요. 이미 조건을 만족하면 코드를 더 만들지 말고, 개입하지 않은 근거를 남겨도 돼요.

**완료조건**

상태 표의 여섯 화면이 녹화에서 구분되고, 조건을 연속으로 바꿔도 현재 URL의 active query와 화면이 같아야 해요. 이전 요청의 늦은 완료와 fallback 교체가 눈에 띄는 CLS를 만들지 않아야 해요.

### 🧾 3단계 — 동적 metadata와 Open Graph의 비용을 판단해요

이 단계는 Next App Router의 서버 metadata 경로를 다뤄요. 루트 metadata는 `src/app/layout.tsx`, 페이지별 동적 metadata는 `src/app/(commerce)/page.tsx`와 `src/app/(commerce)/products/page.tsx`의 `generateMetadata`에서 확인을 시작해요. JavaScript가 실행되기 전에도 페이지 제목, 설명, 이동 경로가 보여야 해요. 다만 metadata가 데이터를 기다리면 응답이 늦어질 수 있으니, 공유하는 정보의 이점과 비용을 함께 확인해요.

**초기 HTML의 의미**

- 홈과 상품 목록에 의미 있는 `title`, `description`, Open Graph를 제공하고, 초기 응답에 하나의 명확한 `h1`, 페이지 설명, 주요 링크와 구조를 남겨요.

**접근성 최소 회귀**

- 주요 콘텐츠·탐색·상품 영역의 역할이 마크업에서 드러나게 해요.
- 주요 이동은 `href` 링크로 제공하고, 의미 있는 이미지에는 내용을 설명하는 대체 텍스트를 넣어요.

**요구사항**

- 루트 layout의 title template·공통 Open Graph와 페이지 metadata가 어떻게 합성되는지 확인해요. 페이지의 `openGraph`는 shallow merge 때문에 루트 `openGraph` 전체를 덮을 수 있어요. 페이지에서 필요한 공통 필드를 완성하거나 공통 객체를 명시적으로 재사용해 `siteName`, `locale`, `type`을 유지해요.
- 홈은 본문 prefetch와 같은 query factory가 조회한 응답의 title·description·image를 사용해요. 상품 목록은 정규화한 URL 조건과 본문 prefetch와 같은 query factory가 조회한 응답의 카테고리명·전체 개수·첫 상품 이미지를 사용해요. 검색어는 title에 먼저 반영하고, category·sort는 description에, 2페이지 이상은 페이지 번호를 title에 반영해요.
- 정상 empty는 URL 조건과 결과 0개임을 설명하는 title·description을 제공하고 Open Graph fallback image를 유지해요. metadata 조회가 실패하면 페이지별 빈 값을 만들지 말고 root 공통 metadata를 상속하게 해요.
- `robots: noindex`를 넣지 않고 기본 색인 가능 상태를 유지해요.
- metadata와 본문은 같은 URL 정규화와 query factory로 같은 GET URL·options를 만들게 해요.
- 서버에서는 `getQueryClient()`를 호출할 때마다 새 QueryClient를 만들어요. metadata와 본문이 QueryClient 캐시를 공유하게 만들려고 singleton이나 영속 캐시로 바꾸지 않아요.
- 같은 render/request에서 URL·options가 모두 같은 native fetch만 memoization 대상이에요. Browser Network만 보고 동일 slow Route Handler의 호출 횟수를 판정하지 않아요.
- document/RSC 경계와 최종 URL은 Network에서 확인하고, Route Handler의 실제 호출 횟수는 임시 서버 로그 같은 서버 측 계수로 확인한 뒤 계측을 되돌려요.
- 같은 slow URL에 일반 document 요청과 `facebookexternalhit` User-Agent 요청을 각각 보내 `time_starttransfer`, `time_total`을 비교해요. User-Agent에 따라 metadata 응답 시점이 어떻게 달라지는지 기록해요.
- document Response, View Source, JavaScript를 끈 새 요청 중 하나 이상으로 초기 HTML을 확인해요.

**재현과 관찰**

| 상황                   | 확인할 증거                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| normal                 | 설정한 `APP_ORIGIN`으로 실행한 production document 응답과 초기 HTML을 남겨요.                                                                                        |
| 정상 empty(성공 + 0건) | 실제 URL 조건, 0건을 설명하는 metadata, Open Graph fallback image를 함께 남겨요.                                                                                     |
| metadata query failure | `APP_ORIGIN`을 닿지 않는 origin으로 두고 아래처럼 build와 runtime에 같은 값을 넣어 재현해요. 페이지별 빈 metadata가 아니라 root 공통 metadata가 유지되는지 확인해요. |
| 서버 호출 계수         | 동일 slow Route Handler의 호출 횟수는 임시 서버 로그로 세고, 관찰 뒤 계측을 제거해요.                                                                                |

```bash
APP_ORIGIN=http://127.0.0.1:9 pnpm build
APP_ORIGIN=http://127.0.0.1:9 pnpm start
```

이 명령은 query failure를 관찰하기 위한 로컬 절차예요. 앱 build 자체가 실패하면 억지로 우회하지 말고, 실행 환경과 오류 로그를 남겨 멘토에게 알려요.

일반 UA와 `facebookexternalhit` 비교는 Basic 범위예요. 같은 `APP_ORIGIN` URL에 아래처럼 요청해 `time_starttransfer`와 `time_total`을 기록해요.

```bash
curl -s -o /dev/null -w 'normal start=%{time_starttransfer} total=%{time_total}\n' "$APP_ORIGIN/products"
curl -A 'facebookexternalhit/1.1' -s -o /dev/null -w 'facebook start=%{time_starttransfer} total=%{time_total}\n' "$APP_ORIGIN/products"
```

> 💡 Bundle Analyzer는 기본 제출물이 아니에요. 실제 Network와 측정에서 JS bundle이 병목이라는 가설이 생겼을 때만 선택 증거로 사용하세요. metadata와 본문이 같은 데이터를 쓰더라도 metadata를 기다리는 시간이 사용자와 crawler 응답에 어떤 비용을 주는지 함께 판단해야 해요.

**완료조건**

normal·정상 empty·metadata query failure의 document 증거, 서버 호출 계수와 제거 여부, 일반 UA와 `facebookexternalhit`의 응답 시점 비교를 제출물에서 확인할 수 있어야 해요. 정상 empty와 metadata query failure는 서로 다른 fallback을 보여야 하고, document 응답에서 metadata·초기 구조·최종 URL을 확인할 수 있어야 해요.

### 🔁 4단계 — 같은 조건에서 After와 회귀를 확인해요

개선은 한 지표만 낮아졌다고 끝나지 않아요. Before와 같은 사용자 경로에서 효과와 손실을 함께 살펴봐요.

**요구사항**

- 0단계와 같은 URL, 행동, viewport, throttling, 브라우저 버전에서 FCP·LCP·CLS를 다시 5회 측정하고 raw 값, 중앙값, 범위를 Before와 비교해요.
- Before와 After의 SHA를 각각 적고, SHA를 제외한 측정 조건이 같았는지 다시 확인해요.
- LCP element, Hero 이미지 전송 크기, 요청 시작 순서, 가장 길었던 구간이 어떻게 달라졌는지 비교해요.
- 목록의 최초 진입과 갱신 화면을 다시 녹화하고, 검색·카테고리·정렬·페이지가 URL에서 복원되는지 확인해요.
- 뒤로 가기와 앞으로 가기, 장바구니·위시리스트와 Header 개수, 로딩·에러·빈 상태·재시도를 다시 확인해요.
- FSD 의존 방향과 슬라이스 Public API를 우회하지 않았는지 확인해요.
- 효과가 없거나 악화된 변경은 되돌리거나, 유지하는 이유를 기록해요. FCP만 줄고 LCP·CLS·이미지 품질·기존 기능이 나빠졌다면 그 결과도 남겨요.

> 💡 미리 정한 점수 합격선은 없어요. 5회 raw 값의 범위보다 큰 변화인지, 그리고 그 변화가 선택한 병목과 연결되는지가 기준이에요.

**완료조건**

Before·After SHA와 같은 조건의 5회 raw 값·중앙값·범위, LCP 구간 비교, 기존 기능·이미지 품질 회귀 확인을 제출물에서 볼 수 있어야 해요.

### ⚡ Advanced A — 관계없는 카드 렌더를 줄여요

Basic을 완료한 뒤, 실제 클릭에서 관계없는 카드까지 렌더되는 병목이 확인될 때만 선택해요.

**요구사항**

- `/performance-lab/inp?pageSize=24`에서 이미지가 모두 로드된 뒤, 같은 상품의 찜 버튼을 한 번 눌러요.
- 일반 production build와 CPU `4x slowdown`에서 같은 상품이 찜되지 않은 상태로 Before와 After를 각각 3회 측정해요.
- Interactions track에서 input delay, processing duration, presentation delay를 확인해요.
- profiling build에서 같은 클릭을 React Profiler로 재현해, 관계없는 카드가 렌더되는지와 변경 원인을 확인해요.
- 실제 원인에 맞는 가장 작은 변경으로 렌더 범위를 줄여요.

> 💡 `pageSize`를 24보다 줄이거나, 카드의 필수 계산·결과를 지우거나, `setTimeout`으로 갱신을 다음 paint 뒤로 미루지 않아요. 찜 버튼의 즉각적인 피드백과 fixture 수를 그대로 유지하세요. Lighthouse TBT를 클릭 INP라고 설명하지도 않아요.

**완료조건**

Performance는 사용자 클릭 구간을, Profiler는 React 렌더 범위와 원인을 설명하는 데 각각 사용했고, 24개 카드와 즉각적인 찜 피드백을 유지한 채 관계없는 렌더가 줄어야 해요.

## ✍️ Technical Writing Quest — 측정으로 내린 판단을 설명해요

제출물에는 개선 목록 대신, 실제로 본 사실에서 어떤 결정을 내렸는지 적어요. Before·After SHA와 재현 조건, raw 값·중앙값·범위, LCP element와 가장 긴 구간, 이미지 표시·전송 크기, 선택하거나 제외한 변경의 이유를 연결해요.

목록은 상태 표의 여섯 화면과 현재 URL의 active query를 지킨 근거를 설명해요. metadata는 URL 정규화·query factory·GET URL·options가 같다는 근거, request 범위 memoization의 범위, root와 페이지 metadata의 shallow merge를 설명해요. normal·정상 empty·query failure의 document 증거, 서버 호출 계수, 일반 UA와 `facebookexternalhit`의 응답 시점 비교도 실제 측정을 바탕으로 판단을 적어요.

효과가 없었던 시도, metadata가 데이터를 기다린 비용, 이미지 품질·접근성·기능 회귀 확인 결과도 숨기지 마세요. 같은 조건에서 다시 측정해도 왜 그 변경을 했는지, 왜 다른 변경은 하지 않았는지 따라갈 수 있게 적어요.

## ✅ Checklist

**0단계 / Before**

- [ ] production build에서 같은 조건으로 Before와 After를 측정했는가
- [ ] Before와 After의 SHA를 각각 기록하고, SHA를 제외한 측정 조건을 같게 두었는가
- [ ] FCP·LCP·CLS의 5회 raw 값과 중앙값·최솟값·최댓값을 남겼는가
- [ ] URL, 행동, viewport, throttling, 브라우저·Lighthouse 버전, load 조건과 별도 브라우저 프로필을 같게 두었는가
- [ ] LCP element, waterfall, filmstrip을 함께 확인했는가
- [ ] DevTools에서 Layout Shifts와 document·API·image의 URL·전송 크기·요청 시작 시점을 확인했는가
- [ ] 측정 흔들림보다 큰 변화인지 설명할 수 있는가

**1단계 / Hero LCP**

- [ ] 고용량 Hero 원본을 사용한 Before를 먼저 남겼는가
- [ ] 이미지 표시 크기·전송 크기·요청 시작 시점과 LCP 구간을 확인했는가
- [ ] Hero의 시각적 역할과 품질을 유지하면서 실제 병목을 줄였는가
- [ ] `next/image` 사용 여부가 아니라 실제 요청과 LCP 결과를 확인했는가
- [ ] Header·`h1`·페이지 설명이 느린 Hero와 함께 막히지 않는가
- [ ] fallback 교체가 눈에 띄는 layout shift를 만들지 않는가

**2단계 / 목록과 CLS**

- [ ] 데이터 없는 최초 진입, 이전 데이터가 있는 갱신, 성공 + 0건, 최초 실패, 갱신 실패, 취소 화면을 구분했는가
- [ ] 현재 URL의 active query와 화면 결과가 일치하고, 이전 요청의 늦은 완료가 화면을 덮지 않는가
- [ ] 취소된 요청을 별도로 관찰했고 오류로 보이지 않게 했는가
- [ ] 서버 응답을 Zustand나 로컬 상태에 복사하지 않았는가
- [ ] fallback과 실제 콘텐츠 교체에서 CLS가 생기지 않는가

**3단계 / metadata와 Open Graph**

- [ ] Next App Router 서버 metadata 경로에서 `src/app/layout.tsx`, `src/app/(commerce)/page.tsx`, `src/app/(commerce)/products/page.tsx`를 확인했는가
- [ ] JavaScript 실행 전에도 제목·설명·주요 링크와 구조를 확인할 수 있는가
- [ ] 주요 콘텐츠·탐색·상품 영역의 역할이 마크업에 드러나고, `href` 링크와 의미 있는 이미지의 대체 텍스트가 있는가
- [ ] 루트 title template·공통 Open Graph와 페이지 metadata가 의도대로 합성되는가
- [ ] shallow merge에도 `siteName`·`locale`·`type` 등 공통 Open Graph 필드가 유지되는가
- [ ] 홈과 목록 metadata가 본문 prefetch와 같은 query factory가 조회한 응답을 사용했는가
- [ ] 검색어 우선 title, category·sort description, 2페이지 이상 page 번호 규칙을 지켰는가
- [ ] 정상 empty는 URL 조건·0개를 설명하고 fallback image를 유지하며, query failure는 root 공통 metadata를 상속하는가
- [ ] metadata와 본문이 같은 query factory·GET URL·options를 사용하는가
- [ ] 서버 `getQueryClient()` 호출마다 새 인스턴스가 만들어지고, 같은 render/request의 동일 native fetch URL·options만 memoization 대상임을 설명했는가
- [ ] 모든 페이지가 기본 색인 가능 상태를 유지하는가
- [ ] Browser Network만으로 Route Handler 횟수를 판정하지 않고, 서버 측 계수로 확인한 뒤 계측을 되돌렸는가
- [ ] normal·정상 empty·metadata query failure의 document 증거를 남겼는가
- [ ] `APP_ORIGIN`을 build와 runtime에 같은 값으로 두고, localhost Open Graph URL을 배포 증거로 쓰지 않았는가
- [ ] 일반 document 요청과 `facebookexternalhit` 요청의 metadata 응답 시점을 비교했는가

**4단계 / After와 회귀**

- [ ] 같은 조건의 5회 raw 값·중앙값·범위로 Before와 After를 비교했는가
- [ ] 검색·카테고리·정렬·페이지와 뒤로 가기·앞으로 가기가 같은 화면을 복원하는가
- [ ] 장바구니·위시리스트·Header 개수, 로딩·에러·빈 상태·재시도가 유지되는가
- [ ] FSD 의존 방향과 슬라이스 Public API를 우회하지 않았는가
- [ ] 효과가 없거나 악화된 결과도 남겼는가

**Advanced A를 선택한 경우에만**

- [ ] Basic을 먼저 완료했는가
- [ ] 24개 카드를 유지한 같은 조건에서 Before와 After를 각각 3회 측정했는가
- [ ] Performance와 Profiler를 각각의 용도에 맞게 사용했는가
- [ ] 관계없는 카드 렌더가 줄고, 필수 계산과 즉각적인 찜 피드백이 유지되는가

**공통**

- [ ] 관찰한 사실, 원인 가설, 반증 방법, 가장 작은 변경을 기록했는가
- [ ] 왜 이렇게 설계했는가를 한 줄 근거로 설명할 수 있는가
- [ ] AI가 만든 부분을 표기하고 직접 검토했는가
- [ ] 환경 블록의 `pnpm test`, `pnpm check`가 통과하는가
