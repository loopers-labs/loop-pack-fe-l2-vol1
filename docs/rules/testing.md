# 검증 절차

작업 완료 전에는 변경 범위에 맞는 검증을 실행한다. 이 저장소의 기본 package manager는 `pnpm`이다.

## 기본 명령

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

각 명령의 의미:

- `pnpm format:check`: Prettier 포맷 위반 확인
- `pnpm lint`: ESLint 규칙 위반 확인
- `pnpm typecheck`: TypeScript 프로젝트 references 기준 타입 검사
- `pnpm build`: 타입 검사 후 Vite 빌드

## 변경 유형별 기준

### 문서만 변경

- `pnpm format:check`를 실행한다.
- 문서의 링크와 경로가 실제 파일과 일치하는지 확인한다.

### TypeScript/React 코드 변경

- `pnpm lint`
- `pnpm typecheck`
- 관련 테스트가 있다면 해당 테스트
- 최종적으로 `pnpm build`

### UI/CSS 변경

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- 브라우저에서 주요 viewport와 키보드 흐름 확인
- 접근성 체크리스트(`docs/rules/accessibility.md`) 확인

### 설정 변경

- 변경한 설정이 영향을 주는 명령을 직접 실행한다.
- ESLint/Prettier/TypeScript 설정 변경은 각각 `pnpm lint`, `pnpm format:check`, `pnpm typecheck`로 검증한다.

## 테스트가 아직 없는 경우

현재 저장소에는 별도 test script가 없다. 새 테스트 러너를 도입할 때는 다음을 함께 문서화한다.

- test script 이름
- 테스트 파일 위치 규칙
- unit/integration/e2e 범위
- CI 또는 Git hook 연결 여부

테스트가 없다는 이유로 lint/type/build 검증을 생략하지 않는다.

## 실패 처리

- 실패 원인을 읽고 root cause를 고친다.
- 실패하는 검증을 삭제하거나 약화하지 않는다.
- 우회가 필요해 보이면 먼저 코드 구조와 타입 설계를 다시 검토한다.
- 검증을 실행하지 못했다면 최종 보고에 명령, 실패 이유, 남은 리스크를 적는다.
