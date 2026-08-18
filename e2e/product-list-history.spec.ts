import { expect, test } from '@playwright/test'

// 브라우저의 히스토리와 재로드가 대상이다. jsdom의 history는 우리가 부른 만큼 쌓이고
// 그것을 그대로 돌려주므로, 히스토리 항목이 몇 개 쌓였는지가 틀려도 흉내 위에서는 통과한다.
// 그 회귀는 실제 뒤로가기 버튼에서만 드러난다.

test.describe('뒤로가기와 앞으로가기로 조건이 복원된다', () => {
  test('카테고리를 바꾼 뒤 한 번 뒤로 가면 바꾸기 전 목록으로 돌아온다', async ({
    page,
  }) => {
    await page.goto('/products')
    await expect(page.getByText('30 products')).toBeVisible()

    await page.getByRole('combobox', { name: /Category/ }).click()
    await page.getByRole('option', { name: 'Digital' }).click()

    await expect(page).toHaveURL(/category=digital/)
    await expect(page.getByText('6 products')).toBeVisible()

    // 한 번의 조작이 히스토리에 두 번 쌓이면 여기서 돌아오지 않는다.
    await page.goBack()

    await expect(page).not.toHaveURL(/category=digital/)
    await expect(page.getByText('30 products')).toBeVisible()
  })

  test('뒤로 간 뒤 앞으로 가면 바꿨던 조건이 다시 살아난다', async ({
    page,
  }) => {
    await page.goto('/products')
    await expect(page.getByText('30 products')).toBeVisible()

    await page.getByRole('combobox', { name: /Category/ }).click()
    await page.getByRole('option', { name: 'Digital' }).click()
    await expect(page.getByText('6 products')).toBeVisible()

    await page.goBack()
    await expect(page.getByText('30 products')).toBeVisible()

    await page.goForward()

    await expect(page).toHaveURL(/category=digital/)
    await expect(page.getByText('6 products')).toBeVisible()
    await expect(
      page.getByRole('combobox', { name: /Category/ }),
    ).toContainText('Digital')
  })
})

test.describe('새로고침해도 조건이 유지된다', () => {
  test('주소에 담긴 조건은 새로고침 뒤에도 같은 목록을 만든다', async ({
    page,
  }) => {
    await page.goto('/products?category=home&sort=price-asc')
    await expect(page.getByText('6 products')).toBeVisible()
    const firstProduct = page.getByRole('article').first()
    await expect(firstProduct.getByRole('heading', { level: 3 })).toHaveText(
      'WOOD GLOVES',
    )

    await page.reload()

    // 서버가 조건으로 먼저 그린 화면과 클라이언트가 이어받은 화면이 같아야 한다.
    await expect(page).toHaveURL(/category=home&sort=price-asc/)
    await expect(page.getByText('6 products')).toBeVisible()
    await expect(
      page.getByRole('article').first().getByRole('heading', { level: 3 }),
    ).toHaveText('WOOD GLOVES')
    await expect(page.getByRole('combobox', { name: /Sort/ })).toContainText(
      'Price: Low to high',
    )
  })

  test('조건 없이 들어와 새로고침하면 기본 목록이 그대로 나온다', async ({
    page,
  }) => {
    await page.goto('/products')
    await expect(page.getByText('30 products')).toBeVisible()

    await page.reload()

    await expect(page.getByText('30 products')).toBeVisible()
    // 기본값이 주소에 새로 붙지 않는다. 같은 화면이 두 주소를 갖게 된다.
    await expect(page).toHaveURL(/\/products$/)
  })
})
