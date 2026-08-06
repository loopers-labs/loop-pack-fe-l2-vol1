import type { Metadata } from 'next';
import { connection } from 'next/server';

import { HomePage } from '@/_pages/home';
import { productQueries } from '@/entities/product';
import { getQueryClient } from '@/shared/get-query-client';

/**
 * 본문과 같은 query factory를 써서 같은 GET을 만든다. 같은 render의 동일 요청은 합쳐진다.
 * 조회가 실패하면 빈 객체를 반환해 루트 metadata를 그대로 상속한다.
 * 페이지별 빈 값을 만들면 정상 empty와 조회 실패가 같은 화면으로 보인다.
 */
export async function generateMetadata(): Promise<Metadata> {
  await connection();

  const queryClient = getQueryClient();

  try {
    const { banner } = await queryClient.fetchQuery(productQueries.home());

    return {
      title: banner.title,
      description: banner.description,
      openGraph: {
        siteName: 'LOOP MALL',
        locale: 'ko_KR',
        type: 'website',
        images: [banner.image],
      },
    };
  } catch {
    return {};
  }
}

export default function Home() {
  return <HomePage />;
}
