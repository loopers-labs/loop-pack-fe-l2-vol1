# 10주차 릴리즈 흐름

## 1. 코드에서 Production까지

| 단계 | 대상 | 통과 조건 | 실패 근거 |
| --- | --- | --- | --- |
| 1 | feature PR | `quality` 성공 | GitHub Actions의 실패 step과 summary |
| 2 | Preview 배포 | Vercel build 성공, 배포 smoke 3개 성공 | Vercel Build Logs, `Deployment Smoke` artifact |
| 3 | main merge | 리뷰 승인과 required `quality` 성공 | PR Checks와 merge 상태 |
| 4 | Production 배포 | 배포 SHA와 main SHA 일치, smoke 3개 성공 | Vercel Deployment, Actions summary |
| 5 | 운영 확인 | 에러, 성능, 계측의 환경 구분과 PII 미수집 확인 | Sentry, Lighthouse, 이벤트 저장소 |

`quality`는 architecture, 단위·DOM, Storybook, lint, typecheck, 환경 변수, production build와 번들 예산을 항상 실행한다. 실행 경로가 바뀐 PR과 main push에서는 E2E 12개도 실행한다. 문서만 바뀐 PR은 E2E만 생략한다.

배포 smoke는 `.github/workflows/deployment-smoke.yml`이 맡는다. Vercel이 성공한 `deployment_status`를 GitHub에 보내면 `environment_url`을 대상으로 실행한다. 실행할 코드는 배포 SHA가 아니라 **기본 브랜치**에서 checkout한다. 연결되지 않은 플랫폼은 Actions의 수동 실행에 Preview 또는 Production URL을 넣어 같은 검증을 호출한다.

`deployment_status`는 base 저장소의 권한과 secrets를 들고 도는 트리거다. 여기서 배포 SHA를 checkout하면 fork PR의 preview 배포에서 온 코드를 실행하게 되고, 같은 job의 `VERCEL_AUTOMATION_BYPASS_SECRET`이 그 코드에 닿는다. `pull_request_target`을 피하는 이유와 같은 구조다. 배포 커밋의 스펙으로 재는 편이 정확하지만 그 정확도는 신뢰 경계와 맞바꿀 값이 아니라서, 실행 코드는 기본 브랜치로 고정하고 배포 SHA는 summary 기록에만 남긴다. smoke 3개는 어느 브랜치의 배포에서도 성립해야 하는 최소 계약이다.

secret이 나갈 상대도 함께 좁혔다. `DEPLOYMENT_URL`은 이벤트 payload나 수동 입력에서 오는데 bypass secret을 헤더로 붙여 보내므로, 값이 비었는지만 확인하면 임의의 호스트로 보낼 수 있다. https이고 호스트가 `*.vercel.app`일 때만 실행한다. 다른 플랫폼으로 옮기면 이 허용 목록을 함께 고친다.

## 2. Preview와 Production

| 항목 | Preview | Production |
| --- | --- | --- |
| 트리거 | PR commit 배포 | main merge 배포 |
| URL | deployment마다 달라질 수 있음 | 고정 도메인 |
| 데이터 | 테스트 데이터와 외부 시스템 | 실제 데이터와 외부 시스템 |
| `APP_ORIGIN` | Preview 고정 도메인 또는 해당 deployment origin | Production 고정 도메인 |
| 이벤트 환경 | `preview` | `production` |
| 용도 | 변경분 검수와 smoke | 사용자 트래픽 제공 |

Preview는 Production DB, 결제 API와 이벤트 데이터셋을 공유하지 않는다. 현재 애플리케이션은 저장소 내부 mock API를 사용하므로 DB·결제 비밀값은 없다. 실제 외부 API를 붙이는 시점에 Preview host가 Production host와 같은 경우 환경 검증에서 거부한다.

`NEXT_PUBLIC_` 값은 브라우저 번들에 포함된다. 비밀값에는 이 접두사를 붙이지 않는다. 환경 변수 변경은 이미 만들어진 배포에 소급 적용되지 않으므로 새 deployment를 만든다.

## 3. 추적 기록

한 배포를 다음 네 값으로 식별한다.

| 값 | 기록 위치 |
| --- | --- |
| commit SHA | PR 본문과 release 기록 |
| CI run URL | PR 본문과 release 기록 |
| Preview URL | PR 본문, Actions smoke summary |
| Production URL | release 기록, Actions smoke summary |

이번 제출 PR은 `loopers-labs/loop-pack-fe-l2-vol1#202`다. 최종 SHA와 CI URL은 PR 본문에 기록한다.

| 환경 | URL | deployment ID | smoke |
| --- | --- | --- | --- |
| Preview | https://loop-commerce-week10-g1h352o90-cashnamu.vercel.app | `dpl_FWXqRGm54qsLN7oaKD3J2WrbcuDc` | 3개 통과, 3.1s |
| Production | https://loop-commerce-week10.vercel.app | `dpl_C5RBRoA1ZQeSxJnquWYratxckUJ2` | 3개 통과, 3.4s |

두 deployment는 애플리케이션 변경 SHA `c2c7c456`을 사용한다. build log에서 환경 검증, pnpm 10.15.1, Next 16.2.10, route 13개와 성공 상태를 확인했다. 첫 배포라 Preview 후보가 Production으로 지정됐고, 같은 소스를 다시 배포해 별도 Preview URL을 확보했다.

## 4. 실패 위치와 복구

- CI 실패: PR의 Checks 탭에서 실패한 named step을 연다. E2E 실패는 7일 보존되는 `playwright-failure-*` artifact의 trace, screenshot, video를 확인한다.
- Vercel build 실패: Project의 Deployments에서 해당 SHA를 고르고 Build Logs의 install, build, route generation 중 실패 구간을 확인한다.
- 배포 smoke 실패: Actions의 `Deployment Smoke` summary에서 URL과 SHA를 확인한다. trace와 screenshot은 `deployment-smoke-*` artifact에 남는다.
- 런타임 오류: Sentry에서 `environment`와 `release`를 배포 SHA로 좁힌다. 현재 저장소에는 Sentry SDK가 없으므로 이 항목을 자동 검증 완료로 표시하지 않는다.

main 배포가 깨지면 Vercel Deployments에서 smoke가 성공한 직전 Production deployment를 찾는다. 해당 deployment의 SHA와 CI 성공을 확인한 뒤 Instant Rollback으로 트래픽을 되돌린다. 데이터 변경이 포함됐다면 코드 rollback 전에 스키마의 하위 호환성을 확인한다.

rollback 뒤에는 같은 Production URL을 대상으로 다음을 다시 실행한다.

```bash
DEPLOYMENT_URL=https://production.example.com pnpm test:smoke
```

홈 응답, 상품 30개와 첫 카드, 로그인 입력 계약이 모두 통과해야 복구가 끝난다. 이후 Sentry 신규 오류와 이벤트 유입을 확인한다.

## 5. 자동 검증과 사람 확인의 경계

required는 `static`과 `runtime` 둘이다. 포크의 보호 브랜치에 실제로 걸어 문서만 바꾼 PR이 `mergeStateStatus=CLEAN`이 되는 것을 확인했다(PR #14). 조건부 E2E는 `runtime` 안의 스텝이라 생략돼도 job 상태가 보고되고, 생략한 검증은 `merge_group`이 병합 직전에 다시 돈다. 번들 byte 예산도 결정적이므로 required 후보다. 배포 smoke도 URL이 확보된 이후 Preview와 Production 승격 조건으로 사용한다. Lighthouse 단일 점수, Sentry 오류 부재, 이벤트 funnel의 타당성은 실행 환경과 트래픽에 따라 달라지므로 사람이 범위와 추세를 판단한다.

현재 upstream 저장소의 branch protection을 변경할 관리자 권한이 없다. 따라서 `quality`를 required로 둘 정책은 정했지만 설정 완료라고 쓰지 않는다.

실제 실패 deployment `dpl_AjanvCN4sj5XsEQm3B7R25P4fctq`는 `APP_ORIGIN`이 Vercel Production 환경에 저장되지 않아 `pnpm env:check`에서 build 전에 중단됐다. 프로젝트의 Preview·Production 환경에 고정 origin을 등록한 뒤 `dpl_C5RBRoA1ZQeSxJnquWYratxckUJ2`가 통과했다.

### Preview 보호 정책

최초 Preview smoke는 HTTP 302로 Vercel 로그인 화면에 이동한 뒤 세 계약을 모두 찾지 못해 실패했다. status code만 확인했다면 Vercel 로그인 화면의 200을 앱 성공으로 오판할 수 있었다. 요소 계약을 함께 둔 이유가 이 실패로 확인됐다.

자동 smoke가 배포 URL에 접근하도록 이 과제용 프로젝트의 Vercel Authentication을 해제했다. 사용자 데이터와 외부 결제가 없는 공개 mock 애플리케이션이라 공개 Preview를 허용했다. 비공개 서비스에서는 보호를 끄지 않고 `VERCEL_AUTOMATION_BYPASS_SECRET`을 GitHub secret에 저장해 `x-vercel-protection-bypass` 헤더로 전달한다.
