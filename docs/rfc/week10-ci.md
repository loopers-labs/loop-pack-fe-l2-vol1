# 10주차 CI 설계와 검증 기록

이 문서는 [10주차 과제](../assignments/week-10.md)에 대한 현재 구현, 검증 근거, 남은 작업을 구분한다. CI 기본 검증은 구현했지만 원격 실행 증거와 성능 예산이 없어 과제 전체가 완료된 상태는 아니다. 배포는 별도 작업이다.

문서는 고정된 완성본이 아니다. 구현이나 정책이 바뀌면 관련 PR에서 함께 수정한다. 실행 명령은 `package.json`, 자동화 동작은 `.github/workflows/quality.yml`과 검사 스크립트를 기준으로 확인한다. 측정 결과에는 대상 commit과 환경을 남기고, 과거 결과를 새 구현의 결과로 바꿔 적지 않는다.

## 1. 현재 상태

| 항목 | 상태 | 근거 또는 남은 작업 |
| --- | --- | --- |
| test · lint · typecheck · build | 구현 | 기존 Quality workflow를 단계별로 분리 |
| 조건부 E2E와 최종 gate | 구현 | 허용된 Markdown만 바뀐 PR에서 E2E 생략, 실행 결과 대조 |
| 환경 변수 검사 | 일부 구현 | CI에 연결, 배포 환경 연결은 미구현 |
| FSD 상향 import 차단 | 구현 | 실제 ESLint 설정을 정상·위반 입력으로 검증 |
| 원격 병합 차단 | 확인 필요 | GitHub ruleset 설정과 실제 PR 실행 필요 |
| CI 시간 최적화 | 미검증 | Before/After 및 cold/warm 반복 측정 없음 |
| 번들 예산 게이트 | 미구현 | 비교 가능한 측정값과 임계값 합의 필요 |
| AI 리뷰 과제 증거 | 일부 | 실제 리뷰 기록과 수용·반려 근거 정리 필요 |
| Vercel 배포 · smoke · rollback | 미구현 | 프로젝트 연결과 배포 정책 적용 필요 |

## 2. 실행 경로

Quality는 PR, `main` push, `merge_group`, 수동 실행에서 시작한다. workflow 전체에 경로 필터를 걸지 않는다.

1. checkout 및 Node·pnpm 설정
2. PR 변경 파일을 읽어 E2E 실행 여부 결정
3. `pnpm install --frozen-lockfile`
4. `pnpm test:ci` → `pnpm validate:env ci`
5. `pnpm test` → `pnpm lint` → `pnpm typecheck` → `pnpm build`
6. 필요한 경우 Chromium 설치 → `pnpm test:e2e:run`
7. `pnpm ci:gate`로 단계별 결과와 실행 계획 대조
8. `merge-gate`에서 quality job의 성공 여부 확인

일반 단계는 앞 단계가 실패하면 중단한다. 결과 검사와 최종 gate는 `always()`로 실행을 시도한다. runner 종료 등으로 실행되지 못해도 성공으로 간주하지 않는다.

Node는 `.nvmrc`, pnpm은 현재 `packageManager`와 같은 10.15.1을 사용한다. workflow의 pnpm 버전은 자동 동기화되지 않으므로 버전 변경 시 두 곳을 함께 갱신한다. quality timeout은 20분, merge-gate는 2분이다. 이는 안전 상한이지 성능 예산이나 실측 병목의 근거가 아니다.

로컬 전체 검증은 `pnpm check`다. CI 정책 테스트, Vitest, lint, 타입 검사, 빌드, E2E를 순서대로 실행하며 E2E를 생략하지 않는다. Chromium이 없다면 먼저 `pnpm exec playwright install chromium`을 실행한다. CI 환경 변수 검사는 workflow에서 별도로 실행한다.

`pnpm test:e2e`는 빌드까지 포함한다. `pnpm test:e2e:run`은 기존 production build를 사용하므로 소스를 바꾼 뒤 빌드 없이 단독 실행하면 안 된다.

## 3. E2E 생략 조건과 안전장치

| 변경 또는 이벤트 | E2E |
| --- | --- |
| PR에서 루트 README.md, CLAUDE.md, AGENTS.md, docs 아래 Markdown만 변경 | 생략 |
| 소스 · 설정 · 의존성 · workflow · 테스트 변경 | 실행 |
| 허용 목록 밖의 파일 또는 빈 변경 목록 | 실행 |
| Draft PR의 애플리케이션 변경 | 실행 |
| PR에 run-e2e 라벨 있음 | 실행 |
| main push · merge_group · 수동 실행 | 실행 |
| 변경 파일 조회 실패 | job 실패, 생략으로 처리하지 않음 |

`git diff base...head --name-only --no-renames -z`로 변경 목록을 읽는다. 삭제를 포함하고, 이름 변경은 이전 경로의 삭제와 새 경로의 추가로 판단한다. 공백이 있는 파일명도 NUL 구분자로 처리한다. SHA는 형식을 검사한 뒤 shell을 거치지 않고 git 인자로 전달한다.

문서 변경에서도 test · lint · typecheck · build는 실행한다. `docs/assets/week-05-product-images.md`는 단위 테스트가 읽으므로 문서 전체를 검증 대상에서 빼지 않는다. 향후 문서를 런타임 입력으로 사용하면 E2E 허용 목록도 수정해야 한다.

`ci:gate`는 필수 단계의 실패, 취소, 누락, 예상하지 않은 skip을 거부한다. browser와 E2E의 skip은 실행 계획이 명시적으로 false인 경우에만 허용한다. 계획 값 누락도 실패다.

PR의 연속 실행은 workflow와 ref 단위로 묶어 이전 진행 중 실행을 취소한다. main 실행에는 진행 중 취소를 적용하지 않는다. 이 설정이 별도 Vercel 배포를 취소하거나 순서를 보장하지는 않는다.

## 4. 검사 규칙의 범위

### 환경 변수

`scripts/validate-env.mjs`는 process 환경 변수만 읽는다. .env.local을 자동으로 읽지 않는다. 실행 모드 local, ci, preview, production을 명시해야 한다.

- 공통: APP_ORIGIN은 경로·query·fragment·사용자 정보가 없는 HTTP(S) origin이어야 한다.
- CI: localhost, 127.0.0.1, ::1 중 하나여야 한다. workflow는 Playwright 서버와 같은 http://127.0.0.1:3100을 지정한다.
- Preview/Production: HTTPS, 검사에 등록된 loopback 호스트 금지, 독립적으로 설정한 EXPECTED_APP_ORIGIN과의 정확한 일치를 요구한다.
- Preview/Production: 기본값이 아닌 43자 이상의 AUTH_SESSION_SECRET을 요구한다. 실제 생성 기준은 암호학적 난수 32바이트의 base64url 인코딩이다.
- 현재 앱은 NEXT_PUBLIC_*를 사용하지 않으므로 공개 변수 허용 목록을 비워 둔다. 추가 시 용도 검토와 테스트를 함께 추가한다.

오류에 변수 값을 출력하지 않는다. 길이 검사만으로 난수 품질을 증명하지 않으며, 모든 사설 주소·외부 API·환경 간 secret 재사용을 탐지하는 것도 아니다. EXPECTED_APP_ORIGIN을 같은 잘못된 값으로 복사하면 환경 혼동을 막지 못한다.

배포 모드 검사는 아직 배포 빌드나 런타임에 연결하지 않았다. 현재 CI 성공은 실제 배포 환경의 안전성을 증명하지 않는다.

### FSD 의존 방향

`eslint.config.mjs`의 no-restricted-imports가 `@/` alias 상향 참조를 직접 차단하고, import/no-restricted-paths가 상대 경로 상향 참조를 차단한다. 두 규칙은 src의 TypeScript 파일에서 다음 순서를 적용한다.

`app → _pages → widgets → features → entities → shared`

app → entities 같은 하향 참조는 허용한다. 같은 레이어의 slice 간 격리, Public API, analytics·test·examples·legacy 경계까지 강제하는 규칙은 아니다. 이 영역은 기존 저장소 규칙에 따라 리뷰한다.

실제 ESLint 설정에 가상 소스를 전달하는 테스트로 entities → app 오류와 app → entities 정상 결과를 확인한다. 적용 중 기존 상품 목록 테스트의 _pages → app/HeaderNav 참조가 발견됐다. 헤더와 목록을 함께 검증하는 테스트를 `src/app/products/ProductListContent.test.tsx`로 옮기고 단언은 유지했다. 린트 예외를 추가하지 않았다.

## 5. 병합 보호와 보안

YAML 파일만으로 GitHub의 병합 버튼이 차단되지는 않는다. 원격 실행 후 main ruleset에 다음 사항을 적용·확인해야 한다.

1. PR을 통한 변경을 요구한다.
2. 실제 생성된 merge-gate check를 required로 지정하고 제공자를 GitHub Actions로 제한한다. 기존 required check가 있다면 새 check의 생성·성공을 확인한 뒤 전환한다.
3. merge queue를 사용하면 merge_group 실행을 확인한다. 사용하지 않으면 **Require branches to be up to date before merging**을 활성화한다.
4. force push와 branch 삭제를 차단하고 bypass 주체를 확인한다.

Strict check는 최신 base branch를 반영한 검증을 요구한다. 설정 기능과 이용 범위는 [GitHub ruleset 문서](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)를 따른다. 이 저장소의 원격 설정은 아직 확인하지 않았다.

workflow는 contents: read, checkout의 persist-credentials: false, 기존 action의 full SHA 고정을 유지한다. PR 코드에 Production secret을 전달하지 않고 pull_request_target도 사용하지 않는다. PR에서 workflow·gate 자체를 수정할 수 있으므로 CI 정책 변경에는 사람의 리뷰가 필요하다.

Playwright trace와 screenshot은 인증 정보나 응답 데이터를 담을 수 있어 현재 workflow에서 artifact로 업로드하지 않는다. 향후 도입 시 수집 범위, 접근 권한, 민감 데이터, 보관 기간부터 결정한다. retry는 기존 CI 설정의 1회를 유지하며, flaky 자동 집계와 issue 생성은 구현하지 않았다.

## 6. 측정과 번들 예산: 아직 미완료

현재 로그만으로 GitHub CI의 병목이나 개선율을 주장하지 않는다. 검증 job 병렬화·추가 캐시는 도입하지 않았고 기존 setup-node의 pnpm cache를 유지했다. install은 cache hit 여부와 관계없이 실행한다.

summary에는 commit, E2E 실행 여부·이유, setup-node가 보고한 cache hit, 단계 outcome을 남긴다. step 시간은 Actions timeline에서 확인한다. cache 복원 key와 실제 복원 성공은 setup 로그도 함께 확인한다. summary는 아직 번들 수치, 단계별 시간 집계, flaky 통계를 제공하지 않는다.

### 측정 절차

1. 같은 애플리케이션 코드, Node·pnpm, runner 종류, 검증 목록을 가진 기준 workflow를 마련한다. 이번에 추가한 검사 비용을 최적화 효과와 섞지 않는다.
2. Before/After 각각 cold 3회 이상, warm 3회 이상을 측정한다. E2E 생략에 따른 비용 절감은 동일 검증의 속도 개선과 분리한다.
3. cold 반복은 각각 복원할 캐시가 없는 상태를 증명해야 한다. 같은 key로 세 번 실행하고 모두 cold라고 적지 않는다. 필요하면 별도 측정 workflow에서 실행별 격리 key와 restore fallback 없는 구성을 사용한다. 이 측정 workflow는 아직 없다.
4. warm은 같은 key의 캐시 생성·복원을 확인한 뒤 측정한다. miss 재현은 격리된 실험에서 수행하고, 공유 캐시 삭제나 의존성 변경을 일반 비교 결과에 섞지 않는다.
5. run URL, commit, cache key·hit, install 시간, 각 step 시간, 전체 wall-clock 원시값과 중앙값·범위를 기록한다. queue 대기 포함 여부도 동일하게 유지한다.
6. 가장 긴 구간에 맞는 변경만 적용하고 같은 검증 조건으로 다시 측정한다.

### 예산 결정

기존 초안의 280 KiB는 hard gate로 확정하지 않는다. 서로 다른 route의 단발성 값을 반복 측정처럼 사용할 수 없고, 이미지 중심 7주차 결과를 JavaScript 예산의 직접 근거로 삼을 수도 없다.

대상 route, 초기 로드·상호작용 범위, 공유 chunk 중복 제거 방식, gzip 또는 실제 전송량 중 어떤 지표인지 먼저 고정한다. 같은 조건의 기준값과 제품 요구를 바탕으로 한계를 정한 뒤 actual/budget/delta를 출력하는 검사를 구현한다. 초과 → 실패 → 수정 후 통과의 원격 증거도 필요하다.

Lighthouse는 별도 환경 변동성이 있으므로 점수 한 번의 하락을 즉시 required 실패로 만들지 않는다. Lighthouse 자동 측정도 현재 미구현이다.

## 7. Vercel 배포: CI와 별도 작업

Vercel은 배포 후보이며 현재 프로젝트 연결·환경 설정·URL·배포 성공은 확인하지 않았다. 배포 자체는 과제의 별도 채점 대상이 아니지만 운영 회고의 근거가 된다.

Git 연동만으로 Production 배포가 main CI 성공을 기다린다고 가정하지 않는다. 동일 commit의 검사를 배포 승격 조건으로 연결해야 한다. Vercel의 [Deployment Checks](https://vercel.com/docs/deployment-checks) 또는 별도 명시적 승격 흐름 중 프로젝트에서 사용할 수 있는 방식을 확인한 뒤 구현한다.

배포 전 필수 결정과 수정 사항은 다음과 같다.

- Preview와 Production의 origin·secret·외부 자원을 분리하고 배포 환경에 validator를 연결한다. CI용 로컬 주소를 복사하지 않는다.
- `src/app/api/_data/auth.ts`의 공개된 secret fallback과 mock 계정을 운영용 인증으로 간주하지 않는다. 배포 시 secret 누락은 런타임에서도 실패해야 한다.
- `src/app/api/_data/orderRepository.ts`의 메모리 Map은 재시작 시 사라지고 인스턴스 간 공유되지 않는다. 주문 생성과 조회가 다른 인스턴스로 가면 demo에서도 불일치가 발생한다. 일관된 주문 흐름이 필요한 배포 전 영속 저장소로 교체해야 한다.
- 배포 commit SHA와 URL을 기록하고 상품 조회, 비인증 주문 경로의 로그인 이동, 로그인·주문 흐름을 검사한다. 쓰기 검사는 격리된 테스트 자원에서만 실행한다.
- rollback 대상과 복구 후 smoke 검사를 정한다. 이전 코드로 돌아가도 외부 데이터 변경까지 되돌려지는 것은 아니다.

현재 CI 성공만으로 이 항목이 해결되거나 실제 서비스 운영이 가능하다고 보고하지 않는다.

## 8. AI 리뷰와 남은 과제 증거

AI 리뷰는 required check가 아니다. 저장소 규칙과 diff를 주고, 각 지적에 파일·줄, 재현 조건, 위반 규칙을 요구한다. 구조·상태 소유권·보안 경계처럼 맥락이 필요한 판단은 사람이 확인한다.

이번 문서 교정에서는 실측 없는 병목 주장과 근거가 부족한 번들 임계값을 철회했다. 기존 초안의 “AI가 pnpm cache를 node_modules 복원으로 오해했고 이를 반려했다”는 표는 실제 리뷰 기록이 아니므로 삭제했다. 예시를 실제 수용·반려 증거로 제출하지 않는다.

FSD 상향 참조 차단은 구현했고 정상·위반 입력으로 검사했다. 과제의 “반복 지적을 룰로 승격” 증거에는 추가로 이전 실제 지적과 현재 규칙의 연결을 제시해야 한다.

완료 전 남겨야 할 증거:

- GitHub에서 docs-only, 소스 변경, run-e2e, 실패·취소 시 gate 결과
- required check와 최신 base 반영 설정의 실제 병합 차단
- Before/After cold·warm 반복 실행과 cache hit·miss 로그
- 번들 예산의 근거 및 초과·복구 PR
- 환경 변수 오류와 FSD 위반의 원격 실패·복구 기록
- 실제 AI 리뷰의 수용·반려 근거 및 룰 승격 연결
- 10주 기술 회고; 배포했다면 URL·smoke·rollback 결과

## 9. 로컬 검증 기록

이번 작업 환경은 Windows, Node 22.23.2, pnpm 10.15.1이다. CI의 .nvmrc Node 24.17.0 및 Ubuntu 환경과 다르므로 로컬 성공을 원격 성공으로 대체하지 않는다.

- 최종 `pnpm check` 통과: CI 정책·환경 변수·ESLint 설정 테스트 8개, Vitest 40파일 186개, lint, typecheck, production build, E2E 9개.
- workflow YAML 파싱 확인. 이는 GitHub runner에서의 action 실행 검증은 아니다.
- GitHub push, ruleset 변경, Vercel 배포는 이번 로컬 구현에 포함하지 않았다.
