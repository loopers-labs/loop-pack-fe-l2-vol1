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
    // 9주차 스타터가 제공한 이벤트 로거. 과제가 "직접 만들지 마세요"라고 못박은 파일이라
    // 이 레포의 규칙을 적용할 대상이 아니다. consoleProvider 는 콘솔에 찍는 것이 그 파일의
    // 목적이라 no-console 과 애초에 맞지 않고, 세 파일 모두 FSD 레이어 밖에 있다.
    // 계측을 붙이는 우리 코드는 features·_pages 에 들어가므로 그대로 검사된다.
    // 이 폴더에 우리 파일을 새로 만들면 조용히 검사에서 빠진다 — 그러지 않는다.
    "src/analytics/**",
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
  //
  // src/test/** 와 *.dom.test.* 도 같은 이유로 뺀다. 테스트 하네스는 어느 레이어에도
  // 속하지 않아 no-unknown-files 에 걸리고, 통합 테스트는 widgets(헤더)와 _pages(목록)를
  // 한 화면에 올려 검증하는 것이 정상이라 레이어 규칙을 그대로 적용할 수 없다.
  // 프로덕션 코드의 의존 방향은 그대로 강제된다 — 면제 대상은 테스트뿐이다.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/examples/**",
      "src/services/**",
      "src/shared/ui/**/components/*-demo.tsx",
      "src/test/**",
      "src/**/*.dom.test.{ts,tsx}",
    ],
    plugins: { boundaries },
    // recommended 의 settings 는 elements 가 빈 배열이다. 여기서 실제 정의로 덮는다.
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app" },
        // src/proxy.ts 는 Next 16 의 요청 경계 가드다. Next 가 이 경로를 강제해서 옮길 수 없는데
        // src/ 최상위 파일이라 어떤 폴더 패턴에도 걸리지 않아 no-unknown-files 로 드러났다.
        // 의존 순서상 라우팅과 같은 최상위여서 app 으로 잡는다 — 실제 import 도
        // app(auth-cookies)과 shared(routes) 뿐이고, 이제 이 파일이 하위 레이어를 건너뛰어
        // 무언가를 끌어오면 app 폴더의 파일과 똑같이 걸린다. 같은 의존 방향을 갖는
        // proxy.test.ts 도 이 패턴에 함께 걸린다.
        //
        // mode: "file" 은 v7 에서 deprecated 다(린트마다 경고 한 줄이 찍힌다). 그런데도 쓰는 이유는
        // 대체재가 이 자리를 못 채우기 때문이다. element 패턴은 폴더만 잡고, 후속 API 인
        // boundaries/files 는 파일에 category 만 붙일 뿐 element type 을 주지 않아
        // from.type 이 비어 dependencies 의 모든 정책이 어긋난다(실제로 넣어 보고 확인했다).
        // 즉 지금 이 파일에 의존 방향을 강제할 수 있는 방법은 이것뿐이다.
        { type: "app", pattern: "src/proxy*.ts", mode: "file" },
        { type: "pages", pattern: "src/_pages/*", capture: ["slice"] },
        { type: "widgets", pattern: "src/widgets/*", capture: ["slice"] },
        { type: "features", pattern: "src/features/*", capture: ["slice"] },
        { type: "entities", pattern: "src/entities/*", capture: ["slice"] },
        { type: "shared", pattern: "src/shared" },
        // 스타터가 제공한 이벤트 로거. 파일 자체는 globalIgnores 로 검사 대상이 아니지만,
        // 이걸 import 하는 우리 코드는 검사 대상이라 element 로 분류해 두어야 한다.
        // 분류가 없으면 boundaries/no-unknown 이 import 하는 쪽을 막는다.
        // 프레임워크와 도메인을 모르는 하부 인프라라 shared 로 본다.
        { type: "shared", pattern: "src/analytics" },
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
