# DLC mentor kit

이 디렉터리는 학생의 package 구조를 정답으로 고정하지 않고, DLC 캡스톤의 입력과 검증 표면만 제공합니다.

## 구성

- `services/commerce-api`: 고정 주문 seed, 조회·상태 변경, grader 전용 reset
- `services/analytics-sink`: browser context별 identify/reset/event와 grader 조회
- `grader`: manifest·deployment plan·workspace 경계·runtime 계약 검사
- `deploy`: readiness-gated slot 전환, rollback, registry digest provenance 도구
- `compose.yml`: 로컬 mentor service 기동 환경

학생이 구현해야 하는 Turborepo 구조, package Public API, app별 Dockerfile과 production 배포 workflow는 이 키트에 들어 있지 않습니다.
`src/dlc-starter`는 단일 앱에서 fixture를 발급하고 grader wire protocol을 확인하기 위한 monolithic 입력일 뿐, auth package의 이름·위치·Public API 정답이 아닙니다. 그대로 shared package로 옮기는 것을 완료로 인정하지 않습니다.

## 로컬 시작

Node와 pnpm 버전은 repository root의 `.nvmrc`와 `package.json#packageManager`를 따릅니다. Docker Compose 환경에서 아래 값을 shell에 주입합니다. 실제 secret은 파일에 커밋하지 않습니다.

```bash
export COMMERCE_API_TOKEN='local-commerce-token'
export ANALYTICS_WRITE_TOKEN='local-analytics-token'
export MENTOR_SERVICE_ADMIN_TOKEN='local-mentor-admin-token'
export DLC_BARRIER_ARRIVAL_TOKEN='local-barrier-arrival-token'
export SOURCE_REVISION="$(git rev-parse HEAD)"
export SOURCE_URL='https://github.com/your-org/loop-pack-fe-l2-vol1'

docker compose -f dlc/mentor-kit/compose.yml up -d --build
node dlc/mentor-kit/smoke.mjs
```

Docker에 Compose plugin이 없고 `docker-compose`만 설치된 환경에서는 마지막 두 명령의 `docker compose`를 `docker-compose`로 바꿉니다.

서비스는 로컬 확인을 위해 `127.0.0.1:4100`, `127.0.0.1:4101`에만 publish됩니다. 이 때문에 local Compose에는 host bridge와 내부 network가 함께 있으며 outbound가 완전히 차단된 구성은 아닙니다. 학생 앱 컨테이너는 `loopers-dlc-mentor-internal` network에서 service DNS를 사용해야 하며, 운영 배포에서는 host bridge·published port를 제거하고 reset·inspection endpoint를 ingress에 연결하면 안 됩니다.

종료:

```bash
docker compose -f dlc/mentor-kit/compose.yml down --volumes
```

## 계약 자가검증

```bash
pnpm test:dlc-kit
pnpm build && pnpm test:dlc-runtime

node dlc/mentor-kit/grader/cli.mjs validate-manifest \
  --file dlc/examples/dlc.manifest.example.json

node dlc/mentor-kit/grader/cli.mjs validate-plan \
  --file dlc/examples/deployment-plan.example.json

node dlc/mentor-kit/grader/cli.mjs boundaries \
  --root dlc/fixtures/boundaries/good \
  --manifest dlc/fixtures/boundaries/good/dlc.manifest.json
```

학생 제출물을 평가할 때는 격리된 credential-less runner에서 `run-commands`로 manifest의 표준 명령을 실행하고, 명령별 종료 코드와 출력이 담긴 단일 JSON 증거를 보관합니다. 이 명령을 registry·VM credential이 있는 deploy runner에서 실행하지 않습니다.

`dlc/fixtures/boundaries/bad`는 실패해야 정상입니다. app-to-app, package-to-app, deep import, 미선언 dependency, alias·`file:` 우회와 cycle을 각각 보고해야 합니다.

app-to-app runtime 호출은 정적 검색만으로 완전히 찾을 수 없으므로 production Compose의 network도 검사합니다.

```bash
docker compose -f compose.yml config --format json > dlc/artifacts/compose.config.json
node dlc/mentor-kit/grader/cli.mjs network-policy \
  --file dlc/artifacts/compose.config.json \
  --web web --admin admin \
  --shared commerce-api,analytics-sink
```

## 학생 repository 연결

1. `dlc/examples/dlc.manifest.example.json`을 학생 repository root의 `dlc.manifest.json`으로 복사하고 실제 workspace·경로·환경변수 이름으로 바꿉니다.
2. `commands`의 네 script를 학생 root `package.json`에 구현합니다.
3. grader는 package 이름을 추측하지 않고 manifest와 command만 사용합니다.
4. runtime grader를 켤 때만 `DLC_GRADER_ENABLED=true`, app hook 전용 `DLC_GRADER_TOKEN`, mentor barrier 도착 전용 `DLC_BARRIER_ARRIVAL_TOKEN`을 학생 container에 주입합니다. prepare/inspect 권한이 있는 `MENTOR_SERVICE_ADMIN_TOKEN`은 학생 app에 주입하지 않습니다.
5. public ingress에서는 같은 hook이 401·403·404·405 중 하나로 닫혀 있어야 합니다.

## 검증 결과 분류

- `pass`: 제출 구현이 계약을 만족함
- `student-failure`: schema, boundary, plan, image 또는 runtime 불변식 위반
- `infra-blocked`: mentor service, registry, VM, network 또는 grader 자체 장애

`infra-blocked`는 학생 실패로 채점하지 않고 같은 commit으로 재실행합니다.

실제 GitHub fork cache 권한, 원격 registry digest, VM ingress/TLS, blue/green 전환은 로컬 smoke만으로 공개 승인할 수 없습니다. 과제 공개 전에 starter 계약서의 go/no-go를 깨끗한 학생 계정과 실제 VM에서 다시 실행해야 합니다.
