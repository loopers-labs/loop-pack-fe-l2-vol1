# CLAUDE.md

**중요: 반드시 한글로 대답하시오.**

Loopers 프론트엔드 과제 레포. React 19 + Vite + TypeScript.

정확성 규칙(`any` · `==` · 빈 `catch` · `console.log` · React 훅/렌더 · 강타입)은 **ESLint·tsc 게이트가 기계적으로 강제**한다. 이 파일에는 **게이트가 못 잡는 것만** 적는다.

## 개발 명령어

```bash
pnpm dev          # 개발 서버
pnpm build        # 타입 빌드 + 번들
pnpm lint         # 전체 ESLint
pnpm typecheck    # 전체 타입 검사
pnpm format       # Prettier 정규화
```

## pnpm 전용

`npm` / `yarn`을 쓰지 않는다(lockfile 충돌). 설치는 `pnpm install`. lint 룰이 막지 못하는 규칙이다.

## 게이트를 끄지 마라

- `as` 단언 대신 좁히기 · 명시 타입 · 데이터 구조로 푼다.
- 게이트가 막으면 **먼저 코드를 고친다**. 불가피하면 `// eslint-disable-next-line <룰명> -- <사유>`로 끈다 — 룰명·사유 없는 disable은 게이트가 막는다.

## 프로젝트 구조 — feature-first colocation

코드는 기술 종류가 아니라 **도메인 기능**으로 묶는다. 폴더가 프레임워크가 아니라 도메인을 외치게 한다(screaming architecture).

- **피처 콜로케이션**: 한 기능의 컴포넌트·훅·로직·타입을 `src/<feature>/`에 함께 둔다(예: `src/market/`). `components/`·`hooks/` 같은 종류별 최상위 폴더를 만들지 않는다.
- **공유는 필요할 때만**: 둘 이상 피처가 쓰는 것만 `src/shared/`로 올린다(YAGNI).
- **단방향 의존**: `shared → 피처 → app`. 피처끼리 서로 직접 import 금지 — 조립은 상위(`app`)에서.
- **공개 표면**: 각 피처는 `index.ts`로만 외부에 노출한다. 내부 파일 깊은 import 금지.
- **데이터 레이어 이름은 `api/`**: 피처의 API 호출은 `<feature>/api/`에. `services/`·`repository/`(백엔드 DDD 용어)를 쓰지 않는다.
- **Next 전환 대비**: 4주차 Next.js App Router 전환 시 `app/`은 라우팅 전용 얇은 층으로 두고 도메인 로직은 `src/<feature>/`에 유지한다.
