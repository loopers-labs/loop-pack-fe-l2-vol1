import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier/flat'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tailwindcss from 'eslint-plugin-tailwindcss'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const tsFiles = ['**/*.{ts,tsx}']
const reactFiles = ['**/*.{tsx,jsx}']
const jsConfigFiles = ['*.config.{js,mjs,cjs}', 'eslint.config.mjs']

const withFiles = (configs, files) =>
  configs.map((config) => ({
    ...config,
    files,
  }))

const restrictedSyntaxBase = [
  {
    message:
      'The comma operator is easy to misread. Split this into separate statements instead.',
    selector: 'SequenceExpression',
  },
]

const restrictedSyntaxNoSrcDefaultExport = [
  ...restrictedSyntaxBase,
  {
    message:
      'Default exports hide module intent. Use named exports unless this file is a framework/bootstrap entry point with documented justification.',
    selector: 'ExportDefaultDeclaration',
  },
]

const restrictedSyntaxReactRendering = [
  ...restrictedSyntaxNoSrcDefaultExport,
  {
    message: 'Use Suspense from @suspensive/react instead of React.Suspense.',
    selector:
      "JSXMemberExpression[object.name='React'][property.name='Suspense']",
  },
  {
    message:
      'Use <Show /> from @ilokesto/utilinent instead of inline logical conditional rendering in JSX children.',
    selector: 'JSXElement > JSXExpressionContainer > LogicalExpression',
  },
  {
    message:
      'Use <Show /> from @ilokesto/utilinent instead of inline logical conditional rendering in JSX children.',
    selector: 'JSXFragment > JSXExpressionContainer > LogicalExpression',
  },
  {
    message:
      'Use <Show /> from @ilokesto/utilinent instead of inline ternary conditional rendering in JSX children.',
    selector: 'JSXElement > JSXExpressionContainer > ConditionalExpression',
  },
  {
    message:
      'Use <Show /> from @ilokesto/utilinent instead of inline ternary conditional rendering in JSX children.',
    selector: 'JSXFragment > JSXExpressionContainer > ConditionalExpression',
  },
  {
    message:
      'Use <For /> from @ilokesto/utilinent instead of inline array.map rendering in JSX children.',
    selector:
      "JSXElement > JSXExpressionContainer > CallExpression[callee.property.name='map']",
  },
  {
    message:
      'Use <For /> from @ilokesto/utilinent instead of inline array.map rendering in JSX children.',
    selector:
      "JSXFragment > JSXExpressionContainer > CallExpression[callee.property.name='map']",
  },
]

const restrictedSyntaxExplicitIndexExports = [
  ...restrictedSyntaxNoSrcDefaultExport,
  {
    message:
      'FSD public APIs must explicitly list exports. Do not use export * from index.ts.',
    selector: 'ExportAllDeclaration',
  },
]

const restrictedSyntaxLibUtilities = [
  ...restrictedSyntaxReactRendering,
  {
    message:
      'FSD public APIs must explicitly list exports. Do not use export * from index.ts.',
    selector: 'ExportAllDeclaration',
  },
  {
    message:
      'Group exported utilities as namespace class static methods instead of exporting standalone functions from lib files. React hooks named useX are exempt.',
    selector:
      'ExportNamedDeclaration > FunctionDeclaration:not([id.name=/^use[A-Z0-9]/])',
  },
  {
    message:
      'Group exported utilities as namespace class static methods instead of exporting standalone arrow functions from lib files. React hooks named useX are exempt.',
    selector:
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[init.type='ArrowFunctionExpression']:not([id.name=/^use[A-Z0-9]/])",
  },
  {
    message:
      'Group exported utilities as namespace class static methods instead of exporting standalone function expressions from lib files. React hooks named useX are exempt.',
    selector:
      "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[init.type='FunctionExpression']:not([id.name=/^use[A-Z0-9]/])",
  },
]

const eslintConfig = defineConfig([
  globalIgnores(['dist/**', 'coverage/**']),
  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
  },

  js.configs.recommended,
  {
    files: jsConfigFiles,
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
      sourceType: 'module',
    },
  },

  ...withFiles(tseslint.configs.strictTypeChecked, tsFiles),
  {
    files: tsFiles,
    languageOptions: {
      ecmaVersion: 2023,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-check': true,
          'ts-expect-error': true,
          'ts-ignore': true,
          'ts-nocheck': true,
        },
      ],
      '@typescript-eslint/array-type': [
        'error',
        { default: 'generic', readonly: 'generic' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'never',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unused-vars': 'off',

      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          vars: 'all',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    ...react.configs.flat.recommended,
    files: reactFiles,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: globals.browser,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ...react.configs.flat['jsx-runtime'],
    files: reactFiles,
  },
  {
    ...reactHooks.configs.flat['recommended-latest'],
    files: reactFiles,
    rules: {
      ...reactHooks.configs.flat['recommended-latest'].rules,
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    ...jsxA11y.flatConfigs.recommended,
    files: reactFiles,
    languageOptions: {
      ...jsxA11y.flatConfigs.recommended.languageOptions,
      globals: globals.browser,
    },
  },
  {
    ...reactRefresh.configs.vite,
    files: reactFiles,
  },
  {
    extends: [tailwindcss.configs.recommended],
    files: ['**/*.{js,jsx,ts,tsx}'],
    settings: {
      tailwindcss: {
        cssConfigPath: './src/index.css',
        functions: [
          'classnames',
          'classNames',
          'clsx',
          'ctl',
          'cva',
          'tv',
          'tw',
          'twMerge',
          'twJoin',
          'cn',
          'cx',
          'cnMerge',
        ],
        parseKeyFunctions: ['classnames', 'classNames', 'clsx'],
      },
    },
    rules: {
      'tailwindcss/no-custom-classname': [
        'warn',
        {
          whitelist: [
            'addr',
            'addr-summary',
            'between',
            'checkout',
            'checkout-primary-action',
            'className',
            'line',
            'row',
            'thumb',
            'total',
          ],
        },
      ],
    },
  },
  {
    files: reactFiles,
    rules: {
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': [
        'error',
        { children: 'never', props: 'never' },
      ],
      'react/jsx-no-target-blank': 'error',
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'function-declaration',
          unnamedComponents: 'function-expression',
        },
      ],
      'react/self-closing-comp': 'error',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-else-return': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              importNames: ['Suspense'],
              message:
                'Use Suspense from @suspensive/react so boundary behavior stays consistent across the project.',
              name: 'react',
            },
            {
              message:
                'Use ErrorBoundary from @suspensive/react instead of react-error-boundary.',
              name: 'react-error-boundary',
            },
            {
              importNames: [
                'useSuspenseInfiniteQuery',
                'useSuspenseQueries',
                'useSuspenseQuery',
              ],
              message:
                'Use SuspenseQuery, SuspenseQueries, or SuspenseInfiniteQuery components from @suspensive/react-query so suspense sources stay visible in JSX.',
              name: '@tanstack/react-query',
            },
            {
              importNames: [
                'useSuspenseInfiniteQuery',
                'useSuspenseQueries',
                'useSuspenseQuery',
              ],
              message:
                'Use SuspenseQuery, SuspenseQueries, or SuspenseInfiniteQuery components instead of suspense hooks.',
              name: '@suspensive/react-query',
            },
          ],
        },
      ],
      'no-restricted-syntax': ['error', ...restrictedSyntaxBase],
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...restrictedSyntaxReactRendering],
    },
  },
  {
    files: ['**/index.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...restrictedSyntaxExplicitIndexExports,
      ],
    },
  },
  {
    files: ['src/**/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...restrictedSyntaxLibUtilities],
    },
  },
  prettier,
])

export default eslintConfig
