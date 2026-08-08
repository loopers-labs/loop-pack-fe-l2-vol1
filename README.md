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

`pnpm test`는 전체 Vitest 테스트가 통과해야 완료됩니다. `pnpm check`는 테스트, lint, 타입 검사, 프로덕션 빌드를 순서대로 실행하며 네 단계가 모두 통과해야 완료됩니다. GitHub Actions도 pull request와 `main` push에서 같은 `pnpm check`를 실행합니다.

### APP_ORIGIN

서버가 자기 API를 부를 때 쓰는 origin입니다. 서버 metadata와 prefetch가 절대 URL을 만들어야 해서 필요하고, 브라우저 요청은 지금처럼 상대 경로를 씁니다. **기본값이 없어 값이 없거나 절대 URL이 아니면 build와 runtime이 즉시 실패합니다.** 조용한 기본값을 두면 build와 runtime의 불일치가 숨고 잘못된 절대 URL이 결과물에 굳기 때문입니다.

build와 runtime에 같은 값을 넣습니다. 형식은 `.env.example`에 있습니다.

```bash
APP_ORIGIN=http://127.0.0.1:3210 pnpm build
APP_ORIGIN=http://127.0.0.1:3210 pnpm start
APP_ORIGIN=http://127.0.0.1:3210 pnpm check
```

CI에 넣는 값은 배포 URL 증거가 아니라 build 계약을 검증하는 값입니다.

> Next.js(App Router) + React 19 + TypeScript. (1~3주차 React+Vite 산출물은 각자 개인 브랜치 히스토리에 있습니다.)

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
