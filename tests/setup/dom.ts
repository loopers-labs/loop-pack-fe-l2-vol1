import '@testing-library/jest-dom/vitest'
import './msw'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

const NodeRequest = globalThis.Request

globalThis.Request = class BrowserRequest extends NodeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(
      typeof input === 'string' ? new URL(input, window.location.href) : input,
      init,
    )
  }
}

afterEach(() => {
  cleanup()
})
