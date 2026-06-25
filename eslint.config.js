import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier"
import {defineConfig} from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        plugins: {
            js,
            'jsx-a11y': jsxA11y
        },
        extends: ["js/recommended"],
        languageOptions: {globals: globals.browser}
    },
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    reactHooks.configs.flat["recommended-latest"],
    prettier,
    {
        rules: {
            "react/react-in-jsx-scope": "off", // JSX 변환방법이 변경되어 React 17+ 에서는 불필요
            "react-hooks/rules-of-hooks": "error", //hook을 잘못된 위치(조건문)에서 호출할 경우, 렌더링 호출 순서가 달라 버그 유발 가능
            "react-hooks/exhaustive-deps": "error", //변경될 값을 주시하며 변경 필요. 누락시 버그 발생 가능
            "@typescript-eslint/consistent-type-imports": "error", //타입을 런타임에 가져올 경우 번들 사이즈가 커지므로 type FOO로 import하도록 강제
            "react/jsx-no-target-blank": "error", //target="_blank" 보안 : target='_blank' 사용 시 탭에서 window.opener로 페이지 조작 가능 방지
            "react/no-danger": "error", //dangerouslySetInnerHTML : 악성 스크립트 실행 방지 (XSS 공격 방지)
            "no-eval": "error", //eval() 금지 : 악성 스크립트 실행 방지 (XSS 공격 방지)
            "no-console": "warn", //console.log 잔재 확인 : 개발 중 디버깅 용으로 사용할 수 있어 warn으로 처리. (CI/CD 도입 시 error로 분기처리 필요)
            "@typescript-eslint/no-explicit-any": "error", //any 사용 막기 :  any사용시 타입 검사가 없어 ts확인 불가능. 타입 확인 강제하기 위해서 사용
            "@typescript-eslint/ban-ts-comment": "error", //ts-ignore, ts-nocheck 같은 주석으로 TypeScript 에러를 숨기는거 방지
            "no-magic-numbers": [
                "error",
                {"ignore": [0, 1, -1]}
            ], // 고정값 상수로 관리하도록 강제. 단, 0(초기값/인덱스), 1(증감), -1(indexOf 실패) 제외
            "no-nested-ternary": "error", //삼항 연산자 중첩 사용 시 가독성 저하로 error 처리
            "no-empty": "error", //빈 블록으로 에러를 무시하는 것을 방지
            "no-var": "error", //var 사용 금지, const/let 사용 강제
            "@typescript-eslint/no-unused-vars": "warn", //쓰지 않는 변수 warn 처리 : 개발 중 임시로 변수 선언하는 경우로 warn으로 처리
            "jsx-a11y/alt-text": "error", // 접근성(a11y) 초기부터 강제. 나중에 추가 시 공수가 크므로 error로 처리
        }
    }
]);
