import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from '@/test/mocks/server';

// [AI] next/navigation의 App Router 컨텍스트는 테스트에 없다(Next 앱 밖에서 렌더).
// useRouter를 쓰는 컴포넌트(예: Header의 로그아웃 후 이동)가 테스트마다 깨지지 않도록
// 공용 모킹을 둔다. 라우팅 자체를 검증하는 테스트가 필요해지면 그때 파일 단위로 정교하게 덮어쓴다.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
