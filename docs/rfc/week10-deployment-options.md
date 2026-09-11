# Vercel과 Docker 배포 비교

## 1. 같은 애플리케이션이 요구하는 두 운영 모델

| 판단 축 | Vercel | Docker 기반 플랫폼 |
| --- | --- | --- |
| 배포 산출물 | Next.js 소스와 플랫폼 build | OCI image |
| Preview | PR 연동으로 자동 생성 | 별도 배포 자동화와 라우팅 필요 |
| 런타임 통제 | 플랫폼이 Node와 실행 구조 관리 | base image, OS 패키지, 프로세스를 저장소가 고정 |
| 확장·복구 | 플랫폼 deployment 단위 | registry의 image digest와 플랫폼 rollout 단위 |
| 환경 변수 | 프로젝트의 환경별 설정 | 컨테이너 실행 시 secret/config 주입 |
| 운영 부담 | 낮음 | registry, 취약점 갱신, 배포 플랫폼 운영 필요 |

이 프로젝트는 PR Preview와 Next.js 기본 기능이 중요하므로 현재 기본 선택은 Vercel이다. Docker가 더 일반적이라는 이유만으로 운영 부담을 추가하지 않는다. 회사 배포 표준이 컨테이너이거나, VPC 내부망·고정 OS 의존성·플랫폼 이동성이 필요할 때 Docker image가 필요하다.

## 2. 이미지 구조

`Dockerfile`은 세 단계다.

1. `dependencies`: `.nvmrc`와 같은 Node 24.17.0, pnpm 10.15.1에서 frozen lockfile로 의존성을 설치한다.
2. `builder`: `APP_ORIGIN`을 **필수 build 인자로** 받고 환경 검증 뒤 production build를 만든다. 기본값을 두지 않는다.
3. `runner`: Next standalone 서버, static, public만 복사하고 비 root `nextjs` 사용자로 `node server.js`를 실행한다.

`next.config.ts`의 `output: 'standalone'`은 필요한 파일만 `.next/standalone`에 모은다. runner에는 pnpm과 소스, 테스트, 전체 `node_modules`가 들어가지 않는다.

`APP_ORIGIN`에 기본값을 두지 않는 이유는 `appOrigin.ts`와 같다. 조용한 localhost 기본값은 불일치를 숨긴 채 결과물에 굳는다. 초안은 여기에 `http://127.0.0.1:3000`을 기본값으로 뒀는데, 그러면 `--build-arg` 없이 빌드해도 `env:check`가 그 값으로 통과해 환경 게이트가 무력해진다. 인자를 주지 않으면 builder 단계가 `APP_ORIGIN이 없습니다`로 멈춘다. runner에도 같은 값을 굽고 `docker run -e APP_ORIGIN=...`으로 덮어쓸 수 있게 뒀다 — `getAppOrigin`은 요청마다 `process.env`를 읽는다.

## 3. 로컬 검증 증거

2026-09-11에 다음 명령을 실행했다.

```bash
docker build \
  --build-arg APP_ORIGIN=http://127.0.0.1:3000 \
  -t loop-commerce:week10 .

docker run --rm --name loop-commerce-week10 \
  -p 3100:3000 \
  -e APP_ORIGIN=http://127.0.0.1:3000 \
  loop-commerce:week10

DEPLOYMENT_URL=http://127.0.0.1:3100 pnpm test:smoke
```

이미지 build 안에서 환경 검증과 Next production build가 통과했다. 실행 이미지는 `nextjs` 사용자와 `node server.js` 명령을 사용한다. image ID는 `sha256:1aeda796aee1d2ab8d31032772e7d4c71259fdba47f798f84984d34b61ed3c7f`, 크기는 89,020,786B였다. 컨테이너 URL에서 smoke 3개가 1.5초에 통과했다.

image ID는 로컬 build 증거이며 배포 식별자로 쓰지 않는다. registry에 올릴 때는 다음처럼 불변 commit SHA를 태그로 쓴다.

```text
ghcr.io/hyungkishin/loop-commerce:<full-commit-sha>
```

`latest`는 사람이 최근 이미지를 찾는 보조 태그로만 쓴다. rollback과 감사를 위해서는 SHA tag와 digest가 필요하다. registry는 CI가 만든 image를 배포 플랫폼과 공유하고, 같은 산출물을 환경별로 실행하기 위해 필요하다.

## 4. 환경 변수의 차이

Vercel은 Development, Preview, Production 범위별로 값을 저장한다. Docker image는 공개 설정을 build arg로 받고 비밀값은 image에 넣지 않은 채 실행 시 주입한다.

현재 `APP_ORIGIN`은 metadata와 서버 요청에 사용되므로 build와 runtime 값이 같아야 한다. Preview URL이 배포마다 바뀌면 Preview 전용 고정 도메인을 두는 편이 계약이 단순하다. Docker에서도 외부 공개 origin과 컨테이너 내부 bind 주소를 구분해야 한다. `HOSTNAME=0.0.0.0`, `PORT=3000`은 bind 설정이고 `APP_ORIGIN`은 사용자가 접근하는 origin이다.

## 5. CI/CD 위치

Docker image는 `quality`가 통과한 commit에서 한 번 만든다. SHA로 태그해 GHCR 같은 registry에 push하고, Preview 또는 Production 플랫폼은 같은 digest를 실행한다. 환경마다 image를 다시 만들면 Preview에서 확인한 산출물과 Production 산출물이 달라진다.

이번 제출은 로컬 image build와 container smoke까지 검증했다. registry push와 원격 컨테이너 배포는 대상 플랫폼과 자격 증명이 없으므로 완료로 표시하지 않는다.
