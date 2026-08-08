// AI 생성: SSR 프리페치용 서버 전용 QueryClient 팩토리. 호출할 때마다 새 인스턴스를 만들어
// generateMetadata와 본문이 캐시를 공유하지 않게 한다. 두 경로의 중복 요청은 같은 render/request에서
// URL·options가 같은 native fetch가 memoization되어 사라진다.
import { QueryClient } from '@tanstack/react-query';

export const getQueryClient = () => new QueryClient({ defaultOptions: { queries: { staleTime: 20 * 1000 } } });
