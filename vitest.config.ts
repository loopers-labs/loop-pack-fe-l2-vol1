import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
};

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
          exclude: [
            '**/node_modules/**',
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
            'src/app/products/error.test.tsx',
          ],
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
        /* AI-generated : next/navigation은 HomeView 한 곳에서만 쓰여 사전 스캔에 잡히지 않는다.
           테스트 도중 처음 발견되면 재번들 → 페이지 리로드가 일어나 vi.mock 등록이 날아가고
           useRouter가 실제 모듈로 로드돼 실패한다(Vite 의존성 캐시가 빈 상태에서만 재현) */
        optimizeDeps: { include: ['next/navigation'] },
        test: {
          name: 'browser',
          include: [
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
            'src/app/products/error.test.tsx',
          ],
          setupFiles: ['./vitest.setup.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
