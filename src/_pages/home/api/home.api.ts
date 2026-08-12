import type { HomeResponse } from '@/types/commerce';
import { HttpError, InvalidResponseError } from '@/shared/api/errors';
import { apiUrl } from '@/shared/api/base-url';

function isHomeResponse(data: unknown): data is HomeResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'banner' in data &&
    'popularProducts' in data &&
    Array.isArray(data.popularProducts) &&
    'newProducts' in data &&
    Array.isArray(data.newProducts)
  );
}

export async function getHome(): Promise<HomeResponse> {
  const res = await fetch(apiUrl('/api/home'));
  if (!res.ok) {
    throw new HttpError(res.status, '홈 데이터를 불러오지 못했습니다.');
  }

  const data: unknown = await res.json();
  if (!isHomeResponse(data)) {
    throw new InvalidResponseError('홈 응답 형식이 올바르지 않습니다.');
  }
  return data;
}
