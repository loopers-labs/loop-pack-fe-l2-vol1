import type { HomeResponse } from '@/_pages/home/model';
// eslint-disable-next-line boundaries/element-types -- app-data(mock 백엔드)는 서버 전용 함수라 여러 레이어에서 직접 참조 가능해야 함
import { getHomeData } from '@/app/api/_data/commerce';

export async function getHome(): Promise<HomeResponse> {
  const res = await fetch('/api/home');
  if (!res.ok) throw new Error('홈 데이터를 불러오지 못했습니다.');
  return res.json() as Promise<HomeResponse>;
}

export function getHomeServerData(): Promise<HomeResponse> {
  if (process.env.SIMULATE_METADATA_FAILURE === 'true') {
    return Promise.reject(new Error('홈 데이터 조회 실패 (시뮬레이션)'));
  }
  return Promise.resolve(getHomeData(null));
}