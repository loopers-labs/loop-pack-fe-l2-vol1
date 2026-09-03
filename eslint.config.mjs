import { defineConfig, globalIgnores } from 'eslint/config';
// nextVitals(core-web-vitals)가 어떤 규칙을 담고 있고 왜 그 값(warn/error)인지는 docs/eslint-rules.md 참고.
import nextVitals from 'eslint-config-next/core-web-vitals';
// nextTs(typescript)가 어떤 규칙을 담고 있는지도 docs/eslint-rules.md 참고.
// (타입 추론이 필요한 규칙은 없음 — parserOptions.project가 꺼져 있어 타입 정보 자체를 못 봄)
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';

const eslintConfig = defineConfig([
  ...nextVitals.map((config) => ({
    ...config,
    plugins: {
      ...config.plugins,
      'react-hooks': reactHooks,
    },
  })),
  ...nextTs,
  prettierConfig,
  // FSD 의존성 하네스 — 6주차 RFC(docs/rfc/week06-fsd.md)의 레이어 정의를 기계로 강제한다.
  // 규칙: ① 상위 레이어만 하위 레이어를 import할 수 있다 ② 같은 레이어의 다른 슬라이스는 직접 import할 수 없다(같은 슬라이스 내부는 허용).
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'widgets', pattern: 'src/widgets/*/**', capture: ['slice'] },
        { type: 'features', pattern: 'src/features/*/**', capture: ['slice'] },
        { type: 'entities', pattern: 'src/entities/*/**', capture: ['slice'] },
        { type: 'shared', pattern: 'src/shared/**' },
        // 계측은 FSD 슬라이스가 아니라 가로지르는 기반 모듈이다. 어느 레이어에도 넣지 않으면
        // boundaries가 이 폴더를 아예 검사하지 않아(위반을 주입해 확인함) A-8의 분리가
        // 개발자 주의에만 기대게 된다. 별도 타입으로 등록해 허용 방향을 명시한다.
        { type: 'analytics', pattern: 'src/analytics/**' },
      ],
      // 테스트 파일은 "test" 카테고리로 분류 — 통합 테스트가 여러 슬라이스를 가로질러 import해야
      // 하는 건 정상이라, 아래 정책에서 이 카테고리만 예외로 허용한다.
      'boundaries/files': [{ category: 'test', pattern: '**/*.test.{ts,tsx}' }],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // 테스트 파일은 레이어/슬라이스 규칙 대상에서 제외 — 통합 검증이 목적이라 자유롭게 import 가능
            {
              from: { file: { categories: 'test' } },
              allow: {
                to: {
                  element: {
                    types: ['app', 'widgets', 'features', 'entities', 'shared', 'analytics'],
                  },
                },
              },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            {
              from: { element: { type: 'entities' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            {
              from: { element: { type: 'entities' } },
              allow: {
                to: {
                  element: {
                    type: 'entities',
                    captured: { slice: '{{from.element.captured.slice}}' },
                  },
                },
              },
            },
            // 다른 슬라이스라도 타입 전용 참조(예: Product.category: CategoryId)는 예외로 허용.
            // 값(런타임 로직) import는 여전히 금지 — 아래 default: 'disallow'로 막힘.
            {
              from: { element: { type: 'entities' } },
              allow: { to: { element: { type: 'entities' } } },
              dependency: { kind: 'type' },
            },
            // 계측은 shared와 자기 자신만 값으로 참조한다. 이벤트 프로퍼티가 도메인 용어를
            // 그대로 쓰도록 entities는 타입 전용으로만 연다 — 값까지 열면 계측이 도메인 로직을
            // 끌고 들어와, 화면과 분리했다는 A-8의 전제가 무너진다.
            {
              from: { element: { type: 'analytics' } },
              allow: { to: { element: { types: ['shared', 'analytics'] } } },
            },
            {
              from: { element: { type: 'analytics' } },
              allow: { to: { element: { type: 'entities' } } },
              dependency: { kind: 'type' },
            },
            {
              from: { element: { type: 'features' } },
              allow: { to: { element: { types: ['shared', 'entities', 'analytics'] } } },
            },
            {
              from: { element: { type: 'features' } },
              allow: {
                to: {
                  element: {
                    type: 'features',
                    captured: { slice: '{{from.element.captured.slice}}' },
                  },
                },
              },
            },
            {
              from: { element: { type: 'widgets' } },
              allow: { to: { element: { types: ['shared', 'entities', 'features', 'analytics'] } } },
            },
            {
              from: { element: { type: 'widgets' } },
              allow: {
                to: {
                  element: {
                    type: 'widgets',
                    captured: { slice: '{{from.element.captured.slice}}' },
                  },
                },
              },
            },
            {
              from: { element: { type: 'app' } },
              allow: {
                to: {
                  element: { types: ['shared', 'entities', 'features', 'widgets', 'analytics'] },
                },
              },
            },
          ],
        },
      ],
    },
  },
  // Edge 런타임 경계 — src/proxy.ts는 Edge에서 돈다.
  // node:crypto를 쓰는 src/app/api/_data/auth.ts가 여기로 딸려 들어오면 next build는 경고만 내고
  // 통과한 뒤 실제 요청에서 500이 난다. 빌드로 잡히지 않는 실수라 규칙으로 막는다.
  //
  // boundaries/elements로는 막을 수 없다 — element 패턴은 폴더만 매칭해서 루트 파일인
  // src/proxy.ts가 어떤 element에도 분류되지 않고, 그러면 boundaries/dependencies가 이 파일을
  // 아예 검사하지 않는다(위반을 주입해 확인함). 그래서 파일 범위 규칙으로 직접 막는다.
  {
    files: ['src/proxy.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '@/entities/*', '@/features/*', '@/widgets/*'],
              message:
                'proxy는 Edge에서 돈다. shared(@/shared/*)만 참조할 것 — 상위 레이어는 Node 전용 모듈을 끌고 올 수 있고, 그 실패는 build가 아니라 실행에서 500으로 나타난다.',
            },
            {
              group: ['node:*'],
              message: 'Edge 런타임에는 Node 내장 모듈이 없다.',
            },
          ],
        },
      ],
    },
  },
  {
    // react-hooks 플러그인은 nextVitals가 '**/*.{js,jsx,mjs,ts,tsx,mts,cts}'에만 등록함(.cjs 등은 제외).
    // 이 블록도 같은 범위로 제한하지 않으면 commitlint.config.cjs 같은 파일에서
    // "plugin 없이 react-hooks/exhaustive-deps 룰만 적용"되어 ESLint가 전체 실행 중단됨.
    // 파일 범위(files)만으로는 nextVitals의 병합 순서에 기대게 되어 불안정할 수 있어,
    // 이 설정 객체 안에서 플러그인을 직접 선언해 nextVitals 병합 여부와 무관하게 항상 해석되도록 함.
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    rules: {
      // 아래 5개는 nextVitals/nextTs 기본값과 완전히 같은 값이라 재선언해도 실제 동작에는 아무 효과가 없는 중복(no-op)이라 주석 처리함.
      // 'react/react-in-jsx-scope': 'off', // nextVitals 기본값이 이미 'off'
      // 'react-hooks/rules-of-hooks': 'error', // nextVitals 기본값이 이미 'error'
      // '@typescript-eslint/no-explicit-any': 'error', // nextTs 기본값이 이미 'error'
      // '@typescript-eslint/ban-ts-comment': 'error', // nextTs 기본값이 이미 'error'
      // '@typescript-eslint/no-unused-vars': 'warn', // nextTs 기본값이 이미 'warn'

      'react-hooks/exhaustive-deps': 'error', //변경될 값을 주시하며 변경 필요. 누락시 버그 발생 가능
      '@typescript-eslint/consistent-type-imports': 'error', //타입을 런타임에 가져올 경우 번들 사이즈가 커지므로 type FOO로 import하도록 강제
      'react/jsx-no-target-blank': 'error', //target="_blank" 보안 : target='_blank' 사용 시 탭에서 window.opener로 페이지 조작 가능 방지
      'react/no-danger': 'error', //dangerouslySetInnerHTML : 악성 스크립트 실행 방지 (XSS 공격 방지)
      'no-eval': 'error', //eval() 금지 : 악성 스크립트 실행 방지 (XSS 공격 방지)
      'no-console': ['error', { allow: ['warn'] }], //console.log 잔재 확인 : 프로덕션 번들에 디버깅 로그가 실리는 것을 막기 위해 error로 처리, warn은 에외처리
      'no-magic-numbers': ['warn', { ignore: [0, 1, 2, -1, 24, 60, 100, 1000] }], // 고정값 상수로 관리하도록 warn 처리. 단, 0(초기값/인덱스), 1(증감), -1(indexOf 실패),
      // 24/60/1000(시간 단위 변환), 100(퍼센트) 제외 — 의미가 자명한 단위값
      'no-nested-ternary': 'error', //삼항 연산자 중첩 사용 시 가독성 저하로 error 처리
      'no-empty': 'error', //빈 블록으로 에러를 무시하는 것을 방지
      'no-var': 'error', //var 사용 금지, const/let 사용 강제 (nextTs 기본값은 .ts/.tsx만 대상이라, .js/.mjs까지 넓히기 위해 재선언)
      'jsx-a11y/alt-text': 'error', // 접근성(a11y) 초기부터 강제. 나중에 추가 시 공수가 크므로 error로 처리

      // 접근성은 명확함이 중요 — aria/role 태그를 쓰는 순간 그 실수는 반드시 잡아야 한다는 원칙으로 jsx-a11y 6개 전부 error.
      'jsx-a11y/aria-props': 'error', // 존재하지 않는/오타난 aria-* 속성명은 스크린리더가 조용히 무시함 — 접근성을 넣었다는 착각만 남기고 방치되는 오류
      'jsx-a11y/aria-proptypes': 'error', // aria-* 값 타입이 틀리면 보조기기가 값을 못 읽거나 잘못 해석 — 조용히 실패하는 케이스
      'jsx-a11y/aria-unsupported-elements': 'error', // <meta>/<html>/<script> 등 의미 없는 태그에 aria-*/role 붙이는 실수를 조용히 넘어가면 안 됨
      'jsx-a11y/role-has-required-aria-props': 'error', // role은 있는데 필수 aria-*가 빠지면 반쪽짜리 — 태그를 쓴 이상 완전해야 함
      'jsx-a11y/role-supports-aria-props': 'error', // 그 role이 지원하지 않는 aria-*를 붙이는 실수도 조용히 넘어가면 안 됨

      // 아래 4개는 nextVitals 기본값이 'warn'이지만, docs/eslint-rules.md에서 논의 후 error로 올리기로 한 것들.
      '@next/next/no-async-client-component': 'error', // "use client" 컴포넌트를 async로 선언하면 항상 깨지는 케이스라 warn으로 둘 이유가 없음
      '@next/next/no-before-interactive-script-outside-document': 'error', // 루트 레이아웃 밖에 beforeInteractive 스크립트를 두는 비정상 케이스만 잡는 규칙 — 정상적인 루트 사용은 안 걸림
      '@next/next/no-typos': 'error', // Next 예약 함수명 오타는 조용히 무시돼서 버그를 숨기는 셈 — warn으로는 놓치기 쉬움
      '@next/next/no-unwanted-polyfillio': 'error', // Next가 이미 자동 처리하는 폴리필을 실수로 중복 추가하는 걸 확실히 막기 위함

      'prefer-rest-params': 'off', // nextTs 기본값은 error지만, arguments 대신 rest 파라미터를 쓰는 건 스타일 차이라 강제로 막을 필요 없다고 판단
      '@typescript-eslint/no-unused-expressions': 'error', // nextTs 기본값은 warn이지만, 결과를 안 쓰더라도 연산 자체는 실행되므로 if/return/= 빼먹은 실수를 명확히 잡기 위해 error로 올림

      // 타입 인지(type-aware) 린트로 tsc 타입체커가 함께 돌아야 동작함. -> lint 실행시 프로젝트 전체 타입체크 실행 (느려짐)
      // 아직 Server Action 등 실제 async 서버 로직이 없어 주석처리
      // "@typescript-eslint/no-floating-promises": "error", // await 안 한 Promise(Server Action 등) 방치 방지
      // "@typescript-eslint/no-misused-promises": "error", // onClick={async () => ...} 같은 오용 방지
    },
    settings: {
      // next/image의 <Image>는 native <img>가 아니라서 jsx-a11y가 기본적으로 검사 대상에서 제외하기에 추가
      'jsx-a11y': {
        components: {
          Image: 'img',
        },
      },
    },
  },
  // 이벤트 로거는 콘솔 출력이 목적이라 no-console을 끈다.
  // 이 규칙은 "디버깅 로그가 프로덕션 번들에 실리는 것"을 막으려는 것인데,
  // consoleProvider는 개발 중 확인용 프로바이더로 콘솔에 찍는 게 존재 이유이고
  // logger는 프로바이더 초기화·전송 실패를 알리는 자리다. 프로덕션 번들에서는
  // next.config.ts의 removeConsole이 error를 뺀 나머지를 걷어낸다.
  {
    files: ['src/analytics/**/*.ts'],
    rules: {
      'no-console': 'warn',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'dist/**', // 빌드 산출물 제외하기 위해 추가
    '.claude/**', //이 프로젝트와 무관한 격리된 git worktree 제외하기 위해 추가
    'docs/local/**', //gitignore된 로컬 작업물(분석 스크립트 등) 제외
  ]),
]);

export default eslintConfig;
