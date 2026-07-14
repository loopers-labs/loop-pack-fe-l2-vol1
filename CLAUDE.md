# 프로젝트 가이드

Next.js 16 + React 19 + TypeScript(strict) 기반 학습용 커머스 프론트엔드 과제 레포. 브라우저 동작은 Playwright로 검증한다.

## 기술 스택

- Next.js 16, React 19, TypeScript

## 프로젝트 구조

- `src/app`: 페이지, 레이아웃, Route Handler와 라우트 전용 `_components`
- `src/components/ui`: 재사용 가능한 공용 UI 컴포넌트
- `src/hooks`: 공용 커스텀 훅
- `src/utils`: 부수 효과가 없는 공용 유틸리티
- `e2e`: Playwright E2E 테스트
- `docs`: 주차별 과제 명세와 리뷰 기록

라우트에서만 쓰는 UI는 해당 라우트의 `_components`에 두고, 여러 기능에서 재사용할 때만 공용 디렉터리로 옮긴다.

## 명령어

- 개발 서버: `pnpm install && pnpm dev`
- 빌드: `pnpm build`
- 프로덕션 실행: `pnpm start`
- 린트: `pnpm lint`
- 포맷: `pnpm format`
- E2E 테스트: `pnpm test:e2e` (특정 파일만: `pnpm exec playwright test e2e/<file>.spec.ts`)

## 규칙

- [코드 스타일](.claude/rules/code-style.md)
- [컴포넌트 설계](.claude/rules/component-design.md)
- [테스트 작성 기준](.claude/rules/testing.md)
- [검증 및 완료 기준](.claude/rules/verification.md)
