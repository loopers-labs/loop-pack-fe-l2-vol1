// node 테스트 환경엔 localStorage 가 없다. persist store 가 storage 에 접근하기 전에
// 전역에 심는 인메모리 목. (팩토리는 skipHydration 라 생성 시엔 접근하지 않는다.)
export function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}
