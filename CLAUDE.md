# CLAUDE.md

> Loopers FE L2 — AI 협업 규칙서. Claude Code가 매 세션 따르는 팀 규칙이다.
> 작성 원칙: **한 줄을 지웠을 때 AI가 실수하면 남기고, 아니면 지운다.** (장황 금지)

## 제1원칙

**본인이 설명할 수 없는 코드는 커밋하지 않는다.** AI가 쓴 코드도 머지하는 순간 내 코드다.
"AI가 짜줬는데요"는 변명이 안 된다. 아래 규칙은 전부 이 원칙을 지키기 위한 수단이다.

## 기술 스택

- React 19, TypeScript 6.x, Vite 8.x (패키지 매니저: pnpm 10)
- ESLint v9 **Flat Config** + Prettier — 결정적 1차 하네스
- husky + lint-staged — 커밋 게이트 (lint 미통과 = 커밋 불가)
- 로드맵: 1~3주차 React, **4주차(R4)부터 Next.js App Router** 전환 예정

## 개발 워크플로우 — 증강 코딩 (가장 중요)

- AI는 방향·설정·룰을 **제안만** 한다. **개발자 승인 전에 설정 파일/룰을 임의로 생성·수정하지 않는다.**
- 특히 ESLint 룰은 **"왜 이 레벨(error/warn)인가" 근거와 함께** 제안하고, 수용/거부는 개발자가 판단한다.
- 스캐폴딩이 깔아주는 **디폴트 설정을 검토 없이 수용하지 않는다.** 익숙한 프리셋(airbnb 등)도 "원래 쓰니까"로 복붙하지 않는다.
- 한 번에 여러 단계를 몰아 진행하지 않는다. 단계마다 멈춰 근거를 확인받는다.

## 컴포넌트 규칙

- 파일 하나에 컴포넌트 하나를 export
- Props interface는 컴포넌트 파일 상단에 정의
- 이벤트 핸들러 네이밍: **Props는 `on{Event}`, 내부 함수는 `handle{Event}`**
- 조건부 렌더링은 **early return** 우선 (단, **모든 hook 호출 뒤에서**)
- **파생 가능한 값은 `useState`+`useEffect`로 동기화하지 말고 렌더 중에 계산한다** (최중요 패턴)
- 이름에 의도를 담는다 — `data`/`temp`/`flag`/`doStuff` 금지

## 코드 리뷰 규칙

- AI 생성 코드는 **"왜 이렇게 짰는가"를 설명할 수 있어야** 한다. 못 하면 직접 재작성한다.
- 리뷰는 **질문형**으로. "잘했습니다"·"이거 틀렸어요"는 금지 — 구체적 근거와 대안을 제시한다.
- PR 본문에 **AI 생성 부분을 표기**하고, 각 변경의 **근거**를 적는다.

## 커밋 컨벤션 (두괄식)

- **Conventional Commits**. 제목 = 결론(두괄식), 본문 = 왜/무엇/영향.
- 형식 (제목 한 줄 + 본문):

```text
<type>: <한 줄 결론 — 무엇을 왜>

- 왜: (이 변경이 필요한 배경)
- 무엇: (실제로 바꾼 것)
- 영향: (사이드 이펙트 / 후속 작업)  ← 필요할 때만
```

- type: `feat` `fix` `refactor` `style` `test` `chore` `docs`
- **1 커밋 = 1 논리적 변경** (atomic). 섞지 않는다.
- **커밋에 `Co-Authored-By: Claude` 등 AI 서명을 넣지 않는다.**
- 훅을 `--no-verify`로 우회하지 않는다.
- 상세 규칙: [docs/commit-convention.md](docs/commit-convention.md)

## Never Do

- `any` / `@ts-ignore` / `eslint-disable` 남용 — 불가피하면 **사유 주석** 필수 (기계가 경고하려던 자리)
- `console.log` 등 디버깅 잔재 방치
- `catch (e) {}` — 에러 삼키기
- 비슷한 유틸을 매번 새로 생성 (기존 코드 재사용)
- 측정 전 `useMemo`/`useCallback` — 과도한 메모이제이션
