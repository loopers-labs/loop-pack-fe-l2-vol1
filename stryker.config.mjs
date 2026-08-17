/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const strykerConfig = {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  reporters: ['clear-text', 'progress', 'html', 'json'],
  mutate: [
    'src/views/product-list/model/ProductListStatePolicy.ts',
    'src/entities/product/model/ProductListRouteParams.ts',
    'src/entities/product/model/ProductQueryKeyFactory.ts',
  ],
  coverageAnalysis: 'perTest',
  ignorePatterns: ['.codegraph', '.local', 'node_modules', '.next', 'out'],
  vitest: {
    configFile: 'vitest.stryker.config.ts',
  },
}

export default strykerConfig
