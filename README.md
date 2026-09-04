# Loopers Frontend 스터디

> **"설명할 수 없는 코드는 커밋하지 않는다."** — 이 스터디의 제1원칙이자, 이 레포의 모든 커밋에 적용한 기준입니다.

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제를 수행하며 남긴 기록입니다.
단순 기능 구현이 아니라 **코드 품질 · 설계 근거 · AI 협업 방식**에 집중합니다.
매주 과제를 수행해 PR로 제출하고, 코치 리뷰 피드백을 반영해 수정·보완하는 방식으로 진행합니다.

- **기간**: 2026.06 — 진행 중
- **스택**: TypeScript · React 19 · Next.js (App Router) · TanStack Query · nuqs · Zustand · Tailwind CSS v4 · Vitest · Playwright
- **이 브랜치(`kjeunn`)**: 주차별 작업을 통합한 브랜치 (main은 upstream 동기화 전용)

## 브랜치 구조

| 브랜치         | 용도                                                               |
| -------------- | ------------------------------------------------------------------ |
| `kjeunn`       | **작업 총집합** — 주차별 결과물이 모두 병합된 브랜치 (기본 브랜치) |
| `feat/week-0N` | 주차별 작업 브랜치 — 각 주차의 커밋 히스토리와 근거 문서           |
| `main`         | upstream(스터디 원본) 동기화 전용                                  |

> 이 레포는 스터디 원본을 포크한 것입니다. 커리큘럼·과제 운영·제출 절차는 **[스터디 원본 레포](https://github.com/loopers-labs/loop-pack-fe-l2-vol1)** 의 README를 참고하세요.

## 주차별 기록

### [1주차 — 코드 품질 하네스 & AI 협업 환경](../../tree/feat/week-01)

기능 구현 전에 "좋은 코드의 기준"을 기계에 새기는 작업부터 시작했습니다.

- ESLint(flat config) + Prettier + husky·lint-staged로 **커밋 게이트** 구성 — 핵심 룰은 `error` 레벨로 우회 불가능하게
- 고의로 규칙을 위반한 커밋을 시도해 **게이트가 실제로 막히는지 검증** ([커밋 기록](../../commits/feat/week-01))
- AI 협업 규칙을 `CLAUDE.md`에 정리 — AI가 생성한 코드에도 같은 게이트가 적용되도록

### [2주차 — 컴포넌트 & Props 리팩토링](../../tree/feat/week-02)

동작하는 체크아웃 화면에서 bad smell을 판별하고, **근거 있는 리팩토링만** 수행했습니다.

- 파생 상태를 state로 들고 있던 `finalPrice`를 **렌더 시 계산으로 전환** — 상태 동기화 버그(VIP 할인 미반영) 함께 수정
- God Component에서 `PriceSummaryCard` · `OrderCompletePage` 분리, 카드 전용 스타일 CSS Modules 전환
- 절대경로 alias(`@/*`) 도입, 컴포넌트 작업 컨벤션을 `CONVENTION.md`로 문서화

### [3주차 — 관심사 분리 & Custom Hook](../../tree/feat/week-03)

500줄 단일 컴포넌트(`ProductListPage`)를 **Components / Hooks / Services / Utils** 레이어로 분리했습니다.
분리한 것과 **분리하지 않은 것 모두** 근거를 남겼습니다. → [관심사 판별표 · 버그 기록](../../blob/feat/week-03/src/productList/README.md)

- 상태 3분할(서버 / 클라이언트 / 파생값) 기준으로 Custom Hook 추출 — `useProducts` · `useProductQuery` · `useWishlist` 등
- 필터·검색·페이지 조건의 **단일 소스를 URL로 전환** — 새로고침·공유·뒤로가기에서 조건 복원
- 빠른 필터 변경 시 옛 응답이 최신 응답을 덮어쓰는 **race condition 방어**, 범위 초과 페이지 URL 진입 가드
- 로딩·에러 boolean 조합을 status enum으로 통합

### [4주차 — Next.js 착수 & 디자인 패턴](../../tree/feat/week-04)

Next.js(App Router)로 커머스 베이스를 세우고, UI 라이브러리 없이 패턴을 직접 구현했습니다.

- **Select (Headless)** — 로직 한 벌(`useSelect`: 키보드 내비게이션·품절 옵션 스킵·객체 value)로 텍스트/사이즈/썸네일 3종 UI 렌더
- **Dialog (Compound)** — `Dialog.Trigger/Overlay/Panel/Title/Description/Close` 조립, controlled·uncontrolled **이중 API**, Portal 렌더, 중첩 다이얼로그의 전역 자원 처리(스크롤 잠금 refcount · Esc stack), SSR mounted 가드
- Vitest + Playwright를 직접 셋업하고 Select·Dialog의 **컴포넌트 계약 테스트** 작성
- FSD 관점의 레이어 정리(shared / features / views) 및 Tailwind v4 도입

### [5주차 — 상태 관리 아키텍처](../../tree/feat/week-05)

도구를 먼저 고르지 않고 **Source of Truth를 먼저 찾는** 기준으로 상태 경계를 설계했습니다. 홈·상품 목록을 만들며 값마다 원본의 위치로 저장소를 나눴습니다.

- **상태 경계** — 서버 데이터는 TanStack Query(`queryOptions` 팩토리), 공유·복원이 필요한 검색 조건은 nuqs(URL 상태), 익명 장바구니·위시리스트는 Zustand(persist·id만 저장, 개수는 `ids.length`로 파생), 입력 초안은 React 로컬 상태
- **Advanced A~D** — persist 영속화(`skipHydration` · zod · `version`/`migrate`) · 홈 서버 프리패치(요청별 QueryClient · `dehydrate`/`HydrationBoundary`) · UX 개선(debounce · `keepPreviousData` · 다음 페이지 prefetch) · 상태 계약 테스트(유닛 70 · E2E 16)
- **리뷰 반영** — `keepPreviousData`로 이전 목록을 보는 동안 옛 조건의 없는 페이지를 받던 prefetch 경합을, 트리거를 hover/focus로 옮겨 해소 ([커밋 기록](../../commits/feat/week-05))

### [6주차 — FSD 아키텍처 전환](../../tree/feat/week-06)

동작을 보존하며 **"이 파일은 어디에 두나 · 이 변경은 어디까지 퍼지나"** 에 답할 수 있는 구조로 재정렬했습니다. RADIO RFC로 결정을 먼저 문서화한 뒤 이동했습니다. → [RFC](../../blob/feat/week-06/docs/rfc/week06-fsd.md)

- **FSD 재정렬** — `app → _pages → widgets → features → entities → shared` 단방향 의존, 상태=entity·행위=feature, Public API는 은닉이 있는 4곳만(나머지 deep import), `types/commerce.ts` God-file을 소유자별로 분해
- **의존 하네스(Advanced A)** — `eslint-plugin-boundaries`로 역방향·같은 레이어 cross-slice import를 **선언형 강제**(위반 probe로 실제 잡히는지 실측)
- **에러 처리(4단계)** — `throwOnError`를 **data 우선**으로(첫 로딩 5xx만 경계, 배경 재조회 실패는 목록 유지 + 인라인 배너), 상품 목록 **서버 프리패치 + page 초과 시 서버 redirect**
- **레이아웃 / RSC** — 헤더를 `(commerce)` route group layout으로(중복 제거·전환에도 유지), 서버가 `searchParams`를 읽어 동적 라우트가 되며 `useSearchParams` Suspense 제거
- **변경 반경 실증(Advanced B)** — 검색·필터·정렬 전체 초기화, 장바구니 전체 비우기를 **실제 구현**해 예측↔실제 대조. 독립 2 store 격리(cart만 비우고 wishlist 무관)를 테스트로 실증
- **리뷰 반영** — 껍데기 관찰자를 `useShellProductList`로 명명, pages-first는 근거 존중해 반려, `throwOnError` data 가드는 TanStack 공식 패턴으로 정정 ([커밋 기록](../../commits/feat/week-06))

### [7주차 — 프론트엔드 성능 최적화](../../tree/feat/week-07)

빠른 숫자를 만들려 느린 API를 지우는 대신, 같은 경로를 production build에서 반복 측정하고 **가장 긴 구간에만 최소 개입**했습니다. 판단마다 실측 근거를 남겼습니다. → [측정·판단 기록](../../blob/feat/week-07/docs/rfc/week07-performance.md)

- **Hero LCP** — LCP를 서버응답·발견·전송·렌더로 분해해 전송(8,155ms)이 지배 구간임을 특정, 표시폭 리사이즈+webp만 적용(전송 **−97.7%**, LCP median **8.10→1.2s**, FCP·CLS 불변)
- **렌더링 경계** — 정적 셸(h1·설명)을 `await` 밖에서 즉시 렌더하고 데이터 의존 본문만 Suspense 스트리밍(document TTFB 1,625→169ms)
- **목록 상태·CLS** — 최초 진입·갱신·0건·실패·취소 여섯 상태를 나눠 다루고(`loading.tsx`·펄스 딤·AbortSignal), 전환 CLS **0.13→0.000**. active query key로 늦은 요청이 현재 화면을 덮지 않음
- **동적 metadata** — 본문과 같은 query factory로 조회, request 범위 fetch memoization으로 Route Handler **1회**(서버 계수 확인), shallow merge로 공통 OG 유지, 스트리밍 metadata의 UA별 대기 비용 판단
- **회귀 확인(4단계)** — 3단계 metadata가 Hero를 데이터 뒤로 밀어 LCP를 악화시킨 걸 재측정에서 발견(**헤드리스 Lighthouse는 못 잡고 실브라우저 simulated로만**), 셸 preload로 복구
- **Advanced A** — 찜 1클릭에 관계없는 카드 24개가 리렌더되던 걸 zustand 셀렉터를 boolean 구독으로 좁혀 **1개로**(Performance=클릭 구간, Profiler=렌더 범위·원인)
- **리뷰 반영** — deprecated `priority`→`preload`(재발은 lint 룰로), `appOrigin` 미설정 시 throw(배포 오설정 fail-fast), preload를 Next 문서대로 Client Component로 분리, root 에러 경계(`global-error`) 복구 ([커밋 기록](../../commits/feat/week-07))

### [8주차 — 프론트엔드 테스트 전략](../../tree/feat/week-08)

지킬 스펙이 명세로 주어지지 않아, 무엇을 어느 층(단위·통합·E2E)에서 검증할지를 먼저 정하고 15개 항목을 구현했습니다. 층은 감이 아니라 **세 가지 질문**으로 나눴습니다 — ① 함수를 호출해 반환값만 보면 되는가(→ 단위), ② 실제 브라우저에서만 나타나는 동작인가(→ E2E), ③ 이 동작을 내가 직접 짰는가, 아니면 라이브러리가 알아서 하는가(→ 내가 짠 것만 검증). 라이브러리가 책임지는 부분은 믿고 다시 확인하지 않았습니다. → [테스트 전략 문서](../../blob/feat/week-08/docs/rfc/week08-test-plan.md)

- **층 배치** — 개수 계산·조회 키·페이지 파서처럼 함수 호출만으로 확인되는 것은 **단위**, 요청을 보내 화면이 로딩에서 성공·빈 결과·에러로 갈라지는 흐름은 **통합**, 뒤로가기·새로고침·화면 이동처럼 jsdom이 흉내 낼 수 없는 실제 브라우저 동작은 **E2E**로 나눴습니다. 애매했던 빈 결과·5xx는 화면에 닿는 유일한 경로가 조회라서 통합으로 넓혔습니다.
- **가짜 서버(MSW)와 환경 분리** — `fetch`를 직접 바꿔치기하던 곳을 MSW로 옮겨, 요청이 실제로 나가고 네트워크 경계에서 가로채도록 했습니다. 정의하지 않은 요청은 곧바로 실패로 드러나게 막고, 테스트 환경은 기본 `node`·DOM이 필요한 파일만 `jsdom`으로 선언해 셋업 시간을 약 **2.8배** 줄였습니다.
- **자가검증 — 수동 3단계 + Stryker 변이** — 구현을 한 곳씩 일부러 깨보는 것에 더해, "깰 곳을 내가 골랐다"는 편향을 메우려 Stryker로 순수 로직을 전수 변형했습니다. 손이 놓친 사각(에러 종류 가드·찜 토글 대상·파서 기본값)을 찾아 보강했고, persist 검증을 `sanitize` 동기 단위로 떼어 총점 흔들림을 78~85%에서 **87.8~89.6%**로 좁혔습니다(타임아웃이 killed로 집계되는 특성상 바닥값 **87.83%**가 신뢰값).
- **리뷰 반영** — 통합 테스트 셋업을 공용 헬퍼로 합치고, 복붙 중복을 자동으로 잡는 게이트(sonarjs·jscpd)를 더했습니다. 테스트 순서를 무작위로 섞어(`--sequence.shuffle`) 서로 간섭하던 문제를 격리하고, 통합으로 재현이 안 돼 제외했던 `keepPreviousData`는 설정 단언(단위)과 전용 E2E 두 층으로 이었습니다. ([커밋 기록](../../commits/feat/week-08))

## AI 협업 방식

AI가 생성한 코드도 머지하는 순간 내 코드라는 원칙으로 작업합니다.

- 프로젝트 규칙을 `CLAUDE.md`로 주입하고, 커밋 게이트가 AI 생성 코드에도 동일하게 적용
- 컴포넌트 리뷰 관점을 [`.claude/skills`](.claude/skills)(analyze-component · pattern-review)로 직접 작성해 반복 검증에 활용
- PR 본문에 AI 생성 부분을 표기하고 직접 검토·수정한 내역 기록

## 실행

```bash
nvm use          # Node.js 24 (>=22.12.0)
pnpm install
pnpm dev         # 개발 서버
pnpm test        # Vitest 단위·컴포넌트 테스트
pnpm test:e2e    # Playwright E2E
pnpm lint        # ESLint (커밋 시 husky가 자동 실행)
```

## 과제 명세

주차별 과제 원문은 [`docs/assignments/`](docs/assignments)에 있습니다.
