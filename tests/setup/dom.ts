import '@testing-library/jest-dom/vitest'
import './msw'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

const storageData = new Map<string, string>()
const localStorage: Storage = {
  clear: () => {
    storageData.clear()
  },
  getItem: (key) => storageData.get(key) ?? null,
  key: (index) => Array.from(storageData.keys())[index] ?? null,
  get length() {
    return storageData.size
  },
  removeItem: (key) => {
    storageData.delete(key)
  },
  setItem: (key, value) => {
    storageData.set(key, value)
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: localStorage,
})
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: localStorage,
})

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
