# 7주차 — 측정으로 내린 판단들

<!-- AI 초안 -->

Before는 `c572ae2`, After는 `268acdc`다. 둘 다 production build(`APP_ORIGIN=http://localhost:3000 pnpm build && pnpm start`)에서 측정했고 조건은 같다. Lighthouse 13.4.1 CLI, Chrome 151 headless, 모바일 에뮬레이션 412×823, 시뮬레이트 스로틀링(RTT 150ms · 1474.56Kbps · CPU 4x), 매회 새 임시 프로필, 홈 cold load 5회.

## Before가 말해준 것

LCP 5회가 40678, 40662, 40662, 40662, 40662ms. 중앙값 40.7초에 편차가 16ms뿐이라 측정이 흔들려서 나온 숫자가 아니다. FCP는 904ms로 멀쩡했고 CLS는 0이었다.

waterfall을 보면 원인이 두 개로 갈린다. document는 4ms에 도착하는데 hero 이미지 요청은 599ms에야 시작된다. 이미지가 `useQuery` 성공 뒤에 렌더되는 컴포넌트 안에 있어서, `/api/home`(mock 지연 500ms)이 끝나기 전에는 브라우저가 이미지의 존재를 모른다. Lighthouse도 같은 걸 지적했다(`discoverable in initial document: false`). 요청이 시작된 뒤에는 7,369KB 전송이 남는다. 1474.56Kbps에서 약 39초. LCP 40.7초의 대부분은 이거다.

그래서 순서를 정했다. 전송이 지배 구간이니 이미지 크기부터, 그다음 발견 지연.

## Hero — 이미지를 바꾼 게 아니라 경계를 옮겼다

전송 쪽은 `next/image`로 srcset을 만들었다. 모바일 뷰포트(412px, DPR 1.75)면 실제 필요한 폭이 720px 정도라 750w 후보가 내려간다. 같은 원본에 q75, 전송 32KB. 크기·비율·피사체·문구는 그대로다. 품질을 낮춰 숫자만 만든 게 아닌지 스크린샷으로 대조했다.

발견 쪽은 코드 위치의 문제였다. 이미지 URL은 정적이고 h1 문구도 데이터가 필요 없는데, 배너 문구(서버 소유)와 같은 컴포넌트에 묶여 쿼리를 기다리고 있었다. HeroSection을 쿼리 밖으로 빼고 배너 문구만 쿼리를 구독하게 바꾸니 정적 셸에 img와 preload가 들어가고, 요청 시작이 599ms에서 43ms가 됐다. 6주차에 소유권 기준으로 파일을 나눴는데 같은 기준이 렌더링 경계에도 그대로 적용됐다.

1단계 결과는 LCP 2,913ms(범위 2760–3082). 이때 CLS가 0.003 생겼다. 배너 문구가 도착하면서 copy 박스가 위로 몇 px 늘어나는 1회성 shift였고, 0.1 임계의 3%라 그대로 뒀다. 이 판단은 3단계에서 공짜로 해결된다.

## 목록 — 여섯 화면과 안 한 것들

Before 녹화에서 두 가지가 보였다. 최초 진입 pending이 "불러오는 중…" 한 줄이라 목록 크기를 예상할 수 없고, 조건을 바꾸면 기존 목록이 통째로 사라졌다가 다시 그려진다.

그래서 두 가지만 넣었다. 실제 그리드와 같은 비율의 스켈레톤 12칸, 그리고 `keepPreviousData`. `isPending`(보여줄 데이터가 없다)이 스켈레톤을, `isFetching`(요청이 돌고 있다)이 "갱신 중…" 표시를 맡는다. 실패도 같은 축으로 갈린다. 보여줄 데이터가 없으면 실패 안내로 교체하고, 있으면(같은 키 refetch 실패) 목록을 유지한 채 배너를 띄운다.

조건 변경 후의 실패는 고민하다가 교체 쪽으로 정했다. 이전 조건의 목록을 유지하면 URL은 새 조건인데 화면은 옛 조건이 된다. URL과 화면의 일치를 우선했다.

취소는 손대지 않았다. 키가 바뀌면 이전 요청은 자기 키의 캐시로만 저장되고 화면은 active key만 렌더한다. price-asc로 바꾸고 120ms 뒤 price-desc로 바꿔도 최종 화면과 URL이 일치하는 걸 확인했다. AbortSignal을 붙이면 낭비 요청은 줄지만 화면 기준으로는 이미 문제가 없고, slow가 mock 전용인 상황에서 코드를 늘릴 이유가 없다고 봤다. prefetch류도 같은 이유로 뺐다.

스켈레톤 교체가 shift를 만드는지 목록 페이지로 3회 쟀다. CLS 0.000.

## metadata — 같은 것을 두 번 부르지 않는 근거

`generateMetadata`가 실데이터를 쓰려면 서버에서 Route Handler를 불러야 한다. 상대경로 fetch는 서버에서 안 되니 `APP_ORIGIN`으로 절대화했다. 과제가 왜 APP_ORIGIN을 build와 runtime에 같게 두라고 했는지 여기서 이해했다.

metadata와 본문이 다른 데이터를 보면 안 되니까 정규화와 query factory를 하나로 뒀다. nuqs 파서를 `nuqs/server`에서 정의해 클라이언트 훅과 서버 `loadProductFilters`가 같은 파서를 쓴다. 잘못된 값은 양쪽에서 같은 기본값이 되고, 결과적으로 같은 query key와 같은 GET URL이 나온다.

`getQueryClient()`는 과제 계약대로 호출마다 새로 만든다. 그러면 generateMetadata와 본문 prefetch가 fetch를 두 번 하는 셈인데, 정말 두 번 나가는지 Route Handler에 임시 로그를 심어 세봤다. 문서 1회 요청에 호출 1회, 문서를 다시 요청하면 +1. 같은 render 안에서 URL·options가 같은 native fetch는 Next가 memoize한다는 것, 그리고 그 범위가 request라는 걸 숫자로 확인했다. 로그는 확인하고 지웠다.

shallow merge는 페이지 openGraph가 루트 openGraph를 통째로 덮는 문제다. siteName·locale·type을 공통 객체로 빼서 페이지가 스프레드하게 했고, document에서 og:site_name이 살아있는 걸 확인했다.

fallback은 두 종류를 구분했다. 정상 empty(`?q=zzz`)는 조건과 0개를 설명하는 title·description에 fallback og:image를 유지한다. 조회 실패는 APP_ORIGIN을 `127.0.0.1:9`로 두고 build+start 해서 재현했는데, 페이지별 빈 값이 아니라 루트 metadata가 그대로 상속된다. 둘이 다른 화면인 걸 document로 확인했다.

일반 UA와 `facebookexternalhit`로 `time_starttransfer`를 비교했더니 차이가 없었다(둘 다 약 513ms). 크롤러만 기다리는 게 아니라 본문 prefetch가 같은 fetch를 기다리기 때문에 문서 자체가 API 완료 후에 나간다. 뒤집으면 metadata만의 추가 비용은 0이라는 뜻이다.

## 비용과 숨기지 않을 것들

홈이 정적에서 동적이 되면서 document TTFB가 1ms에서 517ms가 됐다. 이번 주 가장 큰 비용이다. 최종 LCP는 3,073ms(범위 3064–3222)로 1단계보다 160ms 느는 데 그쳤다. 발견이 더 빨라졌고(5ms) hydration으로 클라이언트 첫 API 왕복이 사라져 상쇄된 결과다. 얻은 것은 실데이터 metadata, JS 없이도 내용이 있는 초기 HTML, 직접 진입 시 스켈레톤 없이 뜨는 목록, 그리고 CLS 0 복귀다(배너 문구가 SSR에 포함되니 1단계의 copy 박스 shift가 사라졌다). 같은 조건 5회의 범위가 158ms니 160ms는 사실상 측정 범위 언저리고, 유지가 맞다고 판단했다.

부끄러운 것도 적는다. OG fallback 이미지를 hero 원본으로 지정해놓고 한참 뒤에야 알았다. LCP에서 쫓아낸 7.5MB를 크롤러한테 주고 있던 셈이다. 16KB 배너 이미지로 바꿨다.

재현 환경에서는 두 번 헤맸다. 자동화 탭이 비포커스면 TanStack이 재시도를 일시정지해서(focusManager) 에러 화면이 안 나왔고, DevTools 방식 스로틀은 localhost에서 대역폭 제한이 덜 걸려 LCP가 3.7초로 나왔다. 수치는 시뮬레이트 5회로 통일하고 devtools trace는 요청 순서 확인용으로만 남겼다.

되돌린 변경은 없다. 회귀는 4단계에서 확인했다. URL 복원, 뒤로/앞으로, 배지, 상태 화면들, FSD 의존 방향과 Public API 우회 여부(grep 전수 0건), pnpm check 41개. metadata 도입 후로는 조건 변경에 서버 데이터가 같이 흘러서 브라우저 fetch 주입으로는 목록 에러가 재현되지 않는다. 검증 주입 지점이 서버로 옮겨간 것이고, 실제 장애라면 서버 prefetch도 실패하고 클라이언트 fetch도 실패하니 기존 분기가 그대로 동작한다.

## 남긴 것

Advanced A(INP)는 착수하지 않았다. 데스크톱 고DPR에서는 srcset이 3840 후보까지 고를 수 있는데, sizes 1200px에 DPR 2면 2400px가 필요해 2048 다음 후보로 가는 것이라 과대 전송은 아니지만 측정 기준(모바일)과 다른 조건이라 적어둔다. 단계별 상세와 원본 수치는 `docs/perf/`의 문서 다섯 개에 있다.
