import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 위시리스트·장바구니처럼 "상품 id 집합 + 담기/빼기"만 필요한 컬렉션 store의 공통 구현.
// 지금은 두 도메인 로직이 동일해 이 팩토리로 찍어낸다(중복 제거). 장바구니에 수량 같은
// 다른 로직이 생기면 그 store만 이 팩토리에서 떼어내 독립 구현으로 교체한다.
// 소비처가 쓰는 인터페이스(ids / toggle)만 유지하면 교체 시 소비처는 손대지 않아도 된다.
export type CollectionStore = {
  ids: string[]
  toggle: (id: string) => void
}

// 저장값이 손상됐을 때(문자열 배열이 아님) 빈 목록으로 안전하게 복구한다.
const toValidIds = (value: unknown): string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : []

// persist가 넘겨주는 unknown 저장값에서 ids만 안전하게 꺼낸다(타입 단언 없이 in 가드 사용).
const readIds = (persisted: unknown): string[] =>
  typeof persisted === 'object' && persisted !== null && 'ids' in persisted
    ? toValidIds(persisted.ids)
    : []

// name은 localStorage 키. persist로 새로고침 후에도 담긴 목록을 복원한다.
export const createCollectionStore = (name: string) =>
  create<CollectionStore>()(
    persist(
      (set) => ({
        ids: [],
        toggle: (id) =>
          set((state) => ({
            ids: state.ids.includes(id)
              ? state.ids.filter((existingId) => existingId !== id)
              : [...state.ids, id],
          })),
      }),
      {
        name,
        version: 1,
        // ids만 저장한다(함수는 직렬화 대상 아님).
        partialize: (state) => ({ ids: state.ids }),
        // 저장 스키마 버전이 바뀌면 여기서 예전 값을 새 형태로 옮긴다. 지금은 ids 유효성만 보정.
        migrate: (persisted) => ({ ids: readIds(persisted) }),
        // 매 복원 시 저장값을 검증해, 손상·조작된 값이 들어와도 빈 목록으로 복구한다.
        merge: (persisted, current) => ({ ...current, ids: readIds(persisted) }),
      },
    ),
  )
