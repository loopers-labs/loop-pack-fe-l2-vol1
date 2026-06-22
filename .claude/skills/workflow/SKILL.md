# 워크플로우 규칙

TRIGGER — 브랜치 생성/관리, git push/merge 관련 작업 요청 시 이 스킬을 먼저 로드.

## 브랜치 전략

1. 포크한 레포의 `main`에 volume 브랜치(예: `volume-1`)를 머지
2. 원본 레포의 `main`과 포크 레포의 `main`을 sync
3. 포크 레포의 `main`에서 새 작업 브랜치 생성

- 네이밍: `feat/week-<week-number>-<description>` (예: `feat/week-01-setup-project`)

## 머지 전 체크

- `pnpm format` 실행
- lint/타입 검사 모두 통과
