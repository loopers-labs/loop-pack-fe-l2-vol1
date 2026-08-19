import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/react'
import ProductListView from './ProductListView'

// 조건을 바꾸면 목록이 실제로 바뀌는지 확인한다.
// 응답은 mock 백엔드의 기본 핸들러가 만든다. 테스트가 목록을 직접 지어내면
// "정렬을 보냈다"까지만 확인되고 "순서가 바뀌었다"는 확인되지 않는다.
//
// 조건 전환 중의 화면(대기, 갱신 실패, 이전 결과 유지)은 ProductListView.test.tsx가 맡는다.
// 여기는 전환이 끝난 뒤의 결과만 본다.

// 테스트 어댑터가 아니라 jsdom의 실제 history를 쓰는 어댑터를 쓴다.
// 조작이 주소에 반영되는지와 그 주소로 다시 들어오는지를 같은 파일에서 봐야 한다.
const renderList = (searchParams = '') => {
  window.history.replaceState(null, '', `/products${searchParams}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
  render(
    <NuqsAdapter>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ProductListView />
      </QueryClientProvider>
    </NuqsAdapter>,
  )
  return userEvent.setup()
}

const productCards = () => screen.getAllByRole('article')

const firstProductName = () =>
  within(productCards()[0]).getByRole('heading', { level: 3 }).textContent ?? ''

const chooseOption = async (
  user: ReturnType<typeof userEvent.setup>,
  control: RegExp,
  option: string,
) => {
  await user.click(screen.getByRole('combobox', { name: control }))
  await user.click(screen.getByRole('option', { name: option }))
}

// 개수 문구는 화면에 있는 응답을 따른다. 새 개수가 나오면 전환이 끝난 것이다.
const shownCount = (count: number) => screen.findByText(`${count} products`)

// 주소는 화면보다 늦게 따라온다. 어댑터가 갱신을 잠깐 모으기 때문이다.
// 주소를 단언하는 테스트만 여기서 한 번 기다리고, 나머지 단언은 동기로 읽는다.
const addressCarries = (condition: string) =>
  waitFor(() =>
    expect(decodeURIComponent(window.location.search)).toContain(condition),
  )

describe('카테고리를 바꾸면 그 카테고리의 목록이 온다', () => {
  it('전체에서 Digital로 바꾸면 개수가 6으로 줄고 이전 상품이 사라진다', async () => {
    const user = renderList()
    await shownCount(30)
    const beforeChange = firstProductName()

    await chooseOption(user, /Category/, 'Digital')

    await shownCount(6)
    expect(screen.queryByText(beforeChange)).toBeNull()
    expect(screen.getByText('메이커스 투명케이스')).toBeInTheDocument()
    expect(productCards()).toHaveLength(6)
  })

  it('뒤쪽 페이지에서 카테고리를 바꾸면 없는 페이지가 아니라 1페이지가 열린다', async () => {
    // 30개짜리 전체 목록의 3페이지에서 6개짜리 카테고리로 옮기면 3페이지는 존재하지 않는다.
    // page를 그대로 두면 사용자는 조건을 바꾸자마자 빈 화면을 만난다.
    const user = renderList('?page=3')
    await shownCount(30)

    await chooseOption(user, /Category/, 'Digital')

    await addressCarries('category=digital')
    await shownCount(6)
    expect(screen.getByText('1 / 1')).toBeInTheDocument()
    expect(window.location.search).not.toContain('page=3')
  })
})

describe('정렬을 바꾸면 목록의 순서가 바뀐다', () => {
  it('낮은 가격순으로 바꾸면 가장 싼 상품이 맨 앞에 온다', async () => {
    const user = renderList()
    await shownCount(30)

    await chooseOption(user, /Sort/, 'Price: Low to high')

    // 정렬은 서버가 하고 화면은 받은 순서대로 그린다. 맨 앞이 최저가여야 둘이 이어진 것이다.
    expect(await screen.findByText('WOOD GLOVES')).toBeInTheDocument()
    expect(firstProductName()).toBe('WOOD GLOVES')
    expect(within(productCards()[0]).getByText('3,000원')).toBeInTheDocument()
  })

  it('높은 가격순으로 바꾸면 맨 앞이 최고가로 뒤집히고 개수는 그대로다', async () => {
    const user = renderList()
    await shownCount(30)

    await chooseOption(user, /Sort/, 'Price: High to low')

    expect(await screen.findByText('428,000원')).toBeInTheDocument()
    expect(within(productCards()[0]).getByText('428,000원')).toBeInTheDocument()
    // 정렬은 거르는 조건이 아니다. 개수가 함께 움직이면 필터처럼 동작한 것이다.
    expect(screen.getByText('30 products')).toBeInTheDocument()
  })
})

describe('페이지를 옮기면 그 페이지의 목록이 온다', () => {
  it('다음을 누르면 표기가 2 / 3이 되고 1페이지 상품이 사라진다', async () => {
    const user = renderList()
    await shownCount(30)
    const firstPageProduct = firstProductName()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByText('2 / 3')).toBeInTheDocument()
    expect(screen.queryByText(firstPageProduct)).toBeNull()
    expect(productCards()).toHaveLength(12)
  })

  it('마지막 페이지에서는 남은 6개만 보이고 다음으로 갈 수 없다', async () => {
    renderList('?page=3')

    expect(await screen.findByText('3 / 3')).toBeInTheDocument()
    expect(productCards()).toHaveLength(6)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled()
  })
})

describe('조작은 주소에 남고 주소로 다시 들어올 수 있다', () => {
  it('카테고리와 정렬을 바꾸면 주소에 남고 기본값인 page는 빠진다', async () => {
    const user = renderList()
    await shownCount(30)

    await chooseOption(user, /Category/, 'Digital')
    await shownCount(6)
    await chooseOption(user, /Sort/, 'Price: Low to high')
    await addressCarries('sort=price-asc')

    const search = new URLSearchParams(window.location.search)
    expect(search.get('sort')).toBe('price-asc')
    expect(search.get('category')).toBe('digital')
    // 기본값이 주소에 남으면 같은 화면이 두 주소를 갖는다.
    expect(search.get('page')).toBeNull()
    expect(search.get('q')).toBeNull()
  })

  it('그 주소로 다시 들어오면 같은 조건과 같은 목록이 나온다', async () => {
    renderList('?category=digital&sort=price-asc')

    await shownCount(6)
    expect(firstProductName()).toBe('신지루프 실리콘 핸드폰 핑거스트랩')
    expect(
      screen.getByRole('combobox', { name: /Category/ }),
    ).toHaveTextContent('Digital')
    expect(screen.getByRole('combobox', { name: /Sort/ })).toHaveTextContent(
      'Price: Low to high',
    )
  })

  it('검색어를 제출하면 주소에 남고 결과가 그 검색어로 좁혀진다', async () => {
    const user = renderList()
    await shownCount(30)

    await user.type(screen.getByLabelText('Search'), '스탠리')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    await addressCarries('q=스탠리')
    await shownCount(4)
    expect(productCards()).toHaveLength(4)
  })
})
