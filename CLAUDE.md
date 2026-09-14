# Repository Development Guide

이 문서는 이 저장소에서 코드를 변경할 때 따라야 할 공통 작업 절차와 필수 규칙을 정의한다. 정확한 명령과 버전은 `package.json`과 설정 파일을, 과제별 요구사항과 설계 결정은 관련 문서를 기준으로 판단한다.

## Source of Truth

정보가 충돌하면 다음 순서로 확인한다.

1. 실행 명령과 패키지 버전: `package.json`, `.nvmrc`
2. 도구가 강제하는 규칙: TypeScript, ESLint, Vitest, Playwright 등의 설정 파일
3. 과제별 요구사항: `docs/assignments/week-0N.md`
4. 확정된 설계 결정: 관련 `docs/rfc/` 문서
5. 공통 프런트엔드 규칙: `docs/frontend-conventions.md`
6. 일반 작업 절차: 이 문서

문서와 실제 설정이 다르면 실제 설정을 우선하고, 작업 범위에 문서 수정도 포함한다.

## Project Snapshot

- Next.js App Router, React, TypeScript
- TanStack Query: 서버 데이터 조회와 캐시
- Zustand: 장바구니와 위시리스트 등 클라이언트 전역 상태
- nuqs: URL 검색 파라미터 상태
- Zod: 런타임 입력 검증
- Vitest, Testing Library, MSW: 단위·통합 테스트
- Playwright: 브라우저 E2E 테스트
- Tailwind CSS: 스타일링

정확한 버전은 `package.json`과 `.nvmrc`에서 확인한다.

## Commands

`package.json`의 scripts를 실행 명령의 기준으로 사용한다.

- `pnpm dev`: Next.js 개발 서버 실행
- `pnpm build`: 프로덕션 빌드
- `pnpm start`: 프로덕션 서버 실행
- `pnpm lint`: ESLint 실행
- `pnpm typecheck`: TypeScript 타입 검사
- `pnpm test`: Vitest 전체 테스트 실행
- `pnpm test:watch`: Vitest 감시 모드 실행
- `pnpm test:e2e`: 프로덕션 빌드 후 Playwright E2E 테스트 실행
- `pnpm check`: 테스트, lint, 타입 검사, 빌드, Playwright를 순서대로 실행

## Before Editing

1. `README.md`와 `docs/frontend-conventions.md`를 확인한다.
2. 현재 작업과 관련된 `docs/assignments/`, `docs/rfc/`, `docs/week-07-performance/` 문서를 읽는다.
3. `rg`로 기존 컴포넌트, 훅, 유틸리티와 유사한 구현을 검색한다.
4. 작업 트리의 기존 변경사항을 확인하고 관련 없는 사용자 변경을 수정하거나 되돌리지 않는다.
5. 요구사항이 여러 방식으로 해석될 수 있고 결과가 크게 달라진다면 구현 전에 선택 근거를 확인한다.

## Architecture

현재 프런트엔드 구조는 `app → _pages → features → entities → shared` 방향의 FSD(Feature-Sliced Design) 경계를 따른다. 자세한 결정과 예외는 [FSD 구조 전환 RFC](docs/rfc/week06-fsd.md)를 확인한다.

- `src/app`: Next.js 라우팅, 레이아웃, 프로바이더, Route Handler
- `src/_pages`: 페이지 단위 UI와 조합 로직
- `src/features`: 사용자에게 가치를 주는 행동과 도메인 조합
- `src/entities`: 도메인 모델, 상태, 데이터 접근
- `src/shared`: 도메인과 무관한 UI, API 기반 코드, 유틸리티

동일 레이어의 다른 슬라이스를 직접 참조하거나 하위 레이어에서 상위 레이어를 참조하지 않는다. 공통 코드라는 이유만으로 `shared`에 두지 말고 변경 이유와 소유 도메인을 기준으로 배치한다. 새 레이어, barrel file 또는 Public API 패턴을 임의로 도입하지 않는다.

## State and Data

- 서버 데이터는 TanStack Query 캐시를 단일 source of truth로 사용한다. Zustand나 로컬 state에 복사하지 않는다.
- 검색, 필터, 정렬처럼 공유하거나 복원해야 하는 값은 nuqs를 사용해 URL에 저장한다.
- 여러 화면이 공유하는 클라이언트 상태는 소유 엔티티의 Zustand store에 둔다.
- 한 컴포넌트 안에서만 필요한 일시적인 UI 상태는 `useState`로 관리한다.
- 인증 상태는 서버 세션 쿠키를 기준으로 판단한다. 클라이언트 상태만으로 인증 여부를 확정하지 않는다.
- 외부 입력과 URL 파라미터는 타입 단언 대신 런타임에 검증한다.
- Server Component에서 같은 애플리케이션의 Route Handler를 HTTP로 다시 호출하지 않는다. 해당 데이터 함수나 서비스를 직접 호출한다.

## Implementation Rules

컴포넌트 구조, 네이밍, 상태와 파생값, 렌더링, 접근성 및 금지 규칙은 `docs/frontend-conventions.md`를 따른다. 특히 다음 항목을 지킨다.

- 컴포넌트는 하나의 주요 책임을 갖게 한다.
- Props가 7개를 넘거나 서로 관련 없는 책임을 함께 전달하면 분리 또는 합성 패턴을 검토한다.
- 파생값은 가능한 한 렌더링 중 계산하고, props나 state를 다른 state에 복사하지 않는다.
- `useEffect`는 외부 시스템과 동기화할 때만 사용한다.
- 이벤트 prop은 `on{Event}`, 내부 핸들러는 `handle{Event}` 형식으로 이름을 짓는다.
- 접근 가능한 기본 HTML 요소와 의미 있는 role, accessible name을 우선한다.
- 기존 `src/shared/lib` 유틸리티가 있으면 같은 로직을 다시 구현하지 않는다.
- 기존 패턴과 다른 구조를 선택하거나 비명확한 제약을 반영하면 선택 이유를 코드 또는 관련 문서에 남긴다.

하나의 파일은 하나의 주요 책임을 갖는다. 주요 컴포넌트와 함께 사용하는 타입, 상수, 작은 헬퍼는 같은 파일에 둘 수 있다.

## Dependencies

- 새 패키지를 추가하기 전에 현재 의존성으로 해결할 수 있는지 확인한다.
- 새 런타임 의존성이 필요하면 추가 목적과 번들 크기·유지보수 영향을 먼저 설명하고 승인을 받는다.
- 테스트, 타입, 빌드에만 필요한 패키지는 `devDependencies`에 추가한다.
- 설치 후 lockfile 변경을 함께 확인한다.

## Verification

변경 유형에 맞는 가장 가까운 검증부터 실행한다.

- 순수 로직: Vitest 단위 테스트
- UI와 API 경계: Testing Library와 MSW 통합 테스트
- URL, 브라우저 저장소, 인증, 핵심 사용자 흐름: Playwright E2E 테스트
- 코드 변경의 기본 검사: `pnpm typecheck`와 `pnpm lint`
- 전체 회귀와 CI 동등 검사: `pnpm check`

테스트 파일은 대상 코드와 같은 디렉터리에 `*.test.ts` 또는 `*.test.tsx`로 둔다. 브라우저 E2E 테스트는 `e2e/`에 둔다. 테스트 범위를 결정할 때는 [테스트 계획](docs/rfc/week08-test-plan.md)과 [E2E 범위](docs/rfc/week09-e2e-scope.md)를 참고한다.

문서만 변경했다면 링크, 명령, 파일 경로와 실제 설정의 일치 여부를 확인한다. 코드 동작에 영향이 없다면 전체 빌드나 E2E 테스트를 실행할 필요는 없다.

검증을 마친 뒤 diff를 검토하여 다음 항목을 확인한다.

- 기존 코드와 중복된 로직
- 요구사항과 테스트 누락
- 불필요한 하드코딩
- FSD 의존 방향 위반
- 관련 없는 파일 변경

## Commits

- Conventional Commits 형식인 `<type>(<scope>): <subject>`를 사용한다.
- `type`과 `scope`는 영문으로, subject는 한국어 명령형으로 작성한다.
- subject는 마침표 없이 50자 이내로 작성한다.
- 본문에는 변경 내용의 반복보다 변경 이유와 중요한 판단을 기록한다.
- type은 `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore` 중에서 선택한다.

## Prohibited Actions

- 실패한 lint, typecheck 또는 테스트를 무시하고 완료로 보고하지 않는다.
- `--no-verify`로 Git hook을 우회하지 않는다.
- 특정 파일만 통과시키기 위한 예외성 lint 또는 TypeScript 설정을 추가하지 않는다.
- `.env`, 비밀 키, 인증 정보를 커밋하지 않는다.
- 요청과 관련 없는 변경을 같은 작업에 포함하지 않는다.
- 필요성이 확인되지 않은 라이브러리나 패턴을 추가하지 않는다.
- 사용자 변경사항을 임의로 삭제하거나 되돌리지 않는다.

## Related Documentation

- 프로젝트 설정과 구조: [README](README.md)
- 프런트엔드 상세 규칙: [Frontend Conventions](docs/frontend-conventions.md)
- 주차별 요구사항: [Assignments](docs/assignments/)
- FSD 구조 결정: [FSD 구조 전환 RFC](docs/rfc/week06-fsd.md)
- 테스트 전략: [테스트 계획](docs/rfc/week08-test-plan.md)
- E2E 범위: [E2E 범위](docs/rfc/week09-e2e-scope.md)
- 성능 개선 기록: [7주 차 성능 개선](docs/week-07-performance/README.md)
