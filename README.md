# Loopers Pack — Frontend L2 Vol.1

Loopers 프론트엔드 과정(TypeScript · React · Next.js)의 과제 제출 & 피드백 레포입니다.
4주차부터 이 레포가 **커머스 프로젝트(Next.js)** 본체가 됩니다.

## 시작하기

```bash
pnpm install
pnpm dev
```

> Next.js(App Router) + React 19 + TypeScript. (1~3주차 React+Vite 산출물은 각자 개인 브랜치 히스토리에 있습니다.)

## 프로젝트 구조

feature-first colocation — 코드는 기술 종류가 아니라 **도메인 기능**으로 묶는다.

```txt
app/                          # Next App Router — 라우팅 전용(페이지 조립), 도메인 로직 없음
├─ api/products/route.ts      # mock 백엔드 (route handler)
├─ layout.tsx
└─ page.tsx
src/
├─ shared/                    # 둘 이상 피처가 공유하는 원시 요소만 (필요해질 때)
│  └─ ui/
│     ├─ select/              # Select (Headless) — 4주차 1단계
│     └─ dialog/              # Dialog (Compound) — 4주차 2단계
└─ <feature>/                 # 한 기능의 컴포넌트·훅·로직·타입·api/ 를 함께 colocate
   ├─ *.tsx                   # 컴포넌트
   ├─ *.ts                    # 훅·도메인 로직·순수 함수
   ├─ api/                    # 데이터 호출 (생길 때)
   ├─ types.ts
   └─ index.ts                # 공개 표면(배럴) — 외부는 이 파일로만 import
docs/assignments/              # 주차별 과제 명세
```

- 의존성은 단방향: `shared → 피처 → app`. 피처끼리는 직접 import하지 않는다 — 여러 피처를 묶는 조립은 항상 `app/`에서 한다.
- 피처는 `index.ts` 배럴로만 외부에 공개한다. 배럴 밖의 내부 파일을 다른 피처나 `app/`에서 직접 import하지 않는다.
- **도메인 기능**: `src/<feature>/`에 콜로케이션한다. 지금 존재하는 것은 `src/shared/ui/{dialog,select}`(4주차 디자인 패턴 스타터)뿐이며, 라우팅·페이지 조립은 루트 `app/`에 있다.

## 왜 이렇게 했는가

- **screaming architecture** — 폴더 이름이 "무슨 기술이냐"가 아니라 "무슨 기능이냐"를 외치게 한다. `components/`, `hooks/`, `utils/`처럼 기술별로 나누면 기능 하나를 이해하는 데도 여러 폴더를 오가야 한다.
- **YAGNI** — `shared/`로 올리는 기준은 "나중에 쓸 수도 있어서"가 아니라 "지금 이미 둘 이상의 피처가 쓰고 있어서"다. 미리 공용화하지 않는다.
- **규칙이 구조를 강제한다** — 위 경계는 말로만 지키는 컨벤션이 아니라 `.dependency-cruiser.cjs`의 규칙 3종이 `pnpm depcruise`(= `depcruise src`)로 기계적으로 검사한다.
  - `shared-is-independent` — `src/shared/`는 다른 무엇도 import할 수 없다. 단방향 의존 그래프의 최하단이라는 것을 규칙으로 고정한 것.
  - `no-cross-feature` — 피처는 다른 피처를 직접 import할 수 없다. 조립은 항상 `app/`에서.
  - `feature-barrel-only` — 피처 밖에서는 피처의 `index.ts` 배럴로만 import할 수 있다. 내부 파일 직접 import 금지.
  - 이 3종 규칙은 스캔 범위가 `src/`로 한정돼 있다(`depcruise src`). 그래서 라우팅을 `src/app/`이 아니라 **루트 `app/`**로 뺐다 — 스캔 밖에 있으므로 페이지가 여러 피처를 자유롭게 조립해도 `no-cross-feature`에 걸리지 않는다. `src/shared/`가 이 규칙들의 유일한 예외(모두가 import할 수 있는 쪽)인 이유도 같다 — 단방향 의존 그래프의 맨 아래에 있는 게 `shared`이기 때문이다.

## 주차별 과제

- 과제 명세는 `docs/assignments/week-0N.md` 에 있습니다.

## 새 주차 과제 받기

각 주차 과제는 이 메인 레포에 업데이트됩니다. 새 과제가 올라오면 **본인 포크의 `main`을 이 레포(upstream)와 동기화**해 받으세요.

- 간단히: 포크한 GitHub 레포 페이지의 **Sync fork** 버튼.
- CLI: `git remote add upstream https://github.com/loopers-labs/loop-pack-fe-l2-vol1.git` 등록 후 `git fetch upstream && git switch main && git merge upstream/main`.

## 제출

1. 이 레포를 **포크**한다.
2. 포크에서 주차 작업 브랜치를 만든다 (예: `feat/week-04`).
3. 과제를 진행하고 커밋·푸시한다 (본인 포크에).
4. **메인 레포로 PR**을 연다. PR 템플릿(이번 주 학습 / 피드백 받고 싶은 부분)을 채운다.
5. 모든 PR이 한곳에 모이므로 서로 리뷰하고, 코치 피드백 + 다음 세션 구두 방어로 이어진다.
