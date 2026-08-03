import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated/build artifacts & cache
    "coverage/**",
    ".eslintcache",
  ]),
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
      "no-console": ["error", { allow: ["error"] }],
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react-hooks/rules-of-hooks": "error",
    },
  },
  // FSD 의존성 하네스.
  // 의존 방향: app → _pages → widgets → features → entities → shared
  // src/app 은 Next 라우팅 디렉터리이지만 의존 순서상 최상위라 app 타입으로 잡는다.
  //
  // 마이그레이션 중에는 configs.recommended 로 시작했다. 그 preset 은
  // no-unknown-files / no-unknown-dependencies / no-ignored-dependencies 를 꺼두어
  // 아직 안 옮긴 폴더가 미분류로 통과하게 해준다.
  //
  // 전환이 끝나 configs.strict 로 올렸다. strict 는 위 세 규칙을 켜므로
  // 어떤 레이어에도 속하지 않는 파일이 no-unknown-files 로 드러난다.
  // 즉 "옮기기를 빠뜨린 파일"을 사람이 세지 않고 기계가 잡는다.
  //
  // ignores: 데모·예제는 전환 범위 밖으로 두기로 했으므로 검사 대상에서 제외한다.
  // 이 경로를 빼지 않으면 범위 외 코드 때문에 strict 를 켤 수 없다.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/examples/**", "src/services/**", "src/shared/ui/**/components/*-demo.tsx"],
    plugins: { boundaries },
    // recommended 의 settings 는 elements 가 빈 배열이다. 여기서 실제 정의로 덮는다.
    settings: {
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
      // rules 객체는 통째로 교체되므로 preset 의 설정을 명시적으로 병합한다.
      // (spread 를 빼면 no-unknown-* 가 꺼진 채로 남아 strict 가 무의미해진다)
      ...boundaries.configs.strict.rules,
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "FSD 경계 위반: {{from.type}} → {{to.type}}. " +
            "의존 방향(상위→하위)이 맞는지, 같은 레이어의 다른 슬라이스를 부르지 않았는지, " +
            "슬라이스를 Public API(index.ts)로 들어왔는지 확인한다.",
          policies: [
            // 규칙 ① 하위 레이어만 import 한다 (app → _pages → widgets → features → entities → shared)
            // 규칙 ③ 그중 슬라이스가 있는 레이어(entities/features/widgets)는 index.ts 로만 들어온다.
            //
            // ③을 처음에는 "index.ts 를 둔 슬라이스와 두지 않은 슬라이스가 섞여 규칙이 복잡해진다"고
            // 판단해 넣지 않았다. 실제로 세어 보니 틀린 판단이었다. entities 3 · features 3 · widgets 1 은
            // 예외 없이 전부 index.ts 를 갖고 있고, 없는 곳은 _pages 와 shared 뿐인데
            // 이 둘은 element type 이 달라 따로 줄 수 있다.
            // (전용 boundaries/entry-point 규칙은 v7 에서 deprecated 라 셀렉터로 표현한다)
            {
              from: { element: { type: "app" } },
              allow: {
                to: {
                  element: { types: { anyOf: ["widgets", "features", "entities"] }, fileInternalPath: "index.ts" },
                },
              },
            },
            {
              from: { element: { type: "app" } },
              allow: { to: { element: { types: { anyOf: ["app", "pages", "shared"] } } } },
            },
            {
              from: { element: { type: "pages" } },
              allow: {
                to: {
                  element: { types: { anyOf: ["widgets", "features", "entities"] }, fileInternalPath: "index.ts" },
                },
              },
            },
            {
              from: { element: { type: "pages" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: { element: { type: "widgets" } },
              allow: {
                to: { element: { types: { anyOf: ["features", "entities"] }, fileInternalPath: "index.ts" } },
              },
            },
            {
              from: { element: { type: "widgets" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: { element: { type: "features" } },
              allow: { to: { element: { type: "entities", fileInternalPath: "index.ts" } } },
            },
            {
              from: { element: { type: "features" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: { element: { type: "entities" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
            // 규칙 ② 같은 레이어에서는 자기 슬라이스만 import 한다.
            // captured.slice 가 from 쪽 slice 와 같을 때만 허용 → 형제 슬라이스는 걸린다.
            {
              from: { element: { type: "pages" } },
              allow: { to: { element: { type: "pages", captured: { slice: "{{from.slice}}" } } } },
            },
            {
              from: { element: { type: "widgets" } },
              allow: { to: { element: { type: "widgets", captured: { slice: "{{from.slice}}" } } } },
            },
            {
              from: { element: { type: "features" } },
              allow: { to: { element: { type: "features", captured: { slice: "{{from.slice}}" } } } },
            },
            {
              from: { element: { type: "entities" } },
              allow: { to: { element: { type: "entities", captured: { slice: "{{from.slice}}" } } } },
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
