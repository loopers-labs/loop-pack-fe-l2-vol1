## Stack

## Commands

- `pnpm dev` — dev server
- `pnpm build` — tsc -b && vite build
- `pnpm lint` — ESLint (스타일 규칙은 전부 여기서 강제됨 스타일을 이 파일에 적지 말 것)
- `pnpm typecheck` — tsc --noEmit
- `pnpm format` — Prettier

## 상태 분류 기준

- 서버에서 오는 데이터 → 서버 상태 (추후 TanStack Query)
- UI 전용 (모달 열림, 탭 선택) → 로컬 상태 (useState)
- URL에 반영되어야 하는 것 (필터, 페이지, 검색어) → URL 상태 (nuqs)
  - URL 파라미터는 전용 훅 하나에 캡슐화 (`useProductSearchParams` 패턴)
  - 훅이 params(UI 표시용)와 query(API 요청용)를 분리해서 반환
  - 필터 변경 시 page 리셋은 훅 내부에서 처리, 호출부가 신경 쓰지 않음
- 여러 컴포넌트가 공유해야 하는 것 → Context 또는 전역 상태

## Component

- 컴포넌트의 Props가 5개를 넘으면 설계를 재검토
- children을 적극 활용해 합성(Composition) 우선
- Props Drilling이 3단계 이상이면 Context 또는 상태 관리 도입 검토
- 공통 컴포넌트는 비즈니스 로직을 포함하지 않음

- 파일 하나에 export 하나 (작은 헬퍼 co-location만 허용)
- Props interface는 파일 상단에 정의, 시그니처에서 구조분해 (본문 말고)
- 파일 내부 순서: 타입 → 상수 → 컴포넌트 안에서 훅 → 파생값 → 핸들러 → early return → JSX
- 이벤트 네이밍: 밖에서 받는 prop은 `on{Event}`, 내부 구현은 `handle{Event}`
- boolean prop/state는 `is` / `has` / `should` 접두사
- 조건부 렌더링은 early return 우선

- 컴포넌트 ~150줄 넘으면 분리 신호 (쪼개거나 합성 패턴)
- 세부 규칙·예시는 필요할 때 읽기: docs/frontend-conventions.md

## 패턴 가이드

- headless 훅: `_hooks/` 디렉토리에 배치, 마크업·스타일 포함 금지
- compound 컴포넌트: `index.tsx`에서 서브 컴포넌트를 조립하고 re-export (`Dialog.Trigger`, `Dialog.Content` 등)
- Context: `_contexts/` 디렉토리에 분리, provider 밖에서 사용 시 에러를 던지는 가드 필수
- 타입: 훅/컴포넌트 전용 타입은 `_types/`에 co-locate, 여러 곳에서 쓰는 타입은 `src/types/`
- 페이지 전용 컴포넌트: 해당 라우트 폴더의 `_components/`에 배치 (`_` 접두사 = 외부 import 금지)
- prop getter 패턴: ARIA 속성 + 이벤트 핸들러를 하나의 객체로 묶어 반환, 사용처에서 spread

## 테스트

- 라이브러리성 코드(`src/components/ui/`): vitest + @testing-library/react 단위 테스트 필수
- 페이지 컴포넌트: 수동 확인 또는 추후 E2E
- 테스트 파일 위치: 대상 파일과 같은 디렉토리에 `*.test.tsx`로 co-locate
- 커밋 전 `pnpm test` 통과 확인

## 의존성 추가

- 새 패키지가 필요하면 사유를 먼저 설명하고 확인받기
- 런타임에 불필요한 패키지는 `devDependencies`에 설치
- 이미 있는 패키지로 해결 가능하면 추가하지 않기

## 검증

- 코드 변경 후 `pnpm typecheck`는 항상 자동 실행 (요청 불필요)
- 코드 변경 후 관련 파일에 동일 로직 중복이 없는지 자동 확인 (요청 불필요)

## 작업 방식

- 코드 짜기 전에 접근 방식을 한 줄로 먼저 확인받고 시작
- 생성한 코드는 "왜 이렇게 짰는가"를 설명할 수 있어야 함, 설명 못 하면 다시 짜기

## Commits

- 형식: `<타입>(<스코프>): <제목>` — Conventional Commits
- 언어: 한국어 (타입·스코프는 영문 유지)
- 제목: 50자 이내, 마침표 없음, 명령형 동사로 시작
- 본문: **왜 바꿨는가** 필수, 자명해 보여도 이유 한 줄은 반드시 있어야 함
- 타입: `feat` / `fix` / `refactor` / `style` / `docs` / `test` / `chore`

## Never

- lint / typecheck 통과 안 한 코드 커밋
- `--no-verify`로 git hook 우회
- 스타일·포맷 규칙을 이 파일에 추가 (무조건 린터가 주인)
- `.env` / 시크릿 / 키 커밋
- 한 PR에 목적 두 개 이상 섞기
- 못 보던 라이브러리 임의 추가, 필요하다면 먼저 묻기
