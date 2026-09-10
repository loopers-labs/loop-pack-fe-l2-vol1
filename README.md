# Loopers Pack — Frontend L2 Vol.1

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제 제출 & 피드백 레포입니다.
4주차부터 이 레포가 **커머스 프로젝트(Next.js)** 본체가 됩니다.

## 시작하기

필수 도구는 Node.js 24.17.0과 pnpm 10.15.1입니다. `.nvmrc`는 현재 권장 LTS를 고정하고, `package.json`의 Node.js 범위(`>=22.12.0`)는 지원 가능한 Node.js 22 이상을 허용합니다.

```bash
nvm use
pnpm install
pnpm dev
```

홈과 상품 목록의 서버 Hydration은 같은 Route Handler URL을 사용합니다. 로컬 실행 전 실제 서버 주소를 `.env.local`의 `APP_ORIGIN`에 지정하세요.

```dotenv
APP_ORIGIN=http://localhost:3000
```

`pnpm test`는 전체 Vitest 테스트를 실행합니다. `pnpm check`는 CI 정책 테스트, Vitest, lint, 타입 검사, 프로덕션 빌드, Playwright E2E를 순서대로 실행합니다. E2E 실행 전 Chromium이 없다면 `pnpm exec playwright install chromium`으로 설치하세요.

GitHub Actions는 검증을 단계별로 실행하고 CI 환경 변수도 검사합니다. 허용된 Markdown만 변경한 PR에서는 E2E만 생략하며, `main` push와 `merge_group`에서는 전체 검증을 실행합니다. 구현 범위와 원격 설정 절차는 [10주차 CI 설계](./docs/rfc/week10-ci.md)를 참고하세요.

> Next.js(App Router) + React 19 + TypeScript. (1~3주차 React+Vite 산출물은 각자 개인 브랜치 히스토리에 있습니다.)

## 기술 개선 기록

- [7주차 — 초기 로딩 성능과 목록 상태 설계](./docs/week-07-performance/README.md)

## 구조 (최소 골격)

```
src/
  app/                     # Next App Router
    api/products/route.ts  # mock 백엔드 (route handler)
    layout.tsx  page.tsx
  components/
    ui/
      select/              # Select (Headless) — 4주차 1단계
      dialog/              # Dialog (Compound) — 4주차 2단계
docs/assignments/          # 주차별 과제 명세
```

> 폴더 구성은 최소한만 잡아뒀습니다. 구조 개선은 **각자 근거를 대고** 진행하세요.

## 주차별 과제

- 과제 명세는 `docs/assignments/week-0N.md` 에 있습니다.
- 새 과제가 올라오면 **본인 포크의 `main`을 이 레포(upstream)와 동기화**해 받으세요.
  - GitHub: 포크 레포의 **Sync fork** 버튼
  - CLI: `git fetch upstream && git switch main && git merge upstream/main`

## 제출

1. 이 레포를 **포크**한다.
2. 포크에서 주차 작업 브랜치를 만든다 (예: `feat/week-04`).
3. 과제를 진행하고 커밋·푸시한다 (본인 포크에).
4. **메인 레포로 PR**을 연다. PR 템플릿(이번 주 학습 / 피드백 받고 싶은 부분)을 채운다.
5. 모든 PR이 한곳에 모이므로 서로 리뷰하고, 코치 피드백 + 다음 세션 구두 방어로 이어진다.
