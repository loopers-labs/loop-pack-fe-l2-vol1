/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const strykerConfig = {
  testRunner: "vitest",
  packageManager: "pnpm",
  plugins: ["@stryker-mutator/vitest-runner"],
  reporters: ["clear-text", "progress", "html"],
  mutate: [
    "src/shared/lib/id-set/idSet.ts",
    "src/_pages/products/model/searchParams.ts",
    "src/_pages/products/queries/productQueries.ts",
    "src/entities/cart/model/cartPersistence.ts",
    "src/entities/wishlist/model/wishlistPersistence.ts",
  ],
  vitest: {
    configFile: "vitest.config.ts",
    related: true,
  },
};

export default strykerConfig;
