# 10주차 AI 코드 리뷰

## 리뷰 위치

AI 리뷰는 CI required check가 아니라 로컬 advisory로 둔다. 모델 결과는 같은 diff에서도 달라질 수 있고, API 비용과 외부 장애가 merge 가능 여부를 결정하게 할 이유가 없다. 결정적으로 판별 가능한 지적은 검증한 뒤 lint·test·CI 규칙으로 옮긴다.

실행 정보는 다음과 같다.

| 항목 | 값 |
| --- | --- |
| 도구 | Codex CLI 0.154.0 |
| 모델 | gpt-6-astra |
| 실행일 | 2026-09-11 |
| 대상 | `git diff 5b29c432...HEAD` |
| 실행 모드 | read-only, ephemeral |

## 팀 규칙을 넣은 프롬프트

```text
현재 저장소의 아래 diff를 코드 리뷰하라. 파일을 수정하지 마라.

팀 규칙:
1. any, ts-ignore, eslint-disable 남용 금지
2. 파생값을 useState와 useEffect로 동기화 금지
3. FSD 상위 레이어 참조, cross-slice, Public API 우회 금지
4. 서버 응답을 클라이언트 store에 복사 금지
5. 화면은 analytics events의 타입 wrapper만 사용하고 logger의
   track, identify, reset을 직접 import하지 않음

correctness, CI false-green, secret exposure를 우선한다.
각 지적은 파일과 근거를 제시하고 확신이 낮으면 추측이라고 표시한다.
일반론은 쓰지 않는다.
```

규칙의 출처는 `AGENTS.md`, `docs/rfc/week06-fsd.md`, `docs/rfc/week09-e2e-scope.md`다. 모든 규칙을 새로 만들지 않고 이미 합의한 경계만 넣었다.

## 잘 잡은 리뷰

리뷰는 다음 우회를 실제 TypeScript module resolution과 ESLint 입력으로 재현했다.

> 확장자를 붙이면 원시 analytics import 제한을 우회합니다. `@/analytics/logger.js`는 ESLint 메시지가 없고 TypeScript는 실제 `src/analytics/logger.ts`로 해석했습니다.

기존 패턴은 `@/analytics/logger`와 `**/analytics/logger`만 막았다. `.js`를 붙인 import가 실제 `logger.ts`로 연결되는 것을 확인한 뒤 `logger.*` 패턴을 추가했다. 두 번째 리뷰가 찾은 동적 `import('@/analytics/logger')` 우회도 재현되어 `no-restricted-syntax`로 막았다.

환경 검증이 `process.env`만 보고 Next가 별도로 읽는 `.env.production`을 놓친다는 지적도 맞았다. `@next/env`의 production 로더를 사용하고 실제 `.env.production` fixture가 값 노출 없이 실패하는 테스트를 추가했다.

## 헛소리와 과잉 확신 — 계획 단계

초기 계획은 분리 전 로그의 Playwright 176초를 브라우저 다운로드에 귀속하고 browser cache를 해결책으로 제안했다.

> 확정된 대상 하나: Playwright 브라우저 캐시. cold 176초의 근거가 여기 있다.

분리 측정 결과 `install-deps`는 13~28초, Chromium 다운로드는 11초였다. 176초는 이후 네 번의 표본에서 재현되지 않았고 어느 하위 단계의 값인지도 알 수 없었다. `--only-shell` 실험도 다운로드 중앙값만 11초에서 6초로 줄였을 뿐 job 전체 중앙값은 112초로 같았다. 원인과 효과를 모두 확인하지 않은 단정이라 채택하지 않았다.

## 헛소리와 과잉 확신 — 리뷰 단계

위 오판은 계획 단계에서 나온 것이라 diff 리뷰의 오탐 사례로는 부족하다. 개선 전 프롬프트가 실제로 무엇을 만드는지 기록이 없어 프롬프트 수정의 효과도 대비할 수 없었다. 그래서 같은 diff에 **개선 전 프롬프트("개선할 점을 최소 5개")를 다시 걸어** 재현했다.

| 항목 | 값 |
| --- | --- |
| 도구 | Claude Code |
| 모델 | Claude Opus 5 |
| 실행일 | 2026-09-11 |
| 대상 | 같은 `git diff 5b29c432...HEAD` |
| 프롬프트 | 개선 전 버전(최소 개수 요구 포함) |

여섯 건이 나왔고 전부 코드로 재현을 시도했다.

| # | 지적 | 재현 시도 | 판정 |
| --- | --- | --- | --- |
| 1 | `Dockerfile`의 `COPY . .`가 `.next`와 `node_modules`를 이미지에 넣는다 | `.dockerignore`가 둘 다 제외한다 | 오판 |
| 2 | E2E 경로 필터의 `.env*`는 `.gitignore`가 `.env*`를 무시하므로 매치되지 않는다 | `!.env.example` 덕분에 `.env.example`이 추적 중이라 매치된다 | 오판 |
| 3 | `validate-env`가 `process.env` 전체를 훑어 러너 주입 변수로 오탐이 난다 | 해당 이름 규칙에 걸리는 러너 변수가 없다. `loadEnvConfig` 뒤 전체 검사는 의도한 범위다 | 근거 없음 |
| 4 | smoke config의 프로토콜 오류 메시지가 자기 `catch`에 잡혀 사라진다 | `DEPLOYMENT_URL=ftp://example.com`에서 일반 메시지만 출력됐다 | 적중(사소) |
| 5 | 번들 예산이 예산표에 없는 라우트를 통과시킨다 | `/checkout` 5,000,000 B fixture로 실행해 종료 코드 0을 확인했다 | 적중 |
| 6 | `Dockerfile`의 `ARG APP_ORIGIN` 기본값이 환경 게이트를 무력화한다 | `getAppOrigin`은 기본값을 두지 않는데 Dockerfile이 `http://127.0.0.1:3000`을 채워 build 게이트를 통과시킨다. runner 단계에는 값이 없어 요청 시점에 던진다 | 적중 |

1~3은 모두 diff에 보이는 줄만 읽고 **인접 파일을 확인하지 않은 추측**이다. `.dockerignore`, `.gitignore`, 러너 환경을 각각 한 번씩만 열어보면 세 건 다 제출되지 않는다. 개수를 채우라는 조건이 확인 비용을 건너뛰게 만든다는 것이 이 실행의 결과다.

개선 후 프롬프트는 지적마다 파일·재현 경로·팀 규칙 중 하나를 근거로 요구한다. 1~3은 그 근거를 만들려면 인접 파일을 열어야 하고, 열면 스스로 기각된다. 최소 개수를 없앤 것보다 **근거를 요구한 쪽이 오탐을 줄인다.**

4~6은 이번 실행에서 새로 나온 적중이다. 5번과 6번은 둘 다 "게이트가 초록인데 막으려던 것이 통과하는" 형태라 별도로 다룬다.

## 프롬프트를 고친 결과

처음에는 “개선할 점을 최소 5개”라고 요구했다. 개수를 채우는 조건 때문에 동작상 결함과 문서 보강 제안이 같은 목록에 섞였다. 다음 실행에서는 최소 개수를 없애고, 파일·재현 경로·팀 규칙 중 하나를 근거로 요구하며 확신이 낮으면 추측으로 표시하게 했다.

그 결과 리뷰의 역할이 바뀐다. AI는 후보를 찾는다. 정적 분석과 테스트는 참·거짓을 가른다. 실행 시간과 Actions 로그는 효과를 가른다. 최종 채택은 이 세 증거가 모인 뒤에만 한다.

## 결정적 룰로 승격

9주차 문서는 화면에서 원시 `track()`을 호출하지 않고 타입 wrapper를 쓰기로 정했다. 당시 architecture 검사기는 `src/analytics`를 레이어로 인식하지 않아 이를 강제하지 못했다.

ESLint의 `no-restricted-imports`는 analytics 외부에서 `track`, `identify`, `reset`의 정적 import를 막는다. alias, 상대경로, 확장자 표기를 모두 포함한다. `no-restricted-syntax`는 같은 logger의 동적 import를 막는다. analytics 내부 wrapper와 `flush`, 초기화 함수는 허용한다.

자가 검증은 문서의 표가 아니라 `scripts/lint/analytics-rule.test.mjs`에 고정했다. `env:check`를 `env:test`가, `size:check`를 `size:test`가 각각 검증하는 것과 같은 배치다. ESLint Node API로 각 입력을 린팅해 승격한 두 룰의 메시지만 센다.

| 입력 | 기대 | 룰 |
| --- | --- | --- |
| `track` alias import | 실패 | `no-restricted-imports` |
| `identify` 상대경로 import | 실패 | `no-restricted-imports` |
| `track` `.js` 확장자 import | 실패 | `no-restricted-imports` |
| `import * as logger` namespace import | 실패 | `no-restricted-imports` |
| `export { track } from` re-export | 실패 | `no-restricted-imports` |
| logger 동적 import | 실패 | `no-restricted-syntax` |
| `flush` import | 통과 | — |
| `src/analytics` 내부 wrapper | 통과 | — |
| `.test.ts`의 계측 import·동적 import | 실패 | 두 룰 |
| 기존 `.test.ts` Testing Library 제한 | 실패 | `no-restricted-imports` |

문서 표로만 두면 `eslint.config.mjs`의 패턴 문자열 하나가 빠져도 `pnpm lint`는 그대로 통과한다. 룰을 세 가지로 훼손해 테스트가 그 회귀를 검출하는지 확인했다.

| 훼손 | 결과 |
| --- | --- |
| `group`에서 `logger.*` 두 패턴 제거 | `확장자를 붙인 import를 막는다` 실패 |
| src 블록의 `no-restricted-syntax` 제거 | `동적 import를 막는다` 실패 |
| `.test.ts` 블록에서 계측 제한 제거 | `node 테스트에서도 원시 계측 import를 막는다` 실패 |

11개 중 정확히 해당 케이스만 떨어졌고 복원 후 11개가 통과했다. CI에서는 `Lint` 스텝 앞의 `Test promoted lint rule`이 같은 테스트를 돌린다.

테스트를 쓰는 과정에서 구멍 하나를 찾았다. src 블록이 `.test.ts`를 `ignores`로 빼면서 동적 import 제한까지 함께 빠져 있었다. 정적 import만 막힌 테스트 파일이 남은 우회로였다. `.test.ts` 블록에 같은 제한을 다시 걸었다. 기존 테스트의 동적 import는 모두 자기 모듈 대상이라 영향이 없다.

### 승격한 규칙이 넷으로 늘었다

같은 원칙을 이후에 찾은 지적에도 적용했다. 참·거짓이 문자열로 갈리면 기계에, 맥락이 필요하면 사람에게 남긴다.

| 규칙 | 출처 | 승격 수단 | 실제로 겪은 위반 |
| --- | --- | --- | --- |
| 화면에서 원시 계측 import 금지 | 9주차 문서 | ESLint 두 룰 | 확장자·동적 import 우회 |
| 커밋에 AI 서명 금지 | CLAUDE.md | `commit-msg` 훅 + CI | 서명이 붙은 커밋 5개 |
| 주석의 의인화·영어식 직역 금지 | 팀 문체 규칙 | python 검사 | `상태를 가진 타입` 등 |
| CI 구성의 보안·계약 | 이번 주 리뷰 지적 | python 검사 | 배포 SHA checkout, Dockerfile 기본값, 드리프트 |

셋째와 넷째는 목록 기반이라 좁다. 문체 전부와 CI 구성 전부를 판정하지 않는다. 목록에 없는 것을 통과시키는 것은 설계이지 누락이 아니다.

넷 다 같은 배치를 쓴다. 게이트 자신의 테스트를 게이트보다 먼저 실행한다. 게이트가 회귀하면 본 게이트는 성공으로 남기 때문이다. 룰을 만들며 오탐 세 건과 미탐 한 건을 겪었고 모두 케이스로 고정했다.

원시 계측 함수의 import 여부는 맥락과 관계없이 판별할 수 있으므로 기계에 둔다. wrapper가 어떤 이벤트 이름과 프로퍼티를 가져야 하는지, 새 계측 SDK가 필요한지는 제품과 분석 맥락이 필요하므로 사람 리뷰에 남긴다. AI 리뷰는 그 사이에서 누락 후보를 찾지만 merge를 직접 막지 않는다.
