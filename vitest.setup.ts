import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/shared/test/msw-server'

// jsdom(30 기준)은 <dialog>의 showModal/close를 구현하지 않는다. ConfirmDialog는 이 API로만 열리므로
// 없으면 렌더가 TypeError로 죽는다. 열림 여부를 open 속성으로만 흉내 내는 최소 구현을 얹는다 —
// 포커스 트랩과 백드롭은 브라우저 기능이라 여기서 재현하지 않는다. 그 동작은 E2E의 몫이다.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.open = false
  }
}

// 모킹되지 않은 요청이 조용히 실제 네트워크로 나가지 않도록 막는다.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// 테스트가 얹은 핸들러가 다음 테스트로 넘어가지 않게 한다.
afterEach(() => {
  cleanup()
  server.resetHandlers()

  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
})
afterAll(() => server.close())
