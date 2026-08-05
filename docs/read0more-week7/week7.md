
## 🧭 0단계 — 측정 조건을 고정하고 Before를 남기기

**before commit SHA**: a0dfbfe17d5cbfafc2660ca29bab30de63cf21f1
**After commit SHA**: After 적용 후 기재

**Lighthouse 측정 조건**
- viewport: 모바일 412×823 (Lighthouse 모바일 기본 프리셋)
- CPU: 4x slowdown
- network: Fast 4G, Disable cache 체크
- 실행 환경: `pnpm build && pnpm start`
- 도구: Lighthouse 5회 지표 FCP·LCP·CLS raw 5회 + 중앙값 + 최소 + 최대
- 크롬 게스트 프로필로 측정하여 extension들 영향 안받게

### Lighthouse FCP, LCP, CLS 5회 측정 값

| 지표 | raw값 | 중앙값 | 최소 | 최대 |
| --- | --- | --- | --- | --- | 
| FCP | 0.5s, 0.5s, 0.5s, 0.5s, 0.5s | 0.5s | 0.5s | 0.5s |
| LCP | 8.5s, 8.5s, 8.5s, 8.5s, 8.5s | 8.5s | 8.5s | 8.5s |
| CLS | 0, 0, 0, 0, 0 | 0 | 0 | 0 |

### LCP element, Performance filmstrip의 Header·페이지 제목·Hero 표시 순서, Network waterfall의 document·홈 데이터·Hero 이미지 요청 시작 순서와 전송 크기

**LCP element**

![LCP element](images/LCP_element.jpg)

**Performance filmstrip**

![Performance filmstrip](images/performance_filmstrip.jpg)

**Network waterfall의 document·홈 데이터·Hero 이미지 요청 시작 순서와 전송 크기**
| 항목       | 요청 시작 순서 | 전송 크기 | 비고                                                                                 |
| -------- | -------- | ----: | -------- |
| document | 1        | 8.2 KB | -                                                    |
| 홈 데이터    | 확인 불가 | - | React Query prefetch(dehydrate)로 서버에서 조회되어 브라우저 Network Waterfall에는 별도 요청이 나타나지 않음 |
| Hero 이미지 | 2       | 7.5 MB | - |


### 관찰한 사실, 원인 가설, 가설을 반증할 방법, 먼저 시도할 가장 작은 변경
| 관찰한 사실 | 원인 가설 | 가설을 반증할 방법 | 먼저 시도할 가장 작은 변경 |
| --- | --- | --- | --- |
| LCP로 인하여 Performance 점수가 크게 떨어짐 | hero image의 큰 용량으로 인하여 인터넷 속도가 느리다면 사용자가 이미지를 보는데 큰 시간이 소요됨  | 용량이 작은 이미지를 변경해 보고 재측정 | next/image를 사용하여 이미지 사이즈를 줄여보기 |

### /api/products?scenario=slow에서 이전 요청이 늦게 끝나도 현재 화면을 덮지 않는지 확인 녹화
- docs/read0more-week7/recordings/step0_race_condition_check.webm

## 🖼️ 1단계 — Hero의 실제 LCP 병목을 줄이기

### LCP를 서버 응답 대기, 이미지 요청 시작 대기, 이미지 전송, 화면에 그려질 때까지의 시간으로 나눠 관찰

![LCP breakdown](images/LCP_breakdown.jpg)
- Time to first byte = 서버 응답 대기
- Resource load delay = 이미지 요청 시작 대기
- Resource load duration = 이미지 전송
- Element Render delay = 화면에 그려질 때까지의 시간

### 실제 표시 크기와 viewport에 맞는 이미지 후보·포맷·압축률을 선택하고, 불필요하게 큰 이미지가 내려가지 않게

**표시 크기 (HeroSection.module.css 확인)**
- hero는 컨테이너 100% 폭으로 렌더되며 데스크탑은 컨테이너 max-width 1280px, 모바일은 100vw.
- 비율은 `aspect-ratio: 16/9`(모바일 `4/5`), `object-fit: cover`

**필요 해상도 판단**
- 데스크탑: CSS 표시 폭은 최대 1280px. 단 레티나 등 DPR이 높은 화면도 고려. DPR 2면 이론상 1280×2 = 2560px가 필요하다. 다만 2560px를 그대로 내리면 전송이 과하므로, 중간치인 1920로 시도.
- 모바일: 모바일 기기는 일반적으로 DPR이 2~3이라 실제 필요 픽셀이 큼(예: 390px × DPR 3 ≈ 1170px, 큰 폰도 ~1290px). 즉 모바일 최대 필요치도 데스크탑 CSS 폭(1280)과 비슷한 수준이라 1280 이하 후보로 커버
- 결론: 모바일(≤~1290) ~ 고DPR 데스크탑(~1920)까지의 필요 픽셀을 하나의 srcset 후보 세트(640·828·1080·1280·1920)로 함께 커버하고, 브라우저가 각 기기의 폭×DPR에 맞는 최소 후보를 고르게

**결정 사항**

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 해상도 후보 | 640 / 828 / 1080 / 1280 / 1920 px | 표시 폭 × DPR. 고DPR 데스크탑은 이론상 2560px지만 전송 절충으로 상한 1920px. |
| `sizes` | `(min-width: 1280px) 1280px, 100vw` | 컨테이너 1280 캡, 그 아래는 뷰포트 100% |
| 포맷 | AVIF 우선, WebP fallback (미지원 시 JPEG) | 동일 화질에 JPEG 대비 50%+ 작음 |
| 압축률(quality) | 75(default) | default값인 만큼 hero 사진 기준 화질 손실 미미할 것으로 예상. 실무였다면 디자이너와 같이 육안으로 확인해 봤을듯 합니다. |
| 큰 이미지 방지 | 위 후보 + `sizes`로 뷰포트·DPR에 맞는 최소 이미지만 다운로드 | — |

### Hero 이미지가 언제 발견되어 요청되는지, 이 페이지에서 요청 우선순위를 높일 이유가 있는지
- 발견 시점: hero는 홈 데이터(~500ms) 대기 뒤 `Suspense` 경계 안에서 렌더되므로, 진입 즉시가 아니라 **경계가 스트리밍되는 ~500ms 뒤에 발견·요청**된다. (홈 HTML상 hero preload `<link as=image>`가 초기 `<head>`가 아니라 Suspense fallback보다 뒤에 방출됨 → LCP breakdown의 ② load delay ≈ 524ms와 일치.) 정적 hero를 셸(경계 밖)으로 빼면 초기 `<head>`에서 즉시 발견되게 만들 수 있다.
- hero는 화면 최상단 **LCP 요소**라 늦게 받으면 LCP가 곧바로 늦어지므로, 다른 리소스에 밀리지 않게 우선순위를 높일 이유가 있다. 따라서 `next/image`의 `priority`를 적용. `priority`는 `fetchpriority="high"`(다른 리소스보다 먼저 요청) + `preload`(img 태그 파싱 전에 미리 발견) + `eager`(lazy 로딩 해제)를 한 번에 적용한다.

### Hero의 시각적 크기, 비율, 주요 피사체와 문구를 유지, 이미지를 작게 보이게 하거나 품질을 낮춰 수치만 줄이지 않게
- 크기, 비율, 주요 피사체와 문구를 유지 하였으며, 품질의 경우 next/image의 사용 시 default값(75)으로 사용

### 홈 데이터를 기다리는 동안 Header, 하나의 h1, 페이지 설명까지 함께 막히지 않도록 현재 데이터 소유권에 맞는 렌더링 경계를 선택
- 기존 구조 그대로 만족하여 따로 수정하지 않음. Header는 `Suspense` 밖(셸)이라 안 막히고, 느린 홈 데이터는 이를 소유한 `HomeSection`만 `<Suspense>`로 격리

### Hero fallback은 실제 Hero와 같은 공간을 차지하게 하고, 교체 때 아래 콘텐츠가 밀리지 않는지 Layout shifts track으로 확인
- fallback 추가 후에도 Lighthouse로 CLS 0임을 확인
- fallback 추가 방식에 대한 추가설명: `<Suspense fallback={<><HeroSkeleton /><p className={layout.status}>홈 데이터를 불러오는 중…</p></>}>` 와 같이 hero와 그 외의 부분을 묶은 fallback을 사용. 그 이유로는 현재 `/api/home`이 배너·리스트를 한 응답으로 내려주므로 두 경계로 나눠도 같은 응답에 함께 풀려 이득이 없다고 판단하여 단일 Suspense fallback을(HeroSkeleton + 텍스트) 선택. 실무라면 별도 API 분리를 요청 하여 요청이 수용 될 경우는 Suspense 경계를 따로 지정했을 것으로 예상

### LCP의 병목 구간과 선택한 변경의 인과관계
- 병목 구간과 근거 수치: [LCP 4구간 관찰](#lcp를-서버-응답-대기-이미지-요청-시작-대기-이미지-전송-화면에-그려질-때까지의-시간으로-나눠-관찰) 참조 — 이미지 전송(Resource load duration) 7,904ms가 LCP의 93%를 차지 하므로 이 전송 구간이 LCP의 병목.
- 선택한 변경: [이미지 후보·포맷·압축률](#실제-표시-크기와-viewport에-맞는-이미지-후보포맷압축률을-선택하고-불필요하게-큰-이미지가-내려가지-않게) · [발견/요청·우선순위](#hero-이미지가-언제-발견되어-요청되는지-이-페이지에서-요청-우선순위를-높일-이유가-있는지) 참조 — next/image로 표시 폭·DPR에 맞는 srcset(640~1920) + AVIF/WebP + quality 75, LCP 요소라 `priority` 적용.
- 인과관계: 병목 구간이 이미지 전송 이므로 전송 바이트 자체(7.5MB→수십KB)를 줄인 것이 LCP 하락을 위한 작업.

### Lighthouse FCP, LCP, CLS 5회 측정 값 after

| 지표 | raw값 | 중앙값 | 최소 | 최대 |
| --- | --- | --- | --- | --- | 
| FCP | 0.5s, 0.5s, 0.5s, 0.5s, 0.5s | 0.5s | 0.5s | 0.5s |
| LCP | 1s, 1s, 1s, 1s, 1s | 1s | 1s | 1s |
| CLS | 0, 0, 0, 0, 0 | 0 | 0 | 0 |

**before와 비교하여 FCP 8초 감소, hero에 대한 fallback 추가후에도 CLS 0임을 확인**

### LCP를 서버 응답 대기, 이미지 요청 시작 대기, 이미지 전송, 화면에 그려질 때까지의 시간으로 나눠 관찰 after

![LCP breakdown](images/LCP_breakdown_after.jpg)

**before와 비교하여 Resource load duration 7904ms -> 530ms로 감소, 다만 Element Render delay가 37ms -> 62ms로 미세하게 상승**

## ⏳ 2단계 — 최초 pending, 목록 갱신, CLS를 나눠 다루기

### 2-1 slow API의 1.5초 지연은 그대로 두고, 데이터가 없는 최초 진입에는 실제 목록 크기를 예상할 수 있는 pending UI를 보여주기
- before: **수정 필요.** 최초 pending 은 텍스트 안내(`상품 목록을 불러오는 중…`)뿐이라 실제 목록 크기를 예상하지 못함.
- after: **스켈레톤 도입.** `ProductListSkeleton`를 `products/page.tsx` Suspense fallback + `ProductList` isPending 에 적용. 
- 영상: `docs/read0more-week7/recordings/step2-1-무데이터-최초진입-스켈레톤.webm`.

### 2-2 기존 목록이 있을 때 검색·카테고리·정렬·페이지 조건을 바꾸면 목록을 즉시 비우지 않고 갱신 중임을 보여주기
- before: **이미 적용됨.** `placeholderData: keepPreviousData` + 전환 중 `isPlaceholderData` 로 이전 목록을 흐리게 유지.
- after: 코드 변경 없음(이미 적용). 이전 목록 유지+흐림 재확인.
- 영상: `docs/read0more-week7/recordings/step2-2-기존목록-갱신중-흐림.webm`

### 2-3 표에 적은 사용자 관찰 기준을 먼저 만족시키고, isPending과 isFetching이 각각 어떤 화면을 맡는지 설명하고, 최초 실패·기존 목록 갱신 실패·빈 결과·취소된 요청을 구분하기
- before:
  - `isPending`(캐시된 데이터가 없고 첫 fetch 중일 때 true): **상품 목록을 불러오는 중…** 화면을 출력할 때 사용.
  - `isFetching`(첫 로드든 background 재요청이든 fetch 가 진행 중이면 true) 은 **사용하지 않음.**
  - 최초 실패 = **이미 적용**.
    - 5xx(일시적 서버 실패) → `error.tsx` 세그먼트 경계로 올려 "다시 시도" 버튼 제공(헤더·필터 유지). 재시도하면 성공할 수 있으니 버튼이 의미 있음.
    - 4xx(잘못된 조회 조건) → 목록 자리에 인라인 안내만. **요청 조건 자체가 틀린 것(앱↔서버 계약 불일치)이라 같은 요청을 재시도해도 똑같이 4xx → 재시도가 무의미**하다고 생각했기 때문. 고치려면 재시도가 아니라 조회 조건(URL/필터)을 바꿔야 하므로, 재시도 버튼을 주는 `error.tsx` 경계로 올리지 않고 `isError`를 이용하여 인라인 안내로 끝냄.
  - 기존 목록 갱신 실패 = **수정 필요.** (기존 목록 stale 유지되나 인라인 실패 표시·재시도 없음).
  - 빈 결과 = **이미 적용.**
  - 취소 = **이미 적용.** (취소된 이전 요청이 화면 안 덮음)
- after:
  - 최초 실패: 목록이 한 번도 안 뜬 채 첫 로드 실패 → `error.tsx` "다시 시도"(헤더·필터 유지) 확인.
  - 기존 목록 갱신 실패: **기존 목록을 유지한 채 인라인 배너("목록을 갱신하지 못했습니다." + 다시 시도→`refetch`)** 표시.
  - 빈 결과: "검색 결과가 없습니다." 확인.
  - 취소: 검색어 race(스탠리→가디건)로 늦은 응답이 현재 화면 안 덮음 확인.
- 영상:
  - 최초 실패: `docs/read0more-week7/recordings/step2-3-최초실패.webm`
  - 기존 목록 갱신 실패: `docs/read0more-week7/recordings/step2-3-갱신실패.webm`
  - 빈 결과: `docs/read0more-week7/recordings/step2-3-성공-0건.webm`
  - 취소: `docs/read0more-week7/recordings/step2-4-검색어-race-취소.webm`

### 2-4 서버 응답을 바꾸는 URL 조건을 query key와 실제 GET 요청에 함께 넣고, 현재 URL의 active query와 화면 결과가 일치하며, 이전 요청이 늦게 끝나도 현재 화면을 덮지 않기
- before: **이미 적용됨.** `normalizeProductListQuery` 결과를 queryKey·GET 양쪽에 동일하게 사용. 늦게 온 이전 요청은 현재 activeQuery 키에만 반영되어 화면을 덮지 않음.
- after: 2단계 상태에서도 검색어 race 로 재확인. A(스탠리)·B(가디건) 요청 겹침, 최종 URL=`?q=가디건`·화면=가디건 결과, 늦은 A 응답이 화면 안 덮음.
- 영상: `docs/read0more-week7/recordings/step2-4-검색어-race-취소.webm`

### 2-5 서버 응답을 Zustand나 별도 로컬 상태에 복사하지 않기
- before: **이미 적용됨.** 목록은 `useQuery` 결과를 그대로 사용, 별도 상태 복제 없음.
- after: 코드 변경 없음.

### 2-6 fallback과 실제 콘텐츠가 바뀔 때 CLS가 생기지 않는지 녹화와 Layout shifts track으로 확인하기
- before: **수정 필요.** 실제 목록 크기를 예상할 수 있는 pending UI 미구현. 실제 상품 목록으로 교체 시 CLS 확인 대상.
- after: 스켈레톤이 카드 grid + "총 N개" 줄 공간까지 처리. CLS 0 확인(크롬 DevTools의 performance탭에서 확인).
- 영상: `docs/read0more-week7/recordings/step2-1-무데이터-최초진입-스켈레톤.webm`, `docs/read0more-week7/recordings/step2-2-기존목록-갱신중-흐림.webm`

