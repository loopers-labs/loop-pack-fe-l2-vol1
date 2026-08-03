'use client';

import { SizeSelect } from '@/components/ui/select/SizeSelect';
import { TextSelect } from '@/components/ui/select/TextSelect';
import { ThumbnailSelect } from '@/components/ui/select/ThumbnailSelect';
import { getProducts } from '@/service/products';
import { useQuery } from '@tanstack/react-query';

export function SelectDemo() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  if (isLoading) return <p>로딩 중...</p>;
  if (error) return <p>오류가 발생했습니다.</p>;
  if (!data) return null;

  const { products, textOptions } = data;

  return (
    <div className="flex flex-col gap-4">
      <SizeSelect products={products[0].sizes} />
      <TextSelect textOptions={textOptions} />
      <ThumbnailSelect products={products} />
    </div>
  );
}
