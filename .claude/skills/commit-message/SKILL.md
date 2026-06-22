---
name: commit-message
description: '커밋 메시지 생성. Conventional Commits 기반 한글 작성'
---

# 커밋 컨벤션

TRIGGER — 커밋 작성, 커밋 메시지 작성 요청 시 이 스킬을 먼저 로드.

Conventional Commits 기반, 한글 작성.

## 형식

```
<type>(<scope>): <subject>

<body>
```

- `<scope>`, `<body>` 선택. `<subject>` 한글, 마침표 생략, 50자 이내

## type

| type       | 용도                     |
| ---------- | ------------------------ |
| `feat`     | 새 기능                  |
| `fix`      | 버그 수정                |
| `refactor` | 기능 변경 없는 코드 개선 |
| `style`    | 포맷팅 등 의미 변경 없음 |
| `docs`     | 문서                     |
| `test`     | 테스트                   |
| `chore`    | 빌드, 패키지, 설정       |

## scope (선택)

변경 대상의 레이어/슬라이스: `feat(auth):`, `fix(shared/ui):`

## body (선택)

"왜"를 기술, 한 줄 72자 이내 권장

## Breaking Change

`feat!:` 또는 footer에 `BREAKING CHANGE:` 기입
