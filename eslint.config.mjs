import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // week-03까지 쓰던 엄격 룰을 Next 기반 위에 이식한다.
  // react/react-hooks/@typescript-eslint 플러그인은 eslint-config-next가 이미 등록했으므로
  // 여기선 룰만 강화하고, 새 플러그인(simple-import-sort)만 추가로 등록한다.
  {
    plugins: { "simple-import-sort": simpleImportSort },
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

  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".claude/**"]),

  // prettier와 충돌하는 포맷 룰을 끈다. 반드시 마지막에 둔다.
  eslintConfigPrettier,
]);

export default eslintConfig;
