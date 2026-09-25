# DLC 모노레포 starter·grader·배포 환경 계약

- 작성일: 2026-09-25
- 대상: 멘토와 starter/grader 구현자
- 상위 설계: `2026-09-25-dlc-monorepo-capstone-design.md`
- 상태: 학생용 과제 공개 전에 구현·검증해야 하는 계약

## 1. 목적

이 문서는 학생에게 정답 구조를 제공하기 위한 문서가 아니다. 자유로운 package 설계를 유지하면서도 모든 학생이 같은 입력과 자동 검증 표면에서 시작하도록 starter, grader, CI artifact, Docker 배포 환경의 경계를 고정한다.

학생별 10주 결과물은 DLC 입력으로 사용하지 않는다. 멘토가 검증한 하나의 공식 starter tag를 배포한다.

## 2. 책임 분리

| 주체 | 책임 |
| --- | --- |
| 멘토 starter | 기준 web 앱, admin 골격, 고정 API, test accounts, fixture와 schema 제공 |
| 학생 | workspace/package 경계, Public API, admin 조립, CI, image, deploy, 요청 격리 완성 |
| grader | manifest를 통해 구조를 찾고 결정적 계약만 자동 판정 |
| 멘토 reviewer | package 분리 근거, 공유하지 않은 결정, CI/배포 trade-off 판단 |
| 공통 인프라 | VM, registry, ingress/TLS, 내부 test network, 최소 권한 credential 제공 |

## 3. 공식 starter tag

starter는 다음을 포함한다.

- 10주 커리큘럼의 기준 commerce web 앱
- web 핵심 사용자 경로를 고정하는 production E2E
- admin 주문 목록과 상태 변경 UI/API 골격
- customer/admin role session fixture
- pinned `commerce-api` image 계약
- client analytics test sink 계약
- boundary/graph/cache/image/security fixture 골격
- `dlc.manifest.json` schema와 example
- `deployment-plan.json` schema와 guard

starter는 다음 답을 미리 구현하지 않는다.

- 최종 package 이름과 개수
- Order 계약과 UI를 공유할지 여부
- auth·analytics package의 Public API
- package 간 허용 의존
- Turbo task inputs/outputs
- affected fallback 구현
- app별 Dockerfile
- production Compose와 배포 workflow

## 4. 학생 제출 manifest

repository root의 `dlc.manifest.json`은 grader가 자유로운 구조에서 실행 계약을 찾기 위한 파일이다. package 경계를 평가하는 정답 파일로 사용하지 않는다.

### 필수 shape

```json
{
  "schemaVersion": 1,
  "apps": {
    "web": {
      "workspace": "<workspace package name>",
      "dockerfile": "<repo-relative path>",
      "dockerTarget": "<target or null>",
      "baseUrlEnv": "WEB_BASE_URL",
      "internalBaseUrlEnv": "WEB_INTERNAL_BASE_URL",
      "healthPath": "/api/health",
      "readinessPath": "/api/ready",
      "viewerPath": "/api/me"
    },
    "admin": {
      "workspace": "<workspace package name>",
      "dockerfile": "<repo-relative path>",
      "dockerTarget": "<target or null>",
      "baseUrlEnv": "ADMIN_BASE_URL",
      "internalBaseUrlEnv": "ADMIN_INTERNAL_BASE_URL",
      "healthPath": "/api/health",
      "readinessPath": "/api/ready",
      "viewerPath": "/api/me"
    }
  },
  "accounts": {
    "customerA": "customer-a",
    "customerB": "customer-b",
    "adminA": "admin-a",
    "adminB": "admin-b"
  },
  "testContracts": {
    "analyticsSinkUrlEnv": "ANALYTICS_TEST_SINK_URL",
    "instanceHeader": "x-dlc-instance-id",
    "requestHeader": "x-dlc-request-id",
    "graderEnabledEnv": "DLC_GRADER_ENABLED",
    "graderTokenEnv": "DLC_GRADER_TOKEN",
    "graderTokenHeader": "x-dlc-grader-token",
    "sessionFixturePath": "/api/__dlc/session",
    "barrierHeader": "x-dlc-barrier-id"
  },
  "commands": {
    "boundaries": "pnpm dlc:boundaries",
    "plan": "pnpm dlc:plan",
    "verify": "pnpm dlc:verify",
    "runtime": "pnpm dlc:runtime"
  }
}
```

### 검증 규칙

- 두 workspace는 실제 `pnpm-workspace.yaml` package여야 한다.
- Dockerfile 경로는 repository 안에 있어야 한다.
- health/readiness/viewer route는 app별로 실제 응답해야 한다.
- `baseUrlEnv`에는 URL 값이 아니라 CI/배포 환경에서 주입할 환경변수 이름을 쓴다.
- `internalBaseUrlEnv`는 reverse proxy를 우회해 특정 container를 호출하는 내부 grader URL의 환경변수 이름이다.
- account 값은 starter가 제공한 alias만 허용하며 실제 secret은 저장하지 않는다.
- `commands`는 grader가 자유로운 학생 구조를 찾기 위한 실행 표면이며, 명령 문자열 안에 secret을 넣지 않는다.
- session fixture는 grader token이 있는 내부 요청에서만 alias와 시험용 role/audience 조합을 normal session cookie로 발급한다.
- viewer route는 `barrierHeader`가 있을 때 identity를 읽은 직후 mentor barrier와 동기화하되, grader mode가 아니면 해당 header를 무시하거나 거부한다.
- manifest에 package tree나 auth 구현 위치를 요구하지 않는다.

## 5. 단일 영향·배포 계획 artifact

CI의 첫 planning job은 `deployment-plan.json`을 만든다. 이후 lint/type/test/build, image build, registry push, deploy job은 별도 path 판단을 하지 않고 이 artifact만 소비한다.

### 필수 shape

```json
{
  "schemaVersion": 1,
  "baseSha": "<40-char commit sha>",
  "headSha": "<40-char commit sha>",
  "fallback": {
    "applied": false,
    "reason": null
  },
  "affectedPackages": [
    {
      "name": "<workspace name>",
      "reasons": ["<machine-readable or concise reason>"]
    }
  ],
  "tasks": {
    "lint": ["<workspace name>"],
    "typecheck": ["<workspace name>"],
    "unit": ["<workspace name>"],
    "build": ["<workspace name>"],
    "e2e": ["<app name>"]
  },
  "apps": {
    "web": {
      "validate": true,
      "buildImage": true,
      "pushImage": false,
      "deploy": false,
      "reasons": ["<reason>"]
    },
    "admin": {
      "validate": false,
      "buildImage": false,
      "pushImage": false,
      "deploy": false,
      "reasons": []
    }
  }
}
```

### 의미

- PR은 validate와 image build까지 수행할 수 있지만 untrusted fork에는 registry push·deploy credential을 주지 않는다.
- main의 신뢰된 commit만 push와 deploy를 `true`로 만들 수 있다.
- shallow history, base SHA 부재, Turbo/query 오류에서는 `fallback.applied=true`와 원인을 기록하고 두 앱을 모두 검증한다.
- 알려진 root toolchain/global policy 변경은 두 앱을 모두 검증·빌드하며, 신뢰된 main에서는 두 앱 모두 배포 대상으로 삼는다.
- lockfile 변경은 전체 install을 검증하고 app별 pruned runtime graph를 비교한다. graph를 신뢰할 수 있으면 실제 runtime graph가 바뀐 앱만 배포한다. 계산할 수 없으면 두 앱 image까지 만들되 자동 push·deploy는 중단한다.
- 문서만 바뀌면 두 앱의 deploy는 `false`지만 always-running guard는 success를 보고한다.

### guard가 확인할 것

- plan의 base/head가 실제 workflow context와 일치한다.
- affected package의 실제 consumer가 빠지지 않았다.
- `tasks`의 lint/typecheck/unit/build/E2E 대상과 후속 job matrix가 정확히 일치한다.
- task target을 후속 job이 별도 path 규칙으로 다시 계산하지 않는다.
- validate 없이 image/deploy가 `true`가 될 수 없다.
- buildImage 없이 pushImage가, pushImage 없이 deploy가 `true`가 될 수 없다.
- fallback이 필요한 fixture에서 부분 실행 plan을 거부한다.
- 후속 matrix가 plan과 같은 앱 집합을 소비한다.

## 6. `commerce-api` 계약

`commerce-api`는 mentor-owned OCI image이며 학생의 구현·평가 대상이 아니다.

### 제공 방식

- mutable tag가 아닌 `repo@sha256:...`로 고정한다.
- 학생의 production Compose에 별도 service로 포함한다.
- web/admin은 내부 Docker DNS 이름으로 접근한다.
- public ingress는 제공하지 않는다.
- web/admin이 서로의 public/internal URL을 data source로 사용하지 못하게 grader가 검사한다.

### 필수 endpoint

| 목적 | 접근 범위 |
| --- | --- |
| readiness | 내부 network |
| 주문 조회/상태 변경 | web/admin server에서만 |
| seed reset | 내부 network + grader credential |
| version | 내부 network |

### 재현성

- starter tag는 정확한 image digest와 data contract version을 기록한다.
- seed reset은 동일한 customer/order sentinel을 만든다.
- grader는 각 run 전에 readiness → version → reset 순서로 확인한다.
- API image, registry, VM network 장애는 학생 실패로 판정하지 않는다. 인프라 상태를 복구한 뒤 동일 commit으로 재실행한다.

## 7. boundary fixture

학생의 package 이름과 개수는 자유지만 아래 계약은 결정적으로 검사한다.

### 반드시 실패해야 하는 fixture

- `apps/web`에서 `apps/admin` source import
- `apps/admin`에서 `apps/web` Route Handler 호출
- package에서 app source import
- package의 `src/*` deep import
- manifest에 없는 workspace dependency
- circular dependency
- TypeScript alias를 통한 경계 우회
- `file:` dependency를 통한 경계 우회
- re-export package를 통한 app 내부 노출

### 반드시 통과해야 하는 fixture

- app에서 package `exports` allowlist 사용
- package가 manifest에 선언한 다른 package Public API 사용
- 외부 npm dependency 사용
- app 내부에서의 정상 상대 import
- type-only Public API import

## 8. affected와 cache fixture

### 변경 시나리오

- web source only
- admin source only
- web-only package
- admin-only package
- shared package
- root toolchain/global policy
- lockfile with web-only pruned graph change
- documentation only

### fallback 시나리오

- shallow checkout
- 존재하지 않는 base SHA
- Turbo/query command error

### cache 계약

- Basic은 GitHub Actions cache로 `.turbo`를 run 사이에 보존한다.
- fork PR은 trusted cache를 읽을 수 있지만 cache write와 deploy credential을 받지 않는다.
- main과 신뢰된 내부 PR만 cache write를 수행한다.
- fixture는 첫 run miss, 두 번째 run hit, 입력 변경 miss를 재현한다.
- build output을 지운 뒤 cache hit으로 복원하고 후속 smoke가 성공해야 한다.
- hit 로그만 있고 output이 복원되지 않으면 실패다.

## 9. image와 provenance 계약

### image 검사

- web/admin은 별도 image로 build된다.
- final stage는 non-root user로 production server만 실행한다.
- dev dependency와 다른 app 전체 source를 포함하지 않는다.
- 필요한 workspace runtime package와 static asset을 포함한다.
- bind mount나 repository root `node_modules` 없이 실행한다.
- `output: "standalone"`을 사용한다면 monorepo output tracing 누락을 final Linux image에서 잡는다.

### provenance

- image label: app name, OCI revision(commit SHA), build source
- CI artifact: commit SHA, build run ID, immutable registry digest
- deployment record: app, environment, digest, deployedAt, plan base/head
- running container inspect 결과가 deployment record의 digest를 사용해야 한다.

image digest는 manifest push 후 계산되는 값이다. image 내부 파일에 자신의 digest를 미리 기록하도록 요구하지 않는다.

## 10. 환경변수와 secret 계약

| 종류 | 시점 | 요구사항 |
| --- | --- | --- |
| `NEXT_PUBLIC_*` | build | 해당 앱 build input이며 변경 시 그 앱 image를 다시 만든다 |
| server runtime env | container start | image 재빌드 없이 앱별 schema로 검증한다 |
| secret | container start | secret file/store로 주입하고 image layer·build arg·cache에 남기지 않는다 |
| toolchain env | CI task | 실제 필요한 task의 global input에만 둔다 |

fixture는 web 전용 public env 변경이 admin cache를 깨지 않는지, global toolchain env 변경은 두 앱의 관련 task를 무효화하는지 확인한다.

## 11. session과 동일 인스턴스 격리 계약

### app binding

- web/admin은 서로 다른 cookie name과 signing secret을 사용한다.
- cookie는 host-only가 기본이다.
- session에는 `role`과 `aud`가 있으며 verifier는 두 값을 현재 앱 기대값과 비교한다.

| session | web | admin |
| --- | --- | --- |
| customer + `aud=web` | 허용 | 거부 |
| admin + `aud=admin` | 거부 | 허용 |
| customer + 잘못된 `aud=admin` | 거부 | 거부 |
| admin + 잘못된 `aud=web` | 거부 | 거부 |
| 없음 | 공개 경로만 | 로그인 외 거부 |

한 ingress에서 발급받은 cookie를 다른 ingress에 직접 재전송해도 거부되어야 한다. 또한 web에는 role이 customer로 맞지만 `aud=admin`인 session을, admin에는 role이 admin으로 맞지만 `aud=web`인 session을 보내 role과 audience 검증을 독립적으로 시험한다. 마지막으로 role과 audience는 맞지만 반대 앱의 signing key로 서명한 cookie를 app별 cookie 이름으로 바꿔 보내, signing secret 분리만 독립적으로 시험한다.

내부 session fixture의 request body는 `{ "account": "customer-a", "signingApp": "web", "audience": "admin" }` shape을 사용한다. `account`가 role을 결정하며 `signingApp`과 `audience`를 분리해 잘못된 audience만 독립적으로 만들 수 있어야 한다. viewer 응답은 최소한 `{ "viewer": { "alias": "customer-a", "role": "customer" } }`를 포함한다.

### 결정적 race harness

- grader는 public proxy가 아닌 내부 Docker network의 특정 container를 호출한다.
- container boot마다 opaque instance ID를 만들고 모든 test response에 같은 header로 노출한다.
- 각 요청에는 correlation ID를 붙인다.
- customer A/B, admin A/B는 서로 다른 viewer sentinel을 가진다.
- barrier/latch가 요청 A의 identity read 이후 응답 전 지점에서 멈춘다.
- mentor service가 barrier prepare·arrival·inspect 상태를 소유한다. 학생 app에는 arrival 전용 token만 주고, grader는 별도 관리 token으로 서로 다른 두 request ID가 실제 도착했는지 확인한다.
- 요청 B가 같은 지점을 지난 뒤 A/B를 해제해 module-level mutable identity가 있으면 결정적으로 실패하게 한다.
- 같은 barrier header를 보낸 두 응답은 실제로 통과한 barrier ID를 같은 response header에 echo한다.
- unsafe mutation은 반드시 실패하고 수정본은 반드시 통과해야 한다.

viewer 누출은 `/me` DTO와 권한 결과로만 판정한다. 운영자가 합법적으로 보는 주문의 customer ID를 다른 viewer 누출로 세지 않는다.

### client analytics 격리

- 두 개의 독립 browser context를 사용한다.
- context별 sentinel identity와 event를 mentor test sink에 기록한다.
- login, logout, role 전환 뒤 다른 context의 identity가 붙지 않는지 확인한다.
- server response만 보고 browser module state 격리를 추정하지 않는다.

### test hook 보안

- barrier, reset, analytics inspection endpoint는 내부 Docker network와 grader credential에서만 동작한다.
- 학생 app hook credential과 mentor service reset·inspection credential은 서로 다른 secret이다. mentor service 관리 token을 학생 container에 주입하지 않는다.
- production mode에서는 기본 비활성이다.
- public ingress의 해당 path는 404 또는 명시적 거부를 반환한다.
- public URL smoke test가 이 조건을 반드시 확인한다.

app-to-app runtime HTTP 금지는 source scanner만으로 끝내지 않는다. production Compose에서 web/admin은 서로 겹치지 않는 `internal: true` network에 두고, mentor-owned commerce/analytics service만 각 app network에 연결한다. app의 host network와 `host-gateway` 우회를 금지하며 `docker compose config --format json` 결과를 network-policy grader로 검사한다.

## 12. 공통 Linux VM 계약

멘토가 제공할 것:

- 학생 또는 팀별 Linux VM
- OCI registry namespace
- web/admin ingress와 TLS
- 최소 권한 registry/deploy credential
- 내부 grader network
- blue/green slot과 임시 port probe를 가진 deploy script 골격
- VM resource limit과 동시 container 제한
- 실패 시 VM 초기화 절차

학생이 구현할 것:

- app별 Dockerfile 또는 명시적 app target
- production Compose
- plan에 선택된 앱만 새 slot에 올리는 배포 연결
- readiness 성공 뒤 proxy target 전환
- immutable digest 배포
- 이전 digest 보존과 rollback
- 배포 record와 smoke test

Basic은 readiness-gated replacement와 rollback까지 요구하지만 짧은 연결 중단을 허용한다. connection drain, in-flight request 보존, compatibility window까지 증명하지 않았다면 zero-downtime라고 부르지 않는다.

## 13. 공개 전 go/no-go

아래 항목을 **깨끗한 학생 계정과 실제 VM**에서 하나의 release candidate tag로 끝까지 통과해야 과제를 공개한다.

- [ ] starter tag에서 web baseline E2E가 통과한다.
- [ ] admin 주문 read + 상태 변경 골격이 재현된다.
- [ ] pinned `commerce-api`가 기동되고 version/readiness/reset이 동작한다.
- [ ] `dlc.manifest.json` example과 invalid fixtures가 schema 검증을 통과/실패한다.
- [ ] `deployment-plan.json`의 변경·fallback fixture가 기대 앱 집합을 만든다.
- [ ] boundary 위반/정상 fixture가 각각 실패/통과한다.
- [ ] Actions cache miss → hit → input-change miss와 output 복원이 재현된다.
- [ ] web/admin image가 clean Linux build에서 생성되고 root source 없이 기동한다.
- [ ] 두 image를 registry에 push하고 immutable digest로 배포한다.
- [ ] web-only/admin-only/shared 변경이 plan에 맞게 독립 배포된다.
- [ ] readiness 실패 시 이전 digest가 유지된다.
- [ ] 이전 digest rollback이 실제 URL에서 확인된다.
- [ ] unsafe request-state mutation은 결정적으로 실패하고 수정본은 통과한다.
- [ ] session audience/cookie replay matrix가 기대 결과와 일치한다.
- [ ] client analytics browser-context 격리가 통과한다.
- [ ] public ingress에서 barrier/reset/inspection hook에 접근할 수 없다.
- [ ] web/admin 실제 URL smoke test와 provenance 확인이 통과한다.

한 항목이라도 실패하면 학생 과제를 공개하지 않는다. 인프라나 grader 장애를 학생 구현 결함과 구분할 수 있도록 각 단계는 구조화된 결과와 실패 원인을 남긴다.
