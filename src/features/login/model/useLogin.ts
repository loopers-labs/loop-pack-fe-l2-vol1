import { useMutation } from '@tanstack/react-query';
import { login } from '@/entities/session';

// 로그인은 세션(서버 상태)을 바꾸는 행위라 mutation이다 (RFC D1).
// 성공 뒤의 이동은 화면(LoginForm)이 맡는다 — 어디로 갈지는 URL(`next`)이 정하기 때문이다.
export function useLogin() {
  return useMutation({ mutationFn: login });
}
