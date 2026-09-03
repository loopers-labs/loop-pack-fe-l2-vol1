const BASE = 'http://localhost';

/**
 * 로그인 후 돌아갈 경로가 이 사이트 안을 가리키는지 본다.
 *
 * 화이트리스트가 아니라 형태 검사다. 보호 경로 목록과 무관하게 "상대경로인가"만 보므로
 * 아직 없는 경로도 통과한다 — 목록을 늘릴 때마다 여기를 고치지 않기 위한 선택이다.
 *
 * 앞의 세 줄(빈 값, 슬래시 두 개, 슬래시+역슬래시)은 마지막 origin 검사와 **중복이다.**
 * 하나씩 지워 봐도 테스트가 전부 통과한다(측정 확인). 프로토콜 상대 URL 은 origin 이
 * evil.com 이 되고, 역슬래시 위장은 WHATWG URL 이 special scheme 에서 역슬래시를
 * 슬래시로 정규화해 역시 origin 검사에 걸리기 때문이다.
 *
 * 그래도 남기는 이유는 URL 파서 동작이 바뀌었을 때를 대비한 심층 방어여서다.
 * 다만 이 세 줄은 지워도 회귀 신호가 없다 — 알고 두는 것이다.
 */
export function isSafeRedirect(value: string): boolean {
  if (!value) return false;
  if (!value.startsWith('/')) return false;
  if (value.startsWith('//')) return false;
  if (value.startsWith('/\\')) return false;

  try {
    return new URL(value, BASE).origin === BASE;
  } catch {
    return false;
  }
}
