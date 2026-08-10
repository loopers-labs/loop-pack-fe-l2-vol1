# 7주차 진행 순서

> 전체 결과와 핵심 판단을 먼저 보려면 [7주차 성능 측정 및 개선 요약](README.md)을 확인한다.

7주차는 코드 개선 과제가 아니라 측정 과제다. 합격선(점수·향상률)이 없고, 완료조건은 "Before/After SHA, 정해진 반복 횟수의 raw 값·중앙값·범위, 어떤 구간이 길었고 왜 그 변경을 골랐는지"를 제출물에서 확인할 수 있느냐다. Basic의 Lighthouse는 5회, Advanced A의 상호작용은 Before/After 각 3회다.

따라서 **최적화 코드를 먼저 건드리면 안 된다.** Before를 남길 수 없게 된다.

## 시작 시점의 레포 상태

과제 명세와 대조한 결과다.

### 이미 갖춰진 것

- slow scenario — `app/api/home/route.ts`, `app/api/products/route.ts` 둘 다 `?scenario=slow`(1.5초) 지원
- 2단계 재료 상당수 — `placeholderData: keepPreviousData`, `ProductGridSkeleton`, 0건·에러·재시도 UI, nuqs 기반 URL 상태, 서버 응답을 Zustand에 복사하지 않음
- `getServerQueryClient`가 `cache()`로 요청 단위 분리 — 요청 간에는 섞이지 않는다. **3단계 요구사항과 일치하는지는 Step 6에서 실측으로 확정했다**(아래 참고)
- Advanced A 측정 화면 — `app/performance-lab/inp/page.tsx`(24개 카드)

### 아직 없는 것

- `getProductList`가 상대경로 `/api/products`로 요청 — 서버에서 호출하면 실패한다 → Step 6에서 `getApiBaseUrl()` 적용
- `generateMetadata`가 한 곳도 없음 — `app/layout.tsx`의 정적 `metadata`만 존재 → Step 6에서 `app/(home)/page.tsx`와 `app/products/page.tsx`에 추가
- 루트 title template·공통 Open Graph 없음 — 페이지 `openGraph`가 shallow merge로 덮어쓸 대상 자체가 없다 → Step 6에서 `app/layout.tsx`에 정의
- Hero 이미지 최적화 없음 — `<img>`로 7.5MB 원본을 그대로 요청 → Step 4에서 측정 근거 확보 후 개입

### 판단이 갈렸던 것 — `getServerQueryClient`의 `cache()`

명세 141줄은 "서버에서는 `getQueryClient()`를 호출할 때마다 새 QueryClient를 만들어요. metadata와 본문이 QueryClient 캐시를 공유하게 만들려고 singleton이나 영속 캐시로 바꾸지 않아요"라고 적혀 있다.

현재 구현(`src/shared/api/query-client.ts`)은 `cache(() => new QueryClient())`다. 요청 간에는 분리되지만 **같은 요청 안에서는 metadata와 본문이 같은 QueryClient를 공유한다.** 금지 대상인 singleton·영속 캐시는 아니지만 "호출할 때마다 새 인스턴스"도 아니다.

두 해석이 갈린다.

| 해석                                      | 근거                                                               | 결론           |
| ----------------------------------------- | ------------------------------------------------------------------ | -------------- |
| 금지 대상은 요청을 넘어 사는 캐시뿐이다   | 141줄 뒷문장이 `singleton이나 영속 캐시`를 명시한다                | 현재 구현 유지 |
| 문자 그대로 호출마다 새 인스턴스여야 한다 | 체크리스트 262줄이 "호출마다 새 인스턴스가 만들어지고"로 못 박는다 | `cache()` 제거 |

이 판단은 개입 4와 얽혀 있었다 — `HeroCopy`와 `HomeData`가 각각 조회해도 요청이 1회인 근거를 이 `cache()`로 적어두었기 때문이다. 떼면 그 근거가 사라지므로 홈 요청 횟수를 서버 측 계수로 다시 세야 했다.

#### 결론 — `cache()` 제거 (Step 6에서 실측)

임시 서버 로그로 세어보니 **`cache()` 유무와 무관하게 `/api/home` 1회, `/api/products` 1회**였다. 요청을 합치던 것은 QueryClient 공유가 아니라 Next의 request memoization(같은 render에서 URL·options가 같은 native fetch는 한 번만 나간다)이었다.

요청 손실이 0이므로 두 해석 중 어느 쪽이 맞는지 다툴 필요가 없어졌다. 체크리스트 262줄을 문자 그대로 만족하는 쪽(`cache()` 제거)을 택했다.

부수적으로 **개입 4에 적어둔 근거가 틀린 것으로 드러났다.** `src/shared/api/query-client.ts`, `src/_pages/home/ui/HomePage.tsx`, [measurement.md](measurement.md#suspense-경계가-둘인데-요청은-1회다)의 설명을 함께 고쳤다.

`/api/products`의 1회는 이 판단의 근거가 되지 못한다. 상품 목록은 서버 prefetch가 없어 서버 호출이 `generateMetadata` 하나뿐이라, `cache()` 유무와 무관하게 1회다.

측정 절차와 전체 결과는 [measurement.md의 `## metadata 증거`](measurement.md#metadata-증거)에 있다.

### 경로 매핑

과제 문서의 경로는 starter 기준이라 이 레포와 다르다. 누적 구조를 유지하고 경로만 대응시킨다.

| 과제 문서                              | 이 레포                 |
| -------------------------------------- | ----------------------- |
| `src/app/layout.tsx`                   | `app/layout.tsx`        |
| `src/app/(commerce)/page.tsx`          | `app/(home)/page.tsx`   |
| `src/app/(commerce)/products/page.tsx` | `app/products/page.tsx` |

## 진행 순서

### Step 1. Hero 연결 (코드) — 완료

`HeroSection`을 홈에 연결했다. **7.5MB·3840×2160 원본을 그대로 뒀다.** 0단계의 유일한 코드 작업이다.

- 기존 `HeroBanner`를 **대체**했다(병행 아님). starter 파일을 `src/examples/week-07-performance/`에서 `src/_pages/home/ui/`로 옮기고 `.module.css`, `.test.tsx`도 함께 이동했다.
- `HeroBannerSkeleton` → `HeroSectionSkeleton`. 실제 Hero와 같은 `.hero`·`.copy` 박스를 재사용해 `aspect-ratio 16/9`(모바일 `4/5`)를 공유한다. 교체 시 layout shift가 없어야 한다 — Step 3 녹화에서 확인할 것.
- starter의 `<h2>`를 `<h1>`으로 바꿨다. `HeroBanner`가 홈의 유일한 h1이었고, 3단계 "하나의 명확한 `h1`" 요구사항과도 맞다. **이 결정은 Step 4 개입 1에서 되돌렸다** — 지금은 `HomePage`가 시각 숨김 `h1`("취향을 발견하는 라이프스타일 스토어")을 소유하고 `banner.title`은 다시 `h2`다(아래 Step 4 참고).
- 타입 참조를 `@app/api/_types`(mock 백엔드)에서 슬라이스 소유인 `@/_pages/home/api/model`로 바꿨다. FSD 의존 방향 유지.
- 최적화(포맷 변환·리사이즈·`next/image`·priority)는 여기서 하지 않았다. Step 4에서 측정 근거를 확보한 뒤에 한다.

### Step 2. 서버 전용 origin env로 정리 (코드) — 완료

`src/shared/api/get-api-base-url.ts`의 서버 분기 env를 `NEXT_PUBLIC_BASE_URL` → `APP_ORIGIN`으로 바꿨다. 폴백이 같은 `localhost:3000`이라 Before 측정값에는 영향이 없다.

### Step 3. Before 측정 (측정 · 코드 변경 없음) — 완료

`APP_ORIGIN`은 build와 runtime에 같은 값을 넣는다. 미리 렌더된 결과와 요청마다 렌더되는 결과가 서로 다른 origin을 가리키면 차이의 원인을 설명할 수 없다.

```bash
APP_ORIGIN=http://localhost:3000 pnpm build
APP_ORIGIN=http://localhost:3000 pnpm start
```

확장 프로그램·캐시·로그인이 섞이지 않은 별도 브라우저 프로필에서 측정한다.

- 홈 cold load Lighthouse 5회 → FCP·LCP·CLS raw 값
- LCP element 확인
- Performance filmstrip에서 Header·`h1`·Hero 표시 순서
- Network waterfall에서 document·홈 데이터·Hero 이미지의 요청 시작 순서와 전송 크기
- `/api/products?scenario=slow`로 (a) 데이터 없는 최초 진입, (b) 기존 목록이 있는 갱신을 각각 녹화
- 검색·카테고리·정렬·페이지를 빠르게 연속 변경 → active query와 화면 일치 여부, 늦게 끝난 이전 요청이 화면을 덮는지, 취소된 요청은 어떻게 보이는지
- **Before commit SHA 기록**

여기까지 남기기 전에는 최적화 코드를 한 줄도 건드리지 않는다.

#### Before SHA가 두 개인 이유

홈과 상품 목록을 다른 날 측정해 기록된 SHA가 다르다. **두 SHA의 코드는 같다.**

| 대상      | SHA                        | 비고                                   |
| --------- | -------------------------- | -------------------------------------- |
| 홈        | `3da2db4`                  | Step 2까지 반영한 마지막 코드 커밋     |
| 상품 목록 | `342e857` + 임시 slow 패치 | `3da2db4` 바로 위의 **docs 전용 커밋** |

`git diff 3da2db4 342e857 -- . ':!docs'`가 비어 있다. 상품 목록 녹화에는 `scenario=slow`를 붙이는 임시 패치가 얹혀 있었고 이건 커밋하지 않았다(절차는 [measurement.md](measurement.md#slow-api-재현--임시-패치)).

### Step 4. 1단계 — Hero LCP — 완료

LCP를 네 구간(서버 응답 대기 / 이미지 요청 시작 대기 / 이미지 전송 / 화면에 그려질 때까지)으로 쪼개 관찰한 뒤 개입을 4건 시도했고, 그중 3건을 유지했다. 측정과 판정은 [measurement.md](measurement.md)의 "개입 1"~"개입 요약과 다음 병목"에 있다.

| 개입                         | 결과                               | 상태       |
| ---------------------------- | ---------------------------------- | ---------- |
| 1. 렌더링 경계 분리          | 초기 HTML 첫 flush에 `h1`·Header   | 유지       |
| 2. Hero 이미지 축소          | Lighthouse LCP 8,290.2 → 2,370.2ms | 유지       |
| 3. preload + `fetchpriority` | Lighthouse LCP +77.9ms 악화        | **되돌림** |
| 4. Hero 이미지·카피 분리     | 실측 LCP 586.2 → 123.2ms           | 유지       |

각 행의 시작값은 **직전 개입 상태**다. Before(`3da2db4`)는 Lighthouse LCP 8,289.6ms / 실측 662.1ms이고, Before부터의 누적 변화는 [measurement.md의 개입 요약](measurement.md#개입-요약과-다음-병목)에 있다.

개입 1은 `h1`의 소유권도 바꿨다. Step 1에서 `HeroSection`의 `banner.title`을 `h1`으로 올렸는데, 그 `h1`이 홈 데이터를 기다리는 것이 문제였다. 그래서 `HomePage`가 데이터와 무관한 시각 숨김 `h1`을 갖고 `banner.title`은 섹션 제목인 `h2`로 되돌렸다.

요구사항별 확인은 이렇다.

- 실제 표시 크기·포맷·압축률 — 컨테이너 1200px에 맞춘 `hero-1200.webp`(179KB) / `hero-2400.webp`, q92는 PSNR 47.61dB로 선택
- 시각적 크기·비율·피사체·문구 유지 — CSS를 한 줄도 바꾸지 않았다(`width: 100%`, `aspect-ratio 16/9`, 모바일 `4/5`)
- 렌더링 경계 — Header와 `h1`이 첫 flush에 나간다. `curl`로 초기 HTML에서 `h1` 1개(46,450 byte 중 1,863 byte 지점) 확인
- 페이지 설명 — **개입 4 뒤에 뒤늦게 발견해 고쳤다.** 아래 참고
- **Hero fallback의 공간 — 확인했다.** 아래 참고

#### 뒤늦게 고친 두 가지 — 페이지 설명과 섹션 이름

명세 2단계까지 끝낸 뒤 명세와 코드를 다시 대조하다 찾은 것이다. 둘 다 원인이 개입 1·4에 있다.

**페이지 설명이 첫 flush에 없었다.** 명세 84줄은 Header·`h1`·페이지 설명 셋을 요구하는데 개입 1은 `h1`까지만 꺼냈다. 설명 역할을 하던 건 `banner.description` 하나뿐이었고 그건 홈 응답에 딸려 있어 개입 4 뒤에도 카피와 함께 기다렸다. **경계가 틀린 게 아니라 페이지가 소유한 설명이 없던 것**이라, `h1`에 쓴 해법을 그대로 적용해 `HomePage`에 시각 숨김 설명을 뒀다. 화면의 설명 역할은 Hero 카피가 계속 하므로 렌더 결과는 그대로다 — Step 7의 Before/After 비교 조건을 지키려고 시각 숨김을 골랐다.

**`HeroSection`의 접근성 이름이 첫 flush에서 끊겨 있었다.** starter는 `aria-labelledby`로 카피의 `h2`를 가리켰는데, 개입 4가 카피를 `Suspense` 뒤로 보내면서 참조 대상이 초기 HTML에서 사라졌다. 이미지와 카피를 데이터 소유권으로 가른 것과 같은 이유로 섹션 이름도 데이터에서 떼어 `aria-label="추천 배너"` 정적 문자열로 바꿨다.

두 변경 모두 화면과 측정값을 바꾸지 않는다. 초기 HTML 확인은 Step 7의 `curl` 검사에서 함께 한다.

#### fallback과 layout shift 확인 결과

개입 4로 fallback의 범위가 바뀌었다. 원래는 Hero 전체(`HeroSectionSkeleton`)였는데, 지금은 이미지가 shell로 올라가고 **카피만** `HeroCopySkeleton`으로 기다린다.

- `.copy`가 `.hero` 안에서 `position: absolute`이고 `.hero`는 `aspect-ratio`로 높이가 고정이라, 카피가 교체돼도 아래 콘텐츠가 밀릴 구조가 아니다
- 트레이스에서 `LayoutShift` 이벤트 **0건**, Insights CLS **0** — Before / 개입 1 / 개입 4 모두 동일
- Lighthouse 5회에서도 CLS가 전 구간 0
- filmstrip 117.2ms(카피 스켈레톤)와 571.1ms(카피 채워짐) 두 프레임에서 사진과 카드의 위치·크기가 같다

미확인으로 남은 것 두 가지는 Step 7에서 함께 봤고 **둘 다 해소했다**([결과](measurement.md#step-7--홈-after-추가-관찰)).

- 모바일 분기(`aspect-ratio 4/5`, `object-position 56%`)는 측정하지 않았다. 모든 녹화가 데스크톱 뷰포트다 → 390 × 844에서 재측정. 비율은 의도대로 적용됐고, 대신 **표시 폭보다 과대한 이미지가 나가는 문제를 새로 발견**했다
- Layout shifts track을 캡처한 스크린샷은 없다. 근거는 트레이스 JSON의 `LayoutShift` 이벤트 0건과 Insights CLS 0이다 → 캡처로 대체 확인

### Step 5. 2단계 — 목록 6상태와 CLS — 완료

여섯 화면(최초진입 / 갱신중 / 성공+0건 / 최초실패 / 갱신실패 / 취소)이 녹화에서 구분되는지 먼저 확인했다.

**이미 만족하는 항목은 코드를 추가하지 않고 개입하지 않은 근거를 남긴다.** 과제가 명시적으로 허용한다.

- [x] Step 3 녹화와 대조해 실제로 부족한 상태만 고른다 → 갱신 실패·취소 2건만 개입
- [x] `isPending`과 `isFetching`이 각각 어떤 화면을 맡는지 설명 → [measurement.md](measurement.md#ispending과-isfetching이-각각-맡는-화면)
- [x] 취소된 요청이 오류로 보이지 않는지 별도로 관찰 → 취소 2건, 실패 알림 없음

#### 결과

Before 6건과 After 6건을 같은 절차로 녹화해 대조했다. 근거는 [After 대조](measurement.md#after-대조--여섯-화면-전부)에 있다.

| 상태       | 판정          | 개입                                                    | CLS Before → After                |
| ---------- | ------------- | ------------------------------------------------------- | --------------------------------- |
| 최초 진입  | 이미 충족     | 무개입                                                  | 0 → 0                             |
| 갱신 중    | 관찰은 충족   | **무개입**(아래 참고)                                   | 0.3671410915759678 → 동일         |
| 성공 + 0건 | 이미 충족     | 무개입                                                  | 7.256766908862576e-05 → 동일      |
| 최초 실패  | 이미 충족     | 분기만 정리                                             | 0 → 0                             |
| 갱신 실패  | **미충족**    | 개입 5 `e836a06` — 캐시의 직전 목록 유지 + 흐름 밖 알림 | 0.0003991502119214209 → **0**     |
| 취소       | **관찰 불가** | 개입 6 `c29ccaa` — `AbortSignal` 연결                   | 0.3671410915759678 → 0.4334352806 |

취소의 CLS는 개입 때문이 아니라 **조작 순서가 달라져서** 움직였다. Before는 전환 간격이 짧아 화면이 `전체 → 디지털` 한 번만 바뀌었고, After는 중간에 1,986ms를 기다려 캐주얼이 렌더됐다([근거](measurement.md#취소-cls-0433은-개입-때문이-아니다)). 이 행에서 개입의 효과를 보는 지표는 CLS가 아니라 취소 발생 여부다 — 트레이스의 `didFail`이 **0건 → 2건**으로 바뀌었다.

갱신 중 CLS 0.37은 **의도적으로 남겼다.** [반증 실험](measurement.md#6-cls-037의-원인--반증-실험)에서 원인이 공유 상품의 DOM 노드 이동임을 확정했고, 이를 없애려면 목록을 비워야 하는데 그건 명세 109줄이 금지한다. "기존 목록 유지"와 "CLS 0"이 동시에 성립하지 않으므로 명세가 요구한 전자를 택했다.

#### Step 7로 넘기는 것

- **After 뷰포트가 945×963으로 Before(945×929)와 34px 다르다.** 폭이 같아 시나리오 2의 CLS가 소수점 16자리까지 일치했지만, Step 7의 "완전히 같은 조건" 요구를 생각하면 홈 재측정 때는 창 크기를 먼저 맞춰야 한다.
- 취소 시나리오의 전환 간격이 Before(968–1,443ms)와 After(1,986–3,307ms)에서 달랐다. 재현하려면 전환 간격을 응답 시간(1.5초)보다 짧게 유지해야 한다.

### Step 6. 3단계 — metadata와 Open Graph (완료)

이번 주 신규 작업량의 대부분이다. 측정 절차와 결과는 [measurement.md의 `## metadata 증거`](measurement.md#metadata-증거)에 있다.

- [x] `getProductList`에 `getApiBaseUrl()` 적용 (선행 차단 요소) — 서버 호출이 상대경로로 실패하던 것을 풀었다
- [x] 루트 title template·공통 Open Graph 정의 — `src/shared/config/site.ts`, `app/layout.tsx`
- [x] 홈·상품 목록에 `generateMetadata` 추가, 본문 prefetch와 **같은 query factory** 사용
- [x] shallow merge로 `siteName`·`locale`·`type`이 날아가지 않게 처리 — 페이지가 `sharedOpenGraph`를 spread한다
- [x] title·description 규칙: 검색어 → title 우선, category·sort → description, 2페이지 이상 → title에 페이지 번호
- [x] 정상 empty는 0건을 설명하고 OG fallback image 유지 / query failure는 root 공통 metadata 상속
- [x] `robots: noindex` 넣지 않기 — document에서 `robots` 0건 확인
- [x] `getServerQueryClient`의 `cache()` 유지 여부 확정 — 제거(위 "판단이 갈렸던 것" 참고)
- [x] 서버 호출 계수는 임시 서버 로그로 세고 **관찰 후 계측 제거** — `pnpm exec vitest run app/api` 38건으로 원상복구 확인
- [x] 일반 UA vs `facebookexternalhit` 응답 시점 비교 — 첫 바이트 7.7ms vs 516.5ms
- [x] 초기 HTML 확인 — `curl` document와 JS 비활성 캡처 두 가지로 확인

`generateMetadata` 본체는 라우팅 파일이 아니라 `_pages` 슬라이스에 두고 라우팅 파일에서 재export했다. 상품 목록 metadata가 `productListQueryParsers`로 URL을 정규화해야 하는데 그 parser가 `_pages/product-list`의 소유이고, 라우팅 파일에 두면 슬라이스 내부 경로를 우회 import하게 되기 때문이다.

#### Step 6에서 함께 고친 것과 남긴 것

- **상품 목록 `h1`이 초기 HTML에 두 벌 실렸다.** Suspense fallback과 본문이 각각 `h1`을 가져서다. DOM에서는 React가 fallback을 걷어내 하나만 남으므로 브라우저로는 안 보이는 결함이었다. `h1`을 `ProductListPage`가 소유하도록 경계 밖으로 옮겼다.
- **상품 목록 초기 HTML에 상품 링크가 0개다.** 목록 조회가 클라이언트 전용이라 문서에 데이터가 실리지 않는다(홈은 서버 prefetch가 있어 실린다). 명세의 "초기 응답에 주요 링크와 구조"를 충족하지 못하지만, 서버 prefetch를 넣으면 2단계에서 설계한 6상태를 다시 짜야 해서 이번 범위를 넘는다. 발견 사실로 남겼다.
- `description`에 사용자가 지정하지 않은 정렬(`sort` 기본값 `latest`)까지 설명하던 것을 원본 `searchParams`에 키가 있을 때만 붙이도록 고쳤다.

### Step 7. 4단계 — After와 회귀 — 완료

Step 3과 같은 조건에서 재측정했다. **After SHA는 `a081464`**(코드는 직전 `29c7900`과 동일한 docs 전용 커밋)이고, 측정 결과는 [measurement.md](measurement.md)에 있다.

- [x] URL, 행동, viewport, throttling, 브라우저·Lighthouse 버전, cold/warm, 브라우저 프로필 동일 — `configSettings`를 리포트 JSON에서 직접 대조. **뷰포트만 Before가 미기록**이라 같다고 적을 수 없어 그대로 남겼다
- [x] **After commit SHA 기록**
- [x] LCP element, Hero 전송 크기, 요청 시작 순서, 가장 길었던 구간의 변화 비교
- [x] Step 4에서 미확인으로 남긴 두 가지 → 위 "fallback과 layout shift 확인 결과" 참고
- [x] 회귀 확인 → [Step 7 — 회귀 확인](measurement.md#step-7--회귀-확인). URL 복원 4종·뒤로/앞으로, Header 개수, 로딩·에러·빈 상태·재시도, 이미지 품질 전부 통과
- [x] FSD 의존 방향과 Public API 우회 여부 확인 — lint 통과, `boundaries` 예외 0건, 우회 import 0건. `eslint-disable`은 `HeroSection.tsx`의 `@next/next/no-img-element` 1건(의도적 예외)
- [x] 효과가 없거나 악화된 변경은 되돌리거나 유지 이유 기록 — 개입 3(preload)은 되돌렸고, 갱신 중 CLS 0.37은 유지 근거를 남겼다
- [x] `pnpm test`, `pnpm check` 통과 확인 — `pnpm check` 통과, E2E 35/36(WebKit 1건은 6주차부터 기록된 플래키)

#### Step 7에서 새로 나온 것

측정을 끝내는 단계인데 개선 후보가 두 개 나왔다. **둘 다 고치지 않았다** — 코드를 바꾸면 After SHA가 무효가 되기 때문이다.

- **모바일에 과대한 이미지가 나간다.** Step 4에서 데스크톱 표시 폭(1200px)만 기준으로 후보를 만들었다. 600w 후보를 하나 추가하면 풀린다
- **다음 병목은 폰트다.** Hero를 줄이자 전송량의 79%가 폰트가 됐다. 이번 주 범위 밖이다

`generateMetadata`가 prefetch 시작을 94.1ms → 109ms로 밀었다는 관찰도 남겼다. FCP는 오히려 좋아졌고 원인은 확정하지 못했다.

#### Step 9(셀프 리뷰)에서 After SHA 이후에 고친 것

측정이 끝난 뒤 셀프 리뷰에서 상품 목록의 결함을 하나 찾아 고쳤다. **After SHA `a081464` 이후의 코드 변경**이므로 그 사실과 측정 유효성 판단을 함께 남긴다.

`ProductListResults`가 최초 로딩(`isPending`) 중에도 폴백 목록이 있으면 skeleton 대신 그것을 그렸다. 다른 조건의 캐시가 남아 있는 상태로 목록에 처음 진입하면 주소창은 새 조건인데 화면은 이전 조건의 목록이고, `isPlaceholderData`가 false라 로딩 표시도 실패 알림도 없다. 2단계 완료조건("현재 URL의 active query와 화면이 같아야", "최초 진입에는 목록 크기를 예상할 수 있는 pending UI")에 걸린다. 재현 경로는 `/products` 방문 → 홈 → 홈의 카테고리 링크(`/products?category=…`)다.

**측정값은 유효하다.** 6상태 녹화는 전부 화면 안에서 조건을 바꾼 경우(같은 observer)라 이 경로를 지나지 않는다. 변경은 `isPending` 분기 하나이고 `placeholderData` 전환·갱신 실패·취소·0건 경로의 동작은 그대로다.

이 결함이 측정과 리뷰에서 안 잡힌 이유는 상태별 분기에 테스트가 없었기 때문이라, 같이 `ProductListResults.test.tsx`에 4분기 테스트를 추가했다. 최초 진입 + 캐시 케이스는 수정 전 실제로 실패한다.

### Step 8. Advanced A (선택) — 완료

Basic 완료 후, 실제 클릭에서 관계없는 카드 렌더 병목이 확인될 때만 진행한다.

상세 절차, 트레이스 수치, Profiler 근거와 캡처는 [Advanced A — INP 측정 및 개선](advanced-a-inp.md)에 분리해 기록한다.

- `/performance-lab/inp?pageSize=24`, 이미지 로드 완료 후 같은 상품 찜 버튼 1회 클릭
- production build + CPU 4x slowdown, Before/After 각 3회
- Interactions track: input delay / processing duration / presentation delay
- React Profiler로 렌더 범위와 변경 원인 확인. profiling build는 Next 16에서 Profiler가 열리지 않아 `pnpm exec next dev --webpack`으로 대체했고, 시간은 production build에서만 비교
- 금지: `pageSize` 축소, 필수 계산 제거, `setTimeout`으로 갱신 지연

실제 측정에서 관계없는 카드 렌더 병목이 확인됐다.

| 항목                | Before                       | After                          |
| ------------------- | ---------------------------- | ------------------------------ |
| 렌더된 카드         | 24장 (`p1`~`p24`)            | 누른 카드 1장 (`p1`)           |
| INP 중앙값          | 107.2ms                      | 35.6ms (`−67%`)                |
| processing 중앙값   | 79.26ms                      | 8.59ms (`−89%`)                |
| input delay 중앙값  | 1.04ms                       | 0.88ms                         |
| presentation 중앙값 | 25.89ms                      | 25.54ms                        |
| selector            | `wishlistIds` 배열 전체 구독 | 카드별 `selected` boolean 구독 |

Before Profiler에서 `SyncExternalStore` 변경으로 24장이 모두 렌더되는 것을 확인한 뒤에만 selector를 변경했다. After에서는 누른 카드 1장만 렌더됐고, 감소한 총 71.6ms 중 70.7ms가 processing에서 나왔다. input delay와 presentation delay는 거의 그대로라 변경 효과가 렌더 처리 구간에 집중됐다는 해석과 맞는다.

측정, 개입, 최종 검증을 모두 마쳤다.

- [x] After Profiler의 `Why did this render?` 캡처 — `p1` 한 장만 렌더, 원인 문구는 Before와 동일
- [x] 뷰포트 값 기록 — 960 × 929, dpr 1
- [x] 카드 24장·필수 계산·즉시 피드백·복수 카드 상태 회귀 확인 — 4항목 전부 통과
- [x] `pnpm lint && pnpm exec tsc --noEmit` — 통과
- [x] Advanced A After SHA 기록 — **`f50b925`** (Before `8aa15c5`)

## 측정 기록

측정 조건, Lighthouse 5회, LCP 구간 분해, filmstrip 표시 순서, 목록 6상태, metadata 증거는 [measurement.md](measurement.md)에 있다. Step 3과 Step 7에서 같은 표를 채운다.

---

이 문서는 Claude(AI)가 `docs/assignments/week-07.md`와 현재 레포 상태를 대조해 작성했다.

명세 2단계까지 끝난 시점에 Claude(AI)가 명세·plan·measurement·코드를 다시 대조해 어긋난 기술을 고쳤다. `h1` 소유권이 Step 4에서 되돌아간 사실, 개입 표의 시작값이 Before와 직전 개입을 섞어 쓰던 것, 취소 행의 CLS 자리에 `didFail`이 들어가 있던 것, Before SHA가 둘인 이유, Step 3의 완료 표시가 그 대상이다. 수치는 새로 측정하지 않았고 기존 측정 기록에 있던 값을 옮겼다.
