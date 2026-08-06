import type { HomeResponse } from '@/_pages/home/model';

export async function getHome(): Promise<HomeResponse> {
  const res = await fetch('/api/home');
  if (!res.ok) throw new Error('홈 데이터를 불러오지 못했습니다.');
  return res.json() as Promise<HomeResponse>;
}
