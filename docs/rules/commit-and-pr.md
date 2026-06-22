# 커밋과 PR 규칙

이 문서는 커밋 메시지, Git hook, PR 설명의 의도를 설명합니다. 실제 커밋 메시지 검증의 source of truth는 `commitlint.config.cjs`이고, hook 실행 방식의 source of truth는 `.husky/*`입니다.

## 목적

커밋 메시지는 나중에 변경 이유를 추적하는 최소 단위입니다. AI가 만든 커밋도 사람이 만든 커밋과 같은 기준으로 읽혀야 하므로, 형식을 자동 검증합니다.

## Commitlint

커밋 메시지는 Conventional Commits 형식을 따른다.

```txt
type(scope): subject
```

허용하는 type:

- `feat`: 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 포맷, 세미콜론, 공백 등 동작 없는 스타일 변경
- `refactor`: 동작 변경 없는 구조 개선
- `test`: 테스트 추가/수정
- `chore`: 빌드, 패키지, 설정, 기타 작업
- `ci`: CI/CD 설정 변경

예시:

```txt
chore: commitlint 게이트 추가

docs(agent): AGENTS 진입점 설명 보강
```

## Git hook

- `.husky/pre-commit`: staged 파일에 대해 lint-staged를 실행한다.
- `.husky/commit-msg`: 커밋 메시지를 commitlint로 검증한다.

두 hook 모두 `pnpm`을 우선 사용하고, 없으면 Corepack의 `pnpm`을 사용합니다. 둘 다 없으면 실패하도록 둡니다.

## 우회 금지

- `--no-verify`로 hook을 우회하지 않는다.
- hook 실패는 메시지나 설정을 고쳐 해결한다.
- 형식을 맞추기 위해 의미 없는 type이나 scope를 붙이지 않는다.

## PR 설명 기준

PR 본문에는 최소한 다음을 남긴다.

- 이번 변경의 설계 의도
- AI가 생성한 부분과 사람이 직접 검토·수정한 부분
- 실행했거나 의도적으로 생략한 검증 명령
- 강한 lint 규칙이 있다면 그 규칙을 둔 이유와 조정 가능성
