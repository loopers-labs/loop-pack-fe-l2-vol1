import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
};
const TEST_ORIGIN = 'http://localhost:3000';

const domTests = [
  'src/features/product-filter/model/useProductListParams.test.tsx',
  'src/entities/wishlist/model/useWishlistStore.test.ts',
  'src/entities/cart/model/useCartStore.test.ts',
  'src/entities/product/ui/ProductCard.test.tsx',
  'src/widgets/header/ui/Header.test.tsx',
  'src/widgets/product-list-section/ui/ProductListSection.test.tsx',
  'src/features/toggle-wishlist/ui/ToggleWishlistButton.test.tsx',
  'src/features/add-to-cart/ui/AddToCartButton.test.tsx',
  'src/shared/ui/PageHeading/PageHeading.test.tsx',
  'src/shared/ui/QueryState/QueryState.test.tsx',
  'src/app/error.test.tsx',
  'src/app/(home)/error.test.tsx',
  'src/app/(home)/_ui/HomeView.test.tsx',
  'src/app/products/_ui/ProductView.test.tsx',
  'src/app/products/error.test.tsx',
];

export default defineConfig({
  resolve: { alias },
  define: {
    'process.env': JSON.stringify({ NODE_ENV: 'test' }),
  },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          exclude: ['**/node_modules/**', 'e2e/**', ...domTests],
          setupFiles: ['./test/msw/setup.ts'],
        },
      },
      {
        resolve: {
          alias: {
            ...alias,
            // "type": "module" 환경에서 next/image의 CJS 재수출이 esbuild에 이중으로 감싸지는 문제 회피 (test/mocks/next-image.tsx 참고)
            'next/image': fileURLToPath(new URL('./test/mocks/next-image.tsx', import.meta.url)),
          },
        },
        define: {
          'process.env': JSON.stringify({ NODE_ENV: 'test' }),
        },
        /* next/navigation은 HomeView 한 곳에서만 쓰여 사전 스캔에 잡히지 않으므로 명시적으로 포함한다. */
        optimizeDeps: { include: ['next/navigation'] },
        test: {
          name: 'dom',
          include: domTests,
          environment: 'jsdom',
          environmentOptions: {
            jsdom: { url: TEST_ORIGIN },
          },
          setupFiles: ['./test/msw/setup.ts', './vitest.setup.ts'],
        },
      },
    ],
  },
});
