'use client'

import { useSyncCollectionOwner } from '@/_app/model/useSyncCollectionOwner'

// 훅을 부를 자리만 만든다. useCurrentUserId가 useQuery를 쓰므로 QueryClientProvider
// 안쪽에서 마운트되어야 한다 — Providers 본문에서 부르면 provider 바깥이다.
export const CollectionOwnerSync = () => {
  useSyncCollectionOwner()

  return null
}
