# 1단계 결정 — 환경 변수 검증 범위와 스크립트 형태

- 대상: `docs/assignments/week-10-quests.md` 3번(127~135번 줄)
- 선행 결정: [01-env-variable-decisions.md](./01-env-variable-decisions.md) — 검증할 변수가 무엇인지가 거기서 정해진다
- 선행 문서: Notion「week-10 Day 1 의사결정 목록」주제 3
- 이 문서가 다루는 범위: **무엇을 어떤 규칙으로 검사할지, 스크립트를 어떤 형태로 둘지까지.** 이 스크립트를 CI 어느 지점에서 부를지(Notion 12번)는 아직 정하지 않았다.
- 상태: **작성 시점 결정** (2026-09-10). 아직 코드 없음.

## 목차

1. [필수 환경 변수는 `APP_ORIGIN` 하나](#1-필수-환경-변수는-app_origin-하나)
2. [검사 항목 4개](#2-검사-항목-4개)
3. [환경별 규칙 분기는 없다](#3-환경별-규칙-분기는-없다)
4. [`scripts/validate-env.ts`](#4-scriptsvalidate-envts)
5. [Notion 8번의 전제가 틀렸다](#5-notion-8번의-전제가-틀렸다)
6. [남은 구멍](#6-남은-구멍)
7. [References](#7-references)

## 1. 필수 환경 변수는 `APP_ORIGIN` 하나

- 질문: 무엇을 "필수" 환경 변수로 볼 것인가 (Notion 5번)
- 결정: **`APP_ORIGIN` 하나.**
- 근거: 01번 문서 1절의 도입 시점 결정("`NEXT_PUBLIC_ENV`는 Day 3에 넣는다")의 귀결이다. 지금 코드가 읽는 환경 변수는 `APP_ORIGIN`뿐이다.
- 따라오는 결과: 과제 3번이 요구한 실패 3종 중 **"허용되지 않은 `NEXT_PUBLIC_ENV` 값"은 Day 1 스크립트에 없다**(129번 줄). Day 3에 변수가 들어올 때 함께 추가된다.

## 2. 검사 항목 4개

- 질문: 어디까지를 검증 실패로 볼 것인가 (Notion 6번)
- 결정: **파싱 + 프로토콜 + 끝 슬래시 금지.**

| # | 검사 | 근거 |
| --- | --- | --- |
| 1 | 값이 존재하는가 | 과제 "누락된 값"(129번 줄) |
| 2 | `new URL()`로 파싱되는가 | 과제 "잘못된 URL"(129번 줄) |
| 3 | 프로토콜이 `http` 또는 `https`인가 | 파싱만 통과시키면 `ftp://`도 들어온다 |
| 4 | 끝 슬래시가 없는가 | `src/shared/api/apiFetch.ts:19` |

4번의 근거를 코드로 남긴다. `apiFetch.ts:19`가 값을 문자열로 그냥 붙인다.

```ts
const url = typeof window === 'undefined' ? `${process.env.APP_ORIGIN}${input}` : input;
```

`APP_ORIGIN`이 `https://x.com/`이면 `https://x.com//api/...`가 된다. 실제로 깨지는 경로가 있어서 넣은 검사다.

`RootLayout.tsx:24`의 `metadataBase`는 이 검사와 무관하다. `new URL()`이 끝 슬래시를 알아서 정규화하므로 어느 쪽이든 같은 값이 된다. **4번 검사의 근거는 `apiFetch` 한 곳뿐이다.**

## 3. 환경별 규칙 분기는 없다

- 질문: 환경별로 다른 규칙을 적용할 것인가 (Notion 7번). 예: 로컬은 http 허용, 배포는 https만
- 결정: **분기 없음. 한 규칙을 모든 환경에 똑같이 적용한다.**
- 근거: 분기 없이 공통 적용이 가능한 검증이라고 봤다. 2절의 검사 4개는 어느 환경에서든 같은 의미로 성립한다.
- 보강 근거: 분기하려면 스크립트가 **지금 어느 환경인지 알아야 한다.** 그런데 01번 문서의 도입 시점 결정으로 `NEXT_PUBLIC_ENV`는 Day 3에 온다. `VERCEL_ENV`로 대신 알아내면 Docker 경로에서 못 알아낸다 — 01번 1절이 Vercel 값을 안 쓰기로 한 이유와 같은 문제다. 분기를 도입하면 그 결정과 충돌한다.
- 따라오는 결과: 검증 코드에 환경 분기가 생기지 않는다. 검사 4개, 분기 0개.

## 4. `scripts/validate-env.ts`

- 질문: 검증 스크립트를 어떤 형태로 둘 것인가 (Notion 8번)
- 결정: **`scripts/validate-env.ts`.** 새 의존성 없음.

후보 셋의 실측 비교:

| | `.mjs` | `.ts` | 인라인 `node -e` |
| --- | --- | --- | --- |
| 새 의존성 | 0 | **0** | 0 |
| `pnpm typecheck` 대상 | ❌ | ✅ | ❌ |
| ESLint 적용 | ✅ warning | ✅ **error** | ❌ |
| 셸 node(v20)로 직접 실행 | ✅ | ❌ | ✅ |
| `pnpm` 경유 실행 | ✅ | ✅ | ✅ |
| 과제 명시 위치(128번 줄) | ✅ | ✅ | ❌ |

각 칸의 실측 근거:

- **typecheck** — `tsconfig.json`의 `include`가 `["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"]`다. `**/*.mjs`가 없다. `scripts/`에 타입 오류를 심은 `.ts` 파일을 두고 `pnpm exec tsc --noEmit`을 돌리니 `error TS2322`로 잡혔고, 같은 위치의 `.mjs`는 검사 대상에서 빠졌다.
- **ESLint 심각도** — `eslint.config.mjs:59`가 `files: ['**/*.{ts,tsx}']`에 엄격한 규칙을 건다. 같은 미사용 변수가 `.ts`에선 error, `.mjs`에선 warning으로 나왔다.
- **셸 직접 실행** — 셸의 nvm 기본값이 v20.19.4라 `node scripts/x.ts`가 실패한다. 다만 CI도 `package.json` 스크립트도 전부 pnpm을 거치므로 실제 경로에서는 안 걸린다(5절).

인라인 `node -e`를 뺀 이유는 로그다. 잘못된 URL을 넣었을 때:

```
node:internal/url:840
      href = bindingUrl.parse(input, base, true);
                        ^
TypeError: Invalid URL
    at new URL (node:internal/url:840:25)
    at [eval]:1:89
```

스택이 Node 내부를 가리키고 내 코드 위치는 `[eval]:1:89`로만 나온다. 과제 3번이 "검증 실패 예시를 한 번 만들고 로그가 어떻게 보이는지 기록"을 요구하는데(131번 줄) 기록할 로그가 이 모양이면 요구를 만족한다고 보기 어렵다. 검사 4개를 각각 다른 메시지로 구분하려면 `try/catch`와 분기가 필요한데, 그걸 JSON 문자열 안에 이스케이프해 넣으면 읽을 수 없는 한 줄이 된다.

레포 관례도 같은 방향이다. 루트의 도구·설정 파일은 `next.config.ts` · `playwright.config.ts` · `proxy.ts` · `vitest.config.ts` · `vitest.setup.ts` · `vitest.setup.integration.ts` · `vitest.stryker.config.ts`로 전부 `.ts`이고, `.mjs`는 ESLint가 요구해서 그렇게 된 `eslint.config.mjs` 하나뿐이다. `.js`는 없다.

## 5. Notion 8번의 전제가 틀렸다

Notion 8번 본문은 "프로젝트에 `tsx`·`ts-node`가 없어 TypeScript를 바로 실행하려면 의존성이 늘어난다. 의존성 없이 돌리려면 `.mjs`다"라고 적혀 있다. **이 프로젝트에서는 사실이 아니다.**

```
$ pnpm exec node scripts/__probe.ts
node v24.17.0 | APP_ORIGIN: (missing)
```

- Node 24.17.0은 플래그 없이 `.ts`의 타입을 제거하고 실행한다
- `.npmrc`에 `use-node-version=24.17.0`이 있어, 셸의 node가 v20.19.4여도 `pnpm run` · `pnpm exec`는 24.17.0으로 돈다
- 따라서 `tsx`·`ts-node`가 **필요 없다**

이 사실이 확인되기 전까지 이 대화에서도 `.mjs`가 유력하다고 여러 번 말했다. 근거가 틀렸으므로 결론을 바꿨다.

## 6. 남은 구멍

`tsconfig.json`에 `erasableSyntaxOnly`가 설정돼 있지 않다. `enum` · `namespace` · 생성자 파라미터 프로퍼티처럼 **타입만 지워서는 사라지지 않는 문법**을 쓰면, `tsc`는 통과시키고 Node가 런타임에 터진다.

- 검사 4개짜리 스크립트에서 그런 문법을 쓸 일은 사실상 없다
- 막고 싶으면 `tsconfig.json`에 `erasableSyntaxOnly: true` 한 줄이면 되지만, 그건 프로젝트 전체에 영향을 주는 **별개 결정**이다. 이 문서에서는 정하지 않았다

## 7. References

- `docs/assignments/week-10-quests.md` 3번 — 127~135번 줄
- [01-env-variable-decisions.md](./01-env-variable-decisions.md) — 검증 대상 변수와 도입 시점
- Notion「week-10 Day 1 의사결정 목록」주제 3 (5·6·7·8번)
- 코드·설정: `src/shared/api/apiFetch.ts:19`, `src/_app/RootLayout.tsx:24`, `tsconfig.json`, `eslint.config.mjs:59`, `.npmrc`, `.nvmrc`
