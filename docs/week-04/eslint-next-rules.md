# Next 전용 ESLint 룰(`@next/eslint-plugin-next`) 도입 근거

> 체크리스트 항목: [`docs/week-04/checklist.md`](./checklist.md) 0단계 — "Next 전용 룰을 넣은 근거를 설명할 수 있는가"

## 왜 필요한가

- Next.js App Router는 파일 위치·컴포넌트 타입(Server/Client)·특정 태그 사용에 프레임워크 고유의 제약이 있다 (예: `<img>` 대신 `next/image`, `<a>` 대신 `next/link`, Client Component에 `async` 금지).
- 이런 실수는 타입 에러도, 일반 `eslint-plugin-react` 룰도 잡지 못하고 빌드는 통과하지만 런타임/성능/Web Vitals에서 문제로 드러난다.
- 코드리뷰로 매번 사람이 확인하기엔 기계적으로 검출 가능한 패턴이라 자동화 근거가 있다.

## 어떤 프리셋을 썼는가

`eslint.config.mjs`에서 `eslint-config-next`의 `core-web-vitals` + `typescript` 프리셋을 사용한다.

- `core-web-vitals`는 `recommended` 대비 `no-html-link-for-pages`, `no-sync-scripts`를 `error`로 격상 — Web Vitals에 직접 영향을 주는 룰만 더 엄격하게 강제한다.
- Pages Router 전용 룰(`no-document-import-in-page` 등)은 이 프로젝트가 App Router만 써서 실제로 걸릴 일은 거의 없지만, 실수로 레거시 패턴이 섞였을 때 잡아주는 안전망이라 비용 없이 유지한다.

## 룰 목록 (v16.2.10 기준)

### core-web-vitals 프리셋에서 error인 룰

| 룰                            | 목적                                                       |
| ----------------------------- | ---------------------------------------------------------- |
| `no-html-link-for-pages`      | 내부 라우팅에 `<a>` 대신 `next/link` 강제 (풀 리로드 방지) |
| `no-sync-scripts`             | 동기 `<script>` 금지 (렌더링 블로킹 방지)                  |
| `inline-script-id`            | 인라인 `next/script`에 `id` 필수                           |
| `no-assign-module-variable`   | `module` 변수명 재할당 금지 (Next 내부 예약어 충돌)        |
| `no-document-import-in-page`  | `next/document` import를 일반 page에서 금지                |
| `no-duplicate-head`           | `_document.js`에서 `<Head>` 중복 금지                      |
| `no-head-import-in-document`  | `_document.js`에서 `next/head` import 금지                 |
| `no-script-component-in-head` | `<Head>` 내부에 `next/script` 사용 금지                    |

### warn인 룰 (recommended 기본)

| 룰                                                                     | 목적                                                                                                                                                           |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-img-element`                                                       | `<img>` 대신 `next/image` 권장 (이미지 최적화)                                                                                                                 |
| `no-async-client-component`                                            | Client Component를 `async function`으로 선언 금지 — [`component-design.md`](../../.claude/rules/component-design.md)의 "Server/Client 경계" 규칙과 직접 연결됨 |
| `no-css-tags`                                                          | `<link rel="stylesheet">` 수동 삽입 금지                                                                                                                       |
| `no-page-custom-font`, `google-font-display`, `google-font-preconnect` | 폰트 로딩 최적화 (`next/font` 유도)                                                                                                                            |
| `no-before-interactive-script-outside-document`                        | `beforeInteractive` 전략 스크립트는 `_document`에만                                                                                                            |
| `no-unwanted-polyfillio`                                               | Polyfill.io로 불필요한 폴리필 중복 방지                                                                                                                        |
| `no-head-element`                                                      | app 디렉토리에서 `<head>` 태그 직접 사용 금지                                                                                                                  |
| `no-styled-jsx-in-document`                                            | `_document.js`에서 styled-jsx 사용 금지                                                                                                                        |
| `no-title-in-document-head`                                            | `_document.js`의 `<Head>`에 `<title>` 금지                                                                                                                     |
| `no-typos`                                                             | `getStaticProps` 등 데이터 fetching 함수명 오타 검출                                                                                                           |
| `next-script-for-ga`                                                   | Google Analytics 스크립트를 `next/script`로 전환 권장                                                                                                          |

이 중 `_document`/Pages Router 관련 룰들은 이 프로젝트에서 실제로 트리거될 일은 거의 없지만, `no-async-client-component`와 `no-img-element`는 이미 팀 컨벤션 문서에 명시된 규칙을 자동으로 강제해주는 룰이라 근거 문서에 이 연결을 명시해둔다.

## 멘토 피드백 — 그대로 유지하기로 결정

`@next/eslint-plugin-next`의 룰이 App Router 전용/Pages Router 전용으로 깔끔히 나뉘어 있지 않고, 두 라우터에 공용으로 적용되는 룰이 섞여 있다. 그래서 "이 프로젝트는 App Router만 쓰니까 Pages Router 관련 룰은 빼도 된다"는 판단은 성립하지 않는다 — Pages Router를 쓰는 곳에서 App Router용 룰을 적용하면 안 되는 것과 마찬가지로, 룰 단위로 라우터가 구분되지 않는 이상 프리셋 전체를 유지하는 편이 안전하다.

→ 위 "룰 목록" 절의 프리셋 구성(`core-web-vitals` + `typescript`, 커스텀 제외 없음)은 그대로 유지한다.

---

## AI 작성 표기

이 문서는 AI(Claude)가 작성했습니다. `@next/eslint-plugin-next` 룰 목록 조사, 각 룰의 목적 요약, 표 정리는 AI가 수행했습니다. 어떤 프리셋을 쓸지·문서를 어디에 둘지는 사용자가 지시했고, 내용은 사용자가 검토했습니다.

"멘토 피드백 — 그대로 유지하기로 결정" 절은 사용자가 멘토에게 받은 피드백 내용을 그대로 정리해 반영한 것입니다.
