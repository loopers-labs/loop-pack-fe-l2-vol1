'use client';
import { SizeSelect } from '@/components/ui/select/SizeSelect';
import { TextSelect } from '@/components/ui/select/TextSelect';
import { ThumbnailSelect } from '@/components/ui/select/ThumbnailSelect';
import { getProducts } from '@/service/products';

import { useQuery } from '@tanstack/react-query';

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  if (isLoading) return <p>로딩 중...</p>;
  if (error) return <p>오류가 발생했습니다.</p>;

  const { products, textOptions } = data;

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '64px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
        Commerce
      </h1>
      <p style={{ color: '#5a6675', lineHeight: 1.7, marginBottom: 24 }}>
        4주차부터 여기에 커머스를 쌓아갑니다. 이번 주는 디자인 시스템의 뼈대
        <b> Select</b>와 <b>Dialog</b>를 직접 만드는 것부터 시작해요.
      </p>
      <div className="flex flex-col gap-4">
        <SizeSelect products={products[0].sizes} />
        <TextSelect textOptions={textOptions} />
        <ThumbnailSelect products={products} />
      </div>
    </main>
  );
}
