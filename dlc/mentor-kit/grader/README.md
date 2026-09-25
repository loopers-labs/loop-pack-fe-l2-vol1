# DLC grader core

의존성 없는 Node.js 검증 코어다. 학생 repository의 이름과 package 개수를 고정하지 않고 `dlc.manifest.json`에 선언된 실행 표면을 사용한다.

## 정적 검증

```bash
node dlc/mentor-kit/grader/cli.mjs validate-manifest \
  --file dlc.manifest.json --root . --check-files

node dlc/mentor-kit/grader/cli.mjs validate-plan \
  --file deployment-plan.json

node dlc/mentor-kit/grader/cli.mjs boundaries \
  --root . --manifest dlc.manifest.json

node dlc/mentor-kit/grader/cli.mjs run-commands \
  --root . --manifest dlc.manifest.json \
  --commands boundaries,plan,verify,runtime
```

모든 CLI는 stdout에 JSON을 출력하고 통과하면 `0`, 학생 제출 계약 위반이면 `1`, 잘못된 CLI 사용이면 `2`로 종료한다.
`run-commands`는 격리된 grader runner 안에서 manifest에 선언된 명령만 실행하고, 명령별 exit code·signal·timeout·stdout·stderr를 하나의 JSON 결과로 수집한다. 제출 코드를 실행하는 단계이므로 production credential이 없는 일회성 runner에서만 사용한다.

boundary 검사는 다음을 독립적으로 확인한다.

- app-to-app source import와 다른 앱 public/internal URL 환경변수 참조
- package-to-app import와 re-export
- `package.json#exports` 밖의 deep import
- 선언하지 않은 workspace dependency
- workspace 경계를 넘는 상대경로 import, TypeScript alias 및 `file:` 우회
- workspace dependency cycle

`dlc/fixtures/boundaries/good`는 통과해야 하고 `bad`는 각 위반 코드가 모두 검출되어야 한다.

## runtime 검증

`runtime-contract.mjs`는 다음 API를 제공한다.

- `createCanonicalSessionCases`: 내부 `/api/__dlc/session` route에서 정상, wrong-role, wrong-audience, cross-app replay cookie를 발급한다.
- `runSessionMatrix`: web/admin의 role, audience, signing/cookie 경계를 확인한다.
- `runSameInstanceIsolation`: 두 요청을 identity read 뒤 barrier에서 겹치고 instance/request header 및 viewer sentinel을 검사한다.
- `checkAnalyticsRecords`: browser context별 `identify`/`reset` lifecycle과 event identity를 검사한다.
- `checkPublicHookClosure`: 공개 URL의 grader hook이 `401`, `403`, `404`, `405` 중 하나로 닫혀 있는지 GET/POST 모두 확인한다.

grader는 mentor-owned commerce service에 barrier를 먼저 prepare하고, 같은 `barrierHeader`와 내부 token을 붙인 두 요청을 동시에 보낸다. 앱은 identity-read 직후 도착 전용 token으로 mentor barrier에 request ID를 기록하고, two-arrival latch가 두 요청을 함께 해제한 뒤 같은 barrier ID를 응답에 echo한다. grader는 학생 app에 없는 관리 token으로 두 개의 실제 arrival을 inspect한다. 따라서 header만 되돌리는 구현은 실패하고 process-wide `currentUser` mutation을 결정적으로 적발한다.

## 검증 범위의 한계

- 정적으로 계산한 문자열, 난독화한 URL, 실행 중 조립한 dynamic import는 source scanner만으로 완전하게 판정할 수 없다. production Compose의 분리 network와 egress 정책을 함께 검증해야 한다.
- analytics 검사는 sink record를 판정한다. 실제 두 browser context에서 event를 발생시키는 Playwright 수집기는 별도 실행 계층이다.
- Docker final image, non-root user, standalone asset, local registry digest는 Docker daemon이 있어야 검증할 수 있다.
- GitHub fork cache 권한은 실제 Actions run이, registry push와 VM readiness switch/rollback은 승인된 외부 credential이 있어야 최종 판정할 수 있다.
