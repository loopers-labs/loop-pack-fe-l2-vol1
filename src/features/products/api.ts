import { apiClient } from '@/shared/api-client';
import type { HomeResponse } from '@/types/commerce';

export function getHome() {
  return apiClient<HomeResponse>('/api/home');
}
