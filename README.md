# Loopers Pack — Frontend L2 Vol.1

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제 제출 & 피드백 레포입니다.

## 시작하기

```bash
pnpm install
pnpm dev
```

> React 19 + Vite + TypeScript 기반입니다. (1~3주차 React, 4주차부터 Next.js로 전환 예정)

## 주차별 과제

- [1주차 — 코드 리뷰 & AI 협업 환경 구축](docs/assignments/week-01.md)

## 코드 품질 하네스

이 프로젝트는 AI가 생성한 코드도 동일한 기준으로 검증하기 위해 ESLint,
Prettier, Husky, lint-staged를 사용합니다.

### ESLint

ESLint는 포맷보다 코드 품질과 버그 가능성 검출에 집중합니다.

주요 설정은 다음과 같습니다.

- TypeScript strict type-aware rules로 타입 회피와 불명확한 코드를 줄입니다.
- React Hooks / React Compiler rules로 Hook 호출 순서, dependency 누락, 렌더 중 state 변경, effect 내 동기 state 변경을 감지합니다.
- React JSX rules로 JSX 보안 및 React 작성 관습을 점검합니다.
- jsx-a11y로 접근성 문제를 정적으로 점검합니다.
- unused-imports / simple-import-sort로 사용하지 않는 import를 제거하고 import 순서를 일관되게 유지합니다.

### Prettier

Prettier는 코드 포맷팅만 담당합니다. ESLint와 포맷 책임이 겹치지 않도록
`eslint-config-prettier`를 사용합니다.

### Git Hook

커밋 전 `lint-staged`를 실행합니다.

- 변경된 TS/TSX 파일: ESLint 자동 수정 후 Prettier 적용
- 변경된 JS/JSON/CSS/MD 파일: Prettier 적용

검사를 통과하지 못하면 커밋되지 않습니다.

### Scripts

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm typecheck
pnpm build
```

- `pnpm lint`: 전체 소스 ESLint 검사
- `pnpm lint:fix`: 자동 수정 가능한 ESLint 문제 수정
- `pnpm format`: Prettier로 포맷 적용
- `pnpm format:check`: 포맷 위반 여부 확인
- `pnpm typecheck`: TypeScript 타입 검사
- `pnpm build`: 타입 검사 후 Vite 빌드

## 새 주차 과제 받기

각 주차 과제는 이 메인 레포에 업데이트됩니다. 새 과제가 올라오면 **본인 포크의 `main`을 이 레포(upstream)와 동기화**해 받으세요.

- 간단히: 포크한 GitHub 레포 페이지의 **Sync fork** 버튼.
- CLI: `git remote add upstream https://github.com/loopers-labs/loop-pack-fe-l2-vol1.git` 등록 후 `git fetch upstream && git switch main && git merge upstream/main`.

## 제출

1. 이 레포를 **포크**한다.
2. 포크에서 작업 브랜치를 만든다 (예: `feat/week-01`).
3. 과제를 진행하고 커밋·푸시한다 (본인 포크에).
4. **메인 레포로 PR**을 연다 (base: 메인 레포의 `main` ← compare: 본인 포크의 작업 브랜치). PR 템플릿(이번 주 학습 / 피드백 받고 싶은 부분)을 채운다.
5. 모든 PR이 메인 레포 한곳에 모이므로 **서로의 PR을 리뷰**하고, 코치 피드백 + 다음 세션 구두 방어로 이어진다.

> PR은 **메인 레포(upstream)로** 올립니다 — 모두의 PR이 한곳에 모여 서로 리뷰할 수 있습니다. (협력자 추가는 필요 없습니다.)
