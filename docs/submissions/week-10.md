# Week-10 제출 기록 — PR 본문 초안

> `.github/pull_request_template.md` 형식. 결정과 근거를 적고 숫자는 RFC(`docs/rfc/week10-ci.md`)와 회고(`docs/rfc/week10-retrospective.md`)를 가리킨다.

## 📌 이번 PR 요약

- 주차: 10주차 — CI 파이프라인과 AI 협업
- 무엇을 / 왜: 1주차 하네스(lint·type)를 CI 게이트로 끌어올렸다. 같은 커밋에서 cold/warm 3회씩 재어 병목(Playwright 설치 24초, 직렬 `pnpm check` 46초)만 고쳐 warm **104 → 63초**, E2E 는 앱 경로 변경·라벨·main push 에서만 돌게 하고 문서 PR 에서 skip 되어도 머지 가능함을 증명했다. 번들 예산(route 6개 First Load JS ×1.05)과 환경 변수 검증을 build 앞에 걸어 초과 PR 두 개가 빨간불로 막히는 것까지 확인했고, 팀 컨벤션 14개를 AI 리뷰 기준으로 명문화해 사람이 놓친 위반 1건(E2E 의 구현 상수 import)을 찾아 결정적 룰(`_data` import 금지)로 승격했다. Vercel Production·Preview 를 배포했고, 첫 production 빌드는 게이트가 막았다.

설계·측정 문서: `docs/rfc/week10-ci.md`(1–5단계 + 보안 + 질문 4개) · 회고: `docs/rfc/week10-retrospective.md`

## 📚 이번 주 학습

- 학습 주제: CI 를 "붙이는" 것이 아니라 재고·줄이고·조건을 설계하고·예산을 정하고·AI 지적을 룰로 굳히는 것. 어떤 코드가 어떤 검증을 통과해 배포되는지 설명할 수 있는 상태.
- 배운 것 / 새로 적용한 것:

### 1단계 — 측정·최적화 (RFC 1절)

| 조건        | 중앙값 | 범위    |
| ----------- | -----: | ------- |
| Before cold |   106s | 101–107 |
| Before warm |   104s | 93–135  |
| After cold  |    83s | 82–104  |
| After warm  |    63s | 55–63   |

- 병목은 타임스탬프로 지목: Playwright 설치 24–25초(가장 긴 step), `pnpm check` 46초(test 10·lint 5·typecheck 4·build 10·e2e 16 직렬). 고른 전략은 브라우저 캐시(키 = Playwright 버전) + lint·typecheck·unit 병렬화 + concurrency(ref 포함). **안 고른 것**: build→e2e artifact 분리(setup 20초가 더 든다), `.next/cache`(1.2MB), e2e workers 증가.
- 캐시 실험에서 두 가지를 배웠다. pnpm store 캐시는 복원 10초 > 다운로드 5초로 **이득이 없다**(Playwright 캐시만 효과). Actions 캐시는 **PR ref 단위로 격리**되어 새 PR 의 첫 run 은 항상 cold 다.
- miss 재현: lockfile 끝 빈 줄 → `pnpm cache is not found`, `downloaded 625`. Playwright 캐시는 키가 달라 hit 유지.

### 2단계 — 조건부 실행 (RFC 2절)

- E2E 는 `build` job 안의 **조건부 step**. main push > `run-e2e` 라벨 > draft skip > 앱 경로 변경 > skip. 필터 집합은 build·start·Playwright 의 입력 전체 + 워크플로 자체.
- 안전 논리: 저비용 4개는 항상 실행 / 필터 밖 diff 가 E2E 를 바꿀 경로 없음 / merge queue 가 없는 개인 저장소라 **main push 전체 실행이 최종 방어**(머지 직후, revert 우선) / step 이라 required 와 충돌 없음.
- PR 5개로 확인(문서만 → skipped 51s, src 1줄 → 실행, 라벨 붙임 → 실행, 뗌 → skip). 함정: base 를 fork main 으로 잡으면 브랜치 누적 diff 가 전부 "변경" 이라 문서 PR 에서도 E2E 가 돌았다 — **필터는 비교 기준에 달려 있다.**
- 브랜치 보호(required = lint·typecheck·unit·build) 아래 E2E skip 된 PR 이 `MERGEABLE / CLEAN`.
- flaky: `retries: 0` 유지(9주차 8워커 경합을 retry 가 숨겼을 것), 재현 안 되면 `test.fixme` + 이슈.

### 3단계 — 예산 게이트 (RFC 3절)

- Turbopack 청크는 이름이 해시라 `route-bundle-stats.json` 의 `firstLoadChunkPaths` 를 읽어 route 6개 First Load JS(brotli)를 잰다. 빈 측정이면 throw.
- 근거: **7주차는 JS 크기를 재지 않았다** — 이미지 7.5MB→32KB 와 LCP 만 있다. 그래서 이번 주 기준 빌드 실측(147–158 kB) × 1.05 를 예산으로 걸고 그 사실을 문서에 적었다. 빌드는 결정적(로컬 = CI, 두 번 빌드 diff 0)이라 5% 는 노이즈가 아니라 "컴포넌트 몇 개는 통과, 유틸 라이브러리 1개(≥10 kB)는 차단" 의 폭.
- validate-env: 필수값·URL 형태·`NEXT_PUBLIC_`+비밀 이름·비밀값 복사·Preview→production 호스트. CI 와 Vercel(`vercel.json` buildCommand) 앞에 같은 게이트. secret 은 저장하지 않고 `openssl rand` 로 매 실행 생성 → 산출물 grep.
- 가시성: step summary 표 + `::error::` 애노테이션. PR 코멘트 액션은 fork PR 의 읽기 전용 토큰에서 동작하지 않아 쓰지 않았다(그 결과 write 권한이 어느 job 에도 없다).
- 빨간불: #7 `moment` import → 6 route 전부 `+51 kB` 초과, #8 잘못된 env → build 전 실패. 되돌리면 초록. 스크린샷 `docs/submissions/assets/week-10/`.
- Vercel: 첫 production 빌드를 `APP_ORIGIN required` 로 막았고(의도), 이어서 **게이트의 오탐**(플랫폼 변수 `TURBO_CI_VENDOR_ENV_KEY` 가 커밋 메시지에 우연히 포함 → "비밀 복사")으로 두 번 막혀 검사를 소유한 비밀값으로 좁혔다. Preview 는 `APP_ORIGIN` 대신 `VERCEL_URL` 로 유도해 production API 를 바라볼 자리를 없앴다.

### 4단계 — AI 리뷰 (RFC 4절)

- 기준: `.claude/skills/pr-review/SKILL.md` 규칙 14개(1·2–3·5·6·7·8–9·10주차). 로컬 Claude Code, advisory, CI 미통합(fork PR secrets 불가·비결정적·비용).
- **잘 잡은 것**: `e2e/fixtures/auth.ts:3` 이 mock 의 `accounts`·`TEST_PASSWORD` 를 import — 9주차 RFC C.4 에 우리가 적은 원칙을 우리가 어긴 자리. **헛소리**: paths-filter 권한이 "비공개 저장소 전용" 이라며 제거 권고 — README 원문에 그런 구분 없음, 빼면 403.
- v2(전제 확인·원문 인용·규칙 확장 분리): 같은 diff 에서 12 → 7건, 2 → 0건. v2 가 사실로 확인해 준 결함 3건(dependabot 이 composite action 을 안 훑음, 스크립트 lint 활성 규칙 0개, summary 입력 가드)을 반영.

### 5단계 — 룰 승격 (RFC 5절)

- 반복 지적 "mock 백엔드 내부(`_data`)가 앱·테스트의 공용 모듈" 7곳 → `no-restricted-imports`. 리팩터 전 lint 가 **정확히 7건** red(오탐 0) → 공개 모듈(`auth/session-cookie`·`session-token`) + 테스트 소유 계정으로 0. stdin 6케이스(위반 3 red / 예외·정상 3 green).
- 기계: 경계·형태·예산. AI: 반복 발견과 승격 후보. 사람: required·예산·승격의 결정과 판별. `useEffect` 동기화 vs 구독, hook 분리 지점, `as` 사유의 타당성은 사람·AI 에 남긴다.

### 6단계 — 회고

`docs/rfc/week10-retrospective.md`. 8절 "다시 만든다면" 의 첫 항목은 "mock 백엔드의 공개 표면을 첫날 lint 로" 다.

## 🤔 고민한 점 / 막혔던 부분

- **교과서와 측정이 갈렸다.** artifact 로 build→e2e 를 나누라는 권장은 이 규모(e2e 16초, setup 20초)에서는 느려진다. pnpm 캐시도 마찬가지. "일단 넣는" 대신 재고 나서 안 넣은 근거를 남겼다.
- **게이트의 오탐.** CI 에서는 절대 안 나고 Vercel 에서만 난 오탐(플랫폼 변수)을 두 번 겪었다. 규칙은 "이름에 KEY 가 들어간 모든 변수" 가 아니라 "우리가 소유한 비밀값" 이어야 했다.
- **필터의 base.** 문서만 바꾼 PR 에서 E2E 가 돌아 30분을 썼다. `paths-filter` 는 PR base 와 비교하므로 실험 PR 의 base 를 작업 브랜치로 잡아야 했다.
- **merge queue 부재.** 개인 계정 저장소라 `merge_group` 을 쓸 수 없어 "머지 직전 전체 검증" 을 "머지 직후 main push 검증 + revert 우선" 으로 대신했다. 이 차이를 문서에 숨기지 않았다.

## 🙋 피드백 받고 싶은 부분

- E2E 를 별도 job + `if: always()` gate 로 두는 것과 build job 의 조건부 step 으로 두는 것 — 이 규모에서는 후자를 택했는데, 팀 규모가 커지면 어느 시점에 전자로 바꾸는 것이 맞을지.
- 예산 여유폭 5% 의 근거("유틸 라이브러리 1개는 잡고 컴포넌트 몇 개는 통과") 가 충분한지, 아니면 route 별로 다르게 둘 이유가 있는지.
- AI 리뷰 프롬프트 v2 의 자가 점검 3개 외에 오탐을 줄이는 데 효과적이었던 장치가 있다면.

## 함께 생각해 볼 질문

RFC 7절에 4개 답변(각 2–4문장 + 이 레포의 사례).
