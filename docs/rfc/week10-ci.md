# 10주차 CI 설계 및 검증 기록

이 문서는 PR이 `feat/week-10`이나 `main`에 들어가기 전에 어떤 검사를 거치는지 설명한다. 반복 측정과 의도적 결함 주입 결과도 함께 기록해, 설정 파일만 읽지 않고 실제 차단 여부까지 확인할 수 있게 한다. 실행 명령은 `package.json`, 자동화 동작은 `.github/workflows/quality.yml`을 기준으로 한다.

## 1. 현재 결론

| 항목 | 현재 상태 | 확인 방법 |
| --- | --- | --- |
| 기본 품질 검사 | 적용 완료 | CI 정책, 환경, Vitest, lint, typecheck, production build, 번들 예산을 순서대로 실행 |
| 조건부 E2E | 구현 완료, 원격 조건 검증 중 | 허용된 Markdown만 바뀌면 생략하고 소스·설정·테스트 변경에서는 실행 |
| 병합 차단 | 적용 완료 | Ruleset `22857523`이 `main`, `feat/week-10`에 최신 base와 `merge-gate` 성공을 요구 |
| 번들 예산 | 적용 및 원격 검증 완료 | 초과 run `34552726498`, 복구 run `34553000992` |
| 환경 변수 검사 | CI 검증 완료, 배포 연결 미완료 | 실패 run `34554784036`, 복구 run `34554921387` |
| CI 최적화 | 반복 측정 완료 | Chromium 다운로드 중앙값 12초에서 6초로 감소 |
| 반복 구조 위반 | lint 규칙으로 고정 | FSD 실패 run `34553958857`, 복구 run `34554441399` |
| Vercel | 확인 불가 | 현재 작업 환경에 프로젝트 연결과 인증 정보가 없음 |

CI가 성공했다는 사실은 Preview나 Production 배포 성공을 뜻하지 않는다. 배포 환경의 origin과 session secret 검증은 Vercel 프로젝트를 연결한 뒤 별도로 완료해야 한다.

## 2. 품질 검사 순서

Quality workflow는 PR, `main` push, `merge_group`, 수동 실행에서 시작한다.

1. 저장소를 checkout하고 Node.js 24.17.0과 pnpm 10.15.1을 준비한다.
2. PR 변경 파일과 이벤트를 읽어 E2E 실행 여부를 정한다.
3. `pnpm install --frozen-lockfile`로 lockfile과 같은 의존성을 설치한다.
4. `pnpm test:ci`와 `pnpm validate:env ci`로 CI 정책과 환경을 검사한다.
5. `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`를 실행한다.
6. `pnpm bundle:check`로 `/`, `/products`의 JavaScript 예산을 검사한다.
7. E2E가 필요하면 Playwright 시스템 의존성과 Chromium headless shell을 설치한 뒤 `pnpm test:e2e:run`을 실행한다.
8. `pnpm ci:gate`가 필수 단계의 실패·취소·누락·예상하지 않은 생략을 거부한다.
9. 별도 `merge-gate` job이 Quality 결과를 하나의 required check로 전달한다.

앞 단계가 실패하면 뒤의 일반 검사는 중단한다. 결과 검사는 `always()`로 실행해 실패 원인을 Summary에 남긴다. quality timeout은 20분, `merge-gate` timeout은 2분이다. 이 값은 러너 정지에 대비한 상한이며 성능 목표가 아니다.

로컬 전체 검증 명령은 `pnpm check`다. 이 명령은 CI 정책 테스트부터 E2E까지 실행하며 E2E를 생략하지 않는다. `pnpm test:e2e:run`은 기존 production build를 사용하므로 소스를 바꾼 뒤에는 먼저 `pnpm build`를 실행해야 한다.

## 3. 조건부 E2E 계약

| 변경 또는 이벤트 | E2E 판단 |
| --- | --- |
| 루트 `README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/**/*.md`만 바뀐 PR | 생략 |
| 소스, 설정, 의존성, workflow, 테스트 변경 | 실행 |
| 허용 목록 밖 파일이나 빈 변경 목록 | 실행 |
| `run-e2e` 라벨이 있는 PR | 실행 |
| `main` push, `merge_group`, 수동 실행 | 실행 |
| 변경 파일 조회 실패 | job 실패 |

변경 목록은 `git diff base...head --name-only --no-renames -z`로 읽는다. 삭제와 공백이 포함된 파일명을 처리하며, SHA 형식을 검사한 뒤 shell 문자열이 아니라 git 인자로 전달한다.

문서 전용 PR에서도 CI 정책, 환경, Vitest, lint, typecheck, production build, 번들 예산은 실행한다. E2E 관련 세 단계만 생략한다. `docs/assets/week-05-product-images.md`처럼 테스트 입력으로 쓰는 문서는 허용 목록에서 제외한다.

PR의 연속 실행은 workflow와 ref 단위로 묶어 이전 PR 실행만 취소한다. `main` 실행에는 `cancel-in-progress: false`를 적용해 배포 후보 검증을 중간에 끊지 않는다. 실제 PR 취소 증거는 [run 34548096276](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34548096276)에 남아 있다.

## 4. 결정적 게이트

### 환경 변수

`pnpm validate:env <mode>`는 `local`, `ci`, `preview`, `production` 중 하나를 요구한다.

- 모든 모드에서 `APP_ORIGIN`은 자격 증명, 경로, query, fragment가 없는 HTTP(S) origin이어야 한다.
- CI에서는 `localhost`, `127.0.0.1`, `::1` 계열만 허용한다.
- Preview와 Production에서는 HTTPS와 비로컬 호스트를 요구한다.
- 배포 origin은 독립적으로 설정한 `EXPECTED_APP_ORIGIN`과 같아야 한다.
- Preview와 Production에서는 32바이트 난수를 base64url로 인코딩한 43자 이상의 `AUTH_SESSION_SECRET`을 요구한다.
- 현재 앱은 공개 환경 변수를 사용하지 않으므로 `NEXT_PUBLIC_*` 허용 목록은 비어 있다.

검사 오류에는 환경 변수 값을 출력하지 않는다. 길이 검사만으로 secret의 난수성을 증명하지 못하며, 같은 잘못된 값을 `APP_ORIGIN`과 `EXPECTED_APP_ORIGIN`에 복사하면 환경 혼동을 막을 수 없다.

### JavaScript 번들 예산

production build가 만든 manifest에서 공통 초기 chunk와 route entry JavaScript를 찾는다. 같은 route에서 중복 경로는 한 번만 세고, 브라우저가 파일을 따로 받는 방식에 맞춰 각 파일을 gzip한 크기를 합한다.

| Route | Budget | 복구 run actual | 여유 |
| --- | ---: | ---: | ---: |
| `/` | 286,720B | 286,235B | 485B |
| `/products` | 292,864B | 291,958B | 906B |

manifest가 없거나 필수 식별자 형식이 바뀐 경우도 실패한다. AI 리뷰에서 필수 `globalThis.__RSC_MANIFEST[` 식별자가 없어도 다른 JSON 할당문을 읽는 결함을 발견했고, `da9fea6a`에서 식별자가 없으면 즉시 실패하도록 고쳤다. 자세한 과정은 [AI 리뷰 기록](./week10-ai-review.md)에 남겼다.

### FSD import 방향

6주차 리뷰에서 `entities → app`과 `_pages → app` 역방향 참조가 반복됐다. 현재 lint는 alias를 `no-restricted-imports`, 상대 경로를 `import/no-restricted-paths`로 차단한다. 허용 방향은 `app → _pages → widgets → features → entities → shared`다.

이 규칙은 레이어 간 방향만 판정한다. 같은 레이어의 slice 분리, Public API 선택, 파일 책임은 자동화하지 않고 리뷰에서 판단한다. 따라서 FSD를 별도 required job으로 만들지 않고 기존 lint와 `merge-gate` 안에 둔다.

## 5. 병합 보호와 보안

저장소 Ruleset [`22857523`](https://github.com/manual-hue/loop-pack-fe-l2-vol1/rules/22857523)은 `refs/heads/main`과 `refs/heads/feat/week-10`에 다음 규칙을 적용한다.

- PR을 통한 변경을 요구한다.
- 최신 base를 반영한 `merge-gate` 성공을 요구한다.
- branch 삭제와 non-fast-forward push를 차단한다.
- 승인 리뷰 수는 0으로 두되 우회 주체는 두지 않는다.

PR #2는 Ruleset 적용 후 `merge-gate`가 성공한 상태에서만 `feat/week-10`에 병합됐다. workflow는 `contents: read`만 허용하고 checkout credential을 남기지 않는다. Production secret을 PR 코드에 전달하지 않으며 `pull_request_target`도 사용하지 않는다.

AI 리뷰와 Lighthouse는 required check에 넣지 않았다. AI 결과는 모델과 입력 문맥에 따라 달라지고, Lighthouse는 hosted runner와 네트워크 조건의 변동성이 크기 때문이다. 두 결과는 후보를 찾는 advisory 자료로만 사용하고, 실제 차단은 재현 가능한 테스트·lint·빌드·예산 검사에 맡긴다.

## 6. CI 반복 측정

### 측정 계약

Before와 After는 같은 애플리케이션 commit 계열, `ubuntu-latest`, Node.js 24.17.0, pnpm 10.15.1, 전체 검증과 E2E 9개를 사용했다. queue 대기는 quality 시간에서 제외하고 생성부터 최종 완료까지의 wall-clock에는 포함했다.

`measure-ci` 라벨이 붙은 실행은 `.ci-cache-scope`에 `measurement-<run-id>`를 기록한다. 각 run의 attempt 1은 새 key라 `pnpm cache is not found`가 출력되고, attempt 2는 같은 key의 `Cache restored from key`를 확인했다. 일반 공유 캐시를 삭제하거나 lockfile을 바꾸지 않았다.

표의 단계는 `Node setup / install / CI policy / env / unit / lint / type / build / bundle / browser deps / browser / E2E` 순서이며 단위는 초다.

| 조건 | Run·attempt | Cache scope·결과 | 단계별 시간 | Quality | Wall |
| --- | --- | --- | --- | ---: | ---: |
| Before cold | [34548194561·1](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34548194561/attempts/1) | `measurement-34548194561` miss | `6/6/4/1/12/10/4/11/1/11/11/21` | 112 | 131 |
| Before cold | [34549011773·1](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34549011773/attempts/1) | `measurement-34549011773` miss | `5/4/3/0/10/8/4/9/0/12/12/18` | 98 | 114 |
| Before cold | [34549450575·1](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34549450575/attempts/1) | `measurement-34549450575` miss | `7/6/5/0/13/11/5/12/1/12/12/21` | 122 | 138 |
| Before warm | [34548194561·2](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34548194561/attempts/2) | 같은 scope restore | `11/2/4/0/14/11/5/11/0/13/12/20` | 115 | 130 |
| Before warm | [34549011773·2](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34549011773/attempts/2) | 같은 scope restore | `8/2/4/1/13/10/5/11/0/12/11/20` | 107 | 115 |
| Before warm | [34549450575·2](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34549450575/attempts/2) | 같은 scope restore | `9/2/4/0/14/10/5/11/1/11/12/20` | 112 | 122 |
| After cold | [34550075695·1](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34550075695/attempts/1) | `measurement-34550075695` miss | `7/6/4/0/13/10/5/11/0/13/6/21` | 112 | 121 |
| After cold | [34550677128·1](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34550677128/attempts/1) | `measurement-34550677128` miss | `5/7/3/0/11/8/4/9/1/18/5/18` | 100 | 413¹ |
| After cold | [34551453952·1](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34551453952/attempts/1) | `measurement-34551453952` miss | `6/7/4/0/12/10/4/11/0/14/6/20` | 110 | 120 |
| After warm | [34550075695·2](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34550075695/attempts/2) | 같은 scope restore | `9/2/5/0/14/11/4/12/0/13/7/22` | 115 | 124 |
| After warm | [34550677128·2](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34550677128/attempts/2) | 같은 scope restore | `11/2/4/1/13/11/4/12/0/12/6/22` | 109 | 118 |
| After warm | [34551453952·2](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34551453952/attempts/2) | 같은 scope restore | `11/2/4/0/14/10/5/11/1/11/6/20` | 108 | 117 |

¹ run `34550677128`은 GitHub 대기열에서 약 5분 7초를 기다렸다. quality 실행은 100초였으므로 이 대기 시간을 성능 비교에서 제외하고 raw wall-clock에만 남겼다.

### 중앙값과 판단

| 조건 | Before 중앙값·범위 | After 중앙값·범위 | 판단 |
| --- | --- | --- | --- |
| Cold quality | 112초 · 98~122초 | 110초 · 100~112초 | 2초 감소지만 범위가 겹쳐 전체 개선으로 확정하지 않음 |
| Warm quality | 112초 · 107~115초 | 109초 · 108~115초 | 3초 감소지만 범위가 겹쳐 전체 개선으로 확정하지 않음 |
| pnpm install | cold 6초 · 4~6초 / warm 2초 | cold 7초 · 6~7초 / warm 2초 | cache hit은 install만 줄이고 전체 병목은 아님 |
| Chromium 다운로드 | 12초 · 11~12초 | 6초 · 5~7초 | 중앙값 6초, 50% 감소 |
| E2E | 20~21초 중심 | 20~22초 중심 | 테스트 실행 시간은 줄지 않음 |

가장 안정적으로 줄어든 구간은 Chromium 다운로드였다. headless E2E는 전체 Chrome 184.3MiB가 필요하지 않아 `playwright install --only-shell chromium`으로 114.7MiB headless shell만 받도록 바꿨다. 전체 quality 시간은 러너 편차를 넘는 개선이라고 주장하지 않는다. 검증 범위를 줄이지 않으면서 직접 비용이 절반으로 줄었기 때문에 이 변경은 유지한다.

## 7. 원격 실패와 복구

| 검증 | 실패 | 복구 | 확인한 동작 |
| --- | --- | --- | --- |
| 번들 예산 | [run 34552726498](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34552726498) | [run 34553000992](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34553000992) | `/`가 539B 초과하면 bundle과 `merge-gate` 실패, 280KiB 복구 후 E2E 9개까지 성공 |
| 환경 변수 | [PR #4, run 34554784036](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34554784036) | [run 34554921387](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34554921387) | 허용하지 않은 `NEXT_PUBLIC_*`에서 build 전 실패, 변수 제거 후 전체 성공 |
| FSD import | [PR #3, run 34553958857](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34553958857) | [run 34554441399](https://github.com/manual-hue/loop-pack-fe-l2-vol1/actions/runs/34554441399) | `entities → app`을 두 lint 규칙이 차단하고 `merge-gate`로 전파, 임시 파일 제거 후 성공 |

실험 PR #3과 #4는 최종 diff를 원래 상태로 복구한 뒤 병합하지 않고 닫았다. 번들 예산 실험도 마지막 커밋에서 정상값을 복구한 뒤 PR #2로 `feat/week-10`에 병합했다. 최종 코드에는 낮춘 예산, 금지 환경 변수, 위반 import가 남아 있지 않다.

docs-only와 `run-e2e` 라벨의 원격 실행 결과는 이 문서 PR에서 확인한 뒤 표에 추가한다.

## 8. 배포 연결 한계

현재 작업 환경에는 `.vercel` 연결 정보와 Vercel CLI 인증이 없다. 따라서 Preview URL, deployment ID, Production branch, 실제 배포 환경 변수, smoke test, rollback을 확인했다고 쓰지 않는다.

Vercel을 연결할 때는 다음 조건을 충족해야 한다.

- Preview와 Production에 서로 다른 `APP_ORIGIN`, `EXPECTED_APP_ORIGIN`, `AUTH_SESSION_SECRET`을 설정한다.
- Preview build 전에 `pnpm validate:env preview`, Production build 전에 `pnpm validate:env production`을 실행한다.
- Production branch는 `main`으로 지정하고 같은 commit의 `merge-gate` 성공 뒤에만 승격한다.
- 상품 목록, 비인증 주문 접근, 로그인, 주문 조회를 smoke test로 확인한다.
- 직전 정상 deployment와 rollback 후 smoke 절차를 기록한다.

현재 주문 저장소는 메모리 `Map`이라 인스턴스 재시작과 다중 인스턴스 사이에서 주문을 보존하지 못한다. 배포 smoke는 이 한계를 명시한 데모 범위로만 실행하거나, 운영 전 영속 저장소로 교체해야 한다.

## 9. 관련 기록

- [10주차 AI 리뷰 기록](./week10-ai-review.md)
- [10주 기술 회고](./week10-retrospective.md)
- [6주차 FSD 설계와 아키텍처 리뷰](./week06-fsd.md)
- [8주차 테스트 계획](./week08-test-plan.md)
- [9주차 E2E 범위](./week09-e2e-scope.md)
- [7주차 성능 측정](../week-07-performance/README.md)

최종 로컬 검증은 Node.js 24.17.0과 pnpm 10.15.1에서 `pnpm check`로 실행한다. Windows 성공은 Ubuntu Actions 결과를 대신하지 않으므로, 문서 PR에서도 `quality`와 required `merge-gate` 성공을 별도로 확인한다.
