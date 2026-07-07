// number[] ID 목록을 localStorage와 주고받는다. 위시리스트·최근 본 상품이 공유한다.
export function readStoredIds(storageKey: string): number[] {
  try {
    const stored = localStorage.getItem(storageKey)
    return stored ? (JSON.parse(stored) as number[]) : []
  } catch {
    return []
  }
}

export function writeStoredIds(storageKey: string, ids: number[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(ids))
  } catch {
    // localStorage 사용 불가 시 무시
  }
}
