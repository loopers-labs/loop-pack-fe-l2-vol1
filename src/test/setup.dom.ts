import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { installMockServer } from './msw/lifecycle'
import { resetStores } from './resetStores'

// DOM이 필요한 테스트의 setup이다. node setup이 하는 일에 화면과 전역 상태 정리를 더한다.
installMockServer()

// vitest globals를 쓰지 않으므로 RTL 자동 cleanup을 직접 연결한다.
// 전역 store는 모듈이라 파일 안에서 계속 살아 있다. 여기서 비우지 않으면
// 앞 테스트가 담은 상품이 다음 테스트의 헤더 개수에 남는다.
afterEach(() => {
  cleanup()
  resetStores()
})
