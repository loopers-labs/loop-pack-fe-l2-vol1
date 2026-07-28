import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

// 서버 프리패치용 QueryClient. React cache로 같은 요청 안에서만 재사용하고 요청 간에는 분리한다.
// (클라이언트 QueryClient는 providers.tsx에서 useState로 따로 만든다.)
export const getServerQueryClient = cache(() => new QueryClient())
