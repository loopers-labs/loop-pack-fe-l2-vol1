// vitest 전역 setup.
// - jest-dom matcher(toBeDisabled 등) 등록
// - globals를 켜지 않으므로 RTL 자동 cleanup이 안 걸린다. 매 테스트 후 직접 정리한다.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
