# 7주차 — 프론트엔드 성능 최적화: 사용자 경로별 병목 측정과 개선

<!--
source_document: pasted-text.txt
source_sha256: 39e307e915f0ebcb787cac091f54cee4b1f5fc2710d96d8b17080d43fd954cce
source_line_count: 458
source_transform: 사용자 결정으로 폐기한 선택 범위의 본문·체크리스트·상호 참조 제거
base_revision: 8708cb2d7e0f8da0ac98fe0153a750aeee7b69dc
assignment_branch: codex/week-07-performance-assignment
-->

> 느린 API를 없애서 숫자만 줄이지 않아요.
>
> 같은 사용자 경로를 production 환경에서 재현하고, 렌더링·데이터 로딩·상호작용 병목을 줄인 뒤, 같은 조건의 Before / After로 효과를 확인해요.

## 이번 주 범위

- **Production Before / After** — 한 번의 최고 점수가 아니라 같은 조건의 반복 측정으로 변경의 효과를 확인해요.
- **느린 히어로의 RSC 경계** — 헤더와 페이지 제목은 먼저 보내고, 느린 히어로만 기다리게 해요.
- **실제 크기의 fallback** — 로딩 UI가 최종 콘텐츠의 공간을 미리 잡아 CLS를 줄여요.
- **느린 목록의 전환 UX** — 최초 로딩과 갱신 중 로딩을 나누고, 마지막 URL과 상품 결과를 일치시켜요.
- **초기 HTML과 SEO** — JavaScript 실행 전에도 페이지의 제목, 설명, 구조, 이동 경로가 보이게 해요.
- **Advanced A** — 더 도전하고 싶다면 관계없는 카드 렌더 범위를 측정하고 줄여요.

> 💡 **Basic 1~5가 이번 주의 필수 과제예요.**
> Advanced A는 선택 과제이며 Basic 평가에 영향을 주지 않아요. Basic의 모든 사용자 경로와 증거를 먼저 완성한 뒤 시작해요. 선택하지 않아도 불이익이 없어요.

---

## 시작하기 전에 재현 조건을 확인해요

Week 7 starter가 제공하는 재현 조건을 그대로 사용해요.

- `/api/home?scenario=slow`와 `/api/products?scenario=slow`는 1.5초 뒤 성공 응답을 반환해요.
- 응답 데이터는 매번 같은 사용자 경로를 비교할 수 있는 결정적 fixture예요.
- Advanced A는 `/performance-lab/inp?pageSize=24`에 독립된 목록, store, 카드, 필수 화면 계산을 제공해요.
- `docs/assignments/week-07-evidence-template.md`는 측정 조건과 원본 증거 위치를 기록할 형식만 제공해요.
- checkpoint는 API·fixture·제출 형식과 결정적 동작만 확인해요.

API 지연, Advanced A의 재현 병목, 측정 장치와 checkpoint는 과제에서 새로 만드는 기능이 아니에요. starter 조건이 다르거나 위 경로가 재현되지 않으면 임의로 비슷하게 만들지 말고 멘토에게 먼저 알려줘요. 서로 다른 병목을 측정하면 Before / After를 비교할 수 없어요.

멘토는 과제를 공개하기 전에 production build와 위 세 재현 경로를 검증한 starter commit 또는 tag를 공지해요. 해당 기준점이 공지되지 않았다면 과제를 시작하지 않아요.

starter는 정답 UI나 최적화 구현을 제공하지 않아요. 다음 작업은 학습자가 직접 설계하고 구현해요.

- RSC·Client island·Query의 렌더링 경계와 데이터 소유자
- fallback의 실제 크기와 사용자에게 보일 pending·갱신·오류·빈 상태
- URL·Query·Zustand의 상태 의미론
- 관찰한 병목에 맞는 가장 작은 최적화
- Before / After 원본 증거, 가설, 반증 방법, 결과 해석과 무개입 근거

### 누적 과제 코드와 통합할 때

새 주차 starter는 멘티의 누적 브랜치에 동기화돼요. 기존 홈·상품 목록·검색·카테고리·정렬·페이지네이션·장바구니·위시리스트, FSD, TanStack Query, Zustand 코드를 교체하지 않아요. 같은 파일이 이미 있다면 starter의 정답 구조로 덮어쓰지 말고 API·fixture·측정 장치와 checkpoint만 통합해요.

서버 응답을 Zustand에 복사하거나 URL 상태를 별도 로컬 상태에 복제하지 않아요. FSD 의존 방향과 각 슬라이스의 Public API도 그대로 보존해요.

### 반드시 지킬 측정 기준

Before와 After 모두 개발 서버가 아닌 production build에서 측정해요.

```bash
pnpm build
pnpm start
```

PR 본문과 evidence template에 아래 조건을 함께 남겨요.

- 측정한 commit SHA
- URL과 query string
- 사용자가 한 행동
- viewport, CPU·network throttling, 브라우저와 Lighthouse 버전
- 시크릿 창 또는 확장 프로그램이 없는 별도 브라우저 프로필
- 측정 날짜
- cold load인지 warm navigation인지
- trace, Lighthouse 결과, 화면 녹화 같은 원본 증거의 위치

문서에 없는 Lighthouse·INP 절대 점수나 향상률은 합격 기준이 아니에요. 값이 좋아졌다는 주장보다 동일 조건, 원본 증거, 관찰과 원인의 연결을 먼저 확인해요.

---

## Basic 1단계 — 같은 조건의 Before를 남겨요

**코드를 바꾸기 전에 사용자가 어디에서 기다리는지 먼저 확인해요.**

### 홈 cold load

1. production build에서 `/`을 새로 열어요.
2. 같은 viewport와 throttling으로 Lighthouse를 5회 실행해요.
3. FCP, LCP, CLS의 5회 원값과 중앙값, 최솟값, 최댓값을 남겨요.
4. Performance filmstrip과 Network waterfall에서 헤더, 페이지 제목, 히어로가 나타나는 순서를 확인해요.
5. LCP element가 무엇인지 확인하고, 히어로 데이터가 셸까지 막는다는 가설을 반증할 방법도 적어요.

### 느린 상품 목록

1. `/api/products?scenario=slow`를 사용하는 목록에서 필터나 페이지를 바꿔요.
2. 최초 목록을 기다릴 때와 기존 목록을 갱신할 때의 화면을 각각 녹화해요.
3. 빠르게 조건을 연속 변경하고, 마지막 URL 조건·마지막으로 완료된 요청·화면에 표시된 상품이 일치하는지 확인해요.
4. Network에서 요청 순서와 취소 여부를 확인해요.

### 완료조건

- 홈과 목록의 재현 URL, 행동, 환경을 다른 사람이 그대로 따라 할 수 있는가?
- Lighthouse 5회 원값과 중앙값뿐 아니라 최솟값과 최댓값도 확인할 수 있는가?
- 변경 전에 관찰한 사실, 원인 가설, 반증할 측정, 가장 작은 변경을 한 줄씩 설명할 수 있는가?

> 💡 **발제 연결 — Part 1, 마무리**
> 이 단계에서는 점수를 올리는 코드를 찾지 않아요. 같은 조건에서 다시 확인할 수 있는 성능 PR의 출발점을 만들어요.

---

## Basic 2단계 — 느린 히어로만 기다리게 해요

**느린 데이터와 관계없는 RSC 셸은 먼저 보여줘요.**

### 요구사항

- 헤더, 하나의 `h1`, 페이지 설명은 느린 히어로 데이터의 `await`에 막히지 않아야 해요.
- 공통 RSC 셸을 먼저 반환하고, 느린 데이터 영역은 좁은 경계로 분리해요.
- async RSC를 선택했다면 느린 작업을 별도 async Server Component에 두고 해당 영역을 `Suspense`로 나눠요.
- Client Query를 선택했다면 RSC 셸은 유지하고 Client island의 pending UI에서 느린 요청을 기다려요.
- 히어로가 준비되기 전에는 히어로의 실제 크기와 비율을 반영한 fallback을 보여줘요.
- 히어로 fallback과 실제 히어로가 같은 공간을 사용하게 만들어요.
- `fill` 이미지를 사용한다면 부모가 `aspect-ratio`나 명시적인 높이로 공간을 먼저 잡아야 해요.
- Server Component는 같은 Next.js 애플리케이션의 Route Handler를 다시 HTTP로 호출하지 않아요. Route Handler와 RSC가 같은 서버 전용 data-access 계약을 사용하게 해요.
- async RSC streaming, Client `useQuery`, server prefetch와 hydration 중 현재 데이터의 화면 소유자에 맞는 경계를 고르고 이유를 남겨요.

server prefetch와 hydration은 필수가 아니에요. 최초 HTML의 데이터나 중복 요청 문제가 실제로 확인됐을 때만 선택해요. 적용했다면 waterfall과 RSC 응답 크기의 Before / After를 남기고, 적용하지 않았다면 지금 문제에 필요하지 않은 이유를 적어요.

### 확인할 증거

- Performance filmstrip에서 헤더, `h1`, 설명, 히어로 fallback이 느린 히어로보다 먼저 보이는지 확인해요.
- 같은 조건의 FCP, LCP, CLS를 5회 측정해 원값과 중앙값을 남겨요.
- Layout shifts track에서 fallback 교체로 움직인 요소가 있는지 확인해요.
- Network waterfall에서 document, 히어로 데이터, 이미지 요청의 시작 순서를 확인해요.
- Before와 After의 변화가 측정 흔들림보다 큰지 살펴보고, LCP나 CLS가 나빠졌다면 그대로 기록해요.

### 완료조건

- 1.5초 지연을 유지한 상태에서 RSC 셸이 히어로보다 먼저 보이는가?
- 히어로가 fallback을 교체할 때 아래 콘텐츠가 눈에 띄게 밀리지 않고, Layout shifts 증거로 원인을 확인할 수 있는가?
- 선택한 렌더링 경계와 데이터 소유자를 설명하고, 선택하지 않은 경로가 왜 불필요한지도 말할 수 있는가?

> 💡 **발제 연결 — Part 2, Part 3, Part 4**
> `Suspense`를 썼다는 사실보다 어디에서 기다리고 무엇을 먼저 보냈는지, fallback이 실제 공간을 잡았는지를 확인해요.

---

## Basic 3단계 — 최초 pending과 목록 갱신 UI를 분리해요

**서버의 1.5초 지연은 그대로 두고, 사용자가 현재 상태와 다음 상태를 구분하게 해요.**

### 필수 요구사항

- 데이터가 아직 없을 때는 실제 목록 크기의 최초 pending UI를 보여줘요.
- 기존 목록이 있는 상태에서 조건을 바꾸면 목록을 갑자기 비우지 않고, 갱신 중이라는 즉각적인 피드백을 보여줘요.
- `isPending`과 `isFetching`이 맡는 화면을 구분해요.
- 최초 실패, 기존 목록이 있는 갱신 실패, 빈 결과, 취소된 요청을 같은 화면으로 처리하지 않아요.
- 검색·카테고리·정렬·페이지처럼 서버 응답을 바꾸는 URL 조건이 query key와 요청에 함께 들어가야 해요.
- 빠르게 조건을 연속 변경한 뒤 마지막 URL과 표시된 상품이 일치해야 해요.
- 서버 응답을 Zustand나 별도 로컬 상태에 복사하지 않아요.

### 조건부 최적화

아래 API를 모두 넣는 과제가 아니에요. 화면 녹화와 Network에서 관찰한 문제에 맞는 변경만 선택해요.

| 관찰한 문제 | 검토할 선택 | 제출할 근거 |
| --- | --- | --- |
| 페이지를 바꿀 때 목록 전체가 사라져요 | `placeholderData` | 이전 결과를 구분한 UI와 Before / After를 남겨요 |
| 다음 페이지를 누를 때마다 같은 대기가 반복돼요 | prefetch | 실제 이동 의도, 줄어든 대기, 쓰지 않은 요청 여부를 남겨요 |
| 필터를 빠르게 바꾸면 필요 없는 요청이 이어져요 | queryFn이 받은 `AbortSignal`을 실제 `fetch`에 전달해요 | 요청 취소 여부와 최종 URL·결과 정합성을 남겨요 |
| 초기 HTML에도 Query 데이터가 필요해요 | server prefetch + hydration | 중복 요청, waterfall, RSC 응답 크기의 Before / After를 남겨요 |

선택하지 않은 항목은 구현 대신 **무개입 근거**를 남겨요. 예를 들어 “다음 페이지 이동 의도가 확인되지 않아 prefetch 요청만 늘어날 수 있으므로 적용하지 않았어요”처럼 관찰한 증거와 함께 적어요.

5주차 구현이 slow scenario에서도 완료조건을 이미 만족한다면 불필요한 코드 변경을 만들지 않아도 돼요. Before 증거와 무개입 근거로 인정해요.

### 완료조건

- 클릭 직후 pending 또는 갱신 표시가 paint되어 사용자가 입력이 처리됐다는 사실을 알 수 있는가?
- 기존 목록을 유지했다면 이전 결과라는 사실을 구분할 수 있는가?
- 성공·실패·빈 결과·취소 뒤에도 마지막 URL과 화면 결과가 예측 가능한가?
- 선택한 전략 하나의 효과를 같은 조건의 Before / After로 설명하거나, 개입하지 않은 이유를 증거로 설명할 수 있는가?

> 💡 **발제 연결 — Part 3**
> 5주차의 Query API를 다시 연습하지 않아요. 서버 상태와 URL의 책임을 유지하면서, 지금 관찰한 기다림에 필요한 전환만 바꿔요.

---

## Basic 4단계 — 초기 HTML에 페이지의 의미를 담아요

**JavaScript가 실행되기 전에도 이 페이지가 무엇을 보여주는지 알 수 있게 해요.**

### 요구사항

- 홈과 상품 목록에 의미 있는 정적 `title`과 `description`을 제공해요.
- 각 페이지의 초기 응답에 하나의 명확한 `h1`과 페이지 설명을 담아요.
- 주요 콘텐츠는 `main`, 탐색은 `nav`, 상품 영역은 이름을 가진 `section`처럼 역할을 설명할 수 있는 구조로 만들어요.
- 주요 이동 경로는 클릭 이벤트만 있는 요소가 아니라 `href`를 가진 실제 링크로 제공해요.
- 의미 있는 상품과 히어로 이미지에 내용을 설명하는 `alt`를 제공해요.
- 느린 목록이나 히어로를 기다리는 동안에도 제목, 설명, 구조, 링크를 확인할 수 있어야 해요.

### 확인할 증거

Elements 패널만 보지 않아요. Network의 document Response, View Source, JavaScript를 끈 새 요청 중 하나 이상으로 초기 HTML을 확인하고 캡처나 응답 일부를 PR에 남겨요.

### 완료조건

- 초기 응답에서 고유한 title과 description을 확인할 수 있는가?
- 하나의 `h1`, 페이지 설명, 주요 링크를 JavaScript 실행 전에도 찾을 수 있는가?
- 사용한 시맨틱 태그가 어떤 콘텐츠 역할을 설명하는지 말할 수 있는가?

> 💡 **발제 연결 — Part 4**
> SEO 설정을 추가했다는 설명으로 끝내지 않아요. 사용자와 크롤러가 첫 응답에서 실제로 확인할 수 있는 내용을 증거로 남겨요.

---

## Basic 5단계 — 같은 조건의 After와 회귀를 확인해요

Before와 같은 URL, 행동, viewport, throttling, 도구 버전으로 After를 측정해요.

### Before / After 기록표

| 사용자 경로 | 측정 조건 | 지표·증거 | Before 원본 증거 | After 원본 증거 | 바꾼 것 | 왜 달라졌는가 |
| --- | --- | --- | --- | --- | --- | --- |
| 홈 cold load | 직접 작성 | FCP·LCP·CLS·filmstrip·waterfall | 5회 원값·중앙값·범위를 직접 작성 | 5회 원값·중앙값·범위를 직접 작성 | 직접 작성 | 직접 작성 |
| 느린 목록 갱신 | 직접 작성 | pending UI·요청 순서·화면 녹화 | 직접 작성 | 직접 작성 | 직접 작성 | 직접 작성 |
| 초기 HTML | 직접 작성 | metadata·`h1`·설명·링크 | 직접 작성 | 직접 작성 | 직접 작성 | 직접 작성 |

효과가 없던 변경은 되돌리거나 유지할 이유를 적어요. 지표가 개선되지 않았다는 사실만으로 자동 미완료가 되지는 않아요. 무효한 변경을 되돌렸거나 유지 근거가 있고, 악화된 결과까지 사실대로 기록했다면 멘토가 증거를 검토할 수 있어요. FCP가 줄었더라도 LCP, CLS, 기능이 나빠졌다면 개선으로 숨기지 말고 함께 기록해요.

### 완료조건

- Before와 같은 URL, 행동, viewport, throttling, 도구 버전에서 After를 비교했는가?
- 검색·카테고리·정렬·페이지가 URL에서 복원되는가?
- 뒤로 가기와 앞으로 가기가 같은 화면을 복원하는가?
- 장바구니·위시리스트와 Header 개수가 일치하는가?
- 로딩·에러·빈 상태와 재시도가 동작하는가?
- FSD 의존 방향과 Public API를 우회하지 않았는가?
- `pnpm check`가 통과하는가?

> 💡 **발제 연결 — Part 1, 마무리**
> 성능 PR은 “빨라 보인다”가 아니라 같은 조건에서 바뀐 이유와 회귀가 없다는 사실을 함께 설명해야 끝나요.

---

## Advanced A — 관계없는 카드 렌더를 줄여요

Advanced A는 Basic 평가와 분리된 선택 과제예요. Basic 1~5의 코드, 사용자 경로, 증거를 모두 완성한 뒤 `/performance-lab/inp?pageSize=24`를 사용해요.

### 측정 조건

1. 일반 production build에서 API와 이미지 로딩이 끝날 때까지 기다려요.
2. Performance의 CPU를 `4x slowdown`으로 설정해요.
3. 같은 상품이 찜되지 않은 동일 초기 상태로 되돌려요.
4. 기록을 시작하고 같은 상품의 찜 버튼을 한 번 눌러요.
5. Before와 After에서 각각 3회 반복해 원값과 중앙값을 남겨요.
6. Interactions track에서 대표값에 가까운 click의 input delay, processing duration, presentation delay를 기록해요.
7. profiling build에서는 같은 클릭을 React Profiler로 재현하고, 렌더링된 카드 수와 원인을 확인해요.

```bash
pnpm next build --profile
pnpm start
```

profiling build의 commit 시간과 일반 production build의 Performance 시간을 직접 비교하지 않아요. Performance는 브라우저의 상호작용 구간을, Profiler는 React 렌더 범위와 원인을 설명하는 데 사용해요.

### 요구사항

- Before에서 찜 하나를 바꿀 때 관계없는 카드까지 렌더링되는지 먼저 증명해요.
- 넓은 Zustand 구독, selector 결과, props, 컴포넌트 경계 중 실제 원인을 trace와 Profiler로 연결해요.
- 카드가 필요한 값만 구독하거나 컴포넌트 경계를 조정해 관계없는 카드 렌더를 줄여요.
- 필수 화면 계산은 유지하되, 계산이 필요한 카드에서만 실행되게 해요.
- 찜 버튼의 즉각적인 피드백과 기존 기능을 유지해요.

### 인정하지 않는 우회

- `pageSize`를 24보다 작게 바꾸지 않아요.
- 화면에 필요한 계산이나 계산 결과를 삭제하지 않아요.
- `setTimeout`으로 필수 갱신을 다음 paint 뒤로 미루지 않아요.
- 찜 버튼의 즉각적인 피드백을 제거하지 않아요.
- Lighthouse TBT를 실제 찜 클릭의 INP 증거라고 설명하지 않아요.
- fixture, checkpoint, 검증 하네스를 수정해 통과시키지 않아요.

### 완료조건

- 같은 초기 상태와 `4x slowdown`에서 Before / After를 각각 3회 재현할 수 있는가?
- After의 Profiler에서 관계없는 카드 렌더와 반복 계산이 줄었는가?
- 같은 클릭의 processing 또는 presentation 구간이 줄고, 그 변화와 React 렌더 범위를 함께 설명할 수 있는가?
- 로컬 클릭 시간을 현장 INP 값으로 과장하지 않았는가?

> 💡 **발제 연결 — Advanced A**
> `memo`를 썼는지가 아니라 찜 하나가 왜 24개 카드에 영향을 줬고, 변경 뒤 어떤 카드만 다시 렌더링됐는지를 평가해요.

---

## 검증 계층과 완료 상태

검증은 자동 판정과 멘토 수동 검토를 섞지 않아요.

1. `pnpm test`, `pnpm check` — 기존 기능과 저장소 기본 상태가 깨지지 않았는지 확인해요.
2. `pnpm verify:week07:starter` — API, fixture, 측정 장치, checkpoint가 결정적으로 동작하는지 확인해요.
3. `pnpm verify:week07:submission --advanced=none` — Basic 1~5 checkpoint와 evidence template의 필수 원본 위치·형식이 채워졌는지 확인해요.
4. `pnpm verify:week07:submission --advanced=a` — Advanced A를 선택한 제출에서만 Basic 완료 뒤 Advanced A checkpoint와 증거 형식을 추가로 확인해요.
5. 멘토 수동 검토 — Lighthouse·filmstrip·waterfall·trace·Profiler의 타당성, 가설과 반증, 무개입 근거, 악화된 결과의 해석을 확인해요.

자동 검증 결과는 다음처럼 구분해요.

| 상태 | 종료 코드 | 의미 |
| --- | ---: | --- |
| `PASS` | `0` | 자동으로 확인 가능한 starter 계약 또는 제출 형식이 모두 충족됐어요 |
| `INFRA_ERROR` | `1` | API·fixture·checkpoint·검증 하네스가 없거나 결정적으로 재현되지 않아요 |
| `INCOMPLETE` | `2` | 인프라는 정상이지만 학습자 구현 또는 필수 원본 증거가 아직 없어요 |

깨끗한 starter에서 두 submission 명령은 모두 `INFRA_ERROR`가 아니라 `INCOMPLETE`로 종료돼야 해요. starter 자체가 학습자 성과를 선취하면 안 돼요. 필수 원본 증거나 동일 재현 조건이 빠진 제출도 `INCOMPLETE`예요.

자동 검증은 성능 지표가 좋아졌는지, 가설이 타당한지 판정하지 않아요. 지표 미개선 자체도 자동 미완료 사유가 아니에요. 이 판단은 고정된 evidence template의 원본을 멘토가 직접 검토해요.

---

## Week 7 requirement-to-starter verification map

독립 검증 산출물은 [week-07-verification-map.md](./week-07-verification-map.md)에서도 확인할 수 있어요. 두 표는 문서 검증에서 같은 행인지 확인하므로 서로 다른 요구사항으로 바뀔 수 없어요.

각 ID는 요구사항 하나를 starter 제공물, 학습자 소유 작업, 필수 증거, 검증과 우회 금지에 정확히 연결해요. checkpoint는 이 표에 없는 최적화 방식이나 절대 점수를 추가로 요구하지 않아요.

| ID | 요구사항 | starter 제공물 | 학습자 소유 작업 | 필수 증거 | 자동 검증 | 멘토 수동 검토 | 인정하지 않는 우회 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `W7-B1` | 같은 조건의 production Before를 고정한다 | 1.5초 slow API, 결정적 홈·상품 fixture, evidence template의 Before 칸 | 재현 행동을 정하고 관찰·가설·반증·최소 변경을 기록한다 | 홈 Lighthouse 5회 원값·중앙값·최솟값·최댓값, filmstrip·waterfall, 목록 최초/갱신 녹화와 요청 순서 | `--scope=basic-infrastructure`, `--scope=basic-checkpoints`; Basic submission은 clean starter에서 `INCOMPLETE` | 측정 조건의 동일성, LCP 원인 가설과 반증 가능성 | 코드 변경 뒤 Before를 만들거나 최고 점수만 고르기 |
| `W7-B2` | 느린 히어로와 관계없는 셸을 먼저 보낸다 | 홈 slow API와 데이터 계약만 제공하며 렌더 경계·fallback은 제공하지 않는다 | RSC/Client 경계, 데이터 소유자, 실제 크기 fallback을 설계한다 | 셸 선표시 filmstrip, FCP·LCP·CLS 5회, Layout shifts, document·데이터·이미지 waterfall | `--scope=basic-infrastructure`, `--scope=basic-checkpoints`; `basic-2-shell` 형식만 판정 | 경계 선택의 타당성, fallback 교체와 지표 변화 해석 | 지연 제거, 숨김 처리로 히어로 생략, starter가 정답 경계를 강제하기 |
| `W7-B3` | 최초 pending과 기존 목록 갱신 UX를 구분하고 마지막 URL·결과를 일치시킨다 | 상품 slow API, 결정적 목록 fixture와 연속 조건 변경 재현 입력 | pending/fetching, 성공·실패·빈 결과·취소 의미론과 필요한 최적화만 구현한다 | 최초/갱신 녹화, 요청 순서·취소, 마지막 URL·요청·화면 결과, 적용 증거 또는 무개입 근거 | `--scope=basic-infrastructure`, `--scope=basic-checkpoints`; `basic-3-transition` 형식만 판정 | 클릭 직후 피드백, 상태 구분, 선택 전략과 무개입 근거 | 지연 제거, 서버 응답 복제, 모든 Query API를 체크리스트처럼 추가하기 |
| `W7-B4` | JavaScript 전 초기 HTML에 페이지 의미와 이동 경로를 담는다 | 기존 홈·목록 데이터 계약과 slow 재현 경로만 제공한다 | metadata, 하나의 `h1`, 설명, 의미 구조, 링크, 이미지 대체 텍스트를 구현한다 | document Response·View Source·JavaScript 비활성 요청 중 하나 이상의 원본 | `--scope=basic-checkpoints`; `basic-4-html` 필수 칸과 증거 위치 형식만 판정 | 초기 응답의 실제 의미, 시맨틱 요소와 링크의 역할 | Elements의 hydration 결과만 제출하거나 기존 페이지를 starter 답안으로 교체하기 |
| `W7-B5` | 같은 조건의 After와 기능·구조 회귀를 함께 확인한다 | evidence template의 Before / After 표와 기존 `pnpm check` 계약 | 가장 작은 변경을 평가하고 무효 변경을 되돌리거나 유지 근거를 남긴다 | 동일 조건 After 원본, URL·뒤로/앞으로·상태·오류·빈 상태·FSD 회귀 결과, 악화된 값 | `pnpm check`, `--scope=basic-checkpoints`; Basic submission은 필수 원본 누락 시 `INCOMPLETE` | 변화가 흔들림보다 큰지, 원인 설명, 무효 변경과 악화 결과의 정직한 처리 | 조건을 바꾸어 비교하거나 문서에 없는 점수·향상률을 합격 기준으로 삼기 |
| `W7-AA` | Basic 완료 뒤 찜 하나가 만드는 관계없는 카드 렌더와 필수 계산을 줄인다 | 독립된 24개 카드, store, 찜 동작, 카드별 필수 화면 계산과 측정 checkpoint | 구독·selector·props·컴포넌트 경계를 진단하고 가장 작은 최적화를 구현한다 | 동일 초기 상태·4x slowdown의 Performance 3회 원값·중앙값, interaction 구간, Profiler 렌더 카드 수·원인 | `--scope=advanced-a`, `--advanced=a`; clean starter에서는 `INCOMPLETE` | trace와 Profiler의 원인 연결, 렌더 범위와 interaction 변화 해석 | 카드 수·필수 계산 축소, `setTimeout`, 즉시 피드백 제거, 하네스 수정 |

---

## 이번 주 범위 밖과 공통 우회 금지

시간은 측정과 원인 확인에 사용해요. 아래 작업은 이번 과제에서 요구하지 않아요.

- 동적 metadata, OG 이미지, sitemap, robots 정책, JSON-LD를 추가하지 않아요.
- 가상화나 무거운 최적화 라이브러리를 새로 도입하지 않아요.
- Query key factory, `staleTime`, 상태 책임을 처음부터 다시 설계하지 않아요.
- 모든 Query 최적화 API를 체크리스트처럼 구현하지 않아요.

다음 방법은 문제를 해결한 것으로 인정하지 않아요.

- slow API의 1.5초 지연을 줄이거나 제거해요.
- Advanced A의 카드 수를 24개보다 줄여요.
- 화면에 필요한 계산이나 계산 결과를 삭제해요.
- `setTimeout`으로 필수 작업을 다음 paint 뒤로 미뤄요.
- fixture, checkpoint, evidence template, 검증 하네스를 수정해 통과시켜요.
- 여러 최적화를 한 번에 넣고 무엇이 효과를 냈는지 설명하지 못해요.

---

## 🤖 AI를 활용할 때 지켜요

AI에는 수정 코드를 바로 요청하기보다 관찰한 사실, trace, 가설을 먼저 보여주고 반증할 측정을 제안받아 보세요.

- AI가 저장소에 없는 API나 설정을 있다고 가정하지 않았는지 확인해요.
- RSC streaming과 TanStack Query hydration을 같은 기능으로 설명하지 않았는지 확인해요.
- 느린 네트워크 완료 시간을 INP라고 부르지 않았는지 확인해요.
- AI가 만든 코드는 diff, 타입, 테스트, 실제 화면, trace를 직접 검토해요.
- AI가 생성하거나 크게 수정한 코드와 문서를 PR에 표시해요.
- AI 제안 중 채택한 것과 반려한 것을 각각 한 가지 이상 골라 이유를 남겨요. 해당하는 제안이 없었다면 AI를 사용하지 않았다고 적어요.

---

## 제출물

- 느린 히어로의 RSC 셸, 선택한 내부 렌더링 경계, 실제 크기 fallback을 적용한 코드
- 느린 상품 목록의 pending·전환 UX와 정합성을 확인할 수 있는 코드
- 초기 HTML의 metadata, 의미 구조, 링크, 이미지 대체 텍스트를 적용한 코드
- `docs/assignments/week-07-evidence-template.md`를 복사해 작성한 측정 보고서
  - Before / After commit SHA와 측정 조건
  - Lighthouse 5회 원값, 중앙값, 최솟값, 최댓값
  - filmstrip, waterfall, Layout shifts, 초기 HTML 증거
  - 진단 가설, 반증 방법, 가장 작은 변경, 결과
  - 조건부 최적화의 적용 증거 또는 무개입 근거
  - 기능·FSD·상태 책임 회귀 확인
- Advanced A를 선택했다면 해당 trace, Profiler와 원본 측정값
- AI가 생성하거나 크게 수정한 부분과 직접 검토한 결과

---

## 발제와 과제의 대응

| 과제 요구사항 | 발제에서 확인할 부분 |
| --- | --- |
| production Before / After와 재현 조건 | Part 1, 마무리 |
| 느린 히어로의 FCP·LCP 진단 | Part 2 |
| RSC 셸, async RSC, `Suspense`, 데이터 소유자 선택 | Part 2, Part 3 |
| 실제 크기의 fallback과 CLS | Part 4 |
| 느린 API의 pending·전환 UX와 정합성 | Part 3 |
| metadata와 의미 있는 초기 HTML | Part 4 |
| 관계없는 카드 렌더와 상호작용 구간 | Advanced A |

발제에서 다루지 않은 API나 인프라가 필요해 보이면 먼저 범위를 확인해요. 새 기술을 많이 넣는 것보다 발제에서 배운 경계를 실제 사용자 경로에 적용하고 증명하는 것이 우선이에요.

---

## ✅ 제출 전 셀프 체크

### Basic 측정

- [ ] Before와 After를 모두 production build에서 측정했는가?
- [ ] 각 측정의 commit SHA, URL, 사용자 행동, viewport, throttling, 브라우저, 날짜를 기록했는가?
- [ ] 홈 cold load의 Lighthouse 5회 원값, 중앙값, 최솟값, 최댓값을 확인할 수 있는가?
- [ ] filmstrip, waterfall, trace의 원본 위치를 다른 사람이 열 수 있는가?
- [ ] 변경 전 관찰, 원인 가설, 반증 방법, 가장 작은 변경을 설명할 수 있는가?
- [ ] After의 변화가 측정 흔들림보다 큰지 확인했는가?

### RSC 셸과 CLS

- [ ] 1.5초 히어로 지연을 유지한 채 헤더, `h1`, 설명이 먼저 보이는가?
- [ ] 느린 데이터 작업 가까이에 기다림의 경계를 두었는가?
- [ ] RSC가 자기 Route Handler를 HTTP로 호출하지 않는가?
- [ ] fallback이 실제 히어로와 목록의 크기, 비율, grid를 반영하는가?
- [ ] Layout shifts track에서 교체 전후 움직인 요소와 CLS를 확인했는가?
- [ ] streaming, Client Query, hydration 중 선택한 경계와 데이터 소유자를 설명할 수 있는가?
- [ ] hydration을 적용했다면 성능 증거가 있고, 적용하지 않았다면 무개입 근거가 있는가?

### 느린 API 전환 UX

- [ ] 최초 `isPending`과 갱신 중 `isFetching`이 화면에서 다르게 보이는가?
- [ ] 클릭 직후 사용자가 확인할 수 있는 pending 또는 갱신 표시가 paint되는가?
- [ ] 기존 목록을 유지할 때 이전 결과라는 사실을 구분할 수 있는가?
- [ ] 빠른 연속 변경 뒤 마지막 URL과 표시된 상품이 일치하는가?
- [ ] 최초 실패, 갱신 실패, 빈 결과, 취소된 요청을 구분해 처리하는가?
- [ ] slow API의 지연을 줄이거나 제거하지 않았는가?
- [ ] cancellation을 적용했다면 queryFn의 `AbortSignal`을 실제 `fetch`에 전달했는가?
- [ ] `placeholderData`, prefetch, cancellation을 적용했다면 Before / After가 있고, 적용하지 않았다면 무개입 근거가 있는가?

### 초기 HTML과 회귀

- [ ] 초기 응답에 고유한 title과 description이 있는가?
- [ ] JavaScript 실행 전에도 하나의 `h1`, 페이지 설명, 주요 링크를 확인할 수 있는가?
- [ ] `main`, `nav`, `section`이 맡은 역할을 설명할 수 있는가?
- [ ] 의미 있는 이미지에 내용을 설명하는 `alt`가 있는가?
- [ ] URL 복원, 뒤로·앞으로 가기, 장바구니·위시리스트, 로딩·에러·빈 상태가 유지되는가?
- [ ] FSD 의존 방향과 Public API를 우회하지 않았는가?
- [ ] `pnpm check`가 통과하는가?

### Advanced A를 선택했다면

- [ ] Basic 1~5를 먼저 완료했는가?
- [ ] `/performance-lab/inp?pageSize=24`에서 API와 이미지 로딩이 끝난 뒤 측정했는가?
- [ ] 동일한 초기 찜 상태와 `4x slowdown`에서 Before / After를 각각 3회 측정했는가?
- [ ] Performance에서 input, processing, presentation 구간을 기록했는가?
- [ ] Profiler에서 Before의 관계없는 카드 렌더와 After의 감소를 확인했는가?
- [ ] 카드 수, 필수 계산, 즉각적인 피드백을 유지했는가?
- [ ] `setTimeout`이나 Lighthouse TBT로 실제 클릭 측정을 우회하지 않았는가?

### 공통

- [ ] Basic 필수 원본 증거와 동일 재현 조건을 모두 남겼는가?
- [ ] 왜 이렇게 설계했는지 변경마다 한 줄 근거가 있는가?
- [ ] 지표가 나빠졌거나 변화가 없던 결과도 숨기지 않았는가?
- [ ] fixture와 검증 하네스를 수정하지 않았는가?
- [ ] AI가 생성하거나 크게 수정한 부분을 표기하고 직접 검토했는가?
