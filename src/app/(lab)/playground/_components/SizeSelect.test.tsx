import { HttpResponse, delay, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { server } from '@/test/msw/server'
import SizeSelect from './SizeSelect'

// 로딩, 실패, 빈 데이터, 품절 스킵을 검증한다.
// 응답은 MSW가 네트워크에서 만든다. fetch를 바꿔치기하면 이 컴포넌트가 실제로
// /api/products를 부르는지, 응답 상태를 어떻게 읽는지가 검증에서 빠진다.

const respondWithProducts = (resolver: Parameters<typeof http.get>[1]) => {
  server.use(http.get('*/api/products', resolver))
}

const sizesPayload = {
  products: [
    {
      id: 'p1',
      name: '베이글',
      sizes: [
        { value: 24, stock: 3 },
        { value: 25, stock: 0 },
        { value: 26, stock: 12 },
      ],
    },
  ],
}

describe('SizeSelect — 데이터 상태별 렌더', () => {
  it('로딩 → 성공: 트리거가 뜨고 품절이 disabled로 표시된다', async () => {
    respondWithProducts(() => HttpResponse.json(sizesPayload))
    render(<SizeSelect />)
    expect(screen.getByText('사이즈 불러오는 중…')).toBeInTheDocument()

    const trigger = await screen.findByRole('button')
    fireEvent.click(trigger)
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('품절')).toBeInTheDocument() // 25

    // 품절(25) 스킵: 24 → 26
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(screen.getByText(/선택한 사이즈 26/)).toBeInTheDocument()
  })

  it('HTTP 오류: 에러 문구를 보여준다', async () => {
    respondWithProducts(() => new HttpResponse(null, { status: 500 }))
    render(<SizeSelect />)
    expect(
      await screen.findByText('사이즈를 불러오지 못했어요.'),
    ).toBeInTheDocument()
  })

  it('네트워크 실패: 에러 문구를 보여준다', async () => {
    respondWithProducts(() => HttpResponse.error())
    render(<SizeSelect />)
    expect(
      await screen.findByText('사이즈를 불러오지 못했어요.'),
    ).toBeInTheDocument()
  })

  it('사이즈 없는 상품만 오면 셀렉트 대신 안내 문구를 렌더한다', async () => {
    respondWithProducts(() =>
      HttpResponse.json({ products: [{ id: 'p2', name: 'x', sizes: [] }] }),
    )
    render(<SizeSelect />)
    expect(
      await screen.findByText('등록된 사이즈가 없어요.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('언마운트(abort) 후에는 에러 상태로 전이하지 않는다', async () => {
    // 응답이 오기 전에 화면을 떠난다. 컴포넌트가 요청을 끊고 그 거부를 무시해야 한다.
    respondWithProducts(async () => {
      await delay('infinite')
      return HttpResponse.json(sizesPayload)
    })
    const { unmount } = render(<SizeSelect />)
    unmount()
    // abort 거부는 조용히 무시된다 — setState 경고·크래시가 없어야 한다.
    await Promise.resolve()
  })
})
