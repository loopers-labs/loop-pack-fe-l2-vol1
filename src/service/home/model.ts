import type { HomeResponse } from '@/types/commerce'

// 홈은 사용자 파라미터가 없다. scenario는 mock 검증 전용이라 클라이언트에서 보내지 않는다.
export type GetHomeResponse = HomeResponse
