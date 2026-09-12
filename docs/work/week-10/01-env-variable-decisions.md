# 1단계 결정 — 환경 변수 정의 주체와 값의 출처

- 대상: `docs/assignments/week-10-quests.md` 3번(127~135번 줄), 5번(184번 줄), 6번(193~200번 줄)
- 선행 문서: Notion「week-10 Day 1 의사결정 목록」주제 1(환경 식별 변수), 주제 2(`APP_ORIGIN`)
- 이 문서가 다루는 범위: **환경 변수의 정의 주체와 값의 출처만.** 주제 3(검증 범위·실패 기준) 이후는 아직 정하지 않았다. 검증 스크립트의 구현 형태·규칙은 이 문서에 없다.
- 상태: **작성 시점 결정** (2026-09-09). 6절은 2026-09-10 추가, 구현 완료.

## 목차

1. [환경 식별 변수는 직접 정의한다](#1-환경-식별-변수는-직접-정의한다)
2. [허용값은 3개다](#2-허용값은-3개다)
3. [`PREVIEW_URL` 변수는 만들지 않는다](#3-preview_url-변수는-만들지-않는다)
4. [`APP_ORIGIN`은 환경별로 출처가 갈린다](#4-app_origin은-환경별로-출처가-갈린다)
5. [preview는 `VERCEL_URL`이다](#5-preview는-vercel_url이다)
6. [파생은 애플리케이션 코드에서 한다](#6-파생은-애플리케이션-코드에서-한다)
7. [폴백을 없앤다](#7-폴백을-없앤다)
8. [`VERCEL_ENV` 교차검사는 넣지 않는다](#8-vercel_env-교차검사는-넣지-않는다)
9. [아직 확인하지 않은 것](#9-아직-확인하지-않은-것)
10. [검토 중 철회한 근거](#10-검토-중-철회한-근거)
11. [References](#11-references)

## 1. 환경 식별 변수는 직접 정의한다

- 질문: preview/production을 구분할 변수로 Vercel이 주는 `NEXT_PUBLIC_VERCEL_ENV`를 쓸 것인가, `NEXT_PUBLIC_ENV`를 직접 정의할 것인가
- 결정: **`NEXT_PUBLIC_ENV`를 직접 정의한다.**
- 근거: 과제 6번이 Docker 이미지로 production 실행을 요구하는데(193번 줄), Docker 컨테이너 안에는 `VERCEL_ENV`가 **존재하지 않는다.** Vercel 플랫폼이 채우는 값이라 그 플랫폼을 안 거치는 실행 경로에는 애초에 안 들어온다. Vercel 값에 결합하면 Docker 경로에서 값이 비고, 폴백을 두면 그 폴백은 Vercel 밖에서만 발동해 CI가 못 잡는 구멍이 된다.

보조 근거 두 가지 — 결정을 뒤집을 정도는 아니지만 같은 방향이다.

| 보조 근거 | 내용 |
| --- | --- |
| 로컬에서 prefix가 안 붙는다 | Vercel 공식 문서: prefix는 production/preview 배포에만 붙고 로컬 개발 환경에는 안 붙는다. `vercel env pull`로 받아도 `VERCEL_ENV`가 `NEXT_PUBLIC_VERCEL_ENV`로 바뀌지 않는다 |
| 검증이 성립하지 않는다 | 과제 3번이 "허용되지 않은 `NEXT_PUBLIC_ENV` 값은 실패"를 요구한다(129번 줄). Vercel이 채우는 값은 플랫폼이 세 값 중 하나로 보장하므로 검사가 항상 참인 코드가 되고, 검증 실패 실험을 만들 대상도 사라진다 |

`NEXT_PUBLIC_` 접두사를 붙이는 이유: Day 3 Sentry의 `environment`가 서버·클라이언트 양쪽 초기화에 필요하다. 브라우저에 노출돼도 무해한 값이다.

**도입 시점**

- 질문: 이 변수를 Day 1에 넣을 것인가, 필요해지는 시점으로 미룰 것인가
- 결정: **Day 3에 넣는다.** 필요해지는 시점, 즉 Sentry가 들어올 때 도입한다.
- 근거: 지금 계측은 `sessionStorage`에만 쌓이고 외부로 전송하는 곳이 없어 환경을 구분할 대상 자체가 없다. 소비처 없는 변수를 미리 두지 않는다.
- **따라오는 결과**: Day 1의 `validate-env` 검증 대상은 `APP_ORIGIN` 하나다. 과제 3번이 명시한 `NEXT_PUBLIC_ENV` 값 검증(129번 줄)은 Day 3으로 함께 미뤄진다. 위 표의 "검증이 성립하지 않는다"는 근거는 *Vercel 값 대신 직접 정의를 고르는* 이유이지, Day 1에 당장 넣어야 한다는 이유가 아니다.
- 1·2절의 결정(변수명·허용값)은 도입 시점과 무관하게 유효하다 — 넣을 때 이 형태로 넣는다.

## 2. 허용값은 3개다

- 결정: **`local | preview | production`**
- 근거: Vercel의 `development`는 이 프로젝트에서 실제로 발동하는 경로가 없다. 로컬 개발은 Vercel을 거치지 않으므로 Development 스코프가 쓰이지 않는다.

## 3. `PREVIEW_URL` 변수는 만들지 않는다

- 질문: preview 주소를 담을 변수를 따로 둘 것인가
- 결정: **두지 않는다.**
- 근거: 코드가 읽어야 하는 주소는 `APP_ORIGIN` 하나로 충분하다. preview 주소는 설정이 아니라 배포 산출물이고, 기록 위치는 이미 정해져 있다 — 진행 중 값은 PR 본문, 최종값은 `docs/rfc/week10-release-flow.md`에 이중 기록.
- 추가할 조건: 코드가 preview 주소를 직접 읽어야 하는 일이 실제로 생기면.

## 4. `APP_ORIGIN`은 환경별로 출처가 갈린다

- 질문: 환경별 고정값을 Vercel 환경 변수로 넣을 것인가, Vercel 시스템 변수에서 파생시킬 것인가
- 결정: **전역 택일이 아니라 환경별 분기.** 세 환경 모두 확정이며 선택지로 열어두지 않는다.

| 환경 | 출처 | 근거 |
| --- | --- | --- |
| production | 직접 고정값 (Vercel Production 스코프에 등록) | production 도메인은 배포마다 안 바뀌므로 파생시킬 이유가 없다 |
| preview | `VERCEL_URL` 파생 | 5번 참조 |
| local | 직접 (`.env` 하드코딩) | 로컬에는 Vercel 값이 prefix 없이도 안 들어온다(1번의 보조 근거) — "Vercel 정의"라는 선택지 자체가 없다 |

현재 소비처는 두 곳이다. 둘 다 서버 실행 구간이라 `NEXT_PUBLIC_` 접두사가 필요 없다. 둘 다 6절의 `getAppOrigin()`을 거친다.

- `src/shared/api/apiFetch.ts:21` — `typeof window === 'undefined'` 분기 안의 self-fetch
- `src/_app/RootLayout.tsx:25` — `metadataBase`

## 5. preview는 `VERCEL_URL`이다

- 질문: `VERCEL_URL`과 `VERCEL_BRANCH_URL` 중 무엇으로 파생시킬 것인가
- 결정: **`VERCEL_URL`.**

두 변수의 동작 차이 (Vercel 공식 문서):

| | URL 문자열 | 가리키는 대상 |
| --- | --- | --- |
| `VERCEL_URL` | 커밋마다 새로 생김 | 그 커밋의 배포로 영구 고정 |
| `VERCEL_BRANCH_URL` | 브랜치 이름 기반, 안 바뀜 | 커밋마다 최신 배포로 갱신됨 |

근거 두 가지:

1. **기록 시점 ~ merge 시점 사이의 정확성.** 과제 1번이 PR 본문/release 문서에 값을 "실제로 기록"하라고 요구한다(69번 줄). PR 본문에 값을 적어둔 뒤 리뷰 반영 커밋이 붙는 건 흔한 일이다. `VERCEL_BRANCH_URL`로 적었으면 그 순간 기록된 URL이 조용히 새 커밋을 가리키게 되고 — 고쳐야 한다는 신호도 없다. "리뷰어가 확인했다는 그 화면"과 "지금 그 URL로 보이는 화면"이 어긋난다. `VERCEL_URL`은 적어둔 커밋에 영구히 묶여 있어 이 변질이 구조적으로 불가능하다.
2. **커밋 간 before/after 비교가 가능하다.** 커밋 A에서 smoke test를 돌리고, 수정 커밋 B가 배포된 뒤, A와 B의 URL을 각각 열어 나란히 비교할 수 있다. `VERCEL_BRANCH_URL`은 그 주소 하나로 최신 것만 보여주므로 A의 화면을 그 링크로 재현할 수 없다(대시보드에서 A 배포를 따로 찾아야 한다).

self-fetch 관점에서도 같은 방향이다. SSR 중 자기 자신의 API를 부르는데, 지금 실행 중인 인스턴스가 정확히 `VERCEL_URL`이 가리키는 그 배포다. `VERCEL_BRANCH_URL`은 "브랜치의 최신 배포"로 라우팅하므로 배포 전환 타이밍에 불필요한 간접이 생긴다.

## 6. 파생은 애플리케이션 코드에서 한다

- 질문: 5절의 `VERCEL_URL` 파생을 어디에서 수행할 것인가
- 결정: **`src/shared/config/appOrigin.ts`의 `getAppOrigin()`.** 소비처 두 곳이 모두 이 함수를 거친다.
- 근거: `next.config.ts`의 `env` 필드로도 같은 일을 할 수 있으나, Next.js 공식 문서가 이 API를 legacy로 표기한다 — "This is a legacy API and no longer recommended. It's still supported for backward compatibility." 새로 쓰는 코드가 의존할 대상이 아니다.

분기 조건과 우선순위:

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 분기 조건 | `VERCEL_ENV === 'preview'` | `VERCEL_URL`은 preview 전용이 아니라 production 배포에도 설정된다(Vercel 공식 문서). 존재 여부만으로 분기하면 production에서 `APP_ORIGIN` 등록을 빠뜨렸을 때 커스텀 도메인 대신 `*.vercel.app`을 조용히 쓴다 — 「폴백을 없앤다」 절이 막으려는 것과 같은 사고다 |
| 우선순위 | 파생을 `APP_ORIGIN`보다 먼저 본다 | `.env`가 커밋돼 있어 preview 빌드에도 `APP_ORIGIN=http://localhost:3000`이 들어온다. `APP_ORIGIN`을 먼저 보면 파생이 영영 발동하지 않고 preview self-fetch가 로컬을 향한다 |

빌드 시점이 아니라 요청 시 해석하므로 값이 빌드 산출물에 박히지 않는다. Docker(과제 6번)에서 `docker run -e APP_ORIGIN=...`으로 주입한 값이 그대로 살아 있다.

`VERCEL_ENV`를 여기서 쓰는 것은 1절(환경 식별 변수는 직접 정의한다)과 충돌하지 않는다. 1절이 Vercel 값을 배제한 이유는 Docker 경로에 `VERCEL_ENV`가 없다는 것인데, 이 분기는 값이 없으면 파생하지 않고 `APP_ORIGIN`으로 내려가므로 Docker 경로가 정상 동작한다.

## 7. 폴백을 없앤다

Notion 주제 2의 4번에서 이미 정한 것을 이 문서에 옮겨 적는다. 이 세션에서 새로 정한 것이 아니라 확인한 것이다.

- 현재 상태의 비대칭
  - `src/shared/api/apiFetch.ts:19` — 폴백 없음. 미설정 시 깨진다
  - `src/_app/RootLayout.tsx:24` — `?? 'http://localhost:3000'` 폴백 있음. 미설정 시 조용히 로컬을 가리킨다
- 결정: **폴백을 없앤다.** `APP_ORIGIN`을 환경 변수로 명시 지정해 예측 가능하게 만들고, 미설정은 검증에서 막는다.
- 근거: 폴백은 로컬에서만 발동하므로 CI가 그 경로를 못 잡는다. 조용히 틀린 값으로 진행하는 것보다 검증에서 죽는 편이 낫다.

## 8. `VERCEL_ENV` 교차검사는 넣지 않는다

- 질문: Vercel 스코프에 값을 잘못 넣는 오설정(preview 스코프에 `production`)을 검증으로 잡을 것인가. `VERCEL_ENV`가 존재할 때만 `NEXT_PUBLIC_ENV`와 일치하는지 대조하는 방식이 후보였다
- 결정: **넣지 않는다.**
- 근거: 아직 겪지 않은 사고를 막는 코드다. Docker·로컬에는 `VERCEL_ENV`가 없어 검사가 건너뛰어지므로 커버리지도 부분적이다.
- 추가할 조건: preview 스코프에 값을 잘못 넣어 실제로 한 번 문제가 생긴 뒤.

## 9. 아직 확인하지 않은 것

실측하지 않은 항목이다. **결정이 미완인 것이 아니라, 확정된 결정을 실행할 때 채워 넣을 값이다.**

| 항목 | 어디에 쓰이나 |
| --- | --- |
| Vercel GitHub App이 이 레포에 연결돼 있는지 | 봇의 배포 URL 자동 코멘트 유무가 기록 흐름에 영향을 준다 |
| production 커스텀 도메인 존재 여부 | 4번에서 production 슬롯에 넣을 문자열이 무엇인지 |

## 10. 검토 중 철회한 근거

논의 과정에서 근거로 들었다가 사실 확인 후 철회한 것이다. `week10-release-flow.md`에 옮겨 적지 않는다.

| 철회한 주장 | 왜 틀렸나 |
| --- | --- |
| "merge 이후에는 `VERCEL_URL`이 `VERCEL_BRANCH_URL`보다 오래 남는다" | 둘은 같은 배포 객체를 가리키는 주소일 뿐이다. Vercel retention 문서상 "브랜치가 살아 있는 동안 최신 preview 배포를 보존"하는 예외는 PR이 merge/close되고 브랜치가 삭제되면 사라지고, 그 뒤로는 동일한 retention 시계가 돈다 — 하나가 지워지면 둘 다 죽는다 |
| "Vercel 봇이 자동 코멘트를 남기므로 수동 기록 단계가 없다" | 과제 1번이 "PR 본문/release 문서에 **실제로 기록**"을 명시한다(69번 줄). 자동 코멘트와 별개로 문서에 옮겨 적는 수동 단계가 존재한다 |
| "SHA와 URL의 대응이 깨지면 안 된다는 것은 과제 명세다" | 과제에 있는 것은 "기록하라"까지다. 대응이 사후에도 유지돼야 한다는 요구는 그 기록이 rollback 확인·smoke test 재현(과제 1번·5번)에 쓰인다는 사실에서 유도한 것이지 원문 인용이 아니다 |

## 11. References

- `docs/assignments/week-10-quests.md` — 1번(69번 줄), 3번(127~135번 줄), 5번(184~185번 줄), 6번(193~200번 줄)
- Notion「week-10 Day 1 의사결정 목록」주제 1, 주제 2
- [Vercel — System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables) — `VERCEL_ENV` · `VERCEL_URL` · `VERCEL_BRANCH_URL` 정의, `VERCEL_URL`이 production에도 설정된다는 근거
- [Next.js — `env`](https://nextjs.org/docs/app/api-reference/config/next-config-js/env) — legacy API 표기
- [Vercel — Framework environment variables](https://vercel.com/docs/environment-variables/framework-environment-variables) — 로컬 환경에 prefix가 안 붙는다는 명시
- [Vercel — Deployment Retention](https://vercel.com/docs/deployment-retention) — 브랜치 삭제 후 보존 예외가 사라진다는 근거
- 코드: `src/shared/config/appOrigin.ts`, `src/shared/api/apiFetch.ts:21`, `src/_app/RootLayout.tsx:25`
