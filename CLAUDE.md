# CLAUDE.md

**중요: 반드시 한글로 대답하시오.**

이 저장소는 Loopers 프론트엔드 과제 레포입니다. **React 19 + Vite + TypeScript**.
이 파일은 코드를 읽으면 알 수 있는 정보가 아니라, **AI가 자주 틀리는 지점**만 적습니다.

## 황금 규칙

- 구현이 불확실하면 추측하지 말고 먼저 묻는다.
- 요청 범위에 필요한 변경만 한다. 새로 만들기 전에 기존 구현을 먼저 읽고, 비슷한 유틸·컴포넌트를 중복 생성하지 않는다.

## 개발 명령어

```bash
pnpm dev          # 개발 서버
pnpm build        # 타입 빌드 + 번들
pnpm lint         # 전체 ESLint
pnpm typecheck    # 전체 타입 검사
pnpm format       # Prettier 정규화
```

## 패키지 매니저: pnpm 전용

- `npm` / `yarn`을 쓰지 않는다(lockfile 충돌). 설치는 `pnpm install`.

## 타입: 완전 강타입

- `any` · `as` · `@ts-ignore` · `@ts-expect-error` · `eslint-disable`로 검사기를 끄지 않는다.
- 타입 에러는 숨기지 말고 타입 좁히기 · 명시적 타입 · 데이터 구조 개선으로 푼다.
- 배열/객체 인덱스 접근 결과는 `T | undefined`다(`noUncheckedIndexedAccess`). "없을 수 있음"을 반드시 처리한다.

## React

- 훅은 컴포넌트 최상위에서만 호출한다(조건 · 반복 · early-return 뒤 호출 금지).
- 파생 가능한 값은 렌더 중 계산한다 — `useState` + `useEffect`로 동기화하지 않는다.
- 컴포넌트 안에서 컴포넌트를 정의하지 않는다(매 렌더 새로 생성되어 상태가 날아간다).
- 렌더 도중 ref를 읽거나 쓰지 않고, props/state를 직접 변조하지 않는다.
- 로딩 · 빈 상태 · 에러를 happy path와 함께 렌더한다. 빈 `catch {}`를 남기지 않는다.

## 검증 (우회 금지)

- 커밋 전: staged 파일이 `lint-staged`(ESLint + Prettier)를 통과해야 한다.
- 푸시 전: `pnpm lint`(전체) + `pnpm typecheck`(전체 타입)를 통과해야 한다.
- `--no-verify`로 git hook을 우회하지 않는다.
