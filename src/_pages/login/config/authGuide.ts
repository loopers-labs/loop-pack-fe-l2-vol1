import type { AuthReason } from '@/shared/config/routes';

/**
 * 로그인 화면 상단 안내 문구.
 *
 * reason 값의 정의는 shared/config/routes 에 있다. proxy 와 401 인터셉터가 그 값을 붙이고
 * 이 화면이 읽으므로, 문구만 여기서 갖고 값 자체는 한 곳에서 정의한다.
 */
const REASON_MESSAGES: Record<AuthReason, string> = {
  required: '로그인이 필요한 페이지입니다.',
  expired: '세션이 만료되었습니다. 다시 로그인해주세요.',
};

function isAuthReason(value: string | undefined): value is AuthReason {
  return value === 'required' || value === 'expired';
}

/**
 * 안내할 문구가 있으면 그 문구를, 없으면 null 을 준다.
 *
 * 판정과 문구 조회를 한 함수로 둔다. 호출부의 관심사는 "안내할 문구가 있는가" 하나이고,
 * 유효성 판정만 따로 꺼내면 그것만으로는 쓸 데가 없다.
 *
 * reason 은 URL 에서 오므로 무엇이든 들어올 수 있다. 모르는 값에 문구를 지어내지 않는다 —
 * 그냥 로그인하러 온 사람에게 "세션이 만료되었습니다" 를 보여주면 없던 사건을 알리는 셈이다.
 */
export function resolveAuthGuide(reason: string | undefined): string | null {
  return isAuthReason(reason) ? REASON_MESSAGES[reason] : null;
}
