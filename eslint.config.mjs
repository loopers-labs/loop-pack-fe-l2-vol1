// ESLint flat config — AI 협업 하네스 (1주차 이식 → 4주차 Next 대응)
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import nextPlugin from "@next/eslint-plugin-next";

export default defineConfig(
  { ignores: ["dist", "node_modules", ".next", "next-env.d.ts"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      // Next: 클라이언트(브라우저) + 서버 컴포넌트/route(Node) 두 런타임 공존
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "@eslint-community/eslint-comments": eslintComments,
      "@next/next": nextPlugin,
    },
    rules: {
      // Next 전용 룰 (아래 "왜" 참고)
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // ── 1주차 정확성 룰 (그대로 유지) ──
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@eslint-community/eslint-comments/no-use": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/immutability": "error",
      "react-hooks/static-components": "error",
      "react-hooks/refs": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      eqeqeq: ["error", "always"],
      "no-empty": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      curly: ["error", "all"],
      "prefer-const": "error",
    },
  },
  {
    // ── 10주차 5단계 — 반복 지적을 결정적 룰로 승격 ──────────────────────────
    // 10주간 같은 결함을 **네 번** 만들었다. 전부 「단언이 '없음'이나 boolean을
    // 향해서 실패할 때 대신 무엇이 있었는지 말하지 못한다」는 하나의 뿌리다.
    //
    //   8주차  findByText(경계 문구)로 기다림 — 무엇이 없는지만 말한다
    //   9주차G refetchQueries 직후 findByText("expired") — 변이를 넣어도 초록불
    //   9주차H 메커니즘만 보고 호출부를 빠뜨려 mutation 4종이 변이를 통과
    //   9주차I aria-label 하나에 두 의미가 겹쳐 실패 원인이 안 갈림
    //
    // 그중 **결정적으로 판별 가능한 것**만 기계로 내린다.
    // 「없음을 조건 기반 대기로 확인하지 않는다」가 그것이다 — 폴링은 "아직 안
    // 바뀜"과 "바뀌지 않는 게 맞음"을 구분하지 못한다. 나머지(신호에 두 의미가
    // 겹쳤는지, 호출부를 봤는지)는 맥락 판단이라 AI·사람에 남긴다.
    //
    // `.claude/rules/testing.md`에 글로 적혀 있던 것을 여기로 옮긴 것이기도 하다.
    // 글은 매번 다시 읽어야 하고, 룰은 한 번 적으면 매 PR에 자동으로 적용된다.
    // 같은 지적을 네 번 받았다면 리뷰가 부족한 게 아니라 하네스가 비어 있다는 뜻이다.
    files: ["**/*.test.{ts,tsx}", "e2e/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // ⚠️ 첫 판은 `MemberExpression[property.name="not"]`만 봤다. 프로브를 돌려 두 결함을 찾았다.
          //   오탐 — `waitFor` 안의 `expect.not.objectContaining({...})`을 막았다.
          //          그건 부정 단언이 아니라 **matcher 헬퍼**다. `expect.not`은 object가
          //          식별자 `expect`이고, 막아야 하는 `expect(x).not`은 object가 호출식이다.
          //          그래서 `[object.callee.name="expect"]`로 좁힌다.
          //   누락 — `vi.waitFor(...)`는 callee가 MemberExpression이라 `callee.name`으로 안 잡혔다.
          //          두 번째 selector로 멤버 호출도 본다.
          //
          // 남는 한계: `import { waitFor as wf }`처럼 이름을 바꾸면 못 잡는다. 구문 규칙의
          // 한계이고, 이 레포는 전부 `waitFor`로 import하므로 좇지 않는다 — 변이 실험이 그
          // 자리를 맡는다. (「한계」로 쓰지만 원인을 알고 받아들인 트레이드오프다.)
          // `[object.callee.name="expect"]` 만 보면 `expect(p).resolves.not` ·
          // `.rejects.not` 체인을 놓친다(Codex 교차 검증). object 가 `expect(...)` 인 경우와
          // `expect(...).resolves` 인 경우를 둘 다 본다.
          selector: [
            'CallExpression[callee.name="waitFor"] MemberExpression[object.callee.name="expect"][property.name="not"]',
            'CallExpression[callee.property.name="waitFor"] MemberExpression[object.callee.name="expect"][property.name="not"]',
            'CallExpression[callee.name="waitFor"] MemberExpression[object.object.callee.name="expect"][object.property.name=/^(resolves|rejects)$/][property.name="not"]',
            'CallExpression[callee.property.name="waitFor"] MemberExpression[object.object.callee.name="expect"][object.property.name=/^(resolves|rejects)$/][property.name="not"]',
          ].join(","),
          message:
            "waitFor 안에서 부정 단언을 쓰지 않는다. 폴링은 '아직 안 바뀜'과 '바뀌지 않는 게 맞음'을 구분하지 못해서, 구현을 망가뜨려도 초록불이 된다(8주차·9주차 G절에서 실측). 사라지는 것은 waitForElementToBeRemoved로, 바뀌지 않는 것은 값을 직접 대조해서 확인한다.",
        },
        {
          selector:
            "CallExpression[callee.property.name=/^(toBeTruthy|toBeFalsy)$/] > .callee > .object",
          message:
            "toBeTruthy·toBeFalsy는 통과할 때만 정확하고 실패할 때 무엇이 있었는지 말하지 않는다. 값을 직접 대조한다(toBe·toEqual·toHaveTextContent).",
        },
        {
          // Codex 교차 검증: 복수형(getAllByTestId 등)과 문자열 프로퍼티
          // (`screen["getByTestId"]`)가 전부 빠져 있었다. 메시지는 "testid로 조회하지
          // 않는다"인데 강제 범위가 그보다 좁았다 — 메시지가 거짓이 되지 않게 넓힌다.
          // 구조 분해(`const { getByTestId } = render(...)`)는 못 잡는다(binding 추적이
          // 필요하다). 알고 받아들이는 한계다.
          selector:
            "MemberExpression[property.name=/^(get|query|find)(All)?ByTestId$/]," +
            "MemberExpression[property.value=/^(get|query|find)(All)?ByTestId$/]",
          message:
            "testid로 조회하지 않는다. 역할·라벨로 조회하면 접근성 계약을 함께 검증하고, testid는 화면이 실제로 읽히는지 말해 주지 않는다.",
        },
        {
          // querySelectorAll 도 같은 문제다(Codex 교차 검증).
          // `render(...).container.querySelector` 나 이름을 바꾼 binding 은 못 잡는다.
          selector:
            'MemberExpression[object.name="container"][property.name=/^querySelectorAll?$/]',
          message:
            "container.querySelector로 조회하지 않는다. 구현 구조(클래스·태그)에 묶여서 리팩터링마다 깨지고, 사용자가 보는 것과 무관하다.",
        },
      ],
    },
  },
  {
    // 측정용 학습 픽스처: 제품 코드가 아니라 성능 Before를 재현하는 견본이다.
    // 룰을 끄는 것이 아니라 적용 범위를 좁히는 선언 —
    // 이유가 붙은 한 줄 억제만 허용하고, 파일 전체 억제는 여기서도 금지한다.
    files: ["src/examples/**/*.{ts,tsx}"],
    rules: {
      "@eslint-community/eslint-comments/no-use": [
        "error",
        { allow: ["eslint-disable-next-line"] },
      ],
      "@eslint-community/eslint-comments/require-description": "error",
    },
  },
  eslintConfigPrettier,
);
