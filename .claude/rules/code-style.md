# 코드 컨벤션

- 의도가 이름에 드러난다 — `data` / `temp` / `flag` 같은 범용 이름 ✗
- 한 함수가 한 가지 일을 한다
- 타입이 코드를 설명한다 — `any` / `@ts-ignore` / `!` 단언(non-null assertion)으로 회피 ✗
- 에러를 명시적으로 처리한다 — `catch(e) {}` 빈 블록 ✗
- 기존 코드를 재사용한다 — 비슷한 유틸 매번 새로 생성 ✗ (AI 고질병)
- 배럴 파일(`index.ts`로 re-export) 지양 — 직접 경로로 import
- 컴포넌트·훅·핸들러 등은 `const` + arrow function으로 작성, `function` 선언은 컴포넌트 외부의 유틸 함수에만 사용

## 네이밍

- 컴포넌트: `PascalCase`
- 함수: 동사 + 목적어 (`fetchUser`, `formatDate`)
- 이벤트 핸들러: props 콜백 `onX` / 내부 함수 `handleX`
- boolean: 부정형 ✗ → `is` / `has` / `should` / `can` 접두사
- 상수: `UPPER_SNAKE_CASE`
