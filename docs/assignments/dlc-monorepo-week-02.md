# DLC 2주차 — 작업 그래프를 실제 배포와 요청 격리까지 연결해요

> **Phase**: 모노레포 캡스톤 (2/2)

> 💡 1주차에 만든 package dependency graph는 폴더를 보기 좋게 나눈 결과물이 아니에요. 이번 주에는 그 그래프로 **무엇을 검증하고, 어떤 이미지를 만들고, 어느 앱만 배포할지** 한 번만 계산해요. 그리고 그 계산이 최종 Linux 컨테이너와 배포된 Next.js 서버에서도 맞는지 공격적으로 확인해요. 마지막 목표는 "Turborepo를 붙였다"가 아니라, **변경된 책임만 빠르게 검증·배포하면서도 필요한 consumer와 사용자 격리를 절대 놓치지 않는 상태**예요.

## 왜 이 과제를 하는가

앱이 두 개일 때는 모든 앱을 매번 빌드해도 버틸 수 있어요. 하지만 앱이 N개로 늘어나면 `모든 앱 × 모든 검증 × 모든 환경`의 비용이 같이 늘어나요. 이때 경로 이름만 보고 job을 건너뛰면 빨라 보일 수는 있어도, 공유 package의 consumer를 빠뜨리는 더 큰 사고가 생겨요.

이번 주에는 아래 흐름을 하나의 계약으로 만들어요.

```text
base/head 변경
  → package dependency graph로 affected 계산
  → deployment-plan.json 생성
  → 검증 대상 선택
  → app별 image build·push
  → plan에 선택된 앱만 배포
  → 배포된 같은 instance에서 요청 격리 검증
```

중요한 구분이 두 가지 있어요.

1. **package affected**는 "어떤 package와 consumer가 영향을 받았는가"를 결정해요.
2. **task의 `inputs`·`outputs`·환경 변수**는 "그 package의 어떤 task cache를 다시 계산해야 하는가"를 결정해요.

둘을 섞으면 consumer를 누락하거나, web 전용 변경이 admin cache까지 매번 깨져요. 반대로 Docker 컨테이너를 둘로 나눴다는 사실만으로 같은 Next.js process 안의 사용자 A와 B가 격리됐다고 결론 내릴 수도 없어요. **작업 그래프, runtime 경계, 요청 경계는 이어져 있지만 서로 다른 증거가 필요해요.**

## 이번 주 과제

| # | 과제 | 완료 기준 |
| --- | --- | --- |
| 0 | CI Before와 예상 영향 범위 고정 | 전체 실행의 cold/warm 기준값과 변경별 예상 대상이 있음 |
| 1 | affected CI와 지속 cache | 하나의 plan으로 필요한 consumer만 검증하고 실패 시 전체 검증으로 전환함 |
| 2 | 앱별 production image | web/admin이 각자의 최소 Linux runtime으로 독립 실행됨 |
| 3 | 실제 Linux VM 배포 | 선택된 앱만 새 digest로 배포하고 실패 시 이전 digest로 복구함 |
| 4 | 동일 instance 요청 격리 | 결정적 동시 요청에서 사용자·role·audience·analytics가 섞이지 않음 |
| 5 | After 측정과 운영 증거 | 속도 개선이 검증 누락이 아님을 raw 값과 배포 증거로 설명함 |

## 시작하기 전에

- repository의 starter local RC와 grader·mentor service는 `pnpm check`와 [`dlc/mentor-kit/README.md`](../../dlc/mentor-kit/README.md)의 명령으로 검증할 수 있어요. 실제 registry namespace·Linux VM·ingress 값과 pinned image digest는 멘토가 외부 go/no-go를 마친 뒤 공식 starter tag와 함께 공지합니다. `local` tag나 예시 URL을 production 값으로 사용하지 마세요.
- [DLC 1주차 과제](./dlc-monorepo-week-01.md)의 web/admin 동작과 boundary gate가 모두 통과한 상태에서 시작해요.
- 모든 작업은 과제 공개 시 멘토가 지정할 동일한 공식 DLC starter tag와 Node.js·pnpm 버전을 기준으로 해요.
- starter가 제공되면 `dlc.manifest.json`에 grader가 찾을 web/admin workspace, image build target, health/readiness route, ingress, test account와 시험 route가 선언되어 있는지 확인해요. 구조를 바꾸면 manifest도 같이 갱신하세요.
- 과제 공개 시 제공할 `commerce-api` image는 digest로 고정된 공통 데이터 경로예요. 학생의 평가 대상 package가 아니며, web과 admin은 서로를 호출하지 않고 각자의 data-access 경계에서 이 API를 소비해요.
- 과제 공개 시 멘토가 Linux VM, registry 접근, web/admin ingress, TLS, blue/green slot과 deploy script 골격을 제공해요. 학생은 app별 image, Compose, runtime 설정, health 판정, 선택 배포와 rollback을 완성해요.
- API/registry/VM 같은 멘토 인프라 장애가 의심되면 readiness와 제공된 상태 확인 명령을 먼저 남기세요. 고정 image나 공통 인프라 장애는 학생 실패로 판정하지 않고 복구 후 같은 검증을 다시 실행해요.
- 실제 secret을 repository, image layer, build argument, Turbo cache, Actions 로그에 남기지 않아요.

---

## 📝 Implementation Quest

### 📏 0단계 — 전체 실행 Before와 예상 graph를 먼저 고정해요

최적화 전에는 모든 앱과 package의 lint·typecheck·unit·build를 실행하는 기준 pipeline을 측정해요. affected pipeline에 E2E를 포함할 계획이라면 Before와 After의 동일한 비교 task 집합에도 포함해요. E2E를 변경 조건에 따라 별도로 실행한다면 E2E는 별도 측정 track으로 분리하고 전체 실행 시간과 섞지 않아요. 빠른 숫자를 만들기 위해 검증을 빼기 전에, 같은 조건에서 무엇이 얼마나 걸리는지부터 고정해야 해요.

#### 1. cold와 warm을 나눠 3회씩 측정해요

- **cold**: pnpm store와 Turbo cache가 없는 상태예요.
- **warm**: 의존성 cache와 이전 task output을 복원할 수 있는 상태예요.
- 같은 commit, runner 종류, Node/pnpm 버전, 검증 목록을 유지하고 각각 3회 실행해요.
- 전체 wall-clock과 주요 task별 raw 값, 중앙값, 최솟값~최댓값 범위를 `docs/rfc/dlc-ci.md`에 남겨요.
- cache hit 로그만 캡처하지 말고, build output 같은 필요한 산출물이 복원되어 **후속 task가 실제로 성공하는지** 확인해요.

#### 2. 실행 전에 예상 영향을 적어요

아래 표를 그대로 복사해 각 시나리오의 실제 package 이름과 task를 채우세요. 먼저 예상한 뒤 CI가 만든 graph와 비교해야 "도구가 그렇게 골랐다"가 아니라 자신의 dependency graph를 설명할 수 있어요.

| 변경 | 반드시 검증할 대상 | 배포 대상 |
| --- | --- | --- |
| `apps/web` 내부 변경 | web | web |
| `apps/admin` 내부 변경 | admin | admin |
| web 전용 package 변경 | 해당 package + web | web |
| admin 전용 package 변경 | 해당 package + admin | admin |
| 양쪽이 소비하는 package 변경 | 해당 package + web + admin | web + admin |
| root toolchain/global policy 변경 | 전체 | 전체 |
| lockfile 변경 | 전체 install 검증 + app별 pruned lockfile 영향 확인 | graph가 신뢰되면 runtime graph가 바뀐 앱. 계산 불가 시 image build까지만 전체, 자동 배포 중단 |
| 문서만 변경 | 문서 게이트 | 없음 |

> 💡 **path filter만으로 affected를 대신하지 않아요.** 공유 package가 바뀌었을 때 어떤 앱이 소비자인지는 폴더 이름이 아니라 workspace manifest의 실제 dependency edge로 판단해야 해요.

**완료조건**

Before cold/warm 3회 raw 값·중앙값·범위와 여덟 가지 변경의 예상 검증/배포 대상이 구현 전에 문서에 있어야 해요.

---

### 🧭 1단계 — affected 계산을 하나의 배포 계획으로 고정해요

이번 단계의 중심 산출물은 CI 첫 job이 만드는 `deployment-plan.json`이에요. lint job, image job, deploy job이 각자 changed files를 다시 계산하면 서로 다른 결론을 낼 수 있어요. **영향 범위는 한 번만 계산하고 이후 모든 job이 같은 artifact를 읽게 하세요.**

#### 1. package graph로 affected를 계산해요

- PR checkout에는 base와 head를 비교할 충분한 Git history가 있어야 해요.
- Basic에서는 package 단위 `turbo run ... --affected`를 기준으로 해요. task 단위 affected 실험은 공식 query나 명시적인 future flag를 검증한 경우에만 Advanced로 다뤄요.
- `--dry`, filter 출력 또는 run summary로 **선택된 package/task와 선택 이유**를 job summary에 남겨요.
- package manifest에 선언한 dependency graph에서 consumer를 따라가요. 단순 changed-path 목록을 consumer graph로 오해하지 않아요.
- lint, typecheck, unit, build, E2E는 비용과 실패 반경에 맞춰 배치하고, web/admin build는 독립 runner에서 병렬 실행할 수 있게 해요.

#### 2. `deployment-plan.json`을 생성해요

plan에는 최소한 아래 정보가 있어야 해요.

- base SHA와 head SHA
- affected package 목록과 각 package가 선택된 이유
- lint·typecheck·unit·build·E2E별 대상 package/app 목록
- image를 build할 앱, registry에 push할 앱, 배포할 앱
- graph 계산이 실패해 전체 검증으로 전환됐는지와 그 이유

모든 후속 job은 이 파일을 artifact로 받아 사용해요.

- 검증 job이 자체 path filter로 대상을 다시 계산하지 않아요.
- image build와 push는 plan의 image 대상만 matrix로 만들어요.
- deploy는 plan의 배포 대상만 갱신해요.
- 최초 plan은 대상 선택 계약으로 고정하고 후속 job이 덮어쓰지 않아요. registry push 뒤에야 확정되는 immutable digest는 별도 `image-provenance.json`에 app·commit SHA·build run ID와 함께 기록하고, deploy job은 plan으로 앱을 선택한 뒤 provenance에서 그 앱의 digest를 읽어요.
- PR에서 full check를 생략하더라도 branch protection에 필요한 required guard는 항상 결과를 보고해야 해요. 조건부 job이 통째로 사라져 merge가 영원히 막히게 하지 않아요.
- plan이 없거나 schema가 잘못됐거나 head SHA가 현재 commit과 다르면 후속 단계는 배포하지 않고 실패해요.

#### 3. task cache의 경계를 맞춰요

- `turbo.json`의 `dependsOn`, `inputs`, `outputs`를 실제 task가 읽고 만드는 범위에 맞춰요.
- app별 build output과 test report처럼 다음 job이 필요한 산출물을 `outputs`에 선언해요.
- web 전용 입력을 global input으로 올려 admin까지 cache miss가 나지 않게 해요.
- 공통 toolchain처럼 모두의 결과를 실제로 바꾸는 입력만 필요한 task의 global input으로 선언해요.
- GitHub-hosted runner가 바뀌어도 warm 실행을 재현하도록 Actions cache에 `.turbo`를 저장해요. self-hosted cache나 remote cache는 선택할 수 있지만 유료 provider를 강제하지 않아요.

#### 4. 신뢰 경계와 fail-safe를 만들어요

- fork PR은 신뢰된 branch의 cache를 **읽을 수만** 있고 cache를 쓰거나 registry·VM credential을 받지 못하게 해요.
- main과 신뢰된 내부 PR만 cache write를 수행하고, 배포 credential은 배포 job에만 최소 권한으로 전달해요.
- `pull_request_target`에서 PR 코드를 checkout해 실행하지 않아요.
- shallow history, 존재하지 않는 base, graph/query command 오류를 각각 재현해요. 영향을 정확히 계산할 수 없으면 "아무것도 안 함"이 아니라 **전체 검증**으로 전환해 누락 가능성을 없애요. 다만 신뢰할 수 있는 배포 대상을 계산하지 못한 production deploy는 fail-closed로 중단해요. 복구를 위해 두 앱 image를 모두 build할 수는 있지만 자동 push·deploy 대상을 임의로 추측하지 않아요.
- third-party action과 workflow `permissions`의 범위를 검토하고 근거를 남겨요.

#### 5. affected와 cache를 공격적으로 검증해요

0단계의 여덟 가지 변경을 fixture commit 또는 test matrix로 재현해요.

1. 빠져야 할 앱이 실제로 빠지는지 확인해요.
2. 들어와야 할 consumer를 plan에서 일부러 제외하면 guard가 실패하는지 확인해요.
3. cache key 입력을 바꿔 miss를 만들고, 다시 실행해 hit과 output 복원을 확인해요.
4. shallow checkout, 없는 base, graph command 오류에서 전체 검증 fallback과 production deploy 중단이 함께 선택되는지 확인해요.
5. 실험용 누락과 cache 변경은 최종 branch에서 제거해요.

**완료조건**

affected 계산, 검증, image build/push, deploy가 모두 같은 `deployment-plan.json`을 소비해야 해요. 영향 없는 앱은 빠지고 필요한 consumer는 한 번도 누락되지 않으며, 계산할 수 없는 상황은 전체 검증으로 넘어가고 production deploy는 중단되어야 해요.

---

### 🐳 2단계 — app별 production image로 runtime 경계를 증명해요

로컬 workspace에서는 루트 `node_modules`, 다른 앱의 source, 개발용 환경 변수를 우연히 참조해도 실행될 수 있어요. Docker는 "내 컴퓨터에서 build됐다"를 확인하는 도구가 아니라, **앱 하나가 운영에 필요한 파일만으로 실행되는지 확인하는 최종 경계**예요.

#### 1. web과 admin을 서로 다른 image로 만들어요

- app별 multi-stage build와 Next.js standalone output 또는 동등한 최소 runtime 산출물을 사용해요.
- 필요하면 `turbo prune --docker`로 app별 workspace와 lockfile 범위를 줄여요. prune을 썼다는 사실보다 결과 image의 runtime graph가 맞는지가 중요해요.
- 최종 stage는 non-root user로 production server만 실행해요. 개발 서버와 bind mount는 production 검증으로 인정하지 않아요.
- 각 앱에 health endpoint와 container health check를 두고, process가 떠 있다는 사실과 요청을 받을 준비가 됐다는 상태를 구분해요.
- web과 admin은 서로 다른 OCI image와 immutable digest를 가져야 해요.
- production Compose에서 web과 admin은 같은 Docker network를 공유하지 않아요. app별 `internal: true` data/analytics network를 두고 mentor-owned service만 양쪽 network에 연결해, 별칭·gateway·계산된 URL로 정적 검사를 우회해도 앱끼리 직접 연결되지 않게 해요. app container의 host network와 `host-gateway` 우회도 금지해요.
- app 이름과 commit revision을 OCI label로 기록해요.

#### 2. 최종 Linux image 안에서 확인해요

- 각 image를 다른 workspace 도움 없이 기동하고 health/readiness와 핵심 smoke test를 실행해요.
- 앱이 사용하는 workspace package와 static asset이 실제 image 안에 포함됐는지 확인해요.
- 다른 앱의 전체 source와 monorepo 전체 source를 runtime stage에 복사해 누락을 덮지 않았는지 검사해요.
- web image가 없어도 admin image가, admin image가 없어도 web image가 독립적으로 시작·중지되는지 확인해요.
- `commerce-api` readiness가 통과한 뒤 각 앱 smoke test를 실행해 외부 의존 실패와 app packaging 실패를 구분해요.

#### 3. 환경 입력의 시점을 구분해요

| 종류 | 주입 시점 | cache/hash 규칙 |
| --- | --- | --- |
| `NEXT_PUBLIC_*` | image build | 해당 앱 build input이에요. 값이 바뀌면 그 앱 image를 다시 만들어요 |
| server runtime env | container start | image를 다시 만들지 않되 app별 runtime 계약으로 검증해요 |
| secret | container start의 secret store/file | image layer, build arg, Turbo cache에 절대 남기지 않아요 |
| 공통 toolchain env | CI task 실행 | 실제로 필요한 task의 global input으로만 선언해요 |

web 전용 public env를 바꿨을 때 admin cache와 image가 그대로인지, 공통 toolchain env를 바꿨을 때 필요한 전체 task가 무효화되는지 fixture로 확인해요.

#### 4. label, digest, provenance를 구분해요

- image의 revision label은 **어떤 commit에서 만들었는지**를 설명해요.
- registry의 `repo@sha256:...`는 **어떤 불변 image를 배포했는지**를 식별해요.
- 외부 provenance/deployment manifest는 app name, commit SHA, build run ID, immutable digest를 연결해요.
- commit SHA와 image digest는 서로 다른 값이에요. "두 값이 일치한다"고 쓰지 말고, provenance에서 올바르게 **연결됐는지** 확인해요.
- image가 자신의 registry digest를 내부에 알고 있다고 가정하지 않아요. push 뒤 registry가 확정한 digest를 CI artifact에 기록해요.

**완료조건**

web/admin image가 각자의 최소 runtime으로 독립 실행되고, workspace runtime dependency와 asset이 최종 Linux image 안에 있으며, 다른 앱 source를 통째로 포함하지 않아야 해요. commit → build run → immutable digest의 연결을 외부 provenance로 확인할 수 있어야 해요.

---

### 🚢 3단계 — plan에 선택된 앱만 실제 Linux VM에 배포해요

URL이 한 번 열렸다는 사실만으로 배포가 완료된 건 아니에요. plan이 선택한 digest를 새 slot에 올리고, health를 확인하고, ingress를 전환하고, 실패하면 이전 digest로 돌아갈 수 있어야 해요.

#### 배포 흐름

```text
deployment-plan.json
  → 선택된 app을 image-provenance.json의 immutable digest와 연결
  → 해당 digest pull
  → 새 slot/container 기동
  → 임시 port에서 readiness·health probe
  → smoke test
  → proxy target 전환
  → 이전 digest/slot 보존
```

**요구사항**

- production `compose.yml`과 제공된 reverse proxy/ingress route를 연결해요.
- app별 runtime env와 secret을 분리해 주입해요. web secret이나 customer cookie 설정이 admin에 공유되지 않게 해요.
- 새 container가 healthy가 되기 전에 성공으로 판정하거나 proxy target을 전환하지 않아요.
- web/admin 독립 재배포 명령과 이전 immutable digest로 되돌리는 rollback 절차를 `docs/rfc/dlc-deployment.md`에 적어요.
- `deployment-plan.json`의 head commit이 `image-provenance.json`의 revision과 같고, 실행 중인 container가 provenance에 기록된 해당 app의 immutable digest를 사용하는지 확인해요. plan 자체에 push 전에는 알 수 없는 digest를 미리 기록하지 않아요.
- health 실패, smoke 실패, digest pull 실패 중 하나를 의도적으로 재현하고 이전 version이 유지되거나 즉시 복구되는지 확인해요.

#### 독립 배포 시나리오

| 변경 | 배포 후 반드시 확인할 것 |
| --- | --- |
| web 내부 변경 | web만 새 digest, admin container/digest는 그대로 |
| admin 내부 변경 | admin만 새 digest, web container/digest는 그대로 |
| 양쪽이 소비하는 package 변경 | web/admin 모두 plan에 포함되어 새 digest로 교체 |
| 문서만 변경 | image push와 배포 없음 |

> ⚠️ **Basic 완료조건은 무중단 배포가 아니에요.** readiness 확인, 전환 전 새 version 검증, 이전 version 보존과 rollback까지 요구하며 짧은 연결 중단은 허용해요. 이를 "zero-downtime"라고 표현하지 마세요. 무중단을 주장하려면 이전 version drain, in-flight request 처리, 데이터/API compatibility window, rollback 중 연속 요청 증거가 추가로 필요해요. 이 범위는 Advanced예요.

**완료조건**

실제 Linux VM에서 web/admin URL이 열리고, 변경 영향에 따라 선택된 app만 새 immutable digest로 배포되어야 해요. health 실패는 성공으로 기록되지 않으며 이전 digest로 복구할 수 있어야 해요.

배포 전 `docker compose config --format json` 결과를 mentor network-policy grader에 넣어 web/admin network가 겹치지 않고, 두 앱이 `commerce-api`·analytics sink에만 각자의 internal network로 접근하는지 확인해요. 정적 source 검색과 이 runtime network 증거를 함께 통과해야 app-to-app HTTP 금지를 증명할 수 있어요.

---

### 🔐 4단계 — 같은 Next.js instance를 두 사용자가 동시에 공격해요

web과 admin을 다른 container로 나눈 것은 **앱의 배포 경계**를 증명해요. 하지만 한 web process가 고객 A와 B의 요청을, 한 admin process가 운영자 A와 B의 요청을 차례로 처리할 때 identity가 섞이지 않는지는 별도 검증이 필요해요.

이번 단계의 불변식은 하나예요.

> 같은 Next.js 서버 instance가 여러 요청을 처리해도 사용자 A의 session, role, 식별자, viewer 전용 조회 결과가 사용자 B의 요청에서 관찰되어서는 안 된다.

#### 1. 정말 같은 process를 시험해요

- grader는 내부 Docker network에서 reverse proxy를 우회해 특정 web/admin container의 고정 주소를 호출해요.
- 각 container가 boot할 때 만든 opaque instance ID와 request correlation ID를 안전한 response header 또는 grader log에 남겨요.
- 시험 요청의 instance ID가 같은지 먼저 확인해요. 다른 instance에 분산된 요청 결과는 이 시험의 증거가 아니에요.
- 사용자별 비교 값은 viewer 전용 `/me` DTO와 권한 판정 결과에서 가져와요. 운영자가 합법적으로 조회한 주문 데이터의 customer ID를 identity 누출로 오판하지 않아요.

#### 2. 우연한 race를 기다리지 말고 결정적으로 겹쳐요

- mentor-provided barrier/latch로 요청 A를 identity를 읽은 지점에 멈추고, 요청 B가 같은 지점을 통과하도록 겹쳐요.
- grader는 학생 app에 주지 않은 관리 token으로 barrier를 prepare·inspect하고, app은 도착 전용 token으로 request ID만 기록해요. 응답 header를 그대로 echo하는 것만으로는 통과할 수 없어야 해요.
- 단순히 요청을 수십 회 반복해 race가 우연히 발생하기를 기다리는 방식은 인정하지 않아요.
- unsafe fixture에서는 barrier 사이에 module-level `currentUser`를 덮어써 contract test가 반드시 실패해야 해요.
- 수정본은 cookie/header에서 session을 매 요청 다시 읽고 검증하며 같은 시험을 통과해야 해요.
- unsafe mutation 실패 로그와 수정본 통과 로그를 모두 남기고, module-level mutation은 최종 branch에서 제거해요.

#### 3. session·role·audience matrix를 전부 확인해요

| session | web | admin |
| --- | --- | --- |
| customer + `aud=web` | 허용 | 거부 |
| admin + `aud=admin` | 거부 | 허용 |
| customer + 잘못된 `aud=admin` | 거부 | 거부 |
| admin + 잘못된 `aud=web` | 거부 | 거부 |
| session 없음 | 공개 경로만 허용 | 로그인 외 거부 |

- 고객 A와 고객 B를 서로 다른 cookie jar로 같은 web instance에 동시 요청해요.
- 운영자 A와 운영자 B를 서로 다른 cookie jar로 같은 admin instance에 동시 요청해요.
- customer session으로 admin 주문 read와 상태 변경을 직접 호출해 server entry point에서 거부되는지 확인해요. UI를 숨긴 것은 권한 검증이 아니에요.
- web audience session을 admin에, admin audience session을 web에 다시 보내 거부되는지 확인해요.
- web에서는 role이 customer로 맞지만 `aud=admin`인 session을, admin에서는 role이 admin으로 맞지만 `aud=web`인 session을 보내 거부되는지 확인해요. role과 audience를 동시에 틀리게 만든 시험만으로 audience 검증을 증명하지 않아요.
- role과 audience는 맞지만 반대 앱의 signing key로 서명한 session을 app별 cookie 이름으로 바꿔 보내 거부되는지 확인해요. role·audience 거부만으로 signing secret 분리를 증명하지 않아요.
- host-only 또는 app별 이름의 cookie를 사용해요. 한 ingress에서 받은 cookie를 다른 ingress에 **직접 재전송하는 공격**도 거부되어야 해요.
- `A → B → A`, `B → A → B` 순서와 barrier 동시 실행 모두에서 ID, 이메일, role, viewer DTO가 교차 노출되지 않아야 해요.
- user-specific 결과를 모든 사용자에게 공유되는 cache에 저장하지 않고, DAL·Route Handler·Server Action에서 viewer 권한과 DTO 필드를 다시 검증해요.

#### 4. analytics는 browser context에서 따로 시험해요

server 응답이 안전하다고 client analytics identity까지 안전한 것은 아니에요.

- 두 개 이상의 독립 browser context를 사용해요.
- mentor-provided test sink에 context별 sentinel event를 기록해요.
- customer/customer와 customer/admin context를 교차 실행해 다른 context의 current identity가 event에 붙지 않는지 확인해요.
- server analytics adapter는 요청 identity를 process-wide module scope에 보관하지 않아요. client SDK가 browser context의 identity를 유지한다면 명시적인 `identify`/`reset`과 로그인·로그아웃·계정 전환 시험이 있어야 해요.

#### 5. 시험용 hook을 운영 ingress에서 닫아요

- barrier/latch, seed reset, sentinel 제어 route는 grader credential과 내부 Docker network에서만 접근할 수 있어야 해요.
- production mode에서는 기본 비활성화하고 public ingress에서는 접근할 수 없어야 해요.
- 최종 smoke test에서 공개 web/admin URL로 test hook을 호출해 404 또는 명시적 거부가 발생하는지 확인해요.
- test hook을 열기 위한 secret을 client bundle, image label, 로그에 넣지 않아요.

**완료조건**

같은 web/admin instance를 대상으로 한 결정적 동시 요청에서 사용자 식별자가 섞이지 않고, 잘못된 role·audience·cookie replay가 server에서 거부되어야 해요. server 요청 격리와 browser analytics 격리 증거가 각각 있어야 하며 grader hook은 public ingress에서 닫혀 있어야 해요.

---

### 📊 5단계 — After를 재고 배포 증거를 연결해요

0단계와 **완전히 같은 비교 task 집합**으로 affected CI의 cold/warm을 각각 3회 다시 측정해요. E2E를 별도 track으로 분리했다면 Before/After 모두 같은 E2E 시나리오와 실행 조건으로 따로 비교해요.

**요구사항**

- Before와 같은 commit 규모, runner 종류, Node/pnpm 버전, cache 상태, task 집합에서 비교해요. 한쪽에만 E2E가 포함된 숫자를 개선치로 비교하지 않아요.
- cold/warm raw 값·중앙값·범위를 함께 기록해요.
- 각 변경 시나리오의 예상 graph와 실제 `deployment-plan.json`을 비교해요.
- 줄어든 시간이 측정 흔들림보다 큰지, cache 효과인지 실행 대상 감소인지 구분해요.
- cache가 잘못됐을 때 stale output이나 consumer 누락이 생길 위험과 이를 막은 fixture를 함께 설명해요.
- 효과가 없거나 복잡도만 늘린 최적화는 제거하거나 유지 근거를 적어요.

최종 운영 증거에는 아래 연결이 보여야 해요.

```text
PR / CI run
  → base/head SHA
  → deployment-plan.json
  → app별 build run
  → registry immutable digest
  → VM의 running container
  → health·smoke·same-instance isolation 결과
```

**완료조건**

"CI가 빨라졌다"가 아니라 **어떤 변경에서 무엇을 생략했고, 필요한 consumer를 왜 놓치지 않았으며, 그 plan이 어떤 digest와 실제 배포로 이어졌는지** 원본 로그와 artifact로 설명할 수 있어야 해요.

---

## 💬 함께 생각해 볼 질문 (제출)

아래 질문에 각각 2~4문장으로 자신의 판단과 근거를 적어 제출해요.

1. **세 번째 앱 `seller`가 생기면 CI matrix는 어떻게 늘어나야 할까?**
   - app 이름을 workflow에 계속 하드코딩하는 방식과 graph에서 matrix를 만드는 방식의 차이를 생각해봐요. 최대 동시 실행 수와 비용 제한은 어디에 둘지도 적어봐요.
2. **auth policy package가 바뀌었을 때 web과 admin을 모두 검증해야 하는 이유는 무엇일까?**
   - 공통 package의 직접 변경과 web 전용 event schema 변경의 영향 범위가 왜 다른지도 비교해봐요.
3. **affected 계산에 실패했을 때 빠르게 실패할까, 전체 검증할까?**
   - PR 검증, image push, production deploy에서 같은 fallback이 항상 맞는지 안전성과 비용을 기준으로 설명해봐요.
4. **container를 둘로 나누었는데도 요청별 identity가 섞일 수 있는 이유는 무엇일까?**
   - process lifetime의 mutable singleton, 공유 cache, client analytics context를 각각 생각해봐요.
5. **Basic 배포를 zero-downtime라고 부르면 안 되는 이유는 무엇일까?**
   - readiness만으로 증명되지 않는 drain, in-flight request, compatibility window와 rollback을 생각해봐요.

---

## 🤖 AI 활용

AI에 맡겨도 좋은 일:

- workflow matrix와 Dockerfile 초안
- Turbo run summary 해석 보조
- Compose·deploy script·검증 fixture의 골격
- CI raw 값 표 정리와 문서 초안 검토

직접 결정하고 방어해야 하는 일:

- task `inputs`·`outputs`와 cache key
- affected 실패 시 fallback
- required guard와 배포 조건
- image에 포함될 runtime 범위
- secret과 build/runtime 환경 경계
- auth/analytics의 요청 상태 경계

AI가 만든 설정은 위반/정상 fixture, cache hit/miss, 최종 image 내부 실행, 실제 VM rollback, 동일 instance 동시 요청으로 검증한 뒤 채택하세요.

---

## 최종 제출물

| 제출물 | 권장 위치 |
| --- | --- |
| CI/affected 설계, Before/After raw 값, 시나리오 결과 | `docs/rfc/dlc-ci.md` |
| 배포·health·독립 재배포·rollback runbook | `docs/rfc/dlc-deployment.md` |
| 요청 격리 threat model과 공격/복구 결과 | `docs/rfc/dlc-request-isolation.md` |
| grader 실행 계약 | `dlc.manifest.json` |
| 단일 영향·검증·배포 계획 | CI artifact `deployment-plan.json` |
| workspace/task graph | `pnpm-workspace.yaml`, `turbo.json`, package manifests |
| CI workflow와 consumer 누락 guard | `.github/workflows/**`, 검증 script/fixture |
| app별 production image | app별 Dockerfile 또는 명시적 target이 있는 공통 Dockerfile |
| 운영 구성 | `compose.yml`, proxy/ingress 설정 |
| image provenance | CI artifact `image-provenance.json` — app, commit SHA, build run, registry digest 연결 |
| 실제 배포 증거 | web/admin URL, running digest, health·smoke 결과 |
| 격리 증거 | unsafe mutation 실패/복구, session matrix, cookie replay, analytics context 결과 |

스크린샷만 내지 말고 가능한 경우 CI run URL, raw log, JSON artifact와 재현 명령을 함께 남겨요. 제출 시점에 web/admin 두 앱이 모두 실제 VM에서 실행 중이어야 해요.

---

## References

| 구분 | 링크 |
| --- | --- |
| 토스 모노레포 파이프라인 | https://toss.tech/article/monorepo-pipeline |
| 토스 모노레포 운영 회고 | https://toss.tech/article/52209 |
| Turborepo Running tasks | https://turborepo.com/docs/crafting-your-repository/running-tasks |
| Turborepo Caching | https://turborepo.com/docs/crafting-your-repository/caching |
| Turborepo Docker | https://turborepo.com/docs/guides/tools/docker |
| Next.js Self-hosting | https://nextjs.org/docs/app/guides/self-hosting |
| Next.js Output file tracing | https://nextjs.org/docs/app/api-reference/config/next-config-js/output |
| Next.js Authentication | https://nextjs.org/docs/app/guides/authentication |
| GitHub Actions security hardening | https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions |

---

## ✅ Checklist

**affected CI와 cache**

- [ ] Before/After의 cold/warm을 같은 task 집합·조건에서 각각 3회 측정했는가
- [ ] 여덟 가지 변경 시나리오의 예상 graph와 실제 graph를 비교했는가
- [ ] `deployment-plan.json` 하나가 검증·image build/push·deploy 대상을 모두 결정하는가
- [ ] 필요한 consumer를 일부러 누락하면 guard가 실패하는가
- [ ] shallow history·없는 base·graph 오류가 전체 검증 fallback과 production deploy 중단으로 이어지는가
- [ ] cache hit 때 필요한 output이 복원되어 후속 task가 성공하는가
- [ ] fork PR이 cache write·registry·deploy credential을 얻지 못하는가

**production image와 환경**

- [ ] web/admin image가 다른 앱이나 root workspace 없이 각각 실행되는가
- [ ] runtime workspace package와 asset을 최종 Linux image 안에서 확인했는가
- [ ] 다른 앱 또는 monorepo 전체 source를 runtime image에 복사하지 않았는가
- [ ] build-time public env, runtime env, secret, toolchain hash input을 구분했는가
- [ ] revision label, immutable digest, 외부 provenance의 역할을 구분했는가

**실제 배포**

- [ ] web-only 변경에서 admin running digest가 그대로인가
- [ ] admin-only 변경에서 web running digest가 그대로인가
- [ ] shared package 변경에서 두 consumer가 모두 새 digest로 배포되는가
- [ ] 새 slot의 health를 확인한 뒤 proxy를 전환하는가
- [ ] 실패를 재현하고 이전 immutable digest로 복구했는가
- [ ] Basic 결과를 zero-downtime라고 과장하지 않았는가

**요청 격리**

- [ ] opaque instance ID로 모든 시험 요청이 같은 process를 통과했음을 확인했는가
- [ ] barrier/latch로 race를 결정적으로 재현했는가
- [ ] customer/customer와 admin/admin 동시 요청에서 viewer identity가 섞이지 않는가
- [ ] role·audience·cookie replay 공격이 server entry point에서 거부되는가
- [ ] 주문 데이터의 customer ID와 현재 viewer identity를 구분해 판정했는가
- [ ] browser context별 analytics sentinel이 서로 섞이지 않는가
- [ ] public ingress에서 barrier/reset/test hook에 접근할 수 없는가
- [ ] unsafe mutation은 최종 branch에서 제거됐는가

**마무리**

- [ ] web/admin 실제 URL, commit SHA, build run, image digest, health·smoke·격리 결과가 연결되는가
- [ ] 실험용 실패 코드와 실제 secret이 최종 commit에 남지 않았는가
- [ ] [DLC 캡스톤 진입 문서](./dlc-monorepo-capstone.md)의 필수 통과 조건을 모두 만족하는가
