import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sonarjs from "eslint-plugin-sonarjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // week-03까지 쓰던 엄격 룰을 Next 기반 위에 이식한다.
  // react/react-hooks/@typescript-eslint 플러그인은 eslint-config-next가 이미 등록했으므로
  // 여기선 룰만 강화하고, 새 플러그인(simple-import-sort)만 추가로 등록한다.
  {
    plugins: { "simple-import-sort": simpleImportSort, sonarjs },
    // eslint-disable 인라인 우회 금지 (하네스 규칙)
    linterOptions: { noInlineConfig: true },
    rules: {
      // ── Import 순서 ──
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^react"], // 1. React
            ["^@?\\w"], // 2. 외부 라이브러리
            ["^@/"], // 3. 프로젝트 내부 (절대경로 alias @/*)
            ["^\\."], // 4. 프로젝트 내부 파일 (상대 경로)
            ["^\\u0000"], // 5. CSS / side-effect (마지막)
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      // ── 중복 코드: 도구로 강제 ──
      // 같은 본문의 함수가 두 번 이상 나타나면(공통 로직 복붙) 막는다 — 단일 책임 단위로 추출하게.
      // 3줄 이상 함수만 비교한다(sonarjs 기본 threshold).
      "sonarjs/no-identical-functions": "error",

      // ── TypeScript ──
      "@typescript-eslint/no-explicit-any": "error", // any = 타입 안전성 포기
      "@typescript-eslint/ban-ts-comment": "error", // ts-ignore/nocheck로 검사 우회 금지
      "@typescript-eslint/no-unused-vars": "error", // 미사용 변수 커밋 전 제거

      // ── JS 기본 ──
      eqeqeq: ["error", "always"], // == 대신 === 강제
      "prefer-const": "error", // 재할당 없으면 const
      "no-var": "error", // var 금지
      "no-empty": "error", // 빈 블록 금지 (에러 명시적 처리)
      "no-console": ["error", { allow: ["warn", "error"] }], // console.log 커밋 금지

      // ── next/image의 deprecated prop ──
      // Next는 Image의 prop 단위 @deprecated JSDoc을 컴포넌트 타입에서 떼어내 재선언한다
      // (get-img-props의 ImageProps엔 있지만 client/image-component의 Image 타입엔 없음).
      // 그래서 타입 기반 @typescript-eslint/no-deprecated가 이 prop들을 못 잡아, 구문으로 직접 막는다.
      // 한계: 아래에 이름을 적은 prop만, JSX 태그명이 literal `Image`일 때만 걸린다
      // (alias import·다른 컴포넌트는 빠짐). 자동 발견이 아니라 알려진 케이스의 수동 목록이다.
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='Image'] JSXAttribute[name.name='priority']",
          message: "next/image의 priority는 deprecated입니다. preload prop을 쓰세요.",
        },
        {
          selector:
            "JSXOpeningElement[name.name='Image'] JSXAttribute[name.name='onLoadingComplete']",
          message: "next/image의 onLoadingComplete는 deprecated입니다. onLoad prop을 쓰세요.",
        },
      ],

      // ── React ──
      "react/jsx-key": "error", // 리스트 key 누락 방지

      // ── Hooks: 위반 시 런타임 버그 직결 ──
      "react-hooks/exhaustive-deps": "error", // 의존성 누락 = stale closure
      "react-hooks/set-state-in-effect": "error", // effect 안 setState 오남용 방지
      "react-hooks/set-state-in-render": "error", // 렌더 본문 setState = 무한 리렌더 방지
    },
  },

  // ── FSD 의존 방향 하네스 (RFC Advanced A) ──
  // RFC가 세운 두 불변식을 사람 눈이 아니라 도구로 강제한다.
  //   1. 하위 레이어가 상위 레이어를 import하지 않는다(역방향 금지).
  //   2. 같은 레이어의 다른 슬라이스를 직접 import하지 않는다.
  // 선언형이라 슬라이스를 새로 추가해도 이 설정을 고칠 필요가 없다.
  // 같은 슬라이스 안(세그먼트끼리)은 한 element라 검사 대상이 아니다 — 협력은 허용된다.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      // 최상위 폴더를 레이어 element로 매핑한다. `*`로 슬라이스명을 capture해
      // 같은 레이어의 다른 슬라이스를 서로 다른 element로 구분한다.
      // src/app은 Next 라우팅이자 FSD App 레이어를 겸한다(별도 _app 없음).
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        { type: "pages", pattern: "src/_pages/*", capture: ["slice"] },
        { type: "widgets", pattern: "src/widgets/*", capture: ["slice"] },
        { type: "features", pattern: "src/features/*", capture: ["slice"] },
        { type: "entities", pattern: "src/entities/*", capture: ["slice"] },
        { type: "shared", pattern: "src/shared" },
      ],
    },
    rules: {
      // default: disallow → 아래 policies에 없는 방향은 전부 막힌다.
      // 각 레이어는 자기보다 아래 레이어만 허용한다(위→아래 단방향).
      // allow에 자기 레이어 타입이 없으므로 같은 레이어 cross-slice는 자동 차단된다(불변식 2).
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["pages", "widgets", "features", "entities", "shared"] },
                  },
                },
              },
            },
            {
              from: { element: { type: "pages" } },
              allow: {
                to: {
                  element: { types: { anyOf: ["widgets", "features", "entities", "shared"] } },
                },
              },
            },
            {
              from: { element: { type: "widgets" } },
              allow: {
                to: { element: { types: { anyOf: ["features", "entities", "shared"] } } },
              },
            },
            {
              from: { element: { type: "features" } },
              allow: { to: { element: { types: { anyOf: ["entities", "shared"] } } } },
            },
            {
              from: { element: { type: "entities" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
          ],
        },
      ],
    },
  },

  // 7주차 과제 픽스처는 "일부러 최적화 안 한 LCP <img>"를 Before 기준으로 두고
  // 인라인 eslint-disable로 no-img-element를 끈다. 우리 하네스는 noInlineConfig라
  // 그 disable이 무효가 되어 커밋이 막히므로, 제공 픽스처를 고치지 않고
  // 이 측정용 폴더에서만 인라인 설정을 허용한다. 과제도 next/image를 완료 기준으로 두지 않는다.
  {
    files: ["src/examples/week-07-performance/**/*.{ts,tsx}"],
    linterOptions: { noInlineConfig: false },
  },

  // ── deprecated API 사용 차단 (도구로 강제) ──
  // `next/image`의 priority처럼 @deprecated로 표시된 API를 lint 에러로 잡는다.
  // 타입 정보가 필요한 룰이라 이 블록에서만 type-aware linting(projectService)을 켠다.
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-deprecated": "error",
    },
  },

  // e2e(Playwright)는 React가 아니다. 픽스처 제공 콜백의 관례명 `use`를
  // react-hooks/rules-of-hooks가 React의 `use` 훅 호출로 오인해 오탐을 내므로,
  // 이 폴더에서만 끈다. 선언형이라 앞으로 fixture를 더 만들어도 깨지지 않는다.
  {
    files: ["e2e/**/*.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },

  // 9주차 스타터(#174 병합)가 제공한 예시 코드 — 인증 mock 백엔드와 이벤트 로거.
  // 우리가 짠 게 아니라 과제용으로 들어온 코드라, 우리 컨벤션(import 정렬·no-console 등)을 강제하지 않는다.
  globalIgnores([
    "src/app/api/auth/**",
    "src/app/api/orders/**",
    "src/app/api/_data/auth*",
    // 스타터가 준 이벤트 로거 파일만 제외한다. 그 위에 우리가 얹는 스키마·셋업은 lint를 받는다.
    "src/analytics/logger.ts",
    "src/analytics/logger.test.ts",
    "src/analytics/provider.ts",
    "src/analytics/consoleProvider.ts",
  ]),

  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".claude/**"]),

  // prettier와 충돌하는 포맷 룰을 끈다. 반드시 마지막에 둔다.
  eslintConfigPrettier,
]);

export default eslintConfig;
