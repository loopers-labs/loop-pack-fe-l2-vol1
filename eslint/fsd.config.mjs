import boundaries from 'eslint-plugin-boundaries'

const FSD_LAYERS = ['_app', '_pages', 'widgets', 'features', 'entities', 'shared']
const SLICED_LAYERS = ['_pages', 'widgets', 'features', 'entities']

const isSliced = (layer) => SLICED_LAYERS.includes(layer)

const lowerLayersOf = (layer) => FSD_LAYERS.slice(FSD_LAYERS.indexOf(layer) + 1)

const elements = [
  {
    type: 'entity-cross',
    pattern: 'src/entities/*/@x',
    capture: ['owner'],
  },
  ...FSD_LAYERS.map((layer) =>
    isSliced(layer)
      ? { type: layer, pattern: `src/${layer}/*`, capture: ['slice'] }
      : { type: layer, pattern: `src/${layer}` },
  ),
  // 더 구체적인 app/api를 먼저 선언해 일반 라우트 조합과 Route Handler를 구분한다.
  { type: 'next-api', pattern: 'app/api' },
  { type: 'next-app', pattern: 'app' },
]

const sameSliceOf = (layer) => ({
  element: {
    type: layer,
    captured: { slice: '{{from.element.captured.slice}}' },
  },
})

const policies = [
  {
    from: { element: { type: 'next-api' } },
    allow: {
      // Route Handler와 mock fixture는 화면 조합 계층을 거치지 않는다.
      to: ['next-api', 'entities', 'shared'].map((type) => ({ element: { type } })),
    },
  },
  {
    from: { element: { type: 'next-app' } },
    allow: {
      to: ['next-app', ...FSD_LAYERS].map((type) => ({ element: { type } })),
    },
  },
  {
    // @x 파일은 자기 entity의 내부 타입을 특정 소비 entity에만 다시 내보내는 자리다.
    // owner와 같은 슬라이스만 허용해, 남의 entity 타입을 대신 공개하지 못하게 막는다.
    from: { element: { type: 'entity-cross' } },
    allow: {
      to: [
        {
          element: {
            type: 'entities',
            captured: { slice: '{{from.element.captured.owner}}' },
          },
        },
      ],
    },
  },
  ...FSD_LAYERS.map((layer) => ({
    from: { element: { type: layer } },
    allow: {
      to: [
        ...lowerLayersOf(layer).map((lowerLayer) => ({
          element: { type: lowerLayer },
        })),
        isSliced(layer) ? sameSliceOf(layer) : { element: { type: layer } },
        ...(layer === 'entities' ? [{ element: { type: 'entity-cross' } }] : []),
      ],
    },
  })),
]

const fsdConfig = {
  files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
  plugins: { boundaries },
  settings: {
    'boundaries/include': ['src/{_app,_pages,widgets,features,entities,shared}/**/*', 'app/**/*'],
    'boundaries/elements': elements,
    'import/resolver': {
      typescript: { alwaysTryTypes: true },
    },
  },
  rules: {
    'boundaries/dependencies': ['error', { default: 'disallow', policies }],
    'boundaries/no-unknown-dependencies': 'error',
    'boundaries/no-unknown-files': 'error',
  },
}

export default fsdConfig
