# Loopers Pack — Frontend L2 Vol.1

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제 제출 & 피드백 레포입니다.

## 시작하기

```bash
pnpm install
pnpm dev
```

> React 19 + Vite + TypeScript 기반입니다. (1~3주차 React, 4주차부터 Next.js로 전환 예정)

## 프로젝트 구조

feature-first colocation — 코드는 기술 종류가 아니라 **도메인 기능**으로 묶는다.

```txt
src/
├─ <feature>/       # 한 기능의 컴포넌트·훅·로직·타입을 함께 (예: market/)
│  ├─ *.tsx         # 컴포넌트
│  ├─ *.ts          # 훅·도메인 로직·순수 함수
│  ├─ api/          # 데이터 호출 (생길 때)
│  ├─ types.ts
│  └─ index.ts      # 공개 표면(배럴)
└─ shared/          # 둘 이상 피처가 공유하는 것만 (필요해질 때)
```

의존성은 단방향(`shared → 피처 → app`), 피처는 `index.ts`로만 노출한다. (4주차 Next 전환 시 `app/`은 라우팅 전용, 도메인 로직은 그대로 `src/<feature>/`에.)

## 주차별 과제

- [1주차 — 코드 리뷰 & AI 협업 환경 구축](docs/assignments/week-01.md)

## 새 주차 과제 받기

각 주차 과제는 이 메인 레포에 업데이트됩니다. 새 과제가 올라오면 **본인 포크의 `main`을 이 레포(upstream)와 동기화**해 받으세요.

- 간단히: 포크한 GitHub 레포 페이지의 **Sync fork** 버튼.
- CLI: `git remote add upstream https://github.com/loopers-labs/loop-pack-fe-l2-vol1.git` 등록 후 `git fetch upstream && git switch main && git merge upstream/main`.

## 제출

1. 이 레포를 **포크**한다.
2. 포크에서 작업 브랜치를 만든다 (예: `feat/week-01`).
3. 과제를 진행하고 커밋·푸시한다 (본인 포크에).
4. **메인 레포로 PR**을 연다 (base: 메인 레포의 `main` ← compare: 본인 포크의 작업 브랜치). PR 템플릿(이번 주 학습 / 피드백 받고 싶은 부분)을 채운다.
5. 모든 PR이 메인 레포 한곳에 모이므로 **서로의 PR을 리뷰**하고, 코치 피드백 + 다음 세션 구두 방어로 이어진다.

> PR은 **메인 레포(upstream)로** 올립니다 — 모두의 PR이 한곳에 모여 서로 리뷰할 수 있습니다. (협력자 추가는 필요 없습니다.)

## 3주차 — ProductListPage 리팩터

500줄+ 단일 컴포넌트(`src/productList/ProductListPage.tsx` 원본)를 관심사별로 분리하고, 발견된 버그 3종을 수정했다. 아래 4개 섹션은 그 근거·매핑·수정 내역·의도적으로 남긴 항목을 기록한다.

## Hook 근거

- **useProductList** — 서버 상태(로딩/에러/데이터)와 race-safe 패칭(요청 취소가 아닌 `ignore` 가드)을 한 곳에 캡슐화해, 컴포넌트가 fetch 세부와 stale-response 방어를 몰라도 되게 한다.
- **useProductFilters** — 필터·검색·페이지 상태를 URL 쿼리와 양방향 동기화(마운트 시 복원 + 변경 시 `replaceState`)하는 책임 전체를 한 훅에 묶어, 컴포넌트가 직렬화/역직렬화 로직을 몰라도 되게 한다.
- **useDebouncedValue** — 제네릭 값 debounce라는 범용 메커니즘만 감싼 얕은 훅이지만, 검색어·최소가·최대가 세 입력 각각에서 반복되던 `setTimeout` 로직을 한 곳으로 추출해 재사용한다.
- **useWishlist** — 위시리스트 배열 상태 + `localStorage("wishlist")` 영속화 + 토글 연산을 캡슐화해, 페이지가 저장 키나 직렬화 방식을 몰라도 되게 분리한다.
- **useRecentlyViewed** — 최근 본 상품 배열 상태 + `localStorage("recentlyViewed")` 영속화를 담당한다. useWishlist와 구조는 같지만 "최근 순서 유지 + 개수 제한(10개)"이라는 별개의 도메인 규칙을 가져 별도 훅으로 분리했다.

## 관심사 분류

| 레이어      | 파일                                                                                                              | 역할                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| UI          | `ProductListPage.tsx`                                                                                             | 훅 조립 + 레이아웃, 도메인 로직 없음                                                   |
| UI          | `FilterPanel.tsx`, `SearchSortBar.tsx`, `ProductGrid.tsx`, `ProductCard.tsx`, `Pagination.tsx`, `ErrorBanner.tsx` | 렌더링 + 이벤트를 상위로 위임(`onX` prop), 상태 없음                                   |
| Hook        | `useProductList.ts`, `useProductFilters.ts`, `useDebouncedValue.ts`, `useWishlist.ts`, `useRecentlyViewed.ts`     | 상태 관리 + 도메인 상태 조합, React Effect 동기화                                      |
| API         | `api/productApi.ts`                                                                                               | `fetchProductList` — 요청 파라미터 직렬화 및 응답 변환(fetch 경계)                     |
| API(dev)    | `_mockApi.ts`                                                                                                     | 로컬 개발용 mock 서버 설치(`index.ts`에서만 노출) — 실제 API 경계가 아니라 개발 인프라 |
| Utils       | `filterQuery.ts`                                                                                                  | URL 쿼리 ↔ 필터 순수 변환(`parseQueryToFilters`/`serializeFiltersToQuery`)             |
| Utils       | `listOps.ts`                                                                                                      | `toggleId`/`addRecentId` — id 배열 순수 연산                                           |
| Utils       | `productBadges.ts`                                                                                                | `computeBadges` — 할인율·NEW·품절 등 배지 순수 계산(현재 시각은 인자로 주입)           |
| Utils       | `highlight.ts`                                                                                                    | `escapeRegExp`/`splitByMatch` — 검색어 하이라이팅 순수 계산                            |
| Utils       | `types.ts`                                                                                                        | 도메인 타입 정의(`Product`, `Filters`, `SortBy` 등)                                    |
| Utils(검증) | `pure.check.ts`                                                                                                   | 위 순수 함수들의 자체 회귀 검증 스크립트                                               |

## 버그 수정

**bug#1 — URL 복원 안 됨**
원인: 원본은 필터/페이지 상태가 바뀔 때마다 `window.history.replaceState`로 URL에 쓰기만 했고, 마운트 시 URL을 읽어 상태를 복원하는 로직이 없었다. 새로고침하거나 URL을 공유해도 항상 기본값(`category: "all"`, `page: 1`, ...)으로 리셋됐다.
수정: `filterQuery.ts`에 `parseQueryToFilters`를 분리하고, `useProductFilters.ts`의 각 `useState`를 lazy initializer로 바꿔 마운트 시 `parseQueryToFilters(window.location.search)`로 URL에서 상태를 복원하도록 했다(`useProductFilters.ts:16-36`).

**bug#2 — 에러 시 전체 화면 대체 + 새로고침 재시도**
원인: 원본은 에러가 나면 `if (error) return <div className="error">...</div>`로 페이지 전체를 대체해 필터/검색 등 나머지 UI 상태를 모두 날렸고, 재시도 버튼이 `window.location.reload()`로 브라우저 새로고침을 일으켜 클라이언트 상태를 통째로 리셋시켰다.
수정: `ErrorBanner` 컴포넌트를 페이지 레이아웃 내부(FilterPanel/SearchSortBar 아래)에 인라인으로 렌더링하도록 바꾸고, `onRetry`에 `window.location.reload()` 대신 `useProductList`가 제공하는 `refetch`(내부 `reloadKey`를 증가시켜 fetch effect만 재실행)를 연결했다(`ProductListPage.tsx:135-140`, `useProductList.ts:54-56`).

**bug#3 — debounce 없음 + race guard 없음**
원인: 원본은 `searchQuery`/`minPrice`/`maxPrice`가 바뀔 때마다(키 입력마다) fetch effect가 즉시 재실행돼 매 타이핑마다 API를 호출했고, effect에 `ignore` 같은 가드가 없어 이전 요청의 응답이 최신 요청보다 늦게 도착하면 stale 데이터로 최신 상태를 덮어쓰는 race condition이 있었다.
수정: `useDebouncedValue`로 검색어·최소가·최대가를 debounce한 값만 `useProductList`의 `params`에 반영하고(`ProductListPage.tsx:40-65`), `useProductList.ts`의 fetch effect에 `ignore` 플래그를 도입해 클린업된(stale) 요청의 `setState`를 모두 무시하도록 했다(`useProductList.ts:24-51`).

## 미수정 항목

의도적으로 손대지 않았거나 아직 검증하지 못한 항목이다.

- **min > max(가격 범위 역전)**: 사용자가 최소가를 최대가보다 크게 입력해도 막지 않는다. 그대로 서버 쿼리에 실려 나가며, 서버가 빈 결과를 돌려주는 것으로 사실상 처리된다.
- **손상된 localStorage 값**: `useWishlist`/`useRecentlyViewed`는 `JSON.parse` 실패(try/catch)만 방어하고 빈 배열로 폴백한다. 파싱은 되지만 스키마가 다른 값(예: 배열이 아닌 객체, 문자열 배열)에 대한 검증은 하지 않는다.
- **page > totalPages가 `?page=999` 같은 URL로 직접 복원 가능**: bug#1 수정으로 마운트 시 URL의 `page` 값을 그대로 신뢰한다. `parseQueryToFilters`의 `parsePositiveInt`는 "양의 정수인지"만 검증하고 실제 `totalPages`(서버 응답 이후에만 알 수 있음) 상한은 검증하지 않아, 존재하지 않는 페이지 번호로 직접 진입하면 빈 목록 상태에 빠질 수 있다.
- **unknown URL 파라미터가 마운트 시 strip(canonicalization)됨**: `useProductFilters`의 동기화 `useEffect`가 마운트 직후에도 한 번 실행되어, `parseQueryToFilters`가 인식하는 필드만 `serializeFiltersToQuery`로 재직렬화해 `replaceState`한다. 그 결과 `?foo=bar`처럼 스키마에 없는 파라미터는 첫 렌더 직후 URL에서 사라진다(원본에는 없던, 이번 리팩터로 새로 도달 가능해진 동작). 의도된 정규화(canonicalization)인지, UTM 등 보존해야 할 파라미터가 있는지는 검증하지 않았다.
