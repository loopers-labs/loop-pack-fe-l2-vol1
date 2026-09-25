# DLC 캡스톤 — 단일 서비스를 확장 가능한 모노레포로 전환해요

> **기간**: 2주
>
> **Phase**: 10주 과정 이후 선택 캡스톤

> 폴더를 `apps/`와 `packages/`로 나누는 것이 목표가 아니에요.
>
> 고객 앱과 운영자 앱이 늘어나도 서로의 내부 구현을 참조하지 않고, 공통 정책은 한 곳에서 관리하며, 변경된 범위만 검증·배포하고, 같은 서버를 사용하는 사용자들의 정보가 섞이지 않는 구조를 만듭니다.

## 왜 이 캡스톤을 하는가

단일 앱에서는 파일을 옮기고 import를 정리하는 것만으로도 구조가 좋아 보일 수 있어요. 하지만 앱이 둘, 셋, N개로 늘어나면 세 종류의 경계가 동시에 필요해집니다.

1. **코드 경계** — 어떤 책임을 앱에 남기고 어떤 책임을 package로 공유할까요?
2. **작업 경계** — 한 package가 바뀌었을 때 무엇을 다시 lint·test·build해야 할까요?
3. **배포·런타임 경계** — 어떤 앱을 새로 배포해야 하고, 같은 Next.js 인스턴스의 요청들은 어떻게 격리할까요?

이 캡스톤에서는 이 세 경계를 하나의 dependency graph로 연결합니다.

```text
멀티 앱 요구
  → package 경계
  → dependency/task graph
  → affected CI
  → app별 Docker image
  → 독립 배포
  → 요청별 사용자 격리
```

## 제공되는 시나리오

모든 학생은 멘토가 검증한 **동일한 공식 DLC starter tag**에서 시작합니다. 본인의 10주차 결과물을 직접 변환하지 않아요. 시작점과 자동 검증 조건을 같게 두어 구조 판단과 실행 증거를 비교할 수 있게 합니다.

### `web` — 고객용 커머스 앱

기존 사용자 흐름을 보존합니다.

- 상품 탐색
- 장바구니와 주문
- 고객 로그인과 마이페이지
- 고객 행동 analytics

### `admin` — 운영자 앱

starter가 주문 화면과 API 골격을 제공합니다. UI를 많이 만드는 것이 이번 과제의 목적은 아니에요.

- 운영자 로그인
- 주문 목록 조회
- 주문 상태 변경 한 가지
- 운영 행동 analytics 한 가지 이상
- customer session 접근 거부

### `commerce-api` — 멘토 제공 데이터 서비스

`web`과 `admin`이 같은 주문 데이터를 볼 수 있도록 digest로 고정된 컨테이너를 제공합니다. 이 서비스는 학생의 package 설계나 평가 대상이 아닙니다.

두 앱은 각자의 data-access 경계에서 `commerce-api`를 사용합니다. `admin`이 `web`의 Route Handler를 호출하거나, `web`이 `admin` 코드를 import하는 식의 app-to-app 결합은 허용하지 않습니다.

## 최종적으로 만들어야 하는 상태

아래 구조는 **예시가 아니라 의존 방향**을 보여주는 그림입니다. package 이름과 개수는 본인의 근거에 따라 달라질 수 있어요.

```text
apps/web   ─┐
            ├──> packages/* ───> external dependencies
apps/admin ─┘

apps/web   -X-> apps/admin
apps/admin -X-> apps/web
packages/* -X-> apps/*
```

최종 제출에서는 다음을 증명해야 합니다.

- 기존 `web` 사용자 경로가 보존됩니다.
- `admin`의 주문 조회·상태 변경이 동작합니다.
- app-to-app source import와 runtime HTTP 호출이 없습니다.
- auth와 analytics의 공통 정책은 package에 있지만 현재 사용자 상태는 요청·앱 경계를 벗어나지 않습니다.
- 한 앱만 바뀌면 영향 없는 앱은 검증·빌드·배포되지 않습니다.
- 공통 package가 바뀌면 모든 실제 consumer가 빠짐없이 검증됩니다.
- `web`과 `admin`은 서로 다른 OCI image와 immutable digest로 배포됩니다.
- 배포된 동일 Next.js 인스턴스에서도 사용자 A와 B의 session·role·viewer 정보가 섞이지 않습니다.

## 2주 진행 순서

### [DLC 1주차 — 코드 경계와 의존 그래프](./dlc-monorepo-week-01.md)

1. 단일 앱의 동작 기준선을 고정합니다.
2. 구현 전에 package 경계 RFC를 작성합니다.
3. 기존 앱을 `apps/web` workspace로 이동합니다.
4. `apps/admin`을 완성합니다.
5. auth·analytics를 포함한 공유 책임을 package 경계로 설계합니다.
6. app-to-app, deep import, cycle 같은 위반을 결정적 gate로 막습니다.

### [DLC 2주차 — affected CI, Docker, 실제 배포와 요청 격리](./dlc-monorepo-week-02.md)

1. 전체 검증 CI의 Before를 측정합니다.
2. 하나의 `deployment-plan.json`으로 검증·image build·push·deploy 대상을 계산합니다.
3. Turborepo cache의 hit/miss와 output 복원을 확인합니다.
4. app별 production image를 최종 Linux image 안에서 검증합니다.
5. 공통 Linux VM에 두 앱을 독립 배포합니다.
6. 같은 인스턴스의 요청 격리와 app audience를 공격 테스트합니다.
7. 같은 조건의 After와 운영 증거를 제출합니다.

## 패키지를 나누는 기준

“두 군데에서 사용한다”는 사실만으로 package를 만들지 않습니다. 공유 후보마다 다음 질문에 답하세요.

- 같은 이유로 함께 변경되는가?
- 누가 소비하고 누가 소유하는가?
- 외부에 공개할 최소 API는 무엇인가?
- 앱 내부에 남겼을 때 생기는 실제 비용은 무엇인가?
- package가 되었을 때 늘어나는 탐색·테스트·빌드 비용보다 이점이 큰가?

공유 가치가 없는 중복 하나는 일부러 앱에 남기고 그 이유를 제출합니다.

## AI에 맡겨도 되는 것과 직접 결정할 것

| AI가 도울 수 있는 일 | 본인이 결정하고 방어할 일 |
| --- | --- |
| workspace·Dockerfile·workflow 초안 | package 경계와 Public API |
| 반복 설정의 기계적 이동 | 공통화하지 않을 책임 |
| graph 출력 해석 보조 | task inputs/outputs와 cache key |
| fixture·문서 초안 | affected 실패 시 전체 fallback |
| 테스트 골격 | auth/analytics의 요청 상태 경계 |
| 명령 문법 확인 | required check와 배포 조건 |

AI가 만든 설정은 위반/정상 fixture, cache hit/miss, image 내부 실행, 동일 인스턴스 동시 요청으로 검증한 뒤 채택하세요.

## 평가

총점은 100점입니다.

| 영역 | 점수 | 핵심 증거 |
| --- | ---: | --- |
| package 경계와 Public API | 20 | RFC, dependency graph, 위반/정상 fixture |
| auth·analytics 공통 관심사 | 10 | 공통 정책과 앱별 조립, server identity 무상태, client identify/reset 격리 |
| 멀티 앱 동작 보존 | 10 | web 회귀 + admin 최소 흐름 |
| affected CI와 cache | 20 | 변경 matrix, deployment plan, hit/miss, Before/After |
| Docker runtime 경계 | 15 | app별 image, image 내부 검증, 최소 runtime |
| 실제 독립 배포 | 10 | URL, revision/digest provenance, 독립 재배포, rollback |
| 사용자·role 요청 격리 | 15 | 동일 instance barrier 시험, audience/cookie replay 거부 |

### 총점과 무관한 필수 보완 항목

아래 항목이 하나라도 남으면 점수와 무관하게 캡스톤을 완료한 것으로 보지 않습니다.

- app-to-app source import 또는 runtime HTTP 호출이 남아 있습니다.
- customer session으로 admin 데이터나 mutation에 접근할 수 있습니다.
- 다른 앱의 session audience를 재사용할 수 있습니다.
- 동일 인스턴스에서 다른 사용자의 viewer 정보가 관찰됩니다.
- 영향받는 consumer를 CI가 누락합니다.
- 검증·image build·deploy가 서로 다른 영향 계산을 사용합니다.
- 최종 image가 실행되지 않거나 workspace runtime dependency가 빠졌습니다.
- `web`과 `admin` 중 하나만 실제 배포했습니다.

## 이번 캡스톤의 범위가 아닌 것

- Kubernetes 구축
- production급 autoscaling과 multi-region
- private npm registry와 package publish
- 독립 package versioning과 Changesets
- 실제 결제·실메일·외부 OAuth provider
- 완전한 admin 제품 구현
- N개의 실제 앱 복제
- 유료 remote cache 도입 강제

이 항목을 더하는 것보다 Basic의 경계와 검증 증거를 먼저 완성하세요.

## References

- 토스, [200여개 서비스 모노레포의 파이프라인 최적화](https://toss.tech/article/monorepo-pipeline)
- 토스, [모노리포 희망편, 절망의 리포가 희망의 리포로 부활하기까지 걸린 1년](https://toss.tech/article/52209)
- Next.js, [Authentication](https://nextjs.org/docs/app/guides/authentication)
- Next.js, [Deploying](https://nextjs.org/docs/app/getting-started/deploying)
- Next.js, [Self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- Turborepo, [Running tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- Turborepo, [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- Turborepo, [Docker](https://turborepo.com/docs/guides/tools/docker)
