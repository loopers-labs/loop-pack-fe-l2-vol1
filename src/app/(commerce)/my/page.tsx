import type { Metadata } from 'next';

import { MyPage } from '@/_pages/my';

export const metadata: Metadata = { title: '마이페이지' };

export default function My() {
  return <MyPage />;
}
