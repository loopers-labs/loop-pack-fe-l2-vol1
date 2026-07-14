# 4주차 Self Review 결과

> 기준: [`docs/assignments/week-04.md`](../assignments/week-04.md), 대상 diff: `origin/main...HEAD`

**판정: PASS**

## 기능 완성도

**Next/하네스**

- [x] 기본 ESLint 대신 flat config 이식 — OK (`eslint.config.mjs`)
- [x] Next 전용 룰 근거 — OK (`docs/week-04/eslint-next-rules.md`, 멘토 피드백 반영 완료)
- [x] husky 게이트 재검증 — OK (`.husky/pre-commit` + `lint-staged`)

**Select (Headless)**

- [x] 라이브러리 없이 직접 구현 — OK (`useSelect.ts`, 네이티브 `<select>` 미사용, `<div>`/`<ul role="listbox">`)
- [x] 인터페이스 설계 근거 — OK (훅 주석에 설계 이유 명시)
- [x] 옵션 UI 3종(텍스트/사이즈/썸네일) — OK, 랜딩 페이지(`/`) "동작 확인" Select 탭에서 확인 가능
- [x] `value`가 옵션 객체 전체 — OK (`TextSelectOption` 등 전체 반환, 해제 시 `undefined`)
- [x] 키보드 열기·이동·선택·닫기 — OK
- [x] 품절 옵션 키보드 스킵 — OK (`stepToEnabled`가 `isOptionDisabled` 건너뜀)

**Dialog (Compound)**

- [x] compound 조립 — OK (`Object.assign(DialogRoot, {...})`)
- [x] controlled/uncontrolled 이중 API — OK (`open !== undefined`로 판별, 분기는 `setOpen` 한 곳)
- [x] Content/Overlay Portal — OK (`createPortal` + `useSyncExternalStore`)
- [x] Esc/오버레이 클릭 닫힘 + 스크롤 잠금 — OK, 랜딩 페이지 Dialog 탭에서 확인 가능 (E2E 5건으로 검증됨)

**공통**

- [x] 설계 근거 한 줄 메모 — OK (Select/Dialog/서비스 레이어 전반에 걸쳐 코드 주석으로 존재)
- [ ] AI 생성 부분 표기 — PR 본문에 아직 없음 (PR 작성 시 처리 필요)

## 정적 검사

- `pnpm build`: PASS
- `pnpm lint`: PASS
- `pnpm test:e2e`: PASS (28건)

## 지적 사항 (심각도순)

- `[nit]` `[fixed]` `src/app/_components/PreviewCard.tsx:10-12` — 상단 주석이 "`demo/_components/DocSection`과 용도가 다르다"며 이미 삭제된 `DocSection`을 비교 대상으로 언급하는 죽은 참조였음.
  → 다른 컴포넌트를 언급하지 않고 자기 완결적으로 "usage 코드 블록 없이 카드만 보여주는 용도"로 다시 씀.

## AI 작성 표기

이 문서는 AI(Claude)가 `/self-review` 스킬로 `git diff origin/main...HEAD`(staged 기준), `pnpm build`/`pnpm lint`/`pnpm test:e2e` 실행 결과, 관련 소스 코드를 직접 읽고 분석해 작성했습니다. 판정과 지적 사항의 심각도 분류, 수정은 AI가 수행했고, 사용자가 검토합니다.
