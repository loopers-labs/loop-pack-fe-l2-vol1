# CLAUDE.md — 프로젝트 컨텍스트 & 컨벤션

---

## 프로젝트 개요

### 기술스택

- **코어**: TypeScript + React
- **패키지매니저**: pnpm
- **번들러**: vite
- **코드 품질**: eslint + prettier + husky + lint-staged

---

## 빌드 & 테스트 명령어

```bash
# 개발 서버
pnpm dev

# 린트
pnpm lint

# 포맷
pnpm format

# 빌드
pnpm build

# 타입 체크
pnpm type
```

---

## 핵심 코딩 컨벤션

- **언어**: TypeScript strict mode
- **포맷터**: prettier (format on save)
- **커밋**: Conventional Commits

  - 예:

    ```
    "feat: TODO 기능 추가
     - TODO 목록 조회
     - TODO 추가
     - TODO 수정
     - TODO 삭제"
    ```

> 커밋 컨벤션 → [skills/commit/SKILL.md](skills/commit/SKILL.md)

---

## 항상 지켜야 할 규칙

1. **시크릿 절대 하드코딩 금지** — 환경변수 사용
2. **컨텍스트 윈도우 60% 초과 시** — `/compact` 실행 후 계속
