# Repository Guidelines

## 프로젝트 개요

이 저장소는 pnpm으로 관리하는 Next.js 16 App Router 기반 프로젝트다. React 19와 TypeScript strict mode를 사용하며, 브라우저 동작은 Playwright로 검증한다.

## 프로젝트 구조

Next.js 라우터는 저장소 루트의 `app/`이고, 화면 구현은 `src/` 아래 FSD 레이어에 둔다. `src/app`은 사용하지 않는다.

- `app`: 라우트 파일(`layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`)과 Route Handler
  - `app/api`: mock 백엔드. `_data`에 fixture, `_types.ts`에 Route Handler 전용 응답 타입을 둔다
- `src/_app`: 앱 초기화 — `providers`, `styles`, `ui`
- `src/_pages`: 라우트 단위 조합과 페이지 고유 URL·화면 상태 — `home`, `product-list`
- `src/widgets`: 여러 슬라이스를 조합하는 독립 UI 블록 — `header`, `product-card`
- `src/features`: 사용자의 비즈니스 행위 — `add-to-cart`, `add-to-wishlist`
- `src/entities`: 도메인 타입·상태와 도메인 자체의 표현 — `cart`, `product`, `wishlist`
- `src/shared`: 도메인에 종속되지 않은 `api`, `lib`, `styles`, `ui`
- `src/fonts`: 번들에 포함하는 폰트 파일
- `public`: 이미지 등 정적 자산
- `e2e`: Playwright E2E 테스트
- `docs`: 주차별 과제 명세와 리뷰 기록

레이어 배치와 의존 방향, Public API 기준은 `.claude/rules/fsd-verification.md`를 따른다. 경계는 `eslint/fsd.config.mjs`의 `boundaries` 규칙으로도 검사한다.

경로 별칭은 두 가지다. `@/*`는 `src/*`, `@app/*`는 루트 `app/*`을 가리킨다(`tsconfig.json`, `vitest.config.ts`).

## 개발 및 검증 명령어

- `pnpm install`: 잠금 파일을 기준으로 의존성을 설치한다.
- `pnpm dev`: `http://localhost:3000`에서 개발 서버를 실행한다.
- `pnpm build`: 프로덕션 빌드를 생성하고 Next.js 통합 오류를 확인한다.
- `pnpm start`: 완성된 프로덕션 빌드를 실행한다.
- `pnpm lint`: Next.js 및 TypeScript ESLint 규칙을 검사한다.
- `pnpm typecheck`: `tsc --noEmit`으로 타입을 검사한다.
- `pnpm format`: Prettier로 저장소 전체를 포맷한다.
- `pnpm test`: Vitest 단위 테스트를 1회 실행한다.
- `pnpm test:watch`: Vitest를 watch 모드로 실행한다.
- `pnpm test:e2e`: Chromium과 WebKit에서 Playwright 테스트를 실행한다.
- `pnpm check`: `test → lint → typecheck → build`를 순서대로 실행한다.

특정 테스트만 실행하려면 `pnpm exec vitest run app/api/products/route.test.ts` 또는 `pnpm exec playwright test e2e/home-select.spec.ts`를 사용한다.

## 코드 스타일 및 네이밍

들여쓰기는 공백 두 칸을 사용하고, `src` 내부 import에는 `@/`, 루트 `app` 참조에는 `@app/` 별칭을 활용한다. 포맷은 Prettier에 맡긴다. `any`, `@ts-ignore`, non-null assertion(`!`), 빈 `catch`, `debugger`, 처리하지 않은 Promise, 배럴 파일을 사용하지 않는다. 기존 유틸을 먼저 찾아 재사용하고, 공통 도메인 값과 타입은 `_types.ts` 등 한곳에서 관리한다.

- 컴포넌트 파일: `PascalCase` (`RootProvider.tsx`, `ProductCard.module.css`)
- 훅 파일: `camelCase` (`usePostLike.ts`) — 파일명과 훅 이름을 일치시킨다
- 그 외 파일(유틸·API·설정·타입): `kebab-case` (`post-like.api.ts`, `format-price.ts`)
- 컴포넌트: `PascalCase`
- 커스텀 훅: `useCamelCase`
- 내부 이벤트 핸들러: `handleX`
- 콜백 props: `onX`
- boolean: `is`, `has`, `should`, `can` 접두사
- 상수: `UPPER_SNAKE_CASE`

컴포넌트와 훅은 `const` 화살표 함수로 작성하고 named export를 권장한다. props는 `type` 별칭으로 정의한다.

## React 및 컴포넌트 설계

Client Component 경계는 가능한 한 하위에 두고, 컴포넌트는 하나의 책임만 갖도록 한다. 공용 UI에는 비즈니스 로직을 포함하지 않는다. 파생값은 렌더링 중 계산하며 `useState`와 `useEffect`로 동기화하지 않는다. `useMemo`와 `useCallback`은 실제 성능 문제가 확인된 경우에만 사용한다.

비동기 작업은 Server Component 또는 Server Action을 우선 고려하고, 불가피할 때만 클라이언트 effect를 사용한다. React `key`에는 안정적인 도메인 식별자를 사용하며 배열 인덱스, `Math.random()`, `Date.now()`를 사용하지 않는다. 세부 규칙은 `.claude/rules/code-style.md`와 `.claude/rules/component-design.md`를 따른다.

스켈레톤 UI를 추가하거나 수정할 때는 실제 콘텐츠의 이미지 비율, 텍스트·행위 영역 높이, 컨테이너 간격과 반응형 배치를 최대한 동일하게 맞춘다. 완료 시 로딩 전후 요소 위치가 밀리지 않는지 layout shift를 확인해야 한다. 런타임 확인 권한이 없는 작업이라 직접 확인하지 못했다면 완료 보고에 미검증 항목과 수동 확인 필요성을 명시한다.

FSD 구조를 설계·변경·리뷰하거나 PR 전 셀프 리뷰를 수행할 때는 `.claude/rules/fsd-verification.md`의 파일 배치, Public API, 슬라이스 경계, 상향 의존 점검 기준을 함께 적용한다.

### Zustand store 공개·소비 기준

- entity는 `useCartStore`처럼 Zustand store hook을 Public API로 공개할 수 있다. 목적별 wrapper hook은 동일한 selector가 반복되거나 도메인 계산·정책을 캡슐화할 필요가 생길 때만 만든다.
- React 소비처는 `useStore((state) => state.value)` 형태의 selector로 필요한 상태나 action만 구독한다. selector 없이 store 전체를 구독하거나 전체 state를 구조 분해하지 않는다.
- action도 `useStore((state) => state.action)`으로 선택한다. 여러 값을 선택할 때는 불필요한 새 객체 생성과 리렌더를 피하도록 selector의 반환값과 equality 전략을 검토한다.
- `getState()`는 React 렌더링 밖의 명령형 경계에서만 사용한다. 소비처의 임의 `setState()`는 금지하고, 상태 변경은 store가 공개한 action을 통한다.

### `useSyncExternalStore` 선택 기준

- 실제 외부 store 또는 변경 가능한 브라우저 API를 구독할 때만 `useSyncExternalStore`를 사용한다.
- 단순한 마운트 완료 여부는 `useState(false)`와 마운트 effect로 표현한다.
- 외부 store가 없는데 마운트 여부를 만들기 위해 빈 `subscribe` 함수를 작성하지 않는다.
- SSR을 지원한다면 `getServerSnapshot`은 서버와 최초 클라이언트 hydration에서 정확히 같은 값을 반환해야 한다.
- `getServerSnapshot` 생략은 해당 영역을 의도적으로 클라이언트 전용으로 렌더링하고 Suspense fallback을 사용할 때만 검토한다.
- 서버에서도 외부 store의 초기값을 제공할 수 있다면 동일한 값을 반환하는 `getServerSnapshot`을 제공한다.

## 테스트 작성 기준

테스트는 검증 목적을 충족하는 가장 저렴한 계층부터 선택한다. 순수 함수, Zustand action·selector, 상태 전이, parser와 formatter처럼 브라우저가 필요 없는 로직은 Vitest 단위 테스트를 우선한다. 단위 테스트 파일은 대상 파일 옆에 `<name>.test.ts` 또는 `<name>.test.tsx`로 두고, Vitest는 `src/**`와 `app/**`를 모두 수집한다(`vitest.config.ts`). 환경은 `node`이므로 컴포넌트는 DOM 대신 `renderToStaticMarkup` 같은 서버 렌더링으로 검증한다. 여러 모듈의 연결은 통합 테스트로 검증하고, 실제 라우팅·브라우저 API·키보드 조작·접근성 상태·브라우저별 차이처럼 브라우저 경계가 핵심인 흐름만 Playwright E2E로 검증한다. 같은 동작을 단위 테스트와 E2E에서 중복 검증하지 않으며, E2E에는 핵심 사용자 흐름과 브라우저 경계만 남긴다.

E2E 테스트 파일은 `e2e/<feature>.spec.ts` 형식으로 작성하며 각 테스트는 독립적으로 실행할 수 있어야 한다. locator는 접근 가능한 role과 name을 우선 사용한다. 구현 세부 사항보다 사용자에게 보이는 결과, 키보드 조작, ARIA 상태, 이미지 로딩 여부를 검증한다. Chromium과 WebKit의 동작 차이를 고려하고, 공통 준비 과정은 필요한 경우 `test.beforeEach`에 둔다. 현재 별도의 커버리지 기준은 없다.

## 검증 및 완료 기준

기본 검증은 정적 검사와 타입 검사까지만 수행한다. 사용자가 정상 동작 또는 런타임 확인을 명시적으로 요청하기 전에는 다음 작업을 수행하지 않는다.

- 개발 서버 또는 프로덕션 서버 실행
- 브라우저 확인, HTTP 요청, 화면 캡처, 인쇄 미리보기
- Playwright를 포함한 테스트 실행
- 프로덕션 빌드

“정상 동작 확인”, “직접 테스트”, “브라우저에서 확인”처럼 사용자가 명시적으로 요청한 경우에만 런타임 검증을 수행한다. 단순한 구현, 수정, 검토 요청은 런타임 검증 요청으로 해석하지 않는다.

기본 검증은 다음 명령어를 사용한다.

```bash
pnpm lint
pnpm exec tsc --noEmit
```

`pnpm check`는 `test → lint → typecheck → build`를 모두 실행하므로 기본 검증에 사용하지 않는다. 과제 제출 전처럼 사용자가 전체 검증을 요청했을 때만 실행한다.

변경 파일의 포맷이나 린트만 확인하면 되는 경우에는 해당 파일 범위에서만 정적 검사를 실행한다. `pnpm test`, `pnpm test:e2e`, `pnpm check`, `pnpm build`, `pnpm dev` 및 브라우저 기반 검증은 사용자가 요청한 경우에만 실행한다.

인증, 라우팅, SSR·CSR 경계, 브라우저 API, 인쇄·PDF처럼 정적 검사만으로 결함 가능성을 충분히 낮추기 어려운 변경은 임의로 런타임 검증하지 않는다. 필요한 확인 항목과 이유를 설명하고 사용자에게 먼저 실행 허가를 요청한다.

화면 관련 코드를 직접 수정했지만 런타임 검증을 수행하지 않은 경우 완료 보고에 다음 문구를 그대로 포함한다.

> 런타임 확인하지 않음

문서, 설정, 서버 전용 코드 등 화면과 무관한 변경에는 이 문구를 넣지 않는다. 완료 보고에는 변경 내용, 주요 파일, 실행한 검사와 결과, 실행하지 않은 검사와 이유, 남은 위험 또는 사용자 확인 사항을 간단히 적는다.

## 커밋 및 Pull Request

커밋은 Conventional Commit 형식과 간결한 한국어 제목을 사용한다. 허용하는 주요 prefix는 `feat`, `fix`, `refactor`, `docs`, `test`, `chore`다. 예: `fix: 컴포넌트 리뷰 지적사항 반영`. 하나의 커밋에는 하나의 논리적 변경만 포함한다.

`feat/week-04`처럼 범위가 드러나는 브랜치에서 작업한다. PR에는 변경 목적과 범위, 설계 또는 학습 과정에서 내린 판단, 피드백이 필요한 부분을 작성한다. 관련 과제나 이슈를 연결하고 UI 변경에는 스크린샷을 첨부한다. 제출 전 기본 정적·타입 검사를 실행하고 결과를 PR에 남긴다. 빌드와 Playwright 결과는 사용자가 해당 검증을 요청해 실제로 수행한 경우에만 기록한다.
