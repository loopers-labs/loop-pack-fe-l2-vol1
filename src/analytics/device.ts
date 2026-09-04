// 05-step2-design.md 질문 2 — device 판정. 화면 크기가 아니라 기기 종류를 재는 것이
// 목적이라 User-Agent로 분류한다(뷰포트 폭은 창 크기 변화로 다른 값이 되어 부적합).
export type Device = 'mobile' | 'tablet' | 'desktop' | null;

export function getDevice(): Device {
  if (typeof navigator === 'undefined') return null;

  const userAgent = navigator.userAgent;

  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(userAgent)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod/i.test(userAgent)) return 'mobile';
  if (/Mozilla|Chrome|Safari|Firefox|Edg/i.test(userAgent)) return 'desktop';

  return null;
}
