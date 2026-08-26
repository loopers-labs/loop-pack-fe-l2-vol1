import type { HomeResponse } from '@/_pages/home/model';
import type { MockApiScenario } from '@/shared/api';
// eslint-disable-next-line boundaries/element-types -- mock data-access 임시 예외: entities/server 영역으로 옮기고 server-only 경계 명시 후 제거
import { getHomeData, waitForMockApi } from '@/app/api/_data/commerce';

export async function getHome(): Promise<HomeResponse> {
  const res = await fetch('/api/home');
  if (!res.ok) throw new Error('홈 데이터를 불러오지 못했습니다.');
  return res.json() as Promise<HomeResponse>;
}

export async function getHomeServerData(scenario?: MockApiScenario | null): Promise<HomeResponse> {
  if (process.env.SIMULATE_METADATA_FAILURE === 'true') {
    throw new Error('홈 데이터 조회 실패 (시뮬레이션)');
  }
  if (scenario === 'error') {
    throw new Error('홈 데이터를 불러오지 못했습니다.');
  }
  if (scenario === 'slow') {
    await waitForMockApi(1_500);
  }
  return getHomeData(scenario ?? null);
}