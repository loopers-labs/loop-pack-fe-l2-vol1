import { expect, test } from '@playwright/test';

// production build 위에서, 진짜 히스토리와 진짜 새로고침으로만 확인되는 것들.
// mock API의 500ms 고정 지연은 expect의 조건 기반 대기로 흡수한다 (sleep 없음).
test.describe('필터와 브라우저 내비게이션', () => {
  test('뒤로·앞으로 가기로 이전 필터 조건이 복원된다 (1단계 13번)', async ({
    page,
  }) => {
    await page.goto('/products');
    await expect(page).toHaveURL('/products');
    await expect(page.getByLabel('카테고리')).toHaveValue('all');

    await page.getByLabel('카테고리').selectOption('fashion');
    await expect(page).toHaveURL(/category=fashion/);

    await page.getByLabel('정렬').selectOption('price-desc');
    await expect(page).toHaveURL(/sort=price-desc/);

    // 한 번 뒤로 — 정렬만 되돌아가고 카테고리는 남아야 한다.
    await page.goBack();
    await expect(page.getByLabel('정렬')).toHaveValue('latest');
    await expect(page.getByLabel('카테고리')).toHaveValue('fashion');

    // 한 번 더 뒤로 — 진입 시점의 조건 없는 상태.
    await page.goBack();
    await expect(page.getByLabel('카테고리')).toHaveValue('all');
    await expect(page).not.toHaveURL(/category=/);

    await page.goForward();
    await expect(page.getByLabel('카테고리')).toHaveValue('fashion');
  });

  test('페이지를 넘긴 뒤 뒤로 가면 이전 페이지로 돌아온다 (1단계 13번 · 경계)', async ({
    page,
  }) => {
    await page.goto('/products');
    await expect(page).toHaveURL('/products');
    const pagination = page.getByRole('navigation', { name: '페이지 이동' });
    await expect(pagination).toContainText('1 / 3');

    await page.getByRole('button', { name: '다음' }).click();
    await expect(pagination).toContainText('2 / 3');
    await expect(page).toHaveURL(/page=2/);

    await page.goBack();
    await expect(pagination).toContainText('1 / 3');
    await expect(page).not.toHaveURL(/page=/);
  });

  test('조작한 필터가 새로고침 뒤에도 그대로 유지된다 (1단계 14번)', async ({
    page,
  }) => {
    await page.goto('/products');
    await expect(page).toHaveURL('/products');

    await page.getByLabel('카테고리').selectOption('digital');
    await page.getByLabel('정렬').selectOption('price-desc');
    await expect(page).toHaveURL(/category=digital/);
    await expect(page).toHaveURL(/sort=price-desc/);

    // 갱신이 끝난 뒤의 목록을 읽어야 한다 — keepPreviousData 때문에 요청이 끝나기 전에는
    // 직전 조건의 목록이 그대로 보인다(그 상태에서 읽으면 새로고침 후와 당연히 다르다).
    const result = page.getByRole('region', { name: '상품 검색 결과' });
    await expect(result).toContainText('갱신 중');
    await expect(result).not.toContainText('갱신 중');

    const nameBeforeReload = await page
      .getByRole('heading', { level: 3 })
      .first()
      .innerText();

    await page.reload();

    await expect(page.getByLabel('카테고리')).toHaveValue('digital');
    await expect(page.getByLabel('정렬')).toHaveValue('price-desc');
    await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText(
      nameBeforeReload,
    );
  });

  test('페이지 번호까지 포함해 유지되고, 잘못된 값은 기본값으로 정규화된다 (1단계 14번 · 경계)', async ({
    page,
  }) => {
    await page.goto('/products?page=2');
    await expect(page).toHaveURL('/products?page=2');
    await expect(
      page.getByRole('navigation', { name: '페이지 이동' }),
    ).toContainText('2 / 3');

    await page.reload();
    await expect(
      page.getByRole('navigation', { name: '페이지 이동' }),
    ).toContainText('2 / 3');

    await page.goto('/products?category=없는카테고리&sort=newest&page=abc');
    await expect(page.getByLabel('카테고리')).toHaveValue('all');
    await expect(page.getByLabel('정렬')).toHaveValue('latest');
    await expect(
      page.getByRole('navigation', { name: '페이지 이동' }),
    ).toContainText('1 / 3');
  });
});
