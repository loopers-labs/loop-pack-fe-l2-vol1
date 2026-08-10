import { QueryClient } from '@tanstack/react-query'

// 서버 프리패치용 QueryClient. 호출할 때마다 새로 만든다.
// (클라이언트 QueryClient는 _app/providers/Providers.tsx에서 useState로 따로 만든다.)
//
// 원래 React cache()로 감싸 요청 단위로 공유했다. Step 6 서버 호출 계수에서 cache() 유무와 무관하게
// /api/home 요청이 1회로 같아, 요청을 합치던 것이 QueryClient 공유가 아니라 Next의 fetch
// memoization(같은 render에서 URL·options가 같은 native fetch는 한 번만 나간다)임을 확인했다.
// 요청을 넘어 사는 캐시를 만들지 않는 쪽이 안전해 cache()를 뗐다.
export const getServerQueryClient = () => new QueryClient()
