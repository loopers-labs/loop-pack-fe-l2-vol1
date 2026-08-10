# 커밋 규칙

## When to read

커밋 메시지를 작성하거나 commitlint, lint-staged, Git hook 동작을 변경하거나 실패를 해결할 때 읽는다.

## Source of truth

실제 커밋 메시지 검증은 `commitlint.config.cjs`, hook 실행 방식은 `.husky/*`, staged 파일 처리는 `package.json`의 `lint-staged`가 우선한다.

## Rules

커밋 메시지는 나중에 변경 이유를 추적하는 최소 단위다. AI가 만든 커밋도 사람이 만든 커밋과 같은 기준으로 읽혀야 하므로 형식을 자동 검증한다.

커밋 메시지는 Conventional Commits 형식을 따른다.

```txt
type: 한국어 설명
```

- 설명은 한국어로 작성한다.
- scope를 사용하지 않으며 `type(scope)` 형식은 허용하지 않는다.

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

docs: 8주차 테스트 전략 문서화
```

### Git hook

- `.husky/pre-commit`: staged 파일에 대해 lint-staged를 실행한다.
- `.husky/commit-msg`: 커밋 메시지를 commitlint로 검증한다.
- 두 hook 모두 `pnpm`을 우선 사용하고, 없으면 Corepack의 `pnpm`을 사용한다. 둘 다 없으면 실패하도록 둔다.

### 우회 금지

- `--no-verify`로 hook을 우회하지 않는다.
- hook 실패는 메시지나 설정을 고쳐 해결한다.
- 형식을 맞추기 위해 의미 없는 type을 붙이지 않는다.
- scope를 추가해 변경 범위를 표현하지 않는다. 변경 범위는 한국어 설명에 드러낸다.

## Verification

```bash
pnpm commitlint --edit <commit-msg-file>
```

커밋 시 pre-commit과 commit-msg hook을 우회하지 않고 통과해야 한다.
