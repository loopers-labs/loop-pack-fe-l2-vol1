# DLC 모노레포 실습키트 구현 계획

> 기준 계약: `docs/superpowers/specs/2026-09-25-dlc-monorepo-starter-contract.md`
>
> 작업 브랜치: `codex/dlc-monorepo-capstone`

## 목표

멘티가 공식 starter에서 과제를 시작하고, 자유로운 package 설계를 유지하면서도 멘토가 경계·영향 범위·컨테이너·요청 격리를 결정적으로 검증할 수 있는 실행 키트를 만든다.

## Task 1 — 실행 계약 고정

- `dlc.manifest.json`에 grader가 호출할 표준 script와 내부 hook 경로를 추가한다.
- JSON schema, example, invalid fixture를 제공한다.
- 학생 구현과 멘토 제공물의 책임을 README에서 구분한다.

검증: example은 통과하고 invalid fixture는 구체적 오류로 실패한다.

## Task 2 — 공식 starter 표면

- 기존 단일 Next 앱을 유지하면서 health/readiness/viewer 계약을 제공한다.
- customer/admin A·B와 role/audience가 있는 서명 session fixture를 제공한다.
- admin 주문 조회·상태 변경의 미완성 골격을 제공한다.
- production에서는 grader hook이 기본 비활성이고, 내부 token이 있을 때만 활성화되게 한다.

검증: 기존 테스트 회귀, role/audience 단위 테스트, 공개 hook 차단 테스트가 통과한다.

## Task 3 — mentor-owned 서비스

- dependency-free `commerce-api`에 readiness/version/reset/order read/status mutation을 구현한다.
- 고정 seed와 customer/viewer sentinel을 제공한다.
- client analytics sink를 별도 서비스로 제공한다.
- 두 서비스의 Dockerfile과 Compose를 제공한다.

검증: Node contract test와 Docker 내부 smoke가 같은 payload를 확인한다.

## Task 4 — grader와 fixture

- manifest/plan schema validator를 구현한다.
- workspace graph 기반 boundary 검사와 정상/위반 fixture를 구현한다.
- 학생의 표준 script를 호출하고 구조화된 JSON 결과를 남기는 runner를 구현한다.
- 동일 인스턴스 role/audience/cookie replay/barrier 시험과 public hook closure 시험을 구현한다.

검증: known-good fixture는 통과하고 각 mutation은 해당 gate에서 실패한다.

## Task 5 — Docker·CI·배포 골격

- mentor service Compose, local registry, provenance 생성/검사 스크립트를 제공한다.
- blue/green slot, readiness probe, proxy switch, rollback의 provider-neutral shell 계약을 제공한다.
- CI에서 kit test를 항상 실행하고 Docker 검증 job을 분리한다.

검증: clean Linux build, non-root 실행, readiness 실패 시 전환 거부, local registry digest와 provenance 연결을 확인한다.

## Task 6 — 멘토 리허설

- pinned Node/pnpm으로 install, unit, lint, typecheck, build를 실행한다.
- kit self-test, Compose smoke, unsafe mutation 실패, fixed fixture 통과를 실행한다.
- 로컬에서 증명할 수 없는 GitHub Actions fork cache와 실제 VM/Registry/TLS 항목은 공개 게이트로 구조화해 기록한다.
- 통과한 commit에만 RC tag를 만든다. push와 실제 외부 배포는 별도 승인 없이는 수행하지 않는다.

## 완료 정의

- starter를 clone한 멘티가 한 명령으로 mentor service를 띄우고 baseline을 확인할 수 있다.
- grader가 학생의 package 이름을 가정하지 않고 manifest를 통해 실행 표면을 찾는다.
- 잘못된 경계·누락 consumer·request-global identity가 각각 결정적으로 실패한다.
- 최종 보고에서 로컬 통과와 외부 공개 게이트가 명확히 분리된다.
