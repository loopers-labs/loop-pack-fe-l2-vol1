# DLC 1주차 — 코드 경계와 의존 그래프: 앱이 늘어나도 서로 기대지 않게 만들어요

> **Phase**: 2주 캡스톤 DLC — 1주차 / 경계 설계와 멀티 앱 전환

> 💡 이번 주 목표는 폴더를 `apps/`, `packages/`로 예쁘게 나누는 게 아니에요. 기존 고객용 `web`의 동작을 보존하면서 운영자용 `admin`을 추가하고, **앱은 다른 앱을 참조하지 않으며 공유할 책임만 명시적인 package Public API로 소비하는 구조**를 만듭니다. 마지막에는 이 약속을 문서가 아니라 위반 fixture를 실제로 막는 결정적 게이트로 증명해요.

## 왜 이 과제를 하는가

단일 앱에서는 같은 저장소 안의 코드를 상대 경로로 가져오는 일이 작아 보여요. 하지만 앱이 N개로 늘어나면 `web`이 `admin` 내부 구현을 가져오고, `seller`가 다시 `admin`을 가져오는 식으로 변경과 배포 경계가 무너집니다. 반대로 중복을 없애겠다는 이유로 모든 코드를 `shared`에 올리면 서로 다른 이유로 바뀌는 앱들이 다시 함께 움직이게 돼요.

이번 주에는 다음 인과관계를 직접 만듭니다.

> 운영자 앱이 필요해졌다 → 두 앱이 같은 이유로 바뀌는 책임을 찾는다 → package 경계와 Public API를 설계한다 → 금지 의존을 기계로 막는다 → 실제 graph가 RFC의 설명과 맞는지 확인한다.

핵심 질문은 “어디로 옮길까?”가 아니라 아래예요.

- 이 코드는 두 앱에서 **같은 이유로 함께 변경되는가?**
- 누가 이 책임을 소유하고, 누가 소비하는가?
- 폴더가 아니라 package가 되어야 얻는 이점은 무엇인가?
- 소비자에게 공개할 최소 API는 무엇인가?
- 이 책임이 바뀌면 어떤 앱을 다시 검증해야 하는가?

## 이번 주 과제

| # | 과제 | 완료 기준 |
| --- | --- | --- |
| 0 | 단일 앱 Before 고정 | 기준 SHA·도구 버전·핵심 사용자 경로와 기존 검증 결과를 남김 |
| 1 | 경계 RFC 선작성 | 구현 전에 목표 graph와 공유/비공유 판단을 커밋함 |
| 2 | workspace와 `web` 전환 | 기존 동작을 보존하고 root script를 Turbo task graph 진입점으로 만듦 |
| 3 | 운영자용 `admin` 추가 | 로그인 → 주문 조회 → 상태 변경의 최소 흐름과 역할 차이를 증명함 |
| 4 | 공유 책임을 package로 추출 | auth·analytics의 계약/정책은 공유하고 요청 상태와 앱 조립은 분리함 |
| 5 | 경계를 결정적 게이트로 승격 | 금지 의존은 실패하고 정상 의존은 통과하는 fixture를 남김 |

## 제공되는 것과 준비 상태

이 저장소에는 starter의 local RC, grader, `commerce-api`, analytics sink, 테스트 계정과 fixture가 들어 있어요. 먼저 root의 `pnpm check`와 [`dlc/mentor-kit/README.md`](../../dlc/mentor-kit/README.md)의 Compose smoke를 통과시켜 기준 상태를 확인하세요. 다만 공식 배포 기준은 멘토가 별도로 공지하는 starter tag와 pinned image digest예요. 작업 브랜치의 최신 상태나 `local` image tag에서 임의로 시작하지 마세요.

과제 공개 시 멘토가 제공할 범위는 다음과 같아요.

- 10주 기준 구현을 바탕으로 한 고객용 commerce app과 고정된 핵심 사용자 경로
- 고객·운영자 계정 alias와 role/session fixture
- 운영자 주문 조회 + 상태 변경 API/data/UI 골격
- `web`과 `admin`이 함께 소비할 mentor-owned `commerce-api` container 계약
- 경계 위반/정상 fixture와 N-app synthetic graph fixture
- 학생이 자유롭게 정한 workspace 이름을 grader가 읽기 위한 `dlc.manifest.json` schema

학생이 직접 결정하고 구현할 범위는 다음과 같아요.

- package의 개수·이름·소유자·Public API
- 어떤 중복을 공유하지 않고 앱에 남길지
- auth·analytics의 공통 계약/정책과 앱별 조립 경계
- 실제 workspace dependency와 Turbo task graph
- 경계 위반을 막는 정적/graph 검사와 그 자가검증

> 💡 `commerce-api`는 두 앱이 공유하는 데이터 경로일 뿐, 학생이 package로 추출하거나 확장할 대상이 아니에요. `web`과 `admin`은 각자의 data-access 경계에서 API를 사용합니다.

## 이번 주의 의존 규칙

```text
apps/*     -> packages/*              허용
apps/web   -> apps/admin              금지
apps/admin -> apps/web                금지
packages/* -> apps/*                  금지
consumer   -> package/src/*           금지
consumer   -> package의 공개된 export  허용
```

같은 계층의 package끼리 의존하는 것까지 전부 금지하지는 않아요. 필요한 의존은 각 `package.json`에 명시하고, 소비자는 `package.json#exports`에 공개된 진입점만 사용합니다. `index.ts` 파일이 있다는 사실만으로 Public API가 정의됐다고 보지 않아요.

또한 **app-to-app 금지는 source import만 뜻하지 않습니다.** 아래 우회도 모두 실패해야 해요.

- `web`이 `admin`의 Route Handler나 URL을 내부 API처럼 호출하는 runtime HTTP 참조
- TypeScript path alias로 다른 앱 내부를 가리키는 참조
- `file:` dependency나 상대 경로로 다른 앱을 package처럼 소비하는 참조
- 중간 package가 다른 앱 코드를 re-export하는 참조

---

## 📝 Implementation Quest

### 📌 0단계 — 단일 앱의 Before를 고정해요

먼저 “옮기고 나서도 무엇이 같아야 하는가”를 고정합니다. 이동 후 빌드가 성공했다는 사실만으로 기능이 보존됐다고 말할 수 없어요.

**요구사항**

- 공식 starter tag와 작업을 시작한 commit SHA를 기록해요.
- `.nvmrc`, `package.json#packageManager`를 확인해 Node.js·pnpm 버전을 기록해요.
- starter에 실제로 존재하는 기본 검증, production build, 핵심 E2E를 실행해 결과와 실행 시간을 남겨요.
- 아래 고객 경로의 Before 증거를 남겨요.
  - 상품 탐색
  - 장바구니와 주문
  - 고객 로그인과 마이페이지
  - 고객 행동 analytics
- 전환 중 **보존할 동작**과 **의도적으로 바꿀 동작**을 구분해 적어요. 의도적 변경은 이유와 검증 방법도 함께 적습니다.

> 💡 아직 공개되지 않은 starter의 script 이름을 추측해 만들지 마세요. 공개된 starter의 `package.json#scripts`와 안내 문서에서 실제 명령을 확인한 뒤 기록합니다.

**완료조건**

기준 tag·SHA·도구 버전, 실제로 실행한 명령과 결과, 네 가지 고객 경로의 보존 기준을 한곳에서 확인할 수 있어야 해요.

---

### 🗺️ 1단계 — 코드를 옮기기 전에 경계 RFC를 먼저 써요

`docs/rfc/dlc-monorepo-boundaries.md`를 작성하고 **구조 변경보다 먼저 커밋**하세요. 구현 뒤에 현재 구조를 설명하는 문서는 설계 근거가 아니라 사후 묘사가 되기 쉬워요.

#### RFC에 반드시 들어갈 것

1. 현재 단일 앱의 책임 지도
2. 목표 dependency graph
3. package 후보별 소비자·소유자·함께 변경되는 이유·최소 Public API
4. package로 올리지 않고 각 앱에 남길 책임과 이유
5. auth·analytics의 공통 정책과 앱별 조립 경계
6. 아래 애매한 대상 5개의 결정표
7. 금지할 의존과 이를 막을 기계적 검사 방법

#### 애매한 대상 결정표

아래 다섯 행은 필수예요. package 이름은 정답으로 주어지지 않으며, “공유/비공유” 중 어느 쪽을 골라도 근거와 실제 graph가 일치하면 됩니다.

| 대상 | 함께 바뀌는 이유 | 소비자·소유자 | package로 분리? | 공개할 최소 API | 앱에 남길 것 | 변경 시 영향 앱 |
| --- | --- | --- | --- | --- | --- | --- |
| Order 계약 | 직접 작성 | 직접 작성 | 결정 | 직접 작성 | 직접 작성 | 직접 작성 |
| Order 표시 UI | 직접 작성 | 직접 작성 | 결정 | 직접 작성 | 직접 작성 | 직접 작성 |
| session / role | 직접 작성 | 직접 작성 | 결정 | 직접 작성 | 직접 작성 | 직접 작성 |
| analytics transport | 직접 작성 | 직접 작성 | 결정 | 직접 작성 | 직접 작성 | 직접 작성 |
| API client | 직접 작성 | 직접 작성 | 결정 | 직접 작성 | 직접 작성 | 직접 작성 |

**필수 판단**

- 코드 모양이 같다는 이유만으로 공통화하지 않아요. **같은 이유로 함께 변경되는지**를 적어요.
- 공유 가치가 없는 중복 하나를 의도적으로 앱에 남기고, 그 선택이 거대한 `shared`보다 나은 이유를 적어요.
- 특정 package tree를 정답으로 맞추지 않아요. 자유롭게 설계하되 금지 방향과 공개 표면은 명확해야 합니다.

> 🤝 **AI 활용** — 현재 import와 책임 후보를 목록화하거나 graph 초안을 그리는 일은 AI에게 맡겨도 좋아요. 하지만 package 경계, 소유자, 공개 API, 공통화하지 않을 책임은 본인이 결정하고 리뷰에서 방어해야 합니다.

**완료조건**

RFC만 읽어도 `web`, `admin`, 각 package 사이의 허용 방향과 금지 방향을 예측할 수 있고, 나중에 실제 manifest graph와 비교할 수 있어야 해요.

---

### 🧱 2단계 — pnpm workspace와 Turbo task graph로 `web`을 옮겨요

이제 기존 단일 앱을 `apps/web`으로 전환합니다. 이 단계의 성공 기준은 “파일을 옮겼다”가 아니라 **Before 동작을 유지하면서 workspace manifest가 실제 의존 관계를 설명하는 상태**예요.

**요구사항**

- pnpm workspace와 Turborepo task graph를 설정해요.
- 기존 고객 앱을 `apps/web`으로 이동해요.
- root script는 lint·typecheck·test·build 같은 **task graph의 진입점**으로 두고, 앱 내부 명령을 루트에 다시 복사해 병렬로 관리하지 않아요.
- 각 workspace는 자신이 실제로 사용하는 내부·외부 dependency를 manifest에 선언해요.
- task 사이의 선후 관계와 산출물이 실제 실행 계약을 표현하게 해요. 2주차에 cache와 affected 범위를 설계할 수 있도록 지금부터 거짓 graph를 만들지 않아요.
- 이동 전후에 0단계의 검증과 고객 경로를 같은 조건으로 다시 확인해요.

**함정(감점 포인트 = 학습 포인트)**

- TypeScript alias만 연결하고 manifest dependency를 빼면 task graph는 소비 관계를 알 수 없어요.
- 루트 script가 모든 workspace 명령을 직접 나열하면 앱이 늘어날 때마다 루트를 고쳐야 해요.
- 이동 중 깨진 경로를 루트 source 복사나 임시 alias로 덮어두면 다음 주 Docker runtime 경계에서 다시 깨져요.

**자가 검증**

- root에서 전체 검증을 실행해요.
- `web` workspace만 대상으로 같은 task를 실행해요.
- dependency graph 또는 Turbo dry-run 결과에서 `web`이 선언된 package만 소비하는지 확인해요.
- 0단계의 고객 경로가 모두 보존되는지 비교해요.

**완료조건**

기존 `web`의 검증과 핵심 사용자 흐름이 보존되고, root 명령과 workspace manifest가 같은 task/dependency graph를 설명해야 해요.

---

### 🧑‍💼 3단계 — 운영자용 `admin`을 독립 앱으로 추가해요

`admin`은 CRUD 개수를 늘리기 위한 앱이 아니에요. 같은 Order 영역을 보더라도 고객 앱과 운영자 앱의 역할·권한·화면 조립이 다르고, **한 앱이 다른 앱의 내부 구현을 가져오지 않아도 독립적으로 완성될 수 있음**을 보여주는 최소 표면입니다.

**필수 흐름**

1. 운영자 계정으로 로그인해요.
2. 주문 목록을 조회해요.
3. 주문 상태 변경 한 종류를 수행해요.
4. 운영 행동 analytics event를 한 종류 이상 발생시켜요.
5. customer session으로 같은 read와 mutation을 시도하면 서버에서 거부해요.

**요구사항**

- `admin`은 `web`의 component, hook, type, Route Handler, URL을 직접 소비하지 않아요.
- 두 앱의 route, 허용 role, 환경 설정, analytics namespace 차이가 코드의 앱별 조립점에서 보여야 해요.
- 운영자 화면의 시각적 완성도나 CRUD 개수를 늘리는 데 시간을 쓰지 않아요. 제공될 UI/API 골격을 경계와 권한 검증을 드러내는 만큼만 완성합니다.
- UI에서 버튼을 숨기는 것만으로 권한 검증을 끝내지 않아요. 읽기와 변경 모두 서버 진입점에서 customer session을 거부해야 해요.

**자가 검증**

- `admin`을 `web` 없이 독립적으로 기동해 필수 흐름을 확인해요.
- `web`을 `admin` 없이 독립적으로 기동해 기존 고객 경로를 확인해요.
- customer session의 admin read/mutation이 모두 거부되는 로그나 테스트를 남겨요.
- source import 검색과 runtime 호출 기록에서 app-to-app 참조가 없음을 확인해요.

**완료조건**

`web`과 `admin`이 서로의 source와 runtime endpoint에 기대지 않고 각자의 필수 흐름을 실행할 수 있어야 해요.

---

### 🧩 4단계 — auth·analytics는 계약과 정책만 공유해요

공통 관심사를 앱마다 복사하면 정책이 파편화돼요. 하지만 공통 package가 현재 사용자 상태를 들고 있으면 여러 요청과 앱의 상태가 섞일 수 있습니다. 이번 단계에서는 **재사용할 계약/정책**과 **요청마다 조립할 상태**를 분리해요.

#### auth 경계

**공유 후보**

- session claim, role, app audience의 타입과 검증
- 인증 실패·권한 부족 오류 계약
- cookie/session 보안 기본값
- 요청 입력과 주입된 설정으로 identity를 검증하고 반환하는 stateless 함수

**각 앱에 남길 것**

- 로그인 화면과 이동 경로
- 앱별 허용 role과 권한 정책 조립
- 앱의 DAL과 viewer DTO
- 현재 요청의 cookie, session, current user 값
- 앱별 cookie 이름, signing secret, 기대 audience의 실제 주입

**금지**

- auth package의 module scope나 mutable singleton에 `currentUser` 또는 session object 저장
- customer session을 admin session으로 재사용
- 두 앱의 cookie 이름·domain·path·secret을 생각 없이 같게 두기
- UI guard만 믿고 Route Handler·Server Action·DAL의 권한 검사를 생략하기

#### analytics 경계

**공유 후보**

- event envelope과 공통 필드 계약
- transport interface와 실패 정책
- consent/redaction 정책

**각 앱에 남길 것**

- 어떤 사용자 행동에서 event를 발생시키는가
- 앱·화면별 event schema
- 현재 요청/브라우저 context의 user identity 조립

server에서 실행되는 analytics adapter는 요청 identity를 process-wide module scope에 저장하지 않아요. client SDK는 browser context 안의 identity를 유지할 수 있지만 `identify`/`reset` lifecycle을 명시하고, 로그인·로그아웃·계정 전환 때 올바르게 갱신되는지 검증해야 해요.

#### Public API 요구사항

- 모든 package는 소비자가 사용할 진입점을 `package.json#exports`로 명시해요.
- 소비자는 package root 또는 허용된 subpath export만 사용해요.
- package의 `src/**`와 비공개 파일을 deep import하지 않아요.
- Public API는 현재 소비자의 필요보다 넓게 열지 않아요.
- 각 workspace dependency는 소비자의 manifest에 선언해요.

**완료조건**

두 앱이 auth·analytics의 일관된 계약과 정책을 사용하면서도, server 요청 identity와 앱별 행동·권한 조립은 각 요청과 앱 경계 안에 남아 있어야 해요. client identity는 해당 browser context의 `identify`/`reset` lifecycle로 격리되어야 합니다. 이름만 `shared`인 거대한 묶음은 완료로 보지 않습니다.

---

### 🚧 5단계 — 경계 규칙을 결정적 게이트로 내려요

README에 “다른 앱을 import하지 마세요”라고 쓰는 것만으로는 앱이 늘어났을 때 경계를 지킬 수 없어요. 결정적으로 참/거짓을 가를 수 있는 규칙은 정적 검사나 dependency graph 검사로 내려야 합니다.

#### 반드시 막을 위반

| 위반 | 실패 예시 |
| --- | --- |
| app-to-app source 참조 | `admin`이 `web`의 component/type을 import |
| app-to-app runtime 참조 | `admin`이 `web` Route Handler를 내부 API처럼 호출 |
| package-to-app 참조 | 공통 auth package가 `apps/admin` 설정을 import |
| package deep import | 소비자가 `@scope/auth/src/session`을 import |
| undeclared workspace dependency | alias로 package를 쓰지만 manifest에는 선언하지 않음 |
| circular dependency | package A → B → A |
| 우회 참조 | alias·`file:`·re-export로 금지 경계를 숨김 |

검사 수단은 ESLint, dependency graph 검사, workspace script 등 규칙 성격에 맞게 조합해도 좋아요. 다만 문자열 하나를 찾는 검사로 모든 의존성을 검증했다고 주장하지 마세요.

#### 위반/정상 fixture 자가검증

각 규칙은 아래 두 방향을 모두 증명해야 해요.

1. **위반 fixture**를 넣으면 해당 gate가 실패한다.
2. **정상 fixture**로 바꾸면 같은 gate가 통과한다.

최소한 다음 기록을 남겨요.

- 실행 명령과 종료 코드
- 어떤 규칙이 어떤 파일을 막았는지 알 수 있는 실패 메시지
- 위반 상태의 실패 로그
- 수정 뒤 정상 통과 로그
- 오탐이 있었다면 규칙을 어떻게 좁혔는지

실험용 위반 코드는 최종 branch에 남기지 말고, 제공될 fixture harness가 요구하는 형태나 별도의 테스트 fixture로 보존하세요.

**완료조건**

금지한 일곱 종류의 참조를 gate가 막고, 허용된 `apps/* → package Public API` 의존은 통과해야 해요. RFC의 목표 graph, 실제 manifests, 검사 결과가 서로 같은 경계를 설명해야 합니다.

---

## 🔭 N개 앱으로 늘어날 때 함께 생각해 볼 질문 (제출)

실제 제품 앱을 여러 개 복제하지는 않아요. 공개될 synthetic graph fixture와 아래 질문으로 `web + admin` 이후를 사고합니다. 각 질문에 **3~5문장으로 판단과 근거**를 적으세요.

1. **세 번째 앱 `seller`가 생기면 어떤 package를 그대로 쓰고, 무엇을 새로 만들어야 할까?**
   - auth의 claim 검증과 seller의 허용 role 조립, analytics transport와 seller event schema를 구분해봐요.

2. **`seller`가 `admin`의 주문 UI를 import하려 하면 어떤 gate가 막아야 할까?**
   - UI가 정말 공유 책임이라면 어느 소유자가 어떤 최소 Public API로 승격할지도 함께 적어요.

3. **auth policy package가 바뀌면 어떤 앱이 영향을 받을까?**
   - 폴더 경로가 아니라 manifest의 역방향 소비 graph를 기준으로 설명해요.

4. **analytics transport 변경과 `web` 전용 event schema 변경의 영향 범위는 왜 달라야 할까?**
   - 공통 정책과 앱별 행동 조립의 변경 이유를 연결해요.

5. **앱이 20개가 되었을 때도 root script와 경계 gate를 앱마다 손으로 추가해야 한다면 무엇이 잘못된 걸까?**
   - workspace discovery, package metadata, graph 기반 검증 관점에서 답해요.

---

## 🤖 AI 활용

- **맡겨도 되는 일**: 현재 import 목록화, workspace 설정 초안, graph 시각화, ESLint/검사 script 골격, fixture 초안
- **직접 결정할 일**: package 경계, 소유자, Public API, 공통화하지 않을 책임, auth·analytics의 요청 상태 경계
- **반드시 직접 검증할 일**: 실제 manifest graph, deep import·우회 참조 차단, 위반/정상 fixture, 이동 전후 기능 보존

### 경계 리뷰 요청 예시

```text
아래 RFC와 workspace manifests를 함께 리뷰해줘.

관점:
1. apps/web과 apps/admin이 source import 또는 runtime HTTP로 서로 참조하는가
2. packages가 apps의 설정이나 구현을 역참조하는가
3. 소비자가 package.json#exports 밖의 내부 경로를 가져오는가
4. auth package나 server analytics adapter가 요청 identity를 process-wide로 저장하는가. client adapter의 identify/reset lifecycle은 분명한가
5. 두 앱에서 모양만 같은 코드를 shared로 과도하게 올렸는가

추측하지 말고 각 지적에 파일 경로와 실제 dependency 근거를 붙여줘.
```

AI가 “보통 모노레포는 이렇게 한다”는 이유로 package를 늘리라고 제안해도 그대로 따르지 마세요. RFC의 변경 이유와 위반/정상 fixture로 확인할 수 없는 제안은 채택 근거가 아닙니다.

---

## 최종 제출물

| 제출물 | 위치 또는 증거 |
| --- | --- |
| Before 기준선과 web 보존 결과 | PR 본문 또는 `docs/rfc/dlc-monorepo-boundaries.md` |
| 경계 RFC와 애매한 대상 5개 결정표 | `docs/rfc/dlc-monorepo-boundaries.md` |
| workspace와 task graph | `pnpm-workspace.yaml`, `turbo.json`, 각 `package.json` |
| grader 실행 계약 | `dlc.manifest.json` — 공개될 schema 기준 |
| 고객 앱 | `apps/web` |
| 운영자 앱과 필수 흐름 | 학생이 선언한 admin workspace |
| package Public API | 각 package의 `package.json#exports`와 공개 진입점 |
| 경계 검사 | ESLint/graph 검사 설정과 실행 script |
| 위반/정상 자가검증 | fixture, 실패·통과 로그, 실행 명령과 종료 코드 |
| N-app 질문 답변 | RFC 또는 PR 본문 |

> 💡 package 경로와 이름은 예시 위치에 맞추기보다 `dlc.manifest.json`에 공개될 schema대로 선언합니다. 자유로운 구조를 유지하되 grader가 `web`과 `admin`의 실행 계약을 찾을 수 있어야 해요.

## References

| 구분 | 링크 |
| --- | --- |
| 토스 — 모노레포 파이프라인 최적화 | https://toss.tech/article/monorepo-pipeline |
| 토스 — 모노리포 운영 회고 | https://toss.tech/article/52209 |
| Turborepo — Structuring a repository | https://turborepo.com/docs/crafting-your-repository/structuring-a-repository |
| Turborepo — Configuring tasks | https://turborepo.com/docs/crafting-your-repository/configuring-tasks |
| Turborepo — Running tasks | https://turborepo.com/docs/crafting-your-repository/running-tasks |
| pnpm — Workspaces | https://pnpm.io/workspaces |
| Node.js — Package exports | https://nodejs.org/api/packages.html#package-entry-points |
| Next.js — Authentication | https://nextjs.org/docs/app/guides/authentication |

---

## ✅ Checklist

세부 요구사항은 각 단계 본문에 있어요. 아래는 1주차를 닫기 전에 빠지면 안 되는 것만 모았습니다.

**Before와 RFC**

- [ ] 공식 starter tag·기준 SHA·Node/pnpm 버전과 실제 검증 결과를 남겼는가
- [ ] web의 네 가지 핵심 경로와 보존/의도적 변경 범위를 고정했는가
- [ ] 구현 전에 경계 RFC를 커밋했는가
- [ ] Order 계약·Order UI·session/role·analytics transport·API client를 각각 판단했는가
- [ ] 공유하지 않고 앱에 남긴 중복 하나와 이유가 있는가

**workspace와 멀티 앱**

- [ ] root script가 Turbo task graph의 진입점이며 실제 manifest dependency와 일치하는가
- [ ] web 기능이 보존되고 admin 로그인 → 주문 조회 → 상태 변경 흐름이 동작하는가
- [ ] customer session의 admin read/mutation을 서버에서 거부하는가
- [ ] app-to-app source import와 runtime HTTP 호출이 모두 없는가

**공통 관심사와 Public API**

- [ ] auth·analytics는 계약/정책을 공유하고 현재 사용자 상태와 앱별 행동은 각 앱에서 조립하는가
- [ ] auth와 server analytics에 process-wide current user/session이 없고, client analytics는 identify/reset lifecycle을 검증했는가
- [ ] 모든 내부 package가 `package.json#exports`로 최소 Public API를 선언했는가
- [ ] 소비자가 내부 경로를 deep import하지 않고 manifest에 dependency를 선언했는가

**결정적 게이트와 제출**

- [ ] app-to-app, package-to-app, deep import, undeclared dependency, cycle과 우회 참조를 기계가 막는가
- [ ] 각 규칙에서 위반 fixture는 실패하고 정상 fixture는 통과했는가
- [ ] RFC의 목표 graph와 실제 manifest graph가 일치하는가
- [ ] N-app 질문 5개에 판단과 근거를 제출했는가
- [ ] 실험용 위반 코드가 최종 branch의 제품 코드에 남지 않았는가

## 이번 주 완료 정의

1주차는 디렉터리 모양으로 통과하지 않아요. **기존 web 기능과 admin 최소 흐름이 동작하고, 앱 간 직접 참조가 없으며, auth·analytics의 공통화가 사용자 상태를 package에 가두지 않고, RFC·manifest·Public API·위반/정상 fixture가 같은 의존 경계를 설명할 때** 완료입니다.
