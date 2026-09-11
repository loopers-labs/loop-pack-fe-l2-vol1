import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';

// 6주차에 정한 FSD 의존 방향을 결정적 게이트로 내린다 (10주차 5단계).
// 규칙 자체는 docs/rfc/week06-fsd.md에 6주차부터 있었지만 **문서에만** 있었고,
// 그래서 10주 동안 사람 리뷰도 AI 리뷰도 잡지 못했다. 실제로 위반이 남아 있었다.
//
// 레이어 순서(왼쪽이 하위): shared → entities → features → _pages → app
// 상위가 하위를 쓰는 것이 정방향이다. 막는 건 역방향과, 같은 레이어 슬라이스 간 직접 import다.
const FSD_LAYERS = ['shared', 'entities', 'features', '_pages', 'app'];

// 슬라이스로 나뉘는 레이어만 같은 레이어끼리도 막는다. 6주차 문서의 금지 예시가 이 둘이다.
// shared와 app은 슬라이스 구조가 아니라 내부 참조가 정상이므로 제외한다
// (예: shared/test/render.tsx → @/shared/api/query-client).
const FSD_SLICED = new Set(['entities', 'features']);

function fsdBoundary(layer) {
  const higher = FSD_LAYERS.slice(FSD_LAYERS.indexOf(layer) + 1);
  const patterns = higher.map((upper) => ({
    group: [`@/${upper}/*`, `@/${upper}/*/**`],
    message: `FSD 역방향 import — ${layer}는 상위 레이어(${upper})를 알면 안 된다. 조합은 상위에서 한다. 근거: docs/rfc/week06-fsd.md`,
  }));

  if (FSD_SLICED.has(layer)) {
    patterns.push({
      group: [`@/${layer}/*`, `@/${layer}/*/**`],
      message: `같은 레이어의 다른 슬라이스를 직접 import — 슬라이스끼리는 서로 모른다. 조합은 상위 레이어에서, 슬라이스 내부는 상대 경로로. 근거: docs/rfc/week06-fsd.md`,
    });
  }

  return {
    files: [`src/${layer}/**/*.{ts,tsx}`],
    // 테스트 파일은 제외한다. 통합 테스트는 여러 슬라이스를 한 화면에 조합하는 것이 본질이고,
    // 그 조합은 배포되는 결합이 아니다. 막으면 정상 코드를 막는 오탐이 된다 — 실제로
    // AddToCartButton.dom.test.tsx가 헤더(app)와 다른 feature의 버튼을 함께 렌더해
    // "둘이 같은 스토어를 보는가"를 검증한다. 그 조합이 곧 검증 대상이다.
    ignores: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': ['error', { patterns }],
    },
  };
}

export default tseslint.config(
  {
    ignores: [
      '.next',
      'out',
      'build',
      'next-env.d.ts',
      // Stryker 샌드박스(계측 사본)와 리포트 — 소스가 아니다
      '.stryker-tmp',
      'reports',
    ],
  },

  {
    files: ['**/*.{ts,mts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: { version: '19.2' },
    },
    plugins: {
      'react-hooks': reactHooks,
      '@next/next': next,
    },
    rules: {
      // Next 도메인 룰: typescript-eslint/react가 모르는 Next 고유 실수(next/image·<Link>·
      // next/script 등)를 잡는다. eslint-config-next 번들 대신 플러그인만 얹는다 — 번들이 내
      // recommendedTypeChecked와 겹쳐 규칙 우선순위가 불투명해지므로.
      // preset(recommended+core-web-vitals)은 통째 채택하고, Pages Router 전용이라 App Router에선
      // inert한 룰도 끄지 않는다(하이브리드 대비 + preset drift 방지).
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,

      // 심각도 결정(근거): core-web-vitals가 warn으로 두지만, 이건 성능 힌트가 아니라
      // 정확성 footgun(async client component는 의도대로 동작 안 함)이라 게이트에서 막는다.
      '@next/next/no-async-client-component': 'error',

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      eqeqeq: 'error',
      // Playwright fixture는 첫 인자를 반드시 객체 구조분해로 써야 한다(의존 fixture를 이름으로 읽음).
      // 의존이 없으면 `{}`가 되므로, 매개변수 자리의 빈 패턴만 허용한다.
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // 스타터 API 테스트 한정: Response.json()이 any를 반환한다(NextResponse<Body>의 Body가
  // json()에 안 이어짐). 검증은 expect가 하므로 no-unsafe-*만 끈다. 내 코드는 엄격도 유지.
  {
    files: ['src/app/api/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },

  // 개발 확인용 프로바이더 한정: 콘솔 출력이 이 파일의 역할이다(스타터 제공).
  // 규칙을 전역으로 풀지 않고 파일 하나로 범위를 좁힌다.
  {
    files: ['src/analytics/consoleProvider.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // app은 최상위라 역방향이 없고 슬라이스도 아니므로 대상이 아니다.
  fsdBoundary('shared'),
  fsdBoundary('entities'),
  fsdBoundary('features'),
  fsdBoundary('_pages'),

  eslintConfigPrettier,
);
