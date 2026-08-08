import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHomeMetadata, generateHomeMetadata } from './homeMetadata'
import type { HomeResponse } from './home'

// 실패마다 화면이 달라져야 한다. 깨지면 공유 카드가 조용히 빈 값이 되거나 원인이 사라진다.
// 예상 가능한 조회 실패는 root metadata를 살리고, 예상 밖 오류는 숨기지 않는다.

const homeResponse = {
  banner: {
    title: '배너 제목',
    description: '배너 설명',
    image: '/images/products/p1.jpg',
  },
  categories: [],
  popularProducts: [],
  newProducts: [],
} satisfies HomeResponse

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status })

// 사례마다 독립된 origin으로 식별한다. readHome이 origin을 키로 조회를 공유하므로,
// 어떤 응답이 어느 사례의 것인지 흐려지지 않게 한다.
let originSeq = 0
const stubOrigin = () => {
  originSeq += 1
  vi.stubEnv('APP_ORIGIN', `http://metadata-${originSeq}.test`)
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('홈 metadata', () => {
  it('정상 응답이면 배너에서 title과 description과 image를 만든다', async () => {
    stubOrigin()
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() => Promise.resolve(jsonResponse(homeResponse))),
    )

    expect(await generateHomeMetadata()).toMatchObject({
      title: '배너 제목',
      description: '배너 설명',
      openGraph: {
        title: '배너 제목',
        description: '배너 설명',
        images: ['/images/products/p1.jpg'],
      },
    })
  })

  it('예상 가능한 조회 실패는 아무 필드도 정하지 않아 root를 상속한다', async () => {
    stubOrigin()
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() =>
        Promise.resolve(new Response(null, { status: 500 })),
      ),
    )

    // 빈 문자열로 덮으면 root의 title과 description까지 지워진다.
    expect(await generateHomeMetadata()).toEqual({})
  })

  it('요청이 나가지 못한 실패도 root를 상속한다', async () => {
    stubOrigin()
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() => Promise.reject(new TypeError('offline'))),
    )

    expect(await generateHomeMetadata()).toEqual({})
  })

  it('예상 밖 오류는 삼키지 않는다', async () => {
    stubOrigin()
    // 200인데 본문이 JSON이 아니다. 계약이 깨진 것이라 화면이 복구 방법을 모른다.
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(() => Promise.resolve(new Response('<html>'))),
    )

    await expect(generateHomeMetadata()).rejects.toThrow()
  })

  it('페이지 Open Graph가 공통 정체성을 지운 채 나가지 않는다', () => {
    // openGraph는 shallow merge라 루트 값이 통째로 덮인다.
    expect(createHomeMetadata(homeResponse).openGraph).toMatchObject({
      siteName: 'Loop Market',
      locale: 'ko_KR',
      type: 'website',
    })
  })
})
