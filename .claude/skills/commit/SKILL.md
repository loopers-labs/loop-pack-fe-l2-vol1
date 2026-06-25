---
name: commit
description: 커밋 & GitHub 푸시 skill입니다. "커밋해줘", "이거 푸시해줘", "변경사항 올려줘" 라고 하면 이 skill이 활성화됩니다.
allowed-tools: Bash(git *), Bash(gh *), Read
argument-hint: [scope]
model: sonnet
---

# Commit Skill — 커밋 & 푸시 가이드

> 변경사항을 확인하고, 의미 있는 커밋 메시지를 만들고, 안전하게 푸시합니다.
> **자동 커밋 금지**: 사용자가 "커밋해줘" / `/commit` 으로 **명시적으로 지시**했을 때만 커밋을 수행한다.

---

## 커밋 실행 순서

변경 파일을 파악하고 의미 단위로 staging 한 뒤 커밋한다.

커밋 전에 반드시 staging area에 올릴 파일 리스트를 보여주고 사용자에게 받은 후에 커밋을 진행할 지 말지 결정합니다.

```bash
# 1. 현재 변경사항 확인
git status
git diff --staged

# 2. 변경 파일 파악 후 커밋 메시지 작성
# 3. 스테이징 (관련 파일만)
git add [관련 파일들]

# 4. 커밋
git commit -m "[메시지]"

# 5. 푸시
git push origin [현재 브랜치]
```

> husky `--no-verify` 우회 금지.

---

## 커밋 메시지 컨벤션

### 형식

```
<type>: <한국어 설명>

[본문 - 선택]
- 변경 항목 1
- 변경 항목 2

[관련 이슈가 있으면] Refs #<github-issue-number>
```

### Type 종류

| Type       | 사용 시점                 |
| ---------- | ------------------------- |
| `feat`     | 새 기능 추가              |
| `fix`      | 버그 수정                 |
| `refactor` | 리팩토링 (기능 변화 없음) |
| `test`     | 테스트 추가/수정          |
| `docs`     | 문서 수정                 |
| `chore`    | 빌드, 설정 변경           |
| `ci`       | CI/CD 변경                |

### 실제 예시

```bash
# 기능 추가
feat: 소셜 로그인(카카오) 연동 추가

# 버그 수정
fix: 결제 실패 시 재고 롤백 누락 수정

# 리팩토링
refactor: UserService 의존성 분리 및 인터페이스 추출

# 여러 항목
feat: 사용자 프로필 이미지 업로드 기능

- S3 presigned URL 방식 도입
- 이미지 리사이즈 처리 (최대 500x500)
- 지원 형식: jpg, png, webp
```

- **Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>** 문구 추가 금지

---

## 브랜치 규칙

브랜치는 임의로 생성하지 않는다.

---

## 커밋 전 체크리스트

- [ ] `git status` 확인 — 의도치 않은 파일 포함 여부
- [ ] `.env`, 시크릿 파일이 스테이징되지 않았는지 확인
- [ ] 린트: **lint-staged**(husky)가 commit 시 자동 실행되므로 `pnpm lint` 수동 실행 불필요
- [ ] 관련된 파일만 staging area에 올렸는지 확인
