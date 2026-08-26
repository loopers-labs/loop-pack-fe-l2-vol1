// [AI] getFailureReason 단위 테스트 (week-08 2단계, 항목 3).
// 에러 타입 → 메시지 매핑의 "분기 선택"을 고정한다 (week08-test-plan.md 섹션 2.2).
// 단언은 "어떤 분기를 탔는가"에 맞춘다.
// - ApiError 분기: 커스텀 메시지 추출로 검증 (UX 카피와 무관).
// - TypeError 분기: '네트워크' 키워드로 분기 의미를 잡는다 (카피 변경에 견딤).
// - 기본 분기: 안정적인 폴백 문구이므로 계약으로 한 번 직접 단언한다.
// DOM·네트워크 없이 검증하는 순수 로직이므로 .ts 확장자로 node 환경에서 돌린다.
import { describe, it, expect } from 'vitest';
import { getFailureReason } from './getFailureReason';
import { ApiError } from '@/shared/api/fetcher';

describe('getFailureReason', () => {
  it('ApiError면 그 인스턴스의 message를 그대로 반환한다', () => {
    expect(getFailureReason(new ApiError('서버가 내린 메시지', 500))).toBe('서버가 내린 메시지');
  });

  it('ApiError의 status(4xx/5xx)와 무관하게 message를 추출한다', () => {
    expect(getFailureReason(new ApiError('클라이언트 오류', 400))).toBe('클라이언트 오류');
    expect(getFailureReason(new ApiError('서버 오류', 500))).toBe('서버 오류');
  });

  it('빈 message의 ApiError도 추출한 message(빈 문자열)를 그대로 반환한다', () => {
    expect(getFailureReason(new ApiError('', 500))).toBe('');
  });

  it('TypeError면 네트워크 안내로 분기한다', () => {
    expect(getFailureReason(new TypeError('Failed to fetch'))).toContain('네트워크');
  });

  it('그 외 에러는 기본 안내로 떨어진다', () => {
    expect(getFailureReason(new Error('알 수 없는 원인'))).toBe('상품을 불러오지 못했습니다.');
  });

  it('세 분기는 서로 다른 결과를 낸다', () => {
    const apiResult = getFailureReason(new ApiError('api 메시지', 500));
    const typeResult = getFailureReason(new TypeError());
    const defaultResult = getFailureReason(new Error('기타'));
    expect(apiResult).not.toBe(typeResult);
    expect(apiResult).not.toBe(defaultResult);
    expect(typeResult).not.toBe(defaultResult);
  });
});
