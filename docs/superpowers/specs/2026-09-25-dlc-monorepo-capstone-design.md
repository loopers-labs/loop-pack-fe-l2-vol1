# DLC — 확장 가능한 프론트엔드 모노레포 캡스톤 설계

- 작성일: 2026-09-25
- 상태: 사용자 방향 승인, 과제 본문 작성 전 설계 고정
- 기준점: 10주차 과제 추가 커밋 `6e7bebe0`
- 기간: 2주

## 1. 한 문장 목표

10주 커리큘럼의 기준 구현을 담은 공식 DLC starter를 고객용 `web`과 운영자용 `admin`으로 확장 가능한 모노레포로 전환하고, 패키지 경계·변경 영향 범위·캐시·독립 배포·요청별 사용자 격리를 코드와 실행 증거로 방어한다.

## 2. 문제 정의

이 과제는 “Turborepo를 설치하고 `apps/`, `packages/` 폴더를 만든다”를 목표로 하지 않는다. 앱이 N개로 늘어날 때 다음 문제가 동시에 커진다는 사실을 다룬다.

1. 앱이 다른 앱의 내부 코드를 직접 참조하면서 독립 변경과 배포가 무너진다.
2. auth, analytics, API client 같은 공통 관심사가 앱마다 복제되어 정책이 파편화된다.
3. 반대로 재사용 가능성이 확인되지 않은 코드까지 거대한 `shared`로 올려 앱들이 함께 바뀐다.
4. 모든 변경에서 모든 앱을 검증·빌드·배포해 CI 시간과 비용이 앱 수에 비례해 증가한다.
5. 로컬 workspace에서는 동작하지만 최종 이미지에 내부 패키지나 runtime 파일이 빠지는 패키징 오류가 생긴다.
6. 장기 실행되는 Next.js 서버가 여러 요청을 처리할 때 사용자 상태를 전역으로 보관하거나 잘못 캐시해 다른 사용자의 정보가 섞일 수 있다.

학생은 이 문제를 폴더 정리, 도구 설정, 배포 설정으로 따로 풀지 않는다. 아래 인과관계를 한 번에 증명한다.

> 멀티 앱 요구가 생겼다 → 변경 이유에 따라 패키지 경계를 긋는다 → 의존 그래프를 기계로 보호한다 → 변경 영향 범위만 검증한다 → 앱별 산출물을 독립 배포한다 → 배포된 동일 인스턴스에서 요청 격리를 검증한다.

## 3. 검토한 접근과 선택

### 접근 A — 도구 우선 전환

루트에 Turborepo를 설치하고 기존 앱을 `apps/web`으로 옮긴 뒤 공통 설정 패키지를 만든다.

- 장점: 구현량이 작고 진입이 쉽다.
- 단점: 왜 패키지를 나눴는지, 어떤 변경이 어떤 앱에 영향을 주는지, 배포 경계가 실제로 독립적인지 확인하기 어렵다.
- 판단: 과제의 도입 단계로는 사용하지만 중심 접근으로 채택하지 않는다.

### 접근 B — 경계에서 배포까지 잇는 두 개의 수직 슬라이스

1주차에는 `web + admin`과 package dependency graph를 만들고, 2주차에는 같은 그래프를 CI·Docker·배포·보안 검증에 사용한다.

- 장점: 코드 경계와 작업/배포 경계가 같은 근거에서 출발한다. 기존 6주차 FSD, 7주차 측정, 8주차 자가검증, 9주차 E2E, 10주차 CI를 모두 회수할 수 있다.
- 단점: 설계 문서와 검증 하네스가 없으면 학생별 결과를 비교하기 어렵다.
- 판단: **채택한다.** starter와 평가 fixture로 비교 가능성을 보완한다.

### 접근 C — N개 실제 앱을 제공하는 플랫폼 시뮬레이션

5개 이상의 빈 앱과 다수의 패키지를 제공하고 대규모 task graph를 최적화한다.

- 장점: 규모 문제를 눈으로 확인하기 쉽다.
- 단점: 복제 코드와 설정 작업이 학습 시간을 잡아먹고, 실제 경계 판단보다 정해진 구조 맞추기가 된다.
- 판단: 실제 앱은 `web`, `admin` 두 개만 둔다. N개 확장은 변경 시나리오 표와 graph fixture로 검증한다.

## 4. 핵심 설계 원칙

### 4.1 앱은 조립점이지 라이브러리가 아니다

의존 방향의 최소 불변식은 다음과 같다.

```text
apps/*     -> packages/*      허용
apps/web   -> apps/admin      금지
apps/admin -> apps/web        금지
packages/* -> apps/*          금지
consumer   -> package/src/*   금지
consumer   -> package public API  허용
```

같은 계층의 package 간 의존을 전부 금지하지는 않는다. 필요한 의존은 각 package manifest에 명시하고 `package.json#exports` allowlist로 공개한 API를 통해서만 사용한다. `index.ts` 관례만으로 Public API를 선언한 것으로 보지 않는다. 순환 의존, 선언되지 않은 의존, TypeScript alias·`file:` protocol·re-export를 통한 우회는 실패시킨다.

### 4.2 “코드 모양이 같다”는 공통화 근거가 아니다

학생은 공유 후보마다 아래를 설명한다.

- 두 앱에서 같은 이유로 함께 변경되는가?
- 누가 소비하며 누가 소유하는가?
- 외부에 공개할 최소 API는 무엇인가?
- 앱 내부 폴더로 남겼을 때 생기는 실제 비용은 무엇인가?
- package가 되었을 때 생기는 버전·빌드·테스트·탐색 비용보다 이점이 큰가?

두 앱에서 두 번 나타났다는 이유만으로 package로 올리지 않는다. 반대로 보안·계측 정책처럼 한 곳에서 일관되게 바뀌어야 하는 책임은 UI 모양이 달라도 공통 package 후보가 된다.

### 4.3 공통 관심사는 상태가 아니라 계약과 정책을 공유한다

필수 공유 후보는 auth와 analytics다. 정확한 package 개수와 이름은 정답으로 주지 않는다.

**auth에서 공유할 수 있는 것**

- session claim, role, app audience의 타입 및 검증
- 인증 실패/권한 부족 오류 계약
- cookie/session 보안 기본값
- 요청으로부터 identity를 검증하는 stateless 함수

**각 앱에 남겨야 하는 것**

- 로그인 화면과 이동 경로
- 앱별 허용 role과 권한 조립
- 앱의 DAL 및 DTO
- 현재 요청의 cookie와 현재 사용자 값

auth package는 `currentUser`, session object, mutable singleton을 보관하지 않는다.
Basic에서는 앱별 cookie 이름과 signing secret을 분리하고 session의 app audience도 검증한다. 공통 verifier는 secret과 기대 audience를 앱 조립점에서 주입받는다. customer용 session을 admin에 재사용하거나, 두 앱의 cookie 이름·domain·path가 의도치 않게 충돌하는 상태는 공통화 성공으로 보지 않는다.

**analytics에서 공유할 수 있는 것**

- event envelope과 공통 필드 계약
- transport interface와 실패 정책
- consent/redaction 정책

**각 앱에 남겨야 하는 것**

- 어떤 사용자 행동에서 이벤트를 발생시키는가
- 앱·화면별 event schema
- 현재 요청/세션의 user context 조립

server에서 실행되는 analytics adapter는 요청 identity를 process-wide module scope에 저장하지 않는다. client SDK는 browser context 안의 identity를 유지할 수 있지만 `identify`/`reset` lifecycle을 명시하고 로그인·로그아웃·계정 전환과 독립 browser-context 시험으로 격리를 증명한다.

### 4.4 구조 그래프와 작업 그래프를 연결한다

Turborepo는 package manifest에 선언된 실제 의존 그래프와 `turbo.json`의 task graph를 사용한다. 학생은 단순 path filter만으로 affected 대상을 추측하지 않는다.

- PR checkout에는 base와 head를 비교할 충분한 Git history가 있어야 한다.
- Basic의 표준은 package 단위 `turbo run ... --affected`로 고정한다. task 단위 affected 실험은 공식 query 또는 명시적인 future flag를 쓸 때만 Advanced에서 허용한다.
- `--filter`, `--dry` 또는 run summary로 대상과 이유를 출력한다.
- task의 `inputs`, `outputs`, 환경변수를 실제 소비 범위에 맞게 선언한다.
- global input을 과도하게 잡아 모든 앱의 cache miss를 유발하지 않는다.
- 캐시 hit은 로그가 아니라 필요한 output이 복원되어 후속 작업이 성공하는 것으로 확인한다.
- shallow history, 삭제된 base, query 오류처럼 graph 계산이 불완전하면 전체 검증으로 넘어가는 fail-safe를 둔다. starter가 세 경우의 fixture를 제공한다.

### 4.5 Docker는 최종 runtime 경계를 검증한다

로컬 workspace는 루트 `node_modules`, 소스, 환경변수를 우연히 참조해도 동작할 수 있다. Docker 이미지는 앱 하나가 운영에서 필요한 파일만으로 실행되는지를 확인하는 최종 검증 경계다.

- `web`과 `admin`은 서로 다른 OCI image와 image digest를 가진다.
- production runtime에는 monorepo 전체 소스나 다른 앱 전체를 복사하지 않는다.
- Next.js standalone output 또는 동등한 최소 runtime 산출물을 사용한다.
- monorepo 외부 workspace 의존이 output tracing에서 누락되지 않았는지 **최종 Linux 이미지 안에서** 확인한다.
- dependency metadata와 source 복사를 분리하고, 필요하면 `turbo prune --docker`로 app별 lockfile과 workspace 범위를 줄인다.
- 개발 서버와 bind mount는 production 검증으로 인정하지 않는다.

### 4.6 컨테이너 격리와 요청 격리는 다른 증명이다

`web`과 `admin`을 다른 컨테이너로 띄웠다는 사실은 사용자 A와 B가 같은 Next.js 인스턴스를 안전하게 공유한다는 증거가 아니다.

보안 불변식은 다음과 같다.

> 같은 Next.js 서버 인스턴스가 여러 요청을 처리해도 사용자 A의 세션, role, 식별자, 조회 결과가 사용자 B의 요청에서 관찰되어서는 안 된다. client analytics identity는 별도의 browser-context 격리 시험으로 확인한다.

이를 위해 학생은:

- session을 매 요청의 cookie/header에서 읽고 검증한다.
- session의 role과 app audience가 현재 앱의 기대값과 일치하는지 검증한다.
- module-level mutable user/session 값을 두지 않는다.
- UI 가드와 별개로 DAL, Route Handler, Server Action에서 권한을 검증한다.
- customer session으로 admin의 데이터와 mutation에 접근하지 못하게 한다.
- user-specific 결과를 모든 사용자에게 공유되는 cache에 넣지 않는다.
- DTO로 현재 viewer가 볼 수 있는 필드만 반환한다.
- auth/analytics package가 요청 identity를 process lifetime까지 보관하지 않게 한다.

## 5. 과제 시나리오

### 5.0 동일한 공식 DLC starter

모든 학생은 멘토가 배포한 동일한 starter tag에서 시작한다. 학생별 10주 결과물은 구조와 동작 표면이 달라 자동 검증과 작업량을 비교하기 어려우므로 DLC의 직접 입력으로 사용하지 않는다.

공식 starter는 10주 커리큘럼의 기준 구현을 바탕으로 다음을 고정한다.

- web 핵심 사용자 경로와 E2E 계약
- customer/admin test account alias와 role/session fixture
- admin 주문 read + 상태 변경 API와 UI 골격
- web과 admin이 함께 소비하는 멘토 제공 `commerce-api` 컨테이너
- 경계, graph, image, request isolation 검증 하네스
- 학생 제출 구조를 읽기 위한 `dlc.manifest.json` schema

`commerce-api`는 digest로 고정한 mentor-owned image로 학생의 Compose에 포함하지만 학생 평가 대상에서는 제외한다. 고정된 내부 API URL, readiness route, seed reset command를 starter가 제공한다. reset은 내부 Docker network와 grader credential에서만 실행할 수 있다. API image/version 또는 멘토 인프라 장애는 학생 실패로 판정하지 않고 해당 평가를 재실행한다.

이 서비스는 공유 데이터 경로일 뿐 학생이 package로 추출하거나 확장할 대상이 아니다. web과 admin은 이를 각자의 data-access 경계에서 소비하며 서로의 Route Handler나 앱 URL을 호출하지 않는다. app-to-app 금지는 source import와 runtime HTTP 호출 모두에 적용한다.

`dlc.manifest.json`에는 자유로운 package tree를 유지하면서 grader가 실행 계약을 찾을 수 있도록 다음을 선언한다.

- web/admin workspace package name
- Dockerfile 또는 build target
- health와 readiness route
- 배포 ingress
- customer/admin test account alias
- viewer 전용 DTO route
- client analytics test sink route

### 5.1 고객 앱 `web`

공식 starter에 고정된 커머스 앱의 사용자 흐름을 보존한다.

- 상품 탐색
- 장바구니와 주문
- 고객 로그인과 마이페이지
- 고객 행동 analytics

### 5.2 운영자 앱 `admin`

경계와 role 차이를 드러낼 최소 기능만 요구한다. 멘토가 API, data fixture, UI 골격을 제공하고 학생은 앱 경계와 요청별 인증·권한 조립을 완성한다.

- 운영자 로그인
- 주문 목록 read와 주문 상태 변경 1종
- 운영 행동 analytics 1종 이상
- customer session의 접근 거부

관리 화면의 시각적 완성도나 CRUD 개수는 평가 중심이 아니다. 공유 계약, 앱별 조립, 권한 검증, 독립 배포를 보여주는 최소 표면만 만든다.

### 5.3 starter가 의도적으로 만드는 유혹

starter에는 다음 상황을 제공한다.

- `web`에 이미 있는 Order 타입과 표시 컴포넌트를 `admin`에서 재사용하고 싶은 상황
- web auth와 analytics가 앱 내부 구현에 결합된 상태
- customer와 admin role fixture
- 두 요청을 특정 지점에서 겹치게 하는 barrier/latch와 unsafe auth mutation fixture
- 변경 영향 범위를 확인할 수 있는 package/task graph fixture

학생은 `admin`에서 `web` 내부를 import하지 않고 필요한 책임을 package Public API로 승격하거나 앱에 따로 남긴다.

## 6. 2주 진행 구조

### 6.1 DLC 1주차 — 코드 경계와 의존 그래프

#### 0단계 — 단일 앱 기준선 고정

- 기준 commit SHA와 Node/pnpm 버전을 기록한다.
- 기존 `pnpm check`, production build, 핵심 E2E를 실행한다.
- 고객 로그인, 상품 탐색, 주문 흐름의 동작 증거를 남긴다.
- 전환 중 보존할 동작과 의도적으로 바꿀 동작을 구분한다.

#### 1단계 — RFC를 구현보다 먼저 작성

`docs/rfc/dlc-monorepo-boundaries.md`에 다음을 작성하고 먼저 커밋한다.

- 현재 책임 지도
- 목표 dependency graph
- package 후보별 소비자·소유자·변경 이유·Public API
- 앱에 남길 책임
- auth/analytics의 공통 정책과 앱별 조립 경계
- 애매한 대상 최소 5개의 결정표
- 금지 의존과 기계적 검사 방법

필수 애매한 대상에는 Order 계약, Order UI, session/role, analytics transport, API client를 포함한다.

#### 2단계 — workspace와 `web` 전환

- pnpm workspace와 Turborepo task graph를 설정한다.
- 기존 단일 앱을 `apps/web`으로 이동한다.
- 이동 전후 기능과 검증 결과를 비교한다.
- root script는 task graph의 entry point가 되고 앱 내부 script를 복제하지 않는다.

#### 3단계 — `admin` 추가

- 운영자 전용 최소 기능을 구현한다.
- `admin`은 `web` 내부 경로를 import하지 않는다.
- 두 앱의 role, route, environment, analytics namespace 차이를 보여준다.

#### 4단계 — package 경계 추출

- 학생의 RFC 근거에 따라 공유 책임을 package로 추출한다.
- package root의 명시적 Public API만 소비한다.
- auth와 analytics는 계약/정책을 공유하되 현재 사용자 상태를 보관하지 않는다.
- 공유 가치가 없는 중복 하나는 의도적으로 앱에 남기고 그 이유를 적는다.

#### 5단계 — 경계를 결정적 게이트로 승격

아래 위반을 정적 검사나 graph 검사로 실패시킨다.

- app-to-app import
- package-to-app import
- package internal deep import
- undeclared workspace dependency
- circular dependency

각 규칙은 위반 fixture가 실패하고 정상 fixture가 통과하는 것을 모두 증명한다.

#### 1주차 완료조건

- 기존 web 기능이 보존된다.
- admin 최소 흐름이 동작한다.
- 앱 간 직접 참조가 없다.
- package Public API와 manifest가 실제 의존 그래프를 설명한다.
- auth/analytics 공통화가 상태 누출이나 거대한 shared package를 만들지 않는다.
- RFC의 목표 그래프와 실제 그래프가 일치한다.

### 6.2 DLC 2주차 — 작업 그래프, Docker, 배포, 격리

#### 0단계 — CI Before와 변경 시나리오 고정

모든 앱을 매번 검증하는 기준선의 cold/warm 시간을 각각 3회 측정한다. 다음 변경별 예상 영향 범위를 실행 전에 작성한다.

| 변경 | 반드시 검증할 대상 | 배포 대상 |
| --- | --- | --- |
| `apps/web` 내부 변경 | web | web |
| `apps/admin` 내부 변경 | admin | admin |
| web 전용 package 변경 | package + web | web |
| admin 전용 package 변경 | package + admin | admin |
| 양쪽이 소비하는 package 변경 | package + web + admin | web + admin |
| root toolchain/global policy 변경 | 전체 | 전체 |
| lockfile 변경 | 전체 install 검증 + app별 pruned lockfile 영향 확인 | graph가 신뢰되면 runtime graph가 바뀐 앱. 계산 불가 시 image build까지만 전체, 자동 배포 중단 |
| 문서만 변경 | 문서 게이트 | 없음 |

#### 1단계 — affected CI와 cache 검증

- GitHub Actions에서 package dependency graph 기준 affected task를 실행한다.
- 첫 job이 `deployment-plan.json`을 생성하고 이후 검증·image build·registry push·deploy job은 이 파일만을 공통 입력으로 사용한다.
- plan에는 base/head SHA, affected package와 이유, 검증 대상, image build/push/deploy 대상 앱, fail-safe 적용 여부를 담는다.
- lint, typecheck, unit, build, E2E의 비용과 실패 반경에 맞게 task를 배치한다.
- web/admin build는 독립 runner에서 병렬 실행할 수 있게 한다.
- full check를 생략하는 PR에도 항상 보고되는 required guard를 둔다.
- graph 계산 실패와 base history 부족은 전체 검증으로 fail-safe 한다.
- dry-run 또는 run summary를 job summary에 남긴다.
- GitHub-hosted runner 사이에서도 warm run을 재현할 수 있도록 Actions cache에 `.turbo`를 저장하는 구성을 Basic으로 제공한다. self-hosted 또는 remote cache는 대안이지만 유료 provider를 강제하지 않는다.
- fork PR은 신뢰된 branch의 cache를 읽을 수만 있고 cache를 쓰거나 배포 credential을 받을 수 없게 한다. main과 신뢰된 내부 PR만 cache write와 deploy를 수행한다.

자가 검증:

1. 위 표의 각 변경을 fixture commit 또는 test matrix로 재현한다.
2. 빠져야 할 앱이 빠지는지 확인한다.
3. 들어와야 할 consumer를 일부러 제외하면 gate가 실패하는지 확인한다.
4. cache key 입력을 바꿔 miss를 만들고 다시 실행해 hit과 output 복원을 확인한다.
5. shallow checkout, 없는 base, graph command 오류에서 전체 검증 fallback을 확인한다.
6. Before와 같은 조건으로 After cold/warm을 3회 측정한다.

#### 2단계 — 앱별 production image

- app별 multi-stage Docker build를 만든다.
- 최종 이미지는 non-root user로 production server만 실행한다.
- health endpoint와 container health check를 둔다.
- image 안에서 web/admin smoke test를 각각 실행한다.
- 다른 앱의 전체 source가 image에 들어가지 않았음을 검사한다.
- runtime에 필요한 workspace package와 static asset이 실제로 포함됐음을 검사한다.
- OCI label에는 app name과 commit revision을 기록한다.
- 외부 provenance/deployment manifest에는 registry의 immutable `repo@sha256:...`, commit SHA, build run ID를 연결한다. image가 자신의 digest를 내부에 가진다고 가정하지 않는다.

환경 입력은 다음처럼 구분한다.

| 종류 | 주입 시점 | cache/hash 규칙 |
| --- | --- | --- |
| `NEXT_PUBLIC_*` | image build | 해당 앱 build input. 값이 바뀌면 그 앱 image를 다시 만든다 |
| server runtime env | container start | image를 다시 만들지 않되 앱별 runtime 계약으로 검증한다 |
| secret | container start의 secret store/file | image layer, build arg, Turbo cache에 남기지 않는다 |
| 공통 toolchain env | CI task 실행 | 필요한 task의 global input으로만 선언한다 |

web 전용 public env 변경이 admin cache까지 깨지지 않고, global toolchain env 변경은 필요한 전체 task를 무효화하는 fixture를 제공한다.

#### 3단계 — 공통 Linux VM에 실제 배포

멘토는 학생 또는 팀별 Linux VM, image registry 접근, 두 앱의 ingress 계약, blue/green slot과 임시 port probe를 가진 deploy script 골격을 제공한다. DNS/TLS와 계정 발급은 학습 범위 밖의 공통 인프라로 제공한다.

학생은 다음을 소유한다.

- app별 Dockerfile
- production `compose.yml`
- reverse proxy 또는 제공된 ingress와 연결되는 route 설정
- secret/runtime environment 주입
- 새 container의 health 확인 후 배포 성공 판정
- `deployment-plan.json`에 선택된 앱만 새 slot에 올리고 health가 통과한 뒤 proxy target을 전환
- web/admin 독립 재배포 명령
- 이전 digest로 되돌리는 rollback 절차

배포 완료는 URL이 열린다는 사실만으로 판정하지 않는다.

- web 변경 배포에서 admin container/digest가 바뀌지 않는다.
- admin 변경 배포에서 web container/digest가 바뀌지 않는다.
- shared package 변경에서는 두 consumer가 새 digest로 배포된다.
- health check 실패 시 배포를 실패로 판정하고 이전 digest를 유지하거나 즉시 복구한다.
- `deployment-plan.json`의 commit SHA와 provenance의 revision label이 같고, running container가 plan에 기록된 immutable digest를 사용한다.

Basic은 readiness 확인과 이전 version 보존·복구까지만 요구하며 짧은 연결 중단을 허용한다. 이를 무중단 배포라고 표현하지 않는다. 무중단을 주장하려면 이전 version drain, in-flight request 처리, compatibility window, rollback 중 연속 요청 증거가 추가로 필요하며 이는 Advanced 범위다.

#### 4단계 — 동일 인스턴스 요청 격리 공격 테스트

grader는 내부 Docker network에서 reverse proxy를 우회해 특정 web/admin container의 고정 주소를 호출한다. 각 container가 boot할 때 생성한 opaque instance ID와 request correlation ID를 response header에 남겨 모든 시험 요청이 같은 process를 통과했음을 확인한다.

두 요청을 특정 지점에서 멈추고 겹치게 하는 mentor-provided barrier/latch를 사용한다. barrier는 grader credential과 내부 network에서만 활성화되고 production mode의 public ingress에서는 접근할 수 없어야 한다. 최종 smoke test가 공개 URL의 test hook 접근 실패를 확인한다. 단순히 요청을 수십 회 반복해 우연히 race가 발생하기를 기다리는 방식은 인정하지 않는다. 사용자별 sentinel 값은 viewer 전용 `/me` DTO와 권한 판정 결과에서만 비교한다. 운영자가 합법적으로 조회하는 주문 데이터 안의 customer ID를 누출로 오판하지 않는다.

필수 session matrix는 다음과 같다.

| session | web | admin |
| --- | --- | --- |
| customer + `aud=web` | 허용 | 거부 |
| admin + `aud=admin` | 거부 | 허용 |
| customer + 잘못된 `aud=admin` | 거부 | 거부 |
| admin + 잘못된 `aud=web` | 거부 | 거부 |
| session 없음 | 공개 경로만 허용 | 로그인 외 거부 |

두 개 이상의 독립 cookie jar와 browser context를 사용한다.

- 고객 A와 고객 B를 같은 web instance에 동시 요청한다.
- 운영자 A와 운영자 B를 같은 admin instance에 동시 요청한다.
- customer session으로 admin read/mutation을 호출한다.
- web audience session을 admin에, admin audience session을 web에 재사용해 거부되는지 확인한다.
- host-only 또는 앱별 이름의 cookie를 사용하고, 한 ingress에서 얻은 cookie를 다른 ingress에 직접 재전송하는 공격도 거부한다.
- 요청 순서를 `A → B → A`, `B → A → B`로 바꾼다.
- barrier가 열린 뒤 ID, 이메일, role, viewer 전용 결과의 교차 노출을 검사한다.

server request 격리와 client analytics 격리는 분리해 평가한다. analytics는 멘토 제공 test sink에 browser context별 sentinel event를 기록하고, customer/admin context를 교차 실행해 다른 context의 current identity가 붙지 않는지 확인한다. server 응답만 보고 client analytics 격리를 추정하지 않는다.

unsafe mutation contract test는 barrier 사이에서 module-level `currentUser`를 덮어써 반드시 실패하고, 수정본에서는 반드시 통과해야 한다. 학생은 실패와 복구 로그를 남기고 mutation을 최종 branch에서 제거한다.

#### 5단계 — After와 운영 증거

- CI cold/warm raw 값·중앙값·범위를 Before와 비교한다.
- 각 변경 시나리오의 예상 graph와 실제 graph를 비교한다.
- cache hit이 줄인 시간과 잘못된 cache가 만들 수 있는 위험을 함께 설명한다.
- 배포 URL, commit SHA, image digest, smoke 결과, 격리 테스트 결과를 제출한다.
- 효과가 없거나 복잡도만 늘린 최적화는 제거하거나 유지 근거를 적는다.

#### 2주차 완료조건

- 영향 없는 앱은 검증·빌드·배포되지 않는다.
- 영향받는 consumer는 누락되지 않는다.
- web/admin 이미지가 독립적으로 실행·배포·rollback 된다.
- workspace runtime 의존이 최종 Linux 이미지에서 검증된다.
- 배포된 동일 Next.js instance에서 요청별 사용자와 role이 격리된다.

## 7. N개 앱 확장을 평가하는 방식

학생에게 N개 앱을 직접 만들게 하지 않는다. 아래 질문과 자동 fixture로 확장성을 평가한다.

- 세 번째 앱 `seller`가 추가되면 어떤 package를 그대로 쓰고 무엇을 새로 만들어야 하는가?
- `seller`가 `admin` UI를 import하려 할 때 어떤 gate가 막는가?
- auth policy package 변경 시 어떤 앱이 affected 되는가?
- analytics transport 변경과 web 이벤트 schema 변경의 영향 범위는 왜 다른가?
- root config package 변경이 모든 앱의 cache를 깨는 것이 의도인가?
- 앱이 20개일 때 CI matrix는 어떻게 만들어지고 최대 동시 실행 수는 어디서 제한하는가?
- affected 계산 실패 시 빠르게 실패할지 전체 검증할지 어떤 기준으로 결정했는가?

starter의 synthetic graph fixture는 실제 제품 앱 코드를 복제하지 않고 package manifest와 task metadata만으로 다수 consumer 상황을 재현한다.

## 8. 평가 체계

총점 100점이다. 자동 검증과 사람 판단을 분리한다.

| 영역 | 점수 | 핵심 증거 |
| --- | ---: | --- |
| 패키지 경계와 Public API | 20 | RFC, dependency graph, 위반/정상 fixture |
| auth·analytics 공통 관심사 | 10 | 공통 정책과 앱별 조립, server identity 무상태, client identify/reset 격리 |
| 멀티 앱 동작 보존 | 10 | web 회귀 + admin 최소 흐름 |
| affected CI와 cache | 20 | 변경 시나리오 matrix, dry-run, hit/miss, Before/After |
| Docker runtime 경계 | 15 | app별 image, image 내부 검증, 최소 runtime |
| 실제 독립 배포 | 10 | URL, SHA/digest, 독립 재배포, rollback |
| 사용자·role 요청 격리 | 15 | 동일 instance 동시 요청, 교차 접근 거부, mutation 증거 |

### 자동으로 판별할 것

- 금지 import와 deep import
- manifest에 없는 dependency
- cycle
- lint/type/test/build 결과
- affected 대상 집합
- image 기동과 health
- 다른 앱 source의 image 포함 여부
- 권한 없는 API/Server Action 응답
- 사용자 식별자 교차 노출

### 사람이 판단할 것

- package 분리 근거가 변경 이유와 맞는가
- 공유하지 않기로 한 결정이 타당한가
- Public API가 소비자 필요보다 과도하지 않은가
- auth/analytics의 공통 정책과 앱별 조립 경계가 설명 가능한가
- CI 시간 절감이 검증 누락으로 만든 숫자가 아닌가
- Docker/배포 복잡도가 얻은 격리와 재현성에 비례하는가

### 통과를 막는 필수 결함

총점과 무관하게 다음은 보완 전 통과시키지 않는다.

- app-to-app 직접 import가 남아 있음
- customer session으로 admin 데이터 또는 mutation 접근 가능
- 동일 instance에서 다른 사용자의 식별자나 결과가 관찰됨
- session audience를 다른 앱 ingress에서 재사용할 수 있음
- 영향받는 consumer를 CI가 누락함
- 검증·image build·deploy가 서로 다른 영향 계산을 사용함
- 최종 image가 실행되지 않거나 workspace runtime dependency가 빠짐
- web/admin 중 한 앱만 실제 배포됨

## 9. 제출물

| 제출물 | 권장 위치 |
| --- | --- |
| 경계 RFC | `docs/rfc/dlc-monorepo-boundaries.md` |
| CI/affected 측정과 시나리오 결과 | `docs/rfc/dlc-ci.md` |
| 배포·rollback runbook | `docs/rfc/dlc-deployment.md` |
| 사용자 격리 threat model과 결과 | `docs/rfc/dlc-request-isolation.md` |
| grader 실행 계약 | `dlc.manifest.json` |
| 영향·검증·배포 단일 계획 | CI artifact `deployment-plan.json` |
| workspace/task graph | `pnpm-workspace.yaml`, `turbo.json`, package manifests |
| 경계 검사 | ESLint/graph 검사 및 fixture tests |
| CI | `.github/workflows/**` |
| app별 image | app별 Dockerfile 또는 명시적 target을 가진 공통 Dockerfile |
| 운영 구성 | `compose.yml`, proxy/ingress 설정 |
| image provenance | registry digest, revision label, build run을 연결한 CI artifact |
| 최종 증거 | PR 본문과 위 문서의 URL, SHA, digest, raw 측정값 |

## 10. starter와 멘토 준비물

### 저장소 starter

- 동일한 10주차 기준 구현에서 만든 공식 DLC commerce app
- `dlc.manifest.json` schema와 예제
- mentor-owned `commerce-api` container와 고정 data contract
- digest로 고정된 API image, 내부 URL, readiness, seed reset command, grader credential contract
- customer/admin 계정과 role fixture
- admin 주문 read + 상태 변경 API/data/UI 골격
- barrier/latch, sentinel, instance/request ID를 포함한 unsafe request-state mutation fixture
- client analytics test sink와 browser-context fixture
- app-to-app/deep import/cycle/alias/`file:`/re-export 우회 fixture
- N-app synthetic dependency graph fixture
- image contents와 same-instance를 검사하는 스크립트 골격
- `deployment-plan.json` schema와 consumer 누락 검증 guard
- shallow history, 없는 base, graph 오류 fallback fixture

### 공통 배포 환경

- 학생 또는 팀별 Linux VM
- OCI registry
- web/admin ingress와 TLS
- 최소 권한 배포 credential
- VM resource limit과 동시 container 수
- blue/green slot, 임시 port health probe, proxy switch를 수행하는 deploy script 골격
- 실패 시 VM 초기화 절차

### 공개 전 go/no-go

멘토는 과제 공개 전에 깨끗한 학생 계정과 실제 VM에서 다음을 끝까지 검증한다.

- starter tag에서 web/admin baseline 실행
- pinned `commerce-api` 기동, readiness, seed reset
- `dlc.manifest.json`과 `deployment-plan.json` schema 검증
- 경계 위반/정상 fixture
- affected와 전체 fallback fixture
- cold/warm cache hit과 output 복원
- app별 image build, push, digest deploy, rollback
- unsafe mutation 실패와 수정본 통과
- public ingress에서 barrier/reset hook 접근 불가
- web/admin 실제 URL smoke test

학생에게는 서버 provisioning, DNS 구매, TLS 인증서 발급을 요구하지 않는다. 학생은 repository에서 재현 가능한 image, compose, routing, health, deploy, rollback을 책임진다.

## 11. AI 활용 경계

AI에 맡겨도 되는 일:

- workspace/Dockerfile/workflow 초안
- graph 출력 해석의 보조
- 문서와 테스트 fixture 초안
- 반복 설정의 기계적 이동

학생이 직접 결정하고 방어할 일:

- package 경계와 Public API
- 공통화하지 않을 책임
- task inputs/outputs와 cache key
- affected 실패 시 fallback
- auth/analytics의 요청 상태 경계
- required check와 배포 조건
- Docker image에 포함될 runtime 범위

AI가 만든 설정은 위반/정상 fixture, cache hit/miss, image 내부 실행, 동일 instance 동시 요청으로 검증한 뒤 채택한다.

## 12. 과제 본문 작성 원칙

- 2주 문서를 분리하되 하나의 캡스톤 목표와 최종 체크리스트로 연결한다.
- Basic 전체가 필수다. remote cache provider 구축, autoscaling, Kubernetes, package publish/versioning은 Advanced로 둔다.
- 특정 package tree를 정답처럼 제공하지 않는다. 금지 방향과 필수 책임만 제공한다.
- 실제 배포 URL과 운영 증거 없이는 완료로 보지 않는다.
- Docker build 성공만으로 패키징 성공이라 하지 않고 최종 Linux image 안에서 실행한다.
- cache hit 메시지만으로 캐시 정확성을 인정하지 않고 output 복원과 후속 task 성공을 확인한다.
- 보안은 UI 숨김으로 평가하지 않고 server entry point와 동시 요청으로 평가한다.

## 13. 범위 밖

- Kubernetes 구축
- production급 autoscaling과 multi-region
- private npm registry와 package publish
- 독립 package versioning 및 Changesets
- 실제 결제·실메일·외부 OAuth provider
- 완전한 admin 제품 구현
- N개 실제 앱 복제
- remote cache SaaS 결제 강제

이 항목들은 핵심 경계와 검증을 완성한 학생에게만 Advanced 선택지로 제공한다.

## 14. 참고 자료

- 토스, [200여개 서비스 모노레포의 파이프라인 최적화](https://toss.tech/article/monorepo-pipeline)
- 토스, [모노리포 희망편, 절망의 리포가 희망의 리포로 부활하기까지 걸린 1년](https://toss.tech/article/52209)
- Next.js, [Authentication](https://nextjs.org/docs/app/guides/authentication)
- Next.js, [Deploying](https://nextjs.org/docs/app/getting-started/deploying)
- Next.js, [Self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- Next.js, [Output file tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- Turborepo, [Running tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- Turborepo, [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- Turborepo, [Docker](https://turborepo.com/docs/guides/tools/docker)

## 15. 설계 승인 후 다음 단계

1. 이 설계를 과제 본문 단위의 구현 계획으로 나눈다.
2. `docs/assignments/dlc-monorepo-week-01.md`와 `dlc-monorepo-week-02.md`를 작성한다.
3. starter·fixture·grader 요구사항을 별도 계획으로 분리한다.
4. 과제 본문과 자동 평가 하네스를 서로 다른 검토자가 검증한다.
