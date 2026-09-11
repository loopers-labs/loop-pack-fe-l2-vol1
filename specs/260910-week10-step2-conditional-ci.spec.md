# 10주차 Step 2 — CI 조건부 실행 스펙

> 상태: 초안 — 2026-09-10 실행 정책·changed-files·draft 생략·최신 main 반영 후 재검증 합의 반영. 최종 확정·로컬 이슈 작성 전.
> 근거: [10주차 과제](../docs/assignments/week-10.md), [결정 로그](../docs/rfc/week10-decisions.md)의 ADR-6~12, [1단계 구현·측정 결과](../docs/rfc/week10-ci.md).
> 실행 정책: 모든 PR은 기본 검사·관련 통합 테스트, main 병합 전은 핵심 E2E, Production 배포 전은 전체 E2E, 정기 실행은 전체 E2E·Lighthouse CI.

## Problem Statement

현재 CI는 변경 영역이나 PR의 목적지와 무관하게 통합 테스트와 E2E 전체를 실행한다. 개발 중인 PR, main에 합칠 PR, 실제 배포할 코드를 같은 비용으로 검증하고 있다.

필요한 것은 검증을 없애는 것이 아니라 실행 시점을 나누는 것이다. 단위 테스트는 항상 실행하고, 통합 테스트는 변경 영향을 받는 것만 실행한다. 핵심 기능은 main 병합 전에, 프로젝트 전체 브라우저 흐름은 Production 배포 전에 검증해야 한다. 현재 main push와 병렬로 시작되는 Vercel 자동 Production 배포는 전체 E2E 실패를 기다리지 않으므로 배포 전 게이트로 바꿔야 한다.

## Solution

PR에서는 lint·typecheck·전체 단위 테스트와 변경 관련 통합 테스트를 실행한다. main 대상의 준비 완료 PR 중 런타임 관련 변경에는 핵심 E2E를 추가하고 required 체크로 병합을 보호한다. draft와 문서 전용 PR의 E2E는 생략한다. main에 병합된 커밋은 전체 E2E를 통과해야 Production에 배포할 수 있다. 정기·수동 검증에서는 전체 E2E와 Lighthouse CI를 실행하고 배포는 하지 않는다.

production build는 기존대로 모든 PR에서 유지한다. 변경 판별 실패는 검증 성공으로 처리하지 않고, 각 단계의 실행 범위·생략 이유·실패 결과를 Actions에서 확인할 수 있게 한다.

merge queue 대신 main의 required checks를 strict로 설정한다. 다른 PR이 먼저 병합되어 main이 바뀌면 기존 성공 결과만으로는 병합하지 못하며, 최신 main을 PR 브랜치에 반영하고 CI를 다시 통과해야 한다.

## User Stories

1. As a PR 작성자, I want 모든 PR에서 lint·typecheck·단위 테스트 전체가 실행되기를, so that 기본 오류를 변경 종류와 무관하게 발견한다.
2. As a PR 작성자, I want 변경 영역과 관련된 통합 테스트만 실행되기를, so that 무관한 기능의 검증을 매번 기다리지 않는다.
3. As a PR 작성자, I want 공통 설정이나 테스트 기반이 바뀌면 영향받는 통합 테스트 전체가 실행되기를, so that 의존 관계 밖 변경을 놓치지 않는다.
4. As a PR 작성자, I want 테스트 파일 자체를 수정했을 때 그 테스트가 선택되기를, so that 테스트 변경이 관련 소스 검색에서 누락되지 않는다.
5. As a PR 작성자, I want 문서처럼 테스트에 영향이 없는 변경의 통합 테스트 생략 이유가 보이기를, so that 미실행과 판별 실패를 구분한다.
6. As a PR 작성자, I want main이 아닌 작업 브랜치 대상 PR에서는 E2E를 생략하기를, so that 개발 중에는 빠른 검증을 사용한다.
7. As a 리뷰어, I want main 대상의 준비 완료 PR에서 런타임 관련 변경의 핵심 E2E가 실행되기를, so that 로그인·주문의 실패를 병합 전에 발견한다.
8. As a 리뷰어, I want PR의 대상 브랜치를 main으로 바꾸면 핵심 E2E가 다시 요구되기를, so that 이전 브랜치의 생략 성공으로 병합하지 않는다.
9. As a 서비스 이용자, I want 로그인 성공 후 보호 경로로 돌아가는 흐름이 검증되기를, so that 주문에 진입할 수 있다.
10. As a 서비스 이용자, I want 잘못된 자격 증명에서 세션을 만들지 않는 동작이 검증되기를, so that 인증 실패가 잘못 처리되지 않는다.
11. As a 서비스 이용자, I want 상품 담기부터 주문 내역 확인까지 검증되기를, so that 구매 완료 흐름이 유지된다.
12. As a 유지보수자, I want 전체 E2E 실패가 Production 배포를 막기를, so that 핵심 E2E 밖에서 발견한 회귀도 사용자에게 배포하지 않는다.
13. As a 유지보수자, I want 검증한 커밋과 배포한 커밋이 같기를, so that 다른 커밋의 성공 결과를 배포 근거로 사용하지 않는다.
14. As a 유지보수자, I want 정기적으로 전체 E2E와 Lighthouse CI가 실행되기를, so that 전체 흐름과 성능 변화를 확인한다.
15. As a 유지보수자, I want 수동 검증이 Production 배포를 일으키지 않기를, so that 필요할 때 전체 검증만 재실행할 수 있다.
16. As a 리뷰어, I want 필요한 검증의 실패·취소·예상 밖 생략이 guard 성공으로 바뀌지 않기를, so that required 결과를 신뢰한다.
17. As a PR 작성자, I want CI에서만 실패를 최대 두 번 재시도하기를, so that 일시적 흔들림과 지속적인 실패를 구분한다.
18. As a 리뷰어, I want flaky 표시·실패 리포트·trace를 확인할 수 있기를, so that 재시도로 실패 원인이 숨지 않는다.
19. As a 작성자, I want 실행되는 PR과 생략되는 PR 및 배포 차단 증거를 남기기를, so that 조건부 실행이 실제로 작동함을 증명한다.
20. As a 작성자, I want 선택된 통합 테스트와 전체 실행의 시간 차이를 기록하기를, so that 변경 관련 실행의 비용과 효과를 설명한다.
21. As a 리뷰어, I want main이 바뀌면 PR에 최신 main을 반영하고 다시 검증하기를, so that 이전 main 기준의 성공 결과만으로 병합하지 않는다.

## Implementation Decisions

### 실행 계약

기존 Quality workflow와 테스트를 재사용한다. 모든 PR을 받고 workflow 자체는 생략하지 않는다. `dorny/paths-filter`로 변경을 판별해 job/step을 분기하고, 비싼 E2E에만 draft 생략 조건을 적용한다.

| 실행 시점 | lint·type·unit | integration | production build | E2E | Lighthouse CI | Production 배포 |
| --- | --- | --- | --- | --- | --- | --- |
| main 외 브랜치 대상 PR | 전체 | 변경 관련 | 실행 | 생략 | 생략 | 없음 |
| main 대상·non-draft·런타임 관련 변경 PR | 전체 | 변경 관련 | 실행 | 핵심 | 생략 | 없음 |
| draft PR 또는 문서 전용 PR | 전체 | 변경 관련 | 실행 | 생략 | 생략 | 없음 |
| main 병합 후 배포 파이프라인 | 전체 | 전체 | 실행 | 전체 | 생략 | 모든 필수 검증 성공 후 |
| 주 1회 schedule | 전체 | 전체 | 실행 | 전체 | 실행 | 없음 |
| 검증용 workflow_dispatch (선택한 브랜치) | 전체 | 전체 | 실행 | 전체 | 실행 | 없음 |

- **핵심 E2E 조건은 main 대상 AND non-draft AND 런타임 관련 변경이다.** 문서 전용·draft·main 외 PR은 브라우저 준비와 E2E를 생략한다. lint·typecheck·unit 전체·관련 integration과 build는 draft에서도 유지한다.
- PR base 변경과 draft 상태 변경을 재판정한다. `edited`·`ready_for_review`·`converted_to_draft`를 기존 PR 이벤트에 포함한다. main 대상 변경이나 ready 전환 후 이전 생략 성공으로 병합하지 않도록 실제 상태 전환 PR로 검증한다.
- 기본 정기 주기는 기존 주 1회를 유지한다. 매주 월요일 03:30 KST(일요일 18:30 UTC, cron `30 18 * * 0`)에 main을 검증한다. 수동 실행은 선택한 브랜치에서 같은 검증을 수행하며 배포를 호출하지 않는다.
- PR 연속 push는 낡은 run을 취소한다. main의 커밋별 검증은 1단계의 독립 run 정책을 유지한다. Production 게시 순서는 별도로 보호해, 오래된 run의 늦은 완료가 최신 배포를 덮지 않게 한다.
- production build와 해당 E2E는 가능한 한 같은 job에서 이어 실행한다. 로컬 `pnpm check`와 전체 테스트 명령은 전체 검증으로 유지한다.

### changed-files 필터와 생략 근거

- 변경 판별 수단은 `dorny/paths-filter`로 선택한다. PR base 대비 파일 목록과 영역별 결과를 관련 integration 선택 및 E2E 조건에 재사용한다. action은 검토한 버전을 commit SHA로 고정하고 PR 파일 조회 job에 필요한 `pull-requests: read` 권한을 둔다. [공식 README](https://github.com/dorny/paths-filter).
- 앱·빌드·테스트 입력이 아닌 것으로 확인한 문서·스펙 Markdown과 루트 안내 문서만 무관한 변경으로 허용한다. 문서 폴더 전체나 모든 Markdown을 일괄 제외하지 않는다.
- 앱 소스·공통 UI·API·라우팅·정적 자산·E2E와 fixture·workflow·빌드/테스트 설정·패키지·lockfile·Node 버전 변경은 런타임 관련 변경으로 분류한다. 미분류 파일도 실행 쪽으로 둔다. 문서와 코드가 섞이면 실행한다.
- `**` 하나로 모든 PR을 런타임 변경으로 처리하지 않는다. 문서 전용은 실제로 생략하되, 소스 몇 경로만 열거해 새 경로나 설정을 놓치지도 않는다. 부정 패턴의 결합 방식·삭제·이름 변경은 실제 출력 목록과 대조한다.
- 파일 목록은 JSON 등 구조화된 값으로 받아 인자로 전달하고 workflow 셸 본문에 직접 삽입하지 않는다. 조회 실패·목록 누락은 생략 성공이 아니라 guard 실패다.
- draft는 아직 병합할 준비가 안 된 상태이므로 E2E만 아낀다. ready 전환 시 다시 실행하고, 기본 검증은 그대로 유지한다. 이 정책에는 `run-e2e` 같은 라벨이 필요하지 않다.

### 단위·통합 테스트 분류와 변경 관련 실행

- **related-only는 채택 여부를 재는 후보가 아니라 모든 PR의 기본 정책이다.** 시간 측정은 효과를 기록하기 위한 것이며, 이득이 작다는 이유로 일반 PR을 전체 통합 테스트 실행으로 되돌리지 않는다.
- [8주차 검증 분류](../docs/rfc/week08-test-plan.md)를 출발점으로 현재 테스트의 책임을 확인한다. 순수 계산·단일 모듈 계약은 unit, 화면·상태·API 등 여러 부분의 연결 동작은 integration으로 분류한다. 현재 node/jsdom 프로젝트와 DOM 파일명은 실행 환경 구분이므로 unit/integration 구분으로 대체하지 않는다.
- Vitest의 기존 include/exclude 등으로 두 집합을 명확히 나눈다. 현재 테스트가 어느 집합에서도 빠지지 않도록 전체 목록과 대조하고, 단위 테스트는 관련 여부와 무관하게 항상 실행한다. 테스트 본문을 복제하거나 새 프레임워크를 도입하지 않는다.
- 변경 소스의 정적 의존 관계를 추적하는 기존 Vitest `related --run`을 통합 테스트 집합에 적용한다. 변경된 통합 테스트 파일 자체도 실행 집합에 포함한다. `related`는 정적으로 해석 가능한 import를 대상으로 하므로 동적 경로나 그래프 밖 의존을 별도로 다룬다. [Vitest CLI](https://vitest.dev/guide/cli#vitest-related).
- 공통 테스트 setup·MSW 기반·빌드/테스트 설정·lockfile처럼 전체 영향을 주거나 정적 그래프로 범위를 안전하게 좁힐 수 없는 변경은 전체 통합 테스트를 실행한다. 삭제·이름 변경으로 관계를 복원할 수 없는 경우도 포함한다. 미분류 런타임 경로를 무관한 변경으로 취급하지 않는다.
- 관련 테스트가 0개일 때는 판별 성공과 생략 근거를 기록한다. 앱·빌드·테스트 입력이 아닌 것으로 확인한 문서는 0개가 가능하다. 런타임 변경의 관련 결과가 0개이면 전체 통합 테스트로 폴백하고, 해당 영역의 기존 테스트 부재 여부도 기록한다. 판별 실패나 테스트 수집 실패를 0개 성공으로 바꾸지 않는다.
- PR 전체 diff를 base 대비 판별한다. 마지막 push만 보지 않고 삭제·이름 변경의 이전/새 경로를 포함한다. 파일 목록의 잘림·조회 실패·출력 누락은 required 실패로 처리한다.
- 변경 파일·선택된 통합 테스트·생략 또는 전체 폴백 이유를 리포트에 남긴다. 같은 커밋·CI 조건에서 전체 실행과 unit 전체+관련 integration 실행을 각 3회 비교해 raw 시간·중앙값·범위와 판별 비용을 기록한다.

### 핵심 E2E와 main 병합 guard

- **guard의 의미**: GitHub 전용 이벤트나 별도 도구가 아니라, 앞선 검증 결과와 생략 이유를 확인해 최종 성공·실패를 보고하는 일반 Actions job이다. `guard`는 역할을 설명하는 이름이며 `quality-gate` 등으로 이름 붙여도 된다. 이 job의 check를 branch protection의 required로 지정한다.
- 현재 핵심 범위는 기존 로그인 성공·실패 2개와 주문 완료 1개다. `@critical` 태그와 `--grep @critical`로 선택하며 로그인 fixture를 재사용한다. 회원가입과 결제는 예시에 해당하고, 현재 앱에 구현된 독립 기능이 아니므로 이번 CI 작업에서 새로 만들지 않는다.
- 세션 만료·상품 목록·Dialog E2E는 배포 전 및 정기·수동 전체 실행에 둔다. 핵심 3개가 실제 실행되는지 확인하고, 태그 누락·0개 선택·격리를 핵심 검증 완료로 보고하지 않는다.
- 2단계에서 fork main에 기본 checks와 PR guard를 required로 연결한다. checks는 lint·type·unit 전체·관련 integration을, guard는 변경 판별·build·조건에 해당하는 핵심 E2E의 결과를 보장한다. 조건부 step 자체를 required로 지정하지 않는다.
- guard는 선행 실패·스킵 후에도 결과를 평가한다. guard 성공은 판별·build 성공을 전제로 한다. 그 위에서 필요한 핵심 E2E가 성공하거나, 문서 전용·draft·main 외 PR이라는 의도적 생략 조건이 확인되어야 한다. draft 자체는 병합 대상이 아니며 ready 전환 후 다시 판정한다. 각 생략 이유를 보고한다. 필요한 검증의 실패·취소·예상 밖 생략은 성공으로 바꾸지 않는다. [GitHub job 의존성 규칙](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs).
- 구현은 `needs`로 선행 job의 결과를 받고 `if: always()`로 선행 실패·스킵 뒤에도 판정한다. `always()`는 실행 조건이며 무조건 성공하라는 뜻이 아니다. 실제 테스트를 다시 돌리지 않고, 결과와 의도한 실행 조건을 대조해 종료 상태를 결정한다.
- required 설정, 최신 SHA의 체크 결과, PR의 머지 가능 또는 차단 상태를 기록한다. 관리자 우회 머지를 통과 증거로 사용하지 않는다. 3단계에서는 size-limit·env 검증을 추가한다.

### 최신 main 반영과 재검증

- 개인 fork에서 사용할 수 없는 merge queue는 도입하지 않는다. main branch protection의 `Require status checks to pass before merging`과 `Require branches to be up to date before merging`을 함께 활성화한다(required checks의 strict 설정). [GitHub strict checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
- 순서는 **PR 검증 성공 → 다른 PR 병합으로 main 변경 → 기존 PR 병합 차단 → Update branch 또는 merge/rebase로 최신 main 반영 → 업데이트된 PR의 CI 재실행 → required 성공 후 병합 가능**이다. 그 사이 main이 다시 바뀌면 같은 절차를 반복한다.
- strict 설정은 main 변경 직후 모든 열린 PR의 CI를 자동 재실행하지 않는다. PR 작성자가 브랜치를 갱신하고, 그 갱신으로 발생하는 `pull_request.synchronize`에서 CI를 실행한다. 옛 커밋의 run을 단순 재실행하는 것으로 브랜치 갱신을 대신하지 않는다. 별도 자동 브랜치 갱신 봇은 추가하지 않는다.
- 갱신 후에도 lint·type·unit 전체·관련 integration·조건에 해당하는 핵심 E2E라는 PR 정책을 유지한다. 변경 판별은 갱신된 base 대비 PR diff를 사용하고, 테스트는 최신 main이 반영된 코드에서 실행한다.
- 이 설정은 검증 기준을 최신 main으로 맞추는 역할이다. PR에 전체 E2E를 자동 추가하거나 merge queue의 대기열 처리를 재현하지 않는다. 전체 E2E는 계속 Production 배포 전·정기·수동 실행에 둔다.

### 배포 전 전체 E2E

- **배포는 사용자에게 노출되는 Production 배포를 뜻한다.** 개발용 Preview 자동 배포는 유지할 수 있다. main 병합을 트리거로 검증을 시작하되, Production 게시가 전체 E2E 성공을 기다리도록 순서를 바꾼다.
- 현재 Vercel Git 연동의 main 자동 Production 배포를 중지하고, CI의 배포 단계만 Production을 게시하는 기본안으로 한다. Vercel은 브랜치별 Git 자동 배포 제어와 GitHub Actions·공식 CLI 배포를 지원한다. [Vercel Git 설정](https://vercel.com/docs/project-configuration/git-configuration), [GitHub Actions 연동](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).
- 순서는 **main의 대상 SHA 고정 → 기본 검사·전체 통합 테스트 → production build → 전체 E2E → 성공 시 해당 SHA의 Production 배포**다. 로그인·주문·세션 만료·상품 목록·Dialog의 5개 스펙 묶음을 전부 실행한다. build 또는 테스트 실패·취소·예상 밖 스킵이면 배포 단계를 실행하지 않는다.
- 기존 E2E는 CI의 격리된 서버·테스트 계정에서 실행한다. 테스트를 위해 공개 Production에서 주문을 생성하지 않는다. 검증한 SHA와 배포한 SHA를 연결하고 배포 도중 다른 최신 브랜치 상태를 다시 가져오지 않는다. 빌드 환경 차이와 Vercel 산출물 호환은 구현 시 확인한다.
- Production 배포는 소유 fork의 main 실행에만 허용한다. PR·upstream 제출·schedule·검증용 수동 실행에는 배포 자격 증명을 제공하지 않는다. CLI 인증값·프로젝트 식별자는 secrets/환경 설정에서 공급한다.
- 비핵심 E2E를 의도적으로 실패시켜 main 검증은 실패하되 기존 Production은 유지되는지 확인한다. 정상 실행에서는 전체 E2E 종료 뒤 Production 배포가 시작됐음을 시간·SHA·run URL·배포 결과로 증명한다.

### 정기 E2E·Lighthouse CI

- 정기 실행은 main, 수동 실행은 선택한 브랜치의 전체 E2E와 Lighthouse CI 측정·리포트 업로드를 수행한다. 수동 실행은 작업 브랜치의 전체 흐름과 성능을 병합 전에 확인할 수 있도록 main으로 제한하지 않는다. 기본 Lighthouse CI 연결은 2단계에 포함하고, 7주차 측정에 근거한 assertion 임계값은 3단계에서 적용한다.
- 대상은 현재 구현된 홈·상품 목록 화면이다. 각 3회 측정하고 중앙값과 원자료를 남긴다. Lighthouse는 변동성이 있어 PR required나 Production 배포 게이트로 사용하지 않는다.
- 정기 실행이 default branch에 반영되어 실제 schedule로 실행된 증거를 남긴다. 첫 정기 실행 전에는 대기 상태로 표시하고 수동 실행을 schedule 실행 증거로 대신하지 않는다.

### flaky와 안전 논리

- 로컬 retries는 0, CI는 2로 두어 일시적 흔들림과 지속 실패를 구분한다. passed·flaky·failed를 리포트에 표시하며 재시도 소진 후 실패는 해당 병합·배포 게이트로 전파한다. CI trace는 `retain-on-failure`, 로컬은 끈다.
- 같은 테스트가 서로 다른 CI 실행에서 2회 이상 flaky이면 원인·실행 링크·복구 과제를 로컬 이슈로 남기고 격리한다. 자동 대기·상태 격리를 먼저 점검한다. 핵심 테스트나 해당 변경을 검증하는 테스트를 격리한 경우 대체 검증 없이 관련 PR을 병합하거나 배포하지 않는다.
- summary에 실행 범위·선택 테스트·생략 이유와 passed/flaky/failed/skipped를 표시하고 실패 시에도 리포트·trace 업로드를 시도한다. 인증 fixture의 storageState·쿠키 파일은 artifact에서 제외한다.
- main 병합 전에는 모든 단위 테스트·관련 통합 테스트와 런타임 변경의 핵심 E2E가 회귀를 검사한다. 문서 전용 생략은 검증 대상 런타임을 바꾸지 않는 범위에 한정한다. 비핵심 브라우저 회귀는 main에 들어갈 수 있지만 **전체 E2E 실패 시 Production 배포를 차단**한다. 정기 검증은 추가 감시이며 배포 전 검증을 대체하지 않는다.
- 과제의 안전 논리에는 이 경계를 그대로 쓴다. 핵심 회귀의 병합 차단과 전체 E2E가 검출하는 회귀의 배포 차단을 구분하고, 비핵심 회귀까지 main 유입을 막는다고 주장하지 않는다. 이는 사용자가 선택한 실행 정책이다.

### 3단계로 넘기는 연결 지점

- [3단계 예산 게이트](260910-week10-step3-budget-gates.spec.md)는 이 단계의 실행 조건을 유지하고, 모든 production build 앞에 대상 환경 검증을, 뒤에 산출물 크기 검사를 추가한다. draft·문서 전용·main 외 PR도 build가 있으므로 env·예산을 검사한다. E2E 생략 조건을 예산 생략 조건으로 재사용하지 않는다.
- 기본 checks와 PR guard라는 required 구조를 유지한다. 3단계에서 guard가 변경 판별·env·build·예산·조건에 해당하는 핵심 E2E의 결과를 함께 판정하도록 확장한다. 단계별 별도 guard나 중복 CI를 만들지 않는다.
- Production 배포 전에는 기존 전체 E2E 성공 조건에 예산·실제 배포 환경 검증 성공을 더한다. main의 커밋별 검증 독립 실행과 Production 게시 순서 보호를 유지한다. PR·정기·수동 검증에는 배포 자격 증명을 주지 않는다.
- 정기·수동 Lighthouse의 대상·3회 측정·원자료와 중앙값·리포트 업로드는 여기서 제공한다. 3단계는 assertion과 근거를 추가하며 주기나 배포 여부를 바꾸지 않는다.
- 변경 파일·선택 integration·E2E 생략 이유·passed/flaky/failed/skipped·trace 링크를 담는 기존 summary에 3단계가 예산/env 결과와 배포 추적성을 추가한다. 기존 검증 범위 정보와 실패 리포트를 대체하지 않는다.

## Testing Decisions

- 기존 fork PR·Actions 실행 결과를 주된 증거로 사용한다. 통합 테스트는 선택된 목록과 실제 실행 결과를, 배포는 검증·배포 SHA와 Production 상태까지 확인한다. 새 앱 시나리오를 추가하지 않는다.
- 선행 사례는 8주차의 단위/통합 분류, 9주차의 로그인·주문 E2E와 fixture, 1단계의 fork PR·run URL·시간 기록이다.
- **관련 integration 실험**: 실험용 PR에서 실제 상품 목록 소스를 변경한다. 예를 들어 표시 개수에 1을 더하는 오류를 넣고, 기존 개수 표시 통합 테스트가 선택되어 그 불일치로 실패하는지 확인한다. 테스트의 기대값을 함께 수정하거나 테스트 자체를 강제로 실패시키는 것으로 대신하지 않는다.
- **선택과 검출을 각각 증명**: 변경 파일·예상/실제 선택 테스트 목록을 대조해 관련 테스트 포함과 무관한 테스트 제외를 확인하고, 해당 테스트의 실패 로그·required 병합 차단을 남긴다. CI가 빨간색이라는 사실만으로 선택 로직 검증을 갈음하지 않는다.
- **복구 확인**: 오류를 원복하고 정상 실행을 확인한다. 완전 원복으로 PR diff가 사라지면 관련 테스트가 생략될 수 있으므로, 선택된 테스트의 실패→성공을 비교할 때는 같은 소스 파일의 동작을 보존하는 변경을 남겨 선택 조건을 유지한다. 실험 종료 후 그 변경도 정리하며 SHA·선택 목록·run URL을 각 단계에 기록한다.

| 확인 항목 | 완료 조건 |
| --- | --- |
| unit/integration 분류 | 현재 전체 테스트 목록이 두 집합으로 빠짐없이 분류되고 PR 변경 종류와 무관하게 unit 전체 실행 |
| 관련 integration | 상품 영역 변경 시 관련 테스트가 실행되고 무관한 영역은 생략됨. 소스에 넣은 개수 표시 오류를 해당 테스트가 검출하고 복구 후 같은 선택 조건에서 통과함. 테스트 파일 자체 변경도 실행됨 |
| 전체 영향·오류 | 공통 setup·lockfile·삭제·미분류 변경에서 전체 integration 폴백 확인. 파일 조회·수집 실패는 required 실패 |
| main 외 PR | E2E 생략 이유와 기본 checks·build 결과가 Actions에 나타남 |
| main PR | non-draft 런타임 변경에서 핵심 3개 실행·비핵심 생략, 문서 전용에서는 E2E 생략 후 guard 성공·머지 가능 |
| draft 전환 | draft 런타임 변경은 E2E 생략, ready 전환 후 핵심 E2E 실행·실패 시 병합 차단. 기본 checks는 두 상태 모두 실행 |
| 필터 반례 | 문서+코드, 공통 UI·설정·자산·lockfile·테스트 변경, 미분류 파일이 생략되지 않음. 삭제·이름 변경의 이전/새 경로 확인 |
| PR base 변경 | main 외 대상으로 만든 PR을 main으로 변경하면 핵심 E2E가 재실행되고 이전 생략 성공으로 병합되지 않음 |
| main 갱신 후 재검증 | A·B PR 검증 성공 후 A를 먼저 병합하면 B가 최신 main 미반영으로 차단됨. B를 갱신하면 새 SHA의 CI가 실행되고 required 통과 후 병합 가능. 갱신 전후 base/head SHA·run URL·PR 상태 기록 |
| required 실패 | 핵심 E2E·관련 integration·판별 실패를 각각 재현해 main 병합 차단. 최신 SHA·required 설정·PR 상태 기록 |
| Production 게이트 | 비핵심 E2E 실패 시 배포 단계 미실행·기존 Production 유지. 정상 run은 전체 E2E 성공 후 동일 SHA 배포 |
| 정기·수동 | main 및 작업 브랜치의 수동 실행에서 전체 E2E와 Lighthouse 홈·상품 목록 리포트 확인. 선택한 ref·SHA·run URL 기록, 배포 없음. main의 실제 첫 schedule run도 확인 |
| flaky | 일회성 실패는 retry 후 flaky, 지속 실패는 2회 retry 후 failed. 리포트·실패 trace 확인 |
| 비용 | 전체 대비 unit 전체+관련 integration 각 3회, 선택 목록·raw 시간·중앙값·범위·판별 비용 기록 |
| 정리 | 실패 실험·강제 retry 코드를 원복하고 최종 `pnpm check` 통과 |

- 같은 fork main 기준으로 E2E가 실행되는 non-draft 코드 PR과 생략되는 문서 PR을 각각 하나 이상 만들고 PR URL·base·draft 상태·SHA·run URL·예상/실제 실행 범위를 기록한다. draft→ready, main 외→main 재지정도 확인한다.
- 작업 브랜치 대상 PR도 실제 변경만 diff에 남도록 공통 기준을 맞춘다. 통합 테스트의 관련/무관 변경은 이 PR들의 추가 커밋으로 검증할 수 있다.
- 제출물은 기존 CI 기록 문서에 모은다. 각 조건의 근거, 선택·생략 로그, required 병합 차단, Production 배포 차단, flaky 정책, Lighthouse 결과를 연결한다. **merge_group을 적용하지 못한 이유(개인 소유 fork는 merge queue 미지원), GitHub 공식 근거, strict required checks 대체 방식과 재검증 증거**도 함께 남긴다. 실제로 수행하지 않은 실험은 완료로 기록하지 않는다.

## Out of Scope

- 회원가입·결제 등 현재 없는 앱 기능, 새 업무 E2E 시나리오, 테스트 프레임워크 교체.
- merge queue·`merge_group` 이벤트 도입, 조직 소유 저장소로의 이전, 모든 열린 PR의 자동 갱신 봇. 최신 main 반영 강제와 갱신 후 CI 재실행은 이번 범위다.
- label 기반 E2E 호출, 자동 flaky 격리 시스템.
- size-limit·env 예산 게이트와 Lighthouse assertion 임계값은 3단계 범위다. 배포 전 전체 E2E 연결과 정기 Lighthouse 측정 자체는 2단계에 포함한다.
- AI 리뷰·룰 승격, Docker 실습, 별도 배포 후 smoke 시나리오, 최종 회고.
- 1단계 Before/After 재측정. 변경된 실행 정책의 측정값을 기존 동일 조건 속도 개선과 합치지 않는다.

## Further Notes

- **merge queue 환경 확인 (2026-09-10)**: GitHub API에서 현재 fork 소유자 유형은 `User`, 공개 저장소임을 확인했다. merge queue는 조직 소유 공개 저장소 또는 Enterprise Cloud 조직의 비공개 저장소에서 제공되므로 현재 개인 fork에서는 사용할 수 없다. [GitHub 지원 범위](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/merging-a-pull-request-with-a-merge-queue).
- **merge_group 미적용 이유**: `merge_group`은 실제 merge queue가 병합 후보를 구성하고 검사를 요청할 때 발생하는 이벤트다. 현재 저장소는 큐를 활성화할 수 없어 이 이벤트를 이용한 검증을 실행할 수 없다. YAML에 이벤트만 선언해서는 대체되지 않는다. 문법 구현 실패나 설계 필요성 부족이 아닌 GitHub의 저장소 지원 범위 제약으로 기록한다.
- **대체 방식 확정 (2026-09-10)**: 현재 개인 fork를 유지하고 strict required checks로 최신 main 반영 후 재검증을 강제한다. 조직 저장소 마련 여부는 미결정 항목에서 제거한다. 이는 merge queue 도입이나 전체 E2E의 병합 전 이동을 뜻하지 않는다.

- 스펙은 로컬 `specs/`, 트래커는 기존 `.scratch/week10-step0-1-ci/issues/`와 같은 형식의 로컬 이슈 문서를 사용한다. 스펙 전체 확정 후 이슈를 작성하고 준비 상태는 `ready-for-agent`로 기록한다.
- 현재 작업은 스펙·ADR 수정이다. workflow·Vitest·Vercel 설정 변경이나 Production 배포를 이미 수행했다는 뜻이 아니다. 새 외부 의존성·환경설정의 실제 변경은 AGENTS 승인 경계를 따른다.
- AI는 분기·선택·배포 순서 초안과 실험 정리를 돕는다. 사용자는 실행 정책을 정했고, 선택 누락·병합 및 배포 차단 여부는 실제 결과로 검증한다.
