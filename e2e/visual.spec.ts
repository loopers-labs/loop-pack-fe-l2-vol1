import { expect, test } from '@playwright/test';
import { gotoGallery, mountStory } from './pom/gallery';

// 시각적 회귀 (9주차 Advanced A). 기능 검증이 아니다 — 카드 개수·역할은 통합 테스트가 본다.
// 여기서 보는 건 "픽셀이 기준선과 같은가" 하나뿐이고, 그래서 story 단위로 좁게 찍는다.
//
// 비결정성 처리:
// - 애니메이션·캐럿: toHaveScreenshot 기본값이 animations:'disabled'·caret:'hide'다.
//   이 앱은 globals.css에 animation/transition이 0건이라 실제로 걸리는 게 없지만 기본값을 유지한다.
// - 폰트: next/font가 빌드 시점에 self-host해 런타임 네트워크 의존이 없다. 스켈레톤은 글자가 없어 무관.
// - 이미지·시간·랜덤: 스켈레톤엔 없다. 이미지가 있는 story(ProductCard)부터 다시 따진다.
// - 뷰포트: config의 Desktop Chrome(1280×720). week05-grid는 960/720px에서 열 수가 바뀌므로
//   뷰포트가 흔들리면 그리드 자체가 달라진다 — 여기서 고정한다.
test.describe('갤러리 스크린샷 — ProductsSkeleton', () => {
  test('기본(12개)은 기준선과 같다', async ({ page }) => {
    await gotoGallery(page);
    const story = await mountStory(page, 'products-skeleton/default');
    await expect(story).toHaveScreenshot('products-skeleton-default.png');
  });

  // 마지막 줄이 덜 찬 story — 열 수 회귀(5열 고정 → auto-fit 등)는 가득 찬 격자에선 안 보이고
  // 여기서 칸 너비가 늘어나는 것으로 드러난다.
  test('덜 찬 줄(3개)은 기준선과 같다', async ({ page }) => {
    await gotoGallery(page);
    const story = await mountStory(page, 'products-skeleton/partial-row');
    await expect(story).toHaveScreenshot('products-skeleton-partial-row.png');
  });
});
