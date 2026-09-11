import { expect, type Page } from '@playwright/test'

/*
 * 상품 목록은 갱신에 실패해도 화면을 비우지 않고 이전 조건의 결과를 유지한 채
 * `상품 목록 갱신 오류` 배너만 띄운다(ProductListResults.tsx). 그래서 기대한 개수를
 * 그냥 기다리면 "아직 로딩 중"과 "갱신이 실패해 옛 결과가 남아 있음"이 똑같이
 * timeout으로 끝나고, 실패 메시지가 원인을 말해주지 않는다.
 *
 * 배너가 떠 있으면 그 사실을 실패 메시지에 담아 두 상황을 구분한다.
 */
export const expectProductCount = async (page: Page, label: string) => {
  const count = page.getByText(label, { exact: true })
  const refreshError = page.getByRole('alert', { name: '상품 목록 갱신 오류' })

  await expect(async () => {
    if (await refreshError.isVisible()) {
      throw new Error(
        `상품 목록 갱신이 실패해 이전 조건의 결과가 남아 있다. "${label}"은 나타나지 않는다. ` +
          '네트워크 실패나 요청 취소를 의심한다.',
      )
    }

    await expect(count).toBeVisible({ timeout: 500 })
  }).toPass({ timeout: 10_000 })
}
