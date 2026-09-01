import { vi } from 'vitest'

// next/navigation 대역이다. 테스트 파일 맨 위에서 이렇게 건다.
//   vi.mock('next/navigation', () => import('@/test/nextRouterMock'))
//
// 이동이 실제로 일어나지 않으므로, 어디로 보냈는지는 router.replace/push의 호출로 본다.

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}

let pathname = '/'
let searchParams = new URLSearchParams()

export const setLocation = (url: string) => {
  const [path, query = ''] = url.split('?')
  pathname = path
  searchParams = new URLSearchParams(query)
}

export const resetRouterMock = () => {
  Object.values(router).forEach((fn) => fn.mockReset())
  setLocation('/')
}

export const useRouter = () => router
export const usePathname = () => pathname
export const useSearchParams = () => searchParams
export const redirect = vi.fn()
