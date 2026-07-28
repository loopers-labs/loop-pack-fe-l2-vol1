# 5주차 설계 판단 기록

> 멘토님께 "이건 이렇게 고민해서 이렇게 개발했다"를 전달하려고, 이번 주 개발하면서 갈렸던 판단들과 그 근거를 정리했습니다. 정답을 정리한 문서라기보다, 제가 어디서 멈춰서 무엇을 기준으로 골랐는지를 남긴 기록입니다.

## 0. 배선: QueryClient를 어디서 만들까

처음엔 SPA에서 하던 대로 `layout.tsx`에 `QueryClientProvider`를 바로 감싸려고 했는데 두 군데서 막혔습니다.

- `layout.tsx`는 Server Component라 Context 기반 Provider를 직접 못 넣는다 → `'use client'` 붙인 `providers.tsx`를 따로 만들고 layout은 서버로 유지했습니다. layout 전체에 `'use client'`를 붙이는 대신 Provider만 클라이언트로 내려서 Client 경계를 최소화하는 쪽이 컨벤션과도 맞다고 판단했습니다.
- QueryClient를 모듈 최상단에서 만들면 서버에서 요청 간 캐시가 공유될 수 있고, 컴포넌트 안에서 그냥 만들면 리렌더마다 새로 생긴다 → `useState(() => new QueryClient())`로 "컴포넌트 생애당 1개"를 만들었습니다.

`useState`로 감싸는 게 파생값 계산이 아니라 인스턴스를 한 번만 만들기 위한 용도라, 프로젝트의 "useMemo는 실측 성능 문제 시에만" 규칙과는 결이 다른 경우라고 봤습니다.

## 1. 홈 데이터를 컴포넌트로 어떻게 넘길까 (`select` vs page에서 뽑기)

`homeQueries.detail()`에 `select`를 넣어 가공할지, page에서 `data`를 구조분해해 넘길지 고민했습니다.

- 처음엔 `select`가 더 정석처럼 보였는데, `select`의 이득이 "여러 컴포넌트가 같은 쿼리에서 다른 조각만 구독해 리렌더를 격리"하는 상황이라는 걸 알게 됐습니다.
- 홈은 `banner·categories·popularProducts·newProducts`를 한 컴포넌트에서 전부 그려서 소비처가 하나라, 격리 이득이 없고 기계장치만 늘어난다고 판단했습니다.
- 그래서 지금은 page에서 뽑는 쪽을 택했습니다. 나중에 홈·상품목록에서 같은 변환이 반복되면 그때 `select`나 공용 매퍼로 올릴 생각입니다.

부수적으로, `Product`가 `ProductCardItem`의 필드를 다 갖는 상위 타입이라 별도 매퍼 없이 그대로 `ProductGrid`에 넘어가는 걸 확인해서, 지금은 변환 함수를 만들지 않았습니다.

## 2. 로딩·에러를 어디서 처리할까 (`useQuery` → `useSuspenseQuery`)

`useQuery`로 붙였더니 `data`가 로딩·에러 중엔 `undefined`라, 구조분해할 때마다 `!data` 가드가 필요했습니다. 훅 호출부에서 바로 구조분해하니 첫 로딩 렌더에서 크래시도 났습니다.

- **변경 전**: 본문에서 `isLoading` / `isError` / `!data`를 매번 분기
- **변경 후**: `useSuspenseQuery`로 바꿔 `data`를 항상 확정으로 두고, 로딩은 `loading.tsx`(Suspense 경계), 에러는 `error.tsx`(ErrorBoundary)에 맡김

로딩·에러 UI가 컴포넌트 밖으로 빠지니 본문이 데이터 렌더링에만 집중하게 됐고, "라우트 단위 로딩/에러는 loading.tsx·error.tsx 우선"이라는 컨벤션과도 맞았습니다. 다만 이게 항상 옳다기보다, 이 화면은 라우트 전체가 홈 데이터에 의존해서 경계로 빼는 게 자연스러웠다고 봅니다.

## 3. 빈 상태를 어떻게 보여줄까 (섹션 숨김 vs 빈 상태 메시지)

`scenario=empty`처럼 상품이 빈 경우를 처음엔 "표시할 상품이 없어요" 메시지로 처리했는데, 섹션째 숨기는 게 낫지 않나 하는 의문이 들었습니다.

기준을 이렇게 나눴습니다.

- 홈의 인기·신상품은 사용자가 조회한 결과가 아니라 시스템이 큐레이션한 섹션이라, 비면 섹션째 숨기는 쪽으로 정했습니다(`filter`로 빈 섹션 제거).
- 반대로 상품 목록 페이지의 검색·필터 결과는 사용자가 직접 조회한 행위라, 피드백이 필요하니 명시적 빈 상태를 보여줄 생각입니다.

같은 "빈 배열"이라도 그게 큐레이션인지 조회 결과인지에 따라 처리를 반대로 가져가는 게 맞다고 판단했습니다.

## 4. 배너 이미지를 어디에 어떻게 넣을까 (인라인 style vs CSS)

`HeroBanner`에 `banner.image`를 배경으로 붙이면서, 이미지가 없을 때 기존 회색 배경은 그대로 두고 싶었습니다. 두 가지를 정리했습니다.

- **동적 URL은 인라인 style로**: 이미지 URL은 데이터에서 오는 값이라 CSS 모듈(정적)에 박을 수 없어서, `style`로 넣는 게 이 경우엔 맞다고 봤습니다.
- **없을 때 회색 유지**: 처음엔 `style={{ backgroundImage: url(...) }}`를 항상 렌더했는데, 이러면 이미지가 비었을 때도 잘못된 `url()`이 들어갑니다. 그래서 `banner.image ? {...} : undefined`로 **있을 때만** 얹도록 바꿔서, 없으면 CSS의 `background: #ececec`가 그대로 남게 했습니다. URL은 공백·특수문자를 대비해 따옴표로 감쌌습니다.

바뀌는 값(URL)은 인라인, 안 바뀌는 값(회색·`background-size: cover`·위치)은 CSS 모듈로 나눴습니다. 회색이 이미지 로딩 전 폴백 역할도 겸하게 된 건 부수적으로 괜찮은 점이었습니다.

## 5. 위시리스트·장바구니 store를 몇 개로 나눌까 (팩토리 + 나중에 분리)

위시리스트와 장바구니를 Zustand로 관리하면서 store를 하나로 합칠지, 둘로 나눌지 고민했습니다.

- 둘은 장바구니에 담아도 위시리스트가 안 바뀌는 **독립된 도메인**이라 나누는 쪽이 맞다고 봤습니다. Zustand도 작은 store 여러 개를 권장하는 편이고요.
- 그런데 지금 두 store 로직이 "상품 id 집합 + 담기/빼기"로 **완전히 똑같아서**, 그냥 store를 두 벌 복붙하면 로직이 중복됩니다.
- 그래서 `createCollectionStore` 팩토리 하나로 로직을 한 곳에 두고, 그걸로 `useWishlistStore`·`useCartStore`를 각각 찍어냈습니다. 분리(독립 store)와 중복 제거(공유 구현)를 둘 다 챙기려는 선택입니다.

지금 두 로직이 같으니 미리 두 벌로 벌려두는 대신 팩토리로 묶고, **나중에 장바구니에 수량 같은 다른 로직이 생기면 그때 `cartStore.ts`만 독립 구현으로 떼어내기로** 했습니다. 소비처가 쓰는 인터페이스(`ids`/`toggle`)만 유지하면 분리 시 소비처(Header·버튼)는 손대지 않아도 돼서, "일단 묶고 필요할 때 나눈다"가 되돌리기 싼 방향이라고 판단했습니다.

컴포넌트 연결은 과제 지시("Header는 개수만, 버튼은 해당 상품 상태와 action만 selector 구독")에 맞췄습니다. Header는 개수를 별도로 저장하지 않고 `ids.length`로 파생했고, 찜/담기 버튼은 카드 전체를 Client로 만들지 않으려고 `ProductCardActions`라는 Client 리프로 빼서 자기 상품 상태만 구독하게 했습니다.

## 6. 현재 페이지의 헤더 메뉴를 어떻게 다룰까 (숨김 vs 현재 표시)

상품 목록에 있을 때도 헤더의 "상품" 메뉴를 노출해야 하나 고민했습니다. 처음엔 현재 페이지면 숨기는 게 깔끔하지 않나 싶었는데, 반대라고 판단했습니다.

- 페이지마다 메뉴가 사라지거나 재배치되면 내비게이션이 흔들려 사용자가 혼란스럽습니다. 전역 내비는 위치가 고정돼야 학습됩니다.
- 현재 위치는 **숨김이 아니라 `aria-current="page"`로 표시**하는 게 표준입니다. 링크가 사라지면 스크린리더에 현재 위치를 알릴 방법도 없어집니다.

그래서 "숨긴다"가 아니라 "현재 페이지라고 표시한다"로 방향을 잡고, `usePathname()`으로 현재 경로를 확인해 `aria-current`를 붙였습니다. 시각 스타일은 이 속성에 CSS를 걸어 접근성과 함께 맞췄습니다.

한 가지 더 나눈 판단: **로고에는 활성 시각 스타일을 주지 않았습니다.** 로고는 내비 메뉴 항목이 아니라 "홈으로 가는 버튼"이라, 홈에서 로고를 강조하는 건 어색하다고 봤습니다. 그래서 스타일 셀렉터를 `.navigation` 안으로 한정해 로고를 제외하고(로고의 `aria-current`는 정보 제공용으로만 유지), 메뉴 링크만 활성 표시되게 했습니다.

재이동 용도도 챙겼습니다. 필터가 걸린 `/products?category=...&sort=...` 상태에서 "상품" 링크를 누르면 쿼리 없는 `/products`로 이동해 nuqs 기본값(전체·최신순·1페이지)으로 리셋됩니다. 이건 `href="/products"` plain Link만으로 동작해서 별도 핸들러 없이 주석으로 의도만 남겼습니다.

## 7. 홈에서 카테고리로 진입할 때 URL 파라미터를 어떻게 둘까 (깨끗한 진입 vs 병합)

홈의 카테고리 링크를 `/products?category=${id}`로 보내면서, 이전에 목록에서 걸었던 `q·sort·page` 같은 파라미터가 따라붙어야 하나 고민했습니다.

- 홈 카테고리 링크는 절대 URL 문자열이라 기존 파라미터에 얹지 않고 새 주소로 이동합니다. 출발지가 홈(`/`)이라 얹을 파라미터도 없어서, 도착 URL엔 `category`만 남고 `q·sort·page`는 nuqs가 기본값으로 읽습니다(검색어 없음·최신순·1페이지). `sort`가 URL에 안 붙는 건 기본값이라 `clearOnDefault`로 주소창을 깔끔하게 유지하기 때문이고, API 요청 땐 serializer가 `sort=latest`를 명시합니다.
- 이게 맞다고 본 이유: 홈에서 카테고리를 누르는 건 그 카테고리로 **새로 진입**하는 행위라, 이전 검색어나 페이지가 몰래 따라오면 오히려 이상합니다. 깨끗하게 시작(page 1·검색어 없음·기본 정렬)하는 게 자연스럽고, "카테고리 변경 시 page 1로" 요구와도 맞습니다.

한 가지 구분해 둔 것: 파라미터 처리 방식이 두 곳에서 다릅니다.

- **홈 카테고리 링크**(지금 이것): 절대 URL Link → `category`만 남고 나머지 리셋. "새 진입"이라 깨끗하게.
- **목록 페이지 안의 카테고리 select**(2단계 예정): nuqs `setState({ category, page: 1 })` → 기존 `q·sort`는 **유지**하고 page만 1로. 사용자가 조건을 쌓아가는 중이라 병합이 맞습니다.

같은 "카테고리 선택"이라도 홈에서의 진입이냐, 목록 안에서의 조건 변경이냐에 따라 리셋과 병합으로 갈린다고 판단했습니다.

## 8. 홈 useSuspenseQuery의 SSR 에러를 어떻게 처리할까 (서버 프리패치, Advanced B)

런타임으로 확인하다 홈에서 `Switched to client rendering because the server rendering errored: Failed to parse URL from /api/home` 에러를 발견했습니다. 원인을 따라가 보니, `useSuspenseQuery`는 서버 렌더 중에도 실행되는데 `getHome`이 `fetch('/api/home')` 상대경로라 origin이 없는 서버에서 파싱에 실패하고, Next가 통째로 클라이언트 렌더링으로 전환하고 있었습니다. 화면은 클라 폴백으로 정상이었지만, 매 요청 서버 에러 로그가 남고 홈의 SSR 이점을 잃는 상태였습니다.

선택지를 넷으로 놓고 봤습니다.

- (A) 서버 프리패치(Advanced B): Server Component에서 절대 URL로 prefetch + `dehydrate`/`HydrationBoundary`. 제대로 된 SSR을 얻지만 구조가 늘어남.
- (B) `getHome`이 서버에서만 절대 URL 쓰게: 최소 수정으로 SSR을 살림. env 값 관리가 약간 지저분.
- (C) 홈을 `useQuery`로 되돌림: 서버 실행을 안 해 에러는 사라지지만, useSuspenseQuery/loading.tsx 설계를 포기.
- (D) 현 상태 유지: 동작은 하나 에러 로그·SSR 상실을 감수.

**(A) 서버 프리패치**를 골랐습니다. 이 에러 자체가 App Router에서 서버 상태를 SSR로 넘기는 정석(prefetch → dehydrate → HydrationBoundary)을 요구하는 신호였고, 과제 Advanced B가 정확히 이 주제라 학습 가치가 컸기 때문입니다. 구현은 이렇게 나눴습니다.

- `getApiBaseUrl` 유틸: 클라이언트는 상대경로, 서버는 절대 URL(env base + localhost 폴백)을 반환. `getHome`이 이걸 앞에 붙여 서버에서도 조회 가능하게 함.
- `getServerQueryClient`: 요청마다 분리된 QueryClient를 React `cache`로 감싸 같은 요청 안에서만 재사용. 클라이언트 QueryClient는 여전히 `providers.tsx`의 `useState`로 별도 생성.
- `(home)/page.tsx`를 Server Component로 바꿔 클라이언트와 **같은 queryOptions(`homeQueries.detail`)** 로 `prefetchQuery`한 뒤 `dehydrate`한 캐시를 `HydrationBoundary`로 넘기고, 렌더 로직은 `HomeContent`(Client)로 분리.

런타임으로 검증했습니다: SSR HTML에 배너 제목이 포함되고, 브라우저 pageerror가 사라졌으며, 클라이언트에서 `/api/home` 초기 요청이 **0회**(서버 prefetch 캐시를 hydrate)라 중복 요청도 없음을 확인했습니다. "queries 계층을 클라이언트·서버가 공유하도록 만들어 둔 게 여기서 그대로 재사용됐다"는 점이 설계상 가장 만족스러웠습니다.

## 9. 페이지네이션 로직을 훅으로 뺄 때, 지금 제네릭으로 만들까 (라우트 전용 → 필요 시 승격)

Pagination을 붙이면서 nuqs `page` 상태 로직을 `usePagination` 훅으로 뺐습니다. 이때 처음부터 공용 훅(`src/hooks`)으로 만들어 parsers를 인자로 받게 할지 고민했습니다.

- 제네릭으로 갈 거면 parsers를 **주입받는** 형태(`useUrlPagination(parsers, totalCount)`)가 맞습니다. 훅이 자기 안에서 `page` 파서를 새로 정의하면, `page`의 원본이 `productListParsers`와 훅 둘로 갈라져 기본값·키가 어긋날 수 있기 때문입니다(같은 도메인 값은 한 곳에 정의한다는 컨벤션 위반).
- 하지만 지금은 **라우트 전용**(`productListParsers`를 직접 참조하는 `usePagination(totalCount)`)으로 두기로 했습니다. 페이지네이션이 붙는 목록이 상품 목록 하나뿐이라, 제네릭으로 벌리면 parsers 타입 제약(nuqs 타입과 씨름)만 늘고 재사용 이득은 0이기 때문입니다.

**승격 계획**: 서로 다른 두 번째 페이지네이션 목록이 생기면 그때 `useUrlPagination(parsers, totalCount)`로 올려, 각 목록이 자기 parsers를 주입해 쓰도록 바꿉니다. 그 전까지는 단일 원본(`productListParsers`)에 붙은 라우트 전용 훅이 제일 단순합니다. store 팩토리(5번)와 같은 "일단 좁게 두고, 실제 두 번째 소비처가 나타나는 신호에 맞춰 승격" 기준입니다.

## 10. 장바구니·위시리스트를 새로고침에도 유지 (persist) + hydration 가드는 정말 필요했나

새로고침해도 담긴 목록이 남게 해달라는 요구로 Zustand `persist`(localStorage)를 붙였습니다(Advanced A). `createCollectionStore`에 `name`(저장 키)·`version: 1`·`partialize`(ids만 저장)·`migrate`(버전 전환)·`merge`(매 복원 시 검증→손상값이면 빈 목록으로 복구)를 넣었습니다.

붙이면서 가장 신경 쓴 건 **SSR hydration 불일치**였습니다. 서버엔 localStorage가 없어 0을 그리는데, 클라이언트는 저장값(예: 1)을 그리면 서버·클라 렌더가 어긋난다고 봤기 때문입니다. 그래서 처음엔 `useStoreHydrated`(persist의 hydration 이벤트를 `useSyncExternalStore`로 구독) 가드를 만들어, hydration 완료 전에는 서버와 같은 0을 그리도록 했습니다.

그런데 "정말 불일치가 나는가"를 눈으로 확인하려고 데모 페이지(`/hydration-demo`)를 만들어 실측해보니, 예상과 달랐습니다.

- **훅으로 읽으면**(`useCartStore((s) => s.ids.length)`) 불일치가 **안 났습니다.**
- **렌더 중 `getState()`로 직접 읽을 때만**(`useCartStore.getState().ids.length`) `Hydration failed because the server rendered text didn't match` 에러가 났습니다.

원인은 zustand 훅이 내부적으로 `useSyncExternalStore`를 쓰면서 **`getServerSnapshot`을 "초기 상태(빈 배열)"로 돌려주기 때문**이었습니다. 그래서 hydration 렌더에서는 서버와 같은 0을 그린 뒤 커밋 후 실제 값으로 바뀌어, 훅만 쓰면 불일치가 원천적으로 안 납니다. 우리 Header·ProductCardActions는 전부 훅으로 읽고 있었으니 **가드 없이도 이미 안전**했던 것입니다.

**그래서 `useStoreHydrated` 가드를 제거했습니다.** 제가 처음에 불일치를 과하게 걱정해 넣은 것이었고, 실측 결과 zustand가 이미 보장하는 걸 중복으로 감싼 코드였습니다. 데모 페이지는 "훅은 안전 / getState 직접 읽기는 불일치"를 눈으로 보여주는 근거로 남겨뒀습니다(확인 후 삭제 가능한 라우트). 배운 점은, hydration 걱정이 들 때 가드를 먼저 두르기보다 **실제로 불일치가 나는지 재현해보고 필요한 만큼만 대응**하는 순서가 맞다는 것이었습니다.

## 11. URL 조건 변경을 히스토리에 어떻게 쌓을까 (`history: "push"`)와 홈으로 돌아갈 때 파라미터

목록의 검색·카테고리·정렬·페이지를 nuqs로 관리하는데, 변경 시 히스토리를 `replace`로 둘지 `push`로 둘지 정해야 했습니다.

- `replace`는 현재 히스토리 항목을 덮어써서, 뒤로 가기를 누르면 필터 변경들을 건너뛰고 목록 진입 이전(홈 등)으로 바로 나가버립니다. "방금 건 필터를 취소" 같은 동작이 안 됩니다.
- `push`는 변경마다 새 항목을 쌓아, 뒤로 가기 = 직전 필터 상태로 되돌리기(undo), 앞으로 가기 = redo가 됩니다. 검색·필터 페이지에서 사용자가 기대하는 동작이라 `push`를 택했습니다(과제 요구 "각 변경을 앞뒤 이동에서 복원"과도 일치).

적용은 `productListParsers`의 q·category·sort·page에 `withOptions({ history: 'push' })`를 걸어, 단일 원본을 쓰는 모든 `useQueryStates` 호출부가 자동으로 상속하게 했습니다. serializer(API 직렬화)는 history 옵션을 쓰지 않으므로 영향이 없습니다. q(검색어)는 처음에는 키 입력마다 히스토리가 쌓이는 문제 때문에 replace를 사용했지만, 300ms debounce를 추가한 뒤에는 입력이 멈춘 확정 검색어만 push하도록 바꿨습니다. 따라서 글자 하나마다가 아니라 검색 한 번마다 히스토리가 생기고, 뒤로·앞으로 이동으로 이전 검색어와 결과를 복원할 수 있습니다.

**한 가지 스스로 던진 질문**: 뒤로 가기로 홈까지 나가면 목록 파라미터가 홈에 남아버리는 것 아닌가? 확인해보니 아니었습니다. 히스토리 항목은 각각 "완전한 URL 하나"라서, push로 쌓이는 스택은 `/` → `/products` → `/products?sort=popular` → `/products?sort=popular&category=casual` 처럼 지점마다 그때의 URL이 그대로 박제됩니다. 뒤로 가기는 이 스택을 한 칸씩 내려가므로, 홈 항목은 처음부터 `/`(파라미터 없음)이고 파라미터는 `/products` 항목들에만 매달려 있습니다. 게다가 홈 페이지는 `productListParsers`를 읽는 `useQueryStates`가 없어 URL에 뭐가 있어도 필터로 쓰지 않습니다. 런타임으로 홈 → 목록 → 필터 2회 변경 → 뒤로 3회를 눌러, 뒤로 1~2는 목록 안에서 필터가 한 단계씩 되돌아가고 뒤로 3에서 `/`(파라미터 없음)로 나가는 걸 확인했습니다. 오히려 push가 "목록 안에서는 필터 히스토리 유지, 홈으로 넘어가면 목록 파라미터가 자동으로 떨어짐"이라는 경계를 깔끔하게 만들어줬습니다.

## 12. 라우트 전용 훅을 `_hooks`로 나눌까 (지금은 `_components`에 같이 둠)

`useProductFilters`·`usePagination`을 `products/_components`에 컴포넌트와 함께 두고 있는데, `_hooks` 폴더로 따로 뺄지 고민했습니다. **지금은 나누지 않고 그대로 두기로** 했습니다.

- 훅이 2개뿐이고 바로 옆 `ProductFilters`·`ProductListResults`에서만 쓰여서, 같은 폴더에 있는 게 오히려 찾기 쉽습니다. 파일 2개 때문에 폴더를 새로 파는 건 이른 정리(YAGNI)입니다.
- Next의 `_` 폴더는 라우팅 제외 표시일 뿐 이름·내용물에 제약이 없어, `_components`에 훅이 있어도 동작·정확성엔 차이가 없습니다.

**나눌 시점(둘 중 하나면 그때 `_hooks`로 분리)**:

- 훅이 4~5개 이상으로 늘어 `_components`에서 컴포넌트와 섞여 눈에 안 들어올 때
- 팀에서 "폴더 이름 = 내용물 종류"를 엄격히 맞추고 싶을 때(`_components`엔 컴포넌트만)

## 13. Advanced C에서 어떤 사용자 경험을 개선할까

검색·필터·페이지 이동이 반복되는 상품 목록의 특성에 맞춰 세 가지를 선택했습니다.

- **검색 debounce**: 입력할 때마다 URL과 API를 갱신하지 않고 300ms 동안 입력이 멈춘 검색어만 반영합니다. 확정 검색어에는 `history: 'push'`를 적용해 글자마다가 아니라 검색 단위로 뒤로·앞으로 복원합니다.
- **페이지 변경 중 기존 목록 유지**: `placeholderData: keepPreviousData`로 새 조건을 요청하는 동안 이전 목록을 유지하고 `aria-busy`와 투명도로 전환 중임을 표시합니다.
- **새로고침 없는 오류 재시도**: 목록 영역의 오류 UI에서 React Query `refetch`를 호출해 전체 페이지를 새로고침하지 않고 복구합니다.

debounce 대기 중 카테고리·정렬을 함께 변경하는 경우, 검색어 전체 삭제, 없는 상품, 1,000자 검색어, API 반복 실패 후 재시도까지 E2E로 검증했습니다.

## 14. Advanced D의 핵심 상태 계약을 어떻게 보호할까

브라우저에서 URL·React Query·Zustand가 함께 움직이는 계약을 확인해야 해서 Playwright E2E를 선택했습니다. Chromium과 WebKit에서 각각 11개, 총 22개가 통과했습니다.

- Zustand action과 selector: 찜·담기 버튼, `aria-pressed`, Header 파생 개수 검증
- nuqs URL 조건과 query key: 검색·필터·정렬·페이지 변경 후 URL과 실제 목록 결과를 함께 검증
- 홈과 목록의 store 동기화: 홈에서 담은 같은 상품이 목록에서도 눌린 상태인지 검증
- persist와 복구: 새로고침 유지 및 손상된 localStorage 값을 빈 상태로 복구하는지 검증

API 입력 검증과 fixture 계약은 기존 Vitest 36개가 별도로 보호합니다. 테스트 결과와 캡처는 [`e2e-test-result.md`](./e2e-test-result.md)에 기록했습니다.

## 15. 제출 빌드에서 발견한 Next.js 경계를 어떻게 고쳤나

`pnpm check`를 처음 실행했을 때 두 종류의 경계 문제가 드러났습니다.

- Vitest가 `e2e/*.spec.ts`까지 수집함 → `vitest.config.ts`의 include를 `src/**/*.test.ts`로 제한해 Vitest와 Playwright의 책임을 분리했습니다.
- `/products`에서 nuqs가 사용하는 `useSearchParams`에 Suspense 경계가 없음 → page는 Server shell로 되돌리고 URL/query를 읽는 `ProductListContent` Client Component를 `<Suspense>`로 감쌌습니다.
- 홈 서버 prefetch를 빌드 중 정적 생성하려다 자체 `/api/home` fetch가 실패함 → 요청마다 prefetch하는 설계에 맞춰 홈을 `force-dynamic`으로 명시했습니다.

수정 후 `pnpm check`에서 Vitest 36개, 전체 lint, typecheck, production build가 모두 통과했습니다.

## 16. 셀프 리뷰에서 고친 네 가지

제출 전 셀프 리뷰(diff 점검)에서 나온 지적을 반영했습니다. 모두 "상태의 원본을 어디에 두는가"와 "실패 상태에서 사용자가 빠져나갈 수 있는가"에 대한 문제였습니다.

- **필터 노출 기준을 "조회 성공"에서 "조회 완료"로 바꿨습니다.** 기존에는 서버 응답의 `categories`가 있을 때만 필터를 렌더링해서, 목록 조회가 실패하면 검색·카테고리·정렬 UI가 통째로 사라졌습니다. 사용자가 조건을 바꿔 실패 상태를 벗어날 방법이 없어집니다. 처음에는 아예 항상 노출하도록 고쳤는데, 이 수정이 E2E에서 회귀를 만들었습니다(아래). 최종적으로는 `!isPending`을 기준으로 두어, 실패 상태에서는 필터가 남고(카테고리 옵션은 전체만) 최초 로딩 중에는 렌더링하지 않습니다.
- **정렬 옵션 목록을 한 곳으로 모았습니다.** parser의 허용값(`searchParams.ts`)과 select의 옵션(`ProductFilters.tsx`)에 같은 값 목록이 따로 있었습니다. 옵션을 추가할 때 한쪽만 고치는 사고가 나므로, `SORT_OPTIONS`(value+label)를 `searchParams.ts`에 두고 parser는 거기서 값만 뽑아 쓰게 했습니다.
- **`pageSize`를 URL 상태에서 상수로 내렸습니다.** 화면에 페이지 크기를 바꾸는 UI가 없어 사용자가 소유하는 상태가 아닌데 URL에 있었고, 임의 값(`pageSize=25`)을 넣으면 API 400으로 떨어지는 표면만 됐습니다. `PRODUCT_PAGE_SIZE` 상수로 두고 API 직렬화 단계에서만 붙입니다.
- **마지막 페이지를 넘긴 URL에서 돌아올 길을 남겼습니다.** `?page=999`처럼 범위를 넘긴 주소는 빈 상태가 되는데 이때 페이지네이션까지 감춰서 화면 안에서 앞 페이지로 갈 수 없었습니다. `totalCount > 0`이면(= 결과는 있는데 페이지만 넘긴 경우) 페이지네이션을 함께 표시합니다. 검색 결과가 0건일 때는 그대로 감춥니다.

`error.tsx`도 받기만 하고 쓰지 않던 `error`를 콘솔에 남기고 `digest`를 화면에 표시하도록 바꿨습니다. 프로덕션에서는 스택이 사용자에게 노출되지 않아 원인 추적 실마리가 필요합니다.

### 수정하다 만든 회귀: hydration 이전의 입력은 사라진다

필터를 "항상" 렌더링하도록 바꾼 첫 수정은 정적 검사(lint·typecheck·build)를 모두 통과했지만 E2E에서 5개가 깨졌습니다. 검색어를 입력해도 `q`가 URL에 반영되지 않았습니다.

원인은 렌더링 시점이었습니다. 필터를 항상 렌더링하면 검색 input이 SSR HTML에 포함되어 hydration 이전부터 화면에 보입니다. 그 구간의 입력은 React 이벤트 핸들러에 잡히지 않아 debounce조차 시작되지 않고 그대로 사라집니다(테스트는 `goto` 직후 바로 `fill`하므로 이 구간에 정확히 들어갑니다). 기존 코드는 데이터가 도착한 뒤에야 input이 생겨서 이 구간이 아예 없었고, 그래서 문제도 없었습니다.

그래서 노출 기준을 `!isPending`으로 좁혔습니다. 원래 고치려던 문제(실패 시 필터 소실)는 해결하면서, 로딩 중 input을 미리 노출하지 않아 입력 유실 구간도 만들지 않습니다. 정적 검사만으로 화면 경계 변경을 끝내면 안 된다는 사례로 [e2e-test-result.md](./e2e-test-result.md)에도 기록했습니다.

`getApiBaseUrl`의 `localhost:PORT` 폴백도 지적됐지만 고치지 않았습니다. 배포 환경이 정해지기 전에는 어떤 env를 읽어야 할지 알 수 없고, 지금 손대면 근거 없는 추측 코드가 됩니다. 아래 "다음에 볼 것"에 남겨둡니다.

## 아직 확실하지 않은 것 / 다음에 볼 것

- `getApiBaseUrl`의 서버 절대 URL은 env(`NEXT_PUBLIC_BASE_URL`)와 `localhost:PORT` 폴백에 기대고 있어, 배포 환경이 생기면 base URL 설정을 확실히 해야 합니다.
- 로딩 스켈레톤 중 홈은 서버 prefetch로 즉시 데이터가 차서 loading.tsx가 거의 안 뜹니다. 목록 skeleton은 실제 레이아웃에 맞춰 이미 붙였고, 홈 skeleton 문구는 나중에 다듬을 여지가 있습니다.
- 상품 목록도 나중에 서버 프리패치를 적용할지는, 목록이 URL 조건에 따라 매번 달라지는 특성상 이득을 따져보고 정할 생각입니다(무조건 prefetch하지 않기).

---

_이 문서는 제가 이번 주 개발하며 내린 판단과 그 이유를 정리한 것입니다. 각 갈림길에서의 선택지 비교와 근거 정리, 문서 작성은 AI(Claude)와 함께 진행했고, 어떤 방식을 택할지의 최종 결정은 제가 했습니다._
