# CLAUDE.md — 프로젝트 컨텍스트 & 컨벤션

---

## 프로젝트 개요

### 기술스택

- **코어**: TypeScript + React
- **패키지매니저**: pnpm
- **번들러**: vite
- **코드 품질**: eslint + prettier + husky + lint-staged

---

## 프로젝트 디렉토리 구조

> 모든 디렉토리는 기능 단위로 레이어가 나뉘어있으며, 하위로 {Domain} 디렉토리가 존재합니다.
> 예: `src/api/` 디렉토리는 `api` 기능 단위로 레이어가 나뉘어있으며, 하위로 `auth` 디렉토리가 존재합니다.

```
src/
  api/          ← SRP 를 준수한 api 함수
  services/     ← React Query 훅 과 도메인에 맞는 쿼리키
  components/   ← 공통 UI 컴포넌트
  hooks/        ← 공통 커스텀 hook
  utils/        ← 공통 util 함수
  constants/    ← 공통 상수
  types/        ← 도메인 별 공통 타입
  lib/          ← 외부 모듈
  store/        ← zustand store
  routes/       ← SPA Route 담당
.claude/
  CLAUDE.md     ← 현재 파일
```

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

> 상세 컨벤션 → [skills/conventions/SKILL.md](skills/conventions/SKILL.md)
> 커밋 컨벤션 → [skills/commit/SKILL.md](skills/commit/SKILL.md)

---

## 항상 지켜야 할 규칙

1. **시크릿 절대 하드코딩 금지** — 환경변수 사용
2. **컨텍스트 윈도우 60% 초과 시** — `/compact` 실행 후 계속
