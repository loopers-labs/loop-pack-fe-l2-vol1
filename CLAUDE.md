# CLAUDE.md

**중요: 반드시 한글로 대답하시오.**

Loopers 프론트엔드 과제 레포. Next.js 16 (App Router) + React 19 + TypeScript.

정확성 규칙(`any` · `==` · 빈 `catch` · `console.log` · React 훅/렌더 · 강타입)은 **ESLint·tsc 게이트가 기계적으로 강제**한다. 이 파일에는 **게이트가 못 잡는 것만** 적는다.

## 명령어

```bash
pnpm dev           # 개발 서버
pnpm build         # 타입 빌드 + 번들
pnpm start         # 프로덕션 서버
pnpm lint          # 전체 ESLint
pnpm lint:fix      # ESLint 자동 수정
pnpm typecheck     # tsc --noEmit
pnpm test          # vitest run
pnpm depcruise     # dependency-cruiser로 src 경계 검사
pnpm format        # Prettier 정규화
pnpm format:check  # Prettier 검사만
```

## pnpm 전용

`npm` / `yarn`을 쓰지 않는다(lockfile 충돌). 설치는 `pnpm install`. lint 룰이 막지 못하는 규칙이다.

## 게이트를 끄지 마라

- `as` 단언 대신 좁히기 · 명시 타입 · 데이터 구조로 푼다.
- 게이트가 막으면 **먼저 코드를 고친다**. 불가피하면 `// eslint-disable-next-line <룰명> -- <사유>`로 끈다 — 룰명·사유 없는 disable은 게이트가 막는다.

## 프로젝트 구조 — FSD 6레이어 (Next App Router)

코드는 FSD(Feature-Sliced Design)의 **App → Pages → Widgets → Features → Entities → Shared** 여섯 레이어로 묶는다. 의존은 이 순서대로 상위에서 하위로만 흐른다. 같은 레이어의 다른 slice는 직접 import하지 않으며, 외부 소비자는 slice 루트의 named public API(`index.ts`)만 import한다.

- **루트 `app/`은 Next 경계만 둔다**: route, route handler, `error.tsx` 경계를 두는 얇은 adapter다. 화면·도메인 로직은 넣지 않고 `src/_pages` 또는 `src/_app`의 public API를 조립한다.
- **`src/_app`은 App 레이어**: 전역 provider, 앱 bootstrap, 공통 shell을 조립한다.
- **`src/_pages`는 Pages 레이어**: 화면과 그 URL/query 해석·로딩·로컬 상태를 소유한다. 새 화면은 여기서 시작한다(pages-first).
- **`src/widgets`는 Widgets 레이어**: 여러 Page에서 의미 있게 재사용되는 큰 UI 블록을 둔다.
- **`src/features`는 Features 레이어**: `add-to-cart`처럼 사용자가 수행하는 재사용 상호작용과 그 상태·API를 둔다.
- **`src/entities`는 Entities 레이어**: `product`처럼 안정적인 도메인 개념과 표현을 둔다.
- **`src/shared`는 Shared 레이어**: 도메인을 모르는 API 기반과 UI primitive만 둔다. 공용화는 실제로 둘 이상의 소비자가 생겼을 때 한다.
- **slice와 segment**: UI는 `ui/`, 상태·규칙은 `model/`, 외부 호출은 `api/`에 둔다. `components/`·`hooks/` 같은 종류별 최상위 폴더를 만들지 않는다.
- **적용 범위**: `src/products`는 4주차 legacy slice로 FSD 여섯 레이어와 공존한다. 새 커머스 화면과 기능은 여섯 FSD 레이어에 둔다.

이 경계는 `pnpm depcruise`가 `src`를 스캔해 강제한다. 세부 책임과 public API 규칙은 `docs/architecture/layers.md`, `docs/architecture/public-api.md`를 따른다.
