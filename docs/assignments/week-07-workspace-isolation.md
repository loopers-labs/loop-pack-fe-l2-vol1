# Week 7 제작 worktree 격리 계약

이 문서는 Week 7 starter 제작 범위를 검증하는 운영 산출물이에요. 실제 경로와 diff는 `pnpm verify:week07:starter --scope=protected-files`가 실행 시점에 다시 확인해요.

## 기준

- base revision: `8708cb2d7e0f8da0ac98fe0153a750aeee7b69dc`
- branch: `codex/week-07-performance-assignment`
- worktree: 검증 명령이 `git rev-parse --show-toplevel`로 해석한 격리 worktree
- invariant: 한 번에 하나의 Week 7 과제 설계 브랜치만 사용

## 허용 경로

- `package.json`의 Week 7 검증 명령
- `docs/assignments/week-07*.md`
- `scripts/week-07/**`
- `src/app/api/_data/commerce*`
- `src/app/api/home/route*`
- `src/app/api/products/route*`
- `src/types/commerce.ts`
- `src/app/performance-lab/inp/**`

## 보호 경로

- `week-07-performance-slides.html`
- Week 7 학습 MD와 발표 대본
- 기존 Week 1~6 과제와 학습 자료
- 사용자가 소유한 기존 변경

## 금지 작업

- commit, push, PR 생성
- GitHub, Linear, Slack 변경
- 사용자 결정으로 폐기된 추가 선택 과제와 관련 starter 추가
- 기본 checkout의 미추적 파일 이동·수정·삭제

## 검증 결과 기록

다음 명령의 실제 출력과 종료 코드를 최종 작업 보고에 남겨요.

```bash
pnpm test
pnpm check
pnpm verify:week07:starter
pnpm verify:week07:starter --scope=protected-files
pnpm verify:week07:submission --advanced=none
pnpm verify:week07:submission --advanced=a
```

깨끗한 starter에서 앞의 네 명령은 `PASS`, 뒤의 두 명령은 인프라 오류가 아닌 `INCOMPLETE`여야 해요.
