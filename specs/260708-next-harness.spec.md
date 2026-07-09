# 4주차 0단계 — Next 하네스 이식 스펙

## 목표

1주차 하네스(ESLint flat config + Prettier + husky/lint-staged)를 Next 프로젝트에서 되살리고,
Next 전용 룰(`@next/eslint-plugin-next`)을 룰 단위로 이해한 뒤 근거와 함께 편입한다.
PR #8 때처럼 채택/미채택 근거와 고민 과정을 기록으로 남긴다.

## 비범위

- Select/Dialog 구현 (1·2단계)
- 1주차에 없던 새 룰 대거 추가 (react, jsx-a11y 등 범용 플러그인 확장)
- CI 구성

## 확정 목표

- 하네스 의존성 재설치 + lint-staged/`prepare` 스크립트 복구
- ESLint config를 한 벌로 통합 (1주차 config 기반, 스타터 `.mjs` 기본 세팅 제거)
- `@next/eslint-plugin-next` 룰을 열어보고 필요한 것만 근거와 함께 편입
- Vite 잔재 정리 (`dist` ignore, `vite.config.ts` 예외 등)
- 위반 코드 커밋을 실제로 시도해 pre-commit이 막는지 재검증

## 조사 결과

- ESLint config 2개 공존: 1주차 `eslint.config.js` + 스타터 `eslint.config.mjs`.
  ESLint는 `.js`를 우선하므로 스타터의 Next 룰은 현재 죽어 있음
- 스타터 머지(8f18bfc)로 package.json이 교체되며 하네스 의존성 전부 증발:
  `typescript-eslint` · `eslint-plugin-react-hooks` · `eslint-plugin-import-x` ·
  `prettier` · `husky` · `lint-staged` 등 (이전 목록은 `git show 318fd10^:package.json`)
- 현재 package.json에 `"type": "module"` 없음 → ESM 문법인 `eslint.config.js`는 로드 자체가 불가
- `.husky/pre-commit`(`pnpm lint-staged`)은 있으나 lint-staged 패키지·설정·`prepare` 스크립트 없음 → 게이트 형해화
- `.prettierrc.json` / `.prettierignore`는 살아 있음
- `@next/eslint-plugin-next@16.2.10`에 룰 21개 존재 (`node_modules/.pnpm/@next+eslint-plugin-next@16.2.10/.../dist/rules/`)
- `eslint-config-next`는 플러그인 외에 `eslint-plugin-react` · `jsx-a11y` · `eslint-plugin-import` ·
  `react-hooks` · `typescript-eslint`를 통째로 끌고 옴 → 1주차 config와 중복/충돌 소지

## 결정 사항

- D1: Next 룰은 recommended(core-web-vitals) 세트 기반으로 켜고, 21개 룰이 각각 뭘 막는지
  이해해 기록한다 — 룰 대부분이 파일 패턴/컨텍스트로 알아서 스코프되므로 전수 개별 on/off보다
  세트 채택 + 이해 기록이 시간 대비 효율적. App Router에 실질 무관한 룰(Pages Router `_document`
  계열)은 표에서 명시한다. (방식은 에이전트에 위임받아 결정)
- D2: `eslint-config-next`는 제거하고 `@next/eslint-plugin-next`만 직접 의존한다 —
  config-next는 react/jsx-a11y/import 등 범용 세트를 통째로 끌고 와 1주차 config와 중복되고,
  쓰는 것만 의존하는 게 '골라 편입' 취지에 맞음.
- D3: 내 config를 `eslint.config.mjs`로 전환하고 스타터 기본 세팅은 제거한다 —
  package.json에 `"type": "module"`이 없어 `.js`(ESM)는 로드 불가. `.mjs`는 파일 하나만
  바뀌고 다른 영향이 없으며 Next 생태계 관례와도 일치.

## Next 룰 편입 기록 (T3)

`@next/eslint-plugin-next@16.2.10`의 `core-web-vitals` flat config 채택.
recommended와 룰 구성은 같고, 성능 문제(전체 페이지 리로드·파싱 블로킹)를 일으키는
`no-html-link-for-pages` · `no-sync-scripts` 2개만 warn → error로 승격된 세트다.

게이트와 warn의 관계 (검토 후 미적용 결정): 세트의 warn 룰은 기본 `eslint`로는 커밋을
막지 못한다. lint-staged에 `--max-warnings=0 --no-warn-ignored`를 걸어 경고도 차단하는
방식이 lint-staged 공식 문서의 표준 형태이고 zero-warnings 정책으로 통용되지만
(typescript-eslint 메인테이너들도 "warn은 결국 무시된다"는 입장), **적용하지 않기로 결정**.
근거: warn은 말 그대로 경고 — Vercel이 "정당한 예외가 있을 수 있는 권고"로 둔 심각도
구분을 게이트에서도 그대로 존중한다. error(성능 필수 룰)는 지금도 커밋이 차단된다.
경고가 쌓이는 신호가 보이면 그때 재검토.

### App Router에서 실질 동작하는 룰 (13개)

| 룰                            | CWV 심각도 | 뭘 막나 / 왜                                                                        |
| ----------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| `no-html-link-for-pages`      | error      | 내부 이동에 `<a>` 사용 시 전체 리로드 → `next/link` 강제                            |
| `no-sync-scripts`             | error      | 동기 `<script>`는 HTML 파싱을 블로킹 → `next/script` 유도                           |
| `inline-script-id`            | error      | id 없는 inline `next/script`는 중복 실행 위험                                       |
| `no-assign-module-variable`   | error      | `module` 변수 재할당은 번들러 모듈 시스템과 충돌                                    |
| `no-script-component-in-head` | error      | `next/head` 안의 `next/script`는 동작하지 않음                                      |
| `no-img-element`              | warn       | `<img>` 대신 `next/image` — LCP·대역폭 최적화(자동 리사이즈/lazy)                   |
| `no-head-element`             | warn       | `<head>` 직접 작성 금지 — App Router는 Metadata API 사용                            |
| `no-css-tags`                 | warn       | 수동 `<link rel="stylesheet">` 대신 CSS import — 빌드 최적화 대상에 포함시키기 위함 |
| `no-async-client-component`   | warn       | async 클라이언트 컴포넌트는 렌더가 깨짐 (서버 컴포넌트만 async 가능)                |
| `google-font-display`         | warn       | 폰트 로드 시 `font-display` 미지정 → 텍스트 안 보이는 FOIT 방지                     |
| `google-font-preconnect`      | warn       | Google Fonts 도메인 preconnect 누락 → 연결 지연                                     |
| `next-script-for-ga`          | warn       | GA 스니펫을 `next/script`로 — 로드 타이밍 제어                                      |
| `no-unwanted-polyfillio`      | warn       | Next가 이미 폴리필하는 기능을 polyfill.io로 중복 로드 금지                          |

### Pages Router 전용이라 이 프로젝트에선 no-op인 룰 (8개)

`no-document-import-in-page` · `no-duplicate-head` · `no-head-import-in-document` ·
`no-styled-jsx-in-document` · `no-title-in-document-head` · `no-page-custom-font` ·
`no-before-interactive-script-outside-document` · `no-typos`(getServerSideProps 등 오타 감지)

모두 `pages/` · `_document` 파일 패턴에만 반응하므로 App Router 코드에선 실행 비용도
오탐도 없다. 세트에서 굳이 빼면 나중에 개별 관리 부담만 생겨 그대로 둔다.

## 완료 조건

- [x] ESLint config가 내 `eslint.config.mjs` 한 벌만 존재한다 (1주차 룰 유지 + Vite 잔재 제거)
- [x] `eslint-config-next`가 devDeps에서 빠진다
- [x] Next 룰이 실제 동작한다: `<img>` 위반이 `@next/next/no-img-element`(warn)로 잡힘
      — 복원 커밋과 분리해 별도 변경으로 편입
- [x] 1주차 룰이 실제 동작한다: 조건부 훅이 `react-hooks/rules-of-hooks`(error)로 잡힘
- [x] 위반 코드 커밋 시도가 pre-commit에서 차단됨 (husky → lint-staged → eslint 경로 확인,
      HEAD 변화 없음) · 정상 코드는 커밋됨 (복원 커밋 46b4caa가 pre-commit 통과)
- [x] 룰별 채택/무관 근거 표를 기록한다 (PR 본문·노션용) — 위 "Next 룰 편입 기록" 절
- [x] `pnpm lint` · `pnpm build` 통과

## 태스크

- T1: 하네스 의존성 재설치(1주차 목록에서 Vite 전용 제외) + `prepare`/`lint-staged`/`format`
  스크립트 복구. eslint 버전은 `@next/eslint-plugin-next` peer 호환 확인 후 결정 — fulfills: 조건 1·2·5·7
- T2: `eslint.config.js`를 `eslint.config.mjs`로 통합: 1주차 룰 유지, `dist`→`.next` 등 ignore 정리,
  `no-extraneous-dependencies` 예외를 Next 기준으로 교체, 스타터 `.mjs` 내용 대체 — fulfills: 조건 1
- T3: `@next/eslint-plugin-next` recommended 편입 + 21개 룰 이해/근거 표 작성 — fulfills: 조건 2·3·6
- T4: 위반 코드 2종(`<img>`, 조건부 훅)으로 lint·pre-commit 게이트 재검증 후 원복 — fulfills: 조건 3·4·5
- T5: `pnpm build` 확인 + CLAUDE.md 명령어 표를 Next 기준으로 갱신 — fulfills: 조건 7
