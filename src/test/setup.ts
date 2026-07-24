import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// vitest globals를 쓰지 않으므로 RTL 자동 cleanup을 직접 연결한다.
afterEach(() => {
  cleanup()
})
