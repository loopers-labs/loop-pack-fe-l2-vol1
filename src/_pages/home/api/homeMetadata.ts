import type { Metadata } from 'next'
import { isExpectedFailure } from '@/shared/api/http'
import { getQueryClient } from '@/shared/api/serverQueryClient'
import { getAppOrigin } from '@/shared/config/appOrigin'
import { sharedOpenGraph } from '@/shared/config/metadata'
import type { HomeResponse } from './home'
import { homeServerQuery } from './homeServer'

// metadata와 본문이 같은 조회를 읽는다. 각자 조립하면 화면과 공유 카드가 어긋난다.

export const createHomeMetadata = (home: HomeResponse): Metadata => ({
  title: home.banner.title,
  description: home.banner.description,
  // 페이지 openGraph는 루트를 통째로 덮는다. 공통 정체성을 펼친 뒤 이 화면 것만 얹는다.
  openGraph: {
    ...sharedOpenGraph,
    title: home.banner.title,
    description: home.banner.description,
    images: [home.banner.image],
  },
})

export const generateHomeMetadata = async (): Promise<Metadata> => {
  // 설정 누락은 조회 실패가 아니다. try 밖에서 불러 즉시 드러나게 한다.
  const origin = getAppOrigin()

  try {
    const home = await getQueryClient().fetchQuery(homeServerQuery(origin))
    return createHomeMetadata(home)
  } catch (error) {
    // 응답 계약이 깨진 것 같은 예상 밖 오류까지 삼키면 원인이 조용히 숨는다.
    if (!isExpectedFailure(error)) throw error

    // 빈 문자열로 덮지 않는다. 아무 필드도 정하지 않아야 root metadata가 그대로 합성된다.
    return {}
  }
}
