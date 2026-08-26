import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  productListFixtureResponse,
  productListSuccessHandler,
} from '@/_pages/product-list/testing/product-list-handlers'
import { PRODUCT_PAGE_SIZE } from '@/entities/product'
import { ProductListContent } from '@/_pages/product-list/ui/ProductListContent'
import { renderWithProviders } from '@/shared/test/render-with-providers'
import { server } from '@/shared/test/msw-server'

// 계획서 4·5·6·7·8·9·10번 — docs/rfc/week08-test-plan.md
describe('ProductListContent', () => {
  beforeEach(() => {
    server.use(productListSuccessHandler)
  })

  it('상품 목록 응답을 받으면 상품을 표시한다', async () => {
    renderWithProviders(<ProductListContent />)

    expect(
      await screen.findByRole('heading', { level: 2, name: '캐주얼 신상품' }),
    ).toBeInTheDocument()
  })

  it('요청이 끝나기 전에는 상품이 없고 응답 후에는 상품을 표시한다', async () => {
    let isRequestStarted = false
    server.use(
      http.get('/api/products', async ({ request }) => {
        isRequestStarted = true
        await delay(50)

        return productListFixtureResponse(request)
      }),
    )

    renderWithProviders(<ProductListContent />)

    // 렌더 직후가 아니라 요청이 나간 뒤를 본다. 첫 렌더에 상품이 없는 것은
    // 구현과 무관하게 항상 참이라 아무것도 보장하지 못한다.
    await waitFor(() => expect(isRequestStarted).toBe(true))
    expect(
      screen.queryByRole('heading', { level: 2, name: '캐주얼 신상품' }),
    ).not.toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { level: 2, name: '캐주얼 신상품' }),
    ).toBeInTheDocument()
  })

  it('전체 결과가 0건이면 빈 결과를 표시하고 페이지 이동을 숨긴다', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json({
          products: [],
          categories: [],
          totalCount: 0,
          page: 1,
          pageSize: PRODUCT_PAGE_SIZE,
        }),
      ),
    )

    renderWithProviders(<ProductListContent />)

    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: '페이지 이동' })).not.toBeInTheDocument()
  })

  it('전체 결과는 있지만 현재 페이지가 비었으면 이전 페이지로 돌아갈 수 있다', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json({
          products: [],
          categories: [],
          // 마지막 페이지(2)를 넘어선 99페이지로 들어온 상황
          totalCount: PRODUCT_PAGE_SIZE + 2,
          page: 99,
          pageSize: PRODUCT_PAGE_SIZE,
        }),
      ),
    )

    renderWithProviders(<ProductListContent />, {
      searchParams: '?page=99',
    })

    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이전' })).toBeEnabled()
    expect(screen.getByText('99 / 2')).toBeInTheDocument()
  })

  it('500 응답이면 오류 안내와 재시도 동작을 표시한다', async () => {
    server.use(http.get('/api/products', () => new HttpResponse(null, { status: 500 })))

    renderWithProviders(<ProductListContent />)

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('상품 목록을 불러오지 못했어요.')).toBeInTheDocument()
    expect(within(alert).getByRole('button', { name: '다시 시도' })).toBeEnabled()
  })

  it('재시도도 실패하면 오류를 유지하고 다음 재시도가 성공하면 상품을 표시한다', async () => {
    const user = userEvent.setup()
    let requestCount = 0
    server.use(
      http.get('/api/products', ({ request }) => {
        requestCount += 1

        return requestCount <= 2
          ? new HttpResponse(null, { status: 500 })
          : productListFixtureResponse(request)
      }),
    )

    renderWithProviders(<ProductListContent />)
    const retryButton = await screen.findByRole('button', { name: '다시 시도' })

    await user.click(retryButton)

    await waitFor(() => expect(requestCount).toBe(2))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(retryButton)

    expect(
      await screen.findByRole('heading', { level: 2, name: '캐주얼 신상품' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  // 6번 경계 — 최초 실패가 아니라 갱신 실패다. 표시할 직전 목록이 있는 쪽 분기.
  it('직전 목록이 있는 상태에서 조건 변경이 실패하면 이전 목록과 갱신 실패 알림을 함께 보여준다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ProductListContent />)
    await screen.findByRole('heading', { level: 2, name: '캐주얼 신상품' })

    server.use(http.get('/api/products', () => new HttpResponse(null, { status: 500 })))
    await user.selectOptions(screen.getByRole('combobox', { name: '카테고리' }), 'digital')

    const alert = await screen.findByRole('alert')
    expect(
      within(alert).getByText(
        '현재 조건의 상품 목록을 불러오지 못했어요. 아래는 이전 조건의 결과예요.',
      ),
    ).toBeInTheDocument()
    expect(within(alert).getByRole('button', { name: '다시 시도' })).toBeEnabled()
    // 목록이 빈 화면으로 바뀌지 않고 직전 조건의 결과가 남는다.
    expect(screen.getByRole('heading', { level: 2, name: '캐주얼 신상품' })).toBeInTheDocument()
    // 최초 실패의 문구는 이 경로에서 나오지 않는다. 두 분기가 실제로 갈라지는지를 본다.
    expect(screen.queryByText('상품 목록을 불러오지 못했어요.')).not.toBeInTheDocument()
  })

  // 7번 경계 — 갱신 실패에서 빠져나오는 경로.
  it('갱신 실패에서 다시 시도가 성공하면 알림이 사라지고 새 조건의 목록으로 바뀐다', async () => {
    const user = userEvent.setup()
    let shouldFail = false
    server.use(
      http.get('/api/products', ({ request }) =>
        shouldFail ? new HttpResponse(null, { status: 500 }) : productListFixtureResponse(request),
      ),
    )

    renderWithProviders(<ProductListContent />)
    await screen.findByRole('heading', { level: 2, name: '캐주얼 신상품' })

    shouldFail = true
    await user.selectOptions(screen.getByRole('combobox', { name: '카테고리' }), 'digital')
    const alert = await screen.findByRole('alert')

    shouldFail = false
    await user.click(within(alert).getByRole('button', { name: '다시 시도' }))

    expect(
      await screen.findByRole('heading', { level: 2, name: '디지털 실속상품' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('3페이지에서 카테고리를 바꾸면 1페이지의 해당 상품을 요청한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ProductListContent />, {
      searchParams: '?page=3',
    })
    await screen.findByText('검색 결과가 없습니다.')

    await user.selectOptions(screen.getByRole('combobox', { name: '카테고리' }), 'digital')

    expect(
      await screen.findByRole('heading', { level: 2, name: '디지털 실속상품' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1 / 1')).toBeInTheDocument()
  })

  it('정렬을 바꾸면 새 순서의 상품 목록을 표시한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ProductListContent />, {
      searchParams: '?page=2',
    })
    await screen.findByText('2 / 2')

    await user.selectOptions(screen.getByRole('combobox', { name: '정렬' }), 'price-asc')

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('디지털 실속상품')
    })
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('페이지를 이동해도 선택한 카테고리를 유지한다', async () => {
    const user = userEvent.setup()

    renderWithProviders(<ProductListContent />, {
      searchParams: '?category=casual&sort=price-asc',
    })
    await screen.findByRole('heading', { level: 2, name: '캐주얼 신상품' })

    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: `캐주얼 기본상품 ${PRODUCT_PAGE_SIZE - 1}`,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '카테고리' })).toHaveValue('casual')
    expect(screen.getByRole('combobox', { name: '정렬' })).toHaveValue('price-asc')
  })
})
