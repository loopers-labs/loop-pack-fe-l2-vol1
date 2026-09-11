import type { ReactElement } from 'react';
import {
  ProductsSkeletonDefault,
  ProductsSkeletonPartialRow,
} from '@/_pages/products/ui/ProductsSkeleton.story';

// 갤러리가 그릴 수 있는 story 목록. 키가 곧 스크린샷 테스트가 부르는 이름이고
// 기준선 파일명의 근거이므로, 키를 바꾸면 기준선 파일도 함께 옮겨야 한다.
export const stories = {
  'products-skeleton/default': ProductsSkeletonDefault,
  'products-skeleton/partial-row': ProductsSkeletonPartialRow,
} satisfies Record<string, () => ReactElement>;

export type StoryName = keyof typeof stories;

export function isStoryName(value: string): value is StoryName {
  return Object.hasOwn(stories, value);
}
