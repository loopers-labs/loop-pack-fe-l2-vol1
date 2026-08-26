import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCollectionStore, type CollectionStore } from './create-collection-store'

const createMemoryStorage = (): Storage => {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

// 계획서 1번 — docs/rfc/week08-test-plan.md
describe('createCollectionStore', () => {
  beforeEach(() => {
    const storage = createMemoryStorage()
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('window', { localStorage: storage })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('id를 추가하고 같은 id를 다시 toggle하면 제거한다', () => {
    const store = createCollectionStore('toggle-test')

    store.getState().toggle('p1')
    expect(store.getState().ids).toEqual(['p1'])

    store.getState().toggle('p1')
    expect(store.getState().ids).toEqual([])
  })

  it('빈 상태에서 여러 id의 순서와 중복 없는 집합을 유지한다', () => {
    const store = createCollectionStore('collection-test')

    expect(store.getState().ids).toEqual([])

    store.getState().toggle('p1')
    store.getState().toggle('p2')
    store.getState().toggle('p1')

    expect(store.getState().ids).toEqual(['p2'])
  })

  it('소비처 selector로 포함 여부, 개수, action을 선택할 수 있다', () => {
    const store = createCollectionStore('selector-test')
    const selectIsIncluded = (state: CollectionStore) => state.ids.includes('p1')
    const selectCount = (state: CollectionStore) => state.ids.length
    const selectToggle = (state: CollectionStore) => state.toggle

    selectToggle(store.getState())('p1')

    expect(selectIsIncluded(store.getState())).toBe(true)
    expect(selectCount(store.getState())).toBe(1)
    expect(selectToggle(store.getState())).toBe(store.getState().toggle)
  })

  it('손상된 ids 저장값은 빈 목록으로 복구한다', async () => {
    localStorage.setItem('damaged-test', JSON.stringify({ state: { ids: ['p1', 42] }, version: 1 }))

    const store = createCollectionStore('damaged-test')
    await store.persist.rehydrate()

    expect(store.getState().ids).toEqual([])
  })

  // 손상된 저장값을 복원하면 현재 목록도 빈 목록으로 되돌아간다.
  // 이미 담긴 상태에서 확인해야 하는 이유: 빈 상태에서는 in 가드가 없어 복원이
  // 예외로 중단돼도(zustand가 hydration 예외를 삼킨다) 결과가 똑같이 빈 목록이라
  // 가드가 있는지 없는지 구분되지 않는다.
  it('담긴 상태에서 저장값이 null이면 빈 목록으로 복구한다', async () => {
    const store = createCollectionStore('null-state-test')
    store.getState().toggle('p1')
    localStorage.setItem('null-state-test', JSON.stringify({ state: null, version: 1 }))

    await store.persist.rehydrate()

    expect(store.getState().ids).toEqual([])
  })

  it('담긴 상태에서 저장값이 객체가 아니면 빈 목록으로 복구한다', async () => {
    const store = createCollectionStore('primitive-state-test')
    store.getState().toggle('p1')
    localStorage.setItem('primitive-state-test', JSON.stringify({ state: 'ids', version: 1 }))

    await store.persist.rehydrate()

    expect(store.getState().ids).toEqual([])
  })

  it('이전 버전의 유효한 ids를 현재 상태로 migration한다', async () => {
    localStorage.setItem('migration-test', JSON.stringify({ state: { ids: ['p1'] }, version: 0 }))

    const store = createCollectionStore('migration-test')
    await store.persist.rehydrate()

    expect(store.getState().ids).toEqual(['p1'])
  })
})
