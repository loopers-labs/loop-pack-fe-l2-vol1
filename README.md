# Loopers Pack — Frontend L2 Vol.1

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제 제출 & 피드백 레포입니다.
4주차부터 이 레포가 **커머스 프로젝트(Next.js)** 본체가 됩니다.

## 시작하기

필수 도구는 Node.js 24.17.0과 pnpm 10.15.1입니다. `.nvmrc`는 현재 권장 LTS를 고정하고, `package.json`의 Node.js 범위(`>=22.12.0`)는 지원 가능한 Node.js 22 이상을 허용합니다.

```bash
nvm use
pnpm install
pnpm dev
```

`pnpm test`는 전체 Vitest 테스트가 통과해야 완료됩니다. `pnpm check`는 테스트, lint, 타입 검사, 프로덕션 빌드를 순서대로 실행하며 네 단계가 모두 통과해야 완료됩니다. GitHub Actions도 pull request와 `main` push에서 같은 `pnpm check`를 실행합니다.

> Next.js(App Router) + React 19 + TypeScript. (1~3주차 React+Vite 산출물은 각자 개인 브랜치 히스토리에 있습니다.)

## 구조 (최소 골격)

```
src/
  app/                     # Next App Router
    api/products/route.ts  # mock 백엔드 (route handler)
    layout.tsx  page.tsx
  components/
    ui/
      select/              # Select (Headless) — 4주차 1단계
      dialog/              # Dialog (Compound) — 4주차 2단계
docs/assignments/          # 주차별 과제 명세
```

> 폴더 구성은 최소한만 잡아뒀습니다. 구조 개선은 **각자 근거를 대고** 진행하세요.

## 주차별 과제

- 과제 명세는 `docs/assignments/week-0N.md` 에 있습니다.
- 새 과제가 올라오면 **본인 포크의 `main`을 이 레포(upstream)와 동기화**해 받으세요.
  - GitHub: 포크 레포의 **Sync fork** 버튼
  - CLI: `git fetch upstream && git switch main && git merge upstream/main`

## 제출

1. 이 레포를 **포크**한다.
2. 포크에서 주차 작업 브랜치를 만든다 (예: `feat/week-04`).
3. 과제를 진행하고 커밋·푸시한다 (본인 포크에).
4. **메인 레포로 PR**을 연다. PR 템플릿(이번 주 학습 / 피드백 받고 싶은 부분)을 채운다.
5. 모든 PR이 한곳에 모이므로 서로 리뷰하고, 코치 피드백 + 다음 세션 구두 방어로 이어진다.

## 상태관리 (5주차)

### 상태 분류

| 항목                      | 상태 분류            | 소유자(원본)                                 | 수명                           | 공유 범위               | 선택 이유                                                  |
| ------------------------- | -------------------- | -------------------------------------------- | ------------------------------ | ----------------------- | ---------------------------------------------------------- |
| 홈·상품 목록 데이터       | 서버 상태            | 서버 (TanStack Query 캐시는 스냅샷)          | staleTime/gcTime 정책          | 같은 쿼리를 구독하는 곳 | 원본이 서버에 있어 내가 소유하지 않고 캐시로만 다룸        |
| 검색·카테고리·정렬·페이지 | URL 상태             | URL (nuqs `useQueryStates`)                  | 히스토리 엔트리                | 링크 공유·새로고침·앞뒤 | 공유하고 새로고침·앞뒤 이동으로 복원해야 하므로 URL이 원본 |
| 장바구니·위시리스트       | 전역 클라이언트 상태 | Zustand store (비로그인 로컬)                | 브라우저 세션(새로고침 초기화) | 헤더 + 홈 + 목록        | 여러 페이지가 함께 쓰는 비로그인 익명 상태                 |
| 헤더에 표시하는 개수      | 파생 값              | 별도 저장 없음 — `ids.size`에서 파생         | store와 동일                   | 헤더                    | 계산 가능한 값을 중복 저장하지 않기 위해                   |
| 제출 전 검색어 초안       | 로컬 상태            | `ProductSearchInput`의 `useState`            | 컴포넌트 수명                  | 해당 입력 하나          | 디바운스 커밋 전 임시값이라 다른 화면이 알 필요 없음       |
| 로딩·에러·빈 결과         | 서버 상태의 파생     | `useQuery` 반환값 (`isLoading`/`isError` 등) | 쿼리 수명                      | 해당 페이지             | 쿼리 상태에서 그대로 파생되므로 별도 상태를 만들지 않음    |

### TanStack Query·nuqs·Zustand의 책임을 나눈 기준

도구를 먼저 고르지 않고 Source of Truth가 어디인지 먼저 정했다.

- **TanStack Query** — 원본이 서버에 있는 데이터. `/api/home`, `/api/products` 조회 상태와 캐시 수명만 맡는다 (`src/queries/commerce.ts`의 `queryOptions` 팩토리).
- **nuqs** — 공유·새로고침·앞뒤 이동으로 복원돼야 하는 조건. 검색어·카테고리·정렬·페이지·페이지 크기를 parser로 타입을 붙여 URL에 둔다 (`src/app/products/page.tsx`).
- **Zustand** — 여러 페이지(헤더·홈·목록)가 함께 쓰는 비로그인 장바구니·위시리스트만 전역으로 둔다 (`src/stores/`).
- **React 로컬 상태** — 제출 전 검색어 초안 하나뿐이다. 입력값은 로컬 `useState`로 controlled 하게 들고 있다가 디바운스가 끝나면 URL 상태로 커밋한다. 서버 응답을 로컬 상태나 Zustand로 복사하는 일은 없다.

### staleTime과 gcTime 정책

- **홈 5분** (`commerceQueries.home`) — 배너·카테고리·인기/신상품 큐레이션은 자주 바뀌지 않고, 홈은 이동 중 반복해서 돌아오는 페이지라 캐시 재사용 이득이 크다. 목록을 둘러보고 돌아와도 재요청 없이 즉시 그린다.
- **목록 1분** (`commerceQueries.products`) — 검색 조건별 결과라 신선도 요구가 홈보다 높고, 조건 조합마다 캐시 엔트리가 생기므로 오래 fresh로 유지할 이유가 없다. 대신 `placeholderData: keepPreviousData`로 조건 변경 중 이전 목록을 유지한다.
- **gcTime은 기본값 5분을 그대로 사용** — 뒤로 가기로 직전 조건에 돌아오는 시간과 `keepPreviousData`가 참조할 캐시를 유지하기에 충분하고, 조건 조합별 캐시가 5분 뒤 정리되어 메모리에 쌓이지 않는다.
- QueryClient 전역 기본 `staleTime: 20초`는 개별 옵션이 없는 새 쿼리를 위한 안전한 fallback이며, 현재 두 쿼리는 모두 개별 값이 우선한다.

### store에 저장한 데이터 형태와 선택 이유

`Set<string>`(상품 id)과 `toggle` action 하나만 둔 selection store를 팩토리(`createSelectionStore`)로 만들어 위시리스트와 장바구니가 같은 구조를 공유한다. UI가 담기·빼기를 모두 버튼 토글로 수행하므로 `add`/`remove`는 두지 않았다.

- 상품 객체가 아니라 **id만** 저장한다. 상품 정보의 원본은 서버(TanStack Query 캐시)이므로 store에 복사하면 두 원본이 생긴다.
- `Set`은 담김 여부 조회(`has`)가 O(1)이라 상품 버튼 selector가 싸고, 중복 담기가 구조적으로 불가능하다.
- 개수는 `size`로 파생하므로 별도 카운트 상태가 없다.

### selector의 구독 경계

- 헤더(`HeaderActions`)는 `state.ids.size`만 구독한다 — 개수가 변할 때만 리렌더.
- 상품 버튼(`WishlistButton`/`CartButton`)은 `state.ids.has(productId)`와 `toggle` action만 구독한다 — 다른 상품을 토글해도 자기 상품의 `has` 결과가 같으면 리렌더되지 않는다.
- store 전체를 구독하는 컴포넌트는 없다.

### 전역으로 올리지 않은 상태와 그 이유

- **제출 전 검색어 초안** — 디바운스 커밋 전의 입력값은 해당 입력 컴포넌트 수명에만 머무는 임시 UI 상태라 로컬 `useState`에 뒀다. 커밋된 값의 원본은 URL이다.
- **로딩·에러·빈 결과** — `useQuery` 반환값에서 그대로 파생되므로 상태를 따로 만들면 원본과 어긋날 수 있다.
- **헤더 개수** — `ids.size`로 계산 가능한 값이라 저장하지 않는다.

### 로그인·서버 동기화가 생기면 위시리스트의 소유권 변화

지금은 비로그인 익명 사용자의 로컬 상태이므로 Zustand가 원본을 소유하고, 새로고침에 초기화되어도 된다. 로그인·서버 동기화가 생기면 **원본 소유권이 서버로 넘어간다**.

- 로그인 시점에 로컬 익명 위시리스트를 서버 데이터와 **합집합으로 병합해 서버에 반영한 뒤 로컬을 비우는** 정책을 택한다 (사용자가 담아둔 것을 버리지 않기 위해).
- 이후 위시리스트 조회는 TanStack Query(서버 상태)가 맡고, Zustand의 역할은 mutation 진행 중 낙관적 UI 같은 임시 상태로 축소된다.
- 비로그인 구간의 유지력이 필요해지면 Zustand `persist`(localStorage)로 익명 상태만 보존하는 것을 다음 단계로 고려한다 (Advanced A).

### 검증 결과

- **홈과 목록의 같은 상품 상태 일치** — 홈 신상품의 윈터 로키팬츠(p1)를 찜+담기, 인기 상품의 메이커스 투명케이스(p21)를 찜한 뒤 목록으로 이동하면, 목록 1페이지의 p1에 찜·담기 모두 활성(`aria-pressed=true`)으로 표시되고, `q=케이스`로 필터링한 결과에서도 p21의 찜이 활성으로 일치했다.
- **클라이언트 페이지 이동 중 store 유지** — 홈에서 담은 뒤 `next/link`로 목록 이동, 검색·정렬 변경(URL 상태 변경), 뒤로/앞으로 이동을 거치는 동안 헤더 개수(위시리스트 2 · 장바구니 1)와 버튼 활성 상태가 계속 유지됐다.
- **URL 공유·새로고침** — `/products?q=케이스&sort=price-asc` 상태의 URL로 새로 진입하면 검색어 입력값·정렬 select·결과(총 2개)가 모두 동일하게 복원됐다. 위시리스트·장바구니는 0으로 초기화되는데, 이는 비로그인 로컬 익명 상태로 새로고침 초기화를 허용하는 설계 그대로다.
- **뒤로 가기·앞으로 가기** — `history: "push"` 설정으로 검색어 커밋과 정렬 변경이 각각 히스토리 엔트리가 되어, 뒤로 가기 시 `sort=price-asc → latest`로, 앞으로 가기 시 다시 `price-asc`로 URL과 화면(select 값 포함)이 함께 복원됐다.

### Advanced C — 사용자 경험 개선 (선택: 검색어 debounce)

서버 응답이 500ms 고정 지연이라 키 입력마다 요청이 나가면 대기·깜빡임이 그대로 체감되는 환경이어서, 요청 횟수 자체를 줄이는 검색어 debounce를 선택했다.

#### 검색어 debounce (`useDebouncedCallback`, 300ms)

- **개선 전** — 키 입력마다 URL 커밋이 일어나 글자 수만큼 `/api/products` 요청이 나가고, `history: "push"`라 히스토리 엔트리도 글자 단위로 쌓여 뒤로 가기가 한 글자씩 되돌아간다.
- **개선 후** — 입력 초안은 `ProductSearchInput`의 로컬 상태에 머물고 타이핑이 300ms 멈춘 뒤 1회만 URL로 커밋된다. 요청도 히스토리 엔트리도 커밋 단위가 된다.
- **query key·캐시 정책과의 충돌 검증** — debounce는 URL 커밋 시점만 늦출 뿐 커밋된 값은 그대로 nuqs → query key로 흐르므로, "목록 조건이 query key와 API 요청에 모두 반영된다"는 계약이 유지된다. 커밋 단위로 생기는 각 key는 staleTime(1분)·gcTime(5분) 정책을 그대로 따르고, 타이핑 중간값의 캐시 엔트리가 생기지 않아 캐시 오염도 줄어든다.

> 나머지 항목(다음 페이지 prefetch, 목록 이동 전 prefetch, 페이지 변경 중 기존 목록 유지 표시)은 다음에 직접 구현해 볼 예정이다.
