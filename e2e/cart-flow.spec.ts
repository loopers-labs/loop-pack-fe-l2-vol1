import { expect, test } from '@playwright/test'

// 목록 진입에서 담기까지, 한 사람이 실제로 지나가는 길을 그대로 따라간다.
// 통합 테스트는 이 길을 조각으로 나눠 각 조각의 화면을 확인한다.
// 여기서만 확인할 수 있는 것은 조각들이 실제 production build 위에서 이어 붙는다는 사실이다.
// 서버가 먼저 그린 목록, 클라이언트로 넘어온 뒤의 상태, 헤더가 그 상태를 읽는 경로가 한 번에 걸린다.

test.describe('목록에서 담으면 헤더 개수가 따라온다', () => {
  test('첫 상품을 담으면 헤더 개수가 1이 되고 버튼은 빼기로 바뀐다', async ({
    page,
  }) => {
    await page.goto('/products')

    const header = page.getByRole('banner')
    await expect(header.getByText(/^Bag \d+$/)).toHaveText('Bag 0')

    // 상품 카드가 도착할 때까지 기다린다. 시간이 아니라 화면에 나온 것으로 기다린다.
    const firstProduct = page.getByRole('article').first()
    await expect(firstProduct).toBeVisible()
    const productName = await firstProduct
      .getByRole('heading', { level: 3 })
      .innerText()

    const addToBag = firstProduct.getByRole('button', {
      name: `${productName} bag`,
    })
    await expect(addToBag).toHaveText('Add to bag')

    await addToBag.click()

    await expect(header.getByText(/^Bag \d+$/)).toHaveText('Bag 1')
    await expect(addToBag).toHaveText('Remove')
    await expect(addToBag).toHaveAttribute('aria-pressed', 'true')
  })

  test('같은 상품을 다시 누르면 헤더 개수가 0으로 돌아온다', async ({
    page,
  }) => {
    await page.goto('/products')

    const header = page.getByRole('banner')
    const firstProduct = page.getByRole('article').first()
    await expect(firstProduct).toBeVisible()
    const addToBag = firstProduct.getByRole('button', { name: /bag$/ })

    await addToBag.click()
    await expect(header.getByText(/^Bag \d+$/)).toHaveText('Bag 1')

    await addToBag.click()

    await expect(header.getByText(/^Bag \d+$/)).toHaveText('Bag 0')
    await expect(addToBag).toHaveText('Add to bag')
  })
})
