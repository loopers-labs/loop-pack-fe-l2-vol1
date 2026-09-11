'use client'

import { useSyncExternalStore } from 'react'

// zustand persist는 마운트 후 비동기로 복원된다. 그 전에 그리면 "비어 있습니다"가 잠깐 보였다
// 채워지므로, 저장값을 읽는 화면은 복원이 끝난 뒤에 그린다.
//
// 복원 완료 여부는 React 밖의 store가 들고 있는 값이라 useSyncExternalStore로 구독한다.
// 단순한 마운트 판별이 아니어서 useState + effect가 아니다 —
// onFinishHydration이 실제 구독 API이고, 복원은 마운트와 별개의 시점에 끝난다.
//
// persist가 선택적인 이유는 서버에 localStorage가 없기 때문이다. zustand는 storage를 찾지
// 못하면 store에 persist API를 아예 붙이지 않아서, 서버 렌더에서 store.persist가 undefined다.
// (이걸 그냥 읽었더니 보호 화면들이 SSR에서 500을 냈다. 클라이언트가 다시 렌더해 복구하는
//  바람에 브라우저로는 정상으로 보였다.)
type PersistedStore = {
  persist?: {
    hasHydrated: () => boolean
    onFinishHydration: (listener: () => void) => () => void
  }
}

// 서버에는 복원이라는 사건 자체가 없다. 구독할 것이 없고 값은 항상 false다.
// 서버와 최초 hydration 렌더가 같은 값을 봐야 하므로 getServerSnapshot도 같은 함수를 쓴다.
const subscribeToNothing = () => () => {}
const getNotHydrated = () => false

export const useHasHydrated = (store: PersistedStore): boolean =>
  useSyncExternalStore(
    store.persist?.onFinishHydration ?? subscribeToNothing,
    store.persist?.hasHydrated ?? getNotHydrated,
    getNotHydrated,
  )
